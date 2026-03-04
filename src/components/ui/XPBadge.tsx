import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "./AnimatedCounter";

interface XPBadgeProps {
  xp: number;
  level?: number;
  showLevel?: boolean;
  size?: "sm" | "md";
}

export function XPBadge({ xp, level, showLevel = true, size = "md" }: XPBadgeProps) {
  const sizeClasses = {
    sm: "px-2.5 py-1 text-[12px] gap-1",
    md: "px-3 py-1.5 text-[13px] gap-1.5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={cn(
        "inline-flex items-center rounded-full font-bold no-select",
        "bg-primary/10 text-primary",
        sizeClasses[size]
      )}
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Zap size={size === "sm" ? 12 : 14} className="fill-primary text-primary" />
      </motion.div>
      <AnimatedCounter value={xp} duration={0.6} />
      {showLevel && level && (
        <span className="opacity-60 font-medium">Lv{level}</span>
      )}
    </motion.div>
  );
}
