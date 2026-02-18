import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';

interface Lesson {
  day: number;
  title: string;
  pattern: string;
  completed: boolean;
  current: boolean;
}

interface Week {
  weekNumber: number;
  title: string;
  lessons: Lesson[];
  status: 'completed' | 'current' | 'locked';
  completedCount: number;
}

interface Season {
  seasonNumber: number;
  title: string;
  subtitle: string;
  weeks: Week[];
  isExpanded: boolean;
}

// Generic patterns that work across all markets
const genericPatterns: Record<number, { title: string; pattern: string }> = {
  1: { title: 'Market Structure', pattern: 'Map the key players' },
  2: { title: 'Regulatory Landscape', pattern: 'Rules shape strategy' },
  3: { title: 'Supply Chain', pattern: 'Understand dependencies' },
  4: { title: 'Customer Discovery', pattern: 'Buyer ≠ User' },
  5: { title: 'Market Dynamics', pattern: 'Forces drive change' },
  6: { title: 'Business Models', pattern: 'How value flows' },
  7: { title: 'Competitive Moats', pattern: 'Sustainable advantage' },
  8: { title: 'Technology Cycles', pattern: 'Timing matters' },
  9: { title: 'Capital Structure', pattern: 'Who funds growth' },
  10: { title: 'GTM Strategy', pattern: 'Enter at the right level' },
  11: { title: 'Unit Economics', pattern: 'Track margins closely' },
  12: { title: 'Contract Types', pattern: 'Risk profile determines returns' },
  13: { title: 'Funding Timeline', pattern: 'Find patient capital' },
  14: { title: 'Startup Killers', pattern: 'Cash timing risks' },
  15: { title: 'Working Capital', pattern: '9-month liquidity buffer' },
  16: { title: 'Change Management', pattern: 'Formal change control' },
  17: { title: 'Product Market Fit', pattern: 'Validate before building' },
  18: { title: 'Trust & Credibility', pattern: 'Track records matter' },
  19: { title: 'Supply Control', pattern: 'Vertical vs. outsource' },
  20: { title: 'First Customer', pattern: 'Land early adopters' },
};

function getDayWeek(day: number): number {
  return Math.ceil(day / 5);
}

function buildWeek(weekNum: number, currentWeek: number, currentDay: number, title: string, days: number[]): Week {
  let status: 'completed' | 'current' | 'locked' = 'locked';
  if (weekNum < currentWeek) status = 'completed';
  else if (weekNum === currentWeek) status = 'current';

  const lessons: Lesson[] = days.map((d) => ({
    day: d,
    title: genericPatterns[d]?.title || `Day ${d}`,
    pattern: genericPatterns[d]?.pattern || 'Coming soon',
    completed: d < currentDay,
    current: d === currentDay,
  }));

  return {
    weekNumber: weekNum,
    title,
    lessons,
    status,
    completedCount: lessons.filter((l) => l.completed).length,
  };
}

export default function RoadmapScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

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
        .select('start_date, completed_stacks')
        .eq('user_id', user.id)
        .eq('market_id', market)
        .single();

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

      const currentWeek = getDayWeek(day);

      const buildSeasons: Season[] = [
        {
          seasonNumber: 1, title: 'Foundations', subtitle: 'Month 1 • Core fundamentals',
          weeks: [
            buildWeek(1, currentWeek, day, 'Market Structure', [1, 2, 3, 4, 5]),
            buildWeek(2, currentWeek, day, 'Certification Reality', [6, 7, 8, 9, 10]),
            buildWeek(3, currentWeek, day, 'Business Dynamics', [11, 12, 13, 14, 15]),
            buildWeek(4, currentWeek, day, 'Execution Patterns', [16, 17, 18, 19, 20]),
          ],
          isExpanded: true,
        },
        {
          seasonNumber: 2, title: 'Forces & Cycles', subtitle: 'Month 2 • Market forces and timing',
          weeks: [
            buildWeek(5, currentWeek, day, 'Regulation Deep Dive', [21, 22, 23, 24, 25]),
            buildWeek(6, currentWeek, day, 'Capital Flows', [26, 27, 28, 29, 30]),
            buildWeek(7, currentWeek, day, 'Talent Dynamics', [31, 32, 33, 34, 35]),
            buildWeek(8, currentWeek, day, 'Technology Waves', [36, 37, 38, 39, 40]),
          ],
          isExpanded: false,
        },
        {
          seasonNumber: 3, title: 'Startup Patterns', subtitle: 'Month 3 • Building in aerospace',
          weeks: [
            buildWeek(9, currentWeek, day, 'Moat Building', [41, 42, 43, 44, 45]),
            buildWeek(10, currentWeek, day, 'GTM Strategies', [46, 47, 48, 49, 50]),
            buildWeek(11, currentWeek, day, 'Failure Modes', [51, 52, 53, 54, 55]),
            buildWeek(12, currentWeek, day, 'Success Stories', [56, 57, 58, 59, 60]),
          ],
          isExpanded: false,
        },
        {
          seasonNumber: 4, title: 'Key Players', subtitle: 'Month 4 • Industry deep dives',
          weeks: [
            buildWeek(13, currentWeek, day, 'Commercial Giants', [61, 62, 63, 64, 65]),
            buildWeek(14, currentWeek, day, 'Defense Primes', [66, 67, 68, 69, 70]),
            buildWeek(15, currentWeek, day, 'Space Innovators', [71, 72, 73, 74, 75]),
            buildWeek(16, currentWeek, day, 'Supply Chain', [76, 77, 78, 79, 80]),
          ],
          isExpanded: false,
        },
        {
          seasonNumber: 5, title: 'Investment Lens', subtitle: 'Month 5 • Investor perspective',
          weeks: [
            buildWeek(17, currentWeek, day, 'Public Markets', [81, 82, 83, 84, 85]),
            buildWeek(18, currentWeek, day, 'Private Markets', [86, 87, 88, 89, 90]),
            buildWeek(19, currentWeek, day, 'Due Diligence', [91, 92, 93, 94, 95]),
            buildWeek(20, currentWeek, day, 'Portfolio Strategy', [96, 97, 98, 99, 100]),
          ],
          isExpanded: false,
        },
        {
          seasonNumber: 6, title: 'Builder Mode', subtitle: 'Month 6 • Apply everything',
          weeks: [
            buildWeek(21, currentWeek, day, 'Thesis Building', [101, 102, 103, 104, 105]),
            buildWeek(22, currentWeek, day, 'Analysis Project', [106, 107, 108, 109, 110]),
            buildWeek(23, currentWeek, day, 'Future Scenarios', [111, 112, 113, 114, 115]),
            buildWeek(24, currentWeek, day, 'Graduation', [116, 117, 118, 119, 120]),
          ],
          isExpanded: false,
        },
      ];

      setSeasons(buildSeasons);
      setLoading(false);
    };

    fetchProgress();
  }, [user]);

  const toggleSeason = (seasonNumber: number) => {
    setSeasons((prev) =>
      prev.map((s) => (s.seasonNumber === seasonNumber ? { ...s, isExpanded: !s.isExpanded } : s))
    );
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.completed || lesson.current) {
      setSelectedLesson(lesson);
    }
  };

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
        {/* Header with Leo */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Your Journey</Text>
            <Text style={styles.subtitle}>
              Day {currentDay} of 180 • Week {getDayWeek(currentDay)}
            </Text>
          </View>
          <LeoCharacter size="sm" animation={currentDay > 1 ? 'success' : 'idle'} />
        </View>

        {/* Current Lesson Card */}
        {genericPatterns[currentDay] && (
          <TouchableOpacity
            style={styles.currentLessonCard}
            onPress={() => router.push('/(tabs)/home')}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.continueLabel}>CONTINUE LEARNING</Text>
              <Text style={styles.currentLessonTitle}>{genericPatterns[currentDay].title}</Text>
              <Text style={styles.currentLessonPattern}>{genericPatterns[currentDay].pattern}</Text>
            </View>
            <View style={styles.startButton}>
              <Text style={styles.startButtonText}>▶ Start</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Seasons */}
        <View style={{ gap: 10 }}>
          {seasons.map((season) => (
            <View key={season.seasonNumber} style={styles.seasonCard}>
              {/* Season Header */}
              <TouchableOpacity
                style={styles.seasonHeader}
                onPress={() => toggleSeason(season.seasonNumber)}
              >
                <View style={styles.seasonHeaderLeft}>
                  <View
                    style={[
                      styles.seasonIcon,
                      season.weeks.some((w) => w.status === 'current')
                        ? styles.seasonIconCurrent
                        : season.weeks.every((w) => w.status === 'completed')
                        ? styles.seasonIconCompleted
                        : {},
                    ]}
                  >
                    <Text style={styles.seasonIconText}>{season.seasonNumber}</Text>
                  </View>
                  <View>
                    <Text style={styles.seasonTitle}>{season.title}</Text>
                    <Text style={styles.seasonSubtitle}>{season.subtitle}</Text>
                  </View>
                </View>
                <Text style={styles.expandIcon}>{season.isExpanded ? '▾' : '▸'}</Text>
              </TouchableOpacity>

              {/* Weeks (expanded) */}
              {season.isExpanded && (
                <View style={styles.weeksContainer}>
                  {season.weeks.map((week) => (
                    <View
                      key={week.weekNumber}
                      style={[
                        styles.weekCard,
                        week.status === 'current' && styles.weekCardCurrent,
                        week.status === 'completed' && styles.weekCardCompleted,
                      ]}
                    >
                      <View style={styles.weekHeader}>
                        <View style={styles.weekHeaderLeft}>
                          <Text style={{ fontSize: 12 }}>
                            {week.status === 'completed' ? '✅' : week.status === 'current' ? '⭐' : '🔒'}
                          </Text>
                          <Text style={styles.weekTitle}>Week {week.weekNumber}: {week.title}</Text>
                        </View>
                        <Text style={styles.weekCount}>{week.completedCount}/{week.lessons.length}</Text>
                      </View>

                      {/* Lesson dots */}
                      <View style={styles.lessonDots}>
                        {week.lessons.map((lesson) => (
                          <TouchableOpacity
                            key={lesson.day}
                            style={[
                              styles.lessonDot,
                              lesson.completed && styles.lessonDotCompleted,
                              lesson.current && styles.lessonDotCurrent,
                            ]}
                            onPress={() => handleLessonClick(lesson)}
                            disabled={!lesson.completed && !lesson.current}
                          >
                            <Text style={styles.lessonDotText}>
                              {lesson.completed ? '✓' : lesson.current ? '▶' : '🔒'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Lesson Detail Modal */}
      <Modal visible={!!selectedLesson} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Day {selectedLesson?.day}: {selectedLesson?.title}
            </Text>
            <View style={styles.modalPatternCard}>
              <Text style={styles.modalPatternLabel}>Pattern</Text>
              <Text style={styles.modalPatternText}>{selectedLesson?.pattern}</Text>
            </View>
            <View style={styles.modalStatus}>
              <Text style={{ fontSize: 13, color: selectedLesson?.completed ? COLORS.success : COLORS.accent }}>
                {selectedLesson?.completed ? '✅ Completed' : '⭐ Current lesson'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalCTA}
              onPress={() => {
                setSelectedLesson(null);
                router.push('/(tabs)/home');
              }}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textMuted },
  currentLessonCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  continueLabel: { fontSize: 10, fontWeight: '600', color: COLORS.accent, marginBottom: 4, letterSpacing: 0.5 },
  currentLessonTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  currentLessonPattern: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  startButton: { backgroundColor: COLORS.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  startButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  seasonCard: { backgroundColor: 'rgba(17, 28, 51, 0.5)', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  seasonHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  seasonHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  seasonIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  seasonIconCurrent: { backgroundColor: 'rgba(139, 92, 246, 0.2)' },
  seasonIconCompleted: { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  seasonIconText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  seasonTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  seasonSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  expandIcon: { fontSize: 18, color: COLORS.textMuted },
  weeksContainer: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  weekCard: { borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 12, backgroundColor: 'rgba(15, 23, 42, 0.5)' },
  weekCardCurrent: { backgroundColor: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.3)' },
  weekCardCompleted: { backgroundColor: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.2)' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  weekHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weekTitle: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary },
  weekCount: { fontSize: 10, color: COLORS.textMuted },
  lessonDots: { flexDirection: 'row', gap: 6 },
  lessonDot: {
    flex: 1, height: 32, borderRadius: 8, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  lessonDotCompleted: { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.3)' },
  lessonDotCurrent: { backgroundColor: 'rgba(139, 92, 246, 0.2)', borderColor: 'rgba(139, 92, 246, 0.3)' },
  lessonDotText: { fontSize: 10, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(11, 16, 32, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: COLORS.bg2, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border, width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  modalPatternCard: { backgroundColor: 'rgba(139, 92, 246, 0.05)', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)', borderRadius: 12, padding: 12, marginBottom: 12 },
  modalPatternLabel: { fontSize: 11, fontWeight: '600', color: COLORS.accent, marginBottom: 4 },
  modalPatternText: { fontSize: 14, color: COLORS.textSecondary },
  modalStatus: { marginBottom: 16 },
  modalCTA: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  modalCTAText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  modalCancel: { alignItems: 'center', paddingVertical: 8 },
  modalCancelText: { color: COLORS.textMuted, fontSize: 14 },
});
