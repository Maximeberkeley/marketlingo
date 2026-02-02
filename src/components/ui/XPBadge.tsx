import { motion } from "framer-motion";
import { Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface XPBadgeProps {
  xp: number;
  level: number;
  showLevel?: boolean;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export function XPBadge({ 
  xp, 
  level, 
  showLevel = true, 
  size = "md",
  animate = false 
}: XPBadgeProps) {
  const isHighLevel = level >= 10;

  const sizeClasses = {
    sm: "px-2.5 py-1 text-[10px]",
    md: "px-3.5 py-2 text-caption",
    lg: "px-5 py-2.5 text-body",
  };

  const iconSizes = {
    sm: 10,
    md: 14,
    lg: 18,
  };

  return (
    <motion.div
      initial={animate ? { scale: 0.9, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : {}}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative flex items-center gap-1.5 rounded-pill font-bold",
        sizeClasses[size],
        isHighLevel
          ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/30"
          : "bg-gradient-to-r from-accent/20 to-purple-500/20 text-accent border border-accent/30"
      )}
    >
      {/* XP Icon with glow */}
      <motion.div
        animate={animate ? {
          scale: [1, 1.15, 1],
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {isHighLevel ? (
          <Crown size={iconSizes[size]} className="text-yellow-200 fill-yellow-200" />
        ) : (
          <Zap size={iconSizes[size]} className="text-accent fill-accent" />
        )}
      </motion.div>

      <span>{xp.toLocaleString()}</span>
      
      {showLevel && (
        <span className={cn(
          "ml-0.5",
          isHighLevel ? "text-yellow-200/80" : "text-accent/70",
          size === "sm" ? "text-[8px]" : "text-[10px]"
        )}>
          Lv.{level}
        </span>
      )}

      {/* Sparkle effects for animation */}
      {animate && (
        <>
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400"
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="absolute -bottom-0.5 -left-0.5 w-1 h-1 rounded-full bg-purple-400"
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
          />
        </>
      )}
    </motion.div>
  );
}

// Animated XP gain notification
export function XPGainToast({ amount }: { amount: number }) {
  return (
    <motion.div
      initial={{ scale: 0, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0, y: -20, opacity: 0 }}
      className="flex items-center gap-2 px-4 py-2 rounded-pill bg-gradient-to-r from-accent to-purple-500 text-white font-bold shadow-xl"
    >
      <motion.div
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ duration: 0.3 }}
      >
        <Zap size={18} className="fill-yellow-300 text-yellow-300" />
      </motion.div>
      <span>+{amount} XP</span>
    </motion.div>
  );
}
