import { motion } from "framer-motion";
import { ChevronRight, Clock, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/ios-utils";

interface LessonCardProps {
  title: string;
  subtitle: string;
  headline?: string;
  xp?: number;
  duration?: number;
  imageSrc?: string;
  colorScheme?: "purple" | "blue" | "amber" | "emerald" | "rose";
  isCompleted?: boolean;
  onClick: () => void;
}

const colorSchemes = {
  purple: {
    accent: "text-primary",
    accentBg: "bg-primary/8",
    iconBg: "bg-primary/10",
    tag: "bg-primary/10 text-primary",
    border: "border-border hover:border-primary/30",
  },
  blue: {
    accent: "text-blue-600 dark:text-blue-400",
    accentBg: "bg-blue-50 dark:bg-blue-500/10",
    iconBg: "bg-blue-50 dark:bg-blue-500/10",
    tag: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    border: "border-border hover:border-blue-300 dark:hover:border-blue-500/30",
  },
  amber: {
    accent: "text-amber-600 dark:text-amber-400",
    accentBg: "bg-amber-50 dark:bg-amber-500/10",
    iconBg: "bg-amber-50 dark:bg-amber-500/10",
    tag: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    border: "border-border hover:border-amber-300 dark:hover:border-amber-500/30",
  },
  emerald: {
    accent: "text-emerald-600 dark:text-emerald-400",
    accentBg: "bg-emerald-50 dark:bg-emerald-500/10",
    iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
    tag: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    border: "border-border hover:border-emerald-300 dark:hover:border-emerald-500/30",
  },
  rose: {
    accent: "text-rose-600 dark:text-rose-400",
    accentBg: "bg-rose-50 dark:bg-rose-500/10",
    iconBg: "bg-rose-50 dark:bg-rose-500/10",
    tag: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
    border: "border-border hover:border-rose-300 dark:hover:border-rose-500/30",
  },
};

export function LessonCard({
  title,
  subtitle,
  headline,
  xp,
  duration,
  imageSrc,
  colorScheme = "purple",
  isCompleted = false,
  onClick,
}: LessonCardProps) {
  const colors = colorSchemes[colorScheme];

  const handleClick = () => {
    hapticFeedback("light");
    onClick();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={cn(
        "w-full rounded-2xl overflow-hidden text-left transition-all no-select group relative",
        "border bg-card shadow-card",
        colors.border,
        isCompleted && "opacity-60"
      )}
    >
      {/* Image Section */}
      {imageSrc && (
        <div className="relative h-40 overflow-hidden bg-bg-1">
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover"
          />
          {/* Subtle gradient overlay at bottom only */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
          
          {/* Completed check */}
          {isCompleted && (
            <div className="absolute top-3 left-3">
              <div className="w-7 h-7 rounded-full bg-success flex items-center justify-center">
                <CheckCircle2 size={16} className="text-white" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("text-[11px] font-bold uppercase tracking-wider", colors.accent)}>
                {subtitle}
              </span>
              {duration && (
                <span className="flex items-center gap-1 text-[11px] text-text-muted">
                  <Clock size={10} />
                  {duration}m
                </span>
              )}
              {xp && (
                <span className={cn("flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full", colors.tag)}>
                  <Zap size={10} />
                  +{xp}
                </span>
              )}
            </div>
            <h3 className="text-[17px] font-bold text-text-primary leading-snug line-clamp-2">
              {headline || title}
            </h3>
          </div>
          
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full transition-all flex-shrink-0",
            colors.iconBg,
          )}>
            <ChevronRight size={18} className={colors.accent} />
          </div>
        </div>
      </div>
    </motion.button>
  );
}
