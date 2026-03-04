import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DuoProgressBarProps {
  progress: number;
  size?: "sm" | "md" | "lg";
  colorScheme?: "accent" | "success" | "streak" | "xp";
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const colorSchemes = {
  accent: {
    bg: "bg-bg-1",
    fill: "bg-primary",
    glow: "shadow-[0_0_8px_hsl(258_90%_66%/0.3)]",
  },
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    fill: "bg-success",
    glow: "shadow-[0_0_8px_hsl(142_71%_45%/0.3)]",
  },
  streak: {
    bg: "bg-orange-50 dark:bg-orange-900/30",
    fill: "bg-streak",
    glow: "shadow-[0_0_8px_hsl(25_95%_53%/0.3)]",
  },
  xp: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    fill: "bg-amber-500",
    glow: "shadow-[0_0_8px_hsl(38_92%_50%/0.3)]",
  },
};

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function DuoProgressBar({
  progress,
  size = "md",
  colorScheme = "accent",
  showLabel = false,
  label,
  animated = true,
}: DuoProgressBarProps) {
  const colors = colorSchemes[colorScheme];
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-caption text-text-secondary">{label}</span>}
          <span className="text-caption font-semibold text-text-primary">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
      
      <div className={cn(
        "w-full rounded-full overflow-hidden relative",
        sizeClasses[size],
        colors.bg
      )}>
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${clampedProgress}%` }}
          transition={animated ? { 
            duration: 0.8, 
            ease: [0.34, 1.56, 0.64, 1],
          } : { duration: 0 }}
          className={cn(
            "h-full rounded-full relative",
            colors.fill,
            clampedProgress > 10 && colors.glow
          )}
        >
          {/* Shine effect */}
          {animated && clampedProgress > 5 && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 1.2, delay: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
