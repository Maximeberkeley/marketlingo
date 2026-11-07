import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { trackEvent } from '../lib/analytics';
import { FriendSocial, isMissingFunction, parseFriendSocial } from '../lib/friendSocial';

export type SocialPushKind = 'streak_invite' | 'streak_accepted' | 'race_challenge' | 'race_accepted';

/** Fire-and-forget push to the friend; never blocks the screen. The server checks the caller's role and sends each push once. */
export function notifyFriendSocial(kind: SocialPushKind, id: string | null | undefined) {
  if (typeof id !== 'string' || !id) return;
  supabase.functions
    .invoke('friend-social-notify', { body: { kind, id } })
    .catch((err) => log.warn('[FriendSocial] Push failed:', err));
}

export interface SocialReward {
  kind: 'race' | 'streak';
  xp: number;
  friendName: string;
  /** race: won / tied / lost; streak: the milestone days reached. */
  outcome?: 'won' | 'tied' | 'lost';
  milestones?: number[];
  myXP?: number;
  friendXP?: number;
  length?: number;
}

/**
 * Friend streaks and races for the signed-in learner. `available` stays false
 * until the server functions exist, so screens keep their current layout.
 */
export function useFriendSocial(userId: string | null | undefined, focused = true) {
  const [social, setSocial] = useState<FriendSocial | null>(null);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase.rpc('get_friend_social');
    if (!mounted.current) return;
    if (error) {
      if (isMissingFunction(error)) setAvailable(false);
      else log.warn('[FriendSocial] Could not load:', error.message);
      return;
    }
    setAvailable(true);
    setSocial(parseFriendSocial(data));
  }, [userId]);

  useEffect(() => { if (focused) void refresh(); }, [focused, refresh]);

  /** Runs one server action, then reloads. Returns the action's data, or null with a readable error. */
  const act = useCallback(async <T,>(key: string, fn: string, args: Record<string, unknown>, event?: string): Promise<{ data: T | null; error: string | null }> => {
    setBusy(key);
    const { data, error } = await supabase.rpc(fn, args);
    if (mounted.current) setBusy(null);
    if (error) {
      log.warn(`[FriendSocial] ${fn} failed:`, error.message);
      return { data: null, error: error.message.replace(/^.*?:\s*/, '') || 'Something went wrong. Try again.' };
    }
    if (event) trackEvent(event as any, args as any);
    await refresh();
    return { data: data as T, error: null };
  }, [refresh]);

  const startStreak = async (friendId: string) => {
    const result = await act<string>(`streak:${friendId}`, 'start_friend_streak', { p_friend: friendId }, 'friend_streak_invited');
    if (!result.error) notifyFriendSocial('streak_invite', result.data);
    return result;
  };
  const respondStreak = async (streakId: string, accept: boolean) => {
    const result = await act<string>(`streak:${streakId}`, 'respond_friend_streak', { p_streak: streakId, p_accept: accept }, accept ? 'friend_streak_accepted' : undefined);
    if (!result.error && accept) notifyFriendSocial('streak_accepted', streakId);
    return result;
  };
  const endStreak = (streakId: string) => act<null>(`streak:${streakId}`, 'end_friend_streak', { p_streak: streakId });
  const challengeRace = async (friendId: string) => {
    const result = await act<string>(`race:${friendId}`, 'challenge_friend_race', { p_friend: friendId }, 'friend_race_challenged');
    if (!result.error) notifyFriendSocial('race_challenge', result.data);
    return result;
  };
  const respondRace = async (raceId: string, accept: boolean) => {
    const result = await act<string>(`race:${raceId}`, 'respond_friend_race', { p_race: raceId, p_accept: accept }, accept ? 'friend_race_accepted' : undefined);
    if (!result.error && accept) notifyFriendSocial('race_accepted', raceId);
    return result;
  };
  const cancelRace = (raceId: string) => act<null>(`race:${raceId}`, 'cancel_friend_race', { p_race: raceId });

  const claimStreak = async (streakId: string, friendName: string): Promise<SocialReward | null> => {
    const { data } = await act<{ xp: number; milestones: number[]; length: number }>(`claim:${streakId}`, 'claim_friend_streak_rewards', { p_streak: streakId }, 'friend_reward_claimed');
    if (!data || !(Number(data.xp) > 0)) return null;
    return { kind: 'streak', xp: Number(data.xp), friendName, milestones: data.milestones, length: Number(data.length) || 0 };
  };

  const claimRace = async (raceId: string, friendName: string): Promise<SocialReward | null> => {
    const { data } = await act<{ outcome: 'won' | 'tied' | 'lost'; xp: number; my_xp: number; friend_xp: number; already_claimed: boolean }>(
      `claim:${raceId}`, 'claim_friend_race_reward', { p_race: raceId }, 'friend_reward_claimed');
    if (!data || data.already_claimed) return null;
    return { kind: 'race', xp: Number(data.xp) || 0, friendName, outcome: data.outcome, myXP: Number(data.my_xp) || 0, friendXP: Number(data.friend_xp) || 0 };
  };

  return { social, available, busy, refresh, startStreak, respondStreak, endStreak, claimStreak, challengeRace, respondRace, cancelRace, claimRace };
}
