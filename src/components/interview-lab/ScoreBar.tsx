import { motion } from "framer-motion";

interface ScoreBarProps {
  label: string;
  value: number;
  color: string;
}

export function ScoreBar({ label, value, color }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-text-muted w-16">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-bg-1 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] text-text-muted w-6 text-right">{value}</span>
    </div>
  );
}
