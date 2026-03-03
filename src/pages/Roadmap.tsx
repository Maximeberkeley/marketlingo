import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ChevronDown, Check, Lock, Play, BookOpen, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeoCharacter } from "@/components/mascot/LeoStateMachine";

interface Lesson {
  day: number;
  title: string;
  pattern: string;
  completed: boolean;
  current: boolean;
  stackId?: string;
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

// Season themes for all 6 months
const SEASON_META = [
  { title: "Foundations", subtitle: "Month 1 • Core fundamentals" },
  { title: "Forces & Cycles", subtitle: "Month 2 • Market forces and timing" },
  { title: "Startup Patterns", subtitle: "Month 3 • Building in this market" },
  { title: "Key Players", subtitle: "Month 4 • Industry deep dives" },
  { title: "Investment Lens", subtitle: "Month 5 • Investor perspective" },
  { title: "Builder Mode", subtitle: "Month 6 • Apply everything" },
];

// Week titles for all 36 weeks
const WEEK_TITLES = [
  "Market Structure", "Certification Reality", "Business Dynamics", "Execution Patterns",
  "Regulation Deep Dive", "Capital Flows", "Talent Dynamics", "Technology Waves",
  "Moat Building", "GTM Strategies", "Failure Modes", "Success Stories",
  "Commercial Giants", "Defense Primes", "Space Innovators", "Supply Chain",
  "Public Markets", "Private Markets", "Due Diligence", "Portfolio Strategy",
  "Thesis Building", "Analysis Project", "Future Scenarios", "Graduation",
  "Advanced Topics I", "Advanced Topics II", "Case Studies I", "Case Studies II",
  "Emerging Trends", "Cross-Market", "Synthesis I", "Synthesis II",
  "Capstone I", "Capstone II", "Capstone III", "Final Review",
];

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
  const [completedStackIds, setCompletedStackIds] = useState<string[]>([]);

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

      const learningGoal = progress?.learning_goal || "curiosity";
      const goalTag = `goal:${learningGoal}`;
      const completed = (progress?.completed_stacks as string[]) || [];
      setCompletedStackIds(completed);

      // Calculate available day from start_date
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

      // Fetch all lesson stacks for this market with goal tag
      const { data: allStacks } = await supabase
        .from("stacks")
        .select("id, title, tags")
        .eq("market_id", market)
        .contains("tags", ["MICRO_LESSON"])
        .not("published_at", "is", null);

      // Build a map of day -> { title, stackId } preferring goal-tagged stacks
      const dayLessonMap = new Map<number, { title: string; stackId: string }>();
      
      allStacks?.forEach((stack: any) => {
        const tags = stack.tags as string[];
        const dayTag = tags?.find((t: string) => t.startsWith("day-"));
        if (!dayTag) return;
        const dayNum = parseInt(dayTag.replace("day-", ""), 10);
        if (isNaN(dayNum)) return;

        const hasGoalTag = tags.includes(goalTag);
        const existing = dayLessonMap.get(dayNum);
        
        // Prefer goal-tagged version, or set if no entry exists
        if (!existing || hasGoalTag) {
          dayLessonMap.set(dayNum, { title: stack.title, stackId: stack.id });
        }
      });

      const currentWeek = getDayWeek(day);

      // Build 6 seasons × 6 weeks × 5 days = 180 days
      const builtSeasons: Season[] = SEASON_META.map((meta, sIdx) => {
        const monthNum = sIdx + 1;
        const weeksPerMonth = 6; // 6 weeks × 5 days = 30 days per month
        const startWeek = sIdx * weeksPerMonth + 1;

        const weeks: Week[] = [];
        for (let w = 0; w < weeksPerMonth; w++) {
          const weekNum = startWeek + w;
          const startDay = (weekNum - 1) * 5 + 1;
          const days = [startDay, startDay + 1, startDay + 2, startDay + 3, startDay + 4];

          let status: "completed" | "current" | "locked" = "locked";
          if (weekNum < currentWeek) status = "completed";
          else if (weekNum === currentWeek) status = "current";

          const lessons: Lesson[] = days.map((d) => {
            const dbLesson = dayLessonMap.get(d);
            const isCompleted = dbLesson ? completed.includes(dbLesson.stackId) : d < day;
            return {
              day: d,
              title: dbLesson?.title || `Day ${d}`,
              pattern: "",
              completed: isCompleted,
              current: d === day,
              stackId: dbLesson?.stackId,
            };
          });

          const weekTitle = WEEK_TITLES[weekNum - 1] || `Week ${weekNum}`;

          weeks.push({
            weekNumber: weekNum,
            title: weekTitle,
            lessons,
            status,
            completedCount: lessons.filter((l) => l.completed).length,
          });
        }

        return {
          seasonNumber: monthNum,
          title: meta.title,
          subtitle: meta.subtitle,
          weeks,
          isExpanded: weeks.some((w) => w.status === "current"),
        };
      });

      setSeasons(builtSeasons);
      setLoading(false);
    };

    fetchProgress();
  }, [user]);

  const toggleSeason = (seasonNumber: number) => {
    setSeasons((prev) =>
      prev.map((s) =>
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

  const currentLessonTitle = seasons
    .flatMap((s) => s.weeks)
    .flatMap((w) => w.lessons)
    .find((l) => l.current)?.title;

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
            <LeoCharacter
              size="sm"
              animation={currentDay > 1 ? "success" : "idle"}
            />
          </div>
        </motion.div>

        {/* Current Lesson Card */}
        {currentLessonTitle && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-[11px] font-medium text-accent mb-1">CONTINUE LEARNING</p>
                <h3 className="text-body font-semibold text-text-primary">
                  {currentLessonTitle}
                </h3>
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
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold",
                      season.weeks.some((w) => w.status === "current")
                        ? "bg-accent/20 text-accent"
                        : season.weeks.every((w) => w.status === "completed")
                        ? "bg-success/20 text-success"
                        : "bg-bg-1 text-text-muted"
                    )}
                  >
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
