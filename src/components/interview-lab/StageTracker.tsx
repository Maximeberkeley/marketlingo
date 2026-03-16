import { Layers, Eye, CheckCircle, Mic, Briefcase, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InterviewPath, InterviewStage } from "@/data/interviewLabData";

interface StageTrackerProps {
  current: InterviewStage;
  onTap: (s: InterviewStage) => void;
  path: InterviewPath;
}

const icons = { 1: Layers, 2: Eye, 3: CheckCircle, 4: Mic, 5: Briefcase, 6: BarChart2 };

export function StageTracker({ current, onTap, path }: StageTrackerProps) {
  const stages = path === 'consulting'
    ? [1, 2, 3, 4, 5, 6] as InterviewStage[]
    : [1, 2, 3, 4, 6] as InterviewStage[];

  return (
    <div className="flex items-center justify-center px-6 mb-5 gap-0">
      {stages.map((s, i) => {
        const done = current > s;
        const active = current === s;
        const Icon = icons[s];
        return (
          <div key={s} className="flex items-center">
            {i > 0 && <div className={cn("h-0.5 w-6 sm:w-10", done || active ? "bg-violet-500" : "bg-border")} />}
            <button
              onClick={() => onTap(s)}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all",
                active && "bg-violet-600 border-violet-600 text-white scale-110",
                done && "bg-emerald-500 border-emerald-500 text-white",
                !active && !done && "bg-bg-2 border-border text-text-muted"
              )}
            >
              <Icon size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
