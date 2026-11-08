import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Animated, Share, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { inviteShareContent, redeemFriendCode } from '../lib/invites';
import { COLORS, TYPE, SHADOWS } from '../lib/constants';
import { getMarketName } from '../lib/markets';
import { useFriends, Friend, FriendSearchResult } from '../hooks/useFriends';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../lib/haptics';
import { trackEvent } from '../lib/analytics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { getMonthlyStandings, myFriendRaceXP, standingName } from '../lib/socialStandings';
import { log } from '../lib/logger';
import { useFriendSocial, SocialReward } from '../hooks/useFriendSocial';
import { FriendStreaksCard } from '../components/social/FriendStreaksCard';
import { StreakSheet } from '../components/social/StreakSheet';
import { RaceCard } from '../components/social/RaceCard';
import { FriendPicker, PickerFriend } from '../components/social/FriendPicker';
import { RewardCelebration } from '../components/social/RewardCelebration';
import { firstName, raceIsOver } from '../lib/friendSocial';
import { FriendSheet, FriendSheetInfo } from '../components/social/FriendSheet';
import { NudgeSheet, NudgeTarget } from '../components/social/NudgeSheet';
import { FindFriendsSheet } from '../components/social/FindFriendsSheet';
import { MyCodeSheet, CodeSheetTab } from '../components/social/MyCodeSheet';
import { AddFriendsCard } from '../components/social/AddFriendsCard';
import { ChunkyButton } from '../components/social/ChunkyButton';
import { SocialAvatar } from '../components/social/SocialAvatar';
import { StreakFlame } from '../components/ui/StreakFlame';
import { NudgeId, NudgeResult, nudgeOptions } from '../lib/nudges';
import { CrownCard } from '../components/social/CrownCard';
import { CrownBadge } from '../components/social/CrownBadge';
import { crownStatus } from '../lib/crown';

// Sheets are native modals; let one finish closing before the next opens.
const SHEET_HANDOFF_MS = 380;

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

/** Whole days until the monthly race resets on the 1st. */
export function daysLeftInMonth(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 86400000));
}

// ── Main Screen ─────────────────────────────────────
export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [marketId, setMarketId] = useState<string | null>(null);
  const {
    friends, pendingRequests, sentRequests, myFriendCode, loading, error: friendsError,
    searchPeople, sendRequest, cancelRequest, acceptRequest, declineRequest, removeFriend, refetch,
  } = useFriends(marketId || undefined);
  const [busyId, setBusyId] = useState<string | null>(null);
  const params = useLocalSearchParams<{ toast?: string }>();
  const [activeTab, setActiveTab] = useState<'friends' | 'global'>('friends');

  // Global leaderboard
  const [globalEntries, setGlobalEntries] = useState<LeaderboardEntry[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [myStats, setMyStats] = useState<{ xp: number; level: number; streak: number; monthXP: number }>({ xp: 0, level: 1, streak: 0, monthXP: 0 });
  const [nudgedIds, setNudgedIds] = useState<Set<string>>(new Set());
  const [friendSheetId, setFriendSheetId] = useState<string | null>(null);
  const [nudgeTarget, setNudgeTarget] = useState<NudgeTarget | null>(null);
  const [findOpen, setFindOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeTab, setCodeTab] = useState<CodeSheetTab>('code');
  // Friend streaks and races (shown once the server functions exist).
  const social = useFriendSocial(user?.id);
  const [openStreakId, setOpenStreakId] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<'streak' | 'race' | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [reward, setReward] = useState<SocialReward | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.spring(fadeAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }).start();
    }
  }, [loading]);

  // Fetch market and whether I have a display name friends can find
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('selected_market, display_name').eq('id', user.id).single().then(({ data }) => {
      setMarketId(data?.selected_market || 'aerospace');
      setNeedsName(!data?.display_name?.trim());
      setMyName(data?.display_name?.trim() || '');
    });
  }, [user]);

  const [needsName, setNeedsName] = useState(false);
  // Your own display name: your avatar shows its initial instead of "Y" for "You".
  const [myName, setMyName] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const nameValid = nameDraft.trim().length >= 1;
  const saveName = useCallback(async () => {
    if (!user || !nameValid || savingName) return;
    setSavingName(true);
    const clean = nameDraft.trim().replace(/\s+/g, ' ').slice(0, 40);
    const { error } = await supabase.from('profiles').update({ display_name: clean }).eq('id', user.id);
    setSavingName(false);
    if (error) {
      log.warn('Could not save display name', error.message);
      return;
    }
    triggerHaptic('success');
    setNeedsName(false);
    setMyName(clean);
  }, [user, nameDraft, nameValid, savingName]);

  // The friend race counts XP earned this month in every industry, for you and for
  // friends alike (get_friends_overview's month_xp), because friends often study
  // different industries. Level and streak still come from this industry's board.
  useEffect(() => {
    if (!marketId || !user) return;
    (async () => {
      const [standings, raceXP] = await Promise.all([getMonthlyStandings(marketId), myFriendRaceXP(user.id)]);
      const mine = standings.find(row => row.user_id === user.id);
      setMyStats({
        xp: raceXP,
        level: mine?.current_level || 1,
        streak: mine?.current_streak || 0,
        monthXP: raceXP,
      });
    })().catch(error => log.warn('Could not load my monthly social stats', error));
  }, [marketId, user]);

  // Fetch global leaderboard
  useEffect(() => {
    if (!marketId || !user) return;
    if (activeTab !== 'global') return;
    fetchGlobalLeaderboard();
  }, [marketId, user, activeTab]);

  const fetchGlobalLeaderboard = useCallback(async () => {
    if (!marketId || !user) return;
    setGlobalLoading(true);
    setGlobalError(null);
    try {
      const standings = (await getMonthlyStandings(marketId)).filter(row => row.monthly_xp > 0).slice(0, 50);
      if (!standings.length) {
        setGlobalEntries([]);
        setGlobalLoading(false);
        return;
      }
      const entries: LeaderboardEntry[] = standings.map((row, idx) => ({
          rank: idx + 1,
          user_id: row.user_id,
          username: standingName(row),
          total_xp: row.monthly_xp,
          current_level: row.current_level,
          current_streak: row.current_streak,
          isCurrentUser: row.user_id === user.id,
      }));

      setGlobalEntries(entries);
    } catch (error) {
      log.warn('Global standings failed', error);
      setGlobalEntries([]);
      setGlobalError('Standings could not load. Check your connection and try again.');
    }
    setGlobalLoading(false);
  }, [marketId, user]);

  useFocusEffect(useCallback(() => {
    if (!marketId || !user) return;
    void refetch();
    void social.refresh();
    if (activeTab === 'global') void fetchGlobalLeaderboard();
  }, [activeTab, fetchGlobalLeaderboard, marketId, refetch, user, social.refresh]));

  const currentUserRank = globalEntries.find((e) => e.isCurrentUser)?.rank ?? null;
  const marketName = marketId ? getMarketName(marketId) : '';

  const initial = (user?.email || 'Y').charAt(0).toUpperCase();

  // Friends board = me + friends, ranked on real XP
  const friendsBoard = useMemo(() => {
    const rows = [
      {
        id: 'me', isMe: true, name: 'You', initial,
        xp: myStats.monthXP, monthXP: myStats.monthXP, level: myStats.level, streak: myStats.streak,
        friend: null as Friend | null,
      },
      ...friends.map((f) => ({
        id: f.id, isMe: false, name: f.username, initial: f.username.charAt(0).toUpperCase(),
        xp: f.totalXP, monthXP: f.totalXP, level: f.currentLevel, streak: f.currentStreak,
        friend: f,
      })),
    ];
    return rows.sort((a, b) => b.xp - a.xp);
  }, [friends, myStats, initial]);

  const myFriendRank = friendsBoard.findIndex((r) => r.isMe) + 1;

  const showToast = useCallback((text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // Toast handed over by the invite link route.
  useEffect(() => {
    if (typeof params.toast === 'string' && params.toast) showToast(params.toast);
  }, [params.toast, showToast]);

  const redeemCode = async (raw: string): Promise<{ ok: boolean; message: string }> => {
    triggerHaptic('light');
    const result = await redeemFriendCode(raw);
    if (result.ok) { triggerHaptic('success'); void refetch(); }
    return result;
  };

  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);

  const handleAdd = async (person: FriendSearchResult) => {
    if (busyId) return;
    const sent = sentRequests.find((r) => r.toUserId === person.id);
    triggerHaptic('light');
    setBusyId(person.id);
    if (sent) {
      const result = await cancelRequest(sent.id);
      if (!result.success) showToast(result.error || 'Could not cancel. Please try again.');
    } else {
      const incoming = pendingRequests.find((r) => r.fromUserId === person.id);
      const result = incoming ? await acceptRequest(incoming.id) : await sendRequest(person);
      if (result.success) trackEvent(incoming ? 'friend_request_accepted' : 'friend_request_sent', {});
      else showToast(result.error || 'Something went wrong. Please try again.');
    }
    setBusyId(null);
  };

  const handleAccept = async (id: string) => {
    if (busyId) return;
    triggerHaptic('success');
    setBusyId(id);
    const result = await acceptRequest(id);
    setBusyId(null);
    if (result.success) trackEvent('friend_request_accepted', {});
    else showToast(result.error || 'Could not accept. Please try again.');
  };

  const handleDecline = async (id: string) => {
    if (busyId) return;
    triggerHaptic('light');
    setBusyId(id);
    const result = await declineRequest(id);
    setBusyId(null);
    if (!result.success) showToast('Could not decline. Please try again.');
  };

  const handleCancelSent = async (id: string) => {
    if (busyId) return;
    triggerHaptic('light');
    setBusyId(id);
    const result = await cancelRequest(id);
    setBusyId(null);
    if (!result.success) showToast(result.error || 'Could not cancel. Please try again.');
  };

  /** Sends the picked message; the sheet shows the outcome. */
  const sendNudge = async (friendId: string, message: NudgeId): Promise<NudgeResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-nudge', { body: { friendId, message } });
      if (error) throw error;
      setNudgedIds((prev) => new Set(prev).add(friendId));
      if (data?.status === 'already') return 'already';
      trackEvent('nudge_sent', { to: friendId, status: data?.status, message });
      return data?.status === 'sent' ? 'sent' : 'saved';
    } catch (error) {
      log.warn('Friend nudge failed', error);
      return (error as { name?: string })?.name === 'FunctionsFetchError' ? 'offline' : 'error';
    }
  };

  // ── Friend streaks and races ──
  const streaks = social.social?.streaks ?? [];
  const races = social.social?.races ?? [];
  const openStreak = streaks.find(s => s.id === openStreakId) ?? null;
  const isNudged = (friendId: string, nudgedToday = false) => nudgedToday || nudgedIds.has(friendId) || !!friends.find(f => f.id === friendId)?.nudgedToday;
  const nudgeStateFor = (friendId: string, nudgedToday: boolean): 'idle' | 'sending' | 'nudged' => isNudged(friendId, nudgedToday) ? 'nudged' : 'idle';
  /** Why a race or friend streak with this friend can't start now, if so. */
  const takenFor = (friendId: string, mode: 'streak' | 'race'): string | undefined => {
    if (mode === 'streak') {
      const streak = streaks.find(s => s.friend_id === friendId);
      return streak ? (streak.status === 'pending' ? (streak.invited_by_me ? 'Invited' : 'Invited you') : 'Streak on') : undefined;
    }
    const race = races.find(r => r.friend_id === friendId && (r.status === 'pending' || (r.status === 'active' && !raceIsOver(r))));
    return race ? (race.status === 'pending' ? (race.challenged_by_me ? 'Challenged' : 'Challenged you') : 'Racing') : undefined;
  };
  const nudgeTargetFor = (friendId: string): NudgeTarget | null => {
    const f = friends.find(x => x.id === friendId);
    if (!f) return null;
    const name = f.username.trim().split(/\s+/)[0] || 'your friend';
    const streak = streaks.find(x => x.friend_id === friendId && x.status === 'active');
    const race = races.find(r => r.friend_id === friendId && r.status === 'active' && !raceIsOver(r));
    const lead = race ? race.my_xp - race.friend_xp : null;
    const context = lead !== null
      ? (lead > 0 ? `You lead your race by ${lead} XP.` : lead < 0 ? `${name} leads your race by ${-lead} XP.` : 'Your race is tied.')
      : streak ? `Your ${streak.length}-day friend streak needs you both today.`
      : f.lessonDoneToday ? `${name} already studied today. Say hi anyway.` : `${name} hasn't done today's lesson yet.`;
    return { friendId, name, context, options: nudgeOptions({ streakLength: streak ? streak.length : null, meDoneToday: streak?.me_done_today, raceLead: lead }) };
  };
  /** Opens the nudge sheet, closing any sheet that is open first. */
  const openNudge = (friendId: string) => {
    const target = nudgeTargetFor(friendId);
    if (!target) return;
    triggerHaptic('light');
    const handoff = friendSheetId !== null || openStreakId !== null;
    setFriendSheetId(null);
    setOpenStreakId(null);
    if (handoff) setTimeout(() => setNudgeTarget(target), SHEET_HANDOFF_MS);
    else setNudgeTarget(target);
  };
  const pickerFriends: PickerFriend[] = friends.map(f => ({
    id: f.id,
    name: f.username,
    meta: [f.currentStreak > 0 ? `${f.currentStreak}-day streak` : null, f.selectedMarket ? getMarketName(f.selectedMarket) : null].filter(Boolean).join(' · ') || `Lv.${f.currentLevel}`,
    taken: pickerMode ? takenFor(f.id, pickerMode) : undefined,
  }));
  const openPicker = (mode: 'streak' | 'race') => { triggerHaptic('light'); setPickerError(null); setPickerMode(mode); };
  const startWith = async (friendId: string, mode: 'streak' | 'race'): Promise<string | null> => {
    const name = friends.find(f => f.id === friendId)?.username ?? 'your friend';
    const result = mode === 'streak' ? await social.startStreak(friendId) : await social.challengeRace(friendId);
    if (result.error) return result.error;
    triggerHaptic('success');
    showToast(mode === 'streak' ? `Streak invite sent to ${name}` : `Challenge sent to ${name}`);
    return null;
  };
  const pickFriend = async (friendId: string) => {
    const error = await startWith(friendId, pickerMode ?? 'race');
    if (error) { setPickerError(error); return; }
    setPickerMode(null);
  };
  const claimStreakReward = async () => {
    if (!openStreak) return;
    const won = await social.claimStreak(openStreak.id, firstName(openStreak));
    if (won) { setOpenStreakId(null); setReward(won); }
  };
  const claimRaceReward = async (raceId: string, name: string) => {
    const won = await social.claimRace(raceId, name);
    if (won && won.xp > 0) setReward(won);
    else if (won) showToast(`${name} took this one. Rematch?`);
  };

  const handleRemove = async (friend: Friend) => {
    setFriendSheetId(null);
    const result = await removeFriend(friend.friendshipId);
    showToast(result.success ? `${friend.username} removed` : 'Could not remove friend. Please try again.');
  };

  const handleShareInvite = async () => {
    triggerHaptic('light');
    try {
      await Share.share(myFriendCode
        ? inviteShareContent(marketName, myFriendCode, Platform.OS)
        : { message: `I'm learning ${marketName || 'industries'} on MarketLingo, 5 minutes a day. Join me: https://market-verse.com` });
    } catch (e) { /* cancelled */ }
  };

  const isActive = (friend: Friend) => {
    if (!friend.lastActivityAt) return false;
    return (Date.now() - new Date(friend.lastActivityAt).getTime()) / (1000 * 60 * 60) < 24;
  };

  const friendRow = friends.find(f => f.id === friendSheetId) ?? null;
  const sheetFriend: FriendSheetInfo | null = friendRow ? {
    id: friendRow.id,
    name: friendRow.username,
    industry: friendRow.selectedMarket ? getMarketName(friendRow.selectedMarket) : null,
    level: friendRow.currentLevel,
    streak: friendRow.currentStreak,
    monthXP: friendRow.totalXP,
    rank: friendsBoard.findIndex(r => r.id === friendRow.id) + 1,
    doneToday: friendRow.lessonDoneToday,
    online: isActive(friendRow),
    raceAction: sheetAction(friendRow.id, 'race'),
    streakAction: sheetAction(friendRow.id, 'streak'),
    nudged: isNudged(friendRow.id),
  } : null;
  /** Button for the friend sheet: start one, accept theirs, or show why not. */
  function sheetAction(friendId: string, mode: 'streak' | 'race'): { label: string; enabled: boolean } {
    const taken = takenFor(friendId, mode);
    if (!taken) return { label: mode === 'race' ? 'Race' : 'Streak', enabled: true };
    if (taken === 'Challenged you') return { label: 'Accept race', enabled: true };
    if (taken === 'Invited you') return { label: 'Accept streak', enabled: true };
    return { label: taken, enabled: false };
  }
  /** Race or streak from the friend sheet: accepts their invite if they sent one, otherwise starts one. */
  const sheetStart = async (friendId: string, mode: 'streak' | 'race') => {
    const incomingRace = races.find(r => r.friend_id === friendId && r.status === 'pending' && !r.challenged_by_me);
    const incomingStreak = streaks.find(x => x.friend_id === friendId && x.status === 'pending' && !x.invited_by_me);
    if (mode === 'race' && incomingRace) {
      const r = await social.respondRace(incomingRace.id, true);
      showToast(r.error || 'Race on! 7 days. Go.');
      if (!r.error) setFriendSheetId(null);
      return;
    }
    if (mode === 'streak' && incomingStreak) {
      const r = await social.respondStreak(incomingStreak.id, true);
      showToast(r.error || `Streak on with ${firstName(incomingStreak)}. Study today to light it.`);
      if (!r.error) setFriendSheetId(null);
      return;
    }
    const error = await startWith(friendId, mode);
    if (error) showToast(error);
    else setFriendSheetId(null);
  };
  const showSocial = social.available && (friends.length > 0 || streaks.length > 0 || races.length > 0);
  const crown = !loading && !friendsError && friends.length > 0 ? crownStatus(friendsBoard) : null;
  const closeThen = (close: () => void, next: () => void) => { close(); setTimeout(next, SHEET_HANDOFF_MS); };
  const openCodeSheet = (tab: CodeSheetTab) => { triggerHaptic('light'); setCodeTab(tab); setCodeOpen(true); };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} accessibilityLabel="Back">
          <Feather name="arrow-left" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Standings</Text>
          {!!marketName && <Text style={styles.headerSub}>{marketName}</Text>}
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => { triggerHaptic('light'); setFindOpen(true); }} accessibilityLabel="Find friends">
          <Feather name="user-plus" size={17} color={COLORS.accent} />
          {pendingRequests.length > 0 && <View style={styles.badgeDot}><Text style={styles.badgeDotText}>{pendingRequests.length}</Text></View>}
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        {(['friends', 'global'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => { triggerHaptic('light'); setActiveTab(tab); }}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
          >
            <Feather name={tab === 'friends' ? 'users' : 'globe'} size={14} color={activeTab === tab ? COLORS.accent : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'friends' ? 'Friends' : 'Global'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>

          {needsName && (
            <View style={styles.nameCard}>
              <Text style={styles.nameCardTitle}>Add your name so friends can find you</Text>
              <View style={styles.nameRow}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Your name"
                  placeholderTextColor={COLORS.textMuted}
                  value={nameDraft}
                  onChangeText={(v) => setNameDraft(v.slice(0, 40))}
                  maxLength={40}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                />
                <TouchableOpacity
                  style={[styles.nameSave, (!nameValid || savingName) && { opacity: 0.5 }]}
                  onPress={saveName}
                  disabled={!nameValid || savingName}
                  accessibilityLabel="Save name"
                >
                  {savingName ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.nameSaveText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── FRIENDS TAB ─────────────────────── */}
          {activeTab === 'friends' && (
            <>
              {/* Incoming requests first: they need an answer */}
              {pendingRequests.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardKicker}>{pendingRequests.length === 1 ? 'Friend request' : `${pendingRequests.length} friend requests`}</Text>
                  {pendingRequests.map((r) => (
                    <View key={r.id} style={styles.requestRow}>
                      <SocialAvatar name={r.fromUsername} size={44} ring={COLORS.accent} />
                      <View style={styles.rowInfo}>
                        <Text style={styles.rowName} numberOfLines={1}>{r.fromUsername}</Text>
                        <Text style={styles.rowMeta} numberOfLines={1}>{r.fromMarket ? `${getMarketName(r.fromMarket)} · wants to be friends` : 'Wants to be friends'}</Text>
                      </View>
                      {busyId === r.id ? <ActivityIndicator size="small" color={COLORS.accent} /> : (
                        <>
                          <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(r.id)} accessibilityLabel={`Decline ${r.fromUsername}`}>
                            <Feather name="x" size={18} color={COLORS.textMuted} />
                          </TouchableOpacity>
                          <ChunkyButton label="Accept" onPress={() => { void handleAccept(r.id); }} height={40} style={{ minWidth: 92 }} accessibilityLabel={`Accept ${r.fromUsername}`} />
                        </>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {crown && <CrownCard crown={crown} onAction={() => { triggerHaptic('light'); router.push('/(tabs)/home' as any); }} />}

              {!loading && !friendsError && friends.length === 0 && (
                <AddFriendsCard hasFriends={false} onShare={handleShareInvite} onSearch={() => setFindOpen(true)} onMyCode={() => openCodeSheet('code')} onScan={() => openCodeSheet('scan')} />
              )}

              {showSocial && (
                <>
                  <FriendStreaksCard streaks={streaks} onOpen={s => { triggerHaptic('light'); setOpenStreakId(s.id); }} onInvite={() => openPicker('streak')} />
                  <View style={styles.section}>
                    <View style={styles.sectionHead}>
                      <Text style={styles.sectionTitle}>Races</Text>
                      {races.length > 0 && (
                        <TouchableOpacity onPress={() => openPicker('race')} style={styles.sectionAction} accessibilityRole="button">
                          <Feather name="flag" size={13} color={COLORS.accent} />
                          <Text style={styles.sectionActionText}>Challenge</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {races.length === 0 ? (
                      <TouchableOpacity style={styles.raceEmpty} onPress={() => openPicker('race')} activeOpacity={0.88} accessibilityRole="button">
                        <View style={styles.raceEmptyDisc}><Feather name="flag" size={20} color="#FFFFFF" /></View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.raceEmptyTitle}>Race a friend this week</Text>
                          <Text style={styles.raceEmptySub}>Most XP in 7 days wins +100 XP.</Text>
                        </View>
                        <Feather name="chevron-right" size={18} color={COLORS.accent} />
                      </TouchableOpacity>
                    ) : races.map(race => (
                      <RaceCard
                        key={race.id}
                        race={race}
                        busy={social.busy === `race:${race.id}` || social.busy === `claim:${race.id}` || social.busy === `race:${race.friend_id}`}
                        nudgeState={nudgeStateFor(race.friend_id, race.nudged_today)}
                        onAccept={accept => { void social.respondRace(race.id, accept).then(r => { if (!r.error && accept) showToast(`Race on! 7 days. Go.`); }); }}
                        onCancel={() => { void social.cancelRace(race.id); }}
                        onClaim={() => { void claimRaceReward(race.id, firstName(race)); }}
                        onNudge={() => openNudge(race.friend_id)}
                        onRematch={() => { void social.challengeRace(race.friend_id).then(r => showToast(r.error || `Rematch sent to ${firstName(race)}`)); }}
                        meName={myName}
                      />
                    ))}
                  </View>
                </>
              )}

              {loading ? (
                <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 40 }} />
              ) : friendsError ? (
                <View style={styles.emptyState}>
                  <Feather name="wifi-off" size={32} color={COLORS.textMuted} />
                  <Text style={styles.emptyTitle}>Friends unavailable</Text>
                  <Text style={styles.emptySub}>{friendsError}</Text>
                  <ChunkyButton label="Try again" icon={<Feather name="refresh-cw" size={16} color="#FFFFFF" />} onPress={refetch} style={{ alignSelf: 'stretch' }} />
                </View>
              ) : friends.length > 0 && (
                <>
                  {/* Monthly race between friends */}
                  <View style={styles.board}>
                    <View style={styles.boardHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.boardTitle}>This month</Text>
                        <Text style={styles.boardSub}>XP from all industries · resets in {daysLeftInMonth()} days</Text>
                      </View>
                      <View style={styles.rankChip}>
                        <Text style={styles.rankChipText}>#{myFriendRank} of {friendsBoard.length}</Text>
                      </View>
                    </View>
                    {friendsBoard.map((row, idx) => (
                      <BoardRow
                        key={row.id}
                        rank={idx + 1}
                        name={row.name}
                        avatarName={row.isMe ? myName : undefined}
                        xp={row.xp}
                        streak={row.streak}
                        isMe={row.isMe}
                        online={row.friend ? isActive(row.friend) : false}
                        doneToday={row.friend ? row.friend.lessonDoneToday : false}
                        last={idx === friendsBoard.length - 1}
                        crowned={idx === 0 && row.xp > 0}
                        onPress={row.friend ? () => { triggerHaptic('light'); setFriendSheetId(row.friend!.id); } : undefined}
                        nudge={!row.friend ? undefined : row.friend.lessonDoneToday ? 'done' : isNudged(row.friend.id) ? 'nudged' : 'idle'}
                        onNudge={row.friend ? () => openNudge(row.friend!.id) : undefined}
                      />
                    ))}
                  </View>
                  <AddFriendsCard hasFriends onShare={handleShareInvite} onSearch={() => setFindOpen(true)} onMyCode={() => openCodeSheet('code')} onScan={() => openCodeSheet('scan')} />
                </>
              )}
            </>
          )}

          {/* ── GLOBAL TAB ──────────────────────── */}
          {activeTab === 'global' && (
            <>
              {/* Rank hero with real numbers */}
              {!globalLoading && globalEntries.length > 0 && (
                <View style={styles.heroCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroKicker}>{marketName.toUpperCase()} · THIS MONTH</Text>
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
                        <SocialAvatar name={e.isCurrentUser ? (myName || 'You') : e.username} size={44} ring={m.ring} ringWidth={3} />
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
              ) : globalError ? (
                <View style={styles.emptyState}>
                  <Feather name="wifi-off" size={32} color={COLORS.textMuted} />
                  <Text style={styles.emptyTitle}>Standings unavailable</Text>
                  <Text style={styles.emptySub}>{globalError}</Text>
                  <ChunkyButton label="Try again" icon={<Feather name="refresh-cw" size={16} color="#FFFFFF" />} onPress={fetchGlobalLeaderboard} style={{ alignSelf: 'stretch' }} />
                </View>
              ) : globalEntries.length === 0 ? (
                <View style={styles.emptyState}>
                  <Feather name="award" size={34} color={COLORS.textMuted} />
                  <Text style={styles.emptyTitle}>No one has scored this month yet.</Text>
                  <Text style={styles.emptySub}>Finish one lesson and you take first place.</Text>
                </View>
              ) : (
                <View style={styles.board}>
                  {globalEntries.map((entry, idx) => (
                    <BoardRow
                      key={entry.user_id}
                      rank={entry.rank}
                      name={entry.isCurrentUser ? 'You' : entry.username}
                      avatarName={entry.isCurrentUser ? myName : undefined}
                      xp={entry.total_xp}
                      streak={entry.current_streak}
                      isMe={entry.isCurrentUser}
                      last={idx === globalEntries.length - 1}
                    />
                  ))}
                </View>
              )}
            </>
          )}

        </Animated.View>
      </ScrollView>
      <FriendSheet
        friend={sheetFriend}
        social={social.available}
        onClose={() => setFriendSheetId(null)}
        onNudge={() => friendRow && openNudge(friendRow.id)}
        onRace={() => { if (friendRow) void sheetStart(friendRow.id, 'race'); }}
        onStreak={() => { if (friendRow) void sheetStart(friendRow.id, 'streak'); }}
        onRemove={() => { if (friendRow) void handleRemove(friendRow); }}
      />
      <NudgeSheet target={nudgeTarget} onSend={sendNudge} onClose={() => setNudgeTarget(null)} />
      <StreakSheet
        streak={openStreak}
        busy={!!openStreak && (social.busy === `streak:${openStreak.id}` || social.busy === `claim:${openStreak.id}`)}
        nudgeState={openStreak ? nudgeStateFor(openStreak.friend_id, openStreak.nudged_today) : 'idle'}
        onClose={() => setOpenStreakId(null)}
        onAccept={accept => {
          if (!openStreak) return;
          const name = firstName(openStreak);
          void social.respondStreak(openStreak.id, accept).then(r => {
            if (r.error) showToast(r.error);
            else if (accept) { triggerHaptic('success'); showToast(`Streak on with ${name}. Study today to light it.`); }
            else setOpenStreakId(null);
          });
        }}
        onClaim={() => { void claimStreakReward(); }}
        onNudge={() => openStreak && openNudge(openStreak.friend_id)}
        onEnd={() => { if (openStreak) { void social.endStreak(openStreak.id); setOpenStreakId(null); } }}
        onStudy={() => { setOpenStreakId(null); router.push('/(tabs)/home' as any); }}
        meName={myName}
      />
      <FriendPicker
        mode={pickerMode}
        friends={pickerFriends}
        busyId={social.busy?.replace(/^(streak|race):/, '') ?? null}
        error={pickerError}
        onPick={id => { void pickFriend(id); }}
        onClose={() => setPickerMode(null)}
        onAddFriends={() => closeThen(() => setPickerMode(null), () => setFindOpen(true))}
      />
      <FindFriendsSheet
        visible={findOpen}
        searchPeople={searchPeople}
        friendIds={friendIds}
        sentRequests={sentRequests}
        incomingFromIds={new Set(pendingRequests.map(r => r.fromUserId))}
        busyId={busyId}
        onAdd={p => { void handleAdd(p); }}
        onCancelSent={id => { void handleCancelSent(id); }}
        onRedeem={redeemCode}
        onScan={() => closeThen(() => setFindOpen(false), () => openCodeSheet('scan'))}
        onShare={handleShareInvite}
        onClose={() => setFindOpen(false)}
      />
      <MyCodeSheet code={myFriendCode} visible={codeOpen} initialTab={codeTab} onShare={handleShareInvite} onRedeem={redeemCode} onClose={() => setCodeOpen(false)} />
      <RewardCelebration reward={reward} onClose={() => setReward(null)} />
      {toast && (
        <View pointerEvents="none" style={[styles.toast, { bottom: insets.bottom + 24 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

// ── Board Row ───────────────────────────────────────
function BoardRow({
  rank, name, avatarName, xp, streak, isMe, online, doneToday, last, crowned, onPress, nudge, onNudge,
}: {
  rank: number; name: string; avatarName?: string; xp: number; streak: number;
  isMe?: boolean; online?: boolean; doneToday?: boolean; last?: boolean;
  /** This month's leader among friends wears the crown. */
  crowned?: boolean;
  onPress?: () => void;
  nudge?: 'idle' | 'nudged' | 'done';
  onNudge?: () => void;
}) {
  const medal = rank <= 3 ? MEDALS[rank - 1] : null;
  const body = (
    <>
      <View style={[styles.rankBadge, medal && { backgroundColor: medal.bg, borderColor: medal.ring }]}>
        <Text style={[styles.rankNum, medal && { color: medal.text }]}>{rank}</Text>
      </View>
      <View>
        <SocialAvatar name={avatarName || name} size={42} ring={isMe ? COLORS.accent : undefined} />
        {online && <View style={styles.onlineDot} />}
        {crowned && <View style={styles.crown} pointerEvents="none"><CrownBadge size={26} /></View>}
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, isMe && { color: COLORS.accent }]} numberOfLines={1}>{name}</Text>
        {(streak > 0 || doneToday) && (
          <View style={styles.rowMetaLine}>
            {streak > 0 && <><StreakFlame size={13} /><Text style={styles.rowMetaStrong}>{streak}</Text></>}
            {doneToday && <Text style={styles.rowMetaDone}>{streak > 0 ? ' · ' : ''}done today</Text>}
          </View>
        )}
      </View>
      <Text style={[styles.xpValue, isMe && { color: COLORS.accent }]}>{xp.toLocaleString()} XP</Text>
      {nudge && onNudge && <NudgeButton state={nudge} name={name} onPress={onNudge} />}
    </>
  );
  const style = [styles.row, isMe && styles.rowSelf, !last && styles.rowDivider];
  return onPress ? (
    <TouchableOpacity style={style} onPress={onPress} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={`${name}, ${xp} XP. Open`}>{body}</TouchableOpacity>
  ) : <View style={style}>{body}</View>;
}

/** Wave at a friend: open, already nudged today, or done for the day. */
function NudgeButton({ state, name, onPress }: { state: 'idle' | 'nudged' | 'done'; name: string; onPress: () => void }) {
  if (state === 'done') {
    return <View style={[styles.nudgeBtn, styles.nudgeBtnDone]} accessibilityLabel={`${name} studied today`}><MaterialCommunityIcons name="check-bold" size={18} color="#FFFFFF" /></View>;
  }
  if (state === 'nudged') {
    return <View style={[styles.nudgeBtn, styles.nudgeBtnOff]} accessibilityLabel={`${name} was nudged today`}><MaterialCommunityIcons name="hand-wave" size={18} color={COLORS.textMuted} /></View>;
  }
  return (
    <TouchableOpacity style={styles.nudgeBtn} onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`Nudge ${name}`}>
      <MaterialCommunityIcons name="hand-wave" size={19} color={COLORS.accent} />
    </TouchableOpacity>
  );
}

// ── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  nameCard: {
    backgroundColor: COLORS.bg2, borderRadius: 18, padding: 14, marginBottom: 14,
    borderWidth: 2, borderColor: COLORS.accent + '30',
  },
  nameCardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    flex: 1, height: 44, borderRadius: 12, paddingHorizontal: 12,
    backgroundColor: COLORS.bg1, color: COLORS.textPrimary, fontSize: 16,
  },
  nameSave: {
    height: 44, minWidth: 72, borderRadius: 12, paddingHorizontal: 14,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
  },
  nameSaveText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 },
  headerBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPE.hero, fontSize: 22, color: COLORS.textPrimary },
  headerSub: { fontSize: 11, fontWeight: '700', color: COLORS.accent, letterSpacing: 0.4, marginTop: 1 },
  badgeDot: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: COLORS.error, borderRadius: 9, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: COLORS.bg0,
  },
  badgeDotText: { fontSize: 10, fontWeight: '800', color: '#FFF' },

  // Tabs: one segmented control
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 14, padding: 4, borderRadius: 16, backgroundColor: COLORS.bg1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: 12 },
  tabActive: { backgroundColor: COLORS.bg2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '800', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.textPrimary },

  scrollContent: { paddingHorizontal: 16 },

  card: { borderRadius: 22, padding: 14, gap: 10, marginBottom: 16, backgroundColor: COLORS.bg2, borderWidth: 2, borderBottomWidth: 5, borderColor: COLORS.border },
  cardKicker: { fontSize: 12, fontWeight: '900', letterSpacing: 0.8, color: COLORS.accent, textTransform: 'uppercase' },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  declineBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },

  section: { marginBottom: 16, gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 30, borderRadius: 15, backgroundColor: COLORS.accentSoft },
  sectionActionText: { fontSize: 13, fontWeight: '800', color: COLORS.accent },
  raceEmpty: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20,
    backgroundColor: COLORS.bg2, borderWidth: 2, borderBottomWidth: 5, borderColor: COLORS.border,
  },
  raceEmptyDisc: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  raceEmptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  raceEmptySub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },

  // Leaderboard
  board: { borderRadius: 22, marginBottom: 16, backgroundColor: COLORS.bg2, borderWidth: 2, borderBottomWidth: 5, borderColor: COLORS.border, overflow: 'hidden' },
  boardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  boardTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary },
  boardSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  rankChip: { paddingHorizontal: 12, height: 30, borderRadius: 15, backgroundColor: COLORS.accentSoft, borderWidth: 1.5, borderColor: COLORS.accentMedium, alignItems: 'center', justifyContent: 'center' },
  rankChipText: { fontSize: 13, fontWeight: '900', color: COLORS.accent },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, minHeight: 64 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  rowSelf: { backgroundColor: COLORS.accentSoft },
  rankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  rankNum: { fontSize: 14, fontWeight: '900', color: COLORS.textMuted },
  crown: { position: 'absolute', top: -14, left: 8 },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.bg2 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  rowMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  rowMetaLine: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 2 },
  rowMetaStrong: { fontSize: 12, fontWeight: '800', color: COLORS.streak },
  rowMetaDone: { fontSize: 12, fontWeight: '700', color: COLORS.success },
  xpValue: { fontSize: 15, fontWeight: '900', color: COLORS.textPrimary },
  nudgeBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accentSoft, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.accentMedium,
  },
  nudgeBtnOff: { backgroundColor: COLORS.bg1, borderColor: COLORS.border },
  nudgeBtnDone: { backgroundColor: COLORS.success, borderColor: '#15803D' },

  // Global hero
  heroCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.accentSoft, borderRadius: 22, padding: 14,
    borderWidth: 1.5, borderColor: COLORS.accentMedium, marginBottom: 14,
  },
  heroKicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: COLORS.accent },
  heroValue: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  heroUnit: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  heroLine: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3, lineHeight: 17 },
  heroAccent: { color: COLORS.accent, fontWeight: '800' },

  // Podium
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 14 },
  podiumCol: { flex: 1, alignItems: 'center' },
  podiumName: { fontSize: 12, fontWeight: '800', color: COLORS.textPrimary, marginTop: 4, marginBottom: 4, maxWidth: '95%' },
  podiumBlock: { width: '100%', borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 1 },
  podiumRank: { fontSize: 18, fontWeight: '800' },
  podiumXP: { fontSize: 11, fontWeight: '700' },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 24, gap: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 14 },

  toast: {
    position: 'absolute', left: 20, right: 20, paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 14, backgroundColor: COLORS.bg2, alignItems: 'center', ...SHADOWS.md,
  },
  toastText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
});
