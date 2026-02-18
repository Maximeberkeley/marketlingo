import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface LeaderboardEntry {
  user_id: string;
  email: string;
  total_xp: number;
  rank: number;
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_market')
        .eq('id', user.id)
        .single();

      const market = profile?.selected_market || 'aerospace';

      // Fetch top XP users for this market
      const { data: xpData, error } = await supabase
        .from('user_xp')
        .select('user_id, total_xp')
        .eq('market_id', market)
        .order('total_xp', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        setLoading(false);
        return;
      }

      // Get emails for display (anonymized)
      const ranked = (xpData || []).map((entry, index) => ({
        user_id: entry.user_id,
        email: entry.user_id === user.id ? (user.email || 'You') : `Player ${index + 1}`,
        total_xp: entry.total_xp,
        rank: index + 1,
      }));

      const myRank = ranked.find((e) => e.user_id === user.id);
      if (myRank) setUserRank(myRank.rank);

      setEntries(ranked);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const medalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>
          {userRank ? `You're ranked #${userRank}` : 'Start earning XP to join!'}
        </Text>

        {/* Top 3 podium */}
        {entries.length >= 3 && (
          <View style={styles.podium}>
            {[entries[1], entries[0], entries[2]].map((entry, i) => {
              const isMe = entry.user_id === user?.id;
              const heights = [100, 130, 80];
              return (
                <View key={entry.user_id} style={[styles.podiumCol, { height: heights[i] }]}>
                  <Text style={{ fontSize: i === 1 ? 28 : 22 }}>{medalEmoji(entry.rank)}</Text>
                  <Text style={[styles.podiumName, isMe && { color: COLORS.accent }]} numberOfLines={1}>
                    {isMe ? 'You' : entry.email}
                  </Text>
                  <Text style={styles.podiumXP}>⚡ {entry.total_xp.toLocaleString()}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Full list */}
        <View style={{ gap: 6, marginTop: 16 }}>
          {entries.map((entry) => {
            const isMe = entry.user_id === user?.id;
            return (
              <View key={entry.user_id} style={[styles.row, isMe && styles.rowMe]}>
                <Text style={styles.rankText}>
                  {entry.rank <= 3 ? medalEmoji(entry.rank) : `#${entry.rank}`}
                </Text>
                <Text style={[styles.nameText, isMe && { color: COLORS.accent, fontWeight: '600' }]} numberOfLines={1}>
                  {isMe ? 'You' : entry.email}
                </Text>
                <Text style={styles.xpText}>⚡ {entry.total_xp.toLocaleString()}</Text>
              </View>
            );
          })}
        </View>

        {entries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🏆</Text>
            <Text style={styles.emptyTitle}>No rankings yet</Text>
            <Text style={styles.emptySubtitle}>Complete lessons to earn XP and climb the leaderboard!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16 },
  backText: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textMuted },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginTop: 24, marginBottom: 8 },
  podiumCol: {
    flex: 1, backgroundColor: COLORS.bg2, borderRadius: 14, padding: 12,
    alignItems: 'center', justifyContent: 'flex-end',
    borderWidth: 1, borderColor: COLORS.border,
  },
  podiumName: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  podiumXP: { fontSize: 12, fontWeight: '700', color: '#EAB308', marginTop: 2 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg2, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  rowMe: { borderColor: 'rgba(139, 92, 246, 0.4)', backgroundColor: 'rgba(139, 92, 246, 0.05)' },
  rankText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, width: 36 },
  nameText: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  xpText: { fontSize: 13, fontWeight: '600', color: '#EAB308' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
});
