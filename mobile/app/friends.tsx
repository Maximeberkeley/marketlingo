import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Animated, Share, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, TYPE, SHADOWS } from '../lib/constants';
import { useFriends, Friend } from '../hooks/useFriends';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../lib/haptics';
import { trackEvent } from '../lib/analytics';
import { Feather } from '@expo/vector-icons';
import { useLeagues } from '../hooks/useLeagues';
import { useFriendQuests, FRIEND_QUEST_TEMPLATES } from '../hooks/useFriendQuests';
import { FriendQuestCard } from '../components/social/FriendQuestCard';
import { tierMeta, formatTimeLeft } from '../lib/leagues';
import { LeagueBoard, LeagueRow } from '../components/social/LeagueBoard';


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

// ── Main Screen ─────────────────────────────────────
export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [marketId, setMarketId] = useState<string | null>(null);
  const { friends, pendingRequests, loading, sendRequest, acceptRequest, declineRequest, removeFriend } = useFriends(marketId || undefined);
  const [addUsername, setAddUsername] = useState('');
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'league' | 'global'>(
    params.tab === 'league' ? 'league' : params.tab === 'global' ? 'global' : 'friends'
  );
  const [showAddInput, setShowAddInput] = useState(false);
  const league = useLeagues(marketId);
  const questHub = useFriendQuests(marketId);


  // Global leaderboard
  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntry[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

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

  // Fetch global leaderboard
  useEffect(() => {
    if (!marketId || !user) return;
    if (activeTab !== 'global') return;
    fetchGlobalLeaderboard();
  }, [marketId, user, activeTab]);

  const fetchGlobalLeaderboard = async () => {
    if (!marketId || !user) return;
    setGlobalLoading(true);
    try {
      const { data: xpData } = await supabase
        .from('user_xp')
        .select('user_id, total_xp, current_level')
        .eq('market_id', marketId)
        .order('total_xp', { ascending: false })
        .limit(50);

      if (xpData?.length) {
        const userIds = xpData.map(x => x.user_id);
        const [{ data: profiles }, { data: progressData }] = await Promise.all([
          supabase.from('profiles').select('id, username').in('id', userIds),
          supabase.from('user_progress').select('user_id, current_streak').eq('market_id', marketId).in('user_id', userIds),
        ]);

        const entries: LeaderboardEntry[] = xpData.map((x, idx) => {
          const profile = profiles?.find(p => p.id === x.user_id);
          const prog = progressData?.find(p => p.user_id === x.user_id);
          return {
            rank: idx + 1,
            user_id: x.user_id,
            username: profile?.username?.split('@')[0] || `Player ${idx + 1}`,
            total_xp: x.total_xp,
            current_level: x.current_level,
            current_streak: prog?.current_streak || 0,
            isCurrentUser: x.user_id === user.id,
          };
        });
        setGlobalEntries(entries);
        const myRank = entries.find(e => e.isCurrentUser)?.rank || null;
        setCurrentUserRank(myRank);
      }
    } catch (e) { /* non-critical */ }
    setGlobalLoading(false);
  };

  const handleAddFriend = async () => {
    if (!addUsername.trim()) return;
    setAdding(true);
    triggerHaptic('light');
    const result = await sendRequest(addUsername.trim());
    setAdding(false);
    if (result.success) {
      trackEvent('friend_request_sent', { to: addUsername.trim() });
      Alert.alert('Request Sent!', `Friend request sent to "${addUsername}"`);
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
    Alert.alert('Nudge Sent!', `${friend.username} will get a notification!`);
  };

  const handleStartQuest = (friend: Friend) => {
    triggerHaptic('light');
    Alert.alert(
      `Co-op quest with ${friend.username}`,
      'Your progress and theirs add up toward one shared target. Finish it before Sunday and you both earn the bonus XP.',
      [
        { text: 'Cancel', style: 'cancel' },
        ...FRIEND_QUEST_TEMPLATES.map(t => ({
          text: `${t.title} — ${t.description}`,
          onPress: async () => {
            const res = await questHub.createQuest(friend.id, t);
            if (res.success) {
              triggerHaptic('success');
              trackEvent('friend_quest_created', { key: t.key });
              Alert.alert('Invite sent', `${friend.username} needs to accept before it starts.`);
            } else {
              Alert.alert('Could not start quest', res.error || 'Try again later.');
            }
          },
        })),
      ]
    );
  };

  const handleRemove = (friend: Friend) => {
    Alert.alert('Remove Friend?', `Remove ${friend.username}?`, [
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

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: '#FEF3C7', color: '#B45309', icon: 'award' as const };
    if (rank === 2) return { bg: '#F3F4F6', color: '#6B7280', icon: 'award' as const };
    if (rank === 3) return { bg: '#FED7AA', color: '#C2410C', icon: 'award' as const };
    return { bg: COLORS.bg2, color: COLORS.textMuted, icon: null };
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Social</Text>
        <View style={{ flex: 1 }} />
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
        {(['friends', 'league', 'global'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => { triggerHaptic('light'); setActiveTab(tab); }}
          >
            <Feather
              name={tab === 'friends' ? 'users' : tab === 'league' ? 'award' : 'globe'}
              size={14}
              color={activeTab === tab ? '#FFF' : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'friends' ? `Friends (${friends.length})` : tab === 'league' ? 'League' : 'Global'}
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
              {/* Add Friend Toggle */}
              <TouchableOpacity
                style={styles.addFriendToggle}
                onPress={() => setShowAddInput(!showAddInput)}
              >
                <Feather name="user-plus" size={16} color={COLORS.accent} />
                <Text style={styles.addFriendToggleText}>Add Friend</Text>
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
                  <View style={styles.emptyIconWrap}>
                    <Feather name="users" size={32} color={COLORS.textMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>No friends yet</Text>
                  <Text style={styles.emptySub}>Add friends to compete and track each other's progress</Text>
                  <TouchableOpacity style={styles.inviteBtn} onPress={handleShareInvite}>
                    <Feather name="share-2" size={14} color="#FFF" />
                    <Text style={styles.inviteBtnText}>Invite Friends</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.friendsList}>
                  {friends.map((friend, idx) => (
                    <FriendRow
                      key={friend.id}
                      friend={friend}
                      rank={idx + 1}
                      isActive={isActive(friend)}
                      onNudge={() => handleNudge(friend)}
                      onRemove={() => handleRemove(friend)}
                      onStartQuest={() => handleStartQuest(friend)}
                    />
                  ))}
                </View>
              )}

              {/* ── Co-op quests ── */}
              {friends.length > 0 && (
                <View style={styles.questSection}>
                  <Text style={styles.sectionTitle}>Co-op quests</Text>
                  <Text style={styles.sectionSub}>
                    Team up for the week. Both of you earn the bonus when the shared target is hit.
                  </Text>

                  {questHub.pending.map(q => (
                    <FriendQuestCard
                      key={q.id}
                      quest={q}
                      onRespond={async (accept) => {
                        await questHub.respond(q.id, accept);
                        if (accept) triggerHaptic('success');
                      }}
                    />
                  ))}
                  {questHub.active.map(q => <FriendQuestCard key={q.id} quest={q} />)}
                  {questHub.awaitingPartner.map(q => <FriendQuestCard key={q.id} quest={q} />)}
                  {questHub.completed.map(q => <FriendQuestCard key={q.id} quest={q} />)}

                  {!questHub.loading && questHub.quests.length === 0 && (
                    <View style={styles.questEmpty}>
                      <Feather name="target" size={16} color={COLORS.textMuted} />
                      <Text style={styles.questEmptyText}>
                        Tap the target icon on a friend to start this week's quest.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}

          {/* ── LEAGUE TAB ──────────────────────── */}
          {activeTab === 'league' && (
            <LeagueTab league={league} />
          )}


          {/* ── GLOBAL TAB ──────────────────────── */}
          {activeTab === 'global' && (
            <>
              {/* User rank banner */}
              {currentUserRank && (
                <View style={styles.rankBanner}>
                  <Feather name="award" size={18} color="#B45309" />
                  <Text style={styles.rankBannerText}>
                    You're ranked <Text style={styles.rankBannerBold}>#{currentUserRank}</Text> in your industry
                  </Text>
                </View>
              )}

              {globalLoading ? (
                <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 60 }} />
              ) : globalEntries.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Feather name="globe" size={32} color={COLORS.textMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>No players yet</Text>
                  <Text style={styles.emptySub}>Complete lessons to appear on the leaderboard</Text>
                </View>
              ) : (
                <View style={styles.friendsList}>
                  {globalEntries.map(entry => {
                    const rankStyle = getRankStyle(entry.rank);
                    return (
                      <View
                        key={entry.user_id}
                        style={[
                          styles.leaderRow,
                          entry.isCurrentUser && styles.leaderRowSelf,
                          entry.rank <= 3 && { borderColor: rankStyle.color + '30' },
                        ]}
                      >
                        {/* Rank */}
                        <View style={[styles.rankBadge, { backgroundColor: rankStyle.bg }]}>
                          {entry.rank <= 3 ? (
                            <Feather name="award" size={14} color={rankStyle.color} />
                          ) : (
                            <Text style={[styles.rankNum, { color: rankStyle.color }]}>{entry.rank}</Text>
                          )}
                        </View>

                        {/* Avatar */}
                        <View style={[styles.avatar, entry.isCurrentUser && { borderColor: COLORS.accent }]}>
                          <Text style={styles.avatarText}>
                            {entry.username.charAt(0).toUpperCase()}
                          </Text>
                        </View>

                        {/* Info */}
                        <View style={styles.entryInfo}>
                          <Text style={[styles.entryName, entry.isCurrentUser && { color: COLORS.accent, fontWeight: '700' }]}>
                            {entry.isCurrentUser ? 'You' : entry.username}
                          </Text>
                          <Text style={styles.entryMeta}>
                            Lv.{entry.current_level}
                            {entry.current_streak > 0 ? ` · ${entry.current_streak}d streak` : ''}
                          </Text>
                        </View>

                        {/* XP */}
                        <View style={styles.xpBadge}>
                          <Text style={styles.xpValue}>{entry.total_xp.toLocaleString()}</Text>
                          <Text style={styles.xpLabel}>XP</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}

        </Animated.View>
      </ScrollView>

      {/* Sticky self row — always visible while the standings scroll underneath */}
      {activeTab === 'league' && !league.loading && (() => {
        const me = league.standings.find(x => x.isCurrentUser);
        if (!me) return null;
        return (
          <View style={[styles.stickySelf, { bottom: insets.bottom + 12 }]} pointerEvents="none">
            <LeagueRow item={me} pinned />
          </View>
        );
      })()}
    </View>
  );
}

// ── League Tab ──────────────────────────────────────
function LeagueTab({ league }: { league: ReturnType<typeof useLeagues> }) {
  const meta = tierMeta(league.tier);

  if (league.loading) {
    return <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 60 }} />;
  }

  return (
    <>
      <View style={[styles.leagueHero, { backgroundColor: meta.soft }]}>
        <Feather name="award" size={26} color={meta.color} />
        <Text style={[styles.leagueTitle, { color: meta.color }]}>{meta.name}</Text>
        <Text style={styles.leagueBlurb}>{meta.blurb}</Text>
        <Text style={styles.leagueTimer}>{formatTimeLeft(league.msLeft)}</Text>
      </View>

      {league.lastResult && (
        <View style={styles.resultBanner}>
          <Feather
            name={league.lastResult.result === 'promoted' ? 'trending-up' : league.lastResult.result === 'demoted' ? 'trending-down' : 'minus'}
            size={15}
            color={COLORS.accent}
          />
          <Text style={styles.resultText}>
            Last week you finished{league.lastResult.rank ? ` #${league.lastResult.rank}` : ''} and{' '}
            {league.lastResult.result === 'promoted'
              ? 'moved up a league'
              : league.lastResult.result === 'demoted'
              ? 'dropped a league'
              : 'held your league'}.
          </Text>
        </View>
      )}

      <Text style={styles.zoneNote}>
        Top {league.promoteCutoff || 1} move up
        {league.demoteCutoff > 0 ? ` · bottom ${league.demoteCutoff} move down` : ''}
      </Text>

      {league.standings.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Feather name="bar-chart-2" size={32} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No standings yet</Text>
          <Text style={styles.emptySub}>Earn XP this week to take your place in the league</Text>
        </View>
      ) : (
        <View style={styles.friendsList}>
          {league.standings.map((s, i) => {
            const prevZone = i > 0 ? league.standings[i - 1].zone : null;
            return (
              <React.Fragment key={s.userId}>
                {prevZone && prevZone !== s.zone && (
                  <View style={styles.zoneDivider}>
                    <View style={styles.zoneLine} />
                    <Text style={styles.zoneLabel}>
                      {s.zone === 'demotion' ? 'Relegation zone' : 'Safe zone'}
                    </Text>
                    <View style={styles.zoneLine} />
                  </View>
                )}
                <View style={[styles.leaderRow, s.isCurrentUser && styles.leaderRowSelf]}>
                  <View
                    style={[
                      styles.rankBadge,
                      { backgroundColor: s.zone === 'promotion' ? '#DCFCE7' : s.zone === 'demotion' ? '#FEE2E2' : COLORS.bg2 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankNum,
                        { color: s.zone === 'promotion' ? '#15803D' : s.zone === 'demotion' ? '#B91C1C' : COLORS.textMuted },
                      ]}
                    >
                      {s.rank}
                    </Text>
                  </View>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{s.username.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.entryInfo}>
                    <Text style={[styles.entryName, s.isCurrentUser && { color: COLORS.accent, fontWeight: '700' }]}>
                      {s.isCurrentUser ? 'You' : s.username}
                    </Text>
                    <Text style={styles.entryMeta}>
                      {s.zone === 'promotion' ? 'Promotion zone' : s.zone === 'demotion' ? 'At risk' : 'Holding'}
                    </Text>
                  </View>
                  <View style={styles.xpBadge}>
                    <Text style={styles.xpValue}>{s.weeklyXP.toLocaleString()}</Text>
                    <Text style={styles.xpLabel}>XP</Text>
                  </View>
                </View>
              </React.Fragment>
            );
          })}
        </View>
      )}
    </>
  );
}

// ── Friend Row Component ────────────────────────────
function FriendRow({
  friend, rank, isActive, onNudge, onRemove, onStartQuest,
}: {
  friend: Friend; rank: number; isActive: boolean;
  onNudge: () => void; onRemove: () => void; onStartQuest?: () => void;
}) {
  return (
    <View style={styles.friendRow}>
      {/* Rank */}
      <Text style={styles.friendRank}>#{rank}</Text>

      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{friend.username.charAt(0).toUpperCase()}</Text>
        {isActive && <View style={styles.onlineDot} />}
      </View>

      {/* Info */}
      <View style={styles.entryInfo}>
        <Text style={styles.entryName}>{friend.username}</Text>
        <Text style={styles.entryMeta}>
          {friend.totalXP.toLocaleString()} XP · Lv.{friend.currentLevel}
          {friend.currentStreak > 0 ? ` · ${friend.currentStreak}d` : ''}
        </Text>
      </View>

      {/* Actions */}
      {onStartQuest && (
        <TouchableOpacity style={styles.questBtn} onPress={onStartQuest} accessibilityLabel="Start co-op quest">
          <Feather name="target" size={14} color={COLORS.accent} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.nudgeBtn} onPress={onNudge}>
        <Feather name="send" size={14} color={COLORS.accent} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.moreBtn} onPress={onRemove}>
        <Feather name="more-horizontal" size={14} color={COLORS.textMuted} />
      </TouchableOpacity>
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
    backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...TYPE.hero, fontSize: 22, color: COLORS.textPrimary },
  requestsBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeDotText: { fontSize: 9, fontWeight: '700', color: '#FFF' },
  shareBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center',
  },

  // Tabs
  tabRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, marginBottom: 16,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 14,
    backgroundColor: COLORS.bg2,
  },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: '#FFF' },

  scrollContent: { paddingHorizontal: 16 },

  // Add friend
  addFriendToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 14,
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border,
    borderStyle: 'dashed', marginBottom: 12,
  },
  addFriendToggleText: { fontSize: 13, fontWeight: '600', color: COLORS.accent },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  addInput: {
    flex: 1, height: 44, backgroundColor: COLORS.bg2, borderRadius: 12, paddingHorizontal: 14,
    fontSize: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { ...TYPE.bodyBold, color: COLORS.textPrimary, marginBottom: 6 },
  emptySub: { ...TYPE.caption, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40, marginBottom: 20 },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.accent, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  inviteBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Friend row
  friendsList: { gap: 6 },
  friendRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  friendRank: { ...TYPE.caption, color: COLORS.textMuted, fontWeight: '700', width: 24, textAlign: 'center' },

  // Leaderboard row
  leaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  leaderRowSelf: {
    backgroundColor: COLORS.accent + '08',
    borderColor: COLORS.accent + '30',
  },
  rankBadge: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  rankNum: { fontSize: 12, fontWeight: '700' },

  // Shared
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.border,
  },
  avatarText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: COLORS.bg2,
  },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  entryMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  xpBadge: { alignItems: 'flex-end' },
  xpValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  xpLabel: { fontSize: 9, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase' },

  nudgeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.accent + '12', alignItems: 'center', justifyContent: 'center',
  },
  moreBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center',
  },

  // Rank banner
  rankBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14,
    marginBottom: 16,
  },
  rankBannerText: { fontSize: 13, color: '#92400E', flex: 1 },
  rankBannerBold: { fontWeight: '800', color: '#B45309' },

  // League
  leagueHero: { borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 14, gap: 4 },
  leagueTitle: { fontSize: 20, fontWeight: '800' },
  leagueBlurb: { fontSize: 12, color: COLORS.textSecondary },
  leagueTimer: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: 4 },
  resultBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.accentSoft, borderRadius: 14, padding: 12, marginBottom: 12,
  },
  resultText: { flex: 1, fontSize: 12, color: COLORS.textPrimary },
  zoneNote: { fontSize: 11, color: COLORS.textMuted, marginBottom: 10, textAlign: 'center' },
  zoneDivider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  zoneLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  zoneLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase' },

  // Co-op quests
  questSection: { marginTop: 24, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  sectionSub: { fontSize: 12, color: COLORS.textMuted, marginTop: -6 },
  questEmpty: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed',
  },
  questEmptyText: { flex: 1, fontSize: 12, color: COLORS.textMuted },
  questBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.accent + '12', alignItems: 'center', justifyContent: 'center',
  },

});
