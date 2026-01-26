import { motion } from "framer-motion";
import { ChevronRight, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonCardProps {
  title: string;
  subtitle: string;
  headline?: string;
  xp?: number;
  duration?: number;
  imageSrc?: string;
  colorScheme?: "purple" | "blue" | "amber" | "emerald" | "rose";
  onClick: () => void;
}

const colorSchemes = {
  purple: {
    gradient: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/30",
    accent: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  blue: {
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  amber: {
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  emerald: {
    gradient: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  rose: {
    gradient: "from-rose-500/20 to-pink-500/20",
    border: "border-rose-500/30",
    accent: "text-rose-400",
    bg: "bg-rose-500/10",
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
  onClick,
}: LessonCardProps) {
  const colors = colorSchemes[colorScheme];

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl overflow-hidden text-left transition-all no-select group",
        "border bg-gradient-to-br",
        colors.gradient,
        colors.border
      )}
    >
      {/* Image Section */}
      {imageSrc && (
        <div className="relative h-28 overflow-hidden">
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-0/90 via-bg-0/40 to-transparent" />
          
          {/* Floating badges */}
          <div className="absolute top-3 right-3 flex gap-2">
            {duration && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-[10px] text-white/90 font-medium">
                <Clock size={10} />
                {duration}m
              </span>
            )}
            {xp && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/80 backdrop-blur-sm text-[10px] text-white font-medium">
                <Zap size={10} />
                +{xp}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className={cn("text-[11px] font-medium uppercase tracking-wide mb-1", colors.accent)}>
              {subtitle}
            </p>
            <h3 className="text-body font-semibold text-text-primary line-clamp-1">
              {headline || title}
            </h3>
          </div>
          
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full transition-all",
            colors.bg,
            "group-hover:scale-110"
          )}>
            <ChevronRight size={16} className={colors.accent} />
          </div>
        </div>
      </div>
    </motion.button>
  );
}
