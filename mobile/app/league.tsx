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

export default function LeagueScreen() {
  const insets = useSafeAreaInsets();
  const { selectedMarket } = useSelectedMarket();
  const league = useLeague(selectedMarket || undefined);
  const meta = TIER_META[league.tier];

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
          <View style={[styles.hero, { backgroundColor: meta.color + '12', borderColor: meta.color + '40' }]}>
            <Feather name="award" size={40} color={meta.color} />
            <Text style={[styles.tier, { color: meta.color }]}>{meta.label.toUpperCase()} LEAGUE</Text>
            <Text style={styles.heroSub}>
              {getMarketName(selectedMarket || 'aerospace')} · {league.daysLeft === 0 ? 'Results tonight' : `${league.daysLeft} day${league.daysLeft === 1 ? '' : 's'} left`}
            </Text>
            <Text style={styles.heroLine}>
              {league.myRank
                ? league.myRank <= league.promotionCutoff
                  ? `You are #${league.myRank} — inside the promotion zone.`
                  : `You are #${league.myRank}. ${league.xpToPromotion} XP moves you into the promotion zone.`
                : 'Earn XP today to enter this week\'s table.'}
            </Text>
          </View>

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
                <View key={r.userId} style={[styles.row, r.isMe && { backgroundColor: meta.color + '10' }]}>
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
                  <Text style={styles.xp}>{r.weeklyXp} XP</Text>
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
  hero: { borderWidth: 1, borderRadius: 20, padding: 20, alignItems: 'center', gap: 6, marginBottom: 16 },
  tier: { fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },
  heroSub: { fontSize: 12, color: COLORS.textMuted },
  heroLine: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 10, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  table: { backgroundColor: COLORS.bg2, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOWS.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.borderLight },
  rankPill: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary },
  name: { flex: 1, fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  xp: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  empty: { padding: 20, textAlign: 'center', color: COLORS.textMuted, fontSize: 13 },
  footnote: { fontSize: 11, color: COLORS.textMuted, marginTop: 14, lineHeight: 16 },
});
