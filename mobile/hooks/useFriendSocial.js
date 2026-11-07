import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { log } from "../lib/logger";
import { trackEvent } from "../lib/analytics";
import { isMissingFunction, parseFriendSocial } from "../lib/friendSocial";
function useFriendSocial(userId, focused = true) {
  const [social, setSocial] = useState(null);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(null);
  const mounted = useRef(true);
  useEffect(() => () => {
    mounted.current = false;
  }, []);
  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase.rpc("get_friend_social");
    if (!mounted.current) return;
    if (error) {
      if (isMissingFunction(error)) setAvailable(false);
      else log.warn("[FriendSocial] Could not load:", error.message);
      return;
    }
    setAvailable(true);
    setSocial(parseFriendSocial(data));
  }, [userId]);
  useEffect(() => {
    if (focused) void refresh();
  }, [focused, refresh]);
  const act = useCallback(async (key, fn, args, event) => {
    setBusy(key);
    const { data, error } = await supabase.rpc(fn, args);
    if (mounted.current) setBusy(null);
    if (error) {
      log.warn(`[FriendSocial] ${fn} failed:`, error.message);
      return { data: null, error: error.message.replace(/^.*?:\s*/, "") || "Something went wrong. Try again." };
    }
    if (event) trackEvent(event, args);
    await refresh();
    return { data, error: null };
  }, [refresh]);
  const startStreak = (friendId) => act(`streak:${friendId}`, "start_friend_streak", { p_friend: friendId }, "friend_streak_invited");
  const respondStreak = (streakId, accept) => act(`streak:${streakId}`, "respond_friend_streak", { p_streak: streakId, p_accept: accept }, accept ? "friend_streak_accepted" : void 0);
  const endStreak = (streakId) => act(`streak:${streakId}`, "end_friend_streak", { p_streak: streakId });
  const challengeRace = (friendId) => act(`race:${friendId}`, "challenge_friend_race", { p_friend: friendId }, "friend_race_challenged");
  const respondRace = (raceId, accept) => act(`race:${raceId}`, "respond_friend_race", { p_race: raceId, p_accept: accept }, accept ? "friend_race_accepted" : void 0);
  const cancelRace = (raceId) => act(`race:${raceId}`, "cancel_friend_race", { p_race: raceId });
  const claimStreak = async (streakId, friendName) => {
    const { data } = await act(`claim:${streakId}`, "claim_friend_streak_rewards", { p_streak: streakId }, "friend_reward_claimed");
    if (!data || !(Number(data.xp) > 0)) return null;
    return { kind: "streak", xp: Number(data.xp), friendName, milestones: data.milestones, length: Number(data.length) || 0 };
  };
  const claimRace = async (raceId, friendName) => {
    const { data } = await act(
      `claim:${raceId}`,
      "claim_friend_race_reward",
      { p_race: raceId },
      "friend_reward_claimed"
    );
    if (!data || data.already_claimed) return null;
    return { kind: "race", xp: Number(data.xp) || 0, friendName, outcome: data.outcome, myXP: Number(data.my_xp) || 0, friendXP: Number(data.friend_xp) || 0 };
  };
  return { social, available, busy, refresh, startStreak, respondStreak, endStreak, claimStreak, challengeRace, respondRace, cancelRace, claimRace };
}
export {
  useFriendSocial
};
