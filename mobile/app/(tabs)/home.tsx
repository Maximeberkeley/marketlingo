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
import { COLORS } from '../../lib/constants';
import { getMarketName, getMarketColor } from '../../lib/markets';
import { useAuth } from '../../hooks/useAuth';
import { useUserProgress } from '../../hooks/useUserProgress';
import { useUserXP, XP_REWARDS } from '../../hooks/useUserXP';
import { StreakBadge } from '../../components/ui/StreakBadge';
import { XPBadge } from '../../components/ui/XPBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LessonCard } from '../../components/ui/LessonCard';
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

// Market illustrations — flat 3D isometric style (matching web)
// Market illustrations — flat 3D isometric style (matching web)
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();

  // ─── Core hooks ───
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

  // ─── Data hook ───
  const homeData = useHomeData(user?.id, progress, xpData, lessonCompletedToday);
  const {
    selectedMarket, isProUser, lessonStack, newsStack, newsItems,
    streakRiskHours, socialNudge, tomorrowLesson,
    loading, refreshing, currentDay, fetchData, onRefresh,
  } = homeData;

  // ─── Streak Freeze ───
  const { canFreeze, freezesUsedThisWeek, maxFreezes, useFreeze } = useStreakFreeze(
    selectedMarketLocal || undefined, isProUser
  );
  const [showStreakFreeze, setShowStreakFreeze] = useState(true);

  // ─── Leo mascot state ───
  

  // Sync selectedMarket for dependent hooks
  useEffect(() => {
    if (selectedMarket) setSelectedMarketLocal(selectedMarket);
  }, [selectedMarket]);

  // ─── Spaced Repetition ───
  const { dueCount, dueItems, gradeReview, addLessonConcepts } = useSpacedRepetition(selectedMarketLocal || undefined);

  // ─── Offline Cache ───
  const { syncLessons, cachedCount } = useOfflineCache(selectedMarketLocal || undefined);

  useEffect(() => {
    if (currentDay && selectedMarket) syncLessons(currentDay);
  }, [currentDay, selectedMarket]);

  // ─── Milestone sharing ───
  const { milestone, dismissMilestone, checkStreakMilestone, checkLevelMilestone } = useMilestoneSharing();

  // ─── Session flow hook ───
  const session = useSessionFlow({
    user, selectedMarket, lessonStack, progress, xpData,
    lessonCompletedToday, currentDay,
    completeStack, updateStreak, completeLessonForToday, addXP,
    checkStreakMilestone, checkLevelMilestone,
    xpRewardLessonComplete: XP_REWARDS.LESSON_COMPLETE,
    xpRewardStreakBonus: XP_REWARDS.STREAK_BONUS,
    onDataRefresh: async () => { await fetchData(); },
  });

  // ─── Daily Quests ───
  const { quests, completedCount, totalBonusXP, allComplete: allQuestsComplete } = useDailyQuests(
    dailyCompletion ?? null, streak
  );

  const [showStreakWarning, setShowStreakWarning] = useState(true);
  const [showSocialNudge, setShowSocialNudge] = useState(true);

  // Play sound on lesson complete
  useEffect(() => {
    if (lessonCompletedToday) {
      playSound('lessonComplete');
    }
  }, [lessonCompletedToday]);

  // ─── Initial fetch ───
  useEffect(() => {
    if (!authLoading && !user) { router.replace('/'); return; }
    fetchData().then((result) => {
      if (result === 'onboarding') router.replace('/onboarding');
      else if (result === 'familiarity') router.replace('/onboarding/familiarity');
    });
  }, [user, authLoading]);


  // ─── Loading ───
  if (loading || authLoading) return <HomeSkeleton />;

  const marketIllustration = MARKET_ILLUSTRATIONS[selectedMarket || 'aerospace'] || MARKET_ILLUSTRATIONS.aerospace;
  const journeyProgress = ((currentDay || 1) / 180) * 100;

  // ─── Render ───
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
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
          >
            {/* ── Header: XP + Streak badges ── */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <StreakBadge count={streak} />
                <XPBadge xp={xpData?.total_xp || 0} level={xpData?.current_level || 1} />
              </View>
            </View>

            {/* ── Hero Section: Brilliant-style ── */}
            <AnimatedSection delay={50}>
              <View style={styles.heroSection}>
                {/* Recommended / Completed tag */}
                <View style={styles.tagRow}>
                  <View style={[styles.statusTag, lessonCompletedToday && styles.statusTagDone]}>
                    <Text style={[styles.statusTagText, lessonCompletedToday && styles.statusTagTextDone]}>
                      {lessonCompletedToday ? 'COMPLETED' : 'RECOMMENDED'}
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={styles.heroTitle}>
                  {lessonStack?.title || getMarketName(selectedMarket || 'aerospace')}
                </Text>
                <Text style={styles.heroSubtitle}>
                  Day {currentDay} · Level {xpData?.current_level || 1}
                </Text>

                {/* Market Illustration — flat 3D isometric, no crop */}
                <View style={styles.illustrationWrap}>
                  <Image
                    source={marketIllustration}
                    style={styles.illustration}
                    resizeMode="contain"
                  />
                </View>

                {/* Dot indicators */}
                <View style={styles.dotRow}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i < Math.ceil((currentDay || 1) / 36) && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </AnimatedSection>

            {/* ── Lesson Module Card ── */}
            <AnimatedSection delay={150}>
              <View style={styles.lessonCard}>
                {lessonCompletedToday ? (
                  <View style={styles.lessonCompleteRow}>
                    <View style={styles.lessonCompleteIcon}>
                      <Image source={APP_ICONS.learn} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lessonCompleteTitle}>Lesson Complete!</Text>
                      <Text style={styles.lessonCompleteSub}>+{XP_REWARDS.LESSON_COMPLETE} XP earned</Text>
                    </View>
                  </View>
                ) : lessonStack ? (
                  <View style={styles.lessonItemRow}>
                    <View style={styles.lessonItemIcon}>
                      <Image source={APP_ICONS.learn} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lessonItemTitle} numberOfLines={2}>{lessonStack.title}</Text>
                    </View>
                    <View style={styles.lessonItemCircle} />
                  </View>
                ) : null}

                {/* CTA Buttons */}
                <View style={styles.lessonActions}>
                  {lessonCompletedToday ? (
                    <View style={styles.lessonActionsRow}>
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => lessonStack && session.handleOpenStack(lessonStack)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.secondaryBtnText}>Review</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.successBtn}
                        onPress={() => router.push('/(tabs)/practice' as any)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.successBtnText}>Practice</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.startBtn}
                      onPress={() => lessonStack && session.handleOpenStack(lessonStack)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.startBtnText}>Start</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </AnimatedSection>

            {/* ── Quick Bites ── */}
            {lessonStack && !lessonCompletedToday && (lessonStack.slides?.length || 0) >= 4 && (
              <AnimatedSection delay={200}>
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

            {/* ── Practice & Play Grid — matches web ── */}
            <AnimatedSection delay={300}>
              <Text style={styles.sectionHeader}>Practice & Play</Text>
              <View style={styles.practiceGrid}>
                {[
                  { icon: APP_ICONS.games, label: 'Games', onPress: () => router.push('/games' as any) },
                  { icon: APP_ICONS.drills, label: 'Drills', onPress: () => router.push('/drills' as any) },
                  { icon: APP_ICONS.trainer, label: 'Trainer', onPress: () => router.push('/trainer' as any) },
                ].map((item) => (
                  <TouchableOpacity key={item.label} style={styles.practiceItem} onPress={item.onPress} activeOpacity={0.7}>
                    <View style={styles.practiceIconWrap}>
                      <Image source={item.icon} style={{ width: 22, height: 22, resizeMode: 'contain' }} />
                    </View>
                    <Text style={styles.practiceLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </AnimatedSection>

            {/* ── Quick Access — matches web ── */}
            <AnimatedSection delay={320}>
              <Text style={styles.sectionHeader}>Quick Access</Text>
              <View style={styles.quickGrid}>
                {[
                  { icon: APP_ICONS.notebook, label: 'Notes', onPress: () => router.push('/(tabs)/notebook' as any) },
                  { icon: APP_ICONS.achievements, label: 'Rank', onPress: () => router.push('/leaderboard' as any) },
                  { icon: APP_ICONS.achievements, label: 'Badges', onPress: () => router.push('/achievements' as any) },
                  { icon: APP_ICONS.news, label: 'News', onPress: () => router.push('/summaries' as any) },
                ].map((item) => (
                  <TouchableOpacity key={item.label} style={styles.quickItem} onPress={item.onPress} activeOpacity={0.7}>
                    <View style={styles.quickIconWrap}>
                      <Image source={item.icon} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
                    </View>
                    <Text style={styles.quickLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </AnimatedSection>

            {/* ── Spaced Repetition ── */}
            {dueCount > 0 && (
              <AnimatedSection delay={350}>
                <TouchableOpacity
                  style={styles.reviewPrompt}
                  onPress={() => router.push('/trainer' as any)}
                  activeOpacity={0.8}
                >
                  <Image source={APP_ICONS.trainer} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewPromptTitle}>{dueCount} concept{dueCount !== 1 ? 's' : ''} to review</Text>
                    <Text style={styles.reviewPromptSub}>Spaced repetition keeps it fresh</Text>
                  </View>
                  <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>›</Text>
                </TouchableOpacity>
              </AnimatedSection>
            )}

            {/* ── Daily Quests ── */}
            <AnimatedSection delay={400}>
              <View style={styles.section}>
                <DailyQuests
                  quests={quests}
                  completedCount={completedCount}
                  totalBonusXP={totalBonusXP}
                  allComplete={allQuestsComplete}
                />
              </View>
            </AnimatedSection>

            {/* ── Investment Lab ── */}
            <AnimatedSection delay={450}>
              <TouchableOpacity
                style={styles.investmentCard}
                onPress={() => router.push('/investment-lab' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.investIcon, isProUser && styles.investIconPro]}>
                  <Image source={isProUser ? APP_ICONS.progress : APP_ICONS.lens} style={{ width: 20, height: 20, resizeMode: 'contain' }} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.investTitleRow}>
                    <Text style={styles.investTitle}>Investment Lab</Text>
                    {!isProUser && (
                      <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.investSub}>
                    {isProUser ? 'Investment-ready scenarios' : 'Unlock with Pro'}
                  </Text>
                </View>
                <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>›</Text>
              </TouchableOpacity>
            </AnimatedSection>

            {/* ── Journey Progress ── */}
            <AnimatedSection delay={500}>
              <View style={styles.journeyCard}>
                <View style={styles.journeyHeader}>
                  <View style={styles.journeyHeaderLeft}>
                    <Image source={APP_ICONS.progress} style={{ width: 16, height: 16, resizeMode: 'contain' }} />
                    <Text style={styles.journeyTitle}>Day {currentDay} of 180</Text>
                  </View>
                  <Text style={styles.journeyPct}>{Math.round(journeyProgress)}%</Text>
                </View>
                <ProgressBar progress={journeyProgress} height={6} />
              </View>
            </AnimatedSection>

            {/* ── News ── */}
            {selectedMarket && (
              <AnimatedSection delay={550}>
                <View style={styles.section}>
                  <DailyNews marketId={selectedMarket} />
                </View>
              </AnimatedSection>
            )}

            {/* ── Key Players ── */}
            {selectedMarket && (
              <AnimatedSection delay={600}>
                <View style={styles.section}>
                  <KeyPlayers marketId={selectedMarket} />
                </View>
              </AnimatedSection>
            )}
          </ScrollView>
        </>
      )}

      {/* Milestone Share Card */}
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
  scrollContent: { paddingHorizontal: 16 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Hero Section — Brilliant-style
  heroSection: { alignItems: 'center', marginBottom: 8 },
  tagRow: { marginBottom: 10 },
  statusTag: {
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
    backgroundColor: COLORS.accentSoft,
  },
  statusTagDone: { backgroundColor: COLORS.successSoft },
  statusTagText: {
    fontSize: 10, fontWeight: '800', color: COLORS.accent,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  statusTagTextDone: { color: COLORS.success },
  heroTitle: {
    fontSize: 24, fontWeight: '800', color: COLORS.textPrimary,
    textAlign: 'center', lineHeight: 30, marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.accent,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16,
  },
  illustrationWrap: {
    width: 192, height: 192,
    marginBottom: 20, alignItems: 'center', justifyContent: 'center',
  },
  illustration: { width: 192, height: 192 },
  dotRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.borderLight,
  },
  dotActive: { backgroundColor: COLORS.accent },

  // Lesson Module Card
  lessonCard: {
    backgroundColor: COLORS.bg2, borderRadius: 20, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  lessonCompleteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  lessonCompleteIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.successSoft, alignItems: 'center', justifyContent: 'center',
  },
  lessonCompleteTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  lessonCompleteSub: { fontSize: 12, color: COLORS.textMuted },
  lessonItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  lessonItemIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  lessonItemTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  lessonItemCircle: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border,
  },
  lessonActions: {},
  lessonActionsRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center',
    backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  successBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center',
    backgroundColor: COLORS.success,
  },
  successBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  startBtn: {
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    backgroundColor: COLORS.accent,
  },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },

  // Review prompt
  reviewPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 16,
    backgroundColor: COLORS.bg2, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  reviewPromptTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  reviewPromptSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  // Investment Lab
  investmentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg2, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  investIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  investIconPro: { backgroundColor: COLORS.successSoft },
  investTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  investTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  proBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  proBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },
  investSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  // Journey Progress
  journeyCard: {
    backgroundColor: COLORS.bg2, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  journeyHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  journeyHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  journeyTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  journeyPct: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },

  section: { marginBottom: 20 },

  // Section headers
  sectionHeader: {
    fontSize: 14, fontWeight: '700', color: COLORS.textPrimary,
    marginBottom: 10, letterSpacing: 0.2,
  },

  // Practice & Play grid (3 cols, matches web)
  practiceGrid: {
    flexDirection: 'row', gap: 10, marginBottom: 20,
  },
  practiceItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 18, borderRadius: 18,
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  practiceIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  practiceLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },

  // Quick Access grid (4 cols, matches web)
  quickGrid: {
    flexDirection: 'row', gap: 8, marginBottom: 20,
  },
  quickItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 18,
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  quickIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
});
