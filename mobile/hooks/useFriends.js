import { useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { log } from "../lib/logger";
function useFriends(marketId) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchFriends = useCallback(async () => {
    if (!user) {
      setFriends([]);
      setPendingRequests([]);
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
        const { data: pending, error: pendingError } = await supabase.from("friendships").select("id, user_id, created_at").eq("friend_id", user.id).eq("status", "pending");
        if (pendingError) {
          log.warn("Friend requests failed to load", pendingError);
        } else if (!pending?.length) {
          setPendingRequests([]);
        } else {
          const fromIds = pending.map((p) => p.user_id);
          const { data: fromProfiles } = await supabase.from("public_profiles").select("id, display_name").in("id", fromIds);
          setPendingRequests(
            pending.map((p) => ({
              id: p.id,
              fromUserId: p.user_id,
              fromUsername: fromProfiles?.find((pr) => pr.id === p.user_id)?.display_name?.trim() || "Someone",
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
  const sendRequest = useCallback(async (friendIdentifier) => {
    if (!user) return { success: false, error: "Not authenticated" };
    const { data: matches, error: searchError } = await supabase.rpc("search_public_profiles", {
      p_query: friendIdentifier.trim()
    });
    if (searchError) {
      log.warn("Friend search failed", searchError);
      return { success: false, error: "Search is unavailable right now. Please try again." };
    }
    const targetProfile = matches?.[0];
    if (!targetProfile) return { success: false, error: "User not found. Make sure they have an account." };
    const { data: existing } = await supabase.from("friendships").select("id").or(`and(user_id.eq.${user.id},friend_id.eq.${targetProfile.id}),and(user_id.eq.${targetProfile.id},friend_id.eq.${user.id})`).maybeSingle();
    if (existing) return { success: false, error: "Already friends or request pending" };
    const { error: error2 } = await supabase.from("friendships").insert({
      user_id: user.id,
      friend_id: targetProfile.id,
      status: "pending"
    });
    if (error2) return { success: false, error: error2.message };
    return { success: true };
  }, [user]);
  const acceptRequest = useCallback(async (friendshipId) => {
    const { error: error2 } = await supabase.from("friendships").update({ status: "accepted", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", friendshipId);
    if (error2) return { success: false, error: error2.message };
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
    loading,
    error,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    refetch: fetchFriends
  };
}
export {
  useFriends
};
