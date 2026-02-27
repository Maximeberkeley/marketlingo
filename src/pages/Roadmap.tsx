import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ChevronDown, ChevronRight, Check, Lock, Play, BookOpen, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeoCharacter } from "@/components/mascot/LeoStateMachine";

interface Lesson {
  day: number;
  title: string;
  pattern: string;
  completed: boolean;
  current: boolean;
}

interface Week {
  weekNumber: number;
  title: string;
  lessons: Lesson[];
  status: "completed" | "current" | "locked";
  completedCount: number;
}

interface Season {
  seasonNumber: number;
  title: string;
  subtitle: string;
  weeks: Week[];
  isExpanded: boolean;
}

// Aerospace patterns organized by day
const aerospacePatterns: Record<number, { title: string; pattern: string }> = {
  1: { title: "Buyer ≠ User", pattern: "Map the buying committee" },
  2: { title: "OEM Gatekeeping", pattern: "Risk beats performance" },
  3: { title: "Supply Chain Architecture", pattern: "Enter at Tier-2/3" },
  4: { title: "The Approval Maze", pattern: "Build DER relationships" },
  5: { title: "Governance = Velocity", pattern: "Regulatory strategy" },
  6: { title: "Type Certification", pattern: "TC is the product" },
  7: { title: "STC Path", pattern: "Modify existing aircraft" },
  8: { title: "Change Friction", pattern: "Minimize cert surface" },
  9: { title: "Why Slow", pattern: "Incentives reward caution" },
  10: { title: "Conservative Design", pattern: "Heritage wins" },
  11: { title: "Cost-Plus Model", pattern: "Contract = risk profile" },
  12: { title: "Contract Types", pattern: "Power by the Hour" },
  13: { title: "Timeline Mismatch", pattern: "Find patient capital" },
  14: { title: "Startup Killers", pattern: "Cash timing risks" },
  15: { title: "Cash Flow Cycles", pattern: "9-month working capital" },
  16: { title: "Requirement Creep", pattern: "Formal change control" },
  17: { title: "Hardware-First Trap", pattern: "Paper airplane phase" },
  18: { title: "Trust Economy", pattern: "AS9100, track record" },
  19: { title: "Supply Control", pattern: "Vertical vs suppliers" },
  20: { title: "First Customer", pattern: "Tier-1 partners, MRO" },
};

function getDayWeek(day: number): number {
  return Math.ceil(day / 5);
}

export default function RoadmapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market")
        .eq("id", user.id)
        .single();

      const market = profile?.selected_market || "aerospace";

      const { data: progress } = await supabase
        .from("user_progress")
        .select("start_date, completed_stacks, learning_goal")
        .eq("user_id", user.id)
        .eq("market_id", market)
        .single();

      const learningGoal = progress?.learning_goal || 'curiosity';
      const goalTag = `goal:${learningGoal}`;

      // Calculate available day from start_date (calendar-based)
      let day = 1;
      if (progress?.start_date) {
        const start = new Date(progress.start_date);
        const today = new Date();
        start.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        day = Math.min(180, Math.max(1, diffDays + 1));
      }
      setCurrentDay(day);

      const currentWeek = getDayWeek(day);
      
      const buildSeasons: Season[] = [
        {
          seasonNumber: 1,
          title: "Foundations",
          subtitle: "Month 1 • Core aerospace fundamentals",
          weeks: [
            buildWeek(1, currentWeek, day, "Market Structure", [1, 2, 3, 4, 5]),
            buildWeek(2, currentWeek, day, "Certification Reality", [6, 7, 8, 9, 10]),
            buildWeek(3, currentWeek, day, "Business Dynamics", [11, 12, 13, 14, 15]),
            buildWeek(4, currentWeek, day, "Execution Patterns", [16, 17, 18, 19, 20]),
          ],
          isExpanded: true,
        },
        {
          seasonNumber: 2,
          title: "Forces & Cycles",
          subtitle: "Month 2 • Market forces and timing",
          weeks: [
            buildWeek(5, currentWeek, day, "Regulation Deep Dive", [21, 22, 23, 24, 25]),
            buildWeek(6, currentWeek, day, "Capital Flows", [26, 27, 28, 29, 30]),
            buildWeek(7, currentWeek, day, "Talent Dynamics", [31, 32, 33, 34, 35]),
            buildWeek(8, currentWeek, day, "Technology Waves", [36, 37, 38, 39, 40]),
          ],
          isExpanded: false,
        },
        {
          seasonNumber: 3,
          title: "Startup Patterns",
          subtitle: "Month 3 • Building in aerospace",
          weeks: [
            buildWeek(9, currentWeek, day, "Moat Building", [41, 42, 43, 44, 45]),
            buildWeek(10, currentWeek, day, "GTM Strategies", [46, 47, 48, 49, 50]),
            buildWeek(11, currentWeek, day, "Failure Modes", [51, 52, 53, 54, 55]),
            buildWeek(12, currentWeek, day, "Success Stories", [56, 57, 58, 59, 60]),
          ],
          isExpanded: false,
        },
        {
          seasonNumber: 4,
          title: "Key Players",
          subtitle: "Month 4 • Industry deep dives",
          weeks: [
            buildWeek(13, currentWeek, day, "Commercial Giants", [61, 62, 63, 64, 65]),
            buildWeek(14, currentWeek, day, "Defense Primes", [66, 67, 68, 69, 70]),
            buildWeek(15, currentWeek, day, "Space Innovators", [71, 72, 73, 74, 75]),
            buildWeek(16, currentWeek, day, "Supply Chain", [76, 77, 78, 79, 80]),
          ],
          isExpanded: false,
        },
        {
          seasonNumber: 5,
          title: "Investment Lens",
          subtitle: "Month 5 • Investor perspective",
          weeks: [
            buildWeek(17, currentWeek, day, "Public Markets", [81, 82, 83, 84, 85]),
            buildWeek(18, currentWeek, day, "Private Markets", [86, 87, 88, 89, 90]),
            buildWeek(19, currentWeek, day, "Due Diligence", [91, 92, 93, 94, 95]),
            buildWeek(20, currentWeek, day, "Portfolio Strategy", [96, 97, 98, 99, 100]),
          ],
          isExpanded: false,
        },
        {
          seasonNumber: 6,
          title: "Builder Mode",
          subtitle: "Month 6 • Apply everything",
          weeks: [
            buildWeek(21, currentWeek, day, "Thesis Building", [101, 102, 103, 104, 105]),
            buildWeek(22, currentWeek, day, "Analysis Project", [106, 107, 108, 109, 110]),
            buildWeek(23, currentWeek, day, "Future Scenarios", [111, 112, 113, 114, 115]),
            buildWeek(24, currentWeek, day, "Graduation", [116, 117, 118, 119, 120]),
          ],
          isExpanded: false,
        },
      ];

      setSeasons(buildSeasons);
      setLoading(false);
    };

    fetchProgress();
  }, [user]);

  function buildWeek(weekNum: number, currentWeek: number, currentDay: number, title: string, days: number[]): Week {
    let status: "completed" | "current" | "locked" = "locked";
    if (weekNum < currentWeek) status = "completed";
    else if (weekNum === currentWeek) status = "current";

    const lessons: Lesson[] = days.map(d => ({
      day: d,
      title: aerospacePatterns[d]?.title || `Day ${d}`,
      pattern: aerospacePatterns[d]?.pattern || "Coming soon",
      completed: d < currentDay,
      current: d === currentDay,
    }));

    return {
      weekNumber: weekNum,
      title,
      lessons,
      status,
      completedCount: lessons.filter(l => l.completed).length,
    };
  }

  const toggleSeason = (seasonNumber: number) => {
    setSeasons(prev =>
      prev.map(s =>
        s.seasonNumber === seasonNumber ? { ...s, isExpanded: !s.isExpanded } : s
      )
    );
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.completed || lesson.current) {
      setSelectedLesson(lesson);
    }
  };

  const startLesson = () => {
    setSelectedLesson(null);
    navigate("/home");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="screen-padding pt-safe pb-28">
        {/* Header with Leo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-h1 text-text-primary mb-1">Your Journey</h1>
              <p className="text-caption text-text-muted">
                Day {currentDay} of 180 • Week {getDayWeek(currentDay)}
              </p>
            </div>
            {/* Leo companion in header */}
            <LeoCharacter 
              size="sm" 
              animation={currentDay > 1 ? "success" : "idle"} 
            />
          </div>
        </motion.div>

        {/* Current Lesson Card with Leo */}
        {aerospacePatterns[currentDay] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-[11px] font-medium text-accent mb-1">CONTINUE LEARNING</p>
                <h3 className="text-body font-semibold text-text-primary">
                  {aerospacePatterns[currentDay].title}
                </h3>
                <p className="text-caption text-text-muted mt-1">
                  {aerospacePatterns[currentDay].pattern}
                </p>
              </div>
              <Button
                size="sm"
                className="bg-accent hover:bg-accent/90"
                onClick={() => navigate("/home")}
              >
                <Play size={14} className="mr-1" />
                Start
              </Button>
            </div>
          </motion.div>
        )}

        {/* Seasons */}
        <div className="space-y-3">
          {seasons.map((season, sIdx) => (
            <motion.div
              key={season.seasonNumber}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sIdx * 0.05 }}
              className="rounded-2xl bg-bg-2/50 border border-border overflow-hidden"
            >
              {/* Season Header */}
              <button
                onClick={() => toggleSeason(season.seasonNumber)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold",
                    season.weeks.some(w => w.status === "current")
                      ? "bg-accent/20 text-accent"
                      : season.weeks.every(w => w.status === "completed")
                      ? "bg-success/20 text-success"
                      : "bg-bg-1 text-text-muted"
                  )}>
                    {season.seasonNumber}
                  </div>
                  <div className="text-left">
                    <h3 className="text-body font-semibold text-text-primary">{season.title}</h3>
                    <p className="text-[11px] text-text-muted">{season.subtitle}</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: season.isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={20} className="text-text-muted" />
                </motion.div>
              </button>

              {/* Weeks */}
              <AnimatePresence>
                {season.isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2">
                      {season.weeks.map((week) => (
                        <div
                          key={week.weekNumber}
                          className={cn(
                            "rounded-xl border p-3",
                            week.status === "current"
                              ? "bg-accent/5 border-accent/30"
                              : week.status === "completed"
                              ? "bg-success/5 border-success/20"
                              : "bg-bg-1/50 border-border"
                          )}
                        >
                          {/* Week Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {week.status === "completed" ? (
                                <Check size={14} className="text-success" />
                              ) : week.status === "current" ? (
                                <Star size={14} className="text-accent" />
                              ) : (
                                <Lock size={14} className="text-text-muted" />
                              )}
                              <span className="text-caption font-medium text-text-primary">
                                Week {week.weekNumber}: {week.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-text-muted">
                              {week.completedCount}/{week.lessons.length}
                            </span>
                          </div>

                          {/* Lessons */}
                          <div className="flex gap-1.5">
                            {week.lessons.map((lesson) => (
                              <button
                                key={lesson.day}
                                onClick={() => handleLessonClick(lesson)}
                                disabled={!lesson.completed && !lesson.current}
                                className={cn(
                                  "flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-medium transition-all",
                                  lesson.completed
                                    ? "bg-success/20 text-success border border-success/30"
                                    : lesson.current
                                    ? "bg-accent/20 text-accent border border-accent/30 animate-pulse"
                                    : "bg-bg-1 text-text-muted border border-border"
                                )}
                              >
                                {lesson.completed ? (
                                  <Check size={12} />
                                ) : lesson.current ? (
                                  <Play size={12} />
                                ) : (
                                  <Lock size={10} />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lesson Detail Modal */}
      <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
        <DialogContent className="bg-bg-2 border-border max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-h2 text-text-primary">
              Day {selectedLesson?.day}: {selectedLesson?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20">
              <p className="text-caption text-accent font-medium mb-1">Pattern</p>
              <p className="text-body text-text-secondary">{selectedLesson?.pattern}</p>
            </div>

            <div className="flex items-center gap-2">
              {selectedLesson?.completed ? (
                <span className="flex items-center gap-1 text-caption text-success">
                  <Check size={14} />
                  Completed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-caption text-accent">
                  <Star size={14} />
                  Current lesson
                </span>
              )}
            </div>

            <Button variant="cta" size="full" onClick={startLesson}>
              <BookOpen size={16} className="mr-2" />
              {selectedLesson?.completed ? "Review Lesson" : "Start Lesson"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
