import { motion } from "framer-motion";
import { DailyQuest } from "@/hooks/useDailyQuests";
import { cn } from "@/lib/utils";

interface DailyQuestsProps {
  quests: DailyQuest[];
  completedCount: number;
  totalBonusXP: number;
  allComplete: boolean;
}

function QuestRow({ quest, index }: { quest: DailyQuest; index: number }) {
  const progressPct = quest.target > 0 ? Math.min(1, quest.current / quest.target) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
      className={cn(
        "flex items-center gap-3 rounded-xl p-3 border transition-colors",
        quest.isCompleted
          ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/15"
          : "bg-card border-border"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0",
          quest.isCompleted ? "bg-emerald-500/15" : "bg-accent/10"
        )}
      >
        {quest.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={cn(
              "text-sm font-bold",
              quest.isCompleted ? "text-emerald-400" : "text-text-primary"
            )}
          >
            {quest.title}
          </span>
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-md",
              quest.isCompleted
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-accent/15 text-accent"
            )}
          >
            {quest.isCompleted ? "✓" : `+${quest.xpBonus} XP`}
          </span>
        </div>
        <p className="text-[11px] text-text-muted mb-1.5 truncate">{quest.description}</p>
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mb-1">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${progressPct * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-text-muted">
          {quest.current}/{quest.target}
          {quest.multiplier > 1 && !quest.isCompleted && (
            <span className="text-amber-400 font-semibold"> • {quest.multiplier}x XP</span>
          )}
        </span>
      </div>

      {quest.isCompleted && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"
        >
          <span className="text-white text-xs font-bold">✓</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export function DailyQuests({ quests, completedCount, totalBonusXP, allComplete }: DailyQuestsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h3 className="text-base font-bold text-text-primary">Daily Quests</h3>
        </div>
        <span className="text-xs font-bold text-accent bg-accent/15 px-2.5 py-1 rounded-lg border border-accent/30">
          {completedCount}/{quests.length}
        </span>
      </div>

      {allComplete && (
        <div className="flex items-center gap-3 bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/25">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-sm font-bold text-emerald-400">All Quests Complete!</p>
            <p className="text-[11px] text-emerald-300/80">+{totalBonusXP} bonus XP earned</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {quests.map((quest, idx) => (
          <QuestRow key={quest.id} quest={quest} index={idx} />
        ))}
      </div>
    </motion.div>
  );
}
