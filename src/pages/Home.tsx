import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Loader2, CheckCircle2, BookOpen, Newspaper, MapPin, Flame } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { XPBadge } from "@/components/ui/XPBadge";
import { DuoProgressBar } from "@/components/ui/DuoProgressBar";
import { DuoButton } from "@/components/ui/DuoButton";
import { SlideReader } from "@/components/slides/SlideReader";
import { KeyPlayers } from "@/components/home/KeyPlayers";
import { DailyNews } from "@/components/home/DailyNews";
import { SocialNudge } from "@/components/home/SocialNudge";
import { NotificationOnboarding } from "@/components/onboarding/NotificationOnboarding";
import { MentorChatOverlay } from "@/components/ai/MentorChatOverlay";
import { LeoCharacter, LeoAnim } from "@/components/mascot/LeoStateMachine";
import { Mentor, getMentorForContext } from "@/data/mentors";
import { getMarketEmoji, getMarketName } from "@/data/markets";
import { getMarketIllustration, getMarketAccent } from "@/data/marketIllustrations";
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
import { useMilestoneSharing } from "@/hooks/useMilestoneSharing";
import { MilestoneShareCard } from "@/components/sharing/MilestoneShareCard";
import { DailyQuests } from "@/components/home/DailyQuests";
import { QuickBiteSelector } from "@/components/home/QuickBiteSelector";
import { useDailyQuests } from "@/hooks/useDailyQuests";

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
    xpData, dailyCompletion, completeLessonForToday, getCurrentStage, 
    getProgressToNextStage, isLessonCompletedToday, addXP 
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
  const [socialNudge, setSocialNudge] = useState<{ name: string; xp: number } | null>(null);
  const [showSocialNudge, setShowSocialNudge] = useState(true);
  const [userGoal, setUserGoal] = useState<string | null>(null);
  
  const { isSupported, isRegistered } = useNotifications();
  const { triggerAfterLesson, isProUser } = useProPromotionContext();
  const { play } = useSoundEffects();
  const { milestone, dismissMilestone, checkStreakMilestone, checkLevelMilestone } = useMilestoneSharing();
  const lessonCompletedToday = isLessonCompletedToday();
  const currentStage = getCurrentStage();
  const stageProgress = getProgressToNextStage();

  const { quests, completedCount, totalBonusXP, allComplete: allQuestsComplete } = useDailyQuests(
    dailyCompletion ?? null,
    progress?.current_streak || 0
  );

  const [completedBites, setCompletedBites] = useState<number[]>([]);
  const [activeBiteIndex, setActiveBiteIndex] = useState<number | null>(null);

  useEffect(() => {
    const currentStreak = progress?.current_streak || 0;
    const hour = new Date().getHours();
    let greeting = "";
    let anim: LeoAnim = "idle";
    
    if (hour < 12) {
      greeting = "Good morning! Ready to learn?";
      anim = "waving";
    } else if (hour < 17) {
      greeting = "Good afternoon! Let's keep going!";
      anim = "idle";
    } else {
      greeting = "Evening study session!";
      anim = "idle";
    }
    
    if (currentStreak >= 7) {
      greeting = `${currentStreak}-day streak! You're on fire!`;
      anim = "celebrating";
    } else if (lessonCompletedToday) {
      greeting = "Great work today! Try practice?";
      anim = "success";
    }
    
    setLeoMessage(greeting);
    setLeoAnimation(anim);
  }, [progress?.current_streak, lessonCompletedToday]);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/"); return; }

    const fetchData = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles").select("selected_market, familiarity_level")
        .eq("id", user.id).single();

      if (!profile?.selected_market) { navigate("/select-market"); return; }
      if (!profile?.familiarity_level) { navigate("/select-familiarity"); return; }
      
      setSelectedMarket(profile.selected_market);
      const market = profile.selected_market;

      const { data: progressData } = await supabase
        .from("user_progress").select("start_date, learning_goal")
        .eq("user_id", user.id).eq("market_id", market).single();

      const learningGoal = progressData?.learning_goal || 'curiosity';
      setUserGoal(learningGoal);
      const goalTag = `goal:${learningGoal}`;

      let currentDay = 1;
      if (progressData?.start_date) {
        const start = new Date(progressData.start_date);
        const today = new Date();
        start.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        currentDay = Math.min(180, Math.max(1, diffDays + 1));
      }
      const dayTag = `day-${currentDay}`;

      // Fetch lesson stack
      let { data: lessonStacks } = await supabase
        .from("stacks")
        .select(`id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)`)
        .eq("market_id", market).contains("tags", ["MICRO_LESSON", dayTag, goalTag])
        .not("published_at", "is", null).limit(1);

      if (!lessonStacks?.[0]) {
        const { data: fallback } = await supabase
          .from("stacks")
          .select(`id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)`)
          .eq("market_id", market).contains("tags", ["MICRO_LESSON", dayTag])
          .not("published_at", "is", null).limit(1);
        lessonStacks = fallback;
      }

      if (!lessonStacks?.[0]) {
        const { data: allLessons } = await supabase
          .from("stacks")
          .select(`id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)`)
          .eq("market_id", market).contains("tags", ["MICRO_LESSON"])
          .not("published_at", "is", null);

        if (allLessons?.length) {
          const lessonsWithDays = allLessons.map(stack => {
            const dayMatch = (stack.tags as string[])?.find(t => t.startsWith('day-'));
            const dayNum = dayMatch ? parseInt(dayMatch.replace('day-', ''), 10) : 999;
            return { ...stack, dayNum };
          });
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
          ...stack, tags: stack.tags || [],
          slides: ((stack.slides as any[]) || [])
            .sort((a, b) => a.slide_number - b.slide_number)
            .map(s => ({ ...s, sources: normalizeSources(s.sources) })),
        });
      }

      const { data: newsStacks } = await supabase
        .from("stacks")
        .select(`id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)`)
        .eq("market_id", market).contains("tags", ["DAILY_GAME"])
        .not("published_at", "is", null).order("created_at", { ascending: true }).limit(1);

      if (newsStacks?.[0]) {
        const stack = newsStacks[0];
        setNewsStack({
          ...stack, tags: stack.tags || [],
          slides: ((stack.slides as any[]) || [])
            .sort((a, b) => a.slide_number - b.slide_number)
            .map(s => ({ ...s, sources: normalizeSources(s.sources) })),
        });
      }

      try {
        const { data: xpRow } = await supabase
          .from("user_xp").select("total_xp").eq("user_id", user.id).eq("market_id", market).single();
        if (xpRow?.total_xp) {
          const { data: rivals } = await supabase
            .from("user_xp").select("total_xp, user_id").eq("market_id", market)
            .gt("total_xp", xpRow.total_xp).order("total_xp", { ascending: true }).limit(1);
          if (rivals?.[0]) {
            const { data: rivalProfile } = await supabase
              .from("profiles").select("username").eq("id", rivals[0].user_id).single();
            setSocialNudge({ name: rivalProfile?.username?.split("@")[0] || "Someone", xp: rivals[0].total_xp });
          }
        }
      } catch {}

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
    if (isReviewMode) { toast.success("Great review! 📖"); return; }
    const MINIMUM_TIME = 180;
    if (timeSpentSeconds < MINIMUM_TIME) { toast.info("Keep learning! Spend at least 3 minutes to complete."); return; }
    
    if (progress && activeStack) {
      await completeStack(activeStack.id);
      const updatedProgress = await updateStreak();
      await completeLessonForToday(activeStack.id);
      if ((progress.current_streak || 0) > 0) await addXP(XP_REWARDS.STREAK_BONUS * (progress.current_streak || 1), "streak_bonus");
      const mktName = getMarketName(selectedMarket || "aerospace");
      const mktEmoji = getMarketEmoji(selectedMarket || "aerospace");
      const newStreak = (updatedProgress as any)?.current_streak || progress.current_streak || 0;
      checkStreakMilestone(newStreak, mktName, mktEmoji);
      if (xpData) checkLevelMilestone(xpData.current_level, mktName, mktEmoji);
      if (!isProUser) triggerAfterLesson(progress.current_day || 1);
    }
    toast.success("Lesson complete! 🔥");
    navigate("/drills");
  };

  const handleOpenStack = (stack: StackWithSlides) => { setActiveStack(stack); setActiveBiteIndex(null); setShowReader(true); };

  const handleOpenBite = (biteIndex: number) => {
    if (!lessonStack) return;
    const startIdx = biteIndex * 2;
    const biteSlides = lessonStack.slides.slice(startIdx, startIdx + 2);
    if (biteSlides.length === 0) return;
    setActiveStack({ ...lessonStack, title: `${lessonStack.title} — Bite ${biteIndex + 1}`, slides: biteSlides });
    setActiveBiteIndex(biteIndex);
    setShowReader(true);
  };

  const handleBiteComplete = (isReviewMode: boolean) => {
    setShowReader(false);
    if (isReviewMode || activeBiteIndex === null) return;
    if (!completedBites.includes(activeBiteIndex)) setCompletedBites(prev => [...prev, activeBiteIndex!]);
    addXP(10, "bite", undefined, `Quick Bite ${activeBiteIndex + 1}`);
    toast.success("Bite Complete! ⚡ +10 XP");
    setActiveBiteIndex(null);
  };

  const handleSaveInsight = async (slideNum: number) => {
    if (!user || !activeStack) return;
    const slide = activeStack.slides[slideNum - 1];
    await supabase.from("saved_insights").insert({ user_id: user.id, title: slide?.title || `Insight`, content: slide?.body, stack_id: activeStack.id });
    toast.success("Insight saved!");
  };

  const handleAddNote = async (slideNum: number) => {
    if (!user || !activeStack || !selectedMarket) return;
    const slide = activeStack.slides.find(s => s.slide_number === slideNum);
    await supabase.from("notes").insert({ user_id: user.id, content: slide?.body || "", linked_label: `Slide ${slideNum}`, stack_id: activeStack.id, market_id: selectedMarket });
    toast.success("Note added!");
  };

  const streak = progress?.current_streak || 0;
  const currentDay = availableDay;
  const marketAccent = getMarketAccent(selectedMarket || "aerospace");
  const illustration = getMarketIllustration(selectedMarket || "aerospace");

  if (loading || authLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="screen-padding pt-4 pb-6 overflow-x-hidden w-full max-w-lg mx-auto">
        
        {/* Header — Badges + Leo with speech bubble */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start justify-between pt-2 mb-4"
        >
          {/* Left: Stats */}
          <div className="flex items-center gap-2 pt-1">
            <StreakBadge count={streak} size="md" />
            <XPBadge xp={xpData?.total_xp || 0} level={xpData?.current_level || 1} showLevel={false} size="md" />
          </div>

          {/* Right: Leo with speech bubble */}
          <button
            onClick={() => {
              const mentor = getMentorForContext(selectedMarket || "aerospace", selectedMarket || undefined);
              setActiveMentor(mentor);
            }}
            className="relative flex items-center gap-2"
          >
            {/* Speech bubble */}
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
              className="relative bg-card border border-border rounded-2xl rounded-br-sm px-3 py-1.5 shadow-card max-w-[160px]"
            >
              <p className="text-[11px] text-text-secondary font-medium leading-snug">{leoMessage}</p>
              {/* Tail */}
              <div className="absolute -right-1 bottom-1 w-2.5 h-2.5 bg-card border-r border-b border-border rotate-[-45deg]" />
            </motion.div>
            <LeoCharacter size="sm" animation={leoAnimation} />
          </button>
        </motion.div>

        {/* Hero Card — Market illustration + lesson info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5"
        >
          {/* Status tag */}
          <div className="flex justify-center mb-2">
            <span className={cn("px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider", marketAccent.light, marketAccent.text)}>
              {lessonCompletedToday ? "✓ Completed" : `Day ${currentDay}`}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-center text-[22px] font-bold text-text-primary leading-tight mb-0.5">
            {lessonStack?.title || getMarketName(selectedMarket || "aerospace")}
          </h1>
          
          <p className="text-center text-[12px] text-text-muted font-medium mb-4">
            Level {xpData?.current_level || 1} · {getMarketName(selectedMarket || "aerospace")}
          </p>

          {/* Illustration */}
          <div className="flex justify-center mb-4">
            <motion.img
              src={illustration}
              alt={getMarketName(selectedMarket || "aerospace")}
              className="w-40 h-40 object-contain"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
            />
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i < Math.ceil(currentDay / 36) ? marketAccent.bg : "bg-border"
                )}
              />
            ))}
          </div>
        </motion.div>

        {/* Lesson Module Card — Clean bordered card like Brilliant */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-5 mb-5 shadow-card"
        >
          {lessonCompletedToday ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-success" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-text-primary">Lesson Complete!</p>
                  <p className="text-[12px] text-text-muted">+{XP_REWARDS.LESSON_COMPLETE} XP earned</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DuoButton variant="secondary" size="sm" fullWidth onClick={() => lessonStack && handleOpenStack(lessonStack)}>
                  Review
                </DuoButton>
                <DuoButton variant="success" size="sm" fullWidth onClick={() => navigate("/drills")}>
                  <Zap size={14} /> Practice
                </DuoButton>
              </div>
            </>
          ) : (
            <>
              {/* Current lesson item */}
              {lessonStack && (
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", marketAccent.light)}>
                    <BookOpen size={18} className={marketAccent.text} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-text-primary">{lessonStack.title}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-border" />
                </div>
              )}

              {/* Next lesson preview — muted */}
              {newsStack && (
                <div className="flex items-center gap-3 mb-4 opacity-50">
                  <div className="w-10 h-10 rounded-full bg-bg-1 flex items-center justify-center">
                    <Newspaper size={18} className="text-text-muted" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] text-text-muted">{newsStack.title}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-border" />
                </div>
              )}

              {/* Big Start button */}
              <DuoButton 
                variant="primary" 
                size="lg" 
                fullWidth 
                onClick={() => lessonStack && handleOpenStack(lessonStack)}
              >
                Start
              </DuoButton>
            </>
          )}
        </motion.div>

        {/* Quick Bites */}
        {lessonStack && !lessonCompletedToday && lessonStack.slides.length >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-5"
          >
            <QuickBiteSelector
              totalSlides={lessonStack.slides.length}
              completedBites={completedBites}
              onSelectBite={handleOpenBite}
              onFullLesson={() => handleOpenStack(lessonStack)}
              lessonTitle={lessonStack.title}
              isLessonComplete={lessonCompletedToday}
            />
          </motion.div>
        )}

        {/* Daily Quests */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="mb-5"
        >
          <DailyQuests
            quests={quests}
            completedCount={completedCount}
            totalBonusXP={totalBonusXP}
            allComplete={allQuestsComplete}
          />
        </motion.div>

        {/* Practice & Resources moved to /practice tab */}




        {/* Social Nudge */}
        {socialNudge && showSocialNudge && (
          <SocialNudge
            rivalName={socialNudge.name}
            rivalXP={socialNudge.xp}
            userXP={xpData?.total_xp || 0}
            marketName={getMarketName(selectedMarket || "aerospace")}
            onViewLeaderboard={() => navigate("/leaderboard")}
            onDismiss={() => setShowSocialNudge(false)}
          />
        )}

        {/* Journey Progress — Clean card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="rounded-2xl border border-border bg-card p-4 mb-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-primary" />
              <span className="text-[13px] font-semibold text-text-primary">
                Day {currentDay} of 180
              </span>
            </div>
            <span className="text-[11px] text-text-muted font-medium">{Math.round((currentDay / 180) * 100)}%</span>
          </div>
          <DuoProgressBar progress={(currentDay / 180) * 100} size="sm" colorScheme="accent" animated />
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
          slides={activeStack.slides.map(s => ({ slideNumber: s.slide_number, title: s.title, body: s.body, sources: s.sources }))}
          onClose={() => { setShowReader(false); setActiveBiteIndex(null); }}
          onComplete={activeBiteIndex !== null ? handleBiteComplete : handleStackComplete}
          onSaveInsight={handleSaveInsight}
          onAddNote={handleAddNote}
          marketId={selectedMarket || undefined}
          marketName={getMarketName(selectedMarket || "aerospace")}
          dayNumber={currentDay}
          isReview={lessonCompletedToday && activeStack.stack_type === "LESSON"}
        />
      )}

      <NotificationOnboarding
        open={showNotificationOnboarding}
        onComplete={(enabled) => {
          setShowNotificationOnboarding(false);
          localStorage.setItem('notification_onboarding_dismissed', 'true');
          if (enabled) toast.success("Notifications enabled! 🔔");
        }}
      />

      <MentorChatOverlay
        mentor={activeMentor}
        onClose={() => setActiveMentor(null)}
        context={`${getMarketName(selectedMarket || "aerospace")} industry learning. Day ${currentDay} of 180.`}
        marketId={selectedMarket || undefined}
      />

      <MilestoneShareCard
        visible={milestone.visible}
        type={milestone.type}
        data={milestone.data}
        onDismiss={dismissMilestone}
      />
    </AppLayout>
  );
}
