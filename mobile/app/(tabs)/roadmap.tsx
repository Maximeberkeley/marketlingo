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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { triggerHaptic } from '../../lib/haptics';
import { playSound } from '../../lib/sounds';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Types ──────────────────────────────────────────────
interface Lesson {
  day: number;
  title: string;
  completed: boolean;
  current?: boolean;
  stackId?: string;
}

interface Week {
  weekNumber: number;
  title: string;
  dayRange: string;
  lessons: Lesson[];
  status: 'locked' | 'current' | 'completed' | 'available';
  completedCount: number;
}

interface Season {
  seasonNumber: number;
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  colorSoft: string;
  weeks: Week[];
  isExpanded: boolean;
  totalLessons: number;
  completedLessons: number;
}

// ── Season config — Brilliant-style chapters ──────────
const SEASON_META: { title: string; subtitle: string; icon: keyof typeof Feather.glyphMap; color: string; colorSoft: string }[] = [
  { title: 'Foundations', subtitle: 'Core market fundamentals', icon: 'layers', color: '#3B82F6', colorSoft: 'rgba(59,130,246,0.08)' },
  { title: 'Forces & Cycles', subtitle: 'Market forces and timing', icon: 'trending-up', color: '#8B5CF6', colorSoft: 'rgba(139,92,246,0.08)' },
  { title: 'Startup Patterns', subtitle: 'Building in this market', icon: 'zap', color: '#F59E0B', colorSoft: 'rgba(245,158,11,0.08)' },
  { title: 'Key Players', subtitle: 'Industry deep dives', icon: 'users', color: '#10B981', colorSoft: 'rgba(16,185,129,0.08)' },
  { title: 'Investment Lens', subtitle: 'Investor perspective', icon: 'eye', color: '#EC4899', colorSoft: 'rgba(236,72,153,0.08)' },
  { title: 'Builder Mode', subtitle: 'Apply everything', icon: 'award', color: '#F97316', colorSoft: 'rgba(249,115,22,0.08)' },
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

function getDayWeek(day: number) { return Math.ceil(day / 5); }

// ── Main Screen ───────────────────────────────────────
export default function RoadmapScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchProgress();
  }, [user]);

  useEffect(() => {
    if (!loading) {
      Animated.stagger(120, [
        Animated.spring(headerAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.spring(statsAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.spring(cardsAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

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

    const { data: allStacks } = await supabase
      .from('stacks')
      .select('id, title, tags')
      .eq('market_id', market)
      .contains('tags', ['MICRO_LESSON'])
      .not('published_at', 'is', null);

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

    const currentWeek = getDayWeek(day);

    const builtSeasons: Season[] = SEASON_META.map((meta, sIdx) => {
      const weeksPerMonth = 6;
      const startWeek = sIdx * weeksPerMonth + 1;
      let totalLessons = 0;
      let completedLessons = 0;

      const weeks: Week[] = [];
      for (let w = 0; w < weeksPerMonth; w++) {
        const weekNum = startWeek + w;
        const startDay = (weekNum - 1) * 5 + 1;
        const days = [startDay, startDay + 1, startDay + 2, startDay + 3, startDay + 4];

        let status: Week['status'] = 'locked';
        if (weekNum < currentWeek) status = 'available'; // Past weeks are reviewable
        else if (weekNum === currentWeek) status = 'current';
        else if (weekNum === currentWeek + 1) status = 'available';

        const lessons: Lesson[] = days.map((d) => {
          const dbLesson = dayLessonMap.get(d);
          const isCompleted = dbLesson ? completed.includes(dbLesson.stackId) : d < day;
          totalLessons++;
          if (isCompleted) completedLessons++;
          return {
            day: d,
            title: dbLesson?.title || `Day ${d}`,
            completed: isCompleted,
            current: d === day,
            stackId: dbLesson?.stackId,
          };
        });

        weeks.push({
          weekNumber: weekNum,
          title: WEEK_TITLES[weekNum - 1] || `Week ${weekNum}`,
          dayRange: `Days ${days[0]}–${days[days.length - 1]}`,
          lessons,
          status,
          completedCount: lessons.filter((l) => l.completed).length,
        });
      }

      const isCurrent = weeks.some((w) => w.status === 'current');

      return {
        seasonNumber: sIdx + 1,
        title: meta.title,
        subtitle: meta.subtitle,
        icon: meta.icon,
        color: meta.color,
        colorSoft: meta.colorSoft,
        weeks,
        isExpanded: isCurrent,
        totalLessons,
        completedLessons,
      };
    });

    // Auto-expand current season
    const currentSeasonIdx = builtSeasons.findIndex((s) => s.isExpanded);
    if (currentSeasonIdx >= 0) setExpandedSeason(currentSeasonIdx);

    setSeasons(builtSeasons);
    setLoading(false);
  };

  const handleSeasonToggle = (idx: number) => {
    triggerHaptic('selection');
    setExpandedSeason(expandedSeason === idx ? null : idx);
  };

  const handleLessonClick = (lesson: Lesson) => {
    // Allow clicking any day up to and including the current day (for review or current lesson)
    if (lesson.day <= currentDay) {
      triggerHaptic('light');
      setSelectedLesson(lesson);
    }
  };

  const animStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const totalCompleted = seasons.reduce((a, s) => a + s.completedLessons, 0);
  const totalLessons = seasons.reduce((a, s) => a + s.totalLessons, 0);
  const overallPct = Math.round((totalCompleted / totalLessons) * 100);
  const currentWeek = getDayWeek(currentDay);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ───────────────────────────── */}
        <Animated.View style={[styles.header, animStyle(headerAnim)]}>
          <Text style={styles.pageTitle}>Courses</Text>
          <Text style={styles.pageSubtitle}>
            Day {currentDay} · Week {currentWeek}
          </Text>
        </Animated.View>

        {/* ─── Stats row ────────────────────────── */}
        <Animated.View style={[styles.statsRow, animStyle(statsAnim)]}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalCompleted}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{overallPct}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{seasons.length}</Text>
            <Text style={styles.statLabel}>Chapters</Text>
          </View>
        </Animated.View>

        {/* ─── Overall progress bar ─────────────── */}
        <Animated.View style={animStyle(statsAnim)}>
          <View style={styles.overallProgress}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${overallPct}%` as any }]} />
            </View>
            <Text style={styles.progressLabel}>{overallPct}% of 180-day journey</Text>
          </View>
        </Animated.View>

        {/* ─── Season Cards — Brilliant Style ──── */}
        <Animated.View style={animStyle(cardsAnim)}>
          {seasons.map((season, sIdx) => {
            const isExpanded = expandedSeason === sIdx;
            const seasonPct = season.totalLessons > 0
              ? Math.round((season.completedLessons / season.totalLessons) * 100) : 0;
            const isComplete = seasonPct === 100;
            const isCurrent = season.weeks.some((w) => w.status === 'current');
            const isLocked = season.weeks.every((w) => w.status === 'locked');

            return (
              <View key={sIdx} style={styles.seasonCard}>
                {/* Season header card */}
                <TouchableOpacity
                  style={[
                    styles.seasonHeader,
                    isExpanded && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
                  ]}
                  onPress={() => handleSeasonToggle(sIdx)}
                  activeOpacity={0.75}
                >
                  {/* Color accent bar */}
                  <View style={[styles.seasonAccentBar, { backgroundColor: season.color }]} />

                  <View style={styles.seasonHeaderContent}>
                    {/* Icon */}
                    <View style={[styles.seasonIconWrap, { backgroundColor: season.colorSoft }]}>
                      {isLocked ? (
                        <Feather name="lock" size={20} color={COLORS.textMuted} />
                      ) : isComplete ? (
                        <Feather name="check-circle" size={20} color={season.color} />
                      ) : (
                        <Feather name={season.icon} size={20} color={season.color} />
                      )}
                    </View>

                    {/* Text */}
                    <View style={styles.seasonTextWrap}>
                      <View style={styles.seasonTitleRow}>
                        <Text style={[
                          styles.seasonTitle,
                          isLocked && { opacity: 0.45 },
                        ]}>{season.title}</Text>
                        {isCurrent && (
                          <View style={[styles.currentBadge, { backgroundColor: season.color }]}>
                            <Text style={styles.currentBadgeText}>CURRENT</Text>
                          </View>
                        )}
                        {isComplete && (
                          <View style={[styles.currentBadge, { backgroundColor: COLORS.success }]}>
                            <Text style={styles.currentBadgeText}>DONE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[
                        styles.seasonSubtitle,
                        isLocked && { opacity: 0.35 },
                      ]}>{season.subtitle}</Text>

                      {/* Mini progress */}
                      {!isLocked && (
                        <View style={styles.miniProgressRow}>
                          <View style={styles.miniProgressTrack}>
                            <View style={[
                              styles.miniProgressFill,
                              { width: `${seasonPct}%` as any, backgroundColor: season.color },
                            ]} />
                          </View>
                          <Text style={styles.miniProgressText}>
                            {season.completedLessons}/{season.totalLessons}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Chevron */}
                    <Feather
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </View>
                </TouchableOpacity>

                {/* Expanded weeks */}
                {isExpanded && (
                  <View style={styles.weeksWrap}>
                    {season.weeks.map((week) => (
                      <WeekCard
                        key={week.weekNumber}
                        week={week}
                        seasonColor={season.color}
                        seasonColorSoft={season.colorSoft}
                        onLessonClick={handleLessonClick}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* ─── Lesson Detail Modal ─────────────── */}
      <Modal visible={!!selectedLesson} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={[
                styles.modalDayBadge,
                selectedLesson?.completed
                  ? { backgroundColor: COLORS.success }
                  : { backgroundColor: COLORS.accentSoft },
              ]}>
                {selectedLesson?.completed ? (
                  <Feather name="check" size={18} color="#fff" />
                ) : (
                  <Text style={styles.modalDayNum}>{selectedLesson?.day}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {selectedLesson?.title}
                </Text>
                <Text style={[
                  styles.modalStatus,
                  { color: selectedLesson?.completed ? COLORS.success : COLORS.accent },
                ]}>
                  {selectedLesson?.completed ? 'Completed' : 'Current lesson'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCTA}
              onPress={() => {
                triggerHaptic('light');
                setSelectedLesson(null);
                router.push('/(tabs)/home');
              }}
              activeOpacity={0.85}
            >
              <Feather
                name={selectedLesson?.completed ? 'rotate-ccw' : 'play'}
                size={18}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.modalCTAText}>
                {selectedLesson?.completed ? 'Review Lesson' : 'Start Lesson'}
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

// ── Week Card — Brilliant-style collapsible ──────────
function WeekCard({
  week,
  seasonColor,
  seasonColorSoft,
  onLessonClick,
}: {
  week: Week;
  seasonColor: string;
  seasonColorSoft: string;
  onLessonClick: (lesson: Lesson) => void;
}) {
  const [expanded, setExpanded] = useState(week.status === 'current');
  const isLocked = week.status === 'locked';
  const isComplete = week.status === 'completed';
  const isCurrent = week.status === 'current';

  return (
    <View style={[
      styles.weekCard,
      isCurrent && { borderColor: seasonColor, borderWidth: 1.5 },
    ]}>
      <TouchableOpacity
        style={styles.weekHeader}
        onPress={() => {
          if (!isLocked) {
            triggerHaptic('selection');
            setExpanded(!expanded);
          }
        }}
        activeOpacity={isLocked ? 1 : 0.7}
      >
        {/* Week icon */}
        <View style={[
          styles.weekIcon,
          isComplete && { backgroundColor: `${seasonColor}18` },
          isCurrent && { backgroundColor: seasonColorSoft },
          isLocked && { opacity: 0.35 },
        ]}>
          {isLocked ? (
            <Feather name="lock" size={14} color={COLORS.textMuted} />
          ) : isComplete ? (
            <Feather name="check" size={14} color={seasonColor} />
          ) : (
            <Text style={[styles.weekNum, { color: isCurrent ? seasonColor : COLORS.textPrimary }]}>
              {week.weekNumber}
            </Text>
          )}
        </View>

        <View style={styles.weekTextWrap}>
          <Text style={[styles.weekTitle, isLocked && { opacity: 0.4 }]} numberOfLines={1}>
            {week.title}
          </Text>
          <Text style={[styles.weekDays, isLocked && { opacity: 0.3 }]}>{week.dayRange}</Text>
        </View>

        {/* Completion dots */}
        {!isLocked && (
          <View style={styles.dotsRow}>
            {week.lessons.map((l, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  l.completed && { backgroundColor: seasonColor },
                  l.current && { backgroundColor: seasonColor, opacity: 0.5 },
                ]}
              />
            ))}
          </View>
        )}

        {isCurrent && (
          <View style={[styles.nowChip, { backgroundColor: seasonColor }]}>
            <Text style={styles.nowChipText}>NOW</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Expanded lessons */}
      {expanded && !isLocked && (
        <View style={styles.lessonsWrap}>
          {week.lessons.map((lesson) => {
            // Past and current days are accessible (for review or learning)
            const isAccessible = lesson.completed || lesson.current || week.status === 'available';
            return (
              <TouchableOpacity
                key={lesson.day}
                style={[
                  styles.lessonRow,
                  lesson.completed && { backgroundColor: `${seasonColor}08` },
                  lesson.current && { backgroundColor: seasonColorSoft, borderColor: seasonColor, borderWidth: 1 },
                ]}
                onPress={() => isAccessible && onLessonClick(lesson)}
                disabled={!isAccessible}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.lessonDot,
                  lesson.completed && { backgroundColor: seasonColor },
                  lesson.current && { backgroundColor: seasonColor, opacity: 0.6 },
                  (!lesson.completed && !lesson.current && isAccessible) && { backgroundColor: COLORS.textMuted, opacity: 0.4 },
                ]}>
                  {lesson.completed && <Feather name="check" size={10} color="#fff" />}
                  {lesson.current && <Feather name="play" size={8} color="#fff" />}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.lessonTitle,
                    !isAccessible && { opacity: 0.4 },
                  ]} numberOfLines={1}>
                    {lesson.title}
                  </Text>
                  <Text style={styles.lessonDay}>Day {lesson.day}</Text>
                </View>

                {isAccessible && (
                  <Feather name="chevron-right" size={14} color={COLORS.textMuted} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20 },

  // Header
  header: { marginBottom: 20 },
  pageTitle: { ...TYPE.hero, color: COLORS.textPrimary },
  pageSubtitle: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 4 },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { ...TYPE.h2, color: COLORS.textPrimary },
  statLabel: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 2 },

  // Overall progress
  overallProgress: { marginBottom: 24 },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  progressLabel: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 6, textAlign: 'center' },

  // Season card
  seasonCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  seasonHeader: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  seasonAccentBar: {
    height: 3,
    width: '100%',
  },
  seasonHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  seasonIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonTextWrap: { flex: 1 },
  seasonTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seasonTitle: { ...TYPE.h3, color: COLORS.textPrimary },
  seasonSubtitle: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 2 },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  // Mini progress
  miniProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  miniProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: 4,
    borderRadius: 2,
  },
  miniProgressText: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 10 },

  // Weeks
  weeksWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 6,
  },
  weekCard: {
    borderRadius: 14,
    backgroundColor: COLORS.bg1,
    overflow: 'hidden',
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  weekIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNum: { fontSize: 13, fontWeight: '700' },
  weekTextWrap: { flex: 1, minWidth: 0 },
  weekTitle: { ...TYPE.bodyBold, fontSize: 13, color: COLORS.textPrimary },
  weekDays: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  dotsRow: { flexDirection: 'row', gap: 3 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.borderLight,
  },
  nowChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nowChipText: { fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  // Lessons
  lessonsWrap: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 4,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.bg2,
    gap: 10,
  },
  lessonDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonTitle: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  lessonDay: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  modalDayBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDayNum: { ...TYPE.h3, color: COLORS.accent },
  modalTitle: { ...TYPE.h2, color: COLORS.textPrimary, marginBottom: 4 },
  modalStatus: { ...TYPE.caption },
  modalCTA: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...SHADOWS.accent,
  },
  modalCTAText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalCancel: { alignItems: 'center', paddingVertical: 10 },
  modalCancelText: { color: COLORS.textMuted, fontSize: 14 },
});
