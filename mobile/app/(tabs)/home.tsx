import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { storage, FamiliarityLevel, UserTier } from '../../lib/storage';
import { COLORS, INDUSTRIES } from '../../lib/constants';

interface LessonCard {
  id: string;
  title: string;
  type: 'lesson' | 'news' | 'game' | 'drill';
  duration: number;
  xp: number;
  completed?: boolean;
  locked?: boolean;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [industry, setIndustry] = useState<string | null>(null);
  const [familiarity, setFamiliarity] = useState<FamiliarityLevel | null>(null);
  const [userTier, setUserTier] = useState<UserTier>('free');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [ind, fam, tier] = await Promise.all([
        storage.getIndustry(),
        storage.getFamiliarity(),
        storage.getUserTier(),
      ]);
      setIndustry(ind);
      setFamiliarity(fam);
      setUserTier(tier);
      // TODO: Load streak, XP, day from Supabase
      setStreak(5);
      setXp(145);
      setCurrentDay(12);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const industryData = INDUSTRIES.find((i) => i.id === industry);

  const todaysLessons: LessonCard[] = [
    { id: '1', title: 'Daily Lesson', type: 'lesson', duration: 5, xp: 50 },
    { id: '2', title: 'Industry News', type: 'news', duration: 3, xp: 25 },
    { id: '3', title: 'Quick Game', type: 'game', duration: 2, xp: 30, locked: userTier === 'free' },
    { id: '4', title: 'Practice Drill', type: 'drill', duration: 5, xp: 40, locked: userTier === 'free' },
  ];

  if (loading) {
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.industryEmoji}>{industryData?.emoji || '🚀'}</Text>
            <View>
              <Text style={styles.industryName}>{industryData?.name || 'Aerospace'}</Text>
              <Text style={styles.dayText}>Day {currentDay} of 180</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.statBadge}>
              <Text style={styles.statEmoji}>⚡</Text>
              <Text style={styles.statValue}>{xp}</Text>
            </View>
            <View style={[styles.statBadge, styles.streakBadge]}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statValue}>{streak}</Text>
            </View>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingEmoji}>🦊</Text>
          <Text style={styles.greetingText}>
            {getGreeting()}, let's keep going! 🚀
          </Text>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Stage 1: Foundations</Text>
            <Text style={styles.progressPercent}>29%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '29%' }]} />
          </View>
        </View>

        {/* Today's Learning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TODAY'S LEARNING</Text>
          {todaysLessons.map((lesson) => (
            <TouchableOpacity
              key={lesson.id}
              style={[styles.lessonCard, lesson.locked && styles.lessonCardLocked]}
              onPress={() => !lesson.locked && handleLessonPress(lesson)}
              activeOpacity={lesson.locked ? 1 : 0.7}
            >
              <View style={styles.lessonContent}>
                <Text style={styles.lessonIcon}>{getLessonIcon(lesson.type)}</Text>
                <View style={styles.lessonInfo}>
                  <Text style={[styles.lessonTitle, lesson.locked && styles.textLocked]}>
                    {lesson.title}
                  </Text>
                  <Text style={styles.lessonMeta}>
                    {lesson.duration}m • +{lesson.xp} XP
                  </Text>
                </View>
              </View>
              {lesson.locked ? (
                <View style={styles.lockBadge}>
                  <Text style={styles.lockText}>🔒 PRO</Text>
                </View>
              ) : (
                <Text style={styles.chevron}>→</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Pro Upsell (if free) */}
        {userTier === 'free' && (
          <TouchableOpacity
            style={styles.proCard}
            onPress={() => router.push('/subscription')}
          >
            <Text style={styles.proEmoji}>👑</Text>
            <View style={styles.proContent}>
              <Text style={styles.proTitle}>Unlock Pro</Text>
              <Text style={styles.proSubtitle}>
                Get unlimited access to all content
              </Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getLessonIcon(type: string) {
  switch (type) {
    case 'lesson': return '📚';
    case 'news': return '📰';
    case 'game': return '🎮';
    case 'drill': return '🎯';
    default: return '📖';
  }
}

function handleLessonPress(lesson: LessonCard) {
  // TODO: Navigate to lesson screen
  console.log('Opening lesson:', lesson.id);
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
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  industryEmoji: {
    fontSize: 36,
  },
  industryName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dayText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  streakBadge: {
    backgroundColor: '#F9731620',
  },
  statEmoji: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  greetingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingEmoji: {
    fontSize: 80,
    marginBottom: 8,
  },
  greetingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.bg1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  lessonCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lessonCardLocked: {
    opacity: 0.6,
  },
  lessonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lessonIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  textLocked: {
    color: COLORS.textMuted,
  },
  lessonMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  chevron: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  lockBadge: {
    backgroundColor: COLORS.bg1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  proCard: {
    backgroundColor: '#8B5CF620',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  proEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  proContent: {
    flex: 1,
  },
  proTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 2,
  },
  proSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
