import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Gamepad2, Target, Sparkles, Loader2, Trophy, Award, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { XPBadge } from "@/components/ui/XPBadge";
import { StackCard } from "@/components/ui/StackCard";
import { SlideReader } from "@/components/slides/SlideReader";
import { KeyPlayers } from "@/components/home/KeyPlayers";
import { DailyNews } from "@/components/home/DailyNews";
import { NotificationOnboarding } from "@/components/onboarding/NotificationOnboarding";
import { MentorChatOverlay } from "@/components/ai/MentorChatOverlay";
import { Mentor } from "@/data/mentors";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useUserXP, XP_REWARDS, STARTUP_STAGES } from "@/hooks/useUserXP";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface StackWithSlides {
  id: string;
  title: string;
  stack_type: string;
  tags: string[];
  duration_minutes: number;
  slides: {
    slide_number: number;
    title: string;
    body: string;
    sources: { label: string; url: string }[];
  }[];
}

const marketIcons: Record<string, string> = {
  aerospace: "🚀",
  ai: "🤖",
  fintech: "💳",
  ev: "⚡",
  biotech: "🧬",
  energy: "☀️",
};

const marketNames: Record<string, string> = {
  aerospace: "Aerospace",
  ai: "AI Industry",
  fintech: "Fintech",
  ev: "Electric Vehicles",
  biotech: "Biotech",
  energy: "Clean Energy",
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const { progress, completeStack, updateStreak } = useUserProgress(selectedMarket || undefined);
  const { 
    xpData, 
    completeLessonForToday, 
    getCurrentStage, 
    getProgressToNextStage,
    isLessonCompletedToday,
    addXP 
  } = useUserXP(selectedMarket || undefined);
  const [showReader, setShowReader] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lessonStack, setLessonStack] = useState<StackWithSlides | null>(null);
  const [activeStack, setActiveStack] = useState<StackWithSlides | null>(null);
  const [showNotificationOnboarding, setShowNotificationOnboarding] = useState(false);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  
  const { isSupported, isRegistered } = useNotifications();
  const lessonCompletedToday = isLessonCompletedToday();
  const currentStage = getCurrentStage();
  const stageProgress = getProgressToNextStage();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market")
        .eq("id", user.id)
        .single();

      if (profile?.selected_market) {
        setSelectedMarket(profile.selected_market);
      } else {
        navigate("/select-market");
        return;
      }

      const market = profile.selected_market;

      // Fetch lesson stack
      const { data: lessonStacks } = await supabase
        .from("stacks")
        .select(`id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)`)
        .eq("market_id", market)
        .contains("tags", ["MICRO_LESSON"])
        .not("published_at", "is", null)
        .order("created_at", { ascending: true })
        .limit(1);

      if (lessonStacks?.[0]) {
        const stack = lessonStacks[0];
        setLessonStack({
          ...stack,
          tags: stack.tags || [],
          slides: ((stack.slides as any[]) || [])
            .sort((a, b) => a.slide_number - b.slide_number)
            .map(s => ({ ...s, sources: Array.isArray(s.sources) ? s.sources : [] })),
        });
      }

      setLoading(false);
      
      const notifDismissed = localStorage.getItem('notification_onboarding_dismissed');
      if (isSupported && !isRegistered && !notifDismissed) {
        setTimeout(() => setShowNotificationOnboarding(true), 1500);
      }
    };

    fetchData();
  }, [user, authLoading, navigate, isSupported, isRegistered]);

  const handleStackComplete = async () => {
    setShowReader(false);
    if (progress && activeStack) {
      await completeStack(activeStack.id);
      await updateStreak();
      await completeLessonForToday(activeStack.id);
      
      if ((progress.current_streak || 0) > 0) {
        await addXP(XP_REWARDS.STREAK_BONUS * (progress.current_streak || 1), "streak_bonus");
      }
    }
    toast.success("Lesson complete! 🔥");
    navigate("/drills");
  };

  const handleOpenStack = (stack: StackWithSlides) => {
    setActiveStack(stack);
    setShowReader(true);
  };

  const handleSaveInsight = async (slideNum: number) => {
    if (!user || !activeStack) return;
    const slide = activeStack.slides[slideNum - 1];
    await supabase.from("saved_insights").insert({
      user_id: user.id,
      title: slide?.title || `Insight`,
      content: slide?.body,
      stack_id: activeStack.id,
    });
    toast.success("Insight saved!");
  };

  const handleAddNote = async (slideNum: number) => {
    if (!user || !activeStack) return;
    const slide = activeStack.slides.find(s => s.slide_number === slideNum);
    await supabase.from("notes").insert({
      user_id: user.id,
      content: slide?.body || "",
      linked_label: `Slide ${slideNum}`,
      stack_id: activeStack.id,
    });
    toast.success("Note added!");
  };

  const streak = progress?.current_streak || 0;
  const currentDay = progress?.current_day || 1;

  if (loading || authLoading) {
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
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between py-4"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{marketIcons[selectedMarket || "aerospace"]}</span>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                {marketNames[selectedMarket || "aerospace"]}
              </h1>
              <p className="text-[11px] text-text-muted">Day {currentDay} of 180</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <XPBadge xp={xpData?.total_xp || 0} level={xpData?.current_level || 1} showLevel={false} />
            <StreakBadge count={streak} />
          </div>
        </motion.div>

        {/* Startup Progress - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-caption font-medium text-text-primary">
                Stage {currentStage.stage}: {currentStage.name}
              </span>
            </div>
            <span className="text-[11px] text-accent">{Math.round(stageProgress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-bg-1 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stageProgress}%` }}
              transition={{ duration: 0.6 }}
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent/60"
            />
          </div>
        </motion.div>

        {/* Today's Lesson Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          {lessonCompletedToday ? (
            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-success" />
                <div>
                  <p className="text-body font-medium text-text-primary">Done for today! 🎉</p>
                  <p className="text-caption text-text-muted">
                    +{XP_REWARDS.LESSON_COMPLETE} XP • Practice drills to reinforce
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => lessonStack && handleOpenStack(lessonStack)}
                  className="flex-1 py-2 rounded-lg bg-bg-1 border border-border text-caption text-text-secondary"
                >
                  Review
                </button>
                <button
                  onClick={() => navigate("/drills")}
                  className="flex-1 py-2 rounded-lg bg-accent/10 border border-accent/30 text-caption text-accent font-medium"
                >
                  Practice
                </button>
              </div>
            </div>
          ) : lessonStack ? (
            <StackCard
              title="Today's Lesson"
              subtitle={`${lessonStack.duration_minutes || 5} min • +${XP_REWARDS.LESSON_COMPLETE} XP`}
              headline={lessonStack.title}
              ctaText="Start"
              onClick={() => handleOpenStack(lessonStack)}
            />
          ) : (
            <div className="p-4 rounded-xl bg-bg-2 border border-border">
              <p className="text-body text-text-muted">Loading lesson...</p>
            </div>
          )}
        </motion.div>

        {/* Quick Actions Grid - 2x2 compact */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-4 gap-2 mb-5"
        >
          {[
            { icon: Gamepad2, label: "Games", path: "/games", color: "text-amber-400", bg: "bg-amber-500/10" },
            { icon: Target, label: "Drills", path: "/drills", color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { icon: Trophy, label: "Rank", path: "/leaderboard", color: "text-blue-400", bg: "bg-blue-500/10" },
            { icon: Award, label: "Badges", path: "/achievements", color: "text-purple-400", bg: "bg-purple-500/10" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-bg-2/50 border border-border"
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", item.bg)}>
                <item.icon size={18} className={item.color} />
              </div>
              <span className="text-[11px] text-text-secondary">{item.label}</span>
            </button>
          ))}
        </motion.div>

        {/* More Activities */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-caption font-medium uppercase tracking-wider text-text-muted">
              Explore
            </h2>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => navigate("/trainer")}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-2/50 border border-border"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Sparkles size={18} className="text-accent" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-body font-medium text-text-primary">Strategy Trainer</p>
                <p className="text-caption text-text-muted">Reasoning scenarios</p>
              </div>
              <ChevronRight size={16} className="text-text-muted" />
            </button>
          </div>
        </motion.div>

        {/* Key Players & News */}
        {selectedMarket && (
          <>
            <KeyPlayers marketId={selectedMarket} />
            <DailyNews marketId={selectedMarket} />
          </>
        )}
      </div>

      {/* Slide Reader */}
      {showReader && activeStack && (
        <SlideReader
          stackTitle={activeStack.title}
          stackType={activeStack.stack_type as "NEWS" | "HISTORY" | "LESSON"}
          slides={activeStack.slides.map(s => ({
            slideNumber: s.slide_number,
            title: s.title,
            body: s.body,
            sources: s.sources,
          }))}
          onClose={() => setShowReader(false)}
          onComplete={handleStackComplete}
          onSaveInsight={handleSaveInsight}
          onAddNote={handleAddNote}
        />
      )}

      {/* Notification Onboarding */}
      <NotificationOnboarding
        open={showNotificationOnboarding}
        onComplete={(enabled) => {
          setShowNotificationOnboarding(false);
          localStorage.setItem('notification_onboarding_dismissed', 'true');
          if (enabled) toast.success("Notifications enabled! 🔔");
        }}
      />

      {/* Mentor Chat */}
      <MentorChatOverlay
        mentor={activeMentor}
        onClose={() => setActiveMentor(null)}
        context={selectedMarket || "aerospace"}
      />
    </AppLayout>
  );
}
