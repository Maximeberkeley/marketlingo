import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Leo2D } from "./Leo2D";

// Animation state types that map to Leo2D states
type LeoMood = "happy" | "thinking" | "celebrating" | "encouraging" | "waving" | "jumping" | "spinning";

interface LeoMascotProps {
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  mood?: LeoMood;
  showBubble?: boolean;
  className?: string;
  onClick?: () => void;
  animate3D?: boolean; // Kept for backwards compatibility, but uses 2D
}

// Map mood to Leo2D animation state
const moodToAnimation = (mood: LeoMood) => {
  switch (mood) {
    case "happy": return "idle";
    case "thinking": return "thinking";
    case "celebrating": 
    case "spinning": return "celebrating";
    case "encouraging": 
    case "waving": return "waving";
    case "jumping": return "jumping";
    default: return "idle";
  }
};

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
      <Leo2D
        size={size}
        animation={moodToAnimation(mood) as "idle" | "waving" | "jumping" | "celebrating" | "thinking"}
        message={showBubble ? message : undefined}
        showMessage={showBubble && !!message}
        onClick={onClick}
      />
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
  const [mood, setMood] = useState<LeoMood>("happy");

  const handleTap = () => {
    setTapCount(prev => prev + 1);
    
    // Cycle through moods
    const moods: LeoMood[] = ["jumping", "celebrating", "waving"];
    setMood(moods[tapCount % moods.length]);
    
    // Show tap message
    if (tapMessages.length > 0) {
      setMessage(tapMessages[tapCount % tapMessages.length]);
    }
    
    // Reset mood after animation
    setTimeout(() => setMood("happy"), 2000);
    
    onTap?.();
  };

  return (
    <LeoMascot 
      size={size} 
      mood={mood} 
      message={message}
      onClick={handleTap}
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
