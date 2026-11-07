import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Share,
  Image,
  Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { inviteShareContent, acceptInvite, normalizeInviteCode, inviteToast } from "../lib/invites";
import { COLORS, TYPE, SHADOWS } from "../lib/constants";
import { getMarketName } from "../lib/markets";
import { useFriends } from "../hooks/useFriends";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { triggerHaptic } from "../lib/haptics";
import { trackEvent } from "../lib/analytics";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { getMonthlyStandings, myFriendRaceXP, standingName } from "../lib/socialStandings";
import { log } from "../lib/logger";
import { useFriendSocial } from "../hooks/useFriendSocial";
import { FriendStreaksCard } from "../components/social/FriendStreaksCard";
import { StreakSheet } from "../components/social/StreakSheet";
import { RaceCard } from "../components/social/RaceCard";
import { FriendPicker } from "../components/social/FriendPicker";
import { RewardCelebration } from "../components/social/RewardCelebration";
import { firstName, raceIsOver } from "../lib/friendSocial";
import { FriendSheet } from "../components/social/FriendSheet";
import { NudgeSheet } from "../components/social/NudgeSheet";
import { FindFriendsSheet } from "../components/social/FindFriendsSheet";
import { MyCodeSheet } from "../components/social/MyCodeSheet";
import { AddFriendsCard } from "../components/social/AddFriendsCard";
import { ChunkyButton } from "../components/social/ChunkyButton";
import { SocialAvatar } from "../components/social/SocialAvatar";
import { StreakFlame } from "../components/ui/StreakFlame";
import { nudgeOptions } from "../lib/nudges";
const SOCIAL_HERO = require("../assets/illustrations/friends-rivals-hero.png");
const LEO_SASSY = require("../assets/mascot/leo-sassy.png");
const SHEET_HANDOFF_MS = 380;
const MEDALS = [
  { bg: "#FEF3C7", ring: "#F59E0B", text: "#B45309" },
  { bg: "#EEF2F7", ring: "#9CA3AF", text: "#4B5563" },
  { bg: "#FFEDD5", ring: "#FB923C", text: "#C2410C" }
];
function daysLeftInMonth(now = /* @__PURE__ */ new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 864e5));
}
function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [marketId, setMarketId] = useState(null);
  const {
    friends,
    pendingRequests,
    sentRequests,
    myFriendCode,
    loading,
    error: friendsError,
    searchPeople,
    sendRequest,
    cancelRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    refetch
  } = useFriends(marketId || void 0);
  const [busyId, setBusyId] = useState(null);
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState("friends");
  const [globalEntries, setGlobalEntries] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [myStats, setMyStats] = useState({ xp: 0, level: 1, streak: 0, monthXP: 0 });
  const [nudgedIds, setNudgedIds] = useState(/* @__PURE__ */ new Set());
  const [friendSheetId, setFriendSheetId] = useState(null);
  const [nudgeTarget, setNudgeTarget] = useState(null);
  const [findOpen, setFindOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const social = useFriendSocial(user?.id);
  const [openStreakId, setOpenStreakId] = useState(null);
  const [pickerMode, setPickerMode] = useState(null);
  const [pickerError, setPickerError] = useState(null);
  const [reward, setReward] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!loading) {
      Animated.spring(fadeAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }).start();
    }
  }, [loading]);
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("selected_market, display_name").eq("id", user.id).single().then(({ data }) => {
      setMarketId(data?.selected_market || "aerospace");
      setNeedsName(!data?.display_name?.trim());
      setMyName(data?.display_name?.trim() || "");
    });
  }, [user]);
  const [needsName, setNeedsName] = useState(false);
  const [myName, setMyName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const nameValid = nameDraft.trim().length >= 1;
  const saveName = useCallback(async () => {
    if (!user || !nameValid || savingName) return;
    setSavingName(true);
    const clean = nameDraft.trim().replace(/\s+/g, " ").slice(0, 40);
    const { error } = await supabase.from("profiles").update({ display_name: clean }).eq("id", user.id);
    setSavingName(false);
    if (error) {
      log.warn("Could not save display name", error.message);
      return;
    }
    triggerHaptic("success");
    setNeedsName(false);
    setMyName(clean);
  }, [user, nameDraft, nameValid, savingName]);
  useEffect(() => {
    if (!marketId || !user) return;
    (async () => {
      const [standings, raceXP] = await Promise.all([getMonthlyStandings(marketId), myFriendRaceXP(user.id)]);
      const mine = standings.find((row) => row.user_id === user.id);
      setMyStats({
        xp: raceXP,
        level: mine?.current_level || 1,
        streak: mine?.current_streak || 0,
        monthXP: raceXP
      });
    })().catch((error) => log.warn("Could not load my monthly social stats", error));
  }, [marketId, user]);
  useEffect(() => {
    if (!marketId || !user) return;
    if (activeTab !== "global") return;
    fetchGlobalLeaderboard();
  }, [marketId, user, activeTab]);
  const fetchGlobalLeaderboard = useCallback(async () => {
    if (!marketId || !user) return;
    setGlobalLoading(true);
    setGlobalError(null);
    try {
      const standings = (await getMonthlyStandings(marketId)).filter((row) => row.monthly_xp > 0).slice(0, 50);
      if (!standings.length) {
        setGlobalEntries([]);
        setGlobalLoading(false);
        return;
      }
      const entries = standings.map((row, idx) => ({
        rank: idx + 1,
        user_id: row.user_id,
        username: standingName(row),
        total_xp: row.monthly_xp,
        current_level: row.current_level,
        current_streak: row.current_streak,
        isCurrentUser: row.user_id === user.id
      }));
      setGlobalEntries(entries);
    } catch (error) {
      log.warn("Global standings failed", error);
      setGlobalEntries([]);
      setGlobalError("Standings could not load. Check your connection and try again.");
    }
    setGlobalLoading(false);
  }, [marketId, user]);
  useFocusEffect(useCallback(() => {
    if (!marketId || !user) return;
    void refetch();
    void social.refresh();
    if (activeTab === "global") void fetchGlobalLeaderboard();
  }, [activeTab, fetchGlobalLeaderboard, marketId, refetch, user, social.refresh]));
  const currentUserRank = globalEntries.find((e) => e.isCurrentUser)?.rank ?? null;
  const marketName = marketId ? getMarketName(marketId) : "";
  const initial = (user?.email || "Y").charAt(0).toUpperCase();
  const friendsBoard = useMemo(() => {
    const rows = [
      {
        id: "me",
        isMe: true,
        name: "You",
        initial,
        xp: myStats.monthXP,
        monthXP: myStats.monthXP,
        level: myStats.level,
        streak: myStats.streak,
        friend: null
      },
      ...friends.map((f) => ({
        id: f.id,
        isMe: false,
        name: f.username,
        initial: f.username.charAt(0).toUpperCase(),
        xp: f.totalXP,
        monthXP: f.totalXP,
        level: f.currentLevel,
        streak: f.currentStreak,
        friend: f
      }))
    ];
    return rows.sort((a, b) => b.xp - a.xp);
  }, [friends, myStats, initial]);
  const myFriendRank = friendsBoard.findIndex((r) => r.isMe) + 1;
  const showToast = useCallback((text) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);
  useEffect(() => {
    if (typeof params.toast === "string" && params.toast) showToast(params.toast);
  }, [params.toast, showToast]);
  const redeemCode = async (raw) => {
    const code = normalizeInviteCode(raw);
    if (!code) return { ok: false, message: "That code isn't valid. Codes are 4 to 12 letters and numbers." };
    triggerHaptic("light");
    const result = await acceptInvite(code);
    const message = inviteToast(result) || "Something went wrong. Please try again.";
    const ok = result.status === "connected" || result.status === "already";
    if (ok) {
      triggerHaptic("success");
      void refetch();
    }
    return { ok, message };
  };
  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);
  const handleAdd = async (person) => {
    if (busyId) return;
    const sent = sentRequests.find((r) => r.toUserId === person.id);
    triggerHaptic("light");
    setBusyId(person.id);
    if (sent) {
      const result = await cancelRequest(sent.id);
      if (!result.success) showToast(result.error || "Could not cancel. Please try again.");
    } else {
      const incoming = pendingRequests.find((r) => r.fromUserId === person.id);
      const result = incoming ? await acceptRequest(incoming.id) : await sendRequest(person);
      if (result.success) trackEvent(incoming ? "friend_request_accepted" : "friend_request_sent", {});
      else showToast(result.error || "Something went wrong. Please try again.");
    }
    setBusyId(null);
  };
  const handleAccept = async (id) => {
    if (busyId) return;
    triggerHaptic("success");
    setBusyId(id);
    const result = await acceptRequest(id);
    setBusyId(null);
    if (result.success) trackEvent("friend_request_accepted", {});
    else showToast(result.error || "Could not accept. Please try again.");
  };
  const handleDecline = async (id) => {
    if (busyId) return;
    triggerHaptic("light");
    setBusyId(id);
    const result = await declineRequest(id);
    setBusyId(null);
    if (!result.success) showToast("Could not decline. Please try again.");
  };
  const handleCancelSent = async (id) => {
    if (busyId) return;
    triggerHaptic("light");
    setBusyId(id);
    const result = await cancelRequest(id);
    setBusyId(null);
    if (!result.success) showToast(result.error || "Could not cancel. Please try again.");
  };
  const sendNudge = async (friendId, message) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-nudge", { body: { friendId, message } });
      if (error) throw error;
      setNudgedIds((prev) => new Set(prev).add(friendId));
      if (data?.status === "already") return "already";
      trackEvent("nudge_sent", { to: friendId, status: data?.status, message });
      return data?.status === "sent" ? "sent" : "saved";
    } catch (error) {
      log.warn("Friend nudge failed", error);
      return error?.name === "FunctionsFetchError" ? "offline" : "error";
    }
  };
  const streaks = social.social?.streaks ?? [];
  const races = social.social?.races ?? [];
  const openStreak = streaks.find((s) => s.id === openStreakId) ?? null;
  const isNudged = (friendId, nudgedToday = false) => nudgedToday || nudgedIds.has(friendId) || !!friends.find((f) => f.id === friendId)?.nudgedToday;
  const nudgeStateFor = (friendId, nudgedToday) => isNudged(friendId, nudgedToday) ? "nudged" : "idle";
  const takenFor = (friendId, mode) => {
    if (mode === "streak") {
      const streak = streaks.find((s) => s.friend_id === friendId);
      return streak ? streak.status === "pending" ? streak.invited_by_me ? "Invited" : "Invited you" : "Streak on" : void 0;
    }
    const race = races.find((r) => r.friend_id === friendId && (r.status === "pending" || r.status === "active" && !raceIsOver(r)));
    return race ? race.status === "pending" ? race.challenged_by_me ? "Challenged" : "Challenged you" : "Racing" : void 0;
  };
  const nudgeTargetFor = (friendId) => {
    const f = friends.find((x) => x.id === friendId);
    if (!f) return null;
    const name = f.username.trim().split(/\s+/)[0] || "your friend";
    const streak = streaks.find((x) => x.friend_id === friendId && x.status === "active");
    const race = races.find((r) => r.friend_id === friendId && r.status === "active" && !raceIsOver(r));
    const lead = race ? race.my_xp - race.friend_xp : null;
    const context = lead !== null ? lead > 0 ? `You lead your race by ${lead} XP.` : lead < 0 ? `${name} leads your race by ${-lead} XP.` : "Your race is tied." : streak ? `Your ${streak.length}-day friend streak needs you both today.` : f.lessonDoneToday ? `${name} already studied today. Say hi anyway.` : `${name} hasn't done today's lesson yet.`;
    return { friendId, name, context, options: nudgeOptions({ streakLength: streak ? streak.length : null, meDoneToday: streak?.me_done_today, raceLead: lead }) };
  };
  const openNudge = (friendId) => {
    const target = nudgeTargetFor(friendId);
    if (!target) return;
    triggerHaptic("light");
    const handoff = friendSheetId !== null || openStreakId !== null;
    setFriendSheetId(null);
    setOpenStreakId(null);
    if (handoff) setTimeout(() => setNudgeTarget(target), SHEET_HANDOFF_MS);
    else setNudgeTarget(target);
  };
  const pickerFriends = friends.map((f) => ({
    id: f.id,
    name: f.username,
    meta: [f.currentStreak > 0 ? `${f.currentStreak}-day streak` : null, f.selectedMarket ? getMarketName(f.selectedMarket) : null].filter(Boolean).join(" \xB7 ") || `Lv.${f.currentLevel}`,
    taken: pickerMode ? takenFor(f.id, pickerMode) : void 0
  }));
  const openPicker = (mode) => {
    triggerHaptic("light");
    setPickerError(null);
    setPickerMode(mode);
  };
  const startWith = async (friendId, mode) => {
    const name = friends.find((f) => f.id === friendId)?.username ?? "your friend";
    const result = mode === "streak" ? await social.startStreak(friendId) : await social.challengeRace(friendId);
    if (result.error) return result.error;
    triggerHaptic("success");
    showToast(mode === "streak" ? `Streak invite sent to ${name}` : `Challenge sent to ${name}`);
    return null;
  };
  const pickFriend = async (friendId) => {
    const error = await startWith(friendId, pickerMode ?? "race");
    if (error) {
      setPickerError(error);
      return;
    }
    setPickerMode(null);
  };
  const claimStreakReward = async () => {
    if (!openStreak) return;
    const won = await social.claimStreak(openStreak.id, firstName(openStreak));
    if (won) {
      setOpenStreakId(null);
      setReward(won);
    }
  };
  const claimRaceReward = async (raceId, name) => {
    const won = await social.claimRace(raceId, name);
    if (won && won.xp > 0) setReward(won);
    else if (won) showToast(`${name} took this one. Rematch?`);
  };
  const handleRemove = async (friend) => {
    setFriendSheetId(null);
    const result = await removeFriend(friend.friendshipId);
    showToast(result.success ? `${friend.username} removed` : "Could not remove friend. Please try again.");
  };
  const handleShareInvite = async () => {
    triggerHaptic("light");
    try {
      await Share.share(myFriendCode ? inviteShareContent(marketName, myFriendCode, Platform.OS) : { message: `I'm learning ${marketName || "industries"} on MarketLingo, 5 minutes a day. Join me: https://market-verse.com` });
    } catch (e) {
    }
  };
  const isActive = (friend) => {
    if (!friend.lastActivityAt) return false;
    return (Date.now() - new Date(friend.lastActivityAt).getTime()) / (1e3 * 60 * 60) < 24;
  };
  const friendRow = friends.find((f) => f.id === friendSheetId) ?? null;
  const sheetFriend = friendRow ? {
    id: friendRow.id,
    name: friendRow.username,
    industry: friendRow.selectedMarket ? getMarketName(friendRow.selectedMarket) : null,
    level: friendRow.currentLevel,
    streak: friendRow.currentStreak,
    monthXP: friendRow.totalXP,
    rank: friendsBoard.findIndex((r) => r.id === friendRow.id) + 1,
    doneToday: friendRow.lessonDoneToday,
    online: isActive(friendRow),
    raceAction: sheetAction(friendRow.id, "race"),
    streakAction: sheetAction(friendRow.id, "streak"),
    nudged: isNudged(friendRow.id)
  } : null;
  function sheetAction(friendId, mode) {
    const taken = takenFor(friendId, mode);
    if (!taken) return { label: mode === "race" ? "Race" : "Streak", enabled: true };
    if (taken === "Challenged you") return { label: "Accept race", enabled: true };
    if (taken === "Invited you") return { label: "Accept streak", enabled: true };
    return { label: taken, enabled: false };
  }
  const sheetStart = async (friendId, mode) => {
    const incomingRace = races.find((r) => r.friend_id === friendId && r.status === "pending" && !r.challenged_by_me);
    const incomingStreak = streaks.find((x) => x.friend_id === friendId && x.status === "pending" && !x.invited_by_me);
    if (mode === "race" && incomingRace) {
      const r = await social.respondRace(incomingRace.id, true);
      showToast(r.error || "Race on! 7 days. Go.");
      if (!r.error) setFriendSheetId(null);
      return;
    }
    if (mode === "streak" && incomingStreak) {
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
  const closeThen = (close, next) => {
    close();
    setTimeout(next, SHEET_HANDOFF_MS);
  };
  return /* @__PURE__ */ React.createElement(View, { style: [styles.container, { paddingTop: insets.top }] }, /* @__PURE__ */ React.createElement(View, { style: styles.header }, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.headerBtn, onPress: () => router.back(), accessibilityLabel: "Back" }, /* @__PURE__ */ React.createElement(Feather, { name: "arrow-left", size: 18, color: COLORS.textPrimary })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.headerTitle }, "Standings"), !!marketName && /* @__PURE__ */ React.createElement(Text, { style: styles.headerSub }, marketName)), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.headerBtn, onPress: () => {
    triggerHaptic("light");
    setFindOpen(true);
  }, accessibilityLabel: "Find friends" }, /* @__PURE__ */ React.createElement(Feather, { name: "user-plus", size: 17, color: COLORS.accent }), pendingRequests.length > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.badgeDot }, /* @__PURE__ */ React.createElement(Text, { style: styles.badgeDotText }, pendingRequests.length)))), /* @__PURE__ */ React.createElement(View, { style: styles.tabRow }, ["friends", "global"].map((tab) => /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      key: tab,
      style: [styles.tab, activeTab === tab && styles.tabActive],
      onPress: () => {
        triggerHaptic("light");
        setActiveTab(tab);
      },
      accessibilityRole: "tab",
      accessibilityState: { selected: activeTab === tab }
    },
    /* @__PURE__ */ React.createElement(Feather, { name: tab === "friends" ? "users" : "globe", size: 14, color: activeTab === tab ? COLORS.accent : COLORS.textMuted }),
    /* @__PURE__ */ React.createElement(Text, { style: [styles.tabText, activeTab === tab && styles.tabTextActive] }, tab === "friends" ? "Friends" : "Global")
  ))), /* @__PURE__ */ React.createElement(
    ScrollView,
    {
      contentContainerStyle: [styles.scrollContent, { paddingBottom: insets.bottom + 40 }],
      showsVerticalScrollIndicator: false
    },
    /* @__PURE__ */ React.createElement(Animated.View, { style: { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] } }, needsName && /* @__PURE__ */ React.createElement(View, { style: styles.nameCard }, /* @__PURE__ */ React.createElement(Text, { style: styles.nameCardTitle }, "Add your name so friends can find you"), /* @__PURE__ */ React.createElement(View, { style: styles.nameRow }, /* @__PURE__ */ React.createElement(
      TextInput,
      {
        style: styles.nameInput,
        placeholder: "Your name",
        placeholderTextColor: COLORS.textMuted,
        value: nameDraft,
        onChangeText: (v) => setNameDraft(v.slice(0, 40)),
        maxLength: 40,
        autoCapitalize: "words",
        autoCorrect: false,
        returnKeyType: "done",
        onSubmitEditing: saveName
      }
    ), /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: [styles.nameSave, (!nameValid || savingName) && { opacity: 0.5 }],
        onPress: saveName,
        disabled: !nameValid || savingName,
        accessibilityLabel: "Save name"
      },
      savingName ? /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "small", color: "#FFF" }) : /* @__PURE__ */ React.createElement(Text, { style: styles.nameSaveText }, "Save")
    ))), activeTab === "friends" && /* @__PURE__ */ React.createElement(React.Fragment, null, pendingRequests.length > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.card }, /* @__PURE__ */ React.createElement(Text, { style: styles.cardKicker }, pendingRequests.length === 1 ? "Friend request" : `${pendingRequests.length} friend requests`), pendingRequests.map((r) => /* @__PURE__ */ React.createElement(View, { key: r.id, style: styles.requestRow }, /* @__PURE__ */ React.createElement(SocialAvatar, { name: r.fromUsername, size: 44, ring: COLORS.accent }), /* @__PURE__ */ React.createElement(View, { style: styles.rowInfo }, /* @__PURE__ */ React.createElement(Text, { style: styles.rowName, numberOfLines: 1 }, r.fromUsername), /* @__PURE__ */ React.createElement(Text, { style: styles.rowMeta, numberOfLines: 1 }, r.fromMarket ? `${getMarketName(r.fromMarket)} \xB7 wants to be friends` : "Wants to be friends")), busyId === r.id ? /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "small", color: COLORS.accent }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.declineBtn, onPress: () => handleDecline(r.id), accessibilityLabel: `Decline ${r.fromUsername}` }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 18, color: COLORS.textMuted })), /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Accept", onPress: () => {
      void handleAccept(r.id);
    }, height: 40, style: { minWidth: 92 }, accessibilityLabel: `Accept ${r.fromUsername}` }))))), !loading && !friendsError && friends.length === 0 && /* @__PURE__ */ React.createElement(AddFriendsCard, { hasFriends: false, onShare: handleShareInvite, onSearch: () => setFindOpen(true), onMyCode: () => setCodeOpen(true) }), showSocial && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(FriendStreaksCard, { streaks, onOpen: (s) => {
      triggerHaptic("light");
      setOpenStreakId(s.id);
    }, onInvite: () => openPicker("streak") }), /* @__PURE__ */ React.createElement(View, { style: styles.section }, /* @__PURE__ */ React.createElement(View, { style: styles.sectionHead }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionTitle }, "Races"), races.length > 0 && /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => openPicker("race"), style: styles.sectionAction, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Feather, { name: "flag", size: 13, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.sectionActionText }, "Challenge"))), races.length === 0 ? /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.raceEmpty, onPress: () => openPicker("race"), activeOpacity: 0.88, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(View, { style: styles.raceEmptyDisc }, /* @__PURE__ */ React.createElement(Feather, { name: "flag", size: 20, color: "#FFFFFF" })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.raceEmptyTitle }, "Race a friend this week"), /* @__PURE__ */ React.createElement(Text, { style: styles.raceEmptySub }, "Most XP in 7 days wins +100 XP.")), /* @__PURE__ */ React.createElement(Feather, { name: "chevron-right", size: 18, color: COLORS.accent })) : races.map((race) => /* @__PURE__ */ React.createElement(
      RaceCard,
      {
        key: race.id,
        race,
        busy: social.busy === `race:${race.id}` || social.busy === `claim:${race.id}` || social.busy === `race:${race.friend_id}`,
        nudgeState: nudgeStateFor(race.friend_id, race.nudged_today),
        onAccept: (accept) => {
          void social.respondRace(race.id, accept).then((r) => {
            if (!r.error && accept) showToast(`Race on! 7 days. Go.`);
          });
        },
        onCancel: () => {
          void social.cancelRace(race.id);
        },
        onClaim: () => {
          void claimRaceReward(race.id, firstName(race));
        },
        onNudge: () => openNudge(race.friend_id),
        onRematch: () => {
          void social.challengeRace(race.friend_id).then((r) => showToast(r.error || `Rematch sent to ${firstName(race)}`));
        },
        meName: myName
      }
    )))), loading ? /* @__PURE__ */ React.createElement(ActivityIndicator, { color: COLORS.accent, size: "large", style: { marginTop: 40 } }) : friendsError ? /* @__PURE__ */ React.createElement(View, { style: styles.emptyState }, /* @__PURE__ */ React.createElement(Feather, { name: "wifi-off", size: 32, color: COLORS.textMuted }), /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, "Friends unavailable"), /* @__PURE__ */ React.createElement(Text, { style: styles.emptySub }, friendsError), /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Try again", icon: /* @__PURE__ */ React.createElement(Feather, { name: "refresh-cw", size: 16, color: "#FFFFFF" }), onPress: refetch, style: { alignSelf: "stretch" } })) : friends.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(View, { style: styles.board }, /* @__PURE__ */ React.createElement(View, { style: styles.boardHead }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.boardTitle }, "This month"), /* @__PURE__ */ React.createElement(Text, { style: styles.boardSub }, "XP from all industries \xB7 resets in ", daysLeftInMonth(), " days")), /* @__PURE__ */ React.createElement(View, { style: styles.rankChip }, /* @__PURE__ */ React.createElement(Text, { style: styles.rankChipText }, "#", myFriendRank, " of ", friendsBoard.length))), friendsBoard.map((row, idx) => /* @__PURE__ */ React.createElement(
      BoardRow,
      {
        key: row.id,
        rank: idx + 1,
        name: row.name,
        avatarName: row.isMe ? myName : void 0,
        xp: row.xp,
        streak: row.streak,
        isMe: row.isMe,
        online: row.friend ? isActive(row.friend) : false,
        doneToday: row.friend ? row.friend.lessonDoneToday : false,
        last: idx === friendsBoard.length - 1,
        onPress: row.friend ? () => {
          triggerHaptic("light");
          setFriendSheetId(row.friend.id);
        } : void 0,
        nudge: !row.friend ? void 0 : row.friend.lessonDoneToday ? "done" : isNudged(row.friend.id) ? "nudged" : "idle",
        onNudge: row.friend ? () => openNudge(row.friend.id) : void 0
      }
    ))), /* @__PURE__ */ React.createElement(AddFriendsCard, { hasFriends: true, onShare: handleShareInvite, onSearch: () => setFindOpen(true), onMyCode: () => setCodeOpen(true) }))), activeTab === "global" && /* @__PURE__ */ React.createElement(React.Fragment, null, !globalLoading && globalEntries.length > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.heroCard }, /* @__PURE__ */ React.createElement(Image, { source: SOCIAL_HERO, style: styles.heroLeo, resizeMode: "cover" }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.heroKicker }, marketName.toUpperCase(), " \xB7 THIS MONTH"), /* @__PURE__ */ React.createElement(Text, { style: styles.heroValue }, currentUserRank ? /* @__PURE__ */ React.createElement(React.Fragment, null, "#", currentUserRank, /* @__PURE__ */ React.createElement(Text, { style: styles.heroUnit }, " of ", globalEntries.length)) : "Unranked"), /* @__PURE__ */ React.createElement(Text, { style: styles.heroLine }, currentUserRank === 1 ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Top of the market. ", /* @__PURE__ */ React.createElement(Text, { style: styles.heroAccent }, "Hold it.")) : currentUserRank ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Next spot costs ", /* @__PURE__ */ React.createElement(Text, { style: styles.heroAccent }, Math.max(1, (globalEntries[currentUserRank - 2]?.total_xp || 0) - (globalEntries[currentUserRank - 1]?.total_xp || 0) + 1), " XP"), ".") : "One lesson puts you on the board."))), !globalLoading && globalEntries.length >= 3 && /* @__PURE__ */ React.createElement(View, { style: styles.podium }, [1, 0, 2].map((i) => {
      const e = globalEntries[i];
      const m = MEDALS[i];
      const h = i === 0 ? 76 : i === 1 ? 60 : 50;
      return /* @__PURE__ */ React.createElement(View, { key: e.user_id, style: styles.podiumCol }, /* @__PURE__ */ React.createElement(SocialAvatar, { name: e.isCurrentUser ? myName || "You" : e.username, size: 44, ring: m.ring, ringWidth: 3 }), /* @__PURE__ */ React.createElement(Text, { style: styles.podiumName, numberOfLines: 1 }, e.isCurrentUser ? "You" : e.username), /* @__PURE__ */ React.createElement(View, { style: [styles.podiumBlock, { height: h, backgroundColor: m.bg, borderColor: m.ring + "55" }] }, /* @__PURE__ */ React.createElement(Text, { style: [styles.podiumRank, { color: m.text }] }, i + 1), /* @__PURE__ */ React.createElement(Text, { style: [styles.podiumXP, { color: m.text }] }, e.total_xp.toLocaleString())));
    })), globalLoading ? /* @__PURE__ */ React.createElement(ActivityIndicator, { color: COLORS.accent, size: "large", style: { marginTop: 60 } }) : globalError ? /* @__PURE__ */ React.createElement(View, { style: styles.emptyState }, /* @__PURE__ */ React.createElement(Feather, { name: "wifi-off", size: 32, color: COLORS.textMuted }), /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, "Standings unavailable"), /* @__PURE__ */ React.createElement(Text, { style: styles.emptySub }, globalError), /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Try again", icon: /* @__PURE__ */ React.createElement(Feather, { name: "refresh-cw", size: 16, color: "#FFFFFF" }), onPress: fetchGlobalLeaderboard, style: { alignSelf: "stretch" } })) : globalEntries.length === 0 ? /* @__PURE__ */ React.createElement(View, { style: styles.emptyState }, /* @__PURE__ */ React.createElement(Image, { source: LEO_SASSY, style: styles.emptyLeo, resizeMode: "contain" }), /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, "No one has scored this month yet."), /* @__PURE__ */ React.createElement(Text, { style: styles.emptySub }, "Finish one lesson and you take first place.")) : /* @__PURE__ */ React.createElement(View, { style: styles.board }, globalEntries.map((entry, idx) => /* @__PURE__ */ React.createElement(
      BoardRow,
      {
        key: entry.user_id,
        rank: entry.rank,
        name: entry.isCurrentUser ? "You" : entry.username,
        avatarName: entry.isCurrentUser ? myName : void 0,
        xp: entry.total_xp,
        streak: entry.current_streak,
        isMe: entry.isCurrentUser,
        last: idx === globalEntries.length - 1
      }
    )))))
  ), /* @__PURE__ */ React.createElement(
    FriendSheet,
    {
      friend: sheetFriend,
      social: social.available,
      onClose: () => setFriendSheetId(null),
      onNudge: () => friendRow && openNudge(friendRow.id),
      onRace: () => {
        if (friendRow) void sheetStart(friendRow.id, "race");
      },
      onStreak: () => {
        if (friendRow) void sheetStart(friendRow.id, "streak");
      },
      onRemove: () => {
        if (friendRow) void handleRemove(friendRow);
      }
    }
  ), /* @__PURE__ */ React.createElement(NudgeSheet, { target: nudgeTarget, onSend: sendNudge, onClose: () => setNudgeTarget(null) }), /* @__PURE__ */ React.createElement(
    StreakSheet,
    {
      streak: openStreak,
      busy: !!openStreak && (social.busy === `streak:${openStreak.id}` || social.busy === `claim:${openStreak.id}`),
      nudgeState: openStreak ? nudgeStateFor(openStreak.friend_id, openStreak.nudged_today) : "idle",
      onClose: () => setOpenStreakId(null),
      onAccept: (accept) => {
        if (!openStreak) return;
        const name = firstName(openStreak);
        void social.respondStreak(openStreak.id, accept).then((r) => {
          if (r.error) showToast(r.error);
          else if (accept) {
            triggerHaptic("success");
            showToast(`Streak on with ${name}. Study today to light it.`);
          } else setOpenStreakId(null);
        });
      },
      onClaim: () => {
        void claimStreakReward();
      },
      onNudge: () => openStreak && openNudge(openStreak.friend_id),
      onEnd: () => {
        if (openStreak) {
          void social.endStreak(openStreak.id);
          setOpenStreakId(null);
        }
      },
      onStudy: () => {
        setOpenStreakId(null);
        router.push("/(tabs)/home");
      },
      meName: myName
    }
  ), /* @__PURE__ */ React.createElement(
    FriendPicker,
    {
      mode: pickerMode,
      friends: pickerFriends,
      busyId: social.busy?.replace(/^(streak|race):/, "") ?? null,
      error: pickerError,
      onPick: (id) => {
        void pickFriend(id);
      },
      onClose: () => setPickerMode(null),
      onAddFriends: () => closeThen(() => setPickerMode(null), () => setFindOpen(true))
    }
  ), /* @__PURE__ */ React.createElement(
    FindFriendsSheet,
    {
      visible: findOpen,
      searchPeople,
      friendIds,
      sentRequests,
      incomingFromIds: new Set(pendingRequests.map((r) => r.fromUserId)),
      busyId,
      onAdd: (p) => {
        void handleAdd(p);
      },
      onCancelSent: (id) => {
        void handleCancelSent(id);
      },
      onRedeem: redeemCode,
      onShare: handleShareInvite,
      onClose: () => setFindOpen(false)
    }
  ), /* @__PURE__ */ React.createElement(MyCodeSheet, { code: myFriendCode, visible: codeOpen, onShare: handleShareInvite, onClose: () => setCodeOpen(false) }), /* @__PURE__ */ React.createElement(RewardCelebration, { reward, onClose: () => setReward(null) }), toast && /* @__PURE__ */ React.createElement(View, { pointerEvents: "none", style: [styles.toast, { bottom: insets.bottom + 24 }] }, /* @__PURE__ */ React.createElement(Text, { style: styles.toastText }, toast)));
}
function BoardRow({
  rank,
  name,
  avatarName,
  xp,
  streak,
  isMe,
  online,
  doneToday,
  last,
  onPress,
  nudge,
  onNudge
}) {
  const medal = rank <= 3 ? MEDALS[rank - 1] : null;
  const body = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(View, { style: [styles.rankBadge, medal && { backgroundColor: medal.bg, borderColor: medal.ring }] }, /* @__PURE__ */ React.createElement(Text, { style: [styles.rankNum, medal && { color: medal.text }] }, rank)), /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(SocialAvatar, { name: avatarName || name, size: 42, ring: isMe ? COLORS.accent : void 0 }), online && /* @__PURE__ */ React.createElement(View, { style: styles.onlineDot })), /* @__PURE__ */ React.createElement(View, { style: styles.rowInfo }, /* @__PURE__ */ React.createElement(Text, { style: [styles.rowName, isMe && { color: COLORS.accent }], numberOfLines: 1 }, name), (streak > 0 || doneToday) && /* @__PURE__ */ React.createElement(View, { style: styles.rowMetaLine }, streak > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(StreakFlame, { size: 13 }), /* @__PURE__ */ React.createElement(Text, { style: styles.rowMetaStrong }, streak)), doneToday && /* @__PURE__ */ React.createElement(Text, { style: styles.rowMetaDone }, streak > 0 ? " \xB7 " : "", "done today"))), /* @__PURE__ */ React.createElement(Text, { style: [styles.xpValue, isMe && { color: COLORS.accent }] }, xp.toLocaleString(), " XP"), nudge && onNudge && /* @__PURE__ */ React.createElement(NudgeButton, { state: nudge, name, onPress: onNudge }));
  const style = [styles.row, isMe && styles.rowSelf, !last && styles.rowDivider];
  return onPress ? /* @__PURE__ */ React.createElement(TouchableOpacity, { style, onPress, activeOpacity: 0.75, accessibilityRole: "button", accessibilityLabel: `${name}, ${xp} XP. Open` }, body) : /* @__PURE__ */ React.createElement(View, { style }, body);
}
function NudgeButton({ state, name, onPress }) {
  if (state === "done") {
    return /* @__PURE__ */ React.createElement(View, { style: [styles.nudgeBtn, styles.nudgeBtnDone], accessibilityLabel: `${name} studied today` }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "check-bold", size: 18, color: "#FFFFFF" }));
  }
  if (state === "nudged") {
    return /* @__PURE__ */ React.createElement(View, { style: [styles.nudgeBtn, styles.nudgeBtnOff], accessibilityLabel: `${name} was nudged today` }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "hand-wave", size: 18, color: COLORS.textMuted }));
  }
  return /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.nudgeBtn, onPress, activeOpacity: 0.8, accessibilityRole: "button", accessibilityLabel: `Nudge ${name}` }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "hand-wave", size: 19, color: COLORS.accent }));
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  nameCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: COLORS.accent + "30"
  },
  nameCardTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nameInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bg1,
    color: COLORS.textPrimary,
    fontSize: 16
  },
  nameSave: {
    height: 44,
    minWidth: 72,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center"
  },
  nameSaveText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 },
  headerBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.bg1, alignItems: "center", justifyContent: "center" },
  headerTitle: { ...TYPE.hero, fontSize: 22, color: COLORS.textPrimary },
  headerSub: { fontSize: 11, fontWeight: "700", color: COLORS.accent, letterSpacing: 0.4, marginTop: 1 },
  badgeDot: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: COLORS.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.bg0
  },
  badgeDotText: { fontSize: 10, fontWeight: "800", color: "#FFF" },
  // Tabs: one segmented control
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 14, padding: 4, borderRadius: 16, backgroundColor: COLORS.bg1 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 38, borderRadius: 12 },
  tabActive: { backgroundColor: COLORS.bg2, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: "800", color: COLORS.textMuted },
  tabTextActive: { color: COLORS.textPrimary },
  scrollContent: { paddingHorizontal: 16 },
  card: { borderRadius: 22, padding: 14, gap: 10, marginBottom: 16, backgroundColor: COLORS.bg2, borderWidth: 2, borderBottomWidth: 5, borderColor: COLORS.border },
  cardKicker: { fontSize: 12, fontWeight: "900", letterSpacing: 0.8, color: COLORS.accent, textTransform: "uppercase" },
  requestRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  declineBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  section: { marginBottom: 16, gap: 10 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: COLORS.textMuted, letterSpacing: 0.8, textTransform: "uppercase" },
  sectionAction: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, height: 30, borderRadius: 15, backgroundColor: COLORS.accentSoft },
  sectionActionText: { fontSize: 13, fontWeight: "800", color: COLORS.accent },
  raceEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.bg2,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: COLORS.border
  },
  raceEmptyDisc: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
  raceEmptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  raceEmptySub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
  // Leaderboard
  board: { borderRadius: 22, marginBottom: 16, backgroundColor: COLORS.bg2, borderWidth: 2, borderBottomWidth: 5, borderColor: COLORS.border, overflow: "hidden" },
  boardHead: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  boardTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textPrimary },
  boardSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  rankChip: { paddingHorizontal: 12, height: 30, borderRadius: 15, backgroundColor: COLORS.accentSoft, borderWidth: 1.5, borderColor: COLORS.accentMedium, alignItems: "center", justifyContent: "center" },
  rankChipText: { fontSize: 13, fontWeight: "900", color: COLORS.accent },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, minHeight: 64 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  rowSelf: { backgroundColor: COLORS.accentSoft },
  rankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  rankNum: { fontSize: 14, fontWeight: "900", color: COLORS.textMuted },
  onlineDot: { position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.bg2 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  rowMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  rowMetaLine: { flexDirection: "row", alignItems: "center", marginTop: 2, gap: 2 },
  rowMetaStrong: { fontSize: 12, fontWeight: "800", color: COLORS.streak },
  rowMetaDone: { fontSize: 12, fontWeight: "700", color: COLORS.success },
  xpValue: { fontSize: 15, fontWeight: "900", color: COLORS.textPrimary },
  nudgeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accentSoft,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: COLORS.accentMedium
  },
  nudgeBtnOff: { backgroundColor: COLORS.bg1, borderColor: COLORS.border },
  nudgeBtnDone: { backgroundColor: COLORS.success, borderColor: "#15803D" },
  // Global hero
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.accentSoft,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.accentMedium,
    marginBottom: 14
  },
  heroLeo: { width: 92, height: 72, borderRadius: 14 },
  heroKicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1, color: COLORS.accent },
  heroValue: { fontSize: 28, fontWeight: "800", color: COLORS.textPrimary, marginTop: 2 },
  heroUnit: { fontSize: 14, fontWeight: "700", color: COLORS.textSecondary },
  heroLine: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3, lineHeight: 17 },
  heroAccent: { color: COLORS.accent, fontWeight: "800" },
  // Podium
  podium: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 14 },
  podiumCol: { flex: 1, alignItems: "center" },
  podiumName: { fontSize: 12, fontWeight: "800", color: COLORS.textPrimary, marginTop: 4, marginBottom: 4, maxWidth: "95%" },
  podiumBlock: { width: "100%", borderRadius: 16, borderWidth: 1.5, alignItems: "center", justifyContent: "center", gap: 1 },
  podiumRank: { fontSize: 18, fontWeight: "800" },
  podiumXP: { fontSize: 11, fontWeight: "700" },
  // Empty state
  emptyState: { alignItems: "center", paddingTop: 24, gap: 4 },
  emptyLeo: { width: 130, height: 130, marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: COLORS.textPrimary },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginBottom: 14 },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.bg2,
    alignItems: "center",
    ...SHADOWS.md
  },
  toastText: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary, textAlign: "center" }
});
export {
  daysLeftInMonth,
  FriendsScreen as default
};
