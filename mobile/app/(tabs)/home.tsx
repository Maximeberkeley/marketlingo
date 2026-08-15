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
import { DailyNews } from '../../components/home/DailyNews';
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
import { ProgressBar } from '../../components/ui/ProgressBar';
import { SlideReaderV2 as SlideReader } from '../../components/slides/SlideReaderV2';
import { StreakAtRisk } from '../../components/home/StreakAtRisk';
import { StreakCriticalTimer } from '../../components/home/StreakCriticalTimer';
import { SocialNudge } from '../../components/home/SocialNudge';
import { Feather } from '@expo/vector-icons';
import { SessionCompleteCard } from '../../components/home/SessionCompleteCard';
import { MilestoneShareCard } from '../../components/sharing/MilestoneShareCard';
import { DailyQuests } from '../../components/home/DailyQuests';
import { useDailyQuests } from '../../hooks/useDailyQuests';
import { useMilestoneSharing } from '../../hooks/useMilestoneSharing';
import { useHomeData } from '../../hooks/useHomeData';
import { useSessionFlow } from '../../hooks/useSessionFlow';
import { ProInterstitialAd } from '../../components/subscription/ProInterstitialAd';
import { triggerHaptic } from '../../lib/haptics';
import { useStreakFreeze } from '../../hooks/useStreakFreeze';
import { playSound } from '../../lib/sounds';
import { useSpacedRepetition } from '../../hooks/useSpacedRepetition';
import { useOfflineCache } from '../../hooks/useOfflineCache';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';
import { FoxMascot } from '../../components/mascot/FoxMascot';
import { LeoPopup } from '../../components/mascot/LeoPopup';
import { useLeoPopups } from '../../hooks/useLeoPopups';
import { useAchievements } from '../../hooks/useAchievements';
import { LeoVoiceChatOverlay } from '../../components/ai/LeoVoiceChatOverlay';
import { log } from '../../lib/logger';

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
  const { progress, completeStack, updateStreak } = useUserProgress(selectedMarketLocal || undefined);
  const {
    xpData, dailyCompletion, completeLessonForToday,
    getCurrentStage, getProgressToNextStage, isLessonCompletedToday, addXP,
    refetch: refetchXP,
  } = useUserXP(selectedMarketLocal || undefined);

  const lessonCompletedToday = isLessonCompletedToday();
  const currentStage = getCurrentStage();
  const streak = progress?.current_streak || 0;

  const homeData = useHomeData(user?.id, progress, xpData, lessonCompletedToday);
  const {
    selectedMarket, isProUser, lessonStack, newsStack, newsItems,
    streakRiskHours, socialNudge, tomorrowLesson,
    loading, refreshing, currentDay, learningGoal, fetchData, onRefresh,
  } = homeData;

  const { canFreeze, freezesUsedThisWeek, maxFreezes, useFreeze } = useStreakFreeze(
    selectedMarketLocal || undefined, isProUser
  );

  useEffect(() => {
    if (selectedMarket) setSelectedMarketLocal(selectedMarket);
  }, [selectedMarket]);

  const { dueCount } = useSpacedRepetition(selectedMarketLocal || undefined);
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
    lessonCompletedToday, currentDay,
    completeStack, updateStreak, completeLessonForToday, addXP,
    checkStreakMilestone, checkLevelMilestone,
    xpRewardLessonComplete: XP_REWARDS.LESSON_COMPLETE,
    xpRewardStreakBonus: XP_REWARDS.STREAK_BONUS,
    onDataRefresh: async () => { await Promise.all([fetchData(), refetchXP()]); },
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
      }
    })();
  }, [openStackId, selectedMarket, user]);

  const [showStreakWarning, setShowStreakWarning] = useState(true);
  const [showSocialNudge, setShowSocialNudge] = useState(true);
  const [showProAd, setShowProAd] = useState(false);
  const [showCriticalTimer, setShowCriticalTimer] = useState(true);
  const [showLeoChat, setShowLeoChat] = useState(false);

  // Calculate if we're in the critical 2-hour window
  const criticalTimerActive = (() => {
    if (!progress?.streak_expires_at || streak === 0 || lessonCompletedToday) return false;
    const expires = new Date(progress.streak_expires_at);
    const hoursLeft = (expires.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft <= 2;
  })();

  // Daily quests
  const { quests, completedCount, totalBonusXP, allComplete } = useDailyQuests(dailyCompletion, streak);

  // Leo popup system
  const leoPopups = useLeoPopups({ cooldownMs: 45000, maxPerSession: 4 });
  const hasTriggeredWelcome = useRef(false);

  useEffect(() => {
    if (lessonCompletedToday) playSound('lessonComplete');
  }, [lessonCompletedToday]);

  // Trigger contextual Leo popups — all interactive with CTAs
  useEffect(() => {
    if (loading || authLoading || hasTriggeredWelcome.current) return;
    if (!selectedMarket || !user) return;
    hasTriggeredWelcome.current = true;

    const timer = setTimeout(() => {
      // First popup: based on most important user context
      if (!lessonCompletedToday && streakRiskHours && streakRiskHours < 8) {
        leoPopups.triggerStreakProtect(streak, () => {
          if (lessonStack) session.handleOpenStack(lessonStack);
        });
      } else if (!lessonCompletedToday) {
        leoPopups.triggerStartLesson(currentDay, () => {
          if (lessonStack) session.handleOpenStack(lessonStack);
        });
      } else if (dueCount > 0) {
        leoPopups.triggerReviewDue(dueCount, () => {
          router.push('/(tabs)/practice' as any);
        });
      } else {
        leoPopups.triggerWriteNote(() => {
          router.push('/(tabs)/notebook' as any);
        });
      }

      // Second popup after 90s — social/game action
      setTimeout(() => {
        if (socialNudge) {
          leoPopups.triggerCheckLeaderboard(
            socialNudge.name?.split('@')[0] || 'A rival',
            () => router.push('/leaderboard' as any),
          );
        } else if (!lessonCompletedToday) {
          leoPopups.triggerAddFriends(() => {
            router.push('/friends' as any);
          });
        } else {
          leoPopups.triggerTryTrainer(() => {
            router.push('/(tabs)/practice' as any);
          });
        }
      }, 90000);
    }, 2500);

    return () => clearTimeout(timer);
  }, [loading, authLoading, selectedMarket, user]);

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
      <ProInterstitialAd visible={showProAd} onClose={() => setShowProAd(false)} trigger="lesson" />
      {/* Leo popup overlay */}
      <LeoPopup message={leoPopups.currentMessage} onDismiss={leoPopups.dismiss} />
      {/* Leo voice chat — fullscreen immersive */}
      <LeoVoiceChatOverlay
        visible={showLeoChat}
        onClose={() => setShowLeoChat(false)}
        marketId={selectedMarket || undefined}
        lessonContext={`${getMarketName(selectedMarket || 'aerospace')} industry learning — Day ${currentDay}`}
      />

      {session.showReader && session.activeStack ? (
        <SlideReader
          stackTitle={session.activeStack.title}
          stackType={session.activeStack.stack_type as 'NEWS' | 'HISTORY' | 'LESSON'}
          slides={session.activeStack.slides.map((s) => ({
            slideNumber: s.slide_number, title: s.title, body: s.body, sources: s.sources,
          }))}
          onClose={session.closeReader}
          onComplete={session.activeBiteIndex !== null ? session.handleBiteComplete : session.handleStackComplete}
          onSaveInsight={session.handleSaveInsight}
          onAddNote={session.handleAddNote}
          marketId={selectedMarket || undefined}
          stackId={session.activeStack.id}

          isReview={lessonCompletedToday && session.activeStack.stack_type === 'LESSON'}
          isProUser={isProUser}
          onPaywallTrigger={() => { session.closeReader(); router.push('/subscription' as any); }}
          dayNumber={currentDay}
          metadata={(session.activeStack as any).metadata}
        />
      ) : session.showSessionComplete ? (
        <SessionCompleteCard
          dayNumber={currentDay}
          marketName={getMarketName(selectedMarket || 'aerospace')}
          marketEmoji=""
          xpEarned={session.sessionXPEarned}
          streak={streak}
          lessonTitle={session.activeStack?.title || lessonStack?.title || 'Lesson'}
          totalXP={xpData?.total_xp || 0}
          stageName={currentStage.name}
          onContinue={() => {
            session.dismissSessionComplete();
            if (!isProUser) setTimeout(() => setShowProAd(true), 500);
          }}
          onDismiss={() => {
            session.dismissSessionComplete();
            if (!isProUser) setTimeout(() => setShowProAd(true), 500);
          }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        >
          {/* ── Top bar: Streak + XP + Pro ── */}
          <View style={styles.topBar}>
            <StreakBadge count={streak} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <XPBadge xp={xpData?.total_xp || 0} level={xpData?.current_level || 1} />
              {isProUser && (
                <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                  <Text style={{ color: '#8B5CF6', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>PRO</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Leo + Greeting ── */}
          <AnimatedSection delay={0}>
            <TouchableOpacity
              style={styles.leoSection}
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic('light');
                setShowLeoChat(true);
              }}
            >
              <FoxMascot industry={selectedMarket || 'aerospace'} size={200} />
              <View style={styles.speechBubble}>
                <View style={styles.speechTail} />
                <Text style={styles.speechText}>{greeting}</Text>
              </View>
            </TouchableOpacity>
          </AnimatedSection>

          {/* ── Critical Timer (last 2 hours) ── */}
          {criticalTimerActive && showCriticalTimer && progress?.streak_expires_at && (
            <AnimatedSection delay={30}>
              <StreakCriticalTimer
                streak={streak}
                expiresAt={progress.streak_expires_at}
                onStartLesson={() => lessonStack && session.handleOpenStack(lessonStack)}
                isProUser={isProUser}
                canUseLeoLogs={canFreeze}
                onUseLeoLogs={useFreeze}
              />
            </AnimatedSection>
          )}

          {/* ── Streak Warning (2-6 hours left, non-critical) ── */}
          {streakRiskHours !== null && !criticalTimerActive && showStreakWarning && !lessonCompletedToday && (
            <AnimatedSection delay={50}>
              <StreakAtRisk
                streak={streak}
                hoursLeft={streakRiskHours}
                onStartLesson={() => lessonStack && session.handleOpenStack(lessonStack)}
                onDismiss={() => setShowStreakWarning(false)}
              />
            </AnimatedSection>
          )}

          {/* ── THE Lesson Card — the ONE thing ── */}
          <AnimatedSection delay={100}>
            <TouchableOpacity
              style={[styles.lessonCard, { borderColor: marketAccent + '30' }]}
              onPress={() => {
                triggerHaptic('medium');
                if (lessonStack) session.handleOpenStack(lessonStack);
              }}
              activeOpacity={0.92}
            >
              {/* Hero illustration area with market-colored gradient */}
              <View style={[styles.lessonHero, { backgroundColor: marketAccent + '12' }]}>
                {/* Gradient orbs for depth */}
                <View style={[styles.heroOrb, styles.heroOrbLeft, { backgroundColor: marketAccent + '18' }]} />
                <View style={[styles.heroOrb, styles.heroOrbRight, { backgroundColor: marketGradient[1] + '15' }]} />
                
                {/* Large illustration */}
                <Image source={marketIllustration} style={styles.lessonIllustration} resizeMode="contain" />
                
                {/* Day badge overlay */}
                <View style={[styles.dayBadge, { backgroundColor: marketAccent }]}>
                  <Text style={styles.dayBadgeText}>DAY {currentDay}</Text>
                </View>
              </View>

              {/* Content */}
              <View style={styles.lessonContent}>
                <Text style={[styles.lessonOverline, { color: marketAccent }]}>
                  {lessonCompletedToday ? '✓ COMPLETED' : getMarketName(selectedMarket || 'aerospace').toUpperCase()}
                </Text>
                <Text style={styles.lessonTitle} numberOfLines={2}>
                  {lessonStack?.title || 'Loading lesson...'}
                </Text>
                <View style={styles.lessonMeta}>
                  <View style={styles.lessonMetaItem}>
                    <Feather name="clock" size={12} color={COLORS.textMuted} />
                    <Text style={styles.lessonMetaText}>~5 min</Text>
                  </View>
                  <View style={styles.lessonMetaItem}>
                    <Feather name="layers" size={12} color={COLORS.textMuted} />
                    <Text style={styles.lessonMetaText}>{lessonStack?.slides?.length || 6} slides</Text>
                  </View>
                  <View style={[styles.xpChip, { backgroundColor: marketAccent + '15' }]}>
                    <Feather name="zap" size={12} color={marketAccent} />
                    <Text style={[styles.xpChipText, { color: marketAccent }]}>
                      +{XP_REWARDS.LESSON_COMPLETE} XP
                    </Text>
                  </View>
                </View>
              </View>

              {/* CTA */}
              <View style={[styles.lessonCTA, { backgroundColor: lessonCompletedToday ? COLORS.success : marketAccent }]}>
                <Text style={styles.lessonCTAText}>
                  {lessonCompletedToday ? 'Review Lesson' : 'Start Today\'s Lesson'}
                </Text>
                <Feather name={lessonCompletedToday ? "refresh-cw" : "arrow-right"} size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </AnimatedSection>

          {/* ── Progress bar (minimal) ── */}
          <AnimatedSection delay={150}>
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Day {currentDay} of 180</Text>
                <Text style={styles.progressPct}>{Math.round(journeyProgress)}%</Text>
              </View>
              <ProgressBar progress={journeyProgress} height={4} />
            </View>
          </AnimatedSection>

          {/* ── Review prompt (if due) ── */}
          {dueCount > 0 && (
            <AnimatedSection delay={180}>
              <TouchableOpacity
                style={styles.reviewBanner}
                onPress={() => router.push('/trainer' as any)}
                activeOpacity={0.8}
              >
                <Feather name="refresh-cw" size={18} color={COLORS.accent} />
                <Text style={styles.reviewText}>
                  {dueCount} concept{dueCount !== 1 ? 's' : ''} ready for review
                </Text>
                <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </AnimatedSection>
          )}

          {/* ── Social Nudge (rival competition) ── */}
          {socialNudge && showSocialNudge && !lessonCompletedToday && (
            <AnimatedSection delay={210}>
              <SocialNudge
                rivalName={socialNudge.name?.split('@')[0] || 'Someone'}
                rivalXP={socialNudge.xp}
                userXP={xpData?.total_xp || 0}
                marketName={getMarketName(selectedMarket || 'aerospace')}
                onViewLeaderboard={() => router.push('/leaderboard' as any)}
                onDismiss={() => setShowSocialNudge(false)}
              />
            </AnimatedSection>
          )}

          {/* ── Daily Quests ── */}
          <AnimatedSection delay={220}>
            <DailyQuests
              quests={quests}
              completedCount={completedCount}
              totalBonusXP={totalBonusXP}
              allComplete={allComplete}
            />
          </AnimatedSection>

          {/* ── Tomorrow preview (after lesson complete) ── */}
          {lessonCompletedToday && tomorrowLesson && (
            <AnimatedSection delay={280}>
              <View style={styles.tomorrowCard}>
                <Feather name="sunrise" size={18} color={COLORS.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tomorrowLabel}>Coming tomorrow</Text>
                  <Text style={styles.tomorrowTitle} numberOfLines={1}>{tomorrowLesson.title}</Text>
                </View>
              </View>
            </AnimatedSection>
          )}

          {/* ── News (compact) ── */}
          {selectedMarket && (
            <AnimatedSection delay={320}>
              <View style={{ marginTop: 12 }}>
                <DailyNews marketId={selectedMarket} learningGoal={learningGoal} />
              </View>
            </AnimatedSection>
          )}
        </ScrollView>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  scrollContent: { paddingHorizontal: 20 },

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
    backgroundColor: COLORS.bg1, borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 8,
    borderWidth: 1, borderColor: COLORS.border,
    maxWidth: '85%', position: 'relative',
  },
  speechTail: {
    position: 'absolute', top: -7, alignSelf: 'center', left: '50%', marginLeft: -7,
    width: 0, height: 0,
    borderLeftWidth: 7, borderRightWidth: 7, borderBottomWidth: 7,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: COLORS.bg1,
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
