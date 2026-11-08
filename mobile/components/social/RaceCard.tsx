import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../lib/constants';
import { SocialAvatar } from './SocialAvatar';
import { XPFlask } from '../ui/XPFlask';
import {
  FriendRace, RACE_DAYS, RACE_REWARD, firstName, raceIsOver, raceLeadLine, raceOmbre, raceOutcome, raceReward, raceShare, timeLeft,
} from '../../lib/friendSocial';

interface Props {
  race: FriendRace;
  busy: boolean;
  nudgeState: 'idle' | 'sending' | 'nudged';
  onAccept: (accept: boolean) => void;
  onCancel: () => void;
  onClaim: () => void;
  onNudge: () => void;
  onRematch: () => void;
  /** Your display name, for your own avatar's initial. */
  meName?: string;
}

/** A head-to-head week: both faces, a tug-of-war bar, who leads, the clock and the prize. */
export function RaceCard({ race, busy, nudgeState, onAccept, onCancel, onClaim, onNudge, onRematch, meName }: Props) {
  const name = firstName(race);
  const over = raceIsOver(race);
  const share = raceShare(race.my_xp, race.friend_xp);
  const incoming = race.status === 'pending' && !race.challenged_by_me;
  const outgoing = race.status === 'pending' && race.challenged_by_me;
  const outcome = raceOutcome(race.my_xp, race.friend_xp);
  const reward = raceReward(race.my_xp, race.friend_xp);
  const leading = race.my_xp > race.friend_xp;

  if (race.status === 'pending') {
    return (
      <View style={[styles.card, incoming && styles.cardInvite]}>
        <View style={styles.inviteRow}>
          <View style={styles.flagDisc}><Feather name="flag" size={18} color="#FFFFFF" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inviteTitle}>{incoming ? `${name} challenged you` : `Waiting for ${name}`}</Text>
            <Text style={styles.inviteSub}>{RACE_DAYS}-day XP race · winner gets +{RACE_REWARD.won} XP</Text>
          </View>
        </View>
        {incoming ? (
          <View style={styles.row2}>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => onAccept(true)} disabled={busy} accessibilityRole="button">
              {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.btnPrimaryText}>Accept race</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => onAccept(false)} disabled={busy} accessibilityRole="button">
              <Text style={styles.btnGhostText}>Not now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={onCancel} style={styles.linkBtn} accessibilityRole="button"><Text style={styles.link}>Cancel challenge</Text></TouchableOpacity>
        )}
      </View>
    );
  }

  // The card itself leans purple (you) or orange (them) with the lead.
  const tied = race.my_xp === race.friend_xp;
  const leaderBorder = tied ? COLORS.border : leading ? COLORS.accent + '55' : COLORS.streak + '55';
  return (
    <View style={[styles.card, styles.cardRace, { borderColor: leaderBorder }, over && !race.claimed && styles.cardDone]}>
      <LinearGradient
        pointerEvents="none"
        colors={[COLORS.accent + '33', COLORS.accent + '33', COLORS.streak + '33', COLORS.streak + '33']}
        locations={raceOmbre(share)}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topRow}>
        <Text style={styles.kicker}>{over ? 'RACE OVER' : 'RACE'}</Text>
        {!over && (
          <View style={styles.clock}><Feather name="clock" size={12} color={COLORS.textSecondary} /><Text style={styles.clockText}>{timeLeft(race.ends_at)}</Text></View>
        )}
        <View style={{ flex: 1 }} />
        <View style={styles.prizeRow}>
          <XPFlask size={13} />
          <Text style={styles.prize}>{over && race.claimed ? `+${race.claimed_xp} XP collected` : `Winner +${RACE_REWARD.won} XP`}</Text>
        </View>
      </View>

      <View style={styles.versus}>
        <View style={styles.side}>
          <SocialAvatar name={meName?.trim() || 'You'} size={44} ring={COLORS.accent} ringWidth={3} />
          <View>
            <Text style={styles.sideName}>You</Text>
            <Text style={[styles.sideXP, { color: COLORS.accent }]}>{race.my_xp.toLocaleString()} XP</Text>
          </View>
        </View>
        <Text style={styles.vs}>VS</Text>
        <View style={[styles.side, styles.sideRight]}>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.sideName} numberOfLines={1}>{name}</Text>
            <Text style={[styles.sideXP, { color: COLORS.streak }]}>{race.friend_xp.toLocaleString()} XP</Text>
          </View>
          <SocialAvatar name={name} size={44} ring={COLORS.streak} ringWidth={3} />
        </View>
      </View>

      <View style={styles.bar} accessibilityLabel={`You ${race.my_xp} XP, ${name} ${race.friend_xp} XP`}>
        <View style={[styles.barMine, { flex: share }]} />
        <View style={[styles.barTheirs, { flex: 1 - share }]} />
        <View style={[styles.knob, { left: `${share * 100}%` }]}>
          <XPFlask size={16} />
        </View>
      </View>

      <Text style={[styles.lead, leading && { color: COLORS.accent }]}>{raceLeadLine({ ...race, status: over ? 'finished' : race.status })}</Text>

      {over && !race.claimed ? (
        <TouchableOpacity style={[styles.btn, styles.btnClaim]} onPress={onClaim} disabled={busy} accessibilityRole="button">
          {busy ? <ActivityIndicator color="#FFFFFF" /> : (
            <>
              <Feather name="gift" size={17} color="#FFFFFF" />
              <Text style={styles.btnPrimaryText}>{reward > 0 ? `${outcome === 'won' ? 'You won! ' : outcome === 'tied' ? 'Tie! ' : ''}Collect +${reward} XP` : 'See results'}</Text>
            </>
          )}
        </TouchableOpacity>
      ) : over ? (
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onRematch} disabled={busy} accessibilityRole="button">
          <Feather name="rotate-ccw" size={15} color={COLORS.accent} />
          <Text style={styles.btnGhostText}>Rematch {name}</Text>
        </TouchableOpacity>
      ) : nudgeState === 'nudged' || race.nudged_today ? (
        <View style={[styles.btn, styles.btnOff]}><Text style={styles.btnOffText}>Nudged {name} ✓</Text></View>
      ) : (
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onNudge} disabled={nudgeState === 'sending'} accessibilityRole="button">
          {nudgeState === 'sending' ? <ActivityIndicator color={COLORS.accent} /> : <>
            <MaterialCommunityIcons name="hand-wave" size={18} color={COLORS.accent} />
            <Text style={styles.btnGhostText}>{leading ? `Nudge ${name}` : `Nudge ${name} · then pull ahead`}</Text>
          </>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.bg2, borderRadius: 20, padding: 14, gap: 12, borderWidth: 1.5, borderColor: COLORS.border },
  cardRace: { overflow: 'hidden' },
  cardInvite: { borderColor: COLORS.accent + '55', backgroundColor: COLORS.accentSoft },
  cardDone: { borderColor: COLORS.success + '66' },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flagDisc: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  inviteTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  inviteSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  row2: { flexDirection: 'row', gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1, color: COLORS.accent },
  clock: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: COLORS.bg1 },
  clockText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  prizeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  prize: { fontSize: 11, fontWeight: '800', color: COLORS.success },
  versus: { flexDirection: 'row', alignItems: 'center' },
  side: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  sideRight: { justifyContent: 'flex-end' },
  sideName: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, maxWidth: 110 },
  sideXP: { fontSize: 16, fontWeight: '900' },
  vs: { fontSize: 12, fontWeight: '900', color: COLORS.textMuted, marginHorizontal: 6 },
  bar: { height: 14, borderRadius: 7, flexDirection: 'row', overflow: 'visible', backgroundColor: COLORS.bg1 },
  barMine: { backgroundColor: COLORS.accent, borderTopLeftRadius: 7, borderBottomLeftRadius: 7 },
  barTheirs: { backgroundColor: COLORS.streak, borderTopRightRadius: 7, borderBottomRightRadius: 7 },
  knob: {
    position: 'absolute', top: -8, marginLeft: -15, width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.bg2,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.border,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  lead: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textAlign: 'center' },
  btn: { flex: 1, minHeight: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12 },
  btnPrimary: { backgroundColor: COLORS.accent },
  btnClaim: { backgroundColor: COLORS.success },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  btnGhost: { borderWidth: 2, borderColor: COLORS.accent + '45', backgroundColor: COLORS.bg2 },
  btnGhostText: { fontSize: 14, fontWeight: '800', color: COLORS.accent },
  btnOff: { backgroundColor: COLORS.bg1 },
  btnOffText: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
  linkBtn: { alignSelf: 'flex-start', paddingVertical: 2 },
  link: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, textDecorationLine: 'underline' },
});
