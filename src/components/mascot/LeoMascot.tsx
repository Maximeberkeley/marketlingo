import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LeoCharacter, LeoAnim, LeoPuppet } from "./LeoStateMachine";

// Animation state types that map to LeoAnim
type LeoMood = "happy" | "thinking" | "celebrating" | "encouraging" | "waving" | "jumping" | "spinning";

interface LeoMascotProps {
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  mood?: LeoMood;
  showBubble?: boolean;
  className?: string;
  onClick?: () => void;
}

// Map mood to LeoAnim
const moodToAnimation = (mood: LeoMood): LeoAnim => {
  switch (mood) {
    case "happy": return "success";
    case "thinking": return "thinking";
    case "celebrating": 
    case "spinning": 
    case "jumping": return "celebrating";
    case "encouraging": 
    case "waving": return "waving";
    default: return "idle";
  }
};

const sizeMap = { sm: 80, md: 120, lg: 160, xl: 200 };

export function LeoMascot({ 
  size = "md", 
  message, 
  mood = "happy", 
  showBubble = true, 
  className,
  onClick,
}: LeoMascotProps) {
  return (
    <motion.div 
      className={cn("flex flex-col items-center justify-center", className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <LeoPuppet
        size={sizeMap[size]}
        animation={moodToAnimation(mood)}
      />
      {showBubble && message && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 px-4 py-2 bg-bg-2 rounded-xl border border-border max-w-[180px]"
        >
          <p className="text-sm text-text-primary text-center">{message}</p>
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
  const [animation, setAnimation] = useState<LeoAnim>("idle");

  const handleTap = () => {
    setTapCount(prev => prev + 1);
    
    // Cycle through animations
    const animations: LeoAnim[] = ["celebrating", "success", "waving"];
    setAnimation(animations[tapCount % animations.length]);
    
    // Show tap message
    if (tapMessages.length > 0) {
      setMessage(tapMessages[tapCount % tapMessages.length]);
    }
    
    // Reset animation after a delay
    setTimeout(() => setAnimation("idle"), 2000);
    
    onTap?.();
  };

  return (
    <div className="flex flex-col items-center">
      <LeoPuppet 
        size={sizeMap[size]} 
        animation={animation}
      />
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-text-secondary mt-3 text-center"
        >
          {message}
        </motion.p>
      )}
    </div>
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
