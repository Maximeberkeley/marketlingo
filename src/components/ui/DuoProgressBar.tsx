import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DuoProgressBarProps {
  progress: number; // 0-100
  size?: "sm" | "md" | "lg";
  colorScheme?: "accent" | "success" | "streak" | "xp";
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const colorSchemes = {
  accent: {
    bg: "bg-bg-1",
    fill: "from-accent via-purple-400 to-pink-400",
    glow: "shadow-accent/30",
  },
  success: {
    bg: "bg-emerald-900/30",
    fill: "from-emerald-500 via-green-400 to-teal-400",
    glow: "shadow-emerald-500/30",
  },
  streak: {
    bg: "bg-orange-900/30",
    fill: "from-orange-500 via-amber-400 to-yellow-400",
    glow: "shadow-orange-500/30",
  },
  xp: {
    bg: "bg-yellow-900/30",
    fill: "from-yellow-500 via-amber-400 to-orange-400",
    glow: "shadow-yellow-500/30",
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
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 16px)"
          }} />
        </div>

        {/* Progress fill */}
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${clampedProgress}%` }}
          transition={animated ? { 
            duration: 0.8, 
            ease: [0.34, 1.56, 0.64, 1] // Bouncy easing
          } : { duration: 0 }}
          className={cn(
            "h-full rounded-full relative overflow-hidden",
            "bg-gradient-to-r",
            colors.fill,
            "shadow-lg",
            colors.glow
          )}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 opacity-40"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
              width: "50%",
            }}
            animate={{ x: ["-100%", "300%"] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut",
            }}
          />

          {/* Top highlight */}
          <div 
            className="absolute top-0 left-0 right-0 h-[40%] rounded-t-full"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)"
            }}
          />
        </motion.div>

        {/* End cap glow when near complete */}
        {clampedProgress >= 90 && (
          <motion.div
            className="absolute right-0 top-0 bottom-0 w-8"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${colorScheme === 'accent' ? 'rgba(124,92,255,0.5)' : 'rgba(16,185,129,0.5)'} 100%)`
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}
