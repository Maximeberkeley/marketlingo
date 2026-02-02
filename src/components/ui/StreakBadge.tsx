import { Flame } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  count: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function StreakBadge({ count, size = "md", showLabel = false }: StreakBadgeProps) {
  const isOnFire = count >= 7;
  const isHot = count >= 3;

  const sizeClasses = {
    sm: "px-2 py-1 text-[10px]",
    md: "px-3 py-1.5 text-caption",
    lg: "px-4 py-2 text-body",
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative flex items-center gap-1.5 rounded-pill font-bold",
        sizeClasses[size],
        isOnFire 
          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30" 
          : isHot
          ? "bg-gradient-to-r from-orange-400/20 to-red-400/20 text-orange-400 border border-orange-400/30"
          : "bg-bg-2 border border-border text-text-primary"
      )}
    >
      {/* Animated flame */}
      <motion.div
        animate={isOnFire ? {
          scale: [1, 1.2, 1],
          rotate: [-5, 5, -5],
        } : {}}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <Flame 
          size={iconSizes[size]} 
          className={cn(
            isOnFire 
              ? "text-yellow-300 fill-yellow-300 drop-shadow-lg" 
              : isHot 
              ? "text-orange-400 fill-orange-400/50"
              : "text-orange-400"
          )} 
        />
      </motion.div>
      
      <span>{count}</span>
      {showLabel && <span className="opacity-80">day{count !== 1 ? 's' : ''}</span>}

      {/* Fire particles for high streaks */}
      {isOnFire && (
        <>
          <motion.div
            className="absolute -top-1 left-2 w-1 h-1 rounded-full bg-yellow-400"
            animate={{ y: [0, -8], opacity: [1, 0], scale: [1, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="absolute -top-0.5 right-3 w-0.5 h-0.5 rounded-full bg-orange-300"
            animate={{ y: [0, -6], opacity: [1, 0], scale: [1, 0.5] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="absolute top-0 left-4 w-0.5 h-0.5 rounded-full bg-red-400"
            animate={{ y: [0, -10], opacity: [1, 0], scale: [1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: 0.4 }}
          />
        </>
      )}
    </motion.div>
  );
}
