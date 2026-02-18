import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../lib/constants';
import { getMarketEmoji, getMarketName } from '../../lib/markets';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useUserProgress } from '../../hooks/useUserProgress';
import { useUserXP, XP_REWARDS, STARTUP_STAGES } from '../../hooks/useUserXP';
import { StackWithSlides } from '../../lib/types';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';
import { StreakBadge } from '../../components/ui/StreakBadge';
import { XPBadge } from '../../components/ui/XPBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LessonCard } from '../../components/ui/LessonCard';
import { SlideReader } from '../../components/slides/SlideReader';

interface NewsItem {
  id: string;
  title: string;
  summary: string | null;
  source_name: string;
  source_url: string;
  published_at: string;
  category_tag: string | null;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [isProUser, setIsProUser] = useState(false);
  const { progress, availableDay, completeStack, updateStreak } = useUserProgress(selectedMarket || undefined);
  const {
    xpData,
    completeLessonForToday,
    getCurrentStage,
    getProgressToNextStage,
    isLessonCompletedToday,
    addXP,
  } = useUserXP(selectedMarket || undefined);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lessonStack, setLessonStack] = useState<StackWithSlides | null>(null);
  const [newsStack, setNewsStack] = useState<StackWithSlides | null>(null);
  const [activeStack, setActiveStack] = useState<StackWithSlides | null>(null);
  const [showReader, setShowReader] = useState(false);
  const [leoMessage, setLeoMessage] = useState('');
  const [leoAnimation, setLeoAnimation] = useState<'idle' | 'waving' | 'success' | 'celebrating'>('idle');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  const lessonCompletedToday = isLessonCompletedToday();
  const currentStage = getCurrentStage();
  const stageProgress = getProgressToNextStage();
  const streak = progress?.current_streak || 0;
  const currentDay = availableDay;

  // Leo greeting
  useEffect(() => {
    const hour = new Date().getHours();
    let greeting = '';
    let anim: 'idle' | 'waving' | 'success' | 'celebrating' = 'idle';

    if (hour < 12) { greeting = 'Good morning! Ready to learn?'; anim = 'waving'; }
    else if (hour < 17) { greeting = "Good afternoon! Let's keep going!"; anim = 'idle'; }
    else { greeting = 'Evening study session!'; anim = 'idle'; }

    if (streak >= 7) { greeting = `${streak} day streak! You're on fire!`; anim = 'celebrating'; }
    else if (lessonCompletedToday) { greeting = 'Lesson done! Try a game?'; anim = 'success'; }

    setLeoMessage(greeting);
    setLeoAnimation(anim);
  }, [streak, lessonCompletedToday]);

  // Fetch data
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('selected_market, familiarity_level, is_pro_user')
      .eq('id', user.id)
      .single();

    if (!profile?.selected_market) {
      router.replace('/onboarding');
      return;
    }
    if (!profile?.familiarity_level) {
      router.replace('/onboarding/familiarity');
      return;
    }

    setSelectedMarket(profile.selected_market);
    setIsProUser(profile.is_pro_user || false);
    const market = profile.selected_market;

    // Get user's available day
    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('start_date')
      .eq('user_id', user.id)
      .eq('market_id', market)
      .single();

    let calcDay = 1;
    if (userProgress?.start_date) {
      const start = new Date(userProgress.start_date);
      const today = new Date();
      start.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      calcDay = Math.min(180, Math.max(1, diffDays + 1));
    }
    const dayTag = `day-${calcDay}`;

    // Fetch lesson stack
    let { data: lessonStacks } = await supabase
      .from('stacks')
      .select('id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)')
      .eq('market_id', market)
      .contains('tags', ['MICRO_LESSON', dayTag])
      .not('published_at', 'is', null)
      .limit(1);

    if (!lessonStacks?.[0]) {
      const { data: allLessons } = await supabase
        .from('stacks')
        .select('id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)')
        .eq('market_id', market)
        .contains('tags', ['MICRO_LESSON'])
        .not('published_at', 'is', null);

      if (allLessons?.length) {
        const lessonsWithDays = allLessons.map((stack: any) => {
          const dayMatch = (stack.tags as string[])?.find((t: string) => t.startsWith('day-'));
          const dayNum = dayMatch ? parseInt(dayMatch.replace('day-', ''), 10) : 999;
          return { ...stack, dayNum };
        });
        const validLessons = lessonsWithDays.filter((l: any) => l.dayNum <= calcDay);
        const selectedLesson = validLessons.length > 0
          ? validLessons.reduce((max: any, l: any) => (l.dayNum > max.dayNum ? l : max))
          : lessonsWithDays.reduce((min: any, l: any) => (l.dayNum < min.dayNum ? l : min));
        lessonStacks = [selectedLesson];
      }
    }

    if (lessonStacks?.[0]) {
      const stack = lessonStacks[0] as any;
      setLessonStack({
        ...stack,
        tags: stack.tags || [],
        slides: ((stack.slides as any[]) || [])
          .sort((a: any, b: any) => a.slide_number - b.slide_number)
          .map((s: any) => ({ ...s, sources: Array.isArray(s.sources) ? s.sources : [] })),
      });
    }

    // Fetch news stack
    const { data: newsStacks } = await supabase
      .from('stacks')
      .select('id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)')
      .eq('market_id', market)
      .contains('tags', ['DAILY_GAME'])
      .not('published_at', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1);

    if (newsStacks?.[0]) {
      const stack = newsStacks[0] as any;
      setNewsStack({
        ...stack,
        tags: stack.tags || [],
        slides: ((stack.slides as any[]) || [])
          .sort((a: any, b: any) => a.slide_number - b.slide_number)
          .map((s: any) => ({ ...s, sources: Array.isArray(s.sources) ? s.sources : [] })),
      });
    }

    // Fetch news items (daily news feed)
    const { data: fetchedNews } = await supabase
      .from('news_items')
      .select('id, title, summary, source_name, source_url, published_at, category_tag')
      .eq('market_id', market)
      .order('published_at', { ascending: false })
      .limit(5);

    if (fetchedNews) {
      setNewsItems(fetchedNews);
    }

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleStackComplete = async (isReviewMode: boolean, timeSpentSeconds: number) => {
    setShowReader(false);
    if (isReviewMode) {
      Alert.alert('Great review!', 'Keep up the good work.');
      return;
    }
    if (timeSpentSeconds < 180) {
      Alert.alert('Keep learning!', 'Spend at least 3 minutes to complete the lesson.');
      return;
    }
    if (progress && activeStack) {
      await completeStack(activeStack.id);
      await updateStreak();
      await completeLessonForToday(activeStack.id);
      if ((progress.current_streak || 0) > 0) {
        await addXP(XP_REWARDS.STREAK_BONUS * (progress.current_streak || 1), 'streak_bonus');
      }
    }
    Alert.alert('Lesson complete!', 'Great job! Try some drills to practice.');
    router.push('/(tabs)/home');
  };

  const handleOpenStack = (stack: StackWithSlides) => {
    setActiveStack(stack);
    setShowReader(true);
  };

  const handleSaveInsight = async (slideNum: number) => {
    if (!user || !activeStack) return;
    const slide = activeStack.slides[slideNum - 1];
    await supabase.from('saved_insights').insert({
      user_id: user.id,
      title: slide?.title || 'Insight',
      content: slide?.body,
      stack_id: activeStack.id,
    });
    Alert.alert('Saved!', 'Insight saved to your notebook.');
  };

  const handleAddNote = async (slideNum: number) => {
    if (!user || !activeStack || !selectedMarket) return;
    const slide = activeStack.slides.find((s) => s.slide_number === slideNum);
    await supabase.from('notes').insert({
      user_id: user.id,
      content: slide?.body || '',
      linked_label: `Slide ${slideNum}`,
      stack_id: activeStack.id,
      market_id: selectedMarket,
    });
    Alert.alert('Note added!', 'Note saved to your notebook.');
  };

  if (loading || authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
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

        {/* Leo Greeting */}
        <View style={styles.leoSection}>
          <LeoCharacter size="lg" animation={leoAnimation} />
          <Text style={styles.leoMessage}>{leoMessage}</Text>
        </View>

        {/* Startup Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressLeft}>
              <Text style={styles.crownEmoji}>👑</Text>
              <Text style={styles.progressTitle}>
                Stage {currentStage.stage}: {currentStage.name}
              </Text>
            </View>
            <Text style={styles.progressPercent}>{Math.round(stageProgress)}%</Text>
          </View>
          <ProgressBar progress={stageProgress} />
        </View>

        {/* Today's Learning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TODAY'S LEARNING</Text>

          {lessonCompletedToday ? (
            <View style={styles.completedCard}>
              <View style={styles.completedHeader}>
                <View style={styles.completedIcon}>
                  <Text style={styles.completedCheckmark}>✓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.completedTitle}>Lesson Complete!</Text>
                  <Text style={styles.completedXP}>⚡ +{XP_REWARDS.LESSON_COMPLETE} XP earned</Text>
                </View>
              </View>
              <View style={styles.completedActions}>
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={() => lessonStack && handleOpenStack(lessonStack)}
                >
                  <Text style={styles.reviewButtonText}>Review</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.practiceButton}
                  onPress={() => router.push('/drills' as any)}
                >
                  <Text style={styles.practiceButtonText}>⚡ Practice</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            lessonStack && (
              <LessonCard
                title="Micro Lesson"
                subtitle="Today's Lesson"
                headline={lessonStack.title}
                xp={XP_REWARDS.LESSON_COMPLETE}
                duration={lessonStack.duration_minutes || 5}
                colorScheme="purple"
                onClick={() => handleOpenStack(lessonStack)}
              />
            )
          )}

          {newsStack && (
            <LessonCard
              title="Daily Pattern"
              subtitle="Industry Insight"
              headline={newsStack.title}
              xp={25}
              duration={newsStack.duration_minutes || 3}
              colorScheme="blue"
              onClick={() => handleOpenStack(newsStack)}
            />
          )}
        </View>

        {/* Practice & Play Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRACTICE & PLAY</Text>
          <View style={styles.activityGrid}>
            <TouchableOpacity
              style={[styles.activityCard, { borderColor: 'rgba(139, 92, 246, 0.3)' }]}
              onPress={() => router.push('/games' as any)}
            >
              <Text style={styles.activityEmoji}>🎮</Text>
              <Text style={[styles.activityTag, { color: '#A78BFA' }]}>TRIVIA</Text>
              <Text style={styles.activityTitle}>Games</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.activityCard, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}
              onPress={() => router.push('/drills' as any)}
            >
              <Text style={styles.activityEmoji}>⚡</Text>
              <Text style={[styles.activityTag, { color: '#FBBF24' }]}>SPEED</Text>
              <Text style={styles.activityTitle}>Drills</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.trainerCard}
            onPress={() => router.push('/trainer' as any)}
          >
            <View>
              <Text style={[styles.activityTag, { color: '#4ADE80' }]}>STRATEGY</Text>
              <Text style={styles.activityTitle}>Trainer Scenarios</Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Investment Lab Teaser */}
        <TouchableOpacity
          style={[
            styles.investmentLabCard,
            isProUser
              ? { borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.06)' }
              : { borderColor: 'rgba(139, 92, 246, 0.2)', backgroundColor: 'rgba(139, 92, 246, 0.04)' },
          ]}
          onPress={() => router.push('/investment-lab' as any)}
        >
          <View style={[styles.investmentLabIcon, isProUser ? { backgroundColor: 'rgba(16, 185, 129, 0.2)' } : { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
            <Text style={{ fontSize: 20 }}>{isProUser ? '📈' : '🔒'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.investmentLabHeader}>
              <Text style={styles.investmentLabTitle}>Investment Lab</Text>
              {isProUser ? (
                <View style={styles.bonusBadge}>
                  <Text style={styles.bonusBadgeText}>BONUS</Text>
                </View>
              ) : (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>👑 PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.investmentLabSubtitle}>
              {isProUser ? 'Become investment-ready' : 'Unlock with Pro'}
            </Text>
          </View>
          <Text style={styles.chevron}>→</Text>
        </TouchableOpacity>

        {/* Quick Access Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
          <View style={styles.quickGrid}>
            {[
              { emoji: '📓', label: 'Notes', route: '/(tabs)/notebook' },
              { emoji: '🏆', label: 'Rank', route: '/leaderboard' },
              { emoji: '🏅', label: 'Badges', route: '/achievements' },
              { emoji: '📰', label: 'News', route: '/summaries' },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickCard}
                onPress={() => router.push(item.route as any)}
              >
                <Text style={styles.quickEmoji}>{item.emoji}</Text>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Daily News Feed */}
        {newsItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INDUSTRY INTEL</Text>
            <View style={{ gap: 8 }}>
              {newsItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.newsCard}
                  activeOpacity={0.7}
                  onPress={() => router.push('/summaries' as any)}
                >
                  <View style={styles.newsContent}>
                    {item.category_tag && (
                      <View style={styles.newsCategoryChip}>
                        <Text style={styles.newsCategoryText}>{item.category_tag}</Text>
                      </View>
                    )}
                    <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                    {item.summary && (
                      <Text style={styles.newsSummary} numberOfLines={2}>{item.summary}</Text>
                    )}
                    <Text style={styles.newsSource}>
                      {item.source_name} · {new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Slide Reader */}
      {showReader && activeStack && (
        <SlideReader
          stackTitle={activeStack.title}
          stackType={activeStack.stack_type as 'NEWS' | 'HISTORY' | 'LESSON'}
          slides={activeStack.slides.map((s) => ({
            slideNumber: s.slide_number,
            title: s.title,
            body: s.body,
            sources: s.sources,
          }))}
          onClose={() => setShowReader(false)}
          onComplete={handleStackComplete}
          onSaveInsight={handleSaveInsight}
          onAddNote={handleAddNote}
          isReview={lessonCompletedToday && activeStack.stack_type === 'LESSON'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg0,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  industryEmoji: {
    fontSize: 28,
  },
  industryName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dayText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  leoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  leoMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  crownEmoji: {
    fontSize: 16,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  completedCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 12,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  completedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCheckmark: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  completedXP: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 2,
  },
  completedActions: {
    flexDirection: 'row',
    gap: 10,
  },
  reviewButton: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  practiceButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  practiceButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  activityGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  activityCard: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    height: 110,
    justifyContent: 'flex-end',
  },
  activityEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  activityTag: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  trainerCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  investmentLabCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  investmentLabIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  investmentLabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  investmentLabTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  investmentLabSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  bonusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bonusBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#10B981',
  },
  proBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickEmoji: {
    fontSize: 24,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  chevron: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  newsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  newsContent: {
    flex: 1,
  },
  newsCategoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  newsCategoryText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#60A5FA',
    letterSpacing: 0.5,
  },
  newsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  newsSummary: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 6,
  },
  newsSource: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
