import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Bookmark, PenLine, Flame, Target, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { MentorAvatar } from "../ai/MentorAvatar";
import { MentorChatOverlay } from "../ai/MentorChatOverlay";
import { MentorTipBubble } from "../ai/MentorTipBubble";
import { SlideIntroCard } from "./SlideIntroCard";
import { SlideContentCard } from "./SlideContentCard";
import { mentors, Mentor, getMentorForContext } from "@/data/mentors";
import { getTipForSlide, MentorTip } from "@/data/mentorTips";
import { cn } from "@/lib/utils";

// Themed mascot illustrations based on content keywords
import rocketLaunch from "@/assets/slides/rocket-launch.jpg";
import satelliteOps from "@/assets/slides/satellite-ops.jpg";
import spaceStartup from "@/assets/slides/space-startup.jpg";
import lunarHabitat from "@/assets/slides/lunar-habitat.jpg";
import evtolVertiport from "@/assets/slides/evtol-vertiport.jpg";
import spacePharma from "@/assets/slides/space-pharma.jpg";
import safRefinery from "@/assets/slides/saf-refinery.jpg";
import vcPitch from "@/assets/slides/vc-pitch.jpg";
import controlTower from "@/assets/slides/control-tower.jpg";
import spaceCenter from "@/assets/slides/space-center.jpg";
import defenseFacility from "@/assets/slides/defense-facility.jpg";
import aerospaceFoundations from "@/assets/slides/aerospace-foundations.jpg";
import certification from "@/assets/slides/certification.jpg";
import supplyChain from "@/assets/slides/supply-chain.jpg";
import startupMeeting from "@/assets/slides/startup-meeting.jpg";
import investorPitch from "@/assets/slides/investor-pitch.jpg";
// New Month 5-6 illustrations
import evtolBoarding from "@/assets/slides/evtol-boarding.jpg";
import safProduction from "@/assets/slides/saf-production.jpg";
import hydrogenPropulsion from "@/assets/slides/hydrogen-propulsion.jpg";
import boardroomPitch from "@/assets/slides/boardroom-pitch.jpg";
import fundingSuccess from "@/assets/slides/funding-success.jpg";
import itarCompliance from "@/assets/slides/itar-compliance.jpg";
import urbanAir from "@/assets/slides/urban-air.jpg";
import cockpitTech from "@/assets/slides/cockpit-tech.jpg";

// Map themes to illustrations with broader keyword matching
const themeIllustrations: { keywords: string[]; image: string }[] = [
  // Month 5-6 emerging tech & business themes (prioritized)
  { keywords: ["evtol", "air taxi", "vtol", "vertiport", "urban air", "uam"], image: evtolBoarding },
  { keywords: ["saf", "sustainable fuel", "biofuel", "carbon neutral", "green fuel"], image: safProduction },
  { keywords: ["hydrogen", "fuel cell", "h2", "green propulsion", "electric"], image: hydrogenPropulsion },
  { keywords: ["boardroom", "board meeting", "investor", "vc", "fundrais", "venture"], image: boardroomPitch },
  { keywords: ["sbir", "sttr", "grant", "funding", "series a", "series b", "seed"], image: fundingSuccess },
  { keywords: ["itar", "export", "compliance", "regulation", "dod", "ear"], image: itarCompliance },
  // Existing themes
  { keywords: ["launch", "rocket", "spacex", "falcon", "propulsion"], image: rocketLaunch },
  { keywords: ["satellite", "orbit", "constellation", "starlink", "leo"], image: satelliteOps },
  { keywords: ["lunar", "moon", "habitat", "station", "iss", "artemis"], image: lunarHabitat },
  { keywords: ["space pharma", "microgravity", "biolab", "manufacturing", "ispece"], image: spacePharma },
  { keywords: ["control", "tower", "atc", "traffic", "airspace"], image: controlTower },
  { keywords: ["defense", "military", "government", "prime", "dod", "contract"], image: defenseFacility },
  { keywords: ["faa", "certification", "type certificate", "tc", "easa", "part 25"], image: certification },
  { keywords: ["supply", "chain", "oem", "tier", "supplier", "tiered"], image: supplyChain },
  { keywords: ["startup", "team", "founding", "co-founder", "entrepreneur"], image: startupMeeting },
  { keywords: ["pitch", "m&a", "acquisition", "exit", "ipo", "deal"], image: investorPitch },
  { keywords: ["foundation", "basic", "intro", "overview", "fundamentals"], image: aerospaceFoundations },
  { keywords: ["space", "center", "nasa", "esa", "agency"], image: spaceCenter },
  { keywords: ["cockpit", "avionics", "flight deck", "pilot"], image: cockpitTech },
  { keywords: ["urban", "city", "mobility", "vertiport"], image: urbanAir },
];

// Get illustration based on stack title/content - always returns an image
function getThemeIllustration(stackTitle: string, stackType: string): string {
  const searchText = `${stackTitle} ${stackType}`.toLowerCase();
  
  for (const theme of themeIllustrations) {
    if (theme.keywords.some(keyword => searchText.includes(keyword))) {
      return theme.image;
    }
  }
  
  // Default images based on stack type - always return something
  if (stackType === "LESSON") return aerospaceFoundations;
  if (stackType === "NEWS") return controlTower;
  if (stackType === "HISTORY") return spaceCenter;
  
  return spaceStartup;
}

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
  const [tipDismissed, setTipDismissed] = useState(false);
  const [shownTipIds] = useState<Set<string>>(new Set());
  const [showArrows, setShowArrows] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  
  const isIntroSlide = currentIndex === -1;
  const currentSlide = isIntroSlide ? null : slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;
  const contextMentor = getMentorForContext(stackTitle);
  
  // Get themed illustration based on stack content - always returns an image
  const themeImage = useMemo(() => getThemeIllustration(stackTitle, stackType), [stackTitle, stackType]);

  // Hide arrows when AI mentor or tip is visible
  useEffect(() => {
    setShowArrows(!activeMentor && !currentTip);
  }, [activeMentor, currentTip]);

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
              /* Intro Slide with Mascot & Hero Image */
              <SlideIntroCard
                stackTitle={stackTitle}
                stackType={stackType}
                themeImage={themeImage}
                totalSlides={slides.length}
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

      {/* Bottom Actions - Fixed with generous padding for mobile */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-border bg-bg-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 24px) + 24px)' }}>
        {isIntroSlide ? (
          <Button variant="cta" size="full" onClick={goToNext}>
            Begin
          </Button>
        ) : isLastSlide ? (
          <Button variant="cta" size="full" onClick={() => setShowCompletion(true)}>
            <CheckCircle2 size={18} />
            Complete Stack
          </Button>
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

      {/* Completion Celebration Modal */}
      <AnimatePresence>
        {showCompletion && (
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
              className="w-full max-w-sm bg-bg-2 rounded-2xl p-6 border border-border text-center"
            >
              {/* Flame animation */}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center"
              >
                <Flame size={40} className="text-orange-500 streak-flame" />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-h2 text-text-primary mb-2">You're on fire! 🔥</h2>
                <p className="text-body text-text-secondary mb-1">
                  Lesson complete! Your streak is building.
                </p>
                <p className="text-caption text-text-muted mb-6">
                  Done learning for the day? Try some drills to reinforce what you've learned.
                </p>
              </motion.div>
              
              <div className="space-y-3">
                <Button 
                  variant="cta" 
                  size="full"
                  onClick={onComplete}
                >
                  <Flame size={18} />
                  Continue
                </Button>
                <Button 
                  variant="secondary" 
                  size="full"
                  onClick={() => {
                    onComplete();
                  }}
                  className="gap-2"
                >
                  <Target size={18} />
                  Practice with Drills
                </Button>
              </div>
            </motion.div>
          </motion.div>
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
      />
    </div>
  );
}
