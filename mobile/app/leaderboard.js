import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Feather } from '@expo/vector-icons';
import { getMonthlyStandings, standingName } from '../lib/socialStandings';
import { log } from '../lib/logger';
function getRankIcon(rank) {
    if (rank === 1)
        return { label: '1st', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' };
    if (rank === 2)
        return { label: '2nd', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' };
    if (rank === 3)
        return { label: '3rd', color: '#F97316', bg: 'rgba(249,115,22,0.15)' };
    return { label: `#${rank}`, color: COLORS.textMuted, bg: COLORS.bg1 };
}
export default function LeaderboardScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [marketName, setMarketName] = useState('');
    const [currentUserRank, setCurrentUserRank] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!user)
                return;
            setLoading(true);
            const { data: profile } = await supabase.from('profiles').select('selected_market').eq('id', user.id).single();
            const market = profile?.selected_market || 'aerospace';
            setMarketName(market.charAt(0).toUpperCase() + market.slice(1));
            try {
                setError(null);
                const rows = (await getMonthlyStandings(market)).filter(row => row.monthly_xp > 0).slice(0, 50);
                const entries = rows.map((row, index) => ({
                    rank: index + 1,
                    user_id: row.user_id,
                    username: standingName(row),
                    total_xp: row.monthly_xp,
                    current_level: row.current_level,
                    current_streak: row.current_streak,
                    isCurrentUser: row.user_id === user.id,
                }));
                setLeaderboard(entries);
                setCurrentUserRank(entries.find(entry => entry.isCurrentUser)?.rank ?? null);
            }
            catch (loadError) {
                log.warn('Leaderboard failed', loadError);
                setLeaderboard([]);
                setError('Monthly standings could not load. Please try again.');
            }
            setLoading(false);
        };
        fetchLeaderboard();
    }, [user]);
    return (<View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="award" size={20} color={COLORS.accent}/>
            <Text style={styles.headerTitle}>Leaderboard</Text>
          </View>
          <Text style={styles.headerSub}>{marketName} Industry</Text>
        </View>
        {currentUserRank && (<View style={styles.rankChip}>
            <Text style={styles.rankChipText}>#{currentUserRank}</Text>
          </View>)}
      </View>

      <View style={styles.seasonBar}><Text style={styles.seasonText}>CURRENT MONTHLY SEASON</Text></View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
        {/* Hero banner with image */}
        <View style={styles.prizeBanner}>
          <Image source={require('../assets/illustrations/leaderboard-hero.png')} style={{ width: 56, height: 56 }} resizeMode="contain"/>
          <View style={{ flex: 1 }}>
            <Text style={styles.prizeTitle}>Become the Industry Master</Text>
            <Text style={styles.prizeDesc}>
              Hold <Text style={styles.prizeHighlight}>#1 in your industry</Text> and you top the board every
              analyst here is climbing. Every point is earned in lessons.
            </Text>
          </View>
        </View>

        {/* Market + filter chip */}
        <View style={styles.chipRow}>
          <View style={styles.marketPill}>
            <Text style={styles.marketPillText}>{marketName} Rankings</Text>
          </View>
          {leaderboard.length > 0 && (<View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {leaderboard.length} ranked
              </Text>
            </View>)}
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>
                This Month
            </Text>
          </View>
        </View>

        {loading ? (<View style={styles.centered}><ActivityIndicator color={COLORS.accent} size="large"/></View>) : error ? (<View style={styles.emptyState}>
            <Feather name="wifi-off" size={30} color={COLORS.textMuted}/>
            <Text style={styles.emptyTitle}>Standings unavailable</Text>
            <Text style={styles.emptySub}>{error}</Text>
          </View>) : leaderboard.length === 0 ? (<View style={styles.emptyState}>
            <Image source={require('../assets/illustrations/leaderboard-hero.png')} style={{ width: 120, height: 120, marginBottom: 16 }} resizeMode="contain"/>
            <Text style={styles.emptyTitle}>No one on the leaderboard yet!</Text>
            <Text style={styles.emptySub}>Finish a lesson and you take first place.</Text>
          </View>) : (<View style={styles.entriesContainer}>
            {leaderboard.map((entry) => {
                const rank = getRankIcon(entry.rank);
                const isTop3 = entry.rank <= 3;
                return (<View key={entry.user_id} style={[
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
                      {entry.current_streak > 0 && (<View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Feather name="activity" size={12} color={COLORS.orange}/>
                          <Text style={styles.streakText}>{entry.current_streak}</Text>
                        </View>)}
                    </View>
                  </View>
                  <View style={styles.xpChip}>
                    <Feather name="zap" size={12} color={COLORS.accent}/>
                    <Text style={styles.xpValue}>{entry.total_xp.toLocaleString()}</Text>
                  </View>
                </View>);
            })}
          </View>)}
      </ScrollView>
    </View>);
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
    seasonBar: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    seasonText: { fontSize: 11, fontWeight: '800', color: COLORS.accent },
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
