import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from '../../lib/constants';
import { Friend } from '../../hooks/useFriends';
import { APP_ICONS } from '../../lib/icons';

interface FriendActivityFeedProps {
  friends: Friend[];
}

function getActivityText(friend: Friend): string {
  if (!friend.lastActivityAt) return 'Hasn\'t started yet';
  const hours = (Date.now() - new Date(friend.lastActivityAt).getTime()) / (1000 * 60 * 60);
  if (hours < 1) return 'Active just now';
  if (hours < 24) return `Active ${Math.floor(hours)}h ago`;
  const days = Math.floor(hours / 24);
  return `Last active ${days}d ago`;
}

function getActivityIcon(friend: Friend): any {
  if (friend.currentStreak >= 7) return APP_ICONS.streak;
  if (friend.totalXP > 1000) return APP_ICONS.achievements;
  return APP_ICONS.learn;
}

export function FriendActivityFeed({ friends }: FriendActivityFeedProps) {
  const recentFriends = [...friends]
    .filter(f => f.lastActivityAt)
    .sort((a, b) => new Date(b.lastActivityAt!).getTime() - new Date(a.lastActivityAt!).getTime())
    .slice(0, 5);

  if (recentFriends.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Activity</Text>
      {recentFriends.map((friend) => (
        <View key={friend.id} style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{friend.username.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.name}>{friend.username}</Text>
              <Image source={getActivityIcon(friend)} style={{ width: 14, height: 14, resizeMode: 'contain' }} />
            </View>
            <Text style={styles.activity}>{getActivityText(friend)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Image source={APP_ICONS.progress} style={{ width: 12, height: 12, resizeMode: 'contain' }} />
            <Text style={styles.xp}>{friend.totalXP.toLocaleString()}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg2, borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  title: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 10, letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  content: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  activity: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  xp: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
});
