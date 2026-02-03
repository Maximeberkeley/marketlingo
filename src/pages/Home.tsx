import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Gamepad2, Target, Loader2, Trophy, Award, CheckCircle2, BookOpen, Newspaper, FlaskConical, TrendingUp, Crown, Lock, Zap, Play } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { XPBadge } from "@/components/ui/XPBadge";
import { DuoButton } from "@/components/ui/DuoButton";
import { SlideReader } from "@/components/slides/SlideReader";
import { KeyPlayers } from "@/components/home/KeyPlayers";
import { DailyNews } from "@/components/home/DailyNews";
import { NotificationOnboarding } from "@/components/onboarding/NotificationOnboarding";
import { MentorChatOverlay } from "@/components/ai/MentorChatOverlay";
import { LeoCharacter, LeoAnim } from "@/components/mascot/LeoStateMachine";
import { Mentor } from "@/data/mentors";
import { getMarketEmoji, getMarketName } from "@/data/markets";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useUserXP, XP_REWARDS } from "@/hooks/useUserXP";
import { useNotifications } from "@/hooks/useNotifications";
import { useProPromotionContext } from "@/components/subscription/ProPromotionProvider";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { hapticFeedback } from "@/lib/ios-utils";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Import hero images
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
  const [leoMessage, setLeoMessage] = useState<string>("");
  const [leoAnimation, setLeoAnimation] = useState<LeoAnim>("idle");
  
  const { isSupported, isRegistered } = useNotifications();
  const { triggerAfterLesson, isProUser } = useProPromotionContext();
  const { play } = useSoundEffects();
  const lessonCompletedToday = isLessonCompletedToday();
  const currentStage = getCurrentStage();
  const stageProgress = getProgressToNextStage();

  // Set Leo's greeting based on time of day and streak
  useEffect(() => {
    const currentStreak = progress?.current_streak || 0;
    const hour = new Date().getHours();
    let greeting = "";
    let anim: LeoAnim = "idle";
    
    if (hour < 12) {
      greeting = "Good morning! Ready to learn? ☀️";
      anim = "waving";
    } else if (hour < 17) {
      greeting = "Good afternoon! Let's keep going! 🚀";
      anim = "idle";
    } else {
      greeting = "Evening study session! 🌙";
      anim = "idle";
    }
    
    if (currentStreak >= 7) {
      greeting = `${currentStreak} day streak! You're on fire! 🔥`;
      anim = "celebrating";
    } else if (lessonCompletedToday) {
      greeting = "Lesson done! Try a game? 🎮";
      anim = "success";
    }
    
    setLeoMessage(greeting);
    setLeoAnimation(anim);
  }, [progress?.current_streak, lessonCompletedToday]);

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

  const handleStackComplete = async (isReviewMode: boolean, timeSpentSeconds: number) => {
    setShowReader(false);
    
    if (isReviewMode) {
      toast.success("Great review! 📖");
      return;
    }
    
    const MINIMUM_TIME = 180;
    if (timeSpentSeconds < MINIMUM_TIME) {
      toast.info("Keep learning! Spend at least 3 minutes to complete the lesson.");
      return;
    }
    
    if (progress && activeStack) {
      await completeStack(activeStack.id);
      await updateStreak();
      await completeLessonForToday(activeStack.id);
      
      if ((progress.current_streak || 0) > 0) {
        await addXP(XP_REWARDS.STREAK_BONUS * (progress.current_streak || 1), "streak_bonus");
      }
      
      if (!isProUser) {
        triggerAfterLesson(progress.current_day || 1);
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
      <div className="px-5 pt-safe pb-28 w-full">
        {/* Header - Clean & Simple */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between py-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getMarketEmoji(selectedMarket || "aerospace")}</span>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                {getMarketName(selectedMarket || "aerospace")}
              </h1>
              <p className="text-xs text-text-muted">Day {currentDay} of 180</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <XPBadge xp={xpData?.total_xp || 0} level={xpData?.current_level || 1} showLevel={false} />
            <StreakBadge count={streak} />
          </div>
        </motion.div>

        {/* Leo Greeting - Compact */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col items-center py-4"
        >
          <LeoCharacter size="lg" animation={leoAnimation} />
          <p className="text-sm text-text-secondary mt-2 text-center">{leoMessage}</p>
        </motion.div>

        {/* Progress Bar - Simple & Clean */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-4 rounded-2xl bg-bg-2 border border-border"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">
              Stage {currentStage.stage}: {currentStage.name}
            </span>
            <span className="text-sm font-bold text-accent">{Math.round(stageProgress)}%</span>
          </div>
          <div className="h-2 bg-bg-1 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stageProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-accent rounded-full"
            />
          </div>
        </motion.div>

        {/* Today's Learning */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="space-y-3 mb-6"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Today's Learning
          </h2>
          
          {lessonCompletedToday ? (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle2 size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-text-primary">Lesson Complete! 🎉</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Zap size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm text-emerald-400 font-medium">+{XP_REWARDS.LESSON_COMPLETE} XP</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DuoButton
                  variant="secondary"
                  size="md"
                  onClick={() => lessonStack && handleOpenStack(lessonStack)}
                  fullWidth
                >
                  Review
                </DuoButton>
                <DuoButton
                  variant="success"
                  size="md"
                  onClick={() => navigate("/drills")}
                  fullWidth
                >
                  Practice
                </DuoButton>
              </div>
            </div>
          ) : (
            lessonStack && (
              <button
                onClick={() => handleOpenStack(lessonStack)}
                className="w-full rounded-2xl overflow-hidden bg-bg-2 border border-border active:scale-[0.98] transition-transform"
              >
                <div className="relative h-28">
                  <img src={lessonHero} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-2 via-bg-2/60 to-transparent" />
                </div>
                <div className="p-4 -mt-8 relative">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium">
                      +{XP_REWARDS.LESSON_COMPLETE} XP
                    </span>
                    <span className="text-xs text-text-muted">{lessonStack.duration_minutes || 5} min</span>
                  </div>
                  <h3 className="text-base font-bold text-text-primary mb-1">Micro Lesson</h3>
                  <p className="text-sm text-text-secondary line-clamp-1">{lessonStack.title}</p>
                </div>
              </button>
            )
          )}
          
          {newsStack && (
            <button
              onClick={() => handleOpenStack(newsStack)}
              className="w-full p-4 rounded-2xl bg-bg-2 border border-border flex items-center gap-4 active:scale-[0.98] transition-transform"
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                <img src={newsHero} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-blue-400">Daily Pattern</span>
                  <span className="text-xs text-text-muted">• {newsStack.duration_minutes || 3} min</span>
                </div>
                <p className="text-sm font-medium text-text-primary line-clamp-1">{newsStack.title}</p>
              </div>
              <ChevronRight size={18} className="text-text-muted" />
            </button>
          )}
        </motion.div>

        {/* Practice Grid - Clean Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            Practice & Play
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Games */}
            <button
              onClick={() => { hapticFeedback("light"); navigate("/games"); }}
              className="relative overflow-hidden rounded-2xl bg-bg-2 border border-border active:scale-[0.97] transition-transform"
            >
              <img src={gamesHero} alt="" className="w-full h-24 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-2 via-bg-2/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-[10px] text-purple-400 font-semibold uppercase">Trivia</p>
                <p className="text-sm font-bold text-text-primary">Games</p>
              </div>
            </button>

            {/* Drills */}
            <button
              onClick={() => { hapticFeedback("light"); navigate("/drills"); }}
              className="relative overflow-hidden rounded-2xl bg-bg-2 border border-border active:scale-[0.97] transition-transform"
            >
              <img src={drillsHero} alt="" className="w-full h-24 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-2 via-bg-2/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-[10px] text-amber-400 font-semibold uppercase">Speed</p>
                <p className="text-sm font-bold text-text-primary">Drills</p>
              </div>
            </button>

            {/* Trainer - Full Width */}
            <button
              onClick={() => { hapticFeedback("light"); navigate("/trainer"); }}
              className="col-span-2 relative overflow-hidden rounded-2xl bg-bg-2 border border-border active:scale-[0.98] transition-transform"
            >
              <img src={trainerHero} alt="" className="w-full h-20 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-2 via-bg-2/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-400 font-semibold uppercase">Strategy</p>
                  <p className="text-sm font-bold text-text-primary">Trainer Scenarios</p>
                </div>
                <ChevronRight size={18} className="text-text-muted" />
              </div>
            </button>
          </div>
        </motion.div>

        {/* Investment Lab - Simple Banner */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          onClick={() => navigate("/investment-lab")}
          className="w-full p-4 rounded-2xl bg-bg-2 border border-border flex items-center gap-3 mb-6 active:scale-[0.98] transition-transform"
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isProUser ? "bg-emerald-500/20" : "bg-accent/20"
          )}>
            {isProUser ? (
              <TrendingUp size={20} className="text-emerald-400" />
            ) : (
              <Lock size={18} className="text-accent" />
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">Investment Lab</span>
              {!isProUser && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent text-white">PRO</span>
              )}
            </div>
            <p className="text-xs text-text-muted">
              {isProUser ? "Practice real scenarios" : "Unlock with Pro"}
            </p>
          </div>
          <ChevronRight size={18} className="text-text-muted" />
        </motion.button>

        {/* Quick Access - Simple Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            Quick Access
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: BookOpen, label: "Notes", path: "/notebook", color: "text-rose-400" },
              { icon: Trophy, label: "Rank", path: "/leaderboard", color: "text-blue-400" },
              { icon: Award, label: "Badges", path: "/achievements", color: "text-purple-400" },
              ...(selectedMarket === "neuroscience" 
                ? [{ icon: FlaskConical, label: "FDA/IRB", path: "/regulatory-hub", color: "text-emerald-400" }]
                : [{ icon: Newspaper, label: "News", path: "/summaries", color: "text-cyan-400" }]
              ),
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => { hapticFeedback("light"); navigate(item.path); }}
                className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-bg-2 border border-border active:scale-95 transition-transform"
              >
                <item.icon size={22} className={item.color} />
                <span className="text-xs text-text-secondary">{item.label}</span>
              </button>
            ))}
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
          marketId={selectedMarket || undefined}
          isReview={lessonCompletedToday && activeStack.stack_type === "LESSON"}
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
