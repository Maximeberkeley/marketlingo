import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { Friend } from '../../hooks/useFriends';

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

function getActivityIcon(friend: Friend): keyof typeof Feather.glyphMap {
  if (friend.currentStreak >= 7) return 'activity';
  if (friend.totalXP > 1000) return 'award';
  return 'book-open';
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
              <Feather name={getActivityIcon(friend)} size={14} color={COLORS.accent} />
            </View>
            <Text style={styles.activity}>{getActivityText(friend)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Feather name="bar-chart-2" size={12} color={COLORS.textMuted} />
            <Text style={styles.xp}>{friend.totalXP.toLocaleString()}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.bg1, borderRadius: 12, padding: 10,
  },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  content: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  activity: { fontSize: 11, color: COLORS.textMuted },
  xp: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
});
