/**
 * SundayRecapCard — the weekly market recap on Home.
 *
 * A small bar chart of the week's XP, the honest headline numbers and a
 * comparison to last week. Every figure comes from the learner's own ledger.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../lib/constants';
import type { WeeklyRecap } from '../../hooks/useWeeklyRecap';

interface Props {
  recap: WeeklyRecap;
  accent: string;
  tierLabel?: string;
  rank?: number | null;
  onDismiss: () => void;
  onOpenLeague: () => void;
}

export function SundayRecapCard({ recap, accent, tierLabel, rank, onDismiss, onOpenLeague }: Props) {
  const max = Math.max(1, ...recap.perDay.map((d) => d.xp));
  const delta = recap.xpThisWeek - recap.xpLastWeek;
  const deltaText =
    recap.xpLastWeek === 0
      ? 'First full week on the desk'
      : delta >= 0
      ? `${delta} XP more than last week`
      : `${Math.abs(delta)} XP less than last week`;

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.close} onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Feather name="x" size={14} color={COLORS.textMuted} />
      </TouchableOpacity>

      <Text style={[styles.eyebrow, { color: accent }]}>SUNDAY RECAP</Text>
      <Text style={styles.title}>Your week in the market</Text>

      <View style={styles.chart}>
        {recap.perDay.map((d) => (
          <View key={d.label} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { height: `${Math.round((d.xp / max) * 100)}%`, backgroundColor: d.xp > 0 ? accent : COLORS.borderLight },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{d.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.statsRow}>
        <Stat value={`${recap.xpThisWeek}`} label="XP earned" />
        <Stat value={`${recap.activeDays}/7`} label="Active days" />
        <Stat value={`${recap.lessonsCompleted}`} label="Lessons" />
        <Stat value={`${recap.drillsCompleted}`} label="Drills" />
      </View>

      <Text style={styles.delta}>{deltaText}</Text>
      {recap.bestDay && (
        <Text style={styles.best}>
          Best day: {recap.bestDay.label} with {recap.bestDay.xp} XP
        </Text>
      )}

      <TouchableOpacity style={[styles.cta, { borderColor: accent + '55' }]} onPress={onOpenLeague} activeOpacity={0.85}>
        <Feather name="award" size={14} color={accent} />
        <Text style={[styles.ctaText, { color: accent }]}>
          {tierLabel ? `${tierLabel} league${rank ? ` · #${rank}` : ''}` : 'View your league'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.bg2, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16, ...SHADOWS.sm },
  close: { position: 'absolute', top: 10, right: 12, zIndex: 5 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },
  chart: { flexDirection: 'row', gap: 8, height: 80, marginBottom: 14 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, width: '100%', backgroundColor: COLORS.bg1, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6, minHeight: 3 },
  barLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  delta: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  best: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 11, marginTop: 4 },
  ctaText: { fontSize: 13, fontWeight: '700' },
});
