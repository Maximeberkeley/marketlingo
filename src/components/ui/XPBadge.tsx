import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface XPBadgeProps {
  xp: number;
  level: number;
  showLevel?: boolean;
}

export function XPBadge({ xp, level, showLevel = true }: XPBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-accent/10 border border-accent/30"
    >
      <Zap size={14} className="text-accent fill-accent" />
      <span className="text-caption font-semibold text-accent">{xp.toLocaleString()}</span>
      {showLevel && (
        <span className="text-[10px] font-medium text-accent/70 ml-0.5">Lv.{level}</span>
      )}
    </motion.div>
  );
}
