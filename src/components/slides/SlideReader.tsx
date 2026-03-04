import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Bookmark, PenLine, Flame, Target, CheckCircle2, Clock, Zap, Volume2, VolumeX, Loader2 as LoaderIcon } from "lucide-react";
import { ConfettiBurst } from "../ui/ConfettiBurst";
import { Button } from "../ui/button";
import { MentorAvatar } from "../ai/MentorAvatar";
import { MentorChatOverlay } from "../ai/MentorChatOverlay";
import { MentorTipBubble } from "../ai/MentorTipBubble";
import { SlideIntroCard } from "./SlideIntroCard";
import { SlideContentCard } from "./SlideContentCard";
import { mentors, Mentor, getMentorForContext } from "@/data/mentors";
import { getTipForSlide, MentorTip, resetTipSession } from "@/data/mentorTips";
import { cn } from "@/lib/utils";
import { XP_REWARDS } from "@/hooks/useUserXP";
import { useNarration } from "@/hooks/useNarration";

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

// Minimum time required (in seconds) to complete a lesson for XP
const MINIMUM_LESSON_TIME_SECONDS = 180; // 3 minutes

interface SlideReaderProps {
  stackTitle: string;
  stackType: StackType;
  slides: Slide[];
  onClose: () => void;
  onComplete: (isReview: boolean, timeSpentSeconds: number) => void;
  onSaveInsight: (slideNumber: number) => void;
  onAddNote: (slideNumber: number) => void;
  marketId?: string;
  marketName?: string;
  dayNumber?: number;
  isReview?: boolean; // If true, user is reviewing a completed lesson
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
  marketId,
  marketName,
  dayNumber,
  isReview = false,
}: SlideReaderProps) {
  const [currentIndex, setCurrentIndex] = useState(-1); // Start at -1 for intro slide
  const [direction, setDirection] = useState(0);
  const [narrationEnabled, setNarrationEnabled] = useState(false);
  
  // Narration — uses mentor voice
  const contextMentor = getMentorForContext(stackTitle, marketId);
  const { speak, stop: stopNarration, isPlaying, isLoading: narrationLoading } = useNarration({
    voiceId: contextMentor.voiceId,
    enabled: narrationEnabled,
  });

  // Reset tip session when component mounts (new lesson)
  useEffect(() => {
    resetTipSession();
    return () => { stopNarration(); };
  }, []);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  const [currentTip, setCurrentTip] = useState<MentorTip | null>(null);
  const [tipDismissed, setTipDismissed] = useState(false);
  const [shownTipIds] = useState<Set<string>>(new Set());
  const [showArrows, setShowArrows] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  
  // Time tracking
  const [startTime] = useState(() => Date.now());
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  
  // Update time spent every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpentSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  
  // Check if minimum time reached for lesson completion
  const hasMetMinimumTime = timeSpentSeconds >= MINIMUM_LESSON_TIME_SECONDS;
  const remainingSeconds = Math.max(0, MINIMUM_LESSON_TIME_SECONDS - timeSpentSeconds);
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingSecondsDisplay = remainingSeconds % 60;
  
  const isIntroSlide = currentIndex === -1;
  const currentSlide = isIntroSlide ? null : slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  // Hide arrows when AI mentor or tip is visible
  useEffect(() => {
    setShowArrows(!activeMentor && !currentTip);
  }, [activeMentor, currentTip]);

  // Auto-narrate on slide change
  useEffect(() => {
    if (!narrationEnabled || isIntroSlide || !currentSlide) return;
    const textToRead = [currentSlide.title, currentSlide.body].filter(Boolean).join('. ');
    speak(textToRead);
  }, [currentIndex, narrationEnabled]);

  // Stop narration when toggled off
  useEffect(() => {
    if (!narrationEnabled) stopNarration();
  }, [narrationEnabled]);

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
    <div className="fixed inset-0 z-[100] bg-background flex flex-col overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={onClose} className="p-2 -ml-2">
          <X size={24} className="text-text-secondary" />
        </button>
        
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2">
            <span className={`chip text-caption ${typeColors[stackType]}`}>
              {stackType}
            </span>
            <span className="text-caption text-text-muted">
              {Math.max(currentIndex + 1, 0)}/{slides.length}
            </span>
          </div>
          {dayNumber && (
            <span className="text-[10px] text-text-muted font-medium">
              Day {dayNumber} of 180
            </span>
          )}
        </div>
        
        {/* Narration toggle + Mentor Helper */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNarrationEnabled(!narrationEnabled)}
            className={cn(
              "p-2 rounded-full transition-colors",
              narrationEnabled ? "bg-primary/10 text-primary" : "text-text-muted hover:text-text-secondary"
            )}
          >
            {narrationLoading ? (
              <LoaderIcon size={18} className="animate-spin" />
            ) : narrationEnabled ? (
              <Volume2 size={18} />
            ) : (
              <VolumeX size={18} />
            )}
          </button>
          <MentorAvatar
            mentor={contextMentor}
            size="sm"
            showPulse={false}
            onClick={() => setActiveMentor(contextMentor)}
          />
        </div>
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

      {/* Slide Content - Scrollable area with proper padding */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
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
            className="absolute inset-0 flex flex-col overflow-y-auto px-4 pb-8"
          >
            {isIntroSlide ? (
              /* Intro Slide with Market-Specific Gradient */
              <SlideIntroCard
                stackTitle={stackTitle}
                stackType={stackType}
                totalSlides={slides.length}
                marketId={marketId}
                marketName={marketName}
                dayNumber={dayNumber}
                slideTitles={slides.map(s => s.title)}
              />
            ) : (
              /* Regular Slide with Mascot Guide */
              <SlideContentCard
                title={currentSlide?.title || ""}
                body={currentSlide?.body || ""}
                sources={currentSlide?.sources || []}
                slideIndex={currentIndex}
                totalSlides={slides.length}
                stackTitle={stackTitle}
                marketId={marketId}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows - Positioned at bottom corners, smaller and less intrusive */}
      <AnimatePresence>
        {showArrows && !isIntroSlide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-32 left-4 right-4 flex justify-between pointer-events-none z-20"
          >
            <button
              onClick={goToPrev}
              disabled={currentIndex <= 0}
              className={cn(
                "p-2 rounded-full bg-bg-2/80 backdrop-blur-sm pointer-events-auto transition-all",
                "border border-border/50 shadow-md",
                currentIndex <= 0 ? "opacity-0 pointer-events-none" : "opacity-70 hover:opacity-100 hover:bg-bg-1"
              )}
            >
              <ChevronLeft size={16} className="text-text-muted" />
            </button>
            <button
              onClick={goToNext}
              disabled={isLastSlide}
              className={cn(
                "p-2 rounded-full bg-bg-2/80 backdrop-blur-sm pointer-events-auto transition-all",
                "border border-border/50 shadow-md",
                isLastSlide ? "opacity-0 pointer-events-none" : "opacity-70 hover:opacity-100 hover:bg-bg-1"
              )}
            >
              <ChevronRight size={16} className="text-text-muted" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Actions - Fixed with modal-safe padding for iOS */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-border bg-bg-0 modal-bottom-safe">
        {isIntroSlide ? (
          <Button variant="cta" size="full" onClick={goToNext}>
            Begin
          </Button>
        ) : isLastSlide ? (
          <div className="space-y-2">
            {/* Note/Save buttons available on last slide too */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="default"
                className="flex-1 h-10"
                onClick={() => currentSlide && onAddNote(currentSlide.slideNumber)}
              >
                <PenLine size={14} />
                <span className="text-xs">Note</span>
              </Button>
              <Button
                variant="secondary"
                size="default"
                className="flex-1 h-10"
                onClick={() => currentSlide && onSaveInsight(currentSlide.slideNumber)}
              >
                <Bookmark size={14} />
                <span className="text-xs">Save</span>
              </Button>
            </div>
            <Button variant="cta" size="full" onClick={() => setShowCompletion(true)}>
              <CheckCircle2 size={18} />
              Complete Stack
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="default"
              className="flex-1 h-11"
              onClick={() => currentSlide && onAddNote(currentSlide.slideNumber)}
            >
              <PenLine size={16} />
              <span className="text-sm">Note</span>
            </Button>
            <Button
              variant="secondary"
              size="default"
              className="flex-1 h-11"
              onClick={() => currentSlide && onSaveInsight(currentSlide.slideNumber)}
            >
              <Bookmark size={16} />
              <span className="text-sm">Save</span>
            </Button>
          </div>
        )}
      </div>

      {/* Completion Celebration Modal with Mentor */}
      <AnimatePresence>
        {showCompletion && (
          <>
            <ConfettiBurst show={showCompletion && hasMetMinimumTime && !isReview} count={30} />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex items-center justify-center p-6"
            >

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="w-full mx-4 bg-bg-2 rounded-2xl p-8 border border-border text-center relative"
            >
              {/* Mentor Avatar with jump animation */}
              <motion.div
                animate={{
                  y: [0, -12, 0, -8, 0],
                }}
                transition={{
                  duration: 0.8,
                  times: [0, 0.3, 0.5, 0.7, 1],
                  ease: "easeOut",
                }}
                className="relative -mt-14 mb-2"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, -5, 5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    duration: 0.6,
                    delay: 0.2,
                  }}
                  className="relative inline-block"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/40 to-primary/40 rounded-full blur-xl" />
                  <img
                    src={contextMentor.avatar}
                    alt={contextMentor.name}
                    className="w-24 h-24 rounded-full border-4 border-bg-2 object-cover object-[50%_30%] relative z-10 shadow-xl"
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center z-20 shadow-lg"
                  >
                    <Flame size={16} className="text-white" />
                  </motion.div>
                </motion.div>
              </motion.div>

              <p className="text-caption text-accent font-medium mb-1">{contextMentor.name}</p>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {isReview ? (
                  <>
                    <h2 className="text-h2 text-text-primary mb-2">
                      Great review session! 📖
                    </h2>
                    <p className="text-body text-text-secondary mb-1">
                      Reviewing helps solidify your knowledge.
                    </p>
                    <p className="text-caption text-text-muted mb-6">
                      No XP on review, but you're reinforcing what you learned!
                    </p>
                  </>
                ) : !hasMetMinimumTime ? (
                  <>
                    <h2 className="text-h2 text-text-primary mb-2">
                      Take your time! ⏱️
                    </h2>
                    <p className="text-body text-text-secondary mb-1">
                      Spend at least 3 minutes to complete this lesson.
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <Clock size={16} className="text-amber-400" />
                      <span className="text-body font-bold text-amber-400">
                        {remainingMinutes}:{remainingSecondsDisplay.toString().padStart(2, '0')} remaining
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-h2 text-text-primary mb-2">
                      {contextMentor.expressions?.celebrating?.[Math.floor(Math.random() * (contextMentor.expressions.celebrating.length))] || "You're on fire! 🔥"}
                    </h2>
                    <p className="text-body text-text-secondary mb-1">
                      Lesson complete! Your streak is building.
                    </p>
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-caption text-emerald-400 font-semibold">+{XP_REWARDS.LESSON_COMPLETE} XP earned</span>
                    </div>
                    <p className="text-caption text-text-muted mb-6">
                      Done learning for the day? Try some drills to reinforce what you've learned.
                    </p>
                  </>
                )}
              </motion.div>
              
              <div className="space-y-3">
                {/* If minimum time not met and not review, show "Keep Reading" to go back */}
                {!isReview && !hasMetMinimumTime ? (
                  <Button 
                    variant="secondary" 
                    size="full"
                    onClick={() => setShowCompletion(false)}
                  >
                    <Clock size={18} />
                    Keep Reading
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="cta" 
                      size="full"
                      onClick={() => onComplete(isReview, timeSpentSeconds)}
                    >
                      <Flame size={18} />
                      Continue
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="full"
                      onClick={() => onComplete(isReview, timeSpentSeconds)}
                      className="gap-2"
                    >
                      <Target size={18} />
                      Practice with Drills
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Proactive Mentor Tip Bubble - With minimize option */}
      {currentTip && !tipDismissed && (
        <MentorTipBubble
          mentor={mentors.find((m) => m.id === currentTip.mentorId)!}
          tip={currentTip.tip}
          onDismiss={() => {
            setTipDismissed(true);
            setCurrentTip(null);
          }}
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
        marketId={marketId}
      />
    </div>
  );
}
