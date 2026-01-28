import { motion } from "framer-motion";
import leoMascot from "@/assets/mascot/leo-mascot.png";
import { cn } from "@/lib/utils";

interface LeoMascotProps {
  size?: "sm" | "md" | "lg" | "xl";
  message?: string;
  mood?: "happy" | "thinking" | "celebrating" | "encouraging" | "waving";
  showBubble?: boolean;
  className?: string;
  onClick?: () => void;
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
};

export function LeoMascot({ 
  size = "md", 
  message, 
  mood = "happy", 
  showBubble = true, 
  className,
  onClick 
}: LeoMascotProps) {
  return (
    <motion.div 
      className={cn("flex items-end gap-2", className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Leo Avatar */}
      <motion.div
        animate={moodAnimations[mood]}
        className={cn(
          "relative rounded-full overflow-hidden flex-shrink-0 cursor-pointer",
          sizeClasses[size]
        )}
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <img 
          src={leoMascot} 
          alt="Leo the mascot" 
          className="w-full h-full object-contain"
        />
      </motion.div>
      
      {/* Speech Bubble */}
      {showBubble && message && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
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
};

export function getRandomLeoMessage(category: keyof typeof leoMessages): string {
  const messages = leoMessages[category];
  return messages[Math.floor(Math.random() * messages.length)];
}
