import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { StreakFlame } from '../ui/StreakFlame';
import { SocialAvatar } from './SocialAvatar';
import { MAX_FRIEND_RACES, MAX_FRIEND_STREAKS, RACE_DAYS, RACE_REWARD } from '../../lib/friendSocial';

export interface PickerFriend {
  id: string;
  name: string;
  meta: string;
  /** Why this friend can't be picked right now ("Streak on", "Racing"), if so. */
  taken?: string;
}

/** Choose who to start a friend streak with, or who to race this week. */
export function FriendPicker({ mode, friends, busyId, error, onPick, onClose, onAddFriends }: {
  mode: 'streak' | 'race' | null;
  friends: PickerFriend[];
  busyId: string | null;
  error: string | null;
  onPick: (friendId: string) => void;
  onClose: () => void;
  onAddFriends: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!mode) return null;
  const streak = mode === 'streak';
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <View style={[styles.disc, { backgroundColor: streak ? COLORS.streak : COLORS.accent }]}>
            {streak ? <StreakFlame size={22} color="#FFFFFF" /> : <Feather name="flag" size={19} color="#FFFFFF" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{streak ? 'Start a friend streak' : 'Challenge a friend'}</Text>
            <Text style={styles.sub}>
              {streak
                ? `Both finish a lesson each day and the flame grows. Up to ${MAX_FRIEND_STREAKS} friends.`
                : `${RACE_DAYS} days, XP from any industry. Winner +${RACE_REWARD.won} XP. Up to ${MAX_FRIEND_RACES} races at once.`}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.close} accessibilityLabel="Close"><Feather name="x" size={18} color={COLORS.textMuted} /></TouchableOpacity>
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 8 }}>
          {friends.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Add a friend first, then {streak ? 'start a streak together' : 'race them'}.</Text>
              <TouchableOpacity style={[styles.pick, { backgroundColor: COLORS.accent }]} onPress={onAddFriends}><Text style={styles.pickText}>Add friends</Text></TouchableOpacity>
            </View>
          ) : friends.map(f => (
            <View key={f.id} style={styles.row}>
              <SocialAvatar name={f.name} size={42} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.name} numberOfLines={1}>{f.name}</Text>
                <Text style={styles.meta} numberOfLines={1}>{f.meta}</Text>
              </View>
              {f.taken ? (
                <View style={[styles.pick, styles.pickOff]}><Text style={styles.pickOffText}>{f.taken}</Text></View>
              ) : (
                <TouchableOpacity style={[styles.pick, { backgroundColor: streak ? COLORS.streak : COLORS.accent }]} onPress={() => onPick(f.id)} disabled={!!busyId} accessibilityRole="button" accessibilityLabel={`${streak ? 'Invite' : 'Race'} ${f.name}`}>
                  {busyId === f.id ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.pickText}>{streak ? 'Invite' : 'Race'}</Text>}
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11, 16, 32, 0.55)' },
  sheet: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, gap: 12, width: '100%', maxWidth: 680, alignSelf: 'center' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.border },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  disc: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, backgroundColor: COLORS.bg1 },
  name: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  pick: { minWidth: 76, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  pickText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  pickOff: { backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border },
  pickOffText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 18 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});
