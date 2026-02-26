import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuickBiteSelectorProps {
  totalSlides: number;
  completedBites: number[];
  onSelectBite: (biteIndex: number) => void;
  onFullLesson: () => void;
  lessonTitle: string;
  isLessonComplete: boolean;
}

const BITE_LABELS = ["Concept", "Lens", "Takeaway"];
const BITE_EMOJIS = ["💡", "🔍", "🎯"];

export function QuickBiteSelector({
  totalSlides,
  completedBites,
  onSelectBite,
  onFullLesson,
  lessonTitle,
  isLessonComplete,
}: QuickBiteSelectorProps) {
  const biteCount = Math.ceil(totalSlides / 2);
  const bites = Array.from({ length: biteCount }, (_, i) => ({
    index: i,
    startSlide: i * 2 + 1,
    endSlide: Math.min((i + 1) * 2, totalSlides),
    isComplete: completedBites.includes(i),
  }));

  const allBitesComplete = bites.every((b) => b.isComplete);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated border-amber-400/20 space-y-3"
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xl">⚡</span>
        <div>
          <h3 className="text-base font-bold text-text-primary">Quick Bites</h3>
          <p className="text-[11px] text-text-muted">2-slide micro-lessons • ~1 min each</p>
        </div>
      </div>

      <p className="text-xs text-text-secondary italic leading-relaxed line-clamp-2">{lessonTitle}</p>

      <div className="grid grid-cols-3 gap-2.5">
        {bites.map((bite) => (
          <motion.button
            key={bite.index}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectBite(bite.index)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl p-3 border transition-colors",
              bite.isComplete
                ? "bg-emerald-500/8 border-emerald-500/20"
                : "bg-amber-400/8 border-amber-400/15 hover:border-amber-400/30"
            )}
          >
            <span className="text-xl">
              {bite.isComplete ? "✅" : BITE_EMOJIS[bite.index] || "📖"}
            </span>
            <span
              className={cn(
                "text-xs font-bold",
                bite.isComplete ? "text-emerald-400" : "text-text-primary"
              )}
            >
              {BITE_LABELS[bite.index] || `Part ${bite.index + 1}`}
            </span>
            <span className="text-[9px] text-text-muted">
              Slides {bite.startSlide}–{bite.endSlide}
            </span>
          </motion.button>
        ))}
      </div>

      <button
        onClick={onFullLesson}
        className={cn(
          "w-full py-2.5 rounded-xl text-sm font-semibold transition-colors border",
          isLessonComplete
            ? "text-text-secondary bg-white/[0.03] border-border"
            : "text-accent bg-accent/10 border-accent/25 hover:bg-accent/15"
        )}
      >
        {isLessonComplete ? "📖 Review Full Lesson" : "📚 Full Lesson (all slides)"}
      </button>

      {allBitesComplete && !isLessonComplete && (
        <p className="text-[11px] text-amber-400 text-center">
          💡 Complete all bites to earn full lesson XP!
        </p>
      )}
    </motion.div>
  );
}
