import React from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { StreakFlame } from '../ui/StreakFlame';
import { XPFlask } from '../ui/XPFlask';
import { SocialAvatar } from './SocialAvatar';
import {
  FriendStreak, STREAK_MILESTONES, currentTier, firstName, milestoneLine, streakToday, streakTodayLine,
} from '../../lib/friendSocial';

interface Props {
  streak: FriendStreak | null;
  busy: boolean;
  nudgeState: 'idle' | 'sending' | 'nudged' | 'done';
  onClose: () => void;
  onAccept: (accept: boolean) => void;
  onClaim: () => void;
  onNudge: () => void;
  onEnd: () => void;
  onStudy: () => void;
}

/** One friend streak up close: both faces in the flame, today's status, milestones and the next move. */
export function StreakSheet({ streak, busy, nudgeState, onClose, onAccept, onClaim, onNudge, onEnd, onStudy }: Props) {
  const insets = useSafeAreaInsets();
  if (!streak) return null;
  const name = firstName(streak);
  const today = streakToday(streak);
  const tier = currentTier(streak.length);
  const incoming = streak.status === 'pending' && !streak.invited_by_me;
  const outgoing = streak.status === 'pending' && streak.invited_by_me;
  const lit = streak.status === 'active' && today === 'both_done';

  const confirmEnd = () => Alert.alert(
    outgoing ? 'Cancel this invite?' : `End your streak with ${name}?`,
    outgoing ? undefined : 'The flame goes out for both of you. You can start a new one later.',
    [{ text: 'Keep it', style: 'cancel' }, { text: outgoing ? 'Cancel invite' : 'End streak', style: 'destructive', onPress: onEnd }],
  );

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.handle} />
        <TouchableOpacity style={styles.close} onPress={onClose} accessibilityLabel="Close"><Feather name="x" size={18} color={COLORS.textMuted} /></TouchableOpacity>

        <View style={styles.duo}>
          <SocialAvatar name="You" size={58} ring={streak.me_done_today ? COLORS.streak : COLORS.border} ringWidth={3} />
          <View style={[styles.flameCore, lit ? styles.flameCoreLit : styles.flameCoreIdle]}>
            <StreakFlame size={44} color={lit ? '#FFFFFF' : COLORS.streak} />
          </View>
          <SocialAvatar name={name} size={58} ring={streak.friend_done_today ? COLORS.streak : COLORS.border} ringWidth={3} />
        </View>

        {streak.status === 'active' ? (
          <>
            <Text style={styles.count}>{streak.length}</Text>
            <Text style={styles.countLabel}>day friend streak with {name}{tier ? ` · ${tier.name}` : ''}</Text>
          </>
        ) : (
          <Text style={styles.pendingTitle}>{incoming ? `${name} wants a friend streak with you` : `Waiting for ${name} to accept`}</Text>
        )}

        {streak.status === 'active' && (
          <View style={styles.todayRow}>
            <TodayCell label="You" done={streak.me_done_today} />
            <TodayCell label={name} done={streak.friend_done_today} />
          </View>
        )}
        <Text style={styles.todayLine}>
          {incoming ? 'Each day you both finish a lesson, the flame grows. Miss a day and it starts over.'
            : outgoing ? 'We let them know. The flame lights the first day you both study.'
              : streakTodayLine(streak)}
        </Text>

        {streak.status === 'active' && (
          <View style={styles.milestones}>
            <View style={styles.trackRow}>
              {STREAK_MILESTONES.map((m, i) => {
                const reached = streak.best_length >= m.days || streak.length >= m.days;
                return (
                  <React.Fragment key={m.days}>
                    {i > 0 && <View style={[styles.trackLine, reached && styles.trackLineOn]} />}
                    <View style={[styles.node, reached && styles.nodeOn]}>
                      {reached ? <Feather name="check" size={13} color="#FFFFFF" /> : <Text style={styles.nodeDays}>{m.days}</Text>}
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
            <View style={styles.trackLabels}>
              {STREAK_MILESTONES.map(m => (
                <View key={m.days} style={styles.trackLabel}>
                  <Text style={styles.trackName} numberOfLines={1}>{m.name}</Text>
                  <View style={styles.trackXPRow}>
                    <XPFlask size={11} />
                    <Text style={styles.trackXP}>+{m.xp} XP</Text>
                  </View>
                </View>
              ))}
            </View>
            <Text style={styles.nextLine}>{milestoneLine(streak.length)}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {incoming ? (
            <>
              <BigButton label="Start our streak" color={COLORS.streak} busy={busy} onPress={() => onAccept(true)} icon="flame" />
              <TextButton label="Not now" onPress={() => onAccept(false)} />
            </>
          ) : outgoing ? (
            <TextButton label="Cancel invite" onPress={confirmEnd} />
          ) : (
            <>
              {streak.claimable_xp > 0 ? (
                <BigButton label={`Collect +${streak.claimable_xp} XP`} color={COLORS.success} busy={busy} onPress={onClaim} icon="gift" />
              ) : today === 'your_turn' || today === 'neither' ? (
                <BigButton label="Do today's lesson" color={COLORS.accent} onPress={onStudy} icon="book-open" />
              ) : null}
              {!streak.friend_done_today && (
                nudgeState === 'nudged'
                  ? <View style={[styles.secondary, styles.secondaryOff]}><Text style={styles.secondaryTextOff}>Nudged {name} ✓</Text></View>
                  : (
                    <TouchableOpacity style={styles.secondary} onPress={onNudge} disabled={nudgeState === 'sending'} accessibilityRole="button">
                      {nudgeState === 'sending' ? <ActivityIndicator color={COLORS.accent} /> : <Text style={styles.secondaryText}>Nudge {name}</Text>}
                    </TouchableOpacity>
                  )
              )}
              <TextButton label="End this streak" onPress={confirmEnd} muted />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function TodayCell({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={[styles.todayCell, done && styles.todayCellDone]}>
      <Feather name={done ? 'check-circle' : 'circle'} size={18} color={done ? COLORS.streak : COLORS.textMuted} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.todayCellName} numberOfLines={1}>{label}</Text>
        <Text style={[styles.todayCellText, done && styles.todayCellTextDone]}>{done ? 'Done today' : 'Not yet'}</Text>
      </View>
    </View>
  );
}

function BigButton({ label, color, onPress, busy, icon }: { label: string; color: string; onPress: () => void; busy?: boolean; icon: 'flame' | 'gift' | 'book-open' }) {
  return (
    <TouchableOpacity style={[styles.big, { backgroundColor: color }]} onPress={onPress} disabled={busy} activeOpacity={0.9} accessibilityRole="button">
      {busy ? <ActivityIndicator color="#FFFFFF" /> : (
        <>
          {icon === 'flame' ? <StreakFlame size={20} color="#FFFFFF" /> : <Feather name={icon} size={18} color="#FFFFFF" />}
          <Text style={styles.bigText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function TextButton({ label, onPress, muted = false }: { label: string; onPress: () => void; muted?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.textBtn} accessibilityRole="button">
      <Text style={[styles.textBtnText, muted && styles.textBtnMuted]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11, 16, 32, 0.55)' },
  sheet: {
    backgroundColor: COLORS.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10,
    width: '100%', maxWidth: 680, alignSelf: 'center',
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.border, marginBottom: 8 },
  close: { position: 'absolute', right: 14, top: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  duo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 14 },
  flameCore: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center' },
  flameCoreLit: {
    backgroundColor: COLORS.streak, shadowColor: COLORS.streak, shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  flameCoreIdle: { backgroundColor: COLORS.streakBadgeSurface, borderWidth: 2, borderColor: COLORS.streakBadgeBorder },
  count: { fontSize: 46, fontWeight: '900', color: COLORS.streak, textAlign: 'center', marginTop: 8, lineHeight: 52 },
  countLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  pendingTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginTop: 14 },
  todayRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  todayCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 12, backgroundColor: COLORS.bg1 },
  todayCellDone: { backgroundColor: COLORS.streakBadgeSurface },
  todayCellName: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
  todayCellText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginTop: 1 },
  todayCellTextDone: { color: COLORS.streak },
  todayLine: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 19 },
  milestones: { marginTop: 16, padding: 14, borderRadius: 18, backgroundColor: COLORS.bg1 },
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
  trackLine: { flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  trackLineOn: { backgroundColor: COLORS.streak },
  node: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center' },
  nodeOn: { backgroundColor: COLORS.streak, borderColor: COLORS.streak },
  nodeDays: { fontSize: 11, fontWeight: '900', color: COLORS.textSecondary },
  trackLabels: { flexDirection: 'row', marginTop: 6 },
  trackLabel: { flex: 1, alignItems: 'center' },
  trackName: { fontSize: 10, fontWeight: '800', color: COLORS.textPrimary },
  trackXPRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 1 },
  trackXP: { fontSize: 10, fontWeight: '700', color: COLORS.streak },
  nextLine: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textAlign: 'center', marginTop: 10 },
  actions: { marginTop: 16, gap: 10 },
  big: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bigText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  secondary: { height: 50, borderRadius: 16, borderWidth: 2, borderColor: COLORS.accent + '55', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '800', color: COLORS.accent },
  secondaryOff: { borderColor: COLORS.border, backgroundColor: COLORS.bg1 },
  secondaryTextOff: { fontSize: 15, fontWeight: '700', color: COLORS.textMuted },
  textBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14 },
  textBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  textBtnMuted: { fontSize: 13, color: COLORS.textMuted, textDecorationLine: 'underline' },
});
