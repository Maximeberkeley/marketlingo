import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { isDark } from '../../lib/theme';
import { LeoAnimated } from '../mascot/LeoAnimated';
import { StreakFlame } from '../ui/StreakFlame';
import { SocialAvatar } from '../social/SocialAvatar';
import { ChunkyButton } from '../social/ChunkyButton';
import { CrownBadge } from '../social/CrownBadge';
import { Crown, crownCopy } from '../../lib/crown';

const LEO_KING = require('../../assets/mascot/leo-king.png');
const GOLD_TEXT = isDark ? COLORS.gold : '#B7791F';
const STACK_MAX = 5;
// Friend avatars in the stack get a soft colour each, so the row reads as people at a glance.
const STACK_TINTS = isDark
  ? ['rgba(167, 139, 250, 0.28)', 'rgba(251, 146, 60, 0.28)', 'rgba(52, 211, 153, 0.26)', 'rgba(252, 211, 77, 0.26)', 'rgba(56, 189, 248, 0.26)']
  : ['#EDE9FE', '#FFEDD5', '#DCFCE7', '#FEF3C7', '#E0F2FE'];

export interface ProfileFriendsInfo {
  friendNames: string[];
  crown: Crown | null;
  myRank: number;
  boardSize: number;
  /** Friend streaks: lit today / active. Null when friend streaks aren't available yet. */
  streaks: { lit: number; active: number } | null;
  /** Races running now. Null when races aren't available yet. */
  races: number | null;
  /** The one thing that needs you (a reward, your turn, an invite), if any. */
  urgent: { text: string; icon: 'flame' | 'race' | 'gift' } | null;
  pending: number;
}

/** The Friends page, previewed on Profile: King Leo's crown, your friends, and what needs you. */
export function ProfileFriendsCard({ info, onOpen, onAdd }: { info: ProfileFriendsInfo; onOpen: () => void; onAdd: () => void }) {
  const hasFriends = info.friendNames.length > 0;
  const copy = info.crown ? crownCopy(info.crown) : null;
  const iWearIt = info.crown?.kind === 'mine';
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Friends</Text>
        {info.pending > 0 && (
          <View style={styles.pending} accessibilityLabel={`${info.pending} friend requests`}>
            <Text style={styles.pendingText}>{info.pending === 1 ? '1 request' : `${info.pending} requests`}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onOpen} style={styles.seeAll} hitSlop={8} accessibilityRole="button" accessibilityLabel="Open Friends">
          <Text style={styles.seeAllText}>See all</Text>
          <Feather name="chevron-right" size={16} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {hasFriends && copy ? (
        <>
          <TouchableOpacity style={styles.crown} onPress={onOpen} activeOpacity={0.9} accessibilityRole="button" accessibilityLabel={`${copy.title}. ${copy.line}. Open Friends`}>
            <View style={styles.crownLeo} pointerEvents="none">
              <LeoAnimated clip="leo-king" size={92} fallback={LEO_KING} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.kicker}>THIS MONTH'S CROWN</Text>
              <Text style={styles.crownTitle} numberOfLines={2}>{copy.title}</Text>
              <Text style={styles.crownLine} numberOfLines={1}>{copy.line}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.stackRow}>
            <View style={styles.stack}>
              {info.friendNames.slice(0, STACK_MAX).map((name, i) => (
                <View key={`${name}-${i}`} style={[styles.stackItem, { marginLeft: i === 0 ? 0 : -12, zIndex: STACK_MAX - i }]}>
                  <SocialAvatar name={name} size={36} ring={COLORS.bg2} ringWidth={2.5} tint={STACK_TINTS[i % STACK_TINTS.length]} />
                  {i === 0 && info.crown?.kind === 'theirs' && <View style={styles.stackCrown} pointerEvents="none"><CrownBadge size={18} /></View>}
                </View>
              ))}
              {info.friendNames.length > STACK_MAX && (
                <View style={[styles.stackItem, styles.stackMore, { marginLeft: -12 }]}>
                  <Text style={styles.stackMoreText}>+{info.friendNames.length - STACK_MAX}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.stackTitle} numberOfLines={1}>
                {info.friendNames.length === 1 ? '1 friend' : `${info.friendNames.length} friends`}
              </Text>
              <Text style={styles.stackSub} numberOfLines={1}>
                {iWearIt ? `You're #1 of ${info.boardSize} this month` : `You're #${info.myRank} of ${info.boardSize} this month`}
              </Text>
            </View>
          </View>

          {(info.streaks || info.races != null) && (
            <View style={styles.chips}>
              {info.streaks && (
                <View style={[styles.chip, styles.chipStreak]}>
                  <StreakFlame size={15} />
                  <Text style={styles.chipText} numberOfLines={1}>
                    {info.streaks.active > 0 ? `${info.streaks.lit} of ${info.streaks.active} streaks lit` : 'Start a friend streak'}
                  </Text>
                </View>
              )}
              {info.races != null && (
                <View style={[styles.chip, styles.chipRace]}>
                  <Feather name="flag" size={13} color={COLORS.accent} />
                  <Text style={styles.chipText} numberOfLines={1}>
                    {info.races > 0 ? (info.races === 1 ? '1 race on' : `${info.races} races on`) : 'Race a friend'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {info.urgent && (
            <TouchableOpacity style={styles.urgent} onPress={onOpen} activeOpacity={0.85} accessibilityRole="button">
              {info.urgent.icon === 'flame' ? <StreakFlame size={16} /> : <Feather name={info.urgent.icon === 'race' ? 'flag' : 'gift'} size={15} color={COLORS.accent} />}
              <Text style={styles.urgentText} numberOfLines={1}>{info.urgent.text}</Text>
              <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}

          <View style={styles.actions}>
            <ChunkyButton label="Open Friends" onPress={onOpen} height={46} style={{ flex: 1 }} />
            <ChunkyButton label="Add" tone="plain" icon={<Feather name="user-plus" size={17} color={COLORS.accent} />} onPress={onAdd} height={46} style={{ flex: 0.72 }} accessibilityLabel="Add friends" />
          </View>
        </>
      ) : (
        <>
          <View style={styles.empty}>
            <View style={styles.crownLeo} pointerEvents="none">
              <LeoAnimated clip="leo-king" size={92} fallback={LEO_KING} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.crownTitle}>Learning is better with friends</Text>
              <Text style={styles.emptyLine}>Race each other, share a streak, and fight for this month's crown.</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <ChunkyButton label="Invite friends" icon={<Feather name="share" size={17} color="#FFFFFF" />} onPress={onAdd} height={46} style={{ flex: 1 }} />
            <ChunkyButton label="Find" tone="plain" icon={<Feather name="search" size={17} color={COLORS.accent} />} onPress={onOpen} height={46} style={{ flex: 0.6 }} accessibilityLabel="Find friends" />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 14, gap: 12, marginBottom: 20, backgroundColor: COLORS.bg2, borderWidth: 2, borderBottomWidth: 5, borderColor: COLORS.border },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
  pending: { paddingHorizontal: 9, height: 22, borderRadius: 11, backgroundColor: COLORS.error, alignItems: 'center', justifyContent: 'center' },
  pendingText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 14, fontWeight: '800', color: COLORS.accent },
  crown: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingRight: 12, minHeight: 96, borderRadius: 18, borderWidth: 2,
    backgroundColor: isDark ? 'rgba(252, 211, 77, 0.12)' : '#FFF7E0',
    borderColor: isDark ? 'rgba(252, 211, 77, 0.45)' : '#F6D77A',
  },
  crownLeo: { width: 92, height: 98, alignItems: 'center', justifyContent: 'flex-end' },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1, color: GOLD_TEXT, marginTop: 12 },
  crownTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary, marginTop: 3, lineHeight: 20 },
  crownLine: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginTop: 2, marginBottom: 12 },
  stackRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stack: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  stackItem: { borderRadius: 20 },
  stackCrown: { position: 'absolute', top: -11, left: 9 },
  stackMore: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bg1, borderWidth: 2.5, borderColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center' },
  stackMoreText: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary },
  stackTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  stackSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 10, borderRadius: 12 },
  chipStreak: { backgroundColor: COLORS.streakBadgeSurface },
  chipRace: { backgroundColor: COLORS.accentSoft },
  chipText: { flexShrink: 1, fontSize: 12, fontWeight: '800', color: COLORS.textPrimary },
  urgent: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 42, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.accentMedium, backgroundColor: COLORS.bg1 },
  urgentText: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  actions: { flexDirection: 'row', gap: 10 },
  empty: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingRight: 12, minHeight: 96, borderRadius: 18, borderWidth: 2,
    backgroundColor: isDark ? 'rgba(252, 211, 77, 0.12)' : '#FFF7E0',
    borderColor: isDark ? 'rgba(252, 211, 77, 0.45)' : '#F6D77A',
  },
  emptyLine: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3, marginBottom: 12, lineHeight: 16 },
});
