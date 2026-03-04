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
  },
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    fill: "bg-success",
  },
  streak: {
    bg: "bg-orange-50 dark:bg-orange-900/30",
    fill: "bg-streak",
  },
  xp: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    fill: "bg-amber-500",
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
        "w-full rounded-full overflow-hidden",
        sizeClasses[size],
        colors.bg
      )}>
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${clampedProgress}%` }}
          transition={animated ? { duration: 0.6, ease: "easeOut" } : { duration: 0 }}
          className={cn(
            "h-full rounded-full",
            colors.fill
          )}
        />
      </div>
    </div>
  );
}
