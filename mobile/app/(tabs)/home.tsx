import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Animated,
} from 'react-native';
import { DailyNews } from '../../components/home/DailyNews';
import { HomeSkeleton } from '../../components/home/HomeSkeleton';
import { AnimatedSection } from '../../components/home/AnimatedSection';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, TYPE, SHADOWS } from '../../lib/constants';
import { getMarketName } from '../../lib/markets';
import { useAuth } from '../../hooks/useAuth';
import { useUserProgress } from '../../hooks/useUserProgress';
import { useUserXP, XP_REWARDS } from '../../hooks/useUserXP';
import { StreakBadge } from '../../components/ui/StreakBadge';
import { XPBadge } from '../../components/ui/XPBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { SlideReaderV2 as SlideReader } from '../../components/slides/SlideReaderV2';
import { StreakAtRisk } from '../../components/home/StreakAtRisk';
import { SocialNudge } from '../../components/home/SocialNudge';
import { Feather } from '@expo/vector-icons';
import { SessionCompleteCard } from '../../components/home/SessionCompleteCard';
import { MilestoneShareCard } from '../../components/sharing/MilestoneShareCard';
import { DailyQuests } from '../../components/home/DailyQuests';
import { useDailyQuests } from '../../hooks/useDailyQuests';
import { useMilestoneSharing } from '../../hooks/useMilestoneSharing';
import { useHomeData } from '../../hooks/useHomeData';
import { useSessionFlow } from '../../hooks/useSessionFlow';
import { triggerHaptic } from '../../lib/haptics';
import { useStreakFreeze } from '../../hooks/useStreakFreeze';
import { playSound } from '../../lib/sounds';
import { useSpacedRepetition } from '../../hooks/useSpacedRepetition';
import { useOfflineCache } from '../../hooks/useOfflineCache';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';

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

  const [selectedMarketLocal, setSelectedMarketLocal] = useState<string | null>(null);
  const { progress, completeStack, updateStreak } = useUserProgress(selectedMarketLocal || undefined);
  const {
    xpData, dailyCompletion, completeLessonForToday,
    getCurrentStage, getProgressToNextStage, isLessonCompletedToday, addXP,
  } = useUserXP(selectedMarketLocal || undefined);

  const lessonCompletedToday = isLessonCompletedToday();
  const currentStage = getCurrentStage();
  const streak = progress?.current_streak || 0;

  const homeData = useHomeData(user?.id, progress, xpData, lessonCompletedToday);
  const {
    selectedMarket, isProUser, lessonStack, newsStack, newsItems,
    streakRiskHours, socialNudge, tomorrowLesson,
    loading, refreshing, currentDay, fetchData, onRefresh,
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

  const session = useSessionFlow({
    user, selectedMarket, lessonStack, progress, xpData,
    lessonCompletedToday, currentDay,
    completeStack, updateStreak, completeLessonForToday, addXP,
    checkStreakMilestone, checkLevelMilestone,
    xpRewardLessonComplete: XP_REWARDS.LESSON_COMPLETE,
    xpRewardStreakBonus: XP_REWARDS.STREAK_BONUS,
    onDataRefresh: async () => { await fetchData(); },
  });

  const { quests, completedCount, totalBonusXP, allComplete: allQuestsComplete } = useDailyQuests(
    dailyCompletion ?? null, streak
  );

  const [showStreakWarning, setShowStreakWarning] = useState(true);
  const [showSocialNudge, setShowSocialNudge] = useState(true);

  useEffect(() => {
    if (lessonCompletedToday) playSound('lessonComplete');
  }, [lessonCompletedToday]);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/'); return; }
    fetchData().then((result) => {
      if (result === 'onboarding') router.replace('/onboarding');
      else if (result === 'familiarity') router.replace('/onboarding/familiarity');
    });
  }, [user, authLoading]);

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
  const journeyProgress = ((currentDay || 1) / 180) * 100;

  return (
    <View style={styles.container}>
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
          isReview={lessonCompletedToday && session.activeStack.stack_type === 'LESSON'}
          isProUser={isProUser}
          onPaywallTrigger={() => { session.closeReader(); router.push('/subscription' as any); }}
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
          onContinue={session.dismissSessionComplete}
          onDismiss={session.dismissSessionComplete}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        >
          {/* ── Top bar: Streak + XP ── */}
          <View style={styles.topBar}>
            <StreakBadge count={streak} />
            <XPBadge xp={xpData?.total_xp || 0} level={xpData?.current_level || 1} />
          </View>

          {/* ── Leo + Greeting ── */}
          <AnimatedSection delay={0}>
            <View style={styles.leoSection}>
              <LeoCharacter
                size="lg"
                animation={lessonCompletedToday ? 'celebrating' : 'waving'}
              />
              <View style={styles.speechBubble}>
                <View style={styles.speechTail} />
                <Text style={styles.speechText}>{greeting}</Text>
              </View>
            </View>
          </AnimatedSection>

          {/* ── Streak Warning (urgent) ── */}
          {streakRiskHours !== null && showStreakWarning && !lessonCompletedToday && (
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
              style={styles.lessonCard}
              onPress={() => {
                triggerHaptic('medium');
                if (lessonStack) session.handleOpenStack(lessonStack);
              }}
              activeOpacity={0.92}
            >
              {/* Illustration */}
              <View style={styles.lessonIllustrationWrap}>
                <Image source={marketIllustration} style={styles.lessonIllustration} resizeMode="contain" />
              </View>

              {/* Content */}
              <View style={styles.lessonContent}>
                <Text style={styles.lessonOverline}>
                  {lessonCompletedToday ? '✓ COMPLETED' : `DAY ${currentDay} · ${getMarketName(selectedMarket || 'aerospace').toUpperCase()}`}
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
                  <View style={styles.lessonMetaItem}>
                    <Feather name="zap" size={12} color={COLORS.accent} />
                    <Text style={[styles.lessonMetaText, { color: COLORS.accent, fontWeight: '700' }]}>
                      +{XP_REWARDS.LESSON_COMPLETE} XP
                    </Text>
                  </View>
                </View>
              </View>

              {/* CTA */}
              <View style={[styles.lessonCTA, lessonCompletedToday && styles.lessonCTADone]}>
                <Text style={styles.lessonCTAText}>
                  {lessonCompletedToday ? 'Review' : 'Start'}
                </Text>
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
              allComplete={allQuestsComplete}
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
              <DailyNews marketId={selectedMarket} />
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
    alignItems: 'center', marginBottom: 24,
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
    backgroundColor: COLORS.bg2, borderRadius: 24,
    overflow: 'hidden', marginBottom: 16,
    borderWidth: 1.5, borderColor: COLORS.accent + '20',
    ...SHADOWS.lg,
  },
  lessonIllustrationWrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 24, paddingBottom: 8,
    backgroundColor: COLORS.bg1,
  },
  lessonIllustration: { width: 140, height: 140 },
  lessonContent: { padding: 20 },
  lessonOverline: {
    ...TYPE.overline, color: COLORS.accent, marginBottom: 8,
  },
  lessonTitle: {
    fontSize: 20, fontWeight: '800', color: COLORS.textPrimary,
    letterSpacing: -0.3, lineHeight: 26, marginBottom: 12,
  },
  lessonMeta: { flexDirection: 'row', gap: 16 },
  lessonMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lessonMetaText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  lessonCTA: {
    backgroundColor: COLORS.accent, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  lessonCTADone: { backgroundColor: COLORS.success },
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
