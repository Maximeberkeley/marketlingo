import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Animated, Share, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, TYPE, SHADOWS } from '../lib/constants';
import { getMarketName } from '../lib/markets';
import { useFriends, Friend } from '../hooks/useFriends';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../lib/haptics';
import { trackEvent } from '../lib/analytics';
import { Feather } from '@expo/vector-icons';

const LEO_TROPHY = require('../assets/mascot/leo-trophy.png');
const LEO_SASSY = require('../assets/mascot/leo-sassy.png');

// ── Types ───────────────────────────────────────────
interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  isCurrentUser: boolean;
}

const MEDALS = [
  { bg: '#FEF3C7', ring: '#F59E0B', text: '#B45309' },
  { bg: '#EEF2F7', ring: '#9CA3AF', text: '#4B5563' },
  { bg: '#FFEDD5', ring: '#FB923C', text: '#C2410C' },
];

function startOfWeek() {
  const monday = new Date();
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// ── Main Screen ─────────────────────────────────────
export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [marketId, setMarketId] = useState<string | null>(null);
  const { friends, pendingRequests, loading, sendRequest, acceptRequest, declineRequest, removeFriend } = useFriends(marketId || undefined);
  const [addUsername, setAddUsername] = useState('');
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'global'>('friends');
  const [showAddInput, setShowAddInput] = useState(false);

  // Global leaderboard
  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntry[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalScope, setGlobalScope] = useState<'week' | 'all'>('week');
  const [myStats, setMyStats] = useState<{ xp: number; level: number; streak: number; weekXP: number }>({ xp: 0, level: 1, streak: 0, weekXP: 0 });
  const [friendWeekXP, setFriendWeekXP] = useState<Record<string, number>>({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.spring(fadeAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }).start();
    }
  }, [loading]);

  // Fetch market
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('selected_market').eq('id', user.id).single().then(({ data }) => {
      setMarketId(data?.selected_market || 'aerospace');
    });
  }, [user]);

  // My own real stats (all time + this week)
  useEffect(() => {
    if (!marketId || !user) return;
    (async () => {
      const [{ data: xp }, { data: prog }, { data: week }] = await Promise.all([
        supabase.from('leaderboard_xp').select('total_xp, current_level').eq('market_id', marketId).eq('user_id', user.id).maybeSingle(),
        supabase.from('leaderboard_progress').select('current_streak').eq('market_id', marketId).eq('user_id', user.id).maybeSingle(),
        supabase.from('xp_transactions').select('xp_amount').eq('market_id', marketId).eq('user_id', user.id).gte('created_at', startOfWeek().toISOString()),
      ]);
      setMyStats({
        xp: xp?.total_xp || 0,
        level: xp?.current_level || 1,
        streak: prog?.current_streak || 0,
        weekXP: (week ?? []).reduce((s: number, t: any) => s + (t.xp_amount || 0), 0),
      });
    })();
  }, [marketId, user]);

  // Real weekly XP for friends (head-to-head this week)
  useEffect(() => {
    if (!marketId || !friends.length) { setFriendWeekXP({}); return; }
    (async () => {
      const { data } = await supabase
        .from('xp_transactions')
        .select('user_id, xp_amount')
        .eq('market_id', marketId)
        .in('user_id', friends.map((f) => f.id))
        .gte('created_at', startOfWeek().toISOString());
      const map: Record<string, number> = {};
      (data ?? []).forEach((t: any) => { map[t.user_id] = (map[t.user_id] || 0) + (t.xp_amount || 0); });
      setFriendWeekXP(map);
    })();
  }, [marketId, friends]);

  // Fetch global leaderboard
  useEffect(() => {
    if (!marketId || !user) return;
    if (activeTab !== 'global') return;
    fetchGlobalLeaderboard();
  }, [marketId, user, activeTab, globalScope]);

  const fetchGlobalLeaderboard = async () => {
    if (!marketId || !user) return;
    setGlobalLoading(true);
    try {
      let ranked: { user_id: string; total_xp: number; current_level: number }[] = [];

      if (globalScope === 'all') {
        const { data } = await supabase
          .from('leaderboard_xp')
          .select('user_id, total_xp, current_level')
          .eq('market_id', marketId)
          .order('total_xp', { ascending: false })
          .limit(50);
        ranked = data ?? [];
      } else {
        const { data: txns } = await supabase
          .from('xp_transactions')
          .select('user_id, xp_amount')
          .eq('market_id', marketId)
          .gte('created_at', startOfWeek().toISOString());

        const weekly = new Map<string, number>();
        (txns ?? []).forEach((t) => weekly.set(t.user_id, (weekly.get(t.user_id) || 0) + (t.xp_amount || 0)));
        ranked = Array.from(weekly.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 50)
          .map(([uid, xp]) => ({ user_id: uid, total_xp: xp, current_level: 1 }));
      }

      if (!ranked.length) {
        setGlobalEntries([]);
        setGlobalLoading(false);
        return;
      }

      const userIds = ranked.map((x) => x.user_id);
      const [{ data: profiles }, { data: progressData }, { data: levels }] = await Promise.all([
        supabase.from('public_profiles').select('id, username').in('id', userIds),
        supabase.from('leaderboard_progress').select('user_id, current_streak').eq('market_id', marketId).in('user_id', userIds),
        supabase.from('leaderboard_xp').select('user_id, current_level').eq('market_id', marketId).in('user_id', userIds),
      ]);

      const entries: LeaderboardEntry[] = ranked.map((x, idx) => {
        const profile = profiles?.find((p) => p.id === x.user_id);
        const prog = progressData?.find((p) => p.user_id === x.user_id);
        const lvl = levels?.find((l) => l.user_id === x.user_id);
        return {
          rank: idx + 1,
          user_id: x.user_id,
          username: profile?.username?.split('@')[0] || 'Analyst',
          total_xp: x.total_xp,
          current_level: lvl?.current_level || x.current_level,
          current_streak: prog?.current_streak || 0,
          isCurrentUser: x.user_id === user.id,
        };
      });

      setGlobalEntries(entries);
    } catch (e) { /* non-critical */ }
    setGlobalLoading(false);
  };

  const currentUserRank = globalEntries.find((e) => e.isCurrentUser)?.rank ?? null;
  const marketName = marketId ? getMarketName(marketId) : '';

  const initial = (user?.email || 'Y').charAt(0).toUpperCase();

  // Friends board = me + friends, ranked on real XP
  const friendsBoard = useMemo(() => {
    const rows = [
      {
        id: 'me', isMe: true, name: 'You', initial,
        xp: myStats.xp, weekXP: myStats.weekXP, level: myStats.level, streak: myStats.streak,
        friend: null as Friend | null,
      },
      ...friends.map((f) => ({
        id: f.id, isMe: false, name: f.username, initial: f.username.charAt(0).toUpperCase(),
        xp: f.totalXP, weekXP: friendWeekXP[f.id] || 0, level: f.currentLevel, streak: f.currentStreak,
        friend: f,
      })),
    ];
    return rows.sort((a, b) => b.xp - a.xp);
  }, [friends, friendWeekXP, myStats, initial]);

  const myFriendRank = friendsBoard.findIndex((r) => r.isMe) + 1;

  const handleAddFriend = async () => {
    if (!addUsername.trim()) return;
    setAdding(true);
    triggerHaptic('light');
    const result = await sendRequest(addUsername.trim());
    setAdding(false);
    if (result.success) {
      trackEvent('friend_request_sent', { to: addUsername.trim() });
      Alert.alert('Request sent', `Friend request sent to "${addUsername}"`);
      setAddUsername('');
      setShowAddInput(false);
    } else {
      Alert.alert('Oops', result.error || 'Something went wrong');
    }
  };

  const handleNudge = async (friend: Friend) => {
    triggerHaptic('medium');
    trackEvent('nudge_sent', { to: friend.id });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: friend.id,
            title: 'Nudge!',
            body: `${user?.email?.split('@')[0] || 'A friend'} is reminding you to keep learning!`,
            data: { type: 'nudge', route: '/(tabs)/home' },
          },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
    } catch (e) { /* non-critical */ }
    Alert.alert('Nudge sent', `${friend.username} just got a ping.`);
  };

  const handleRemove = (friend: Friend) => {
    Alert.alert('Remove friend?', `Remove ${friend.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFriend(friend.friendshipId) },
    ]);
  };

  const handleShareInvite = async () => {
    triggerHaptic('light');
    try {
      await Share.share({ message: `Join me on MarketLingo! Learn about industries in 5 mins/day\n\nhttps://marketlingo.app/invite` });
    } catch (e) { /* cancelled */ }
  };

  const isActive = (friend: Friend) => {
    if (!friend.lastActivityAt) return false;
    return (Date.now() - new Date(friend.lastActivityAt).getTime()) / (1000 * 60 * 60) < 24;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Standings</Text>
          {!!marketName && <Text style={styles.headerSub}>{marketName}</Text>}
        </View>
        {pendingRequests.length > 0 && (
          <TouchableOpacity
            style={styles.requestsBadge}
            onPress={() => {
              pendingRequests.forEach(r => {
                Alert.alert(
                  `${r.fromUsername} wants to be friends`,
                  'Accept request?',
                  [
                    { text: 'Decline', style: 'cancel', onPress: () => declineRequest(r.id) },
                    { text: 'Accept', onPress: () => { triggerHaptic('success'); acceptRequest(r.id); } },
                  ]
                );
              });
            }}
          >
            <Feather name="bell" size={16} color={COLORS.accent} />
            <View style={styles.badgeDot}><Text style={styles.badgeDotText}>{pendingRequests.length}</Text></View>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShareInvite}>
          <Feather name="share-2" size={16} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        {(['friends', 'global'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => { triggerHaptic('light'); setActiveTab(tab); }}
          >
            <Feather
              name={tab === 'friends' ? 'users' : 'globe'}
              size={14}
              color={activeTab === tab ? '#FFF' : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'friends' ? `Friends (${friends.length})` : 'Global'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>

          {/* ── FRIENDS TAB ─────────────────────── */}
          {activeTab === 'friends' && (
            <>
              {/* My real week card */}
              <View style={styles.heroCard}>
                <Image source={LEO_TROPHY} style={styles.heroLeo} resizeMode="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroKicker}>THIS WEEK</Text>
                  <Text style={styles.heroValue}>
                    {myStats.weekXP.toLocaleString()}<Text style={styles.heroUnit}> XP</Text>
                  </Text>
                  <Text style={styles.heroLine}>
                    {friends.length === 0
                      ? 'Add a friend and this becomes a race.'
                      : <>You sit <Text style={styles.heroAccent}>#{myFriendRank}</Text> of {friendsBoard.length}.</>}
                  </Text>
                </View>
              </View>

              {/* Add Friend Toggle */}
              <TouchableOpacity
                style={styles.addFriendToggle}
                onPress={() => { triggerHaptic('light'); setShowAddInput(!showAddInput); }}
              >
                <Feather name="user-plus" size={16} color={COLORS.accent} />
                <Text style={styles.addFriendToggleText}>Add friend</Text>
              </TouchableOpacity>

              {showAddInput && (
                <View style={styles.addRow}>
                  <TextInput
                    style={styles.addInput}
                    placeholder="Username or email..."
                    placeholderTextColor={COLORS.textMuted}
                    value={addUsername}
                    onChangeText={setAddUsername}
                    autoCapitalize="none"
                    autoFocus
                    returnKeyType="send"
                    onSubmitEditing={handleAddFriend}
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, !addUsername.trim() && { opacity: 0.4 }]}
                    onPress={handleAddFriend}
                    disabled={!addUsername.trim() || adding}
                  >
                    {adding ? <ActivityIndicator color="#FFF" size="small" /> : <Feather name="send" size={16} color="#FFF" />}
                  </TouchableOpacity>
                </View>
              )}

              {loading ? (
                <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 60 }} />
              ) : friends.length === 0 ? (
                <View style={styles.emptyState}>
                  <Image source={LEO_SASSY} style={styles.emptyLeo} resizeMode="contain" />
                  <Text style={styles.emptyTitle}>Racing alone is easy.</Text>
                  <Text style={styles.emptySub}>Invite one friend. Beat them weekly.</Text>
                  <TouchableOpacity style={styles.inviteBtn} onPress={handleShareInvite}>
                    <Feather name="share-2" size={14} color="#FFF" />
                    <Text style={styles.inviteBtnText}>Invite friends</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.list}>
                  {friendsBoard.map((row, idx) => (
                    <BoardRow
                      key={row.id}
                      rank={idx + 1}
                      name={row.name}
                      initial={row.initial}
                      xp={row.xp}
                      meta={`Lv.${row.level}${row.streak > 0 ? ` · ${row.streak}d streak` : ''}${row.weekXP > 0 ? ` · +${row.weekXP} this week` : ''}`}
                      isMe={row.isMe}
                      online={row.friend ? isActive(row.friend) : false}
                      onNudge={row.friend ? () => handleNudge(row.friend!) : undefined}
                      onMore={row.friend ? () => handleRemove(row.friend!) : undefined}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {/* ── GLOBAL TAB ──────────────────────── */}
          {activeTab === 'global' && (
            <>
              {/* Scope switch */}
              <View style={styles.scopeRow}>
                {([['week', 'This week'], ['all', 'All time']] as const).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.scopeChip, globalScope === key && styles.scopeChipActive]}
                    onPress={() => { triggerHaptic('light'); setGlobalScope(key); }}
                  >
                    <Text style={[styles.scopeText, globalScope === key && styles.scopeTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Rank hero with real numbers */}
              {!globalLoading && globalEntries.length > 0 && (
                <View style={styles.heroCard}>
                  <Image source={currentUserRank === 1 ? LEO_TROPHY : LEO_SASSY} style={styles.heroLeo} resizeMode="contain" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroKicker}>{marketName.toUpperCase()}</Text>
                    <Text style={styles.heroValue}>
                      {currentUserRank ? <>#{currentUserRank}<Text style={styles.heroUnit}> of {globalEntries.length}</Text></> : 'Unranked'}
                    </Text>
                    <Text style={styles.heroLine}>
                      {currentUserRank === 1
                        ? <>Top of the market. <Text style={styles.heroAccent}>Hold it.</Text></>
                        : currentUserRank
                          ? <>Next spot costs <Text style={styles.heroAccent}>
                              {Math.max(1, (globalEntries[currentUserRank - 2]?.total_xp || 0) - (globalEntries[currentUserRank - 1]?.total_xp || 0) + 1)} XP
                            </Text>.</>
                          : 'One lesson puts you on the board.'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Podium */}
              {!globalLoading && globalEntries.length >= 3 && (
                <View style={styles.podium}>
                  {[1, 0, 2].map((i) => {
                    const e = globalEntries[i];
                    const m = MEDALS[i];
                    const h = i === 0 ? 76 : i === 1 ? 60 : 50;
                    return (
                      <View key={e.user_id} style={styles.podiumCol}>
                        <View style={[styles.podiumAvatar, { borderColor: m.ring }]}>
                          <Text style={styles.podiumInitial}>{e.username.charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.podiumName} numberOfLines={1}>{e.isCurrentUser ? 'You' : e.username}</Text>
                        <View style={[styles.podiumBlock, { height: h, backgroundColor: m.bg, borderColor: m.ring + '55' }]}>
                          <Text style={[styles.podiumRank, { color: m.text }]}>{i + 1}</Text>
                          <Text style={[styles.podiumXP, { color: m.text }]}>{e.total_xp.toLocaleString()}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {globalLoading ? (
                <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 60 }} />
              ) : globalEntries.length === 0 ? (
                <View style={styles.emptyState}>
                  <Image source={LEO_SASSY} style={styles.emptyLeo} resizeMode="contain" />
                  <Text style={styles.emptyTitle}>
                    {globalScope === 'week' ? 'Nobody scored this week.' : 'No rankings yet.'}
                  </Text>
                  <Text style={styles.emptySub}>Finish one lesson and you take first place.</Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {globalEntries.map((entry) => (
                    <BoardRow
                      key={entry.user_id}
                      rank={entry.rank}
                      name={entry.isCurrentUser ? 'You' : entry.username}
                      initial={entry.username.charAt(0).toUpperCase()}
                      xp={entry.total_xp}
                      meta={`Lv.${entry.current_level}${entry.current_streak > 0 ? ` · ${entry.current_streak}d streak` : ''}`}
                      isMe={entry.isCurrentUser}
                    />
                  ))}
                </View>
              )}
            </>
          )}

        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ── Board Row ───────────────────────────────────────
function BoardRow({
  rank, name, initial, xp, meta, isMe, online, onNudge, onMore,
}: {
  rank: number; name: string; initial: string; xp: number; meta: string;
  isMe?: boolean; online?: boolean;
  onNudge?: () => void; onMore?: () => void;
}) {
  const medal = rank <= 3 ? MEDALS[rank - 1] : null;
  return (
    <View style={[styles.row, isMe && styles.rowSelf, medal && { borderColor: medal.ring + '45' }]}>
      <View style={[styles.rankBadge, { backgroundColor: medal ? medal.bg : COLORS.bg1 }]}>
        <Text style={[styles.rankNum, { color: medal ? medal.text : COLORS.textMuted }]}>{rank}</Text>
      </View>

      <View style={[styles.avatar, isMe && { borderColor: COLORS.accent }]}>
        <Text style={styles.avatarText}>{initial}</Text>
        {online && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, isMe && { color: COLORS.accent }]} numberOfLines={1}>{name}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>{meta}</Text>
      </View>

      <View style={styles.xpBadge}>
        <Text style={[styles.xpValue, isMe && { color: COLORS.accent }]}>{xp.toLocaleString()}</Text>
        <Text style={styles.xpLabel}>XP</Text>
      </View>
      {onNudge && (
        <TouchableOpacity style={styles.nudgeBtn} onPress={onNudge}>
          <Feather name="send" size={14} color={COLORS.accent} />
        </TouchableOpacity>
      )}
      {onMore && (
        <TouchableOpacity style={styles.moreBtn} onPress={onMore} onLongPress={onMore}>
          <Feather name="more-horizontal" size={14} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...TYPE.hero, fontSize: 22, color: COLORS.textPrimary },
  headerSub: { fontSize: 11, fontWeight: '700', color: COLORS.accent, letterSpacing: 0.4, marginTop: 1 },
  requestsBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: COLORS.error, borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeDotText: { fontSize: 9, fontWeight: '700', color: '#FFF' },
  shareBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center',
  },

  // Tabs
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 14 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 14, backgroundColor: COLORS.bg1,
  },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  tabTextActive: { color: '#FFF' },

  scrollContent: { paddingHorizontal: 16 },

  // Hero card
  heroCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.accentSoft, borderRadius: 22, padding: 14,
    borderWidth: 1.5, borderColor: COLORS.accentMedium, marginBottom: 14,
  },
  heroLeo: { width: 66, height: 66 },
  heroKicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: COLORS.accent },
  heroValue: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  heroUnit: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  heroLine: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3, lineHeight: 17 },
  heroAccent: { color: COLORS.accent, fontWeight: '800' },

  // Podium
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 14 },
  podiumCol: { flex: 1, alignItems: 'center' },
  podiumAvatar: {
    width: 42, height: 42, borderRadius: 21, borderWidth: 2.5,
    backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center',
  },
  podiumInitial: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  podiumName: { fontSize: 11, fontWeight: '700', color: COLORS.textPrimary, marginTop: 4, marginBottom: 4, maxWidth: '95%' },
  podiumBlock: {
    width: '100%', borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', gap: 1,
  },
  podiumRank: { fontSize: 18, fontWeight: '800' },
  podiumXP: { fontSize: 11, fontWeight: '700' },

  // Add friend
  addFriendToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 16,
    backgroundColor: COLORS.bg1, borderWidth: 1.5, borderColor: COLORS.border,
    borderStyle: 'dashed', marginBottom: 12,
  },
  addFriendToggleText: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  addInput: {
    flex: 1, height: 46, backgroundColor: COLORS.bg1, borderRadius: 14, paddingHorizontal: 14,
    fontSize: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 24 },
  emptyLeo: { width: 130, height: 130, marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 18 },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.accent, borderRadius: 16,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  inviteBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF' },

  // Rows
  list: { gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.bg2, borderRadius: 18, padding: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  rowSelf: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accentMedium },
  rankBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontSize: 13, fontWeight: '800' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.border,
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.bg2,
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  rowMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  xpBadge: { alignItems: 'flex-end' },
  xpValue: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  xpLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' },

  nudgeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.accentMedium, alignItems: 'center', justifyContent: 'center',
  },
  moreBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center',
  },

  scopeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  scopeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.bg1, borderWidth: 1.5, borderColor: COLORS.border,
  },
  scopeChipActive: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accentMedium },
  scopeText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  scopeTextActive: { color: COLORS.accent },
});
