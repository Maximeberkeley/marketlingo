import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { getMarketWorld } from '../../data/marketWorlds';
import { getMarketName } from '../../lib/markets';
import { SpeechBubble } from '../ui/SpeechBubble';
import { lessonGoalLabels } from '../../lib/lessonGoals';

interface Props {
  title: string;
  slides: { title?: string; body?: string }[];
  objectives?: string[];
  marketId?: string;
  day?: number;
  /** Lesson's own label, e.g. "Catch up: Day 1"; defaults to DAY {day}. */
  dayLabel?: string;
  isBite?: boolean;
  onStart: () => void;
  onBack: () => void;
}

export function LessonGoalsScreen({ title, slides, objectives, marketId, day = 1, dayLabel, isBite, onStart, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // iPhone SE and other short screens: compact hero and Leo so nothing sits under Start.
  const compact = height < 720;
  const world = getMarketWorld(marketId);
  const marketName = getMarketName(marketId || 'aerospace');
  const goals = useMemo(() => {
    // One short line per goal; long authored objectives fall back to the lesson's own beat titles.
    const authored = lessonGoalLabels(objectives, slides);
    if (authored.length && authored.every(g => g.length <= 48)) return authored;
    const titles = lessonGoalLabels([], slides).filter(g => g.length <= 48);
    return titles.length ? titles : authored;
  }, [objectives, slides]);

  const safeGoals = goals.length ? goals : ['Read the signal', 'Make the call', 'Keep the insight'];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 18 }]}>
      <TouchableOpacity onPress={onBack} style={styles.back} accessibilityLabel="Back to home">
        <Feather name="x" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <View style={[styles.hero, compact && styles.heroCompact]}>
        <Image source={world.illustration} style={[styles.illustration, compact && styles.illustrationCompact]} />
        <Text style={styles.kicker}>{isBite ? 'QUICK BITE' : (dayLabel ?? `DAY ${day}`).toUpperCase()}</Text>
        <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={3}>{title}</Text>
        <View style={styles.timeChip}>
          <Feather name="clock" size={13} color={COLORS.textSecondary} />
          <Text style={styles.timeText}>{marketName} · {isBite ? '1 min' : '6 min'}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, compact && styles.bodyContentCompact]} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{goals.length ? 'In this lesson' : 'Your next lesson'}</Text>
        <View style={styles.goals}>
          {safeGoals.map((goal, index) => (
            <View key={`${goal}-${index}`} style={styles.goalRow}>
              <View style={[styles.number, { backgroundColor: COLORS.accent }]}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              <Text style={styles.goalText}>{goal}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.leoRow, compact && styles.leoRowCompact]}>
          <Image source={require('../../assets/mascot/leo-sassy.png')} style={[styles.leo, compact && styles.leoCompact]} />
          <SpeechBubble text="Three sharp moves. Then make the call." tail="left" showLabel style={styles.leoBalloon} />
        </View>
      </ScrollView>

      <TouchableOpacity style={[styles.start, { backgroundColor: COLORS.accent, shadowColor: COLORS.accent }]} onPress={onStart} activeOpacity={0.86}>
        <Text style={styles.startText}>Start mission</Text>
        <Feather name="arrow-right" size={19} color={COLORS.bg0} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 16 },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  hero: { minHeight: 150, borderRadius: 22, padding: 20, justifyContent: 'flex-end', overflow: 'hidden', backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border },
  illustration: { position: 'absolute', width: 120, height: 120, right: -6, top: -4, resizeMode: 'contain', opacity: 0.95 },
  kicker: { color: COLORS.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: COLORS.textPrimary, fontSize: 25, lineHeight: 30, fontWeight: '700', maxWidth: '76%', marginTop: 7 },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  timeText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  heroCompact: { minHeight: 120, padding: 16 },
  illustrationCompact: { width: 96, height: 96, right: -6, top: -4 },
  titleCompact: { fontSize: 23, lineHeight: 28 },
  bodyContentCompact: { paddingTop: 12, paddingBottom: 12 },
  leoRowCompact: { marginTop: 10 },
  leoCompact: { width: 86, height: 104 },
  body: { flex: 1, marginBottom: 12 },
  bodyContent: { paddingTop: 18, paddingBottom: 14 },
  heading: { fontSize: 19, fontWeight: '800', color: COLORS.textPrimary },
  subheading: { marginTop: 4, fontSize: 15, color: COLORS.textSecondary },
  goals: { gap: 8, marginTop: 12 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 42 },
  number: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  numberText: { color: COLORS.bg0, fontSize: 14, fontWeight: '900' },
  goalText: { flex: 1, fontSize: 16, lineHeight: 21, color: COLORS.textPrimary, fontWeight: '600' },
  leoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  leo: { width: 112, height: 136, flexShrink: 0, resizeMode: 'contain' },
  leoBalloon: { flexShrink: 1, alignSelf: 'center' },
  leoLine: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  start: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.34, shadowRadius: 16, elevation: 10 },
  startText: { color: COLORS.bg0, fontSize: 17, fontWeight: '900' },
});