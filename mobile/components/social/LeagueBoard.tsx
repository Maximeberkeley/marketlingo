import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../lib/constants';
import { tierMeta, formatTimeLeft } from '../../lib/leagues';
import type { LeagueState, LeagueStanding } from '../../hooks/useLeagues';

const ZONE = {
  promotion: { color: '#15803D', soft: '#DCFCE7', label: 'PROMOTION ZONE', icon: 'trending-up' as const },
  safe: { color: '#B45309', soft: '#FEF3C7', label: 'SAFE ZONE', icon: 'minus' as const },
  demotion: { color: '#B91C1C', soft: '#FEE2E2', label: 'RELEGATION ZONE', icon: 'trending-down' as const },
};

function RankDelta({ delta }: { delta: number | null }) {
  if (delta === null || delta === 0) {
    return <Feather name="minus" size={11} color={COLORS.textMuted} />;
  }
  const up = delta > 0;
  return (
    <View style={s.deltaWrap}>
      <Feather name={up ? 'arrow-up' : 'arrow-down'} size={11} color={up ? '#15803D' : '#B91C1C'} />
      <Text style={[s.deltaText, { color: up ? '#15803D' : '#B91C1C' }]}>{Math.abs(delta)}</Text>
    </View>
  );
}

export function LeagueRow({ item, pinned }: { item: LeagueStanding; pinned?: boolean }) {
  const z = ZONE[item.zone];
  return (
    <View style={[s.row, item.isCurrentUser && s.rowSelf, pinned && s.rowPinned]}>
      <View style={[s.rankChip, { backgroundColor: z.soft }]}>
        <Text style={[s.rankNum, { color: z.color }]}>{item.rank}</Text>
      </View>
      <RankDelta delta={item.delta} />
      <View style={[s.avatar, item.isCurrentUser && { backgroundColor: COLORS.accentSoft }]}>
        <Text style={s.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={[s.name, item.isCurrentUser && { color: COLORS.accent, fontWeight: '800' }]} numberOfLines={1}>
        {item.isCurrentUser ? 'You' : item.username}
      </Text>
      <View style={s.xpChip}>
        <Text style={s.xpValue}>{item.weeklyXP.toLocaleString()}</Text>
        <Text style={s.xpLabel}>XP</Text>
      </View>
    </View>
  );
}

export function LeagueBoard({ league }: { league: LeagueState }) {
  const meta = tierMeta(league.tier);

  const grouped = useMemo(() => {
    const buckets: { zone: keyof typeof ZONE; rows: LeagueStanding[] }[] = [];
    league.standings.forEach((row) => {
      const last = buckets[buckets.length - 1];
      if (last && last.zone === row.zone) last.rows.push(row);
      else buckets.push({ zone: row.zone, rows: [row] });
    });
    return buckets;
  }, [league.standings]);

  if (league.loading) {
    return <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 60 }} />;
  }

  return (
    <>
      {/* Dynamic header */}
      <LinearGradient
        colors={[meta.color, '#1A1F36']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <View style={s.heroTop}>
          <View style={s.crest}>
            <Feather name="award" size={26} color={meta.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTier}>{meta.name.toUpperCase()}</Text>
            <Text style={s.heroBlurb} numberOfLines={1}>{meta.blurb}</Text>
          </View>
          <View style={s.timerChip}>
            <Feather name="clock" size={11} color="#fff" />
            <Text style={s.timerText}>{formatTimeLeft(league.msLeft)}</Text>
          </View>
        </View>

        <View style={s.heroStats}>
          <View style={s.heroRankBlock}>
            <Text style={s.heroRankNum}>{league.myRank ? `#${league.myRank}` : '—'}</Text>
            <Text style={s.heroRankLabel}>YOUR RANK</Text>
          </View>
          <View style={s.heroDivider} />
          <View style={s.heroCell}>
            <Text style={s.heroValue}>{league.myWeeklyXP.toLocaleString()}</Text>
            <Text style={s.heroLabel}>XP THIS WEEK</Text>
          </View>
          <View style={s.heroDivider} />
          <View style={s.heroCell}>
            <Text style={s.heroValue}>{league.xpToNextRank ? `+${league.xpToNextRank}` : 'Top'}</Text>
            <Text style={s.heroLabel}>TO NEXT RANK</Text>
          </View>
        </View>

        <Text style={s.heroFoot}>
          Top {league.promoteCutoff || 1} move up
          {league.demoteCutoff > 0 ? ` · bottom ${league.demoteCutoff} drop` : ''} · {league.groupSize} analysts
        </Text>
      </LinearGradient>

      {league.lastResult && (
        <View
          style={[
            s.payoff,
            {
              backgroundColor:
                league.lastResult.result === 'promoted' ? '#DCFCE7'
                  : league.lastResult.result === 'demoted' ? '#FEE2E2' : COLORS.bg1,
            },
          ]}
        >
          <Feather
            name={league.lastResult.result === 'promoted' ? 'chevrons-up' : league.lastResult.result === 'demoted' ? 'chevrons-down' : 'shield'}
            size={16}
            color={league.lastResult.result === 'promoted' ? '#15803D' : league.lastResult.result === 'demoted' ? '#B91C1C' : COLORS.textMuted}
          />
          <Text style={s.payoffText}>
            Last week you finished{league.lastResult.rank ? ` #${league.lastResult.rank}` : ''} and{' '}
            {league.lastResult.result === 'promoted' ? 'earned a promotion badge'
              : league.lastResult.result === 'demoted' ? 'dropped a league'
              : 'held your league'}.
          </Text>
        </View>
      )}

      {league.standings.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}><Feather name="bar-chart-2" size={30} color={COLORS.textMuted} /></View>
          <Text style={s.emptyTitle}>No standings yet</Text>
          <Text style={s.emptySub}>Earn XP this week to take your place in the league</Text>
        </View>
      ) : (
        grouped.map((bucket, bi) => {
          const z = ZONE[bucket.zone];
          return (
            <View key={`${bucket.zone}-${bi}`} style={s.band}>
              <View style={[s.bandHeader, { backgroundColor: z.soft }]}>
                <Feather name={z.icon} size={12} color={z.color} />
                <Text style={[s.bandLabel, { color: z.color }]}>{z.label}</Text>
              </View>
              <View style={[s.bandBody, { borderColor: z.soft }]}>
                {bucket.rows.map((row) => <LeagueRow key={row.userId} item={row} />)}
              </View>
            </View>
          );
        })
      )}
    </>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: 24, padding: 18, marginBottom: 14, ...SHADOWS.lg },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  crest: {
    width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTier: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  heroBlurb: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  timerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10,
  },
  timerText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  heroRankBlock: { flex: 1.1, alignItems: 'flex-start' },
  heroRankNum: { fontSize: 38, lineHeight: 42, fontWeight: '900', color: '#fff' },
  heroRankLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.6 },
  heroDivider: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 12 },
  heroCell: { flex: 1, alignItems: 'flex-start' },
  heroValue: { fontSize: 17, fontWeight: '900', color: '#fff' },
  heroLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.6, marginTop: 2 },
  heroFoot: { marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.75)' },

  payoff: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, padding: 12, marginBottom: 12 },
  payoffText: { flex: 1, fontSize: 12, color: COLORS.textPrimary, fontWeight: '600' },

  band: { marginBottom: 14 },
  bandHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, marginBottom: 6,
  },
  bandLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  bandBody: { borderWidth: 1.5, borderRadius: 18, overflow: 'hidden' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 11, backgroundColor: COLORS.bg2,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rowSelf: { backgroundColor: COLORS.accentSoft },
  rowPinned: { borderRadius: 18, borderBottomWidth: 0, borderWidth: 1.5, borderColor: COLORS.accentMedium, ...SHADOWS.lg },
  rankChip: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontSize: 13, fontWeight: '900' },
  deltaWrap: { flexDirection: 'row', alignItems: 'center', gap: 1, width: 22 },
  deltaText: { fontSize: 10, fontWeight: '800' },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.bg1,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary },
  name: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  xpChip: { alignItems: 'flex-end' },
  xpValue: { fontSize: 14, fontWeight: '900', color: COLORS.textPrimary },
  xpLabel: { fontSize: 8, fontWeight: '800', color: COLORS.textMuted },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.bg1,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  emptySub: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 30 },
});
