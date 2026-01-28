import { motion } from "framer-motion";
import { Mentor, getMentorForContext } from "@/data/mentors";
import { cn } from "@/lib/utils";

interface MentorGuideProps {
  context: string;
  slideIndex: number;
  totalSlides: number;
  isIntro?: boolean;
  className?: string;
}

// Contextual messages based on slide position
function getMentorMessage(slideIndex: number, totalSlides: number, isIntro: boolean, mentorId: string): string {
  if (isIntro) {
    const introMessages: Record<string, string[]> = {
      maya: ["Let's decode this together!", "Ready for some market insights?", "Time to think strategically!"],
      alex: ["Let me break this down for you.", "Technical concepts ahead!", "Let's dive into the details."],
      kai: ["This is startup gold!", "Ready to build something?", "Let's think like founders!"],
      sophia: ["You're going to love this!", "Ready to grow together?", "Let's unlock your potential!"],
    };
    return introMessages[mentorId]?.[Math.floor(Math.random() * 3)] || "Let's learn!";
  }
  
  if (slideIndex === 0) {
    const firstMessages: Record<string, string[]> = {
      maya: ["Here's the big picture...", "Pay attention to this!", "Market insight incoming!"],
      alex: ["Fundamental concept here.", "This is key to understand.", "Core principle ahead!"],
      kai: ["Founders take note!", "This could be your edge.", "Opportunity alert!"],
      sophia: ["This is exciting!", "Key growth insight!", "You'll want to remember this!"],
    };
    return firstMessages[mentorId]?.[Math.floor(Math.random() * 3)] || "Starting strong!";
  }
  
  if (slideIndex === totalSlides - 1) {
    const lastMessages: Record<string, string[]> = {
      maya: ["Now you see the full picture!", "Connect these dots!", "Strategy unlocked!"],
      alex: ["You've got this!", "Technical mastery!", "Key takeaway here!"],
      kai: ["Go build something!", "Action time!", "Your move now!"],
      sophia: ["Amazing progress!", "You're doing great!", "Proud of you!"],
    };
    return lastMessages[mentorId]?.[Math.floor(Math.random() * 3)] || "Great job!";
  }
  
  // Mid-lesson messages
  const midMessages: Record<string, string[]> = {
    maya: ["Interesting, right?", "Think about this...", "Note this pattern!", "Strategic insight!"],
    alex: ["Technical detail!", "Important nuance.", "Remember this!", "Key point!"],
    kai: ["Startup tip!", "Founder insight!", "Good to know!", "Take action!"],
    sophia: ["Love this part!", "So valuable!", "You're learning fast!", "Keep going!"],
  };
  return midMessages[mentorId]?.[slideIndex % 4] || "Keep going!";
}

// Different poses/expressions based on slide content
function getMentorMood(slideIndex: number, totalSlides: number, isIntro: boolean): "excited" | "thinking" | "encouraging" | "celebrating" {
  if (isIntro) return "excited";
  if (slideIndex === totalSlides - 1) return "celebrating";
  if (slideIndex % 3 === 0) return "thinking";
  return "encouraging";
}

export function MentorGuide({ context, slideIndex, totalSlides, isIntro = false, className }: MentorGuideProps) {
  const mentor = getMentorForContext(context);
  const message = getMentorMessage(slideIndex, totalSlides, isIntro, mentor.id);
  const mood = getMentorMood(slideIndex, totalSlides, isIntro);
  
  // Animation variants based on mood
  const moodAnimations = {
    excited: { rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] },
    thinking: { rotate: [0, 3, 0], y: [0, -2, 0] },
    encouraging: { scale: [1, 1.02, 1], y: [0, -3, 0] },
    celebrating: { rotate: [0, -8, 8, -8, 0], scale: [1, 1.1, 1] },
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className={cn("flex items-end gap-3", className)}
    >
      {/* Mentor Avatar */}
      <motion.div
        animate={moodAnimations[mood]}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
        className="relative flex-shrink-0"
      >
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent/50 shadow-lg shadow-accent/20">
          <img
            src={mentor.avatar}
            alt={mentor.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Status indicator */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-bg-1"
        />
      </motion.div>
      
      {/* Speech Bubble */}
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
