import { useState } from "react";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/ios-utils";

interface MathDrillCardProps {
  question: { question: string; options: string[]; correctIndex: number; explanation: string };
}

export function MathDrillCard({ question: q }: MathDrillCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const revealed = selected !== null;

  return (
    <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-3">
      <p className="text-sm font-semibold text-text-primary mb-3">{q.question}</p>
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            disabled={revealed}
            onClick={() => { setSelected(i); hapticFeedback(i === q.correctIndex ? "medium" : "heavy"); }}
            className={cn(
              "p-2.5 rounded-xl border-2 text-sm font-semibold text-center transition-all",
              !revealed && "border-border hover:border-violet-400",
              revealed && i === q.correctIndex && "border-emerald-500 bg-emerald-500/5",
              selected === i && i !== q.correctIndex && "border-red-500 bg-red-500/5",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      {revealed && <p className="text-xs text-text-secondary mt-3">{q.explanation}</p>}
    </div>
  );
}
