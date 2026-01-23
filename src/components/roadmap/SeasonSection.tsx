import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { RoadmapNode, NodeStatus } from "./RoadmapNode";

interface Week {
  weekNumber: number;
  status: NodeStatus;
  title: string;
}

interface SeasonSectionProps {
  seasonNumber: number;
  title: string;
  weeks: Week[];
  onWeekClick: (weekNumber: number) => void;
  defaultExpanded?: boolean;
}

export function SeasonSection({
  seasonNumber,
  title,
  weeks,
  onWeekClick,
  defaultExpanded = false,
}: SeasonSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const completedWeeks = weeks.filter((w) => w.status === "completed").length;
  const progress = Math.round((completedWeeks / weeks.length) * 100);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-bg-2 rounded-card border border-border no-select"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-caption font-semibold text-primary">{seasonNumber}</span>
          </div>
          <div className="text-left">
            <h3 className="text-h3 text-text-primary">{title}</h3>
            <p className="text-caption text-text-muted">{progress}% complete</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-text-muted" />
        ) : (
          <ChevronDown size={20} className="text-text-muted" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="py-4 flex flex-col items-center">
              {weeks.map((week, index) => (
                <div key={week.weekNumber} className="flex flex-col items-center">
                  <RoadmapNode
                    weekNumber={week.weekNumber}
                    status={week.status}
                    onClick={() => onWeekClick(week.weekNumber)}
                  />
                  {index < weeks.length - 1 && (
                    <div
                      className={`w-0.5 h-6 my-2 rounded-full ${
                        week.status === "completed" ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
