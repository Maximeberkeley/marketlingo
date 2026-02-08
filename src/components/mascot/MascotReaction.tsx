import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/ios-utils";
import leoSticker from "@/assets/leo-sticker.png";

// ============================================
// DUOLINGO-STYLE INTERACTIVE MASCOT
// ============================================

export type MascotState = 
  | "idle" 
  | "thinking" 
  | "correct" 
  | "incorrect" 
  | "celebrating" 
  | "encouraging"
  | "waving";

interface MascotReactionProps {
  state: MascotState;
  size?: "sm" | "md" | "lg";
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "inline";
  showMessage?: boolean;
  message?: string;
  className?: string;
  onAnimationComplete?: () => void;
}

// State-specific animation variants
const mascotVariants = {
  idle: {
    y: [0, -4, 0],
    scale: [1, 1.02, 1],
    rotate: 0,
    transition: {
      y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
      scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
  },
  thinking: {
    rotate: [-3, 3, -3],
    y: [0, -2, 0],
    transition: {
      rotate: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
      y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  },
  correct: {
    y: [0, -20, 0],
    scale: [1, 1.2, 1],
    rotate: [0, -5, 5, 0],
    transition: {
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1], // Bouncy
    },
  },
  incorrect: {
    x: [-5, 5, -5, 5, 0],
    rotate: [-2, 2, -2, 2, 0],
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  celebrating: {
    y: [0, -30, 0, -20, 0],
    scale: [1, 1.3, 1, 1.2, 1],
    rotate: [0, -10, 10, -5, 0],
    transition: {
      duration: 1,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
  encouraging: {
    y: [0, -5, 0],
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
    },
  },
  waving: {
    rotate: [0, -10, 10, -10, 0],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
    },
  },
};

// Sparkle effect for celebrations
const SparkleEffect = () => (
  <div className="absolute inset-0 pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-primary"
        initial={{ 
          opacity: 0, 
          scale: 0,
          x: "50%",
          y: "50%",
        }}
        animate={{ 
          opacity: [0, 1, 0], 
          scale: [0, 1.5, 0],
          x: `${50 + (Math.random() - 0.5) * 100}%`,
          y: `${50 + (Math.random() - 0.5) * 100}%`,
        }}
        transition={{ 
          duration: 0.8,
          delay: i * 0.1,
          ease: "easeOut",
        }}
      />
    ))}
  </div>
);

// Expression overlay based on state
const ExpressionOverlay = ({ state }: { state: MascotState }) => {
  if (state === "correct" || state === "celebrating") {
    return (
      <motion.div
        className="absolute -top-1 -right-1 text-lg"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
      >
        ✨
      </motion.div>
    );
  }
  
  if (state === "incorrect") {
    return (
      <motion.div
        className="absolute -top-1 -right-1 text-lg"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        💪
      </motion.div>
    );
  }
  
  if (state === "thinking") {
    return (
      <motion.div
        className="absolute -top-2 right-0 text-sm"
        animate={{ 
          opacity: [0.5, 1, 0.5],
          y: [0, -2, 0],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        🤔
      </motion.div>
    );
  }
  
  return null;
};

// Message bubble component
const MessageBubble = ({ message, state }: { message: string; state: MascotState }) => {
  const bubbleColors = {
    idle: "bg-muted border-border",
    thinking: "bg-muted border-border",
    correct: "bg-accent/20 border-accent/40",
    incorrect: "bg-destructive/20 border-destructive/40",
    celebrating: "bg-primary/20 border-primary/40",
    encouraging: "bg-secondary/20 border-secondary/40",
    waving: "bg-muted border-border",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      className={cn(
        "absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap",
        "px-3 py-1.5 rounded-full text-xs font-medium border",
        "shadow-lg backdrop-blur-sm",
        bubbleColors[state]
      )}
    >
      {message}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-inherit border-r border-b" />
    </motion.div>
  );
};

// Size configurations
const sizeConfig = {
  sm: { container: "w-12 h-12", image: "w-10 h-10" },
  md: { container: "w-16 h-16", image: "w-14 h-14" },
  lg: { container: "w-24 h-24", image: "w-20 h-20" },
};

// Position configurations
const positionConfig = {
  "top-left": "fixed top-20 left-4 z-50",
  "top-right": "fixed top-20 right-4 z-50",
  "bottom-left": "fixed bottom-24 left-4 z-50",
  "bottom-right": "fixed bottom-24 right-4 z-50",
  "inline": "relative",
};

// Default messages per state
const defaultMessages: Record<MascotState, string> = {
  idle: "",
  thinking: "Hmm...",
  correct: "Great job! 🎉",
  incorrect: "Keep trying!",
  celebrating: "You did it! 🏆",
  encouraging: "You've got this!",
  waving: "Hey there! 👋",
};

export function MascotReaction({
  state,
  size = "md",
  position = "inline",
  showMessage = false,
  message,
  className,
  onAnimationComplete,
}: MascotReactionProps) {
  const [currentState, setCurrentState] = useState<MascotState>(state);
  const [showSparkles, setShowSparkles] = useState(false);

  // Handle state transitions with haptics
  useEffect(() => {
    setCurrentState(state);
    
    // Trigger haptics based on state
    if (state === "correct" || state === "celebrating") {
      hapticFeedback("heavy");
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 1000);
    } else if (state === "incorrect") {
      hapticFeedback("medium");
    } else if (state === "thinking") {
      hapticFeedback("light");
    }
  }, [state]);

  const displayMessage = message || defaultMessages[currentState];
  const sizes = sizeConfig[size];
  const positionClass = positionConfig[position];

  return (
    <div className={cn(positionClass, className)}>
      <div className={cn("relative", sizes.container)}>
        {/* Sparkle effect for celebrations */}
        <AnimatePresence>
          {showSparkles && <SparkleEffect />}
        </AnimatePresence>

        {/* Main mascot */}
        <motion.div
          className="relative"
          variants={mascotVariants}
          animate={currentState}
          onAnimationComplete={onAnimationComplete}
        >
          <img
            src={leoSticker}
            alt="Leo the Fox"
            className={cn(
              sizes.image,
              "object-contain drop-shadow-lg",
              currentState === "incorrect" && "grayscale-[20%]"
            )}
          />
          
          {/* Expression overlay */}
          <ExpressionOverlay state={currentState} />
        </motion.div>

        {/* Message bubble */}
        <AnimatePresence>
          {showMessage && displayMessage && (
            <MessageBubble message={displayMessage} state={currentState} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default MascotReaction;
