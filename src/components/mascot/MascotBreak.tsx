import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { mentors, Mentor } from "@/data/mentors";
import leoSticker from "@/assets/leo-sticker.png";

// ============================================
// MASCOT BREAK - Full-body "mental break" interstitials
// Appears at key moments: lesson start, middle, end
// Alternates randomly between Leo and AI mentors
// ============================================

export type MascotBreakType = 
  | "intro"      // Beginning of lesson/activity
  | "midpoint"   // Middle checkpoint
  | "complete"   // End celebration
  | "encourage"  // Encouragement during struggle
  | "tip";       // Quick tip/insight

export interface MascotCharacter {
  id: string;
  name: string;
  avatar: string;
  isLeo?: boolean;
}

interface MascotBreakProps {
  type: MascotBreakType;
  message?: string;
  characterId?: string; // Force specific character, or random if not provided
  marketId?: string;
  slideIndex?: number;
  totalSlides?: number;
  onDismiss?: () => void;
  autoDismissMs?: number;
  className?: string;
}

// All available characters including Leo
const getAllCharacters = (): MascotCharacter[] => {
  const mentorCharacters = mentors.map(m => ({
    id: m.id,
    name: m.name.split(" ")[0],
    avatar: m.avatar,
    isLeo: false,
  }));
  
  return [
    { id: "leo", name: "Leo", avatar: leoSticker, isLeo: true },
    ...mentorCharacters,
  ];
};

// Get random character, with option to weight based on market
export const getRandomCharacter = (marketId?: string): MascotCharacter => {
  const characters = getAllCharacters();
  
  // Slightly weight Leo higher (appears ~30% of time)
  const weightedChars = [
    ...characters,
    characters[0], // Extra Leo
    characters[0], // Extra Leo
  ];
  
  // If neuroscience market, weight Sophia higher
  if (marketId === "neuroscience") {
    const sophia = characters.find(c => c.id === "sophia");
    if (sophia) weightedChars.push(sophia, sophia);
  }
  
  return weightedChars[Math.floor(Math.random() * weightedChars.length)];
};

// Default messages per type and character
const getDefaultMessage = (type: MascotBreakType, charName: string, slideIndex?: number, totalSlides?: number): string => {
  const isLeo = charName === "Leo";
  
  switch (type) {
    case "intro":
      return isLeo 
        ? "Let's dive in together! 🚀"
        : `I'll guide you through this one. Ready?`;
    case "midpoint":
      const progress = slideIndex && totalSlides 
        ? `${Math.round((slideIndex / totalSlides) * 100)}%`
        : "halfway";
      return isLeo
        ? `You're ${progress} there! Keep it up! 💪`
        : `Great progress! ${progress} complete.`;
    case "complete":
      return isLeo
        ? "You crushed it! 🎉"
        : "Amazing work! You should be proud.";
    case "encourage":
      return isLeo
        ? "You've got this! Don't give up!"
        : "Keep pushing—you're learning!";
    case "tip":
      return isLeo
        ? "Pro tip incoming! 💡"
        : "Here's something to remember...";
    default:
      return "Hey there! 👋";
  }
};

// Animation variants for the mascot entrance
const mascotVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8, 
    y: 30,
  },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    y: -20,
    transition: { duration: 0.2 },
  },
};

const bubbleVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { delay: 0.3, type: "spring", stiffness: 400 },
  },
  exit: { opacity: 0, scale: 0.8 },
};

export function MascotBreak({
  type,
  message,
  characterId,
  marketId,
  slideIndex,
  totalSlides,
  onDismiss,
  autoDismissMs,
  className,
}: MascotBreakProps) {
  const [dismissed, setDismissed] = useState(false);
  
  // Pick character once on mount (memoized to prevent changes)
  const character = useMemo(() => {
    if (characterId) {
      const found = getAllCharacters().find(c => c.id === characterId);
      if (found) return found;
    }
    return getRandomCharacter(marketId);
  }, [characterId, marketId]);
  
  const displayMessage = message || getDefaultMessage(type, character.name, slideIndex, totalSlides);
  
  // Auto-dismiss timer
  useMemo(() => {
    if (autoDismissMs && autoDismissMs > 0) {
      const timer = setTimeout(() => {
        setDismissed(true);
        onDismiss?.();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, onDismiss]);
  
  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };
  
  if (dismissed) return null;
  
  // Background colors based on type
  const bgColors: Record<MascotBreakType, string> = {
    intro: "from-primary/20 via-primary/10 to-transparent",
    midpoint: "from-amber-500/20 via-amber-500/10 to-transparent",
    complete: "from-green-500/20 via-green-500/10 to-transparent",
    encourage: "from-blue-500/20 via-blue-500/10 to-transparent",
    tip: "from-purple-500/20 via-purple-500/10 to-transparent",
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        variants={mascotVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onDismiss ? handleDismiss : undefined}
        className={cn(
          "relative flex flex-col items-center justify-center py-8 px-6",
          "bg-gradient-to-b rounded-2xl",
          bgColors[type],
          onDismiss && "cursor-pointer",
          className
        )}
      >
        {/* Sparkle effects for celebrations */}
        {type === "complete" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-yellow-400"
                initial={{ 
                  opacity: 0,
                  x: "50%",
                  y: "50%",
                  scale: 0,
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  x: `${20 + Math.random() * 60}%`,
                  y: `${10 + Math.random() * 80}%`,
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.15,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />
            ))}
          </div>
        )}
        
        {/* Character - Full body display */}
        <motion.div
          className="relative"
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <img
            src={character.avatar}
            alt={character.name}
            className={cn(
              "object-contain drop-shadow-xl",
              character.isLeo 
                ? "w-28 h-28" // Leo sticker is square
                : "w-24 h-24 rounded-full border-3 border-white/20" // Mentors are circular
            )}
          />
          
          {/* Glow effect */}
          <div 
            className={cn(
              "absolute inset-0 -z-10 blur-xl opacity-40",
              type === "complete" ? "bg-green-500" : "bg-primary"
            )} 
          />
        </motion.div>
        
        {/* Name badge */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-caption font-semibold text-text-primary"
        >
          {character.name}
        </motion.span>
        
        {/* Speech bubble */}
        <motion.div
          variants={bubbleVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="mt-4 px-5 py-3 bg-bg-2 rounded-2xl border border-border shadow-lg max-w-[280px] relative"
        >
          {/* Bubble pointer */}
          <div className="absolute left-1/2 -top-2 -translate-x-1/2 w-4 h-4 bg-bg-2 border-l border-t border-border rotate-45" />
          
          <p className="text-body text-text-primary text-center leading-relaxed relative z-10">
            {displayMessage}
          </p>
        </motion.div>
        
        {/* Tap to continue hint */}
        {onDismiss && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1 }}
            className="mt-4 text-caption text-text-muted"
          >
            Tap to continue
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// INLINE MASCOT - Smaller version for slide corners
// ============================================

interface InlineMascotProps {
  characterId?: string;
  marketId?: string;
  message?: string;
  position?: "left" | "right";
  size?: "sm" | "md";
  className?: string;
}

export function InlineMascot({
  characterId,
  marketId,
  message,
  position = "left",
  size = "sm",
  className,
}: InlineMascotProps) {
  const character = useMemo(() => {
    if (characterId) {
      const found = getAllCharacters().find(c => c.id === characterId);
      if (found) return found;
    }
    return getRandomCharacter(marketId);
  }, [characterId, marketId]);

  const sizeClasses = {
    sm: character.isLeo ? "w-12 h-12" : "w-10 h-10",
    md: character.isLeo ? "w-16 h-16" : "w-14 h-14",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: position === "left" ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, type: "spring" }}
      className={cn(
        "flex items-end gap-2",
        position === "right" && "flex-row-reverse",
        className
      )}
    >
      {/* Avatar */}
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <img
          src={character.avatar}
          alt={character.name}
          className={cn(
            "object-contain drop-shadow-md",
            sizeClasses[size],
            !character.isLeo && "rounded-full border-2 border-white/20"
          )}
        />
      </motion.div>
      
      {/* Optional message bubble */}
      {message && (
        <div className={cn(
          "px-3 py-1.5 bg-bg-2 rounded-xl border border-border text-caption text-text-primary max-w-[160px]",
          position === "right" ? "rounded-br-sm" : "rounded-bl-sm"
        )}>
          {message}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// UTILITY: Should show mascot break?
// ============================================

export function shouldShowMascotBreak(
  slideIndex: number, 
  totalSlides: number,
  isIntro: boolean
): MascotBreakType | null {
  // Always show at intro
  if (isIntro) return "intro";
  
  // Show at midpoint (roughly 50%)
  const midpoint = Math.floor(totalSlides / 2);
  if (slideIndex === midpoint && totalSlides > 3) return "midpoint";
  
  // Show on last slide
  if (slideIndex === totalSlides - 1) return "complete";
  
  return null;
}

export default MascotBreak;
