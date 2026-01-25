import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Mentor } from "@/data/mentors";

interface MentorTipBubbleProps {
  mentor: Mentor;
  tip: string;
  onDismiss: () => void;
  onTap?: () => void;
  position?: "bottom-left" | "bottom-right" | "top-right";
  delay?: number;
}

export function MentorTipBubble({
  mentor,
  tip,
  onDismiss,
  onTap,
  position = "bottom-left",
  delay = 0,
}: MentorTipBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Position classes - adjusted for iPhone safe areas
  const positionClasses = {
    "bottom-left": "bottom-28 left-4",
    "bottom-right": "bottom-28 right-4",
    "top-right": "top-20 right-4",
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(onDismiss, 200);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`fixed ${positionClasses[position]} z-40 max-w-[280px]`}
          onClick={onTap}
        >
          <div className="relative">
            {/* Speech bubble */}
            <div className="bg-bg-2 border border-border rounded-2xl rounded-bl-md p-3 shadow-lg cursor-pointer hover:border-accent/50 transition-colors">
              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="absolute -top-2 -right-2 w-6 h-6 bg-bg-1 border border-border rounded-full flex items-center justify-center hover:bg-bg-2 transition-colors"
              >
                <X size={12} className="text-text-muted" />
              </button>

              {/* Content */}
              <div className="flex gap-2.5">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={mentor.avatar}
                    alt={mentor.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-accent"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                    <Sparkles size={10} className="text-white" />
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-accent mb-0.5">
                    {mentor.name.split(" ")[0]}
                  </p>
                  <p className="text-caption text-text-primary leading-snug">
                    {tip}
                  </p>
                </div>
              </div>

              {/* Tap hint */}
              {onTap && (
                <p className="text-[10px] text-text-muted mt-2 text-center">
                  Tap to chat
                </p>
              )}
            </div>

            {/* Tail */}
            <div className="absolute -bottom-1.5 left-3 w-3 h-3 bg-bg-2 border-l border-b border-border rotate-[-45deg]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
