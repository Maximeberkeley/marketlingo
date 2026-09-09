import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '../../lib/constants';
import { tierMeta, formatTimeLeft, LeagueTier } from '../../lib/leagues';
import { triggerHaptic } from '../../lib/haptics';

interface LeagueCardProps {
  tier: LeagueTier;
  myRank: number | null;
  myWeeklyXP: number;
  groupSize: number;
  promoteCutoff: number;
  demoteCutoff: number;
  msLeft: number;
  loading?: boolean;
}

export function LeagueCard({
  tier, myRank, myWeeklyXP, groupSize, promoteCutoff, demoteCutoff, msLeft, loading,
}: LeagueCardProps) {
  const meta = tierMeta(tier);

  let status = 'Earn XP to enter this week’s standings';
  let statusIcon: keyof typeof Feather.glyphMap = 'bar-chart-2';
  if (myRank) {
    if (myRank <= promoteCutoff && tier !== 'diamond') {
      status = `Rank #${myRank} — in the promotion zone`;
      statusIcon = 'trending-up';
    } else if (demoteCutoff > 0 && myRank > groupSize - demoteCutoff && tier !== 'bronze') {
      status = `Rank #${myRank} — at risk of dropping`;
      statusIcon = 'trending-down';
    } else {
      const gap = Math.max(0, myRank - promoteCutoff);
      status = gap > 0 ? `Rank #${myRank} — ${gap} spot${gap === 1 ? '' : 's'} from promotion` : `Rank #${myRank}`;
      statusIcon = 'bar-chart-2';
    }
  }

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => { triggerHaptic('light'); router.push('/friends?tab=league' as any); }}
    >
      <View style={[styles.badge, { backgroundColor: meta.soft }]}>
        <Feather name="award" size={20} color={meta.color} />
      </View>

      <View style={styles.body}>
        <Text style={styles.tierName}>{meta.name}</Text>
        <View style={styles.statusRow}>
          <Feather name={statusIcon} size={11} color={COLORS.textMuted} />
          <Text style={styles.status} numberOfLines={1}>
            {loading ? 'Loading standings…' : status}
          </Text>
        </View>
        <Text style={styles.meta}>{myWeeklyXP} XP this week · {formatTimeLeft(msLeft)}</Text>
      </View>

      <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg2, borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  tierName: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  status: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  meta: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
});
