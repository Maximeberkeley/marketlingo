import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Bookmark, PenLine, ExternalLink, MessageCircle, BookOpen, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { MentorAvatar } from "../ai/MentorAvatar";
import { MentorChatOverlay } from "../ai/MentorChatOverlay";
import { MentorTipBubble } from "../ai/MentorTipBubble";
import { mentors, Mentor, getMentorForContext } from "@/data/mentors";
import { getTipForSlide, MentorTip } from "@/data/mentorTips";
import { cn } from "@/lib/utils";

interface Source {
  label: string;
  url: string;
}

interface Slide {
  slideNumber: number;
  title: string;
  body: string;
  sources: Source[];
}

type StackType = "NEWS" | "HISTORY" | "LESSON";

// Intro slide data for each type
const introContent: Record<StackType, { icon: React.ReactNode; tagline: string; color: string }> = {
  NEWS: { 
    icon: <TrendingUp className="w-6 h-6" />, 
    tagline: "Recognize recurring market forces",
    color: "from-blue-500 to-cyan-400"
  },
  LESSON: { 
    icon: <BookOpen className="w-6 h-6" />, 
    tagline: "5-minute concept deep dive",
    color: "from-emerald-500 to-teal-400"
  },
  HISTORY: { 
    icon: <Sparkles className="w-6 h-6" />, 
    tagline: "Key moments that shaped the industry",
    color: "from-amber-500 to-orange-400"
  }
};

interface SlideReaderProps {
  stackTitle: string;
  stackType: StackType;
  slides: Slide[];
  onClose: () => void;
  onComplete: () => void;
  onSaveInsight: (slideNumber: number) => void;
  onAddNote: (slideNumber: number) => void;
}

const SWIPE_THRESHOLD = 50;

export function SlideReader({
  stackTitle,
  stackType,
  slides,
  onClose,
  onComplete,
  onSaveInsight,
  onAddNote,
}: SlideReaderProps) {
  const [currentIndex, setCurrentIndex] = useState(-1); // Start at -1 for intro slide
  const [direction, setDirection] = useState(0);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  const [currentTip, setCurrentTip] = useState<MentorTip | null>(null);
  const [shownTipIds] = useState<Set<string>>(new Set());
  
  const isIntroSlide = currentIndex === -1;
  const currentSlide = isIntroSlide ? null : slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;
  const contextMentor = getMentorForContext(stackTitle);
  const intro = introContent[stackType];

  // Proactive tip system
  useEffect(() => {
    // Don't show tips on intro or if chat is open
    if (activeMentor || isIntroSlide) {
      setCurrentTip(null);
      return;
    }

    // Check for tip after a short delay on each slide
    const timer = setTimeout(() => {
      const tip = getTipForSlide(currentIndex, slides.length, shownTipIds);
      if (tip) {
        shownTipIds.add(tip.id);
        setCurrentTip(tip);
      }
    }, 2000); // Show tip 2s after landing on slide

    return () => clearTimeout(timer);
  }, [currentIndex, slides.length, activeMentor, shownTipIds, isIntroSlide]);
  
  const goToNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, slides.length]);
  
  const goToPrev = useCallback(() => {
    if (currentIndex > -1) { // Can go back to intro
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD && currentIndex < slides.length - 1) {
      goToNext();
    } else if (info.offset.x > SWIPE_THRESHOLD && currentIndex > 0) {
      goToPrev();
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  const typeColors: Record<StackType, string> = {
    NEWS: "bg-blue-500/20 text-blue-400",
    HISTORY: "bg-amber-500/20 text-amber-400",
    LESSON: "bg-green-500/20 text-green-400",
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <button onClick={onClose} className="p-2 -ml-2">
          <X size={24} className="text-text-secondary" />
        </button>
        
        <div className="flex items-center gap-3">
          <span className={`chip text-caption ${typeColors[stackType]}`}>
            {stackType}
          </span>
          <span className="text-caption text-text-muted">
            {currentIndex + 1}/{slides.length}
          </span>
        </div>
        
        {/* Mentor Helper Button */}
        <MentorAvatar
          mentor={contextMentor}
          size="sm"
          showPulse={false}
          onClick={() => setActiveMentor(contextMentor)}
        />
      </div>
      
      {/* Progress - shows intro + all slides */}
      <div className="flex gap-1 px-4 py-3">
        {/* Intro dot */}
        <div
          className={`h-1 w-4 rounded-full transition-colors ${
            currentIndex >= -1 ? "bg-primary" : "bg-bg-1"
          }`}
        />
        {slides.map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors ${
              index <= currentIndex ? "bg-primary" : "bg-bg-1"
            }`}
          />
        ))}
      </div>

      {/* Stack Title */}
      <h2 className="text-h2 text-text-primary px-4 mb-4">{stackTitle}</h2>

      {/* Slide Content */}
      <div className="flex-1 overflow-hidden relative px-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.22 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex flex-col overflow-y-auto"
          >
            {isIntroSlide ? (
              /* Intro Slide */
              <div className={cn(
                "card-elevated flex-1 flex flex-col items-center justify-center text-center min-h-full",
                "bg-gradient-to-br",
                intro.color,
                "border-0"
              )}>
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 text-white">
                  {intro.icon}
                </div>
                <p className="text-white/80 text-caption font-medium mb-2">{stackType}</p>
                <h3 className="text-h2 text-white mb-2">{stackTitle}</h3>
                <p className="text-white/90 text-body max-w-xs">{intro.tagline}</p>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 flex items-center gap-2 text-white/70 text-caption"
                >
                  <span>Swipe to start</span>
                  <ChevronRight className="w-4 h-4 animate-pulse" />
                </motion.div>
              </div>
            ) : (
              /* Regular Slide */
              <div className="card-elevated flex flex-col pb-4">
                <h3 className="text-h3 text-text-primary mb-3">{currentSlide?.title}</h3>
                <p className="text-body text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {currentSlide?.body}
                </p>
                
                {/* Sources */}
                {currentSlide && currentSlide.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-2">
                      {currentSlide.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="chip inline-flex items-center gap-1.5 hover:border-primary transition-colors"
                        >
                          <span>{source.label}</span>
                          <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
        <button
          onClick={goToPrev}
          disabled={currentIndex === -1}
          className={`p-2 rounded-full bg-bg-1/80 backdrop-blur-sm pointer-events-auto transition-opacity ${
            currentIndex === -1 ? "opacity-0" : "opacity-100"
          }`}
        >
          <ChevronLeft size={20} className="text-text-secondary" />
        </button>
        <button
          onClick={goToNext}
          disabled={isLastSlide}
          className={`p-2 rounded-full bg-bg-1/80 backdrop-blur-sm pointer-events-auto transition-opacity ${
            isLastSlide ? "opacity-0" : "opacity-100"
          }`}
        >
          <ChevronRight size={20} className="text-text-secondary" />
        </button>
      </div>

      {/* Bottom Actions */}
      <div className="px-4 py-4 border-t border-border bg-bg-0">
        {isIntroSlide ? (
          <Button variant="cta" size="full" onClick={goToNext}>
            Begin
          </Button>
        ) : isLastSlide ? (
          <Button variant="cta" size="full" onClick={onComplete}>
            Complete Stack
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="default"
              className="flex-1"
              onClick={() => currentSlide && onAddNote(currentSlide.slideNumber)}
            >
              <PenLine size={18} />
              Add note
            </Button>
            <Button
              variant="secondary"
              size="default"
              className="flex-1"
              onClick={() => currentSlide && onSaveInsight(currentSlide.slideNumber)}
            >
              <Bookmark size={18} />
              Save insight
            </Button>
          </div>
        )}
      </div>

      {/* Proactive Mentor Tip Bubble */}
      {currentTip && (
        <MentorTipBubble
          mentor={mentors.find((m) => m.id === currentTip.mentorId)!}
          tip={currentTip.tip}
          onDismiss={() => setCurrentTip(null)}
          onTap={() => {
            const tipMentor = mentors.find((m) => m.id === currentTip.mentorId);
            if (tipMentor) {
              setCurrentTip(null);
              setActiveMentor(tipMentor);
            }
          }}
          position="bottom-left"
          delay={300}
        />
      )}

      {/* Mentor Chat Overlay */}
      <MentorChatOverlay
        mentor={activeMentor}
        onClose={() => setActiveMentor(null)}
        context={`${stackTitle}: ${currentSlide?.title || 'Introduction'} - ${currentSlide?.body || 'Getting started'}`}
      />
    </div>
  );
}
