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
import { SlideReader } from '../../components/slides/SlideReader';
import { MentorChatOverlay } from '../../components/ai/MentorChatOverlay';
import { getMentorForContext, Mentor } from '../../data/mentors';
import { getPrimaryMentorForMarket } from '../../data/marketConfig';
import { TodaysMission } from '../../components/home/TodaysMission';
import { StreakAtRisk } from '../../components/home/StreakAtRisk';
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
            {/* Header */}
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

            {/* Leo + Mentor */}
            <View style={styles.leoSection}>
              <View style={styles.leoRow}>
                <LeoCharacter size="lg" animation={leoAnimation} />
                <TouchableOpacity style={styles.mentorAvatarBtn} onPress={() => handleOpenMentorChat()}>
                  {(() => {
                    const mentorId = getPrimaryMentorForMarket(selectedMarket || 'aerospace');
                    const avatarSrc = MENTOR_IMAGES[mentorId] || MENTOR_IMAGES.maya;
                    return (
                      <View style={styles.mentorAvatarCircle}>
                        <Image source={avatarSrc} style={styles.mentorAvatarImage} resizeMode="cover" />
                        <View style={styles.mentorPulse} />
                      </View>
                    );
                  })()}
                  <View style={styles.mentorChatBubble}>
                    <Text style={styles.mentorChatBubbleText}>Ask me →</Text>
                  </View>
                </TouchableOpacity>
              </View>
              <Text style={styles.leoMessage}>{leoMessage}</Text>
            </View>

            {/* Startup Progress */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <View style={styles.progressLeft}>
                  <Text style={styles.crownEmoji}>👑</Text>
                  <Text style={styles.progressTitle}>Stage {currentStage.stage}: {currentStage.name}</Text>
                </View>
                <Text style={styles.progressPercent}>{Math.round(stageProgress)}%</Text>
              </View>
              <ProgressBar progress={stageProgress} />
            </View>

            {/* Streak Warning */}
            {streakRiskHours !== null && showStreakWarning && !lessonCompletedToday && (
              <StreakAtRisk
                streak={streak}
                hoursLeft={streakRiskHours}
                onStartLesson={() => lessonStack && session.handleOpenStack(lessonStack)}
                onDismiss={() => setShowStreakWarning(false)}
              />
            )}

            {/* Streak Freeze */}
            {streakRiskHours !== null && canFreeze && showStreakFreeze && !lessonCompletedToday && (
              <StreakFreezeCard
                streak={streak}
                canFreeze={canFreeze}
                freezesUsed={freezesUsedThisWeek}
                maxFreezes={maxFreezes}
                isProUser={isProUser}
                onUseFreeze={useFreeze}
                onDismiss={() => setShowStreakFreeze(false)}
              />
            )}

            {/* Today's Mission */}
            {lessonStack && (
              <TodaysMission
                dayNumber={currentDay}
                lessonTitle={lessonStack.title}
                marketEmoji={getMarketEmoji(selectedMarket || 'aerospace')}
                marketName={getMarketName(selectedMarket || 'aerospace')}
                xpReward={XP_REWARDS.LESSON_COMPLETE}
                duration={lessonStack.duration_minutes || 5}
                progress={lessonCompletedToday ? 1 : (currentDay / 180)}
                isCompleted={lessonCompletedToday}
                streak={streak}
                onStart={() => session.handleOpenStack(lessonStack)}
                onReview={() => session.handleOpenStack(lessonStack)}
                onPractice={() => router.push('/(tabs)/practice' as any)}
              />
            )}

            {/* Spaced Repetition Prompt */}
            {dueCount > 0 && (
              <TouchableOpacity
                style={styles.reviewCard}
                onPress={() => router.push('/trainer' as any)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 20 }}>🧠</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewTitle}>{dueCount} concept{dueCount !== 1 ? 's' : ''} to review</Text>
                  <Text style={styles.reviewSub}>Spaced repetition keeps knowledge fresh</Text>
                </View>
                <Text style={{ color: COLORS.textMuted, fontSize: 16 }}>→</Text>
              </TouchableOpacity>
            )}

            {/* Friends shortcut */}
            <TouchableOpacity
              style={styles.friendsCard}
              onPress={() => { triggerHaptic('light'); router.push('/friends' as any); }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 18 }}>👥</Text>
              <Text style={styles.friendsText}>Friends</Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>→</Text>
            </TouchableOpacity>

            {/* Quick Bites */}
            {lessonStack && !lessonCompletedToday && lessonStack.slides.length >= 4 && (
              <View style={styles.section}>
                <QuickBiteSelector
                  totalSlides={lessonStack.slides.length}
                  completedBites={session.completedBites}
                  onSelectBite={session.handleOpenBite}
                  onFullLesson={() => session.handleOpenStack(lessonStack)}
                  lessonTitle={lessonStack.title}
                  isLessonComplete={lessonCompletedToday}
                />
              </View>
            )}

            {/* Daily Quests */}
            <View style={styles.section}>
              <DailyQuests
                quests={quests}
                completedCount={completedCount}
                totalBonusXP={totalBonusXP}
                allComplete={allQuestsComplete}
              />
            </View>

            {/* Mentor Debrief (post-lesson) */}
            {lessonCompletedToday && showMentorDebrief && lessonStack && (() => {
              const mentor = getMentorForContext('strategy', selectedMarket || 'aerospace');
              const mentorId = getPrimaryMentorForMarket(selectedMarket || 'aerospace');
              const mentorImage = MENTOR_IMAGES[mentorId] || MENTOR_IMAGES.maya;
              return (
                <MentorDebrief
                  mentorName={mentor.name}
                  mentorEmoji={mentor.emoji}
                  mentorImage={mentorImage}
                  lessonTitle={lessonStack.title}
                  debriefQuestion={getDebriefQuestion(lessonStack.title)}
                  onOpenChat={handleOpenMentorForLesson}
                  onDismiss={() => setShowMentorDebrief(false)}
                />
              );
            })()}

            {/* Tomorrow's Preview */}
            {lessonCompletedToday && tomorrowLesson && (
              <TomorrowPreview
                dayNumber={tomorrowLesson.dayNumber}
                lessonTitle={tomorrowLesson.title}
                marketEmoji={getMarketEmoji(selectedMarket || 'aerospace')}
                hoursUntilUnlock={(() => {
                  const now = new Date();
                  const midnight = new Date();
                  midnight.setHours(24, 0, 0, 0);
                  return (midnight.getTime() - now.getTime()) / (1000 * 60 * 60);
                })()}
              />
            )}

            {/* Social Nudge */}
            {socialNudge && showSocialNudge && !lessonCompletedToday && (
              <SocialNudge
                rivalName={socialNudge.name}
                rivalXP={socialNudge.xp}
                userXP={xpData?.total_xp || 0}
                marketName={getMarketName(selectedMarket || 'aerospace')}
                onViewLeaderboard={() => router.push('/leaderboard' as any)}
                onDismiss={() => setShowSocialNudge(false)}
              />
            )}

            {/* Industry Intel — news feed */}
            {selectedMarket && (
              <View style={styles.section}>
                <DailyNews marketId={selectedMarket} />
              </View>
            )}

            {/* Daily Pattern */}
            {newsStack && !lessonCompletedToday && (
              <View style={styles.section}>
                <LessonCard
                  title="Daily Pattern"
                  subtitle="Industry Insight"
                  headline={newsStack.title}
                  xp={25}
                  duration={newsStack.duration_minutes || 3}
                  colorScheme="blue"
                  onClick={() => session.handleOpenStack(newsStack)}
                />
              </View>
            )}

            {/* Investment Lab */}
            <TouchableOpacity
              style={[
                styles.investmentLabCard,
                isProUser
                  ? { borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.06)' }
                  : { borderColor: 'rgba(139, 92, 246, 0.2)', backgroundColor: 'rgba(139, 92, 246, 0.04)' },
              ]}
              onPress={() => { triggerHaptic('light'); router.push('/investment-lab' as any); }}
            >
              <View style={[styles.investmentLabIcon, isProUser ? { backgroundColor: 'rgba(16, 185, 129, 0.2)' } : { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Text style={{ fontSize: 20 }}>{isProUser ? '📈' : '🔒'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.investmentLabHeader}>
                  <Text style={styles.investmentLabTitle}>Investment Lab</Text>
                  {isProUser ? (
                    <View style={styles.bonusBadge}><Text style={styles.bonusBadgeText}>BONUS</Text></View>
                  ) : (
                    <View style={styles.proBadge}><Text style={styles.proBadgeText}>👑 PRO</Text></View>
                  )}
                </View>
                <Text style={styles.investmentLabSubtitle}>
                  {isProUser ? 'Become investment-ready • Optional extra XP' : 'Unlock with Pro • Expert-level scenarios'}
                </Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            {/* Key Players */}
            {selectedMarket && (
              <View style={styles.section}>
                <KeyPlayers marketId={selectedMarket} />
              </View>
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
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  industryEmoji: { fontSize: 28 },
  industryName: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary },
  dayText: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leoSection: { alignItems: 'center', marginBottom: 16 },
  leoRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginBottom: 4 },
  leoMessage: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6 },
  mentorAvatarBtn: { alignItems: 'center', gap: 6 },
  mentorAvatarCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 2, borderColor: COLORS.accent,
    overflow: 'hidden', position: 'relative',
  },
  mentorAvatarImage: { width: '100%', height: '100%' },
  mentorPulse: {
    position: 'absolute', bottom: 0, right: 0,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: COLORS.bg0,
  },
  mentorChatBubble: {
    backgroundColor: COLORS.accent, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  mentorChatBubbleText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },
  progressCard: {
    backgroundColor: COLORS.bg2, borderRadius: 16, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  progressLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  crownEmoji: { fontSize: 16 },
  progressTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  progressPercent: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  section: { marginBottom: 20 },
  investmentLabCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1,
  },
  investmentLabIcon: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  investmentLabHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  investmentLabTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  investmentLabSubtitle: { fontSize: 11, color: COLORS.textMuted },
  bonusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  bonusBadgeText: { fontSize: 8, fontWeight: '700', color: '#34D399' },
  proBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  proBadgeText: { fontSize: 8, fontWeight: '700', color: COLORS.accent },
  chevron: { fontSize: 20, color: COLORS.textMuted },
  reviewCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.06)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  reviewTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  reviewSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  friendsCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 16,
    backgroundColor: COLORS.bg2, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  friendsText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
});
