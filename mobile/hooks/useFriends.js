import { useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { log } from "../lib/logger";
function notifyFriendship(friendshipId, kind) {
  supabase.functions.invoke("friend-request-notify", { body: { friendshipId, kind } }).catch((err) => log.warn("Friend request push failed", err));
}
function useFriends(marketId) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [myFriendCode, setMyFriendCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchFriends = useCallback(async () => {
    if (!user) {
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: overview, error: overviewError } = await supabase.rpc("get_friends_overview");
      if (overviewError) {
        log.warn("Friends overview failed to load", overviewError);
        setError("Friends could not load. Check your connection and try again.");
      } else {
        const friendList = (overview ?? []).map((row) => ({
          id: row.friend_id,
          friendshipId: row.friendship_id,
          username: row.display_name?.trim() || "Analyst",
          friendCode: row.friend_code || null,
          avatarUrl: row.avatar_url || null,
          selectedMarket: row.selected_market || null,
          totalXP: Number(row.month_xp) || 0,
          currentStreak: Number(row.current_streak) || 0,
          currentLevel: Number(row.current_level) || 1,
          lastActivityAt: row.last_activity_at || null,
          lessonDoneToday: !!row.lesson_done_today,
          nudgedToday: !!row.nudged_today
        }));
        friendList.sort((a, b) => b.totalXP - a.totalXP);
        setFriends(friendList);
      }
      try {
        const [{ data: pending, error: pendingError }, { data: me }] = await Promise.all([
          supabase.from("friendships").select("id, user_id, friend_id, created_at").or(`user_id.eq.${user.id},friend_id.eq.${user.id}`).eq("status", "pending"),
          supabase.from("profiles").select("friend_code").eq("id", user.id).maybeSingle()
        ]);
        setMyFriendCode(me?.friend_code ?? null);
        if (pendingError) {
          log.warn("Friend requests failed to load", pendingError);
        } else {
          const rows = pending ?? [];
          const otherIds = rows.map((p) => p.user_id === user.id ? p.friend_id : p.user_id);
          let profiles = [];
          if (otherIds.length) {
            const { data } = await supabase.from("public_profiles").select("id, display_name, selected_market").in("id", otherIds);
            profiles = data ?? [];
          }
          const find = (id) => profiles.find((pr) => pr.id === id);
          setPendingRequests(
            rows.filter((p) => p.friend_id === user.id).map((p) => ({
              id: p.id,
              fromUserId: p.user_id,
              fromUsername: find(p.user_id)?.display_name?.trim() || "Someone",
              fromMarket: find(p.user_id)?.selected_market || null,
              createdAt: p.created_at
            }))
          );
          setSentRequests(
            rows.filter((p) => p.user_id === user.id).map((p) => ({
              id: p.id,
              toUserId: p.friend_id,
              toUsername: find(p.friend_id)?.display_name?.trim() || "Someone",
              toMarket: find(p.friend_id)?.selected_market || null,
              createdAt: p.created_at
            }))
          );
        }
      } catch (pendingErr) {
        log.warn("Friend requests lookup failed", pendingErr);
      }
    } catch (err) {
      log.warn("Friends lookup failed", err);
      setError("Friends could not load. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [user, marketId]);
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);
  const searchPeople = useCallback(async (query) => {
    const q = query.trim();
    if (!user || q.length < 2) return [];
    const { data, error: searchError } = await supabase.rpc("search_public_profiles", { p_query: q });
    if (searchError) throw searchError;
    return (data ?? []).filter((p) => p.id !== user.id).map((p) => ({
      id: p.id,
      displayName: p.display_name?.trim() || "Analyst",
      friendCode: p.friend_code || null,
      avatarUrl: p.avatar_url || null,
      selectedMarket: p.selected_market || null
    }));
  }, [user]);
  const sendRequest = useCallback(async (target) => {
    if (!user) return { success: false, error: "Not signed in" };
    const { data, error: error2 } = await supabase.from("friendships").insert({ user_id: user.id, friend_id: target.id, status: "pending" }).select("id, created_at").single();
    if (error2) {
      if (error2.code === "23505") return { success: false, error: "You already have a request with this person." };
      return { success: false, error: "Request not sent. Please try again." };
    }
    setSentRequests((prev) => [
      ...prev,
      { id: data.id, toUserId: target.id, toUsername: target.displayName, toMarket: target.selectedMarket, createdAt: data.created_at }
    ]);
    notifyFriendship(data.id, "request");
    return { success: true };
  }, [user]);
  const cancelRequest = useCallback(async (friendshipId) => {
    const { error: error2 } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (error2) return { success: false, error: "Could not cancel. Please try again." };
    setSentRequests((prev) => prev.filter((r) => r.id !== friendshipId));
    return { success: true };
  }, []);
  const acceptRequest = useCallback(async (friendshipId) => {
    const { error: error2 } = await supabase.from("friendships").update({ status: "accepted", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", friendshipId);
    if (error2) return { success: false, error: "Could not accept. Please try again." };
    setPendingRequests((prev) => prev.filter((r) => r.id !== friendshipId));
    notifyFriendship(friendshipId, "accepted");
    await fetchFriends();
    return { success: true };
  }, [fetchFriends]);
  const declineRequest = useCallback(async (friendshipId) => {
    const { error: error2 } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (error2) return { success: false, error: error2.message };
    setPendingRequests((prev) => prev.filter((r) => r.id !== friendshipId));
    return { success: true };
  }, []);
  const removeFriend = useCallback(async (friendshipId) => {
    const { error: error2 } = await supabase.from("friendships").delete().eq("id", friendshipId);
    if (error2) return { success: false, error: error2.message };
    await fetchFriends();
    return { success: true };
  }, [fetchFriends]);
  return {
    friends,
    pendingRequests,
    sentRequests,
    myFriendCode,
    loading,
    error,
    searchPeople,
    sendRequest,
    cancelRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    refetch: fetchFriends
  };
}
export {
  useFriends
};
