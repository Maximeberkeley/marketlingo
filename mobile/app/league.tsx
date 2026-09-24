/**
 * Monthly League — a high-energy tier race backed by the learner's real XP ledger.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { COLORS, SHADOWS, TYPE } from '../lib/constants';
import { isDark } from '../lib/theme';
import { useSelectedMarket } from '../hooks/useSelectedMarket';
import { LEAGUE_TIERS, LeagueTier, TIER_META, useLeague } from '../hooks/useLeague';
import { getMarketName } from '../lib/markets';
import { triggerHaptic } from '../lib/haptics';

const LEAGUE_HERO = require('../assets/illustrations/monthly-league-hero.png');
const AVATAR_COLORS = ['#7C3AED', '#0F766E', '#B45309', '#BE123C', '#0369A1', '#4D7C0F'];

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'A';
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? '').join('');
}

function avatarColor(id: string): string {
  const total = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[total % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

function nextTier(tier: LeagueTier): string | null {
  const currentIndex = LEAGUE_TIERS.indexOf(tier);
  const next = LEAGUE_TIERS[currentIndex + 1];
  return next ? TIER_META[next].label : null;
}

function TierLadder({ current, selected, onSelect }: { current: LeagueTier; selected: LeagueTier; onSelect: (tier: LeagueTier) => void }) {
  const currentIndex = LEAGUE_TIERS.indexOf(current);

  return (
    <View style={styles.ladder}>
      <View style={styles.ladderLine} />
      {LEAGUE_TIERS.map((tier, index) => {
        const tierMeta = TIER_META[tier];
        const locked = index > currentIndex;
        const active = tier === current;
        return (
          <TouchableOpacity key={tier} style={styles.tierStep} onPress={() => onSelect(tier)} accessibilityLabel={`View ${tierMeta.label} League`}>
            <View style={[styles.tierPedestal, active && styles.tierPedestalActive]}>
              <View
                style={[
                  styles.trophyDisc,
                  { borderColor: locked ? COLORS.border : tierMeta.color },
                  active && { backgroundColor: COLORS.goldSoft, shadowColor: tierMeta.color },
                  selected === tier && styles.trophyDiscSelected,
                  locked && styles.trophyDiscLocked,
                ]}
              >
                <Feather name={locked ? 'lock' : 'award'} size={active ? 25 : 20} color={locked ? COLORS.textMuted : tierMeta.color} />
              </View>
              {active && <View style={[styles.pedestalBase, { backgroundColor: tierMeta.color }]} />}
            </View>
            <Text style={[styles.tierLabel, active && { color: tierMeta.color }, locked && styles.lockedLabel]} numberOfLines={1}>
              {tierMeta.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medalColor = rank === 1 ? '#FBBF24' : rank === 2 ? '#94A3B8' : rank === 3 ? '#B45309' : null;
  if (!medalColor) {
    return (
      <View style={styles.rankNumberWrap}>
        <Text style={styles.rankNumber}>{rank}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.medal, { backgroundColor: medalColor }]}>
      <Feather name="award" size={14} color={COLORS.textOnAccent} />
      <Text style={styles.medalText}>{rank}</Text>
    </View>
  );
}

function ZoneDivider({ type, label }: { type: 'promotion' | 'demotion'; label: string }) {
  const color = type === 'promotion' ? COLORS.success : COLORS.error;
  return (
    <View style={[styles.zoneDivider, { borderColor: color }]}>
      <View style={[styles.zoneIcon, { backgroundColor: type === 'promotion' ? COLORS.successSoft : COLORS.errorSoft }]}>
        <Feather name={type === 'promotion' ? 'arrow-up' : 'arrow-down'} size={13} color={color} />
      </View>
      <Text style={[styles.zoneText, { color }]}>{label}</Text>
    </View>
  );
}

export default function LeagueScreen() {
  const insets = useSafeAreaInsets();
  const { marketId: selectedMarket } = useSelectedMarket();
  const league = useLeague(selectedMarket || undefined);
  const meta = TIER_META[league.tier];
  const promotionTier = nextTier(league.tier);
  const [selectedTier, setSelectedTier] = useState<LeagueTier | null>(null);
  const viewedTier = selectedTier || league.tier;
  const viewedMeta = TIER_META[viewedTier];
  const viewedRivals = league.rivalsByTier[viewedTier] || [];
  const viewedPromotionCutoff = Math.max(1, Math.ceil(viewedRivals.length * 0.3));
  const viewedDemotionCutoff = viewedRivals.length >= 5 ? viewedRivals.length - Math.floor(viewedRivals.length * 0.2) : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={25} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Monthly League</Text>
        <View style={styles.iconButton} />
      </View>

      {league.loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Building this month’s table…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        >
          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <Text style={styles.eyebrow}>{getMarketName(selectedMarket || 'aerospace').toUpperCase()}</Text>
              <Text style={styles.leagueTitle}>{meta.label} League</Text>
            </View>
            <View style={styles.countdownPill}>
              <Feather name="clock" size={14} color={COLORS.warning} />
              <Text style={styles.countdownText}>{league.daysLeft} {league.daysLeft === 1 ? 'DAY' : 'DAYS'}</Text>
            </View>
          </View>

          <TierLadder current={league.tier} selected={viewedTier} onSelect={(tier) => { triggerHaptic('selection'); setSelectedTier(tier); }} />

          <View style={styles.mascotStage}>
            <View style={[styles.glow, { backgroundColor: COLORS.goldSoft }]} />
            <Image source={LEAGUE_HERO} style={styles.trophyLeo} resizeMode="cover" />
            <View style={styles.statusPill}>
              <Feather
                name={league.myRank && league.myRank <= league.promotionCutoff ? 'trending-up' : 'target'}
                size={15}
                color={league.myRank && league.myRank <= league.promotionCutoff ? COLORS.success : COLORS.accent}
              />
              <Text style={styles.statusText}>
                {league.myRank
                  ? league.myRank <= league.promotionCutoff
                    ? `You’re #${league.myRank} — keep your promotion spot.`
                    : `${league.xpToPromotion} XP to reach the promotion zone.`
                  : 'Earn XP to enter this month’s race.'}
              </Text>
            </View>
          </View>

          <View style={styles.standingsHeading}>
            <View>
              <Text style={styles.standingsTitle}>{viewedMeta.label} standings</Text>
              <Text style={styles.standingsSubtitle}>{viewedTier === league.tier ? 'Your league' : 'Viewing another league'} · Monthly XP</Text>
            </View>
            <Feather name="bar-chart-2" size={20} color={COLORS.accent} />
          </View>

          <View style={styles.table}>
            {league.error ? (
              <View style={styles.emptyState}>
                <Feather name="wifi-off" size={28} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>Standings unavailable</Text>
                <Text style={styles.emptyText}>{league.error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={league.refetch}>
                  <Feather name="refresh-cw" size={15} color={COLORS.textOnAccent} />
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : viewedRivals.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="users" size={28} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No standings yet</Text>
                <Text style={styles.emptyText}>No learners have entered this tier this month yet.</Text>
              </View>
            ) : (
              viewedRivals.map((r, index) => {
                const showPromotionDivider = index === 0;
                const showDemotionDivider = viewedDemotionCutoff !== null && r.rank === viewedDemotionCutoff + 1;
                return (
                  <React.Fragment key={r.userId}>
                    {showPromotionDivider && (
                      <ZoneDivider
                        type="promotion"
                        label={viewedTier === league.tier && promotionTier ? `Top ${viewedPromotionCutoff} advance to ${promotionTier} League` : `Top ${viewedPromotionCutoff} lead ${viewedMeta.label}`}
                      />
                    )}
                    {showDemotionDivider && <ZoneDivider type="demotion" label="Demotion zone" />}
                    <View style={[styles.row, r.isMe && styles.myRow]}>
                      <RankBadge rank={r.rank} />
                      <View style={[styles.avatar, { backgroundColor: avatarColor(r.userId) }]}>
                        <Text style={styles.avatarText}>{initials(r.isMe ? 'You' : r.username)}</Text>
                      </View>
                      <View style={styles.personCopy}>
                        <View style={styles.nameRow}>
                          <Text style={[styles.name, r.isMe && styles.myName]} numberOfLines={1}>
                            {r.isMe ? 'You' : r.username}
                          </Text>
                          {r.isMe && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>{meta.label.toUpperCase()}</Text>
                            </View>
                          )}
                        </View>
                        {r.rank <= viewedPromotionCutoff && (
                          <View style={styles.advanceRow}>
                            <Feather name="arrow-up" size={11} color={COLORS.success} />
                            <Text style={styles.advanceText}>Promotion pace</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.xp, r.isMe && { color: COLORS.accent }]}>{r.weeklyXp} XP</Text>
                    </View>
                  </React.Fragment>
                );
              })
            )}
          </View>

          <Text style={styles.footnote}>The final night of each month locks the season and stamps promotions or relegations.</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg0 },
  navBar: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  navTitle: { ...TYPE.h3, color: COLORS.textPrimary },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { ...TYPE.caption, color: COLORS.textMuted },
  content: { paddingHorizontal: 18, paddingTop: 8 },
  retryButton: { marginTop: 14, minHeight: 44, paddingHorizontal: 18, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: COLORS.accent },
  retryText: { ...TYPE.caption, color: COLORS.textOnAccent, fontWeight: '800' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6 },
  titleCopy: { flex: 1 },
  eyebrow: { ...TYPE.overline, color: COLORS.textMuted },
  leagueTitle: { ...TYPE.hero, color: COLORS.textPrimary, marginTop: 3 },
  countdownPill: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.warningSoft, borderWidth: 1, borderColor: COLORS.warning },
  countdownText: { fontSize: 11, fontWeight: '900', color: COLORS.warning },
  ladder: { position: 'relative', flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingHorizontal: 2 },
  ladderLine: { position: 'absolute', top: 23, left: 26, right: 26, height: 3, borderRadius: 2, backgroundColor: COLORS.border },
  tierStep: { width: '19%', alignItems: 'center' },
  tierPedestal: { height: 54, alignItems: 'center', justifyContent: 'flex-start' },
  tierPedestalActive: { transform: [{ translateY: -5 }] },
  trophyDisc: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg2, borderWidth: 2, ...SHADOWS.sm },
  trophyDiscLocked: { backgroundColor: COLORS.lockedSurface, borderStyle: 'dashed', opacity: 0.72 },
  trophyDiscSelected: { borderWidth: 3, transform: [{ scale: 1.08 }] },
  pedestalBase: { width: 34, height: 5, borderRadius: 3, marginTop: 3 },
  tierLabel: { marginTop: 3, fontSize: 9, fontWeight: '800', color: COLORS.textSecondary, textAlign: 'center' },
  lockedLabel: { color: COLORS.textMuted },
  mascotStage: { minHeight: 238, alignItems: 'center', justifyContent: 'flex-end', marginTop: 16 },
  glow: { position: 'absolute', top: 36, width: 174, height: 174, borderRadius: 87, opacity: isDark ? 0.85 : 1 },
  trophyLeo: { width: '100%', height: 190, borderRadius: 22, resizeMode: 'cover', backfaceVisibility: 'hidden' },
  statusPill: { width: '100%', minHeight: 48, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  statusText: { flexShrink: 1, ...TYPE.caption, color: COLORS.textSecondary, textAlign: 'center' },
  standingsHeading: { marginTop: 26, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  standingsTitle: { ...TYPE.h2, color: COLORS.textPrimary },
  standingsSubtitle: { ...TYPE.caption, color: COLORS.textMuted, marginTop: 2 },
  table: { borderRadius: 18, overflow: 'hidden', backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.md },
  zoneDivider: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, backgroundColor: COLORS.bg1, borderLeftWidth: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  zoneIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  zoneText: { flex: 1, fontSize: 11, fontWeight: '800' },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.borderLight, backgroundColor: COLORS.bg2 },
  myRow: { backgroundColor: COLORS.accentSoft, borderWidth: 2, borderColor: COLORS.accent, borderRadius: 12, marginHorizontal: 5, marginVertical: 5, ...SHADOWS.accent },
  rankNumberWrap: { width: 30, alignItems: 'center' },
  rankNumber: { fontSize: 15, fontWeight: '900', color: COLORS.textSecondary },
  medal: { width: 30, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  medalText: { fontSize: 9, lineHeight: 10, fontWeight: '900', color: COLORS.textOnAccent },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.bg2 },
  avatarText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
  personCopy: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  myName: { fontWeight: '900' },
  youBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, backgroundColor: COLORS.accentMedium },
  youBadgeText: { fontSize: 8, fontWeight: '900', color: COLORS.accent },
  advanceRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  advanceText: { fontSize: 9, fontWeight: '700', color: COLORS.success },
  xp: { fontSize: 14, fontWeight: '900', color: COLORS.textPrimary },
  emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  emptyTitle: { ...TYPE.h3, color: COLORS.textPrimary, marginTop: 10 },
  emptyText: { ...TYPE.caption, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 },
  footnote: { ...TYPE.caption, color: COLORS.textMuted, textAlign: 'center', lineHeight: 17, marginTop: 14, paddingHorizontal: 16 },
});