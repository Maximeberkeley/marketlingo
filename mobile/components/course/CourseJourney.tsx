import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { goalContentTag } from '../../lib/goals';
import { getMarketName } from '../../lib/markets';
import { dayPromise, seasonThemes, syllabusDay, TOTAL_DAYS } from '../../lib/syllabus';
import { triggerHaptic } from '../../lib/haptics';
import { StreakBadge } from '../ui/StreakBadge';
import { XPBadge } from '../ui/XPBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NODE_ROW_HEIGHT = 116;
const SEASON_HEADER_HEIGHT = 142;

const COURSE_COLORS = [
  { main: '#0EA5E9', deep: '#0369A1', soft: 'rgba(14,165,233,0.12)' },
  { main: '#8B5CF6', deep: '#6D28D9', soft: 'rgba(139,92,246,0.12)' },
  { main: '#F59E0B', deep: '#B45309', soft: 'rgba(245,158,11,0.12)' },
  { main: '#10B981', deep: '#047857', soft: 'rgba(16,185,129,0.12)' },
  { main: '#EC4899', deep: '#BE185D', soft: 'rgba(236,72,153,0.12)' },
  { main: '#F97316', deep: '#C2410C', soft: 'rgba(249,115,22,0.12)' },
];

const PATH_X = [0.5, 0.7, 0.78, 0.64, 0.4, 0.22, 0.31];

interface CourseLesson {
  day: number;
  title: string;
  stackId?: string;
  completed: boolean;
}

interface CourseJourneyProps {
  marketId: string;
  currentDay: number;
  learningGoal: string;
  completedStackIds: string[];
  streak: number;
  totalXp: number;
  level: number;
  lessonCompletedToday: boolean;
  onOpenLesson: (stackId: string) => void;
  onAskLeo: () => void;
}

function dayPosition(day: number) {
  const usable = Math.max(250, SCREEN_WIDTH - 104);
  return 52 + usable * PATH_X[(day - 1) % PATH_X.length];
}

function connectorStyle(day: number) {
  const from = dayPosition(day);
  const to = dayPosition(day + 1);
  const delta = to - from;
  const length = Math.sqrt(delta * delta + NODE_ROW_HEIGHT * NODE_ROW_HEIGHT);
  const angle = `${Math.atan2(NODE_ROW_HEIGHT, delta) * (180 / Math.PI)}deg`;
  return {
    width: length,
    left: from,
    transform: [{ rotate: angle }],
  };
}

export function CourseJourney({
  marketId,
  currentDay,
  learningGoal,
  completedStackIds,
  streak,
  totalXp,
  level,
  lessonCompletedToday,
  onOpenLesson,
  onAskLeo,
}: CourseJourneyProps) {
  const listRef = useRef<FlatList<CourseLesson>>(null);
  const pulse = useRef(new Animated.Value(0)).current;
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(true);

  const themes = useMemo(() => seasonThemes(marketId), [marketId]);
  const activePlan = syllabusDay(marketId, currentDay);
  const activeColor = COURSE_COLORS[activePlan.season - 1] ?? COURSE_COLORS[0];
  const weekStart = Math.floor((currentDay - 1) / 7) * 7 + 1;
  const weekEnd = Math.min(TOTAL_DAYS, weekStart + 6);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('stacks')
        .select('id, title, tags, created_at')
        .eq('market_id', marketId)
        .contains('tags', ['MICRO_LESSON'])
        .not('published_at', 'is', null)
        .order('created_at', { ascending: false });

      if (!active) return;
      const goalTag = goalContentTag(learningGoal);
      const byDay = new Map<number, { id: string; title: string; goalMatch: boolean }>();
      const completedByDay = new Map<number, boolean>();
      const completed = new Set(completedStackIds);

      (data || []).forEach((stack: any) => {
        const tags = Array.isArray(stack.tags) ? stack.tags : [];
        const tag = tags.find((value: string) => value.startsWith('day-'));
        const day = tag ? Number(tag.slice(4)) : NaN;
        if (!Number.isFinite(day) || day < 1 || day > TOTAL_DAYS) return;
        if (completed.has(stack.id)) completedByDay.set(day, true);
        const goalMatch = tags.includes(goalTag);
        const existing = byDay.get(day);
        if (!existing || (goalMatch && !existing.goalMatch)) {
          byDay.set(day, { id: stack.id, title: stack.title, goalMatch });
        }
      });

      setLessons(Array.from({ length: TOTAL_DAYS }, (_, index) => {
        const day = index + 1;
        const lesson = byDay.get(day);
        return {
          day,
          title: lesson?.title || dayPromise(marketId, day),
          stackId: lesson?.id,
          completed: completedByDay.get(day) || false,
        };
      }));
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [marketId, learningGoal, completedStackIds]);

  useEffect(() => {
    if (loading || lessons.length === 0) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: Math.max(0, currentDay - 1), animated: false, viewPosition: 0.38 });
    }, 80);
    return () => clearTimeout(timer);
  }, [currentDay, lessons.length, loading]);

  const openLesson = (lesson: CourseLesson) => {
    const canOpen = lesson.completed || lesson.day === currentDay;
    if (!canOpen || !lesson.stackId) return;
    triggerHaptic(lesson.day === currentDay ? 'medium' : 'light');
    onOpenLesson(lesson.stackId);
  };

  const renderSeasonHeader = (day: number) => {
    if ((day - 1) % 30 !== 0) return null;
    const season = Math.floor((day - 1) / 30);
    const palette = COURSE_COLORS[season] ?? COURSE_COLORS[0];
    const isActive = season === activePlan.season - 1;
    return (
      <View style={[styles.seasonHeader, { backgroundColor: palette.deep }]}>
        <View style={styles.seasonCopy}>
          <Text style={styles.seasonEyebrow}>SEASON {season + 1} · DAYS {day}–{Math.min(day + 29, TOTAL_DAYS)}</Text>
          <Text style={styles.seasonTitle} numberOfLines={2}>{themes[season] || `Season ${season + 1}`}</Text>
          <Text style={styles.seasonSubtitle}>Five territories. One idea at a time.</Text>
        </View>
        <View style={[styles.seasonSeal, { borderColor: palette.main }]}>
          <Feather name={isActive ? 'navigation' : season < activePlan.season - 1 ? 'check' : 'flag'} size={21} color={COLORS.textPrimary} />
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: CourseLesson }) => {
    const plan = syllabusDay(marketId, item.day);
    const palette = COURSE_COLORS[plan.season - 1] ?? COURSE_COLORS[0];
    const isToday = item.day === currentDay;
    const isFuture = item.day > currentDay;
    const isReview = plan.isConsolidation;
    const isMilestone = item.day % 15 === 0 && !isReview;
    const x = dayPosition(item.day);
    const nodeSize = isToday ? 78 : 62;
    const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.13] });
    const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.34, 0] });

    return (
      <View>
        {renderSeasonHeader(item.day)}
        <View style={styles.nodeRow}>
          {item.day < TOTAL_DAYS && <View style={[styles.connector, connectorStyle(item.day), { backgroundColor: item.completed ? palette.main : COLORS.border }]} />}

          {isToday && (
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  left: x - (nodeSize + 18) / 2,
                  width: nodeSize + 18,
                  height: nodeSize + 18,
                  borderRadius: (nodeSize + 18) / 2,
                  borderColor: palette.main,
                  opacity: pulseOpacity,
                  transform: [{ scale: pulseScale }],
                },
              ]}
            />
          )}

          <TouchableOpacity
            activeOpacity={isFuture ? 1 : 0.8}
            onPress={() => openLesson(item)}
            accessibilityRole="button"
            accessibilityLabel={`${isToday ? 'Today, ' : ''}Day ${item.day}: ${item.title}`}
            style={[
              styles.node,
              {
                left: x - nodeSize / 2,
                width: nodeSize,
                height: nodeSize,
                borderRadius: nodeSize / 2,
                backgroundColor: item.completed || isToday ? palette.main : COLORS.bg2,
                borderColor: isFuture ? COLORS.border : palette.deep,
                shadowColor: item.completed || isToday ? palette.deep : COLORS.cardShadow,
              },
              isToday && styles.todayNode,
            ]}
          >
            <View style={[styles.nodeHighlight, { width: nodeSize * 0.56 }]} />
            {item.completed ? (
              <Feather name="check" size={isToday ? 28 : 23} color="#FFFFFF" />
            ) : isReview ? (
              <Feather name="refresh-cw" size={isToday ? 27 : 21} color={isToday ? '#FFFFFF' : COLORS.textMuted} />
            ) : isMilestone ? (
              <Feather name="briefcase" size={isToday ? 28 : 22} color={isToday ? '#FFFFFF' : COLORS.textMuted} />
            ) : isFuture ? (
              <Feather name="lock" size={18} color={COLORS.textMuted} />
            ) : (
              <Feather name="play" size={27} color="#FFFFFF" style={{ marginLeft: 3 }} />
            )}
          </TouchableOpacity>

          {isToday && (
            <View style={[styles.todayLabel, x > SCREEN_WIDTH * 0.56 ? styles.todayLabelLeft : styles.todayLabelRight]}>
              <Text style={[styles.todayEyebrow, { color: palette.main }]}>{lessonCompletedToday ? 'OWNED TODAY' : 'YOUR NEXT MOVE'}</Text>
              <Text style={styles.todayTitle} numberOfLines={3}>{item.title}</Text>
              <Text style={styles.todayMeta}>Day {item.day} · {dayPromise(marketId, item.day)}</Text>
            </View>
          )}

          {isToday && (
            <TouchableOpacity style={[styles.leoMarker, x > SCREEN_WIDTH * 0.56 ? styles.leoLeft : styles.leoRight]} onPress={onAskLeo} activeOpacity={0.82}>
              <Image source={require('../../assets/mascot/leo-reading.png')} style={styles.leoImage} resizeMode="contain" />
              <View style={[styles.leoBubble, { borderColor: palette.main }]}>
                <Text style={styles.leoBubbleText}>{lessonCompletedToday ? 'Strong. Review it?' : 'This one matters.'}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <View style={[styles.loadingNode, { backgroundColor: activeColor.soft }]} />
        <Text style={styles.loadingText}>Charting your course…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={lessons}
        keyExtractor={(item) => String(item.day)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        maxToRenderPerBatch={16}
        windowSize={9}
        onScrollToIndexFailed={({ index }) => {
          listRef.current?.scrollToOffset({ offset: Math.max(0, index * NODE_ROW_HEIGHT), animated: false });
        }}
        ListHeaderComponent={(
          <View style={styles.header}>
            <View style={styles.topBar}>
              <View>
                <Text style={styles.courseLabel}>MY COURSE</Text>
                <Text style={styles.marketName}>{getMarketName(marketId)}</Text>
              </View>
              <View style={styles.badges}>
                <StreakBadge count={streak} />
                <XPBadge xp={totalXp} level={level} />
              </View>
            </View>
            <View style={[styles.weekBand, { borderColor: activeColor.main }]}> 
              <View style={styles.weekBandTop}>
                <Text style={[styles.weekEyebrow, { color: activeColor.main }]}>WEEK {Math.ceil(currentDay / 7)} · DAYS {weekStart}–{weekEnd}</Text>
                <Text style={styles.weekCount}>{Math.min(7, currentDay - weekStart + (lessonCompletedToday ? 1 : 0))}/7</Text>
              </View>
              <Text style={styles.weekTitle}>{activePlan.seasonTheme}</Text>
              <Text style={styles.weekPromise}>{dayPromise(marketId, currentDay)} today</Text>
              <View style={styles.weekTicks}>
                {Array.from({ length: weekEnd - weekStart + 1 }, (_, index) => {
                  const day = weekStart + index;
                  const done = day < currentDay || (day === currentDay && lessonCompletedToday);
                  return <View key={day} style={[styles.weekTick, done && { backgroundColor: activeColor.main }]} />;
                })}
              </View>
            </View>
            <View style={styles.scrollCue}>
              <Feather name="arrow-up" size={12} color={COLORS.textMuted} />
              <Text style={styles.scrollCueText}>Past lessons above · the full course continues below</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity
        style={[styles.notesButton, { bottom: 18 }]}
        onPress={() => {
          triggerHaptic('selection');
          router.push('/(tabs)/notebook');
        }}
        activeOpacity={0.82}
        accessibilityLabel="Open notes"
      >
        <Feather name="edit-3" size={23} color={COLORS.textPrimary} />
        <View style={[styles.notesNib, { backgroundColor: activeColor.main }]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  listContent: { paddingBottom: 120 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg0 },
  loadingNode: { width: 72, height: 72, borderRadius: 36, marginBottom: 16 },
  loadingText: { ...TYPE.bodyBold, color: COLORS.textSecondary },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  courseLabel: { ...TYPE.overline, color: COLORS.textMuted },
  marketName: { ...TYPE.h1, color: COLORS.textPrimary, marginTop: 2 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weekBand: { borderTopWidth: 3, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border, paddingVertical: 15 },
  weekBandTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekEyebrow: { ...TYPE.overline },
  weekCount: { ...TYPE.caption, color: COLORS.textMuted },
  weekTitle: { ...TYPE.h2, color: COLORS.textPrimary, marginTop: 6 },
  weekPromise: { ...TYPE.body, color: COLORS.textSecondary, marginTop: 2 },
  weekTicks: { flexDirection: 'row', gap: 5, marginTop: 12 },
  weekTick: { flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  scrollCue: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingTop: 12 },
  scrollCueText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  seasonHeader: { height: SEASON_HEADER_HEIGHT, paddingHorizontal: 22, paddingVertical: 22, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  seasonCopy: { flex: 1, paddingRight: 18 },
  seasonEyebrow: { ...TYPE.overline, color: 'rgba(255,255,255,0.72)' },
  seasonTitle: { fontSize: 25, lineHeight: 29, fontWeight: '800', color: '#FFFFFF', marginTop: 8 },
  seasonSubtitle: { ...TYPE.caption, color: 'rgba(255,255,255,0.76)', marginTop: 6 },
  seasonSeal: { width: 54, height: 54, borderRadius: 27, borderWidth: 3, backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
  nodeRow: { height: NODE_ROW_HEIGHT, position: 'relative', overflow: 'visible' },
  connector: { position: 'absolute', top: NODE_ROW_HEIGHT / 2, height: 7, borderRadius: 4, transformOrigin: 'left center', opacity: 0.7 },
  pulseRing: { position: 'absolute', top: (NODE_ROW_HEIGHT - 96) / 2, borderWidth: 3 },
  node: { position: 'absolute', top: 24, borderWidth: 3, alignItems: 'center', justifyContent: 'center', zIndex: 4, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 0, elevation: 5 },
  todayNode: { top: 18, borderWidth: 4 },
  nodeHighlight: { position: 'absolute', top: 8, height: 8, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.22)' },
  todayLabel: { position: 'absolute', top: 14, width: 145, zIndex: 3 },
  todayLabelLeft: { left: 18, alignItems: 'flex-end' },
  todayLabelRight: { right: 18, alignItems: 'flex-start' },
  todayEyebrow: { ...TYPE.overline, fontSize: 9 },
  todayTitle: { fontSize: 14, lineHeight: 18, fontWeight: '800', color: COLORS.textPrimary, marginTop: 3 },
  todayMeta: { fontSize: 10, lineHeight: 14, color: COLORS.textMuted, marginTop: 3 },
  leoMarker: { position: 'absolute', top: 60, zIndex: 6, alignItems: 'center' },
  leoLeft: { right: 10 },
  leoRight: { left: 8 },
  leoImage: { width: 68, height: 68 },
  leoBubble: { position: 'absolute', top: -17, minWidth: 94, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12, borderWidth: 1.5, backgroundColor: COLORS.bg2, ...SHADOWS.sm },
  leoBubbleText: { fontSize: 10, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  notesButton: { position: 'absolute', right: 18, width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.bg2, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', zIndex: 20, ...SHADOWS.lg },
  notesNib: { position: 'absolute', right: 9, bottom: 9, width: 9, height: 9, borderRadius: 5 },
});