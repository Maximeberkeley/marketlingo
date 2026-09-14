/**
 * League screen — this week's tier table with live rival XP.
 */
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../lib/constants';
import { useSelectedMarket } from '../hooks/useSelectedMarket';
import { TIER_META, useLeague } from '../hooks/useLeague';
import { getMarketName } from '../lib/markets';
import { LinearGradient } from 'expo-linear-gradient';
import { getMarketWorld } from '../data/marketWorlds';

export default function LeagueScreen() {
  const insets = useSafeAreaInsets();
  const { marketId: selectedMarket } = useSelectedMarket();
  const league = useLeague(selectedMarket || undefined);
  const meta = TIER_META[league.tier];
  const world = getMarketWorld(selectedMarket);
  const topXp = Math.max(1, ...league.rivals.map(rival => rival.weeklyXp));

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>League</Text>
        <View style={{ width: 24 }} />
      </View>

      {league.loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          <LinearGradient colors={[world.colors[0], world.colors[1]]} style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.crestOuter}>
                <View style={styles.crestInner}><Feather name="award" size={30} color={meta.color} /></View>
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>{world.worldName.toUpperCase()}</Text>
                <Text style={styles.tier}>{meta.label} League</Text>
                <Text style={styles.heroSub}>{getMarketName(selectedMarket || 'aerospace')}</Text>
              </View>
              <View style={styles.countdown}>
                <Text style={styles.countdownValue}>{league.daysLeft}</Text>
                <Text style={styles.countdownLabel}>{league.daysLeft === 1 ? 'DAY' : 'DAYS'}</Text>
              </View>
            </View>
            <View style={styles.heroRule} />
            <View style={styles.heroStatus}>
              <Feather name={league.myRank && league.myRank <= league.promotionCutoff ? 'trending-up' : 'target'} size={16} color={COLORS.bg2} />
              <Text style={styles.heroLine}>
                {league.myRank
                  ? league.myRank <= league.promotionCutoff
                    ? `Rank #${league.myRank}. You are in the promotion zone.`
                    : `${league.xpToPromotion} XP to promotion.`
                  : 'Earn XP to enter this week’s table.'}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.legend}>
            <LegendDot color={COLORS.success} label={`Top ${league.promotionCutoff} promote`} />
            {league.demotionCutoff && (
              <LegendDot color={COLORS.error} label={`Below #${league.demotionCutoff} relegate`} />
            )}
          </View>

          <View style={styles.table}>
            {league.rivals.length === 0 && <Text style={styles.empty}>No standings yet this week.</Text>}
            {league.rivals.map((r) => {
              const promote = r.rank <= league.promotionCutoff;
              const relegate = !!league.demotionCutoff && r.rank > league.demotionCutoff;
              return (
                <View key={r.userId} style={[styles.row, r.isMe && styles.myRow]}> 
                  <View
                    style={[
                      styles.rankPill,
                      promote && { backgroundColor: COLORS.successSoft },
                      relegate && { backgroundColor: COLORS.errorSoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankText,
                        promote && { color: COLORS.success },
                        relegate && { color: COLORS.error },
                      ]}
                    >
                      {r.rank}
                    </Text>
                  </View>
                  <Text style={[styles.name, r.isMe && { fontWeight: '800', color: COLORS.textPrimary }]} numberOfLines={1}>
                    {r.isMe ? 'You' : r.username}
                  </Text>
                  <View style={styles.rivalData}>
                    <Text style={styles.xp}>{r.weeklyXp} XP</Text>
                    <View style={styles.xpTrack}><View style={[styles.xpFill, { width: `${Math.max(3, (r.weeklyXp / topXp) * 100)}%`, backgroundColor: r.isMe ? meta.color : COLORS.textMuted }]} /></View>
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={styles.footnote}>
            Weekly XP is counted from your own activity ledger and resets every Monday. Results are stamped on Sunday night.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: 20, padding: 18, marginBottom: 16, overflow: 'hidden', ...SHADOWS.md },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  crestOuter: { width: 64, height: 72, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  crestInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroEyebrow: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.72)' },
  tier: { fontSize: 24, lineHeight: 28, fontWeight: '900', color: COLORS.bg2 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.76)', marginTop: 2 },
  countdown: { alignItems: 'center', minWidth: 42 },
  countdownValue: { fontSize: 26, fontWeight: '900', color: COLORS.bg2 },
  countdownLabel: { fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,0.7)' },
  heroRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.24)', marginVertical: 14 },
  heroStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroLine: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.bg2, lineHeight: 18 },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 10, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  table: { backgroundColor: COLORS.bg2, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOWS.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 62, paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.borderLight },
  myRow: { backgroundColor: COLORS.accentSoft, borderLeftWidth: 4, borderLeftColor: COLORS.accent },
  rankPill: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary },
  name: { flex: 1, fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  rivalData: { width: 84, alignItems: 'flex-end', gap: 5 },
  xp: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
  xpTrack: { width: '100%', height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: COLORS.borderLight },
  xpFill: { height: '100%', borderRadius: 2 },
  empty: { padding: 20, textAlign: 'center', color: COLORS.textMuted, fontSize: 13 },
  footnote: { fontSize: 11, color: COLORS.textMuted, marginTop: 14, lineHeight: 16 },
});
