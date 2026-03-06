import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { KeyPlayers } from '../../components/home/KeyPlayers';
import { DailyNews } from '../../components/home/DailyNews';
import { HomeSkeleton } from '../../components/home/HomeSkeleton';
import { AnimatedSection } from '../../components/home/AnimatedSection';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, TYPE, SHADOWS } from '../../lib/constants';
import { getMarketName, getMarketColor } from '../../lib/markets';
import { useAuth } from '../../hooks/useAuth';
import { useUserProgress } from '../../hooks/useUserProgress';
import { useUserXP, XP_REWARDS } from '../../hooks/useUserXP';
import { StreakBadge } from '../../components/ui/StreakBadge';
import { XPBadge } from '../../components/ui/XPBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { SlideReaderV2 as SlideReader } from '../../components/slides/SlideReaderV2';
import { TodaysMission } from '../../components/home/TodaysMission';
import { StreakAtRisk } from '../../components/home/StreakAtRisk';
import { Feather } from '@expo/vector-icons';
import { SessionCompleteCard } from '../../components/home/SessionCompleteCard';
import { SocialNudge } from '../../components/home/SocialNudge';
import { TomorrowPreview } from '../../components/home/TomorrowPreview';
import { MentorDebrief, getDebriefQuestion } from '../../components/home/MentorDebrief';
import { MilestoneShareCard } from '../../components/sharing/MilestoneShareCard';
import { DailyQuests } from '../../components/home/DailyQuests';
import { QuickBiteSelector } from '../../components/home/QuickBiteSelector';
import { useDailyQuests } from '../../hooks/useDailyQuests';
import { useMilestoneSharing } from '../../hooks/useMilestoneSharing';
import { useHomeData } from '../../hooks/useHomeData';
import { useSessionFlow } from '../../hooks/useSessionFlow';
import { triggerHaptic } from '../../lib/haptics';
import { useStreakFreeze } from '../../hooks/useStreakFreeze';
import { StreakFreezeCard } from '../../components/home/StreakFreezeCard';
import { playSound } from '../../lib/sounds';
import { useSpacedRepetition } from '../../hooks/useSpacedRepetition';
import { useOfflineCache } from '../../hooks/useOfflineCache';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';

// Market illustrations
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

// Duolingo-style action rows
const ACTION_ROWS = [
  { key: 'games', icon: 'play-circle' as const, title: 'Trivia Games', sub: 'Test your knowledge', color: '#8B5CF6', route: '/games' },
  { key: 'drills', icon: 'zap' as const, title: 'Speed Drills', sub: 'Quick-fire practice', color: '#F59E0B', route: '/drills' },
  { key: 'trainer', icon: 'target' as const, title: 'Scenario Trainer', sub: 'Real-world decisions', color: '#22C55E', route: '/trainer' },
];

const SECONDARY_ROWS = [
  { key: 'rank', icon: 'award' as const, title: 'Leaderboard', color: '#F59E0B', route: '/leaderboard' },
  { key: 'badges', icon: 'star' as const, title: 'Achievements', color: '#22C55E', route: '/achievements' },
  { key: 'news', icon: 'file-text' as const, title: 'Daily Summaries', color: '#3B82F6', route: '/summaries' },
  { key: 'passport', icon: 'globe' as const, title: 'Industry Passport', color: '#8B5CF6', route: '/passport' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();

  const [selectedMarketLocal, setSelectedMarketLocal] = useState<string | null>(null);
  const { progress, availableDay, completeStack, updateStreak } = useUserProgress(selectedMarketLocal || undefined);
  const {
    xpData, dailyCompletion, completeLessonForToday,
    getCurrentStage, getProgressToNextStage, isLessonCompletedToday, addXP,
  } = useUserXP(selectedMarketLocal || undefined);

  const lessonCompletedToday = isLessonCompletedToday();
  const currentStage = getCurrentStage();
  const stageProgress = getProgressToNextStage();
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
  const [showStreakFreeze, setShowStreakFreeze] = useState(true);

  useEffect(() => {
    if (selectedMarket) setSelectedMarketLocal(selectedMarket);
  }, [selectedMarket]);

  const { dueCount, dueItems, gradeReview, addLessonConcepts } = useSpacedRepetition(selectedMarketLocal || undefined);
  const { syncLessons, cachedCount } = useOfflineCache(selectedMarketLocal || undefined);

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

  if (loading || authLoading) return <HomeSkeleton />;

  const marketIllustration = MARKET_ILLUSTRATIONS[selectedMarket || 'aerospace'] || MARKET_ILLUSTRATIONS.aerospace;
  const journeyProgress = ((currentDay || 1) / 180) * 100;

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

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
        <>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
          >
            {/* ── Header: Streak + XP ── */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <StreakBadge count={streak} />
                <XPBadge xp={xpData?.total_xp || 0} level={xpData?.current_level || 1} />
              </View>
            </View>

            {/* ── Leo Greeting ── */}
            <AnimatedSection delay={50}>
              <View style={styles.leoRow}>
                <LeoCharacter size="md" animation="waving" />
                <View style={styles.leoBubble}>
                  <View style={styles.leoBubbleTail} />
                  <Text style={styles.leoGreeting}>
                    {lessonCompletedToday
                      ? "Great work today! Why not practice or explore?"
                      : `${greeting}! Ready for Day ${currentDay}?`}
                  </Text>
                </View>
              </View>
            </AnimatedSection>

            {/* ── Today's Lesson — Big CTA ── */}
            <AnimatedSection delay={100}>
              <TouchableOpacity
                style={[styles.lessonHero, lessonCompletedToday && styles.lessonHeroDone]}
                onPress={() => lessonStack && session.handleOpenStack(lessonStack)}
                activeOpacity={0.85}
              >
                <Image
                  source={marketIllustration}
                  style={styles.lessonIllustration}
                  resizeMode="contain"
                />
                <View style={styles.lessonHeroContent}>
                  <View style={[styles.statusTag, lessonCompletedToday && styles.statusTagDone]}>
                    <Text style={[styles.statusTagText, lessonCompletedToday && styles.statusTagTextDone]}>
                      {lessonCompletedToday ? '✓ COMPLETED' : `DAY ${currentDay}`}
                    </Text>
                  </View>
                  <Text style={styles.lessonHeroTitle} numberOfLines={2}>
                    {lessonStack?.title || getMarketName(selectedMarket || 'aerospace')}
                  </Text>
                  <Text style={styles.lessonHeroSub}>
                    {lessonCompletedToday ? `+${XP_REWARDS.LESSON_COMPLETE} XP earned` : `~5 min · Level ${xpData?.current_level || 1}`}
                  </Text>
                </View>
                <View style={[styles.lessonHeroCTA, lessonCompletedToday && styles.lessonHeroCTADone]}>
                  <Feather
                    name={lessonCompletedToday ? 'refresh-cw' : 'play'}
                    size={20}
                    color="#fff"
                  />
                </View>
              </TouchableOpacity>
            </AnimatedSection>

            {/* ── Quick Bites ── */}
            {lessonStack && !lessonCompletedToday && (lessonStack.slides?.length || 0) >= 4 && (
              <AnimatedSection delay={150}>
                <QuickBiteSelector
                  totalSlides={lessonStack.slides?.length || 0}
                  completedBites={session.completedBites || []}
                  onSelectBite={(idx) => session.handleOpenBite?.(idx)}
                  onFullLesson={() => session.handleOpenStack(lessonStack)}
                  lessonTitle={lessonStack.title}
                  isLessonComplete={lessonCompletedToday}
                />
              </AnimatedSection>
            )}

            {/* ── Streak Warning ── */}
            {streakRiskHours !== null && showStreakWarning && !lessonCompletedToday && (
              <StreakAtRisk
                streak={streak}
                hoursLeft={streakRiskHours}
                onStartLesson={() => lessonStack && session.handleOpenStack(lessonStack)}
                onDismiss={() => setShowStreakWarning(false)}
              />
            )}

            {/* ── Journey Progress (inline) ── */}
            <AnimatedSection delay={200}>
              <View style={styles.journeyRow}>
                <Feather name="map" size={16} color={COLORS.accent} />
                <Text style={styles.journeyLabel}>Day {currentDay} of 180</Text>
                <View style={styles.journeyBarWrap}>
                  <ProgressBar progress={journeyProgress} height={6} />
                </View>
                <Text style={styles.journeyPct}>{Math.round(journeyProgress)}%</Text>
              </View>
            </AnimatedSection>

            {/* ── Practice & Play — Duolingo-style full-width rows ── */}
            <AnimatedSection delay={250}>
              <Text style={styles.sectionTitle}>Practice & Play</Text>
              {ACTION_ROWS.map((row) => (
                <TouchableOpacity
                  key={row.key}
                  style={styles.actionRow}
                  onPress={() => { triggerHaptic('light'); router.push(row.route as any); }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, { backgroundColor: row.color + '14' }]}>
                    <Feather name={row.icon} size={22} color={row.color} />
                  </View>
                  <View style={styles.actionText}>
                    <Text style={styles.actionTitle}>{row.title}</Text>
                    <Text style={styles.actionSub}>{row.sub}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </AnimatedSection>

            {/* ── Spaced Repetition ── */}
            {dueCount > 0 && (
              <AnimatedSection delay={280}>
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => router.push('/trainer' as any)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIcon, { backgroundColor: COLORS.accentSoft }]}>
                    <Feather name="refresh-cw" size={20} color={COLORS.accent} />
                  </View>
                  <View style={styles.actionText}>
                    <Text style={styles.actionTitle}>{dueCount} concept{dueCount !== 1 ? 's' : ''} to review</Text>
                    <Text style={styles.actionSub}>Spaced repetition keeps it fresh</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </AnimatedSection>
            )}

            {/* ── Daily Quests ── */}
            <AnimatedSection delay={300}>
              <DailyQuests
                quests={quests}
                completedCount={completedCount}
                totalBonusXP={totalBonusXP}
                allComplete={allQuestsComplete}
              />
            </AnimatedSection>

            {/* ── Explore — Clean list ── */}
            <AnimatedSection delay={350}>
              <Text style={styles.sectionTitle}>Explore</Text>
              {SECONDARY_ROWS.map((row, i) => (
                <TouchableOpacity
                  key={row.key}
                  style={[styles.actionRow, i === SECONDARY_ROWS.length - 1 && { marginBottom: 0 }]}
                  onPress={() => { triggerHaptic('light'); router.push(row.route as any); }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, { backgroundColor: row.color + '14' }]}>
                    <Feather name={row.icon} size={20} color={row.color} />
                  </View>
                  <View style={styles.actionText}>
                    <Text style={styles.actionTitle}>{row.title}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </AnimatedSection>

            {/* ── Investment Lab ── */}
            <AnimatedSection delay={380}>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push('/investment-lab' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: isProUser ? COLORS.successSoft : COLORS.accentSoft }]}>
                  <Feather name={isProUser ? 'trending-up' : 'search'} size={20} color={isProUser ? COLORS.success : COLORS.accent} />
                </View>
                <View style={styles.actionText}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.actionTitle}>Investment Lab</Text>
                    {!isProUser && (
                      <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.actionSub}>
                    {isProUser ? 'Investment-ready scenarios' : 'Unlock with Pro'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </AnimatedSection>

            {/* ── News ── */}
            {selectedMarket && (
              <AnimatedSection delay={420}>
                <DailyNews marketId={selectedMarket} />
              </AnimatedSection>
            )}

            {/* ── Key Players ── */}
            {selectedMarket && (
              <AnimatedSection delay={460}>
                <KeyPlayers marketId={selectedMarket} />
              </AnimatedSection>
            )}
          </ScrollView>
        </>
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

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Leo greeting
  leoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20,
  },
  leoBubble: {
    flex: 1, backgroundColor: COLORS.bg1, borderRadius: 18,
    padding: 14, marginTop: 8, position: 'relative',
    borderWidth: 1, borderColor: COLORS.border,
  },
  leoBubbleTail: {
    position: 'absolute', left: -6, top: 14,
    width: 0, height: 0,
    borderTopWidth: 6, borderBottomWidth: 6, borderRightWidth: 6,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderRightColor: COLORS.bg1,
  },
  leoGreeting: {
    ...TYPE.body, color: COLORS.textPrimary, fontWeight: '500',
  },

  // Lesson Hero — big CTA
  lessonHero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.bg2, borderRadius: 22, padding: 16,
    marginBottom: 16,
    borderWidth: 1.5, borderColor: COLORS.accent + '30',
    ...SHADOWS.md,
  },
  lessonHeroDone: {
    borderColor: COLORS.success + '30',
  },
  lessonIllustration: {
    width: 72, height: 72,
  },
  lessonHeroContent: { flex: 1 },
  statusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: COLORS.accentSoft, marginBottom: 6,
  },
  statusTagDone: { backgroundColor: COLORS.successSoft },
  statusTagText: {
    fontSize: 9, fontWeight: '800', color: COLORS.accent,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  statusTagTextDone: { color: COLORS.success },
  lessonHeroTitle: {
    fontSize: 16, fontWeight: '700', color: COLORS.textPrimary,
    lineHeight: 21, marginBottom: 2,
  },
  lessonHeroSub: {
    fontSize: 12, color: COLORS.textMuted, fontWeight: '500',
  },
  lessonHeroCTA: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
  },
  lessonHeroCTADone: {
    backgroundColor: COLORS.success,
  },

  // Journey progress inline
  journeyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 20, paddingHorizontal: 4,
  },
  journeyLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  journeyBarWrap: { flex: 1 },
  journeyPct: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, minWidth: 30, textAlign: 'right' },

  // Section title
  sectionTitle: {
    ...TYPE.h3, color: COLORS.textPrimary, marginBottom: 12, marginTop: 8,
  },

  // Duolingo-style full-width action rows
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.bg2, borderRadius: 16, padding: 14,
    marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  actionSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },

  // Pro badge
  proBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  proBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
});
