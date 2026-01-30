import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Gamepad2, Target, Sparkles, Loader2, Trophy, Award, CheckCircle2, BookOpen, Newspaper, FlaskConical, TrendingUp } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { XPBadge } from "@/components/ui/XPBadge";
import { LessonCard } from "@/components/ui/LessonCard";
import { SlideReader } from "@/components/slides/SlideReader";
import { KeyPlayers } from "@/components/home/KeyPlayers";
import { DailyNews } from "@/components/home/DailyNews";
import { NotificationOnboarding } from "@/components/onboarding/NotificationOnboarding";
import { MentorChatOverlay } from "@/components/ai/MentorChatOverlay";
import { LeoMascot, getRandomLeoMessage } from "@/components/mascot/LeoMascot";
import { Mentor } from "@/data/mentors";
import { getMarketEmoji, getMarketName, getMarketById } from "@/data/markets";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useUserXP, XP_REWARDS } from "@/hooks/useUserXP";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Import warm Duolingo-style images
import lessonHero from "@/assets/cards/lesson-hero.jpg";
import newsHero from "@/assets/cards/news-hero.jpg";
import gamesHero from "@/assets/cards/games-hero.jpg";
import drillsHero from "@/assets/cards/drills-hero.jpg";
import trainerHero from "@/assets/cards/trainer-hero.jpg";

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
  const [newsStack, setNewsStack] = useState<StackWithSlides | null>(null);
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

      // Fetch lesson stack (MICRO_LESSON)
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

      // Fetch news stack (DAILY_GAME for news-like content)
      const { data: newsStacks } = await supabase
        .from("stacks")
        .select(`id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)`)
        .eq("market_id", market)
        .contains("tags", ["DAILY_GAME"])
        .not("published_at", "is", null)
        .order("created_at", { ascending: true })
        .limit(1);

      if (newsStacks?.[0]) {
        const stack = newsStacks[0];
        setNewsStack({
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
    if (!user || !activeStack || !selectedMarket) return;
    const slide = activeStack.slides.find(s => s.slide_number === slideNum);
    await supabase.from("notes").insert({
      user_id: user.id,
      content: slide?.body || "",
      linked_label: `Slide ${slideNum}`,
      stack_id: activeStack.id,
      market_id: selectedMarket,
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
            <span className="text-2xl">{getMarketEmoji(selectedMarket || "aerospace")}</span>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                {getMarketName(selectedMarket || "aerospace")}
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

        {/* Today's Learning Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3 mb-5"
        >
          <h2 className="text-caption font-medium uppercase tracking-wider text-text-muted">
            Today's Learning
          </h2>
          
          {lessonCompletedToday ? (
            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-success" />
                <div>
                  <p className="text-body font-medium text-text-primary">Lesson done for today! 🎉</p>
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
                  Review Lesson
                </button>
                <button
                  onClick={() => navigate("/drills")}
                  className="flex-1 py-2 rounded-lg bg-accent/10 border border-accent/30 text-caption text-accent font-medium"
                >
                  Practice
                </button>
              </div>
            </div>
          ) : (
            /* Micro Lesson Card - only shown if not completed */
            lessonStack && (
              <LessonCard
                title="Micro Lesson"
                subtitle="Today's Lesson"
                headline={lessonStack.title}
                xp={XP_REWARDS.LESSON_COMPLETE}
                duration={lessonStack.duration_minutes || 5}
                imageSrc={lessonHero}
                colorScheme="purple"
                onClick={() => handleOpenStack(lessonStack)}
              />
            )
          )}
          
          {/* Daily Pattern (Industry Insight) Card - Always visible */}
          {newsStack && (
            <LessonCard
              title="Daily Pattern"
              subtitle="Industry Insight"
              headline={newsStack.title}
              xp={25}
              duration={newsStack.duration_minutes || 3}
              imageSrc={newsHero}
              colorScheme="blue"
              onClick={() => handleOpenStack(newsStack)}
            />
          )}
        </motion.div>

        {/* Activities Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-5"
        >
          <h2 className="text-caption font-medium uppercase tracking-wider text-text-muted mb-3">
            Practice & Play
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Games Card */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/games")}
              className="relative overflow-hidden rounded-xl text-left"
            >
              <img src={gamesHero} alt="Games" className="w-full h-28 object-cover object-[50%_30%]" />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-900/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-[10px] text-purple-300 font-medium">TRIVIA</p>
                <p className="text-sm font-semibold text-white">Games</p>
              </div>
            </motion.button>

            {/* Drills Card */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/drills")}
              className="relative overflow-hidden rounded-xl text-left"
            >
              <img src={drillsHero} alt="Drills" className="w-full h-28 object-cover object-[50%_30%]" />
              <div className="absolute inset-0 bg-gradient-to-t from-amber-900/90 via-amber-900/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-[10px] text-amber-300 font-medium">SPEED</p>
                <p className="text-sm font-semibold text-white">Drills</p>
              </div>
            </motion.button>

            {/* Trainer Card */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/trainer")}
              className="relative overflow-hidden rounded-xl text-left col-span-2"
            >
              <img src={trainerHero} alt="Trainer" className="w-full h-24 object-cover object-[50%_30%]" />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-900/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-300 font-medium">STRATEGY</p>
                  <p className="text-sm font-semibold text-white">Trainer Scenarios</p>
                </div>
                <ChevronRight size={18} className="text-white/70" />
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Investment Lab Teaser - Optional Bonus Feature */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          onClick={() => navigate("/investment-lab")}
          whileTap={{ scale: 0.98 }}
          className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-body font-medium text-text-primary">Investment Lab</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/20 text-emerald-400">BONUS</span>
              </div>
              <p className="text-[11px] text-text-muted">Become investment-ready • Optional extra XP</p>
            </div>
            <ChevronRight size={18} className="text-emerald-400/50" />
          </div>
        </motion.button>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-4 gap-2 mb-5"
        >
          {[
            { icon: BookOpen, label: "Notes", path: "/notebook", color: "text-rose-400", bg: "bg-rose-500/10" },
            { icon: Trophy, label: "Rank", path: "/leaderboard", color: "text-blue-400", bg: "bg-blue-500/10" },
            { icon: Award, label: "Badges", path: "/achievements", color: "text-purple-400", bg: "bg-purple-500/10" },
            ...(selectedMarket === "neuroscience" 
              ? [{ icon: FlaskConical, label: "FDA/IRB", path: "/regulatory-hub", color: "text-emerald-400", bg: "bg-emerald-500/10" }]
              : [{ icon: Newspaper, label: "News", path: "/summaries", color: "text-cyan-400", bg: "bg-cyan-500/10" }]
            ),
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-bg-2/50 border border-border"
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.bg)}>
                <item.icon size={16} className={item.color} />
              </div>
              <span className="text-[10px] text-text-secondary">{item.label}</span>
            </button>
          ))}
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
          marketId={selectedMarket || undefined}
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
        marketId={selectedMarket || undefined}
      />
    </AppLayout>
  );
}
