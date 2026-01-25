import { motion } from "framer-motion";
import { ChevronRight, Sparkles, Target, BookOpen, Brain, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type IntroType = "course" | "games" | "drills" | "trainer" | "daily";

interface IntroductionCardProps {
  type: IntroType;
  onStart: () => void;
  onDismiss?: () => void;
}

const introContent: Record<IntroType, {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  ctaText: string;
  gradient: string;
}> = {
  course: {
    icon: <BookOpen className="w-8 h-8" />,
    title: "Welcome to Your Learning Path",
    subtitle: "6 Months to Industry Expertise",
    description: "Master aerospace & defense markets through daily micro-lessons designed for founders and investors.",
    features: [
      "5-minute daily slide stacks",
      "Real-world case studies & sources",
      "Progressive skill building",
      "Save insights to your notebook"
    ],
    ctaText: "Start Learning",
    gradient: "from-primary to-accent"
  },
  games: {
    icon: <Target className="w-8 h-8" />,
    title: "Test Your Knowledge",
    subtitle: "Daily Pattern Games",
    description: "Reinforce your learning with quick multiple-choice questions based on today's content.",
    features: [
      "MCQ format with instant feedback",
      "Track your score progression",
      "Apply concepts from lessons",
      "Compete with your best score"
    ],
    ctaText: "Play Now",
    gradient: "from-blue-500 to-cyan-400"
  },
  drills: {
    icon: <Zap className="w-8 h-8" />,
    title: "Speed Drills",
    subtitle: "15-Second Fact Checks",
    description: "Rapid-fire true/false questions to build intuition and test your aerospace knowledge.",
    features: [
      "Timed challenges",
      "Industry fact verification",
      "Build pattern recognition",
      "Quick daily practice"
    ],
    ctaText: "Start Drill",
    gradient: "from-amber-500 to-orange-400"
  },
  trainer: {
    icon: <Brain className="w-8 h-8" />,
    title: "Pro Reasoning Trainer",
    subtitle: "Think Like an Industry Expert",
    description: "Complex scenarios that develop your strategic thinking with pro-level feedback.",
    features: [
      "Real-world decision scenarios",
      "Expert reasoning breakdowns",
      "Common mistake analysis",
      "Mental models for founders"
    ],
    ctaText: "Train Now",
    gradient: "from-purple-500 to-pink-400"
  },
  daily: {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Daily Patterns",
    subtitle: "Industry Intelligence",
    description: "Stay current with curated aerospace news and learn to spot recurring market patterns.",
    features: [
      "Fresh industry news daily",
      "Pattern recognition training",
      "Source-backed insights",
      "Strategic trend analysis"
    ],
    ctaText: "View Today",
    gradient: "from-emerald-500 to-teal-400"
  }
};

export function IntroductionCard({ type, onStart, onDismiss }: IntroductionCardProps) {
  const content = introContent[type];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-2xl",
          "bg-bg-1 border border-border shadow-2xl"
        )}
      >
        {/* Gradient Header */}
        <div className={cn(
          "relative h-32 flex items-center justify-center",
          `bg-gradient-to-br ${content.gradient}`
        )}>
          <div className="absolute inset-0 bg-black/10" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="relative z-10 w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
          >
            {content.icon}
          </motion.div>
          <Sparkles className="absolute top-4 right-4 w-5 h-5 text-white/50" />
        </div>

        {/* Content */}
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-caption text-accent font-medium mb-1">{content.subtitle}</p>
            <h2 className="text-h2 text-text-primary mb-2">{content.title}</h2>
            <p className="text-body text-text-secondary mb-4">{content.description}</p>
          </motion.div>

          {/* Features */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-2 mb-6"
          >
            {content.features.map((feature, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="flex items-center gap-2 text-caption text-text-secondary"
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  `bg-gradient-to-r ${content.gradient}`
                )} />
                {feature}
              </motion.li>
            ))}
          </motion.ul>

          {/* Actions */}
          <div className="flex gap-3">
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-1 py-3 px-4 rounded-xl border border-border text-text-secondary hover:bg-bg-2 transition-colors"
              >
                Maybe Later
              </button>
            )}
            <button
              onClick={onStart}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-white font-medium",
                "flex items-center justify-center gap-2",
                `bg-gradient-to-r ${content.gradient}`,
                "hover:opacity-90 transition-opacity"
              )}
            >
              {content.ctaText}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}