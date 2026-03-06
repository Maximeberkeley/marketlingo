import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Feather } from '@expo/vector-icons';

type TimeFilter = 'weekly' | 'monthly' | 'all-time';

const TIME_TABS: { key: TimeFilter; label: string }[] = [
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'all-time', label: 'All Time' },
];

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  isCurrentUser: boolean;
}

function getRankIcon(rank: number) {
  if (rank === 1) return { label: '1st', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' };
  if (rank === 2) return { label: '2nd', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' };
  if (rank === 3) return { label: '3rd', color: '#F97316', bg: 'rgba(249,115,22,0.15)' };
  return { label: `#${rank}`, color: COLORS.textMuted, bg: COLORS.bg1 };
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketName, setMarketName] = useState('');
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all-time');

  const buildEntries = useCallback(async (
    xpData: { user_id: string; total_xp: number; current_level: number }[],
    market: string,
  ) => {
    const userIds = xpData.map((x) => x.user_id);
    if (userIds.length === 0) { setLeaderboard([]); return; }

    const [{ data: profiles }, { data: progressData }] = await Promise.all([
      supabase.from('profiles').select('id, username').in('id', userIds),
      supabase.from('user_progress').select('user_id, current_streak').eq('market_id', market).in('user_id', userIds),
    ]);

    const entries: LeaderboardEntry[] = xpData.map((xp, index) => {
      const p = profiles?.find((pr) => pr.id === xp.user_id);
      const s = progressData?.find((pr) => pr.user_id === xp.user_id);
      return {
        rank: index + 1, user_id: xp.user_id,
        username: p?.username?.split('@')[0] || `User ${index + 1}`,
        total_xp: xp.total_xp, current_level: xp.current_level,
        current_streak: s?.current_streak || 0, isCurrentUser: xp.user_id === user?.id,
      };
    });

    setLeaderboard(entries);
    const me = entries.find((e) => e.isCurrentUser);
    setCurrentUserRank(me?.rank ?? null);
  }, [user]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!user) return;
      setLoading(true);

      const { data: profile } = await supabase.from('profiles').select('selected_market').eq('id', user.id).single();
      const market = profile?.selected_market || 'aerospace';
      setMarketName(market.charAt(0).toUpperCase() + market.slice(1));

      if (timeFilter === 'all-time') {
        const { data: xpData } = await supabase
          .from('user_xp').select('user_id, total_xp, current_level')
          .eq('market_id', market).order('total_xp', { ascending: false }).limit(50);
        if (xpData) await buildEntries(xpData, market);
      } else {
        const now = new Date();
        const since = new Date(now);
        since.setDate(since.getDate() - (timeFilter === 'weekly' ? 7 : 30));
        const { data: txns } = await supabase
          .from('xp_transactions').select('user_id, xp_amount')
          .eq('market_id', market).gte('created_at', since.toISOString());
        if (txns) {
          const userXPMap = new Map<string, number>();
          txns.forEach((t) => userXPMap.set(t.user_id, (userXPMap.get(t.user_id) || 0) + t.xp_amount));
          const sorted = Array.from(userXPMap.entries())
            .sort((a, b) => b[1] - a[1]).slice(0, 50)
            .map(([uid, total_xp]) => ({ user_id: uid, total_xp, current_level: 1 }));
          await buildEntries(sorted, market);
        }
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, [user, timeFilter, buildEntries]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="award" size={20} color={COLORS.accent} />
            <Text style={styles.headerTitle}>Leaderboard</Text>
          </View>
          <Text style={styles.headerSub}>{marketName} Industry</Text>
        </View>
        {currentUserRank && (
          <View style={styles.rankChip}>
            <Text style={styles.rankChipText}>#{currentUserRank}</Text>
          </View>
        )}
      </View>

      {/* Time filter tabs */}
      <View style={styles.tabRow}>
        {TIME_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, timeFilter === tab.key && styles.tabActive]}
            onPress={() => setTimeFilter(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, timeFilter === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Prize banner */}
        <View style={styles.prizeBanner}>
          <View style={styles.prizeIconWrap}>
            <Image source={APP_ICONS.achievements} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.prizeTitle}>Become the Industry Master</Text>
            <Text style={styles.prizeDesc}>
              The <Text style={styles.prizeHighlight}>#1 ranked user</Text> in each industry every 6 months wins{' '}
              <Text style={styles.prizeHighlight}>1 Full Year of MarketLingo Premium!</Text>
            </Text>
          </View>
        </View>

        {/* Market + filter chip */}
        <View style={styles.chipRow}>
          <View style={styles.marketPill}>
            <Text style={styles.marketPillText}>{marketName} Rankings</Text>
          </View>
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>
              {timeFilter === 'all-time' ? 'All Time' : timeFilter === 'weekly' ? 'This Week' : 'This Month'}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}><ActivityIndicator color={COLORS.accent} size="large" /></View>
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyState}>
            <Image source={APP_ICONS.achievements} style={{ width: 48, height: 48, resizeMode: 'contain', marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No one on the leaderboard yet!</Text>
            <Text style={styles.emptySub}>Complete lessons to earn XP</Text>
          </View>
        ) : (
          <View style={styles.entriesContainer}>
            {leaderboard.map((entry) => {
              const rank = getRankIcon(entry.rank);
              const isTop3 = entry.rank <= 3;
              return (
                <View key={entry.user_id} style={[
                  styles.entry,
                  entry.isCurrentUser && styles.entryMe,
                  isTop3 && !entry.isCurrentUser && styles.entryTop3,
                ]}>
                  <View style={[styles.rankWrap, { backgroundColor: rank.bg }]}>
                    <Text style={[styles.rankText, { color: rank.color }]}>{rank.label}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.username, entry.isCurrentUser && { color: COLORS.accent }]} numberOfLines={1}>
                      {entry.username}{entry.isCurrentUser ? ' (You)' : ''}
                    </Text>
                    <View style={styles.userMeta}>
                      <Text style={styles.levelText}>Lv. {entry.current_level}</Text>
                      {entry.current_streak > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Image source={APP_ICONS.streak} style={{ width: 12, height: 12, resizeMode: 'contain' }} />
                          <Text style={styles.streakText}>{entry.current_streak}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.xpChip}>
                    <Image source={APP_ICONS.drills} style={{ width: 12, height: 12, resizeMode: 'contain' }} />
                    <Text style={styles.xpValue}>{entry.total_xp.toLocaleString()}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: COLORS.bg0,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 18, color: COLORS.textPrimary },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 12, color: COLORS.textMuted },
  rankChip: { backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  rankChipText: { fontSize: 12, color: COLORS.accent, fontWeight: '700' },
  tabRow: {
    flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4,
    backgroundColor: COLORS.bg0, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.bg2 },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  prizeBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 16, marginBottom: 16,
    backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },
  prizeIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center' },
  prizeTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  prizeDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  prizeHighlight: { color: '#FBBF24', fontWeight: '600' },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  marketPill: { backgroundColor: COLORS.bg2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  marketPillText: { fontSize: 12, color: COLORS.textPrimary, fontWeight: '500' },
  filterBadge: { backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  filterBadgeText: { fontSize: 10, color: COLORS.accent, fontWeight: '600' },
  entriesContainer: { gap: 6 },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border },
  entryMe: { backgroundColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.3)' },
  entryTop3: { backgroundColor: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' },
  rankWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 14, fontWeight: '700' },
  username: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  levelText: { fontSize: 11, color: COLORS.textMuted },
  streakText: { fontSize: 11, color: '#FB923C', fontWeight: '600' },
  xpChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: COLORS.bg1 },
  xpValue: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '500', marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textMuted },
});
