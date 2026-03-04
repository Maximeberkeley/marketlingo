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
    sm: "px-2.5 py-1 text-[12px] gap-1",
    md: "px-3 py-1.5 text-[13px] gap-1.5",
    lg: "px-4 py-2 text-[15px] gap-2",
  };

  const iconSizes = { sm: 13, md: 15, lg: 18 };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center rounded-full font-bold no-select",
        sizeClasses[size],
        isOnFire 
          ? "bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400" 
          : isHot 
            ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400"
            : "bg-bg-1 text-text-muted"
      )}
    >
      <Flame 
        size={iconSizes[size]} 
        className={cn(
          isOnFire ? "text-orange-500 fill-orange-500" : 
          isHot ? "text-orange-400" : "text-text-muted"
        )} 
      />
      <span>{count}</span>
      {showLabel && <span className="font-medium opacity-70">days</span>}
    </motion.div>
  );
}
