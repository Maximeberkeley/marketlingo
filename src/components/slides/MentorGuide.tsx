import { useMemo } from "react";
import { motion } from "framer-motion";
import { getMentorForContext } from "@/data/mentors";
import { cn } from "@/lib/utils";

interface MentorGuideProps {
  context: string;
  slideIndex: number;
  totalSlides: number;
  isIntro?: boolean;
  className?: string;
  marketId?: string;
}

// Static messages for each position - no randomization to prevent re-render chaos
const getMentorMessage = (slideIndex: number, totalSlides: number, isIntro: boolean, mentorId: string, marketId?: string): string => {
  const isSophiaNeuro = mentorId === "sophia" && marketId === "neuroscience";
  
  // Use fixed messages based on mentorId to prevent random re-renders
  const messages: Record<string, { intro: string; first: string; last: string }> = {
    maya: {
      intro: "Let's decode this together!",
      first: "Here's the big picture...",
      last: "Now you see the full picture!",
    },
    alex: {
      intro: "Let me break this down for you.",
      first: "Fundamental concept here.",
      last: "You've got this!",
    },
    kai: {
      intro: "This is startup gold!",
      first: "Founders take note!",
      last: "Go build something!",
    },
    sophia: isSophiaNeuro
      ? {
          intro: "Brain science awaits! 🧠",
          first: "This is exciting! 🎉",
          last: "You crushed it! 🏆",
        }
      : {
          intro: "You're going to love this!",
          first: "This is exciting!",
          last: "Amazing progress!",
        },
  };

  const mentorMessages = messages[mentorId] || messages.maya;

  if (isIntro) return mentorMessages.intro;
  if (slideIndex === 0) return mentorMessages.first;
  if (slideIndex === totalSlides - 1) return mentorMessages.last;
  
  // This shouldn't happen since we only show on first/last slides
  return mentorMessages.first;
};

export function MentorGuide({ context, slideIndex, totalSlides, isIntro = false, className, marketId }: MentorGuideProps) {
  const mentor = getMentorForContext(context, marketId);
  
  // Memoize the message to prevent changes during re-renders
  const message = useMemo(
    () => getMentorMessage(slideIndex, totalSlides, isIntro, mentor.id, marketId),
    [slideIndex, totalSlides, isIntro, mentor.id, marketId]
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className={cn("flex items-end gap-3", className)}
    >
      {/* Mentor Avatar - Static, no looping animations */}
      <div className="relative flex-shrink-0">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent/50 shadow-lg shadow-accent/20">
          <img
            src={mentor.avatar}
            alt={mentor.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Status indicator - static green dot */}
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-bg-1" />
      </div>
      
      {/* Speech Bubble - Static after initial animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="relative bg-bg-2 rounded-2xl rounded-bl-md px-4 py-2.5 border border-border shadow-lg max-w-[200px]"
      >
        {/* Bubble pointer */}
        <div className="absolute left-0 bottom-2 w-3 h-3 bg-bg-2 border-l border-b border-border transform -translate-x-1.5 rotate-45" />
        
        <p className="text-sm text-text-primary font-medium leading-tight">
          {message}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          — {mentor.name.split(" ")[0]}
        </p>
      </motion.div>
    </motion.div>
  );
}
