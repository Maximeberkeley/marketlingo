import { motion } from "framer-motion";
import { ChevronRight, Sparkles, BookOpen, Brain, Target, Zap, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionType = "daily_pattern" | "micro_lesson" | "games" | "drills" | "trainer" | "summaries";

interface SectionIntroSlideProps {
  type: SectionType;
  dayNumber?: number;
  monthTheme?: string;
}

const sectionInfo: Record<SectionType, {
  icon: React.ReactNode;
  title: string;
  tagline: string;
  color: string;
  bgGradient: string;
}> = {
  daily_pattern: {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Daily Pattern",
    tagline: "Recognize recurring market forces",
    color: "text-blue-400",
    bgGradient: "from-blue-500/20 to-cyan-500/10"
  },
  micro_lesson: {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Micro Lesson",
    tagline: "5-minute concept deep dive",
    color: "text-emerald-400",
    bgGradient: "from-emerald-500/20 to-teal-500/10"
  },
  games: {
    icon: <Target className="w-6 h-6" />,
    title: "Knowledge Game",
    tagline: "Test what you've learned",
    color: "text-purple-400",
    bgGradient: "from-purple-500/20 to-pink-500/10"
  },
  drills: {
    icon: <Zap className="w-6 h-6" />,
    title: "Speed Drill",
    tagline: "15-second fact checks",
    color: "text-amber-400",
    bgGradient: "from-amber-500/20 to-orange-500/10"
  },
  trainer: {
    icon: <Brain className="w-6 h-6" />,
    title: "Pro Trainer",
    tagline: "Think like an industry expert",
    color: "text-red-400",
    bgGradient: "from-red-500/20 to-rose-500/10"
  },
  summaries: {
    icon: <Calendar className="w-6 h-6" />,
    title: "Summary",
    tagline: "Key takeaways consolidated",
    color: "text-cyan-400",
    bgGradient: "from-cyan-500/20 to-blue-500/10"
  }
};

export function SectionIntroSlide({ type, dayNumber, monthTheme }: SectionIntroSlideProps) {
  const info = sectionInfo[type];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "relative overflow-hidden rounded-card p-6",
        "bg-gradient-to-br",
        info.bgGradient,
        "border border-border"
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <Sparkles className="w-full h-full" />
      </div>
      
      <div className="relative z-10">
        {/* Day/Month badge */}
        {(dayNumber || monthTheme) && (
          <div className="flex items-center gap-2 mb-4">
            {dayNumber && (
              <span className="chip bg-bg-1/50 text-text-primary text-caption">
                Day {dayNumber}
              </span>
            )}
            {monthTheme && (
              <span className="chip bg-accent/20 text-accent text-caption">
                {monthTheme}
              </span>
            )}
          </div>
        )}
        
        {/* Icon and title */}
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            "bg-bg-1/50 backdrop-blur-sm",
            info.color
          )}>
            {info.icon}
          </div>
          <div>
            <h3 className="text-h3 text-text-primary">{info.title}</h3>
            <p className="text-caption text-text-muted">{info.tagline}</p>
          </div>
        </div>
        
        {/* Swipe hint */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-1 text-caption text-text-muted mt-4"
        >
          <span>Swipe to begin</span>
          <ChevronRight className="w-4 h-4 animate-pulse" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// Utility to create an intro slide for stacks
export function createIntroSlide(stackType: string, stackTitle: string) {
  let sectionType: SectionType = "micro_lesson";
  
  if (stackType === "NEWS" || stackTitle.toLowerCase().includes("pattern")) {
    sectionType = "daily_pattern";
  } else if (stackType === "LESSON") {
    sectionType = "micro_lesson";
  } else if (stackType === "HISTORY") {
    sectionType = "micro_lesson";
  }
  
  return {
    slideNumber: 0,
    title: sectionInfo[sectionType].title,
    body: sectionInfo[sectionType].tagline,
    sources: [],
    isIntro: true,
    sectionType
  };
}