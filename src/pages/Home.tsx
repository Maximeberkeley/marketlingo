import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Gamepad2, Target, Sparkles, Loader2, Trophy, Award, CheckCircle2, BookOpen, Newspaper, FlaskConical, TrendingUp, Crown, Lock, Zap, MapPin } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { XPBadge } from "@/components/ui/XPBadge";
import { LessonCard } from "@/components/ui/LessonCard";
import { DuoProgressBar } from "@/components/ui/DuoProgressBar";
import { DuoButton } from "@/components/ui/DuoButton";
import { SlideReader } from "@/components/slides/SlideReader";
import { KeyPlayers } from "@/components/home/KeyPlayers";
import { DailyNews } from "@/components/home/DailyNews";
import { NotificationOnboarding } from "@/components/onboarding/NotificationOnboarding";
import { MentorChatOverlay } from "@/components/ai/MentorChatOverlay";
import { LeoCharacter, LeoAnim } from "@/components/mascot/LeoStateMachine";
import { Mentor, getMentorForContext } from "@/data/mentors";
import { getMarketEmoji, getMarketName, getMarketById } from "@/data/markets";
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

// Normalize sources — DB has mixed formats: plain URL strings or {label, url} objects
function normalizeSources(sources: any): { label: string; url: string }[] {
  if (!Array.isArray(sources)) return [];
  return sources.map((s: any) => {
    if (typeof s === 'string') {
      try {
        const url = new URL(s);
        return { label: url.hostname.replace('www.', ''), url: s };
      } catch {
        return { label: 'Source', url: s };
      }
    }
    if (s && typeof s === 'object' && s.url) {
      return { label: s.label || s.url, url: s.url };
    }
    return null;
  }).filter(Boolean) as { label: string; url: string }[];
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const { progress, availableDay, completeStack, updateStreak } = useUserProgress(selectedMarket || undefined);
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
        .select("selected_market, familiarity_level")
        .eq("id", user.id)
        .single();

      if (!profile?.selected_market) {
        navigate("/select-market");
        return;
      }
      
      if (!profile?.familiarity_level) {
        navigate("/select-familiarity");
        return;
      }
      
      setSelectedMarket(profile.selected_market);

      const market = profile.selected_market;

      // Get user's available day from progress (calendar-based)
      const { data: userProgress } = await supabase
        .from("user_progress")
        .select("start_date")
        .eq("user_id", user.id)
        .eq("market_id", market)
        .single();

      // Calculate available day from start_date
      let currentDay = 1;
      if (userProgress?.start_date) {
        const start = new Date(userProgress.start_date);
        const today = new Date();
        start.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        currentDay = Math.min(180, Math.max(1, diffDays + 1));
      }
      const dayTag = `day-${currentDay}`;

      // Fetch lesson stack for the user's current day (MICRO_LESSON with day-X tag)
      let { data: lessonStacks } = await supabase
        .from("stacks")
        .select(`id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)`)
        .eq("market_id", market)
        .contains("tags", ["MICRO_LESSON", dayTag])
        .not("published_at", "is", null)
        .limit(1);

      // If no exact day match, find the closest available lesson <= current day
      if (!lessonStacks?.[0]) {
        const { data: allLessons } = await supabase
          .from("stacks")
          .select(`id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)`)
          .eq("market_id", market)
          .contains("tags", ["MICRO_LESSON"])
          .not("published_at", "is", null);

        if (allLessons?.length) {
          // Parse day from tags and find closest lesson <= currentDay
          const lessonsWithDays = allLessons.map(stack => {
            const dayMatch = (stack.tags as string[])?.find(t => t.startsWith('day-'));
            const dayNum = dayMatch ? parseInt(dayMatch.replace('day-', ''), 10) : 999;
            return { ...stack, dayNum };
          });

          // Find the highest day <= currentDay, or fallback to lowest available
          const validLessons = lessonsWithDays.filter(l => l.dayNum <= currentDay);
          const selectedLesson = validLessons.length > 0
            ? validLessons.reduce((max, l) => l.dayNum > max.dayNum ? l : max)
            : lessonsWithDays.reduce((min, l) => l.dayNum < min.dayNum ? l : min);

          lessonStacks = [selectedLesson];
        }
      }

      if (lessonStacks?.[0]) {
        const stack = lessonStacks[0];
        setLessonStack({
          ...stack,
          tags: stack.tags || [],
          slides: ((stack.slides as any[]) || [])
            .sort((a, b) => a.slide_number - b.slide_number)
            .map(s => ({ ...s, sources: normalizeSources(s.sources) })),
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
            .map(s => ({ ...s, sources: normalizeSources(s.sources) })),
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
    
    // Don't award XP or update progress if it's a review
    if (isReviewMode) {
      toast.success("Great review! 📖");
      return;
    }
    
    // Check if minimum time was met (3 minutes = 180 seconds)
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
      
      // Trigger Pro promotion after lesson (checks internally if should show)
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
  const currentDay = availableDay;

  if (loading || authLoading) {
    return (
      <AppLayout>
        {/* Loading state within AppLayout inherits safe areas */}
        <div className="min-h-screen flex items-center justify-center state-container">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
        {/* Scrollable content with sticky-bottom-spacer to avoid CTA overlap */}
        <div className="screen-padding pt-4 pb-6 overflow-x-hidden w-full">
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between py-5"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getMarketEmoji(selectedMarket || "aerospace")}</span>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                {getMarketName(selectedMarket || "aerospace")}
              </h1>
              <p className="text-[11px] text-text-muted">Day {currentDay} of 180</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <XPBadge xp={xpData?.total_xp || 0} level={xpData?.current_level || 1} showLevel={false} />
            <StreakBadge count={streak} />
          </div>
        </motion.div>

        {/* Leo 2D Greeting — click to open mentor chat */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, type: "spring" }}
          className="flex flex-col items-center justify-center mb-4"
        >
          <button
            onClick={() => {
              const mentor = getMentorForContext(selectedMarket || "aerospace", selectedMarket || undefined);
              setActiveMentor(mentor);
            }}
            className="relative group focus:outline-none"
            aria-label="Chat with your mentor"
          >
            <LeoCharacter 
              size="lg" 
              animation={leoAnimation}
            />
            {/* Subtle tap hint */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-accent/20 border border-accent/30 backdrop-blur-sm"
            >
              <span className="text-[9px] font-semibold text-accent tracking-wide">TAP TO CHAT</span>
            </motion.div>
          </button>
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-text-secondary mt-5 text-center"
          >
            {leoMessage}
          </motion.p>
        </motion.div>

        {/* Journey + Stage Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-2"
        >
          {/* 180-day Journey Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-bg-2 to-bg-1 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-accent" />
                <span className="text-caption font-semibold text-text-primary">
                  Day {currentDay} of 180 &nbsp;·&nbsp; Month {Math.ceil(currentDay / 30)} of 6
                </span>
              </div>
              <span className="text-[10px] text-text-muted font-medium">{Math.round((currentDay / 180) * 100)}% complete</span>
            </div>
            <DuoProgressBar 
              progress={(currentDay / 180) * 100}
              size="sm" 
              colorScheme="accent"
              animated
            />
            <p className="text-[10px] text-text-muted mt-1.5">
              {currentDay === 1 
                ? "Your 6-month journey to investor-ready knowledge starts today" 
                : `${180 - currentDay} days left in your 6-month program`}
            </p>
          </div>

          {/* Startup Stage */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-bg-2 to-bg-1 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Crown size={14} className="text-yellow-400" />
                </motion.div>
                <span className="text-caption font-semibold text-text-primary">
                  Stage {currentStage.stage}: {currentStage.name}
                </span>
              </div>
              <span className="text-[10px] font-bold text-accent">{Math.round(stageProgress)}% to next</span>
            </div>
            <DuoProgressBar 
              progress={stageProgress} 
              size="sm" 
              colorScheme="accent"
              animated
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
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
            >
              <div className="flex items-center gap-4 mb-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                  transition={{ delay: 0.2 }}
                  className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg flex-shrink-0"
                >
                  <CheckCircle2 size={28} className="text-white" />
                </motion.div>
                <div>
                  <p className="text-lg font-bold text-text-primary">Lesson Complete! 🎉</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-body text-emerald-400 font-semibold">+{XP_REWARDS.LESSON_COMPLETE} XP earned</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <Zap size={16} /> Practice
                </DuoButton>
              </div>
            </motion.div>
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
            {/* Games Card - Enhanced */}
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                hapticFeedback("light");
                navigate("/games");
              }}
              className="relative overflow-hidden rounded-2xl text-left shadow-lg shadow-purple-500/10 border border-purple-500/30"
            >
              <img src={gamesHero} alt="Games" className="w-full h-32 object-cover object-[50%_30%]" />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/95 via-purple-900/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <p className="text-[10px] text-purple-300 font-bold tracking-wide">TRIVIA</p>
                <p className="text-base font-bold text-white">Games</p>
              </div>
              <motion.div
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-500/80 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Gamepad2 size={12} className="text-white" />
              </motion.div>
            </motion.button>

            {/* Drills Card - Enhanced */}
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                hapticFeedback("light");
                navigate("/drills");
              }}
              className="relative overflow-hidden rounded-2xl text-left shadow-lg shadow-amber-500/10 border border-amber-500/30"
            >
              <img src={drillsHero} alt="Drills" className="w-full h-32 object-cover object-[50%_30%]" />
              <div className="absolute inset-0 bg-gradient-to-t from-amber-900/95 via-amber-900/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <p className="text-[10px] text-amber-300 font-bold tracking-wide">SPEED</p>
                <p className="text-base font-bold text-white">Drills</p>
              </div>
              <motion.div
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500/80 flex items-center justify-center"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Zap size={12} className="text-white" />
              </motion.div>
            </motion.button>

            {/* Trainer Card - Enhanced Full Width */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                hapticFeedback("light");
                navigate("/trainer");
              }}
              className="relative overflow-hidden rounded-2xl text-left col-span-2 shadow-lg shadow-emerald-500/10 border border-emerald-500/30"
            >
              <img src={trainerHero} alt="Trainer" className="w-full h-28 object-cover object-[50%_30%]" />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/95 via-emerald-900/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-300 font-bold tracking-wide">STRATEGY</p>
                  <p className="text-base font-bold text-white">Trainer Scenarios</p>
                </div>
                <motion.div
                  className="w-8 h-8 rounded-full bg-emerald-500/80 flex items-center justify-center"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronRight size={16} className="text-white" />
                </motion.div>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Investment Lab Teaser - Pro Feature */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          onClick={() => navigate("/investment-lab")}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-full p-3 rounded-xl mb-5",
            isProUser 
              ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
              : "bg-gradient-to-r from-accent/5 to-purple-600/5 border border-accent/20"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isProUser ? "bg-emerald-500/20" : "bg-accent/20"
            )}>
              {isProUser ? (
                <TrendingUp size={20} className="text-emerald-400" />
              ) : (
                <Lock size={20} className="text-accent" />
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-body font-medium text-text-primary">Investment Lab</span>
                {isProUser ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/20 text-emerald-400">BONUS</span>
                ) : (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-gradient-to-r from-accent to-purple-600 text-white">
                    <Crown size={8} />
                    PRO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-muted">
                {isProUser ? "Become investment-ready • Optional extra XP" : "Unlock with Pro • Expert-level scenarios"}
              </p>
            </div>
            <ChevronRight size={18} className={isProUser ? "text-emerald-400/50" : "text-accent/50"} />
          </div>
        </motion.button>

        {/* Quick Links - Enhanced Duolingo Style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-5"
        >
          <h2 className="text-caption font-medium uppercase tracking-wider text-text-muted mb-3">
            Quick Access
          </h2>
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { icon: BookOpen, label: "Notes", path: "/notebook", color: "text-rose-400", iconBg: "bg-rose-500/20", borderColor: "border-rose-500/20" },
              { icon: Trophy, label: "Rank", path: "/leaderboard", color: "text-blue-400", iconBg: "bg-blue-500/15", borderColor: "border-blue-500/20" },
              { icon: Award, label: "Badges", path: "/achievements", color: "text-purple-400", iconBg: "bg-purple-500/15", borderColor: "border-purple-500/20" },
              ...(selectedMarket === "neuroscience" 
                ? [{ icon: FlaskConical, label: "FDA/IRB", path: "/regulatory-hub", color: "text-emerald-400", iconBg: "bg-emerald-500/15", borderColor: "border-emerald-500/20" }]
                : [{ icon: Newspaper, label: "News", path: "/summaries", color: "text-cyan-400", iconBg: "bg-cyan-500/15", borderColor: "border-cyan-500/20" }]
              ),
            ].map((item, index) => (
              <motion.button
                key={item.path}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 + index * 0.04 }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  hapticFeedback("light");
                  navigate(item.path);
                }}
                className={cn(
                  "flex flex-col items-center gap-2.5 py-4 rounded-[18px] bg-bg-2/60 border transition-all duration-200",
                  item.borderColor
                )}
              >
                {/* Icon Container - Centered with colored background */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-transform",
                  item.iconBg
                )}>
                  <item.icon size={22} className={item.color} />
                </div>
                <span className="text-caption text-text-secondary font-medium">{item.label}</span>
              </motion.button>
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
          marketName={getMarketName(selectedMarket || "aerospace")}
          dayNumber={currentDay}
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

      {/* Mentor Chat — triggered by tapping Leo */}
      <MentorChatOverlay
        mentor={activeMentor}
        onClose={() => setActiveMentor(null)}
        context={`${getMarketName(selectedMarket || "aerospace")} industry learning. Day ${currentDay} of 180.`}
        marketId={selectedMarket || undefined}
      />
    </AppLayout>
  );
}
