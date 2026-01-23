import { Flame } from "lucide-react";
import { motion } from "framer-motion";

interface StreakBadgeProps {
  count: number;
}

export function StreakBadge({ count }: StreakBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-bg-2 border border-border"
    >
      <Flame size={16} className="streak-flame" />
      <span className="text-caption font-semibold text-text-primary">{count}</span>
    </motion.div>
  );
}
