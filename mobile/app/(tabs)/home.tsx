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
import { LeoBubble } from '../../components/home/LeoBubble';
import { PulsingCTA } from '../../components/home/PulsingCTA';
import { QuickActionsGrid } from '../../components/home/QuickActionsGrid';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../lib/constants';
import { getMarketEmoji, getMarketName } from '../../lib/markets';
import { useAuth } from '../../hooks/useAuth';
import { useUserProgress } from '../../hooks/useUserProgress';
import { useUserXP, XP_REWARDS } from '../../hooks/useUserXP';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';
import { StreakBadge } from '../../components/ui/StreakBadge';
import { XPBadge } from '../../components/ui/XPBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LessonCard } from '../../components/ui/LessonCard';
import { SlideReaderV2 as SlideReader } from '../../components/slides/SlideReaderV2';
import { MentorChatOverlay } from '../../components/ai/MentorChatOverlay';
import { getMentorForContext, Mentor } from '../../data/mentors';
import { getPrimaryMentorForMarket } from '../../data/marketConfig';
import { TodaysMission } from '../../components/home/TodaysMission';
import { StreakAtRisk } from '../../components/home/StreakAtRisk';
import { APP_ICONS } from '../../lib/icons';
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
import { MascotReaction } from '../../components/mascot/MascotReaction';
import { MascotState } from '../../lib/mascots';
import { playSound } from '../../lib/sounds';
import { useSpacedRepetition } from '../../hooks/useSpacedRepetition';
import { useOfflineCache } from '../../hooks/useOfflineCache';

// ─── Static config ───
const MENTOR_IMAGES: Record<string, any> = {
  maya: require('../../assets/mentors/mentor-maya.png'),
  alex: require('../../assets/mentors/mentor-alex.png'),
  kai: require('../../assets/mentors/mentor-kai.png'),
  sophia: require('../../assets/mentors/mentor-sophia.png'),
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

  // ─── Streak Freeze ───
  const { canFreeze, freezesUsedThisWeek, maxFreezes, useFreeze } = useStreakFreeze(
    selectedMarketLocal || undefined, homeData.isProUser
  );
  const [showStreakFreeze, setShowStreakFreeze] = useState(true);

  // ─── Leo mascot state ───
  const [mascotState, setMascotState] = useState<MascotState>('idle');

  // ─── Data hook ───
  const homeData = useHomeData(user?.id, progress, xpData, lessonCompletedToday);
  const {
    selectedMarket, isProUser, lessonStack, newsStack, newsItems,
    streakRiskHours, socialNudge, tomorrowLesson,
    loading, refreshing, currentDay, fetchData, onRefresh,
  } = homeData;

  // Sync selectedMarket for dependent hooks
  useEffect(() => {
    if (selectedMarket) setSelectedMarketLocal(selectedMarket);
  }, [selectedMarket]);

  // ─── Spaced Repetition ───
  const { dueCount, dueItems, gradeReview, addLessonConcepts } = useSpacedRepetition(selectedMarketLocal || undefined);

  // ─── Offline Cache ───
  const { syncLessons, cachedCount } = useOfflineCache(selectedMarketLocal || undefined);

  // Auto-sync lessons for offline when data loads
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

  // ─── Mentor chat ───
  const [mentorChatVisible, setMentorChatVisible] = useState(false);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  const [mentorChatContext, setMentorChatContext] = useState('');
  const [showStreakWarning, setShowStreakWarning] = useState(true);
  const [showSocialNudge, setShowSocialNudge] = useState(true);

  // Trigger mascot celebration on lesson complete
  useEffect(() => {
    if (lessonCompletedToday) {
      setMascotState('celebrate');
      playSound('lessonComplete');
      const timer = setTimeout(() => setMascotState('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [lessonCompletedToday]);
  const [showMentorDebrief, setShowMentorDebrief] = useState(true);

  // ─── Leo greeting ───
  const [leoMessage, setLeoMessage] = useState('');
  const [leoAnimation, setLeoAnimation] = useState<'idle' | 'waving' | 'success' | 'celebrating'>('idle');

  useEffect(() => {
    const hour = new Date().getHours();
    let greeting = '';
    let anim: 'idle' | 'waving' | 'success' | 'celebrating' = 'idle';
    if (hour < 12) { greeting = 'Good morning! Ready to learn? ☀️'; anim = 'waving'; }
    else if (hour < 17) { greeting = "Good afternoon! Let's keep going! 🚀"; anim = 'idle'; }
    else { greeting = 'Evening study session! 🌙'; anim = 'idle'; }
    if (streak >= 7) { greeting = `${streak} day streak! You're on fire! 🔥`; anim = 'celebrating'; }
    else if (lessonCompletedToday) { greeting = 'Lesson done! Try a game? 🎮'; anim = 'success'; }
    setLeoMessage(greeting);
    setLeoAnimation(anim);
  }, [streak, lessonCompletedToday]);

  // ─── Initial fetch ───
  useEffect(() => {
    if (!authLoading && !user) { router.replace('/'); return; }
    fetchData().then((result) => {
      if (result === 'onboarding') router.replace('/onboarding');
      else if (result === 'familiarity') router.replace('/onboarding/familiarity');
    });
  }, [user, authLoading]);

  const handleOpenMentorChat = (context?: string) => {
    triggerHaptic('light');
    const mentor = getMentorForContext('strategy', selectedMarket || 'aerospace');
    setActiveMentor(mentor);
    if (context) setMentorChatContext(context);
    setMentorChatVisible(true);
  };

  const handleOpenMentorForLesson = () => {
    const title = session.activeStack?.title || lessonStack?.title || 'today\'s lesson';
    handleOpenMentorChat(`The user just completed "${title}" (Day ${currentDay}) in ${getMarketName(selectedMarket || 'aerospace')}. Help them reflect and connect to real-world applications.`);
  };

  // ─── Loading ───
  if (loading || authLoading) return <HomeSkeleton />;

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
          onAskMentor={() => {
            handleOpenMentorChat(`Reading "${session.activeStack?.title}" (Day ${currentDay}) in ${getMarketName(selectedMarket || 'aerospace')}. Help understand the material.`);
          }}
          mentorName={getMentorForContext('strategy', selectedMarket || 'aerospace').name.split(' ')[0]}
        />
      ) : session.showSessionComplete ? (
        <SessionCompleteCard
          dayNumber={currentDay}
          marketName={getMarketName(selectedMarket || 'aerospace')}
          marketEmoji={getMarketEmoji(selectedMarket || 'aerospace')}
          xpEarned={session.sessionXPEarned}
          streak={streak}
          lessonTitle={session.activeStack?.title || lessonStack?.title || 'Lesson'}
          totalXP={xpData?.total_xp || 0}
          stageName={currentStage.name}
          onContinue={session.dismissSessionComplete}
          onDismiss={session.dismissSessionComplete}
          onAskMentor={() => { session.dismissSessionComplete(); handleOpenMentorForLesson(); }}
          mentorName={getMentorForContext('strategy', selectedMarket || 'aerospace').name.split(' ')[0]}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
          >
            {/* ── Header: Clean & Minimal ── */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.industryEmoji}>{getMarketEmoji(selectedMarket || 'aerospace')}</Text>
                <View>
                  <Text style={styles.industryName}>{getMarketName(selectedMarket || 'aerospace')}</Text>
                  <Text style={styles.dayText}>Day {currentDay} of 180</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <XPBadge xp={xpData?.total_xp || 0} level={xpData?.current_level || 1} />
                <StreakBadge count={streak} />
              </View>
            </View>

            {/* ── Leo Hero Section ── */}
            <AnimatedSection delay={100}>
              <LeoBubble message={leoMessage} animation={leoAnimation} />
            </AnimatedSection>

            {/* ── TODAY'S LESSON — The One Big CTA ── */}
            {lessonStack && !lessonCompletedToday && (
              <AnimatedSection delay={250}>
                <PulsingCTA
                  label="Today's Lesson"
                  title={lessonStack.title}
                  slideCount={lessonStack.slides?.length || 5}
                  xpReward={XP_REWARDS.LESSON_COMPLETE}
                  onPress={() => session.handleOpenStack(lessonStack)}
                />
              </AnimatedSection>
            )}

            {/* ── Lesson Complete State ── */}
            {lessonCompletedToday && (
              <AnimatedSection delay={250}>
                <View style={styles.completedCard}>
                  <Text style={styles.completedEmoji}>✅</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedTitle}>Lesson done!</Text>
                    <Text style={styles.completedSub}>Come back tomorrow for Day {(currentDay || 0) + 1}</Text>
                  </View>
                  {lessonStack && (
                    <TouchableOpacity
                      style={styles.reviewBtn}
                      onPress={() => session.handleOpenStack(lessonStack)}
                    >
                      <Text style={styles.reviewBtnText}>Review</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </AnimatedSection>
            )}

            {/* ── Streak Warning (only when relevant) ── */}
            {streakRiskHours !== null && showStreakWarning && !lessonCompletedToday && (
              <StreakAtRisk
                streak={streak}
                hoursLeft={streakRiskHours}
                onStartLesson={() => lessonStack && session.handleOpenStack(lessonStack)}
                onDismiss={() => setShowStreakWarning(false)}
              />
            )}

            <AnimatedSection delay={400}>
              <QuickActionsGrid actions={[
                { icon: APP_ICONS.drills, label: 'Practice', onPress: () => router.push('/(tabs)/practice' as any) },
                { icon: APP_ICONS.passport, label: 'Passport', onPress: () => router.push('/passport' as any) },
                { icon: APP_ICONS.notebook, label: 'Notebook', onPress: () => router.push('/(tabs)/notebook' as any) },
                { icon: APP_ICONS.achievements, label: 'Awards', onPress: () => router.push('/achievements' as any) },
              ]} />
            </AnimatedSection>

            {/* ── Spaced Repetition (when due) ── */}
            {dueCount > 0 && (
              <AnimatedSection delay={500}>
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
                  <Text style={{ color: COLORS.textMuted, fontSize: 16 }}>→</Text>
                </TouchableOpacity>
              </AnimatedSection>
            )}

            {/* ── Daily Quests (collapsible) ── */}
            <AnimatedSection delay={600}>
              <View style={styles.section}>
                <DailyQuests
                  quests={quests}
                  completedCount={completedCount}
                  totalBonusXP={totalBonusXP}
                  allComplete={allQuestsComplete}
                />
              </View>
            </AnimatedSection>

            {/* ── News (if available) ── */}
            {selectedMarket && (
              <AnimatedSection delay={700}>
                <View style={styles.section}>
                  <DailyNews marketId={selectedMarket} />
                </View>
              </AnimatedSection>
            )}
          </ScrollView>

          {/* Mentor Chat Overlay */}
          {activeMentor && (
            <MentorChatOverlay
              visible={mentorChatVisible}
              mentor={activeMentor}
              onClose={() => { setMentorChatVisible(false); setMentorChatContext(''); }}
              marketId={selectedMarket || undefined}
              context={mentorChatContext || `${getMarketName(selectedMarket || 'aerospace')} industry learning. Day ${currentDay} of 180. Recent: ${newsItems.slice(0, 3).map(n => n.title).join('; ')}`}
            />
          )}

          {/* Floating Leo Reaction */}
          {mascotState !== 'idle' && (
            <MascotReaction state={mascotState} position="bottom-right" size="md" />
          )}
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  industryEmoji: { fontSize: 28 },
  industryName: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary },
  dayText: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Completed
  completedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
  },
  completedEmoji: { fontSize: 28 },
  completedTitle: { fontSize: 16, fontWeight: '700', color: '#22C55E' },
  completedSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  reviewBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
  },
  reviewBtnText: { fontSize: 12, fontWeight: '600', color: '#22C55E' },

  // Review prompt
  reviewPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 16,
    backgroundColor: 'rgba(139,92,246,0.06)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  reviewPromptTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  reviewPromptSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  section: { marginBottom: 20 },
});
