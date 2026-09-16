import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../lib/constants';
import { getMarketWorld } from '../../data/marketWorlds';

interface Props {
  title: string;
  slides: { title?: string; body?: string }[];
  objectives?: string[];
  marketId?: string;
  isBite?: boolean;
  onStart: () => void;
  onBack: () => void;
}

const compact = (text: string) => {
  const clean = text.replace(/^[\s•\-–—]+/, '').replace(/\s+/g, ' ').trim();
  const first = clean.split(/(?<=[.!?])\s/)[0] || clean;
  return first.length > 78 ? `${first.slice(0, 75).trim()}…` : first;
};

export function LessonGoalsScreen({ title, slides, objectives, marketId, isBite, onStart, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const world = getMarketWorld(marketId);
  const goals = useMemo(() => {
    const authored = (objectives || []).filter(Boolean);
    const fallback = slides.map(slide => slide.title || '').filter(Boolean);
    return [...new Set((authored.length ? authored : fallback).map(compact))].slice(0, 3);
  }, [objectives, slides]);

  const safeGoals = goals.length ? goals : ['Read the signal', 'Make the call', 'Keep the insight'];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 18 }]}>
      <TouchableOpacity onPress={onBack} style={styles.back} accessibilityLabel="Back to home">
        <Feather name="x" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <LinearGradient colors={[world.colors[0], world.colors[1]]} style={styles.hero}>
        <Image source={world.illustration} style={styles.illustration} />
        <Text style={styles.kicker}>{isBite ? 'QUICK BITE' : world.worldName.toUpperCase()}</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.timeChip}>
          <Feather name="clock" size={14} color={COLORS.bg0} />
          <Text style={styles.timeText}>{isBite ? 'About 1 minute' : 'About 3 minutes'}</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.heading}>Your mission</Text>
        <Text style={styles.subheading}>Finish this run and you’ll be able to:</Text>
        <View style={styles.goals}>
          {safeGoals.map((goal, index) => (
            <View key={`${goal}-${index}`} style={styles.goalRow}>
              <View style={[styles.number, { backgroundColor: world.colors[index % world.colors.length] }]}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              <Text style={styles.goalText}>{goal}</Text>
            </View>
          ))}
        </View>

        <View style={styles.leoRow}>
          <Image source={require('../../assets/mascot/leo-reference.png')} style={styles.leo} />
          <Text style={styles.leoLine}>Know the mission. Then earn the bragging rights.</Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.start, { backgroundColor: world.colors[0] }]} onPress={onStart} activeOpacity={0.86}>
        <Text style={styles.startText}>Start mission</Text>
        <Feather name="arrow-right" size={19} color={COLORS.bg0} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 16 },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  hero: { minHeight: 230, borderRadius: 22, padding: 22, justifyContent: 'flex-end', overflow: 'hidden' },
  illustration: { position: 'absolute', width: 190, height: 190, right: -18, top: -8, resizeMode: 'contain', opacity: 0.86 },
  kicker: { color: COLORS.bg0, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, opacity: 0.82 },
  title: { color: COLORS.bg0, fontSize: 27, lineHeight: 31, fontWeight: '900', maxWidth: '75%', marginTop: 8 },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  timeText: { color: COLORS.bg0, fontSize: 13, fontWeight: '700' },
  body: { flex: 1, paddingTop: 24 },
  heading: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary },
  subheading: { marginTop: 4, fontSize: 15, color: COLORS.textSecondary },
  goals: { gap: 12, marginTop: 20 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  number: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numberText: { color: COLORS.bg0, fontSize: 14, fontWeight: '900' },
  goalText: { flex: 1, fontSize: 16, lineHeight: 21, color: COLORS.textPrimary, fontWeight: '700' },
  leoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, padding: 12, borderRadius: 14, backgroundColor: COLORS.bg1 },
  leo: { width: 44, height: 44, resizeMode: 'contain' },
  leoLine: { flex: 1, color: COLORS.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  start: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  startText: { color: COLORS.bg0, fontSize: 17, fontWeight: '900' },
});