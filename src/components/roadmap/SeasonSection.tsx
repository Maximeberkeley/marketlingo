import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, BookOpen, Play, CheckCircle2, Lock } from "lucide-react";
import { RoadmapNode, NodeStatus } from "./RoadmapNode";
import { cn } from "@/lib/utils";

interface Lesson {
  day: number;
  title: string;
  pattern: string;
  completed: boolean;
}

interface Week {
  weekNumber: number;
  status: NodeStatus;
  title: string;
  objective?: string;
  learnings?: string[];
  dayRange: string;
  lessons?: Lesson[];
}

interface SeasonSectionProps {
  seasonNumber: number;
  title: string;
  weeks: Week[];
  onWeekClick: (weekNumber: number) => void;
  onLessonClick?: (day: number) => void;
  defaultExpanded?: boolean;
}

export function SeasonSection({
  seasonNumber,
  title,
  weeks,
  onWeekClick,
  onLessonClick,
  defaultExpanded = false,
}: SeasonSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const completedWeeks = weeks.filter((w) => w.status === "completed").length;
  const progress = Math.round((completedWeeks / weeks.length) * 100);

  const handleWeekClick = (weekNumber: number, status: NodeStatus) => {
    if (status === "locked") return;
    
    // Toggle lesson drawer
    if (expandedWeek === weekNumber) {
      setExpandedWeek(null);
    } else {
      setExpandedWeek(weekNumber);
    }
    
    // Also call parent handler
    onWeekClick(weekNumber);
  };

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
                <div key={week.weekNumber} className="flex flex-col items-center w-full">
                  {/* Node + Title Row */}
                  <div className="flex items-center gap-3">
                    <RoadmapNode
                      weekNumber={week.weekNumber}
                      status={week.status}
                      onClick={() => handleWeekClick(week.weekNumber, week.status)}
                    />
                    <motion.button
                      onClick={() => handleWeekClick(week.weekNumber, week.status)}
                      className={cn(
                        "text-left flex-1 py-2 px-3 rounded-lg transition-colors",
                        week.status === "locked" 
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-bg-2/50"
                      )}
                      disabled={week.status === "locked"}
                    >
                      <p className="text-body font-medium text-text-primary">
                        {week.title}
                      </p>
                      <p className="text-caption text-text-muted">{week.dayRange}</p>
                    </motion.button>
                  </div>

                  {/* Expanded Lesson List - Duolingo style */}
                  <AnimatePresence>
                    {expandedWeek === week.weekNumber && week.lessons && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="w-full overflow-hidden pl-14 pr-2"
                      >
                        <div className="py-3 space-y-2">
                          {week.lessons.map((lesson, lessonIdx) => (
                            <motion.button
                              key={lesson.day}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: lessonIdx * 0.05 }}
                              onClick={() => onLessonClick?.(lesson.day)}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                                lesson.completed 
                                  ? "bg-success/10 border border-success/20"
                                  : "bg-bg-1 border border-border hover:border-accent/50"
                              )}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                lesson.completed 
                                  ? "bg-success/20"
                                  : "bg-accent/10"
                              )}>
                                {lesson.completed ? (
                                  <CheckCircle2 size={16} className="text-success" />
                                ) : (
                                  <BookOpen size={14} className="text-accent" />
                                )}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className="text-caption font-medium text-text-primary truncate">
                                  Day {lesson.day}: {lesson.title}
                                </p>
                                <p className="text-[11px] text-text-muted truncate">
                                  {lesson.pattern}
                                </p>
                              </div>
                              {!lesson.completed && (
                                <Play size={14} className="text-accent flex-shrink-0" />
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Connector line */}
                  {index < weeks.length - 1 && (
                    <div
                      className={cn(
                        "w-0.5 h-6 my-2 rounded-full transition-colors",
                        week.status === "completed" ? "bg-primary" : "bg-border"
                      )}
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
