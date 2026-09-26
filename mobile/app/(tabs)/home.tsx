import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Animated,
  Alert,
} from 'react-native';
import { AchievementPopup } from '../../components/achievements/AchievementPopup';
import { HomeSkeleton } from '../../components/home/HomeSkeleton';
import { AnimatedSection } from '../../components/home/AnimatedSection';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, TYPE, SHADOWS } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { getMarketName } from '../../lib/markets';
import { useAuth } from '../../hooks/useAuth';
import { useUserProgress } from '../../hooks/useUserProgress';
import { useUserXP, XP_REWARDS } from '../../hooks/useUserXP';
import { StreakBadge } from '../../components/ui/StreakBadge';
import { XPBadge } from '../../components/ui/XPBadge';
import { WelcomeBackModal } from '../../components/home/WelcomeBackModal';
import { useReturnVisit } from '../../hooks/useReturnVisit';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LessonKitReader as SlideReader } from '../../components/slides/LessonKitReader';
import { StreakAtRisk } from '../../components/home/StreakAtRisk';
import { StreakCriticalTimer } from '../../components/home/StreakCriticalTimer';
import { SocialNudge } from '../../components/home/SocialNudge';
import { Feather } from '@expo/vector-icons';
import { SessionCompleteCard } from '../../components/home/SessionCompleteCard';
import { MilestoneShareCard } from '../../components/sharing/MilestoneShareCard';
import { DailyQuests } from '../../components/home/DailyQuests';
import { useDailyQuests } from '../../hooks/useDailyQuests';
import { useQuestRewards } from '../../hooks/useQuestRewards';
import { useMilestoneSharing } from '../../hooks/useMilestoneSharing';
import { useHomeData } from '../../hooks/useHomeData';
import { useSessionFlow } from '../../hooks/useSessionFlow';
import { triggerHaptic } from '../../lib/haptics';
import { useStreakFreeze } from '../../hooks/useStreakFreeze';
import { playSound } from '../../lib/sounds';
import { useSpacedRepetition } from '../../hooks/useSpacedRepetition';
import { useOfflineCache } from '../../hooks/useOfflineCache';
import { useDisplayName } from '../../hooks/useDisplayName';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';
import { FoxMascot } from '../../components/mascot/FoxMascot';
import { LeoPopup } from '../../components/mascot/LeoPopup';
import { useLeoPopups } from '../../hooks/useLeoPopups';
import { useAchievements } from '../../hooks/useAchievements';
import { LeoVoiceChatOverlay } from '../../components/ai/LeoVoiceChatOverlay';
import { log } from '../../lib/logger';
import { SundayRecapCard } from '../../components/home/SundayRecapCard';
import { LeagueCeremonyModal } from '../../components/league/LeagueCeremonyModal';
import { useLeague, TIER_META } from '../../hooks/useLeague';
import { useWeeklyRecap } from '../../hooks/useWeeklyRecap';
import { useCollectibles, CollectibleCard } from '../../hooks/useCollectibles';
import { CardRevealModal } from '../../components/collectibles/CardRevealModal';
import { LessonGoalsScreen } from '../../components/home/LessonGoalsScreen';
import { SpeechBubble } from '../../components/ui/SpeechBubble';
import { InsiderIdentityCard } from '../../components/home/InsiderIdentityCard';
import { useDeliverable } from '../../hooks/useDeliverable';
import { useFocusTopic } from '../../hooks/useFocusTopic';
import { FocusTopicCard } from '../../components/home/FocusTopicCard';
import { CourseJourney } from '../../components/course/CourseJourney';
import { useIntelHabit } from '../../hooks/useIntelHabit';
import { localDateString, streakCountdownLabel } from '../../lib/dayMath';
import { claimLeoNudge, currentLeoNudgeWindow, getLeoNudge } from '../../lib/leoNudges';


const MARKET_ILLUSTRATIONS: Record<string, any> = {
  aerospace: require('../../assets/illustrations/aerospace.png'),
  ai: require('../../assets/illustrations/ai.png'),
  biotech: require('../../assets/illustrations/biotech.png'),
  cleanenergy: require('../../assets/illustrations/cleanenergy.png'),
  fintech: require('../../assets/illustrations/fintech.png'),
  ev: require('../../assets/illustrations/ev.png'),
  cybersecurity: require('../../assets/illustrations/cybersecurity.png'),
  robotics: require('../../assets/illustrations/robotics.png'),
  spacetech: require('../../assets/illustrations/spacetech.png'),
  healthtech: require('../../assets/illustrations/healthtech.png'),
  web3: require('../../assets/illustrations/web3.png'),
  agtech: require('../../assets/illustrations/agtech.png'),
  logistics: require('../../assets/illustrations/logistics.png'),
  climatetech: require('../../assets/illustrations/climatetech.png'),
  neuroscience: require('../../assets/illustrations/neuroscience.png'),
};

const MARKET_GRADIENTS: Record<string, [string, string]> = {
  aerospace: ['#8B5CF6', '#6D28D9'],
  ai: ['#3B82F6', '#1D4ED8'],
  biotech: ['#EC4899', '#DB2777'],
  cleanenergy: ['#F59E0B', '#D97706'],
  fintech: ['#10B981', '#059669'],
  ev: ['#06B6D4', '#0891B2'],
  cybersecurity: ['#EF4444', '#DC2626'],
  robotics: ['#64748B', '#475569'],
  spacetech: ['#6366F1', '#4F46E5'],
  healthtech: ['#0EA5E9', '#0284C7'],
  web3: ['#7C3AED', '#6D28D9'],
  agtech: ['#22C55E', '#16A34A'],
  logistics: ['#F97316', '#EA580C'],
  climatetech: ['#14B8A6', '#0D9488'],
  neuroscience: ['#F43F5E', '#E11D48'],
};

// Leo messages — contextual
const LEO_GREETINGS = {
  morning: [
    "Rise and learn! Your industry awaits.",
    "Good morning! Let's make today count.",
    "Fresh day, fresh insights. Let's go!",
  ],
  afternoon: [
    "Perfect time for a quick lesson!",
    "Afternoon brain boost? I'm ready!",
    "Let's keep the momentum going!",
  ],
  evening: [
    "Wind down with some learning!",
    "Evening session? Love the dedication!",
    "One more lesson before rest?",
  ],
  completed: [
    "You crushed it today! Come back tomorrow.",
    "Lesson done! Your streak is safe.",
    "Great work! Rest up for tomorrow.",
  ],
};

function getRandomGreeting(key: keyof typeof LEO_GREETINGS): string {
  const msgs = LEO_GREETINGS[key];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();
  const { openStackId } = useLocalSearchParams<{ openStackId?: string }>();

  const [selectedMarketLocal, setSelectedMarketLocal] = useState<string | null>(null);
  const [revealedCard, setRevealedCard] = useState<Partial<CollectibleCard> | null>(null);
  const { progress, completeStack, updateStreak, refetch: refetchProgress } = useUserProgress(selectedMarketLocal || undefined);
  const {
    xpData, dailyCompletion, completeLessonForToday,
    getCurrentStage, getProgressToNextStage, isLessonCompletedToday, addXP,
    refetch: refetchXP,
  } = useUserXP(selectedMarketLocal || undefined);

  const lessonCompletedToday = isLessonCompletedToday();

  /** Day number a stack belongs to, from its own `day-N` tag. */
  const stackDayNumber = (stack: any): number | null => {
    const tag = ((stack?.tags as string[]) || []).find((t) => t.startsWith('day-'));
    const parsed = tag ? parseInt(tag.replace('day-', ''), 10) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  };
  const currentStage = getCurrentStage();
  const streak = progress?.current_streak || 0;

  const homeData = useHomeData(user?.id, progress, xpData, lessonCompletedToday);
  const {
    selectedMarket, isProUser, lessonStack, newsStack, newsItems,
    streakRiskHours, socialNudge, tomorrowLesson,
    loading, refreshing, currentDay, learningGoal, fetchData, onRefresh,
  } = homeData;
  const { evaluateRewards } = useCollectibles(selectedMarket || undefined);

  const { canFreeze, freezesUsedThisWeek, maxFreezes, useFreeze } = useStreakFreeze(
    selectedMarketLocal || undefined, isProUser
  );

  // Weekly league + Sunday recap
  const league = useLeague(selectedMarketLocal || undefined);
  const recap = useWeeklyRecap(selectedMarketLocal || undefined);
  const [recapDismissed, setRecapDismissed] = useState(false);
  const showRecap = recap.isRecapDay && !recap.loading && !recap.seen && !recapDismissed && recap.xpThisWeek >= 0;

  useEffect(() => {
    if (selectedMarket) setSelectedMarketLocal(selectedMarket);
  }, [selectedMarket]);

  const { dueCount } = useSpacedRepetition(selectedMarketLocal || undefined);
  const deliverable = useDeliverable(selectedMarketLocal || undefined, learningGoal);
  const focusTopic = useFocusTopic(selectedMarketLocal || undefined, currentDay || 1);
  const intelHabit = useIntelHabit(selectedMarketLocal || undefined);

  const { syncLessons } = useOfflineCache(selectedMarketLocal || undefined);

  useEffect(() => {
    if (currentDay && selectedMarket) syncLessons(currentDay);
  }, [currentDay, selectedMarket]);

  const { milestone, dismissMilestone, checkStreakMilestone, checkLevelMilestone } = useMilestoneSharing();

  const { checkAndUnlockAchievements, newUnlocks, clearNewUnlocks } = useAchievements();

  // Check achievements after session data changes
  useEffect(() => {
    if (!user || !xpData || !progress) return;
    const completedLessons = progress?.completed_stacks?.length || 0;
    checkAndUnlockAchievements({
      streak: progress?.current_streak || 0,
      xp: xpData?.total_xp || 0,
      lessons: completedLessons,
      drills: 0,
      games: 0,
      days: completedLessons,
      level: xpData?.current_level || 1,
    });
  }, [xpData?.total_xp, progress?.current_streak, progress?.completed_stacks?.length]);

  // Achievement popup state
  const [achievementPopup, setAchievementPopup] = useState<typeof newUnlocks[0] | null>(null);

  // Show achievement unlock popup
  useEffect(() => {
    if (newUnlocks.length > 0) {
      setAchievementPopup(newUnlocks[0]);
      clearNewUnlocks();
    }
  }, [newUnlocks]);

  const session = useSessionFlow({
    user, selectedMarket, lessonStack, progress, xpData,
    lessonCompletedToday: Boolean(dailyCompletion?.lesson_completed && dailyCompletion.completion_date === localDateString()), currentDay,
    completeStack, updateStreak, completeLessonForToday, addXP,
    checkStreakMilestone, checkLevelMilestone,
    xpRewardLessonComplete: XP_REWARDS.LESSON_COMPLETE,
    xpRewardStreakBonus: XP_REWARDS.STREAK_BONUS,
    onDataRefresh: async () => {
      await Promise.all([fetchData(), refetchXP()]);
    },
  });

  // Handle deep-link from roadmap: open a specific stack by ID
  const openStackHandled = useRef<string | null>(null);
  useEffect(() => {
    if (!openStackId || !selectedMarket || !user || session.showReader) return;
    if (openStackHandled.current === openStackId) return;
    openStackHandled.current = openStackId;

    (async () => {
      const { data: stack } = await supabase
        .from('stacks')
        .select('id, title, stack_type, tags, duration_minutes, metadata, slides (id, slide_number, title, body, sources)')
        .eq('id', openStackId)
        .not('published_at', 'is', null)
        .single();

      if (stack && (stack.slides as any[])?.length > 0) {
        const formatted = {
          ...stack,
          tags: stack.tags || [],
          slides: ((stack.slides as any[]) || [])
            .sort((a: any, b: any) => a.slide_number - b.slide_number)
            .map((s: any) => ({
              ...s,
              sources: Array.isArray(s.sources)
                ? s.sources.map((src: any) => typeof src === 'string' ? { label: 'Source', url: src } : src).filter(Boolean)
                : [],
            })),
        };
        session.handleOpenStack(formatted as any);
        router.setParams({ openStackId: undefined });
        openStackHandled.current = null;
      }
    })();
  }, [openStackId, selectedMarket, user]);

  const [showSocialNudge, setShowSocialNudge] = useState(true);
  const [showLeoChat, setShowLeoChat] = useState(false);
  const [courseFocused, setCourseFocused] = useState(true);
  const [clockNow, setClockNow] = useState(() => new Date());
  const refreshStreakData = useRef({ refetchXP, refetchProgress });
  refreshStreakData.current = { refetchXP, refetchProgress };
  useEffect(() => {
    const ticker = setInterval(() => setClockNow(new Date()), 15000);
    return () => clearInterval(ticker);
  }, []);

  useFocusEffect(useCallback(() => {
    setCourseFocused(true);
    setClockNow(new Date());
    void refreshStreakData.current.refetchXP();
    void refreshStreakData.current.refetchProgress();
    return () => setCourseFocused(false);
  }, []));

  // Crossing local midnight invalidates yesterday's completion even if the screen stays open.
  const clockDay = localDateString(clockNow);
  const completedOnClockDay = Boolean(dailyCompletion?.lesson_completed && dailyCompletion.completion_date === clockDay);
  useEffect(() => {
    if (clockDay !== localDateString()) return;
    void refreshStreakData.current.refetchXP();
    void refreshStreakData.current.refetchProgress();
  }, [clockDay]);
  const streakCountdown = streakCountdownLabel(streak, completedOnClockDay, clockNow);

  // Calculate if we're in the critical 2-hour window
  // Daily quests
  const { quests, completedCount, totalBonusXP, allComplete } = useDailyQuests(dailyCompletion, streak);
  // Bonus XP is banked as soon as a quest flips to complete (once per day).
  useQuestRewards(quests, selectedMarketLocal || selectedMarket, addXP);

  // Leo popup system
  const { displayName } = useDisplayName();
  const leoPopups = useLeoPopups({ cooldownMs: 45000, maxPerSession: 4, displayName });

  // The level recap appears after 4h away; XP remains visible in the top bar.
  const returnVisit = useReturnVisit(!!xpData && !loading);
  const hasTriggeredWelcome = useRef(false);

  const previousLessonComplete = useRef(lessonCompletedToday);
  useEffect(() => {
    if (lessonCompletedToday) {
      playSound('lessonComplete');
      leoPopups.clear();
      if (!previousLessonComplete.current) {
        void claimLeoNudge('completion').then(claimed => {
          if (claimed) leoPopups.triggerCompletionNod(() => leoPopups.dismiss());
        });
      }
    }
    previousLessonComplete.current = lessonCompletedToday;
  }, [lessonCompletedToday]);

  // Rolling Course nudges use the device's local clock and stop for the day
  // the instant the lesson is complete.
  useEffect(() => {
    if (loading || authLoading || hasTriggeredWelcome.current) return;
    if (!selectedMarket || !user) return;
    if (!courseFocused || session.showGoals || session.showReader || session.showSessionComplete) return;
    hasTriggeredWelcome.current = true;
    if (lessonCompletedToday) return;

    const openLesson = () => {
      if (lessonStack) session.handleOpenStack(lessonStack);
    };
    const timedWindow = currentLeoNudgeWindow();
    const timedTimer = timedWindow ? setTimeout(() => {
      void claimLeoNudge(`window:${timedWindow}`).then(claimed => {
        if (!claimed) return;
        const script = getLeoNudge(timedWindow, displayName);
        leoPopups.triggerSassyNudge(script.title, script.body, openLesson);
      });
    }, 6500) : null;
    const idleTimer = setTimeout(() => {
      void claimLeoNudge('idle').then(claimed => {
        if (!claimed) return;
        const script = getLeoNudge('idle', displayName);
        leoPopups.triggerSassyNudge(script.title, script.body, openLesson);
      });
    }, 90000);

    return () => {
      if (timedTimer) clearTimeout(timedTimer);
      clearTimeout(idleTimer);
    };
  }, [loading, authLoading, selectedMarket, user, lessonCompletedToday, lessonStack?.id, displayName, courseFocused, session.showGoals, session.showReader, session.showSessionComplete]);

  // Opening a lesson cancels the dashboard-idle nudge lifecycle until Course
  // is visible again; completion also clears any queued in-app messages.
  useEffect(() => {
    if (session.showGoals || session.showReader || lessonCompletedToday) leoPopups.clear();
  }, [session.showGoals, session.showReader, lessonCompletedToday]);

  // Guard against onboarding redirect loops: only redirect once per mount.
  // If the backend write from familiarity.tsx hasn't propagated yet, a second
  // bounce back here would create an infinite loop. Stay on home and let the
  // user retry from settings instead.
  const onboardingRedirectAttempted = useRef(false);
  useEffect(() => {
    if (!authLoading && !user) { router.replace('/'); return; }
    fetchData().then((result) => {
      if (result === 'onboarding' || result === 'familiarity') {
        if (onboardingRedirectAttempted.current) {
          log.warn('[Home] Skipping repeat onboarding redirect to avoid loop:', result);
          return;
        }
        onboardingRedirectAttempted.current = true;
        if (result === 'onboarding') router.replace('/onboarding');
        else router.replace('/onboarding/familiarity');
      }
    });
  }, [user, authLoading]);

  // Re-fetch when tab regains focus (after changing goal/level in profile)
  const hasLoadedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasLoadedOnce.current && user && !authLoading) {
        void Promise.all([fetchData(), refetchXP()]);
      }
      hasLoadedOnce.current = true;
    }, [user, authLoading, fetchData, refetchXP])
  );

  // Stable greeting (don't re-randomize on re-render)
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (lessonCompletedToday) return getRandomGreeting('completed');
    if (hour < 12) return getRandomGreeting('morning');
    if (hour < 17) return getRandomGreeting('afternoon');
    return getRandomGreeting('evening');
  });

  if (loading || authLoading) return <HomeSkeleton />;

  const marketIllustration = MARKET_ILLUSTRATIONS[selectedMarket || 'aerospace'] || MARKET_ILLUSTRATIONS.aerospace;
  const marketGradient = MARKET_GRADIENTS[selectedMarket || 'aerospace'] || MARKET_GRADIENTS.aerospace;
  const marketAccent = marketGradient[0];
  const journeyProgress = ((currentDay || 1) / 180) * 100;

  return (
    <View style={styles.container}>
      {/* Pro interstitial ad */}
      {/* Leo popup overlay */}
      <LeoPopup message={leoPopups.currentMessage} onDismiss={leoPopups.dismiss} />

      <WelcomeBackModal
        visible={returnVisit.isReturningVisit && !session.showReader}
        level={xpData?.current_level || 1}
        xp={xpData?.total_xp || 0}
        xpToNextLevel={(xpData as any)?.xp_to_next_level}
        streak={streak}
        marketId={selectedMarket || 'aerospace'}
        marketName={getMarketName(selectedMarket || 'aerospace')}
        onClose={returnVisit.dismiss}
      />
      {/* Leo voice chat — fullscreen immersive */}
      <LeoVoiceChatOverlay
        visible={showLeoChat}
        onClose={() => setShowLeoChat(false)}
        marketId={selectedMarket || undefined}
        lessonContext={`${getMarketName(selectedMarket || 'aerospace')} industry learning — Day ${currentDay}`}
      />
      <CardRevealModal card={revealedCard} marketId={selectedMarket || undefined} onClose={() => setRevealedCard(null)} />

      {session.showGoals && session.activeStack ? (
        <LessonGoalsScreen
          title={session.activeStack.title}
          slides={session.activeStack.slides}
          objectives={(session.activeStack as any).metadata?.learning_objectives}
          marketId={selectedMarket || undefined}
          day={currentDay}
          isBite={session.activeBiteIndex !== null}
          onStart={session.beginLesson}
          onBack={session.closeReader}
        />
      ) : session.showReader && session.activeStack ? (
        <SlideReader
          stackTitle={session.activeStack.title}
          stackType={session.activeStack.stack_type as 'NEWS' | 'HISTORY' | 'LESSON'}
          slides={session.activeStack.slides.map((s) => ({
            slideNumber: s.slide_number, title: s.title, body: s.body, sources: s.sources,
          }))}
          onClose={session.closeReader}
          onComplete={session.activeBiteIndex !== null
            ? session.handleBiteComplete
            : async (reviewMode, timeSpentSeconds, accuracy) => {
                const synced = await session.handleStackComplete(reviewMode, timeSpentSeconds);
                if (!synced || reviewMode || !selectedMarket || !session.activeStack?.id) return;
                const rewards = await evaluateRewards(
                  'lesson',
                  `lesson:${selectedMarket}:${session.activeStack.id}`,
                  accuracy,
                );
                if (rewards?.collectibles?.[0]) setRevealedCard(rewards.collectibles[0]);
              }}
          onSaveInsight={session.handleSaveInsight}
          onAddNote={session.handleAddNote}
          marketId={selectedMarket || undefined}
          stackId={session.activeStack.id}
          learningGoal={learningGoal}

          // Completed lessons reopen as review. An unfinished past lesson is
          // catch-up work and must still be able to count toward its section.
          isReview={(() => {
            return (progress?.completed_stacks || []).includes(session.activeStack.id);
          })()}
          isProUser={isProUser}
          streakDays={streak}
          dayNumber={stackDayNumber(session.activeStack) || currentDay}
          metadata={(session.activeStack as any).metadata}
        />
      ) : session.showSessionComplete ? (
        <SessionCompleteCard
          dayNumber={session.activeStack ? stackDayNumber(session.activeStack) || currentDay : currentDay}
          marketName={getMarketName(selectedMarket || 'aerospace')}
          marketEmoji=""
          xpEarned={session.sessionXPEarned}
          streak={streak}
          lessonTitle={session.activeStack?.title || lessonStack?.title || 'Lesson'}
          totalXP={xpData?.total_xp || 0}
          stageName={currentStage.name}
          onContinue={() => {
            session.dismissSessionComplete();
          }}
          onDismiss={() => {
            session.dismissSessionComplete();
          }}
        />
      ) : selectedMarket ? (
        <CourseJourney
          marketId={selectedMarket}
          currentDay={currentDay}
          learningGoal={learningGoal}
          completedStackIds={(progress?.completed_stacks as string[]) || []}
          streak={streak}
          totalXp={xpData?.total_xp || 0}
          level={xpData?.current_level || 1}
          lessonCompletedToday={completedOnClockDay}
          arenaCompletedToday={(dailyCompletion?.drills_completed || 0) > 0}
          caseCompletedToday={(dailyCompletion?.games_completed || 0) > 0}
          intelReadToday={intelHabit.readToday}
          intelTarget={intelHabit.target}
          rescueAvailable={Boolean(streakCountdown)}
          streakCountdown={streakCountdown}
          safeTop={insets.top}
          onOpenLesson={(stackId) => router.setParams({ openStackId: stackId })}
          onAskLeo={() => setShowLeoChat(true)}
        />
      ) : (
        <HomeSkeleton />
      )}

      <MilestoneShareCard
        visible={milestone.visible}
        type={milestone.type}
        data={milestone.data}
        onDismiss={dismissMilestone}
      />

      <AchievementPopup
        visible={!!achievementPopup}
        achievement={achievementPopup}
        onDismiss={() => setAchievementPopup(null)}
      />

      {league.lastWeek && (
        <LeagueCeremonyModal
          visible={league.ceremonyPending && !session.showReader}
          tier={league.lastWeek.tier}
          result={league.lastWeek.result}
          finalRank={league.lastWeek.finalRank}
          onClose={league.dismissCeremony}
          onViewLeague={() => { league.dismissCeremony(); router.push('/league'); }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  scrollContent: { paddingHorizontal: 20 },
  rescueLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: 'rgba(249,115,22,0.3)', backgroundColor: COLORS.orangeSoft,
    borderRadius: 14, paddingVertical: 12, marginBottom: 16,
  },
  rescueLinkText: { fontSize: 13, fontWeight: '700', color: COLORS.streak },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
    gap: 8, marginBottom: 20,
  },

  // Leo section
  leoSection: {
    alignItems: 'center', marginBottom: 16,
  },
  speechBubble: {
    maxWidth: '85%', marginTop: 8,
  },
  speechText: {
    ...TYPE.body, color: COLORS.textPrimary, textAlign: 'center', fontWeight: '500',
  },

  // Lesson card — the hero
  lessonCard: {
    backgroundColor: COLORS.bg2, borderRadius: 28,
    overflow: 'hidden', marginBottom: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 12,
  },
  lessonHero: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 28, paddingHorizontal: 20,
    position: 'relative',
    minHeight: 180,
  },
  heroOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  heroOrbLeft: {
    width: 200, height: 200,
    top: -60, left: -40,
  },
  heroOrbRight: {
    width: 160, height: 160,
    bottom: -40, right: -30,
  },
  lessonIllustration: { width: 180, height: 150, zIndex: 2 },
  dayBadge: {
    position: 'absolute', top: 16, right: 16,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 10, zIndex: 3,
  },
  dayBadgeText: {
    fontSize: 11, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: 1,
  },
  lessonContent: { padding: 18, paddingTop: 16 },
  lessonOverline: {
    ...TYPE.overline, marginBottom: 8,
  },
  lessonTitle: {
    fontSize: 21, fontWeight: '800', color: COLORS.textPrimary,
    letterSpacing: -0.4, lineHeight: 27, marginBottom: 14,
  },
  lessonMeta: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  lessonMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lessonMetaText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  xpChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  xpChipText: { fontSize: 12, fontWeight: '700' },
  lessonCTA: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 8,
  },
  lessonCTAText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },

  // Progress
  progressSection: { marginBottom: 20, paddingHorizontal: 4 },
  progressHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: { ...TYPE.caption, color: COLORS.textSecondary },
  progressPct: { ...TYPE.caption, color: COLORS.textMuted },

  // Review banner
  reviewBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.accentSoft, borderRadius: 14,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.accent + '15',
  },
  reviewText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },

  // Tomorrow
  tomorrowCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg1, borderRadius: 14,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tomorrowLabel: { ...TYPE.caption, color: COLORS.textMuted },
  tomorrowTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginTop: 2 },
});
