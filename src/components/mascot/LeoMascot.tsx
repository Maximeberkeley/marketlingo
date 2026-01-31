import React, { useState } from "react";
import { motion } from "framer-motion";
import leoMascot from "@/assets/mascot/leo-mascot.png";
import { cn } from "@/lib/utils";

interface LeoMascotProps {
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  mood?: "happy" | "thinking" | "celebrating" | "encouraging" | "waving" | "jumping" | "spinning";
  showBubble?: boolean;
  className?: string;
  onClick?: () => void;
  animate3D?: boolean;
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
};

const moodAnimations = {
  happy: { y: [0, -3, 0], transition: { duration: 1.5, repeat: Infinity } },
  thinking: { rotate: [0, 3, -3, 0], transition: { duration: 2, repeat: Infinity } },
  celebrating: { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0], transition: { duration: 0.8, repeat: Infinity } },
  encouraging: { y: [0, -5, 0], transition: { duration: 1, repeat: Infinity } },
  waving: { rotate: [0, 10, -10, 10, 0], transition: { duration: 1.2, repeat: Infinity } },
  jumping: { 
    y: [0, -15, 0], 
    scale: [1, 1.1, 0.95, 1],
    transition: { duration: 0.6, repeat: Infinity, repeatDelay: 0.8 } 
  },
  spinning: { 
    rotateY: [0, 180, 360], 
    scale: [1, 1.1, 1],
    transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } 
  },
};

export function LeoMascot({ 
  size = "md", 
  message, 
  mood = "happy", 
  showBubble = true, 
  className,
  onClick,
  animate3D = false
}: LeoMascotProps) {
  return (
    <motion.div 
      className={cn("flex items-end gap-2", className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Leo Avatar with 3D-like effect */}
      <motion.div
        animate={moodAnimations[mood]}
        className={cn(
          "relative rounded-full overflow-hidden flex-shrink-0 cursor-pointer",
          sizeClasses[size],
          animate3D && "preserve-3d"
        )}
        onClick={onClick}
        whileHover={{ scale: 1.1, rotateY: animate3D ? 15 : 0 }}
        whileTap={{ scale: 0.95 }}
        style={animate3D ? { transformStyle: "preserve-3d", perspective: 1000 } : undefined}
      >
        {/* Glow effect behind Leo */}
        <motion.div 
          className="absolute inset-0 rounded-full bg-accent/20 blur-md"
          animate={{ 
            scale: [1, 1.2, 1], 
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <img 
          src={leoMascot} 
          alt="Leo the fox mascot" 
          className="w-full h-full object-contain relative z-10"
        />
      </motion.div>
      
      {/* Speech Bubble */}
      {showBubble && message && (
        <motion.div
          initial={{ opacity: 0, x: -10, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className="relative bg-bg-2 rounded-2xl rounded-bl-md px-3 py-2 border border-border shadow-lg max-w-[180px]"
        >
          {/* Bubble pointer */}
          <div className="absolute left-0 bottom-2 w-2.5 h-2.5 bg-bg-2 border-l border-b border-border transform -translate-x-1 rotate-45" />
          
          <p className="text-xs text-text-primary font-medium leading-tight">
            {message}
          </p>
          <p className="text-[10px] text-accent mt-0.5">— Leo</p>
        </motion.div>
      )}
    </motion.div>
  );
}

// Leo with tap-to-interact behavior
export function LeoInteractive({ 
  onTap, 
  size = "md",
  initialMessage,
  tapMessages = [],
}: {
  onTap?: () => void;
  size?: "sm" | "md" | "lg" | "xl";
  initialMessage?: string;
  tapMessages?: string[];
}) {
  const [message, setMessage] = useState(initialMessage);
  const [tapCount, setTapCount] = useState(0);
  const [mood, setMood] = useState<"happy" | "jumping" | "spinning" | "celebrating">("happy");

  const handleTap = () => {
    setTapCount(prev => prev + 1);
    
    // Cycle through moods
    const moods: Array<"happy" | "jumping" | "spinning" | "celebrating"> = ["jumping", "spinning", "celebrating"];
    setMood(moods[tapCount % moods.length]);
    
    // Show tap message
    if (tapMessages.length > 0) {
      setMessage(tapMessages[tapCount % tapMessages.length]);
    }
    
    // Reset mood after animation
    setTimeout(() => setMood("happy"), 1500);
    
    onTap?.();
  };

  return (
    <LeoMascot 
      size={size} 
      mood={mood} 
      message={message}
      onClick={handleTap}
      animate3D
    />
  );
}

// Pre-defined Leo messages for different contexts
export const leoMessages = {
  welcome: [
    "Hey there! Ready to learn? 🚀",
    "Let's make today count!",
    "Knowledge is power! 💪",
    "Your industry journey starts now!",
  ],
  streak: [
    "Keep that streak alive! 🔥",
    "You're on fire!",
    "Consistency is key!",
    "Another day, another win!",
  ],
  achievement: [
    "You earned it! 🏆",
    "Look at you go!",
    "That's what I'm talking about!",
    "Incredible progress!",
  ],
  encouragement: [
    "You've got this!",
    "Don't give up!",
    "Keep pushing forward!",
    "Almost there!",
  ],
  completion: [
    "Lesson complete! 🎉",
    "Nailed it!",
    "Another one done!",
    "You're crushing it!",
  ],
  marketSelect: [
    "Choose your adventure! 🗺️",
    "Which industry calls to you?",
    "Pick one, master it!",
    "Your 6-month journey awaits!",
  ],
  correct: [
    "Brilliant! 🌟",
    "You nailed it!",
    "That's the one!",
    "Sharp thinking!",
  ],
  incorrect: [
    "Close! Try again 💪",
    "Not quite, but you're learning!",
    "Every mistake teaches us!",
    "Keep going!",
  ],
  quiz: [
    "Quick question time! 🧠",
    "Let's test your knowledge!",
    "Think about this...",
    "Pop quiz!",
  ],
};

export function getRandomLeoMessage(category: keyof typeof leoMessages): string {
  const messages = leoMessages[category];
  return messages[Math.floor(Math.random() * messages.length)];
}
