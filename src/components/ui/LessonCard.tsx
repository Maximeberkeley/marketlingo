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
    gradient: "from-purple-600/30 via-purple-500/20 to-pink-500/20",
    border: "border-purple-500/40",
    accent: "text-purple-400",
    bg: "bg-purple-500/20",
    glow: "shadow-purple-500/20",
    overlay: "from-purple-900/95 via-purple-900/70 to-transparent",
  },
  blue: {
    gradient: "from-blue-600/30 via-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/40",
    accent: "text-blue-400",
    bg: "bg-blue-500/20",
    glow: "shadow-blue-500/20",
    overlay: "from-blue-900/95 via-blue-900/70 to-transparent",
  },
  amber: {
    gradient: "from-amber-600/30 via-amber-500/20 to-orange-500/20",
    border: "border-amber-500/40",
    accent: "text-amber-400",
    bg: "bg-amber-500/20",
    glow: "shadow-amber-500/20",
    overlay: "from-amber-900/95 via-amber-900/70 to-transparent",
  },
  emerald: {
    gradient: "from-emerald-600/30 via-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/40",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/20",
    glow: "shadow-emerald-500/20",
    overlay: "from-emerald-900/95 via-emerald-900/70 to-transparent",
  },
  rose: {
    gradient: "from-rose-600/30 via-rose-500/20 to-pink-500/20",
    border: "border-rose-500/40",
    accent: "text-rose-400",
    bg: "bg-rose-500/20",
    glow: "shadow-rose-500/20",
    overlay: "from-rose-900/95 via-rose-900/70 to-transparent",
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
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={cn(
        "w-full rounded-2xl overflow-hidden text-left transition-all no-select group relative",
        "border bg-gradient-to-br",
        colors.gradient,
        colors.border,
        "shadow-lg",
        colors.glow,
        isCompleted && "opacity-75"
      )}
    >
      {/* Image Section with enhanced overlay */}
      {imageSrc && (
        <div className="relative h-36 overflow-hidden">
          <motion.img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover object-[50%_30%]"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t",
            colors.overlay
          )} />
          
          {/* Floating badges */}
          <div className="absolute top-3 right-3 flex gap-2">
            {duration && (
              <motion.span 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[11px] text-white font-medium"
              >
                <Clock size={11} />
                {duration}m
              </motion.span>
            )}
            {xp && (
              <motion.span 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/90 backdrop-blur-md text-[11px] text-white font-bold"
              >
                <Zap size={11} className="fill-yellow-300 text-yellow-300" />
                +{xp}
              </motion.span>
            )}
          </div>

          {/* Completed check */}
          {isCompleted && (
            <div className="absolute top-3 left-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-7 h-7 rounded-full bg-success flex items-center justify-center"
              >
                <CheckCircle2 size={16} className="text-white" />
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-[11px] font-semibold uppercase tracking-wider mb-1.5",
              colors.accent
            )}>
              {subtitle}
            </p>
            <h3 className="text-body font-semibold text-text-primary line-clamp-2 leading-snug">
              {headline || title}
            </h3>
          </div>
          
          <motion.div 
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full transition-all flex-shrink-0",
              colors.bg,
            )}
            whileHover={{ scale: 1.1, x: 2 }}
          >
            <ChevronRight size={18} className={colors.accent} />
          </motion.div>
        </div>
      </div>

      {/* Bottom progress indicator line */}
      <div className={cn(
        "h-1 w-full",
        isCompleted ? "bg-success" : `bg-gradient-to-r ${colors.gradient}`
      )} />
    </motion.button>
  );
}
