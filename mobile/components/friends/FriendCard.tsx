import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { COLORS } from '../../lib/constants';
import { Friend } from '../../hooks/useFriends';
import { APP_ICONS } from '../../lib/icons';

interface FriendCardProps {
  friend: Friend;
  isActive: boolean;
  onNudge: (friend: Friend) => void;
  onRemove: (friend: Friend) => void;
}

export function FriendCard({ friend, isActive, onNudge, onRemove }: FriendCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{friend.username.charAt(0).toUpperCase()}</Text>
        {isActive && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{friend.username}</Text>
        <View style={styles.meta}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Image source={APP_ICONS.progress} style={{ width: 12, height: 12, resizeMode: 'contain' }} />
            <Text style={styles.stat}>{friend.totalXP.toLocaleString()}</Text>
          </View>
          {friend.currentStreak > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Image source={APP_ICONS.streak} style={{ width: 12, height: 12, resizeMode: 'contain' }} />
              <Text style={styles.stat}>{friend.currentStreak}</Text>
            </View>
          )}
          <Text style={styles.stat}>Lv.{friend.currentLevel}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.nudgeBtn} onPress={() => onNudge(friend)}>
        <Image source={APP_ICONS.trainer} style={{ width: 18, height: 18, resizeMode: 'contain' }} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onRemove(friend)}>
        <Text style={styles.moreIcon}>···</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: COLORS.bg2, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  avatarText: { fontSize: 20, color: COLORS.textPrimary, fontWeight: '600' },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: COLORS.bg2,
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  meta: { flexDirection: 'row', gap: 10 },
  stat: { fontSize: 11, color: COLORS.textMuted },
  nudgeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  moreIcon: { color: COLORS.textMuted, fontSize: 18, paddingLeft: 4 },
});
