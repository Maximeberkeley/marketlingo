import { useState, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Bookmark, PenLine, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  
  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;
  
  const goToNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, slides.length]);
  
  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
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
        
        <div className="w-10" /> {/* Spacer for centering */}
      </div>
      
      {/* Progress */}
      <div className="flex gap-1 px-4 py-3">
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
            className="absolute inset-0 flex flex-col"
          >
            <div className="card-elevated flex-1 flex flex-col">
              <h3 className="text-h3 text-text-primary mb-3">{currentSlide.title}</h3>
              <p className="text-body text-text-secondary flex-1 leading-relaxed">
                {currentSlide.body}
              </p>
              
              {/* Sources */}
              {currentSlide.sources.length > 0 && (
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
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className={`p-2 rounded-full bg-bg-1/80 backdrop-blur-sm pointer-events-auto transition-opacity ${
            currentIndex === 0 ? "opacity-0" : "opacity-100"
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
        {isLastSlide ? (
          <Button variant="cta" size="full" onClick={onComplete}>
            Complete Stack
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="default"
              className="flex-1"
              onClick={() => onAddNote(currentSlide.slideNumber)}
            >
              <PenLine size={18} />
              Add note
            </Button>
            <Button
              variant="secondary"
              size="default"
              className="flex-1"
              onClick={() => onSaveInsight(currentSlide.slideNumber)}
            >
              <Bookmark size={18} />
              Save insight
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
