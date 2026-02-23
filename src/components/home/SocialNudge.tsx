import { motion } from "framer-motion";
import { Trophy, X, Zap } from "lucide-react";

interface SocialNudgeProps {
  rivalName: string;
  rivalXP: number;
  userXP: number;
  marketName: string;
  onViewLeaderboard: () => void;
  onDismiss: () => void;
}

export function SocialNudge({
  rivalName,
  rivalXP,
  userXP,
  marketName,
  onViewLeaderboard,
  onDismiss,
}: SocialNudgeProps) {
  const xpGap = rivalXP - userXP;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="relative rounded-2xl bg-accent/5 border border-accent/20 mb-4 overflow-hidden"
    >
      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2.5 z-10 p-1"
      >
        <X size={14} className="text-text-muted/40" />
      </button>

      <div className="flex items-center gap-3 p-3.5 pb-2.5">
        {/* Avatar stack */}
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-bg-2 flex items-center justify-center z-[1]">
            <span className="text-lg">👤</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center -ml-3">
            <span className="text-[8px] font-extrabold text-white">VS</span>
          </div>
        </div>

        <div className="flex-1 pr-5">
          <p className="text-body font-semibold text-text-primary leading-tight">
            {rivalName} is{" "}
            <span className="text-red-400 font-extrabold">{xpGap} XP</span>{" "}
            ahead of you
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            in {marketName} · One lesson closes the gap
          </p>
        </div>
      </div>

      <button
        onClick={onViewLeaderboard}
        className="mx-3.5 mb-3.5 w-[calc(100%-28px)] py-2.5 rounded-xl bg-accent/15 text-center"
      >
        <span className="text-[13px] font-bold text-accent">
          View Leaderboard →
        </span>
      </button>
    </motion.div>
  );
}
