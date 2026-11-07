import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Share,
  Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { inviteMessage, acceptInvite, normalizeInviteCode, inviteToast } from "../lib/invites";
import { COLORS, TYPE } from "../lib/constants";
import { getMarketName } from "../lib/markets";
import { useFriends } from "../hooks/useFriends";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { triggerHaptic } from "../lib/haptics";
import { trackEvent } from "../lib/analytics";
import { Feather } from "@expo/vector-icons";
import { getMonthlyStandings, myFriendRaceXP, standingName } from "../lib/socialStandings";
import { log } from "../lib/logger";
import { useFriendSocial } from "../hooks/useFriendSocial";
import { FriendStreaksCard } from "../components/social/FriendStreaksCard";
import { StreakSheet } from "../components/social/StreakSheet";
import { RaceCard } from "../components/social/RaceCard";
import { FriendPicker } from "../components/social/FriendPicker";
import { RewardCelebration } from "../components/social/RewardCelebration";
import { firstName, raceIsOver } from "../lib/friendSocial";
const SOCIAL_HERO = require("../assets/illustrations/friends-rivals-hero.png");
const LEO_SASSY = require("../assets/mascot/leo-sassy.png");
const MEDALS = [
  { bg: "#FEF3C7", ring: "#F59E0B", text: "#B45309" },
  { bg: "#EEF2F7", ring: "#9CA3AF", text: "#4B5563" },
  { bg: "#FFEDD5", ring: "#FB923C", text: "#C2410C" }
];
function startOfMonth() {
  const start = /* @__PURE__ */ new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState("friends");
  const [globalEntries, setGlobalEntries] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [myStats, setMyStats] = useState({ xp: 0, level: 1, streak: 0, monthXP: 0 });
  const [nudgingId, setNudgingId] = useState(null);
  const [nudgedIds, setNudgedIds] = useState(/* @__PURE__ */ new Set());
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
    });
  }, [user]);
  const [needsName, setNeedsName] = useState(false);
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
  const handleRedeemCode = async () => {
    const code = normalizeInviteCode(inviteCodeInput);
    if (!code) {
      showToast("That invite code isn't valid");
      return;
    }
    if (redeeming) return;
    triggerHaptic("light");
    setRedeeming(true);
    const result = await acceptInvite(code);
    setRedeeming(false);
    showToast(inviteToast(result) || "");
    if (result.status === "connected" || result.status === "already") {
      setInviteCodeInput("");
      void refetch();
    }
  };
  const searchSeq = useRef(0);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError(false);
      return;
    }
    const seq = ++searchSeq.current;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const found = await searchPeople(q);
        if (seq !== searchSeq.current) return;
        setResults(found);
        setSearchError(false);
      } catch (err) {
        if (seq !== searchSeq.current) return;
        log.warn("Friend search failed", err);
        setResults([]);
        setSearchError(true);
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, searchPeople]);
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
  const handleShareCode = async () => {
    if (!myFriendCode) return;
    triggerHaptic("light");
    try {
      await Share.share({ message: inviteMessage(marketName, myFriendCode) });
    } catch (e) {
    }
  };
  const handleNudge = async (friend) => {
    if (nudgingId || friend.nudgedToday || nudgedIds.has(friend.id)) return;
    triggerHaptic("medium");
    setNudgingId(friend.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-nudge", {
        body: { friendId: friend.id }
      });
      if (error) throw error;
      setNudgedIds((prev) => new Set(prev).add(friend.id));
      if (data?.status === "already") {
        showToast(`You already nudged ${friend.username} today`);
      } else {
        trackEvent("nudge_sent", { to: friend.id, status: data?.status });
        showToast(`${friend.username} will see your nudge`);
      }
    } catch (error) {
      log.warn("Friend nudge failed", error);
      const offline = error?.name === "FunctionsFetchError";
      showToast(offline ? "Nudge not sent. Check your connection." : "Nudge not sent. Please try again later.");
    } finally {
      setNudgingId(null);
    }
  };
  const streaks = social.social?.streaks ?? [];
  const races = social.social?.races ?? [];
  const openStreak = streaks.find((s) => s.id === openStreakId) ?? null;
  const nudgeStateFor = (friendId, nudgedToday) => nudgingId === friendId ? "sending" : nudgedToday || nudgedIds.has(friendId) ? "nudged" : "idle";
  const nudgeById = (friendId) => {
    const friend = friends.find((f) => f.id === friendId);
    if (friend) void handleNudge(friend);
  };
  const pickerFriends = friends.map((f) => {
    const streak = streaks.find((s) => s.friend_id === f.id);
    const race = races.find((r) => r.friend_id === f.id && (r.status === "pending" || r.status === "active" && !raceIsOver(r)));
    return {
      id: f.id,
      name: f.username,
      meta: [f.currentStreak > 0 ? `${f.currentStreak}-day streak` : null, f.selectedMarket ? getMarketName(f.selectedMarket) : null].filter(Boolean).join(" \xB7 ") || `Lv.${f.currentLevel}`,
      taken: pickerMode === "streak" ? streak ? streak.status === "pending" ? streak.invited_by_me ? "Invited" : "Invited you" : "Streak on" : void 0 : race ? race.status === "pending" ? race.challenged_by_me ? "Challenged" : "Challenged you" : "Racing" : void 0
    };
  });
  const openPicker = (mode) => {
    triggerHaptic("light");
    setPickerError(null);
    setPickerMode(mode);
  };
  const pickFriend = async (friendId) => {
    const mode = pickerMode;
    const name = friends.find((f) => f.id === friendId)?.username ?? "your friend";
    const result = mode === "streak" ? await social.startStreak(friendId) : await social.challengeRace(friendId);
    if (result.error) {
      setPickerError(result.error);
      return;
    }
    triggerHaptic("success");
    setPickerMode(null);
    showToast(mode === "streak" ? `Streak invite sent to ${name}` : `Challenge sent to ${name}`);
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
  const handleRemove = (friend) => {
    Alert.alert("Remove friend?", `Remove ${friend.username}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const result = await removeFriend(friend.friendshipId);
          if (!result.success) showToast("Could not remove friend. Please try again.");
        }
      }
    ]);
  };
  const handleShareInvite = async () => {
    triggerHaptic("light");
    try {
      const message = myFriendCode ? inviteMessage(marketName, myFriendCode) : `I'm learning ${marketName || "industries"} on MarketLingo, 5 minutes a day. Join me: https://market-verse.com`;
      await Share.share({ message });
    } catch (e) {
    }
  };
  const isActive = (friend) => {
    if (!friend.lastActivityAt) return false;
    return (Date.now() - new Date(friend.lastActivityAt).getTime()) / (1e3 * 60 * 60) < 24;
  };
  return /* @__PURE__ */ React.createElement(View, { style: [styles.container, { paddingTop: insets.top }] }, /* @__PURE__ */ React.createElement(View, { style: styles.header }, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.backBtn, onPress: () => router.back() }, /* @__PURE__ */ React.createElement(Feather, { name: "arrow-left", size: 18, color: COLORS.textPrimary })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.headerTitle }, "Standings"), !!marketName && /* @__PURE__ */ React.createElement(Text, { style: styles.headerSub }, marketName)), pendingRequests.length > 0 && /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      style: styles.requestsBadge,
      accessibilityLabel: `${pendingRequests.length} friend requests`,
      onPress: () => {
        triggerHaptic("light");
        setActiveTab("friends");
      }
    },
    /* @__PURE__ */ React.createElement(Feather, { name: "bell", size: 16, color: COLORS.accent }),
    /* @__PURE__ */ React.createElement(View, { style: styles.badgeDot }, /* @__PURE__ */ React.createElement(Text, { style: styles.badgeDotText }, pendingRequests.length))
  ), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.shareBtn, onPress: handleShareInvite }, /* @__PURE__ */ React.createElement(Feather, { name: "share-2", size: 16, color: COLORS.accent }))), /* @__PURE__ */ React.createElement(View, { style: styles.tabRow }, ["friends", "global"].map((tab) => /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      key: tab,
      style: [styles.tab, activeTab === tab && styles.tabActive],
      onPress: () => {
        triggerHaptic("light");
        setActiveTab(tab);
      }
    },
    /* @__PURE__ */ React.createElement(
      Feather,
      {
        name: tab === "friends" ? "users" : "globe",
        size: 14,
        color: activeTab === tab ? "#FFF" : COLORS.textMuted
      }
    ),
    /* @__PURE__ */ React.createElement(Text, { style: [styles.tabText, activeTab === tab && styles.tabTextActive] }, tab === "friends" ? `Friends (${friends.length})` : "Global")
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
    ))), activeTab === "friends" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(View, { style: styles.heroCard }, /* @__PURE__ */ React.createElement(Image, { source: SOCIAL_HERO, style: styles.heroLeo, resizeMode: "cover" }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.heroKicker }, "THIS MONTH \xB7 ALL INDUSTRIES"), /* @__PURE__ */ React.createElement(Text, { style: styles.heroValue }, myStats.monthXP.toLocaleString(), /* @__PURE__ */ React.createElement(Text, { style: styles.heroUnit }, " XP")), /* @__PURE__ */ React.createElement(Text, { style: styles.heroLine }, friends.length === 0 ? "Add a friend and this becomes a race." : /* @__PURE__ */ React.createElement(React.Fragment, null, "You sit ", /* @__PURE__ */ React.createElement(Text, { style: styles.heroAccent }, "#", myFriendRank), " of ", friendsBoard.length, ".")))), social.available && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(FriendStreaksCard, { streaks, onOpen: (s) => {
      triggerHaptic("light");
      setOpenStreakId(s.id);
    }, onInvite: () => openPicker("streak") }), /* @__PURE__ */ React.createElement(View, { style: styles.section }, /* @__PURE__ */ React.createElement(View, { style: styles.racesHead }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionTitle }, "Races"), races.length > 0 && /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => openPicker("race"), style: styles.racesNew, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Feather, { name: "flag", size: 13, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.racesNewText }, "Challenge"))), races.length === 0 ? /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.raceEmpty, onPress: () => openPicker("race"), activeOpacity: 0.88, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(View, { style: styles.raceEmptyDisc }, /* @__PURE__ */ React.createElement(Feather, { name: "flag", size: 20, color: "#FFFFFF" })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.raceEmptyTitle }, "Race a friend this week"), /* @__PURE__ */ React.createElement(Text, { style: styles.raceEmptySub }, "7 days of XP from any industry. Winner takes +100 XP.")), /* @__PURE__ */ React.createElement(Feather, { name: "chevron-right", size: 18, color: COLORS.accent })) : races.map((race) => /* @__PURE__ */ React.createElement(
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
        onNudge: () => nudgeById(race.friend_id),
        onRematch: () => {
          void social.challengeRace(race.friend_id).then((r) => showToast(r.error || `Rematch sent to ${firstName(race)}`));
        }
      }
    )))), pendingRequests.length > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.section }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionTitle }, "Friend requests (", pendingRequests.length, ")"), pendingRequests.map((r) => /* @__PURE__ */ React.createElement(View, { key: r.id, style: styles.personRow }, /* @__PURE__ */ React.createElement(View, { style: styles.avatar }, /* @__PURE__ */ React.createElement(Text, { style: styles.avatarText }, r.fromUsername.charAt(0).toUpperCase())), /* @__PURE__ */ React.createElement(View, { style: styles.rowInfo }, /* @__PURE__ */ React.createElement(Text, { style: styles.rowName, numberOfLines: 1 }, r.fromUsername), !!r.fromMarket && /* @__PURE__ */ React.createElement(Text, { style: styles.rowMeta, numberOfLines: 1 }, getMarketName(r.fromMarket))), busyId === r.id ? /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "small", color: COLORS.accent }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: [styles.pill, styles.pillGhost], onPress: () => handleDecline(r.id), accessibilityLabel: `Decline ${r.fromUsername}` }, /* @__PURE__ */ React.createElement(Text, { style: styles.pillGhostText }, "Decline")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.pill, onPress: () => handleAccept(r.id), accessibilityLabel: `Accept ${r.fromUsername}` }, /* @__PURE__ */ React.createElement(Text, { style: styles.pillText }, "Accept")))))), sentRequests.length > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.section }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionTitle }, "Sent"), sentRequests.map((r) => /* @__PURE__ */ React.createElement(View, { key: r.id, style: styles.personRow }, /* @__PURE__ */ React.createElement(View, { style: styles.avatar }, /* @__PURE__ */ React.createElement(Text, { style: styles.avatarText }, r.toUsername.charAt(0).toUpperCase())), /* @__PURE__ */ React.createElement(View, { style: styles.rowInfo }, /* @__PURE__ */ React.createElement(Text, { style: styles.rowName, numberOfLines: 1 }, r.toUsername), /* @__PURE__ */ React.createElement(Text, { style: styles.rowMeta, numberOfLines: 1 }, r.toMarket ? `${getMarketName(r.toMarket)} \xB7 ` : "", "Waiting")), busyId === r.id ? /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "small", color: COLORS.accent }) : /* @__PURE__ */ React.createElement(TouchableOpacity, { style: [styles.pill, styles.pillGhost], onPress: () => handleCancelSent(r.id), accessibilityLabel: `Cancel request to ${r.toUsername}` }, /* @__PURE__ */ React.createElement(Text, { style: styles.pillGhostText }, "Cancel"))))), !!myFriendCode && /* @__PURE__ */ React.createElement(View, { style: styles.codeCard }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.codeKicker }, "YOUR FRIEND CODE"), /* @__PURE__ */ React.createElement(Text, { style: styles.codeValue, selectable: true }, myFriendCode), /* @__PURE__ */ React.createElement(Text, { style: styles.rowMeta }, "Hold the code to copy it.")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.pill, onPress: handleShareCode, accessibilityLabel: "Share your friend code" }, /* @__PURE__ */ React.createElement(Feather, { name: "share", size: 13, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.pillText }, "Share"))), /* @__PURE__ */ React.createElement(View, { style: styles.addRow }, /* @__PURE__ */ React.createElement(Feather, { name: "search", size: 16, color: COLORS.textMuted }), /* @__PURE__ */ React.createElement(
      TextInput,
      {
        style: styles.addInput,
        placeholder: "Add friends by name or code",
        placeholderTextColor: COLORS.textMuted,
        value: query,
        onChangeText: setQuery,
        autoCapitalize: "none",
        autoCorrect: false,
        returnKeyType: "search",
        clearButtonMode: "while-editing"
      }
    ), searching && /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "small", color: COLORS.accent })), /* @__PURE__ */ React.createElement(View, { style: styles.addRow }, /* @__PURE__ */ React.createElement(Feather, { name: "gift", size: 16, color: COLORS.textMuted }), /* @__PURE__ */ React.createElement(
      TextInput,
      {
        style: styles.addInput,
        placeholder: "Got an invite code?",
        placeholderTextColor: COLORS.textMuted,
        value: inviteCodeInput,
        onChangeText: (t) => setInviteCodeInput(t.toUpperCase()),
        autoCapitalize: "characters",
        autoCorrect: false,
        maxLength: 12,
        returnKeyType: "done",
        onSubmitEditing: handleRedeemCode
      }
    ), redeeming ? /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "small", color: COLORS.accent }) : inviteCodeInput.trim().length >= 4 ? /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.pill, onPress: handleRedeemCode, accessibilityLabel: "Use invite code" }, /* @__PURE__ */ React.createElement(Text, { style: styles.pillText }, "Join")) : null), query.trim().length >= 2 && !searching && /* @__PURE__ */ React.createElement(View, { style: styles.section }, searchError ? /* @__PURE__ */ React.createElement(Text, { style: styles.emptySub }, "Search is unavailable right now. Please try again.") : results.length === 0 ? /* @__PURE__ */ React.createElement(View, { style: styles.noResults }, /* @__PURE__ */ React.createElement(Text, { style: styles.emptySub }, "No one found. Send them your invite link"), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.pill, onPress: handleShareInvite }, /* @__PURE__ */ React.createElement(Feather, { name: "share-2", size: 13, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.pillText }, "Share"))) : results.map((p) => {
      const isFriend = friendIds.has(p.id);
      const sent = sentRequests.some((r) => r.toUserId === p.id);
      const incoming = pendingRequests.some((r) => r.fromUserId === p.id);
      return /* @__PURE__ */ React.createElement(View, { key: p.id, style: styles.personRow }, /* @__PURE__ */ React.createElement(View, { style: styles.avatar }, /* @__PURE__ */ React.createElement(Text, { style: styles.avatarText }, p.displayName.charAt(0).toUpperCase())), /* @__PURE__ */ React.createElement(View, { style: styles.rowInfo }, /* @__PURE__ */ React.createElement(Text, { style: styles.rowName, numberOfLines: 1 }, p.displayName), /* @__PURE__ */ React.createElement(Text, { style: styles.rowMeta, numberOfLines: 1 }, [p.friendCode, p.selectedMarket ? getMarketName(p.selectedMarket) : null].filter(Boolean).join(" \xB7 "))), isFriend ? /* @__PURE__ */ React.createElement(Text, { style: styles.nudgeDone }, "Friends \u2713") : busyId === p.id ? /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "small", color: COLORS.accent }) : /* @__PURE__ */ React.createElement(
        TouchableOpacity,
        {
          style: [styles.pill, sent && styles.pillGhost],
          onPress: () => handleAdd(p),
          accessibilityLabel: sent ? `Cancel request to ${p.displayName}` : `Add ${p.displayName}`
        },
        /* @__PURE__ */ React.createElement(Text, { style: sent ? styles.pillGhostText : styles.pillText }, sent ? "Requested" : incoming ? "Accept" : "Add")
      ));
    })), loading ? /* @__PURE__ */ React.createElement(ActivityIndicator, { color: COLORS.accent, size: "large", style: { marginTop: 60 } }) : friendsError ? /* @__PURE__ */ React.createElement(View, { style: styles.emptyState }, /* @__PURE__ */ React.createElement(Feather, { name: "wifi-off", size: 32, color: COLORS.textMuted }), /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, "Friends unavailable"), /* @__PURE__ */ React.createElement(Text, { style: styles.emptySub }, friendsError), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.inviteBtn, onPress: refetch }, /* @__PURE__ */ React.createElement(Feather, { name: "refresh-cw", size: 14, color: "#FFF" }), /* @__PURE__ */ React.createElement(Text, { style: styles.inviteBtnText }, "Try again"))) : friends.length === 0 ? /* @__PURE__ */ React.createElement(View, { style: styles.emptyState }, /* @__PURE__ */ React.createElement(Image, { source: LEO_SASSY, style: styles.emptyLeo, resizeMode: "contain" }), /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, "Racing alone is easy."), /* @__PURE__ */ React.createElement(Text, { style: styles.emptySub }, "Invite one friend and make this month a race."), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.inviteBtn, onPress: handleShareInvite }, /* @__PURE__ */ React.createElement(Feather, { name: "share-2", size: 14, color: "#FFF" }), /* @__PURE__ */ React.createElement(Text, { style: styles.inviteBtnText }, "Invite friends"))) : /* @__PURE__ */ React.createElement(View, { style: styles.list }, friendsBoard.map((row, idx) => /* @__PURE__ */ React.createElement(
      BoardRow,
      {
        key: row.id,
        rank: idx + 1,
        name: row.name,
        initial: row.initial,
        xp: row.xp,
        meta: `Lv.${row.level}${row.streak > 0 ? ` \xB7 ${row.streak}d streak` : ""}${row.monthXP > 0 ? ` \xB7 ${row.monthXP} this month` : ""}`,
        isMe: row.isMe,
        online: row.friend ? isActive(row.friend) : false,
        onNudge: row.friend ? () => handleNudge(row.friend) : void 0,
        nudgeState: !row.friend ? void 0 : row.friend.lessonDoneToday ? "done" : row.friend.nudgedToday || nudgedIds.has(row.friend.id) ? "nudged" : nudgingId === row.friend.id ? "sending" : "idle",
        onMore: row.friend ? () => handleRemove(row.friend) : void 0
      }
    )))), activeTab === "global" && /* @__PURE__ */ React.createElement(React.Fragment, null, !globalLoading && globalEntries.length > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.heroCard }, /* @__PURE__ */ React.createElement(Image, { source: SOCIAL_HERO, style: styles.heroLeo, resizeMode: "cover" }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.heroKicker }, marketName.toUpperCase()), /* @__PURE__ */ React.createElement(Text, { style: styles.heroValue }, currentUserRank ? /* @__PURE__ */ React.createElement(React.Fragment, null, "#", currentUserRank, /* @__PURE__ */ React.createElement(Text, { style: styles.heroUnit }, " of ", globalEntries.length)) : "Unranked"), /* @__PURE__ */ React.createElement(Text, { style: styles.heroLine }, currentUserRank === 1 ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Top of the market. ", /* @__PURE__ */ React.createElement(Text, { style: styles.heroAccent }, "Hold it.")) : currentUserRank ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Next spot costs ", /* @__PURE__ */ React.createElement(Text, { style: styles.heroAccent }, Math.max(1, (globalEntries[currentUserRank - 2]?.total_xp || 0) - (globalEntries[currentUserRank - 1]?.total_xp || 0) + 1), " XP"), ".") : "One lesson puts you on the board."))), !globalLoading && globalEntries.length >= 3 && /* @__PURE__ */ React.createElement(View, { style: styles.podium }, [1, 0, 2].map((i) => {
      const e = globalEntries[i];
      const m = MEDALS[i];
      const h = i === 0 ? 76 : i === 1 ? 60 : 50;
      return /* @__PURE__ */ React.createElement(View, { key: e.user_id, style: styles.podiumCol }, /* @__PURE__ */ React.createElement(View, { style: [styles.podiumAvatar, { borderColor: m.ring }] }, /* @__PURE__ */ React.createElement(Text, { style: styles.podiumInitial }, e.username.charAt(0).toUpperCase())), /* @__PURE__ */ React.createElement(Text, { style: styles.podiumName, numberOfLines: 1 }, e.isCurrentUser ? "You" : e.username), /* @__PURE__ */ React.createElement(View, { style: [styles.podiumBlock, { height: h, backgroundColor: m.bg, borderColor: m.ring + "55" }] }, /* @__PURE__ */ React.createElement(Text, { style: [styles.podiumRank, { color: m.text }] }, i + 1), /* @__PURE__ */ React.createElement(Text, { style: [styles.podiumXP, { color: m.text }] }, e.total_xp.toLocaleString())));
    })), globalLoading ? /* @__PURE__ */ React.createElement(ActivityIndicator, { color: COLORS.accent, size: "large", style: { marginTop: 60 } }) : globalError ? /* @__PURE__ */ React.createElement(View, { style: styles.emptyState }, /* @__PURE__ */ React.createElement(Feather, { name: "wifi-off", size: 32, color: COLORS.textMuted }), /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, "Standings unavailable"), /* @__PURE__ */ React.createElement(Text, { style: styles.emptySub }, globalError), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.inviteBtn, onPress: fetchGlobalLeaderboard }, /* @__PURE__ */ React.createElement(Feather, { name: "refresh-cw", size: 14, color: COLORS.textOnAccent }), /* @__PURE__ */ React.createElement(Text, { style: styles.inviteBtnText }, "Try again"))) : globalEntries.length === 0 ? /* @__PURE__ */ React.createElement(View, { style: styles.emptyState }, /* @__PURE__ */ React.createElement(Image, { source: LEO_SASSY, style: styles.emptyLeo, resizeMode: "contain" }), /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, "No one has scored this month yet."), /* @__PURE__ */ React.createElement(Text, { style: styles.emptySub }, "Finish one lesson and you take first place.")) : /* @__PURE__ */ React.createElement(View, { style: styles.list }, globalEntries.map((entry) => /* @__PURE__ */ React.createElement(
      BoardRow,
      {
        key: entry.user_id,
        rank: entry.rank,
        name: entry.isCurrentUser ? "You" : entry.username,
        initial: entry.username.charAt(0).toUpperCase(),
        xp: entry.total_xp,
        meta: `Lv.${entry.current_level}${entry.current_streak > 0 ? ` \xB7 ${entry.current_streak}d streak` : ""}`,
        isMe: entry.isCurrentUser
      }
    )))))
  ), /* @__PURE__ */ React.createElement(
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
      onNudge: () => openStreak && nudgeById(openStreak.friend_id),
      onEnd: () => {
        if (openStreak) {
          void social.endStreak(openStreak.id);
          setOpenStreakId(null);
        }
      },
      onStudy: () => {
        setOpenStreakId(null);
        router.push("/(tabs)/home");
      }
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
      onAddFriends: () => {
        setPickerMode(null);
      }
    }
  ), /* @__PURE__ */ React.createElement(RewardCelebration, { reward, onClose: () => setReward(null) }), toast && /* @__PURE__ */ React.createElement(View, { pointerEvents: "none", style: [styles.toast, { bottom: insets.bottom + 24 }] }, /* @__PURE__ */ React.createElement(Text, { style: styles.toastText }, toast)));
}
function BoardRow({
  rank,
  name,
  initial,
  xp,
  meta,
  isMe,
  online,
  onNudge,
  onMore,
  nudgeState = "idle"
}) {
  const medal = rank <= 3 ? MEDALS[rank - 1] : null;
  return /* @__PURE__ */ React.createElement(View, { style: [styles.row, isMe && styles.rowSelf, medal && { borderColor: medal.ring + "45" }] }, /* @__PURE__ */ React.createElement(View, { style: [styles.rankBadge, { backgroundColor: medal ? medal.bg : COLORS.bg1 }] }, /* @__PURE__ */ React.createElement(Text, { style: [styles.rankNum, { color: medal ? medal.text : COLORS.textMuted }] }, rank)), /* @__PURE__ */ React.createElement(View, { style: [styles.avatar, isMe && { borderColor: COLORS.accent }] }, /* @__PURE__ */ React.createElement(Text, { style: styles.avatarText }, initial), online && /* @__PURE__ */ React.createElement(View, { style: styles.onlineDot })), /* @__PURE__ */ React.createElement(View, { style: styles.rowInfo }, /* @__PURE__ */ React.createElement(Text, { style: [styles.rowName, isMe && { color: COLORS.accent }], numberOfLines: 1 }, name), /* @__PURE__ */ React.createElement(Text, { style: styles.rowMeta, numberOfLines: 1 }, meta)), /* @__PURE__ */ React.createElement(View, { style: styles.xpBadge }, /* @__PURE__ */ React.createElement(Text, { style: [styles.xpValue, isMe && { color: COLORS.accent }] }, xp.toLocaleString()), /* @__PURE__ */ React.createElement(Text, { style: styles.xpLabel }, "XP")), onNudge && (nudgeState === "done" ? /* @__PURE__ */ React.createElement(Text, { style: styles.nudgeDone }, "Done today \u2713") : nudgeState === "nudged" ? /* @__PURE__ */ React.createElement(View, { style: [styles.nudgePill, styles.nudgePillOff] }, /* @__PURE__ */ React.createElement(Text, { style: [styles.nudgePillText, styles.nudgePillTextOff] }, "Nudged \u2713")) : /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.nudgePill, onPress: onNudge, disabled: nudgeState === "sending", accessibilityLabel: `Nudge ${name}` }, nudgeState === "sending" ? /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "small", color: COLORS.accent }) : /* @__PURE__ */ React.createElement(Text, { style: styles.nudgePillText }, "Nudge"))), onMore && /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.moreBtn, onPress: onMore, onLongPress: onMore }, /* @__PURE__ */ React.createElement(Feather, { name: "more-horizontal", size: 14, color: COLORS.textMuted })));
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  nameCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.accent + "30"
  },
  nameCardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 10 },
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg1,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: { ...TYPE.hero, fontSize: 22, color: COLORS.textPrimary },
  headerSub: { fontSize: 11, fontWeight: "700", color: COLORS.accent, letterSpacing: 0.4, marginTop: 1 },
  requestsBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg1,
    alignItems: "center",
    justifyContent: "center"
  },
  badgeDot: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  badgeDotText: { fontSize: 9, fontWeight: "700", color: "#FFF" },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg1,
    alignItems: "center",
    justifyContent: "center"
  },
  // Tabs
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 14 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.bg1
  },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  tabTextActive: { color: "#FFF" },
  scrollContent: { paddingHorizontal: 16 },
  // Hero card
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
  podiumAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2.5,
    backgroundColor: COLORS.bg2,
    alignItems: "center",
    justifyContent: "center"
  },
  podiumInitial: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  podiumName: { fontSize: 11, fontWeight: "700", color: COLORS.textPrimary, marginTop: 4, marginBottom: 4, maxWidth: "95%" },
  podiumBlock: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    gap: 1
  },
  podiumRank: { fontSize: 18, fontWeight: "800" },
  podiumXP: { fontSize: 11, fontWeight: "700" },
  // Add friend
  addFriendToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORS.bg1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    marginBottom: 12
  },
  addFriendToggleText: { fontSize: 13, fontWeight: "700", color: COLORS.accent },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    height: 46,
    backgroundColor: COLORS.bg1,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  addInput: { flex: 1, height: 46, fontSize: 14, color: COLORS.textPrimary },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center"
  },
  // Empty state
  emptyState: { alignItems: "center", paddingTop: 24 },
  emptyLeo: { width: 130, height: 130, marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 4 },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginBottom: 18 },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14
  },
  inviteBtnText: { fontSize: 14, fontWeight: "800", color: "#FFF" },
  // Rows
  list: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.bg2,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border
  },
  rowSelf: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accentMedium },
  rankBadge: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  rankNum: { fontSize: 13, fontWeight: "800" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.border
  },
  avatarText: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.bg2
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  rowMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  xpBadge: { alignItems: "flex-end" },
  xpValue: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  xpLabel: { fontSize: 9, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase" },
  nudgePill: {
    minWidth: 68,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: COLORS.accentMedium,
    alignItems: "center",
    justifyContent: "center"
  },
  nudgePillOff: { backgroundColor: COLORS.bg1, opacity: 0.7 },
  nudgePillText: { fontSize: 12, fontWeight: "700", color: COLORS.accent },
  nudgePillTextOff: { color: COLORS.textMuted },
  nudgeDone: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  section: { marginBottom: 14, gap: 8 },
  racesHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  racesNew: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: COLORS.accentSoft },
  racesNewText: { fontSize: 12, fontWeight: "800", color: COLORS.accent },
  raceEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1.5,
    borderColor: COLORS.accentMedium
  },
  raceEmptyDisc: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
  raceEmptyTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  raceEmptySub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.4, textTransform: "uppercase" },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: COLORS.bg2
  },
  pill: {
    flexDirection: "row",
    gap: 5,
    minWidth: 64,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.accentMedium,
    alignItems: "center",
    justifyContent: "center"
  },
  pillText: { fontSize: 12, fontWeight: "700", color: COLORS.accent },
  pillGhost: { backgroundColor: COLORS.bg1 },
  pillGhostText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  codeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.accentSoft
  },
  codeKicker: { fontSize: 10, fontWeight: "800", color: COLORS.accent, letterSpacing: 0.6 },
  codeValue: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: 3, marginVertical: 2 },
  noResults: { alignItems: "center", gap: 10, paddingVertical: 8 },
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.bg2,
    alignItems: "center"
  },
  toastText: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary, textAlign: "center" },
  nudgeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accentMedium,
    alignItems: "center",
    justifyContent: "center"
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg1,
    alignItems: "center",
    justifyContent: "center"
  },
  scopeRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  scopeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.bg1,
    borderWidth: 1.5,
    borderColor: COLORS.border
  },
  scopeChipActive: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accentMedium },
  scopeText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  scopeTextActive: { color: COLORS.accent }
});
export {
  FriendsScreen as default
};
