import { motion, AnimatePresence } from "framer-motion";
import { Zap, X } from "lucide-react";
import { Achievement, achievementIcons } from "@/data/achievements";
import { cn } from "@/lib/utils";
import leoCelebrating from "@/assets/mascot/leo-celebrating.png";

const TIER_STYLES: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  platinum: { color: "text-gray-200", bg: "bg-gray-500/10", border: "border-gray-400/30", glow: "shadow-gray-400/20" },
  gold: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", glow: "shadow-yellow-500/20" },
  silver: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-400/30", glow: "shadow-slate-400/20" },
  bronze: { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", glow: "shadow-amber-500/20" },
};

interface AchievementPopupProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export function AchievementPopup({ achievement, onDismiss }: AchievementPopupProps) {
  if (!achievement) return null;

  const tier = TIER_STYLES[achievement.tier] || TIER_STYLES.bronze;

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ scale: 0.5, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-[340px] bg-bg-1 rounded-3xl border-2 overflow-hidden flex flex-col items-center pb-6",
              tier.border,
              `shadow-2xl ${tier.glow}`
            )}
          >
            {/* Close button */}
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-bg-2/80 hover:bg-bg-2 transition-colors"
            >
              <X size={14} className="text-text-muted" />
            </button>

            {/* Leo celebrating */}
            <motion.div
              initial={{ y: 30, scale: 0 }}
              animate={{ y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 150, delay: 0.15 }}
              className="mt-2 mb-[-12px] z-10"
            >
              <img src={leoCelebrating} alt="Leo celebrating" className="w-32 h-32 object-contain" />
            </motion.div>

            {/* Content */}
            <div className="flex flex-col items-center gap-2 px-6 text-center">
              {/* Tier badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={cn("px-4 py-1 rounded-lg border text-[10px] font-extrabold tracking-widest uppercase", tier.bg, tier.color, tier.border)}
              >
                {achievement.tier}
              </motion.div>

              <p className="text-[11px] uppercase tracking-wider text-text-muted font-medium">
                Achievement Unlocked!
              </p>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-xl font-extrabold text-text-primary"
              >
                {achievement.name}
              </motion.h2>

              <p className="text-[13px] text-text-secondary leading-relaxed">
                {achievement.description}
              </p>

              {/* XP reward */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mt-1"
              >
                <Zap size={16} className="text-yellow-400" />
                <span className="text-base font-bold text-yellow-400">+{achievement.xpReward} XP</span>
              </motion.div>
            </div>

            {/* Dismiss button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={onDismiss}
              className={cn(
                "mt-5 mx-6 w-[calc(100%-48px)] py-3.5 rounded-xl font-bold text-base text-black transition-transform active:scale-95",
                achievement.tier === "platinum" ? "bg-gray-200" :
                achievement.tier === "gold" ? "bg-yellow-400" :
                achievement.tier === "silver" ? "bg-slate-400" :
                "bg-amber-500"
              )}
            >
              Awesome!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
