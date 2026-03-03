import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';
import { SeasonSection } from '../../components/roadmap/SeasonSection';
import type { NodeStatus } from '../../components/roadmap/RoadmapNode';

interface Lesson {
  day: number;
  title: string;
  pattern: string;
  completed: boolean;
  current?: boolean;
  stackId?: string;
}

interface Week {
  weekNumber: number;
  title: string;
  dayRange: string;
  lessons: Lesson[];
  status: NodeStatus;
  completedCount: number;
}

interface Season {
  seasonNumber: number;
  title: string;
  subtitle: string;
  weeks: Week[];
  isExpanded: boolean;
}

const SEASON_META = [
  { title: 'Foundations', subtitle: 'Month 1 • Core fundamentals' },
  { title: 'Forces & Cycles', subtitle: 'Month 2 • Market forces and timing' },
  { title: 'Startup Patterns', subtitle: 'Month 3 • Building in this market' },
  { title: 'Key Players', subtitle: 'Month 4 • Industry deep dives' },
  { title: 'Investment Lens', subtitle: 'Month 5 • Investor perspective' },
  { title: 'Builder Mode', subtitle: 'Month 6 • Apply everything' },
];

const WEEK_TITLES = [
  'Market Structure', 'Certification Reality', 'Business Dynamics', 'Execution Patterns',
  'Regulation Deep Dive', 'Capital Flows', 'Talent Dynamics', 'Technology Waves',
  'Moat Building', 'GTM Strategies', 'Failure Modes', 'Success Stories',
  'Commercial Giants', 'Defense Primes', 'Space Innovators', 'Supply Chain',
  'Public Markets', 'Private Markets', 'Due Diligence', 'Portfolio Strategy',
  'Thesis Building', 'Analysis Project', 'Future Scenarios', 'Graduation',
  'Advanced Topics I', 'Advanced Topics II', 'Case Studies I', 'Case Studies II',
  'Emerging Trends', 'Cross-Market', 'Synthesis I', 'Synthesis II',
  'Capstone I', 'Capstone II', 'Capstone III', 'Final Review',
];

function getDayWeek(day: number): number {
  return Math.ceil(day / 5);
}

export default function RoadmapScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentLessonTitle, setCurrentLessonTitle] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_market')
        .eq('id', user.id)
        .single();

      const market = profile?.selected_market || 'aerospace';

      const { data: progress } = await supabase
        .from('user_progress')
        .select('start_date, completed_stacks, learning_goal')
        .eq('user_id', user.id)
        .eq('market_id', market)
        .single();

      const learningGoal = progress?.learning_goal || 'curiosity';
      const goalTag = `goal:${learningGoal}`;
      const completed = (progress?.completed_stacks as string[]) || [];

      let day = 1;
      if (progress?.start_date) {
        const start = new Date(progress.start_date);
        const today = new Date();
        start.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        day = Math.min(180, Math.max(1, diffDays + 1));
      }
      setCurrentDay(day);

      // Fetch all lesson stacks for this market
      const { data: allStacks } = await supabase
        .from('stacks')
        .select('id, title, tags')
        .eq('market_id', market)
        .contains('tags', ['MICRO_LESSON'])
        .not('published_at', 'is', null);

      // Build day -> lesson map, preferring goal-tagged stacks
      const dayLessonMap = new Map<number, { title: string; stackId: string }>();
      allStacks?.forEach((stack: any) => {
        const tags = stack.tags as string[];
        const dayTag = tags?.find((t: string) => t.startsWith('day-'));
        if (!dayTag) return;
        const dayNum = parseInt(dayTag.replace('day-', ''), 10);
        if (isNaN(dayNum)) return;
        const hasGoalTag = tags.includes(goalTag);
        const existing = dayLessonMap.get(dayNum);
        if (!existing || hasGoalTag) {
          dayLessonMap.set(dayNum, { title: stack.title, stackId: stack.id });
        }
      });

      // Set current lesson title
      const todayLesson = dayLessonMap.get(day);
      setCurrentLessonTitle(todayLesson?.title || `Day ${day}`);

      const currentWeek = getDayWeek(day);

      // Build 6 seasons × 6 weeks × 5 days = 180 days
      const builtSeasons: Season[] = SEASON_META.map((meta, sIdx) => {
        const weeksPerMonth = 6;
        const startWeek = sIdx * weeksPerMonth + 1;

        const weeks: Week[] = [];
        for (let w = 0; w < weeksPerMonth; w++) {
          const weekNum = startWeek + w;
          const startDay = (weekNum - 1) * 5 + 1;
          const days = [startDay, startDay + 1, startDay + 2, startDay + 3, startDay + 4];

          let status: NodeStatus = 'locked';
          if (weekNum < currentWeek) status = 'completed';
          else if (weekNum === currentWeek) status = 'current';
          else if (weekNum === currentWeek + 1) status = 'available';

          const lessons: Lesson[] = days.map((d) => {
            const dbLesson = dayLessonMap.get(d);
            const isCompleted = dbLesson ? completed.includes(dbLesson.stackId) : d < day;
            return {
              day: d,
              title: dbLesson?.title || `Day ${d}`,
              pattern: '',
              completed: isCompleted,
              current: d === day,
              stackId: dbLesson?.stackId,
            };
          });

          const weekTitle = WEEK_TITLES[weekNum - 1] || `Week ${weekNum}`;
          const firstDay = days[0];
          const lastDay = days[days.length - 1];

          weeks.push({
            weekNumber: weekNum,
            title: weekTitle,
            dayRange: `Days ${firstDay}–${lastDay}`,
            lessons,
            status,
            completedCount: lessons.filter((l) => l.completed).length,
          });
        }

        return {
          seasonNumber: sIdx + 1,
          title: meta.title,
          subtitle: meta.subtitle,
          weeks,
          isExpanded: weeks.some((w) => w.status === 'current'),
        };
      });

      setSeasons(builtSeasons);
      setLoading(false);
    };

    fetchProgress();
  }, [user]);

  const handleLessonClick = (dayNum: number) => {
    const lesson = seasons
      .flatMap((s) => s.weeks)
      .flatMap((w) => w.lessons)
      .find((l) => l.day === dayNum);
    if (lesson && (lesson.completed || lesson.current)) {
      setSelectedLesson(lesson);
    }
  };

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const seasonsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.stagger(150, [
        Animated.spring(headerAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.spring(cardAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.spring(seasonsAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const animStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  });

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
      >
        {/* Header */}
        <Animated.View style={[styles.header, animStyle(headerAnim)]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Your Journey</Text>
            <Text style={styles.subtitle}>
              Day {currentDay} of 180 · Week {getDayWeek(currentDay)}
            </Text>
          </View>
          <LeoCharacter size="sm" animation={currentDay > 1 ? 'success' : 'idle'} />
        </Animated.View>

        {/* Current lesson quick-start card */}
        {currentLessonTitle && (
          <Animated.View style={animStyle(cardAnim)}>
            <TouchableOpacity
              style={styles.currentCard}
              onPress={() => router.push('/(tabs)/home')}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.continueLabel}>CONTINUE LEARNING</Text>
                <Text style={styles.currentTitle}>{currentLessonTitle}</Text>
              </View>
              <View style={styles.startBtn}>
                <Text style={styles.startBtnText}>▶ Start</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Seasons */}
        <Animated.View style={animStyle(seasonsAnim)}>
          {seasons.map((season) => (
            <SeasonSection
              key={season.seasonNumber}
              seasonNumber={season.seasonNumber}
              title={season.title}
              subtitle={season.subtitle}
              weeks={season.weeks}
              defaultExpanded={season.isExpanded}
              onWeekClick={() => {}}
              onLessonClick={handleLessonClick}
            />
          ))}
        </Animated.View>
      </ScrollView>

      {/* Lesson detail modal */}
      <Modal visible={!!selectedLesson} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Day {selectedLesson?.day}: {selectedLesson?.title}
            </Text>
            <View style={styles.modalStatusRow}>
              <Text style={{ fontSize: 13, color: selectedLesson?.completed ? '#22C55E' : COLORS.accent }}>
                {selectedLesson?.completed ? '✅ Completed' : '⭐ Current lesson'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCTA}
              onPress={() => {
                setSelectedLesson(null);
                router.push('/(tabs)/home');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalCTAText}>
                📖 {selectedLesson?.completed ? 'Review Lesson' : 'Start Lesson'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setSelectedLesson(null)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textMuted },
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  continueLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  currentTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  startBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11,16,32,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  modalStatusRow: { marginBottom: 16 },
  modalCTA: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalCTAText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalCancel: { alignItems: 'center', paddingVertical: 10 },
  modalCancelText: { color: COLORS.textMuted, fontSize: 14 },
});
