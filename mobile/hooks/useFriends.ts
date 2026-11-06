/**
 * useFriends — friend system with requests, activity feed, and nudges.
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { log } from '../lib/logger';

export interface Friend {
  id: string;
  friendshipId: string;
  /** Display name (never an email). */
  username: string;
  friendCode: string | null;
  avatarUrl: string | null;
  selectedMarket: string | null;
  /** XP earned this month across all industries. */
  totalXP: number;
  currentStreak: number;
  currentLevel: number;
  lastActivityAt: string | null;
  lessonDoneToday: boolean;
  nudgedToday: boolean;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  createdAt: string;
}

export function useFriends(marketId?: string) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * One guarded pass: friends, then pending requests. A failure in either half
   * can never leave the screen spinning — `finally` always clears loading.
   */
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
      // One server call: accepted friends across every industry they study.
      const { data: overview, error: overviewError } = await supabase.rpc('get_friends_overview');

      if (overviewError) {
        log.warn('Friends overview failed to load', overviewError);
        setError('Friends could not load. Check your connection and try again.');
      } else {
        const friendList: Friend[] = ((overview ?? []) as any[]).map((row) => ({
          id: row.friend_id,
          friendshipId: row.friendship_id,
          username: row.display_name?.trim() || 'Analyst',
          friendCode: row.friend_code || null,
          avatarUrl: row.avatar_url || null,
          selectedMarket: row.selected_market || null,
          totalXP: Number(row.month_xp) || 0,
          currentStreak: Number(row.current_streak) || 0,
          currentLevel: Number(row.current_level) || 1,
          lastActivityAt: row.last_activity_at || null,
          lessonDoneToday: !!row.lesson_done_today,
          nudgedToday: !!row.nudged_today,
        }));
        friendList.sort((a, b) => b.totalXP - a.totalXP);
        setFriends(friendList);
      }

      // Get pending requests TO me. Its own guard: a failure here must not
      // discard the friends we just resolved.
      try {
        const { data: pending, error: pendingError } = await supabase
          .from('friendships')
          .select('id, user_id, created_at')
          .eq('friend_id', user.id)
          .eq('status', 'pending');

        if (pendingError) {
          log.warn('Friend requests failed to load', pendingError);
        } else if (!pending?.length) {
          setPendingRequests([]);
        } else {
          const fromIds = pending.map((p) => p.user_id);
          const { data: fromProfiles } = await supabase
            .from('public_profiles')
            .select('id, display_name')
            .in('id', fromIds);

          setPendingRequests(
            pending.map((p) => ({
              id: p.id,
              fromUserId: p.user_id,
              fromUsername:
                fromProfiles?.find((pr) => pr.id === p.user_id)?.display_name?.trim() || 'Someone',
              createdAt: p.created_at,
            }))
          );
        }
      } catch (pendingErr) {
        log.warn('Friend requests lookup failed', pendingErr);
      }
    } catch (err) {
      log.warn('Friends lookup failed', err);
      setError('Friends could not load. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [user, marketId]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendRequest = useCallback(async (friendIdentifier: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    // Search by display name, exact friend code, or a full email typed exactly
    const { data: matches, error: searchError } = await supabase.rpc('search_public_profiles', {
      p_query: friendIdentifier.trim(),
    });
    if (searchError) {
      log.warn('Friend search failed', searchError);
      return { success: false, error: 'Search is unavailable right now. Please try again.' };
    }
    const targetProfile = matches?.[0];

    if (!targetProfile) return { success: false, error: 'User not found. Make sure they have an account.' };

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${targetProfile.id}),and(user_id.eq.${targetProfile.id},friend_id.eq.${user.id})`)
      .maybeSingle();

    if (existing) return { success: false, error: 'Already friends or request pending' };

    const { error } = await supabase.from('friendships').insert({
      user_id: user.id,
      friend_id: targetProfile.id,
      status: 'pending',
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }, [user]);

  const acceptRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);
    if (error) return { success: false, error: error.message };
    await fetchFriends();
    return { success: true };
  }, [fetchFriends]);

  const declineRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
    if (error) return { success: false, error: error.message };
    setPendingRequests((prev) => prev.filter((r) => r.id !== friendshipId));
    return { success: true };
  }, []);

  const removeFriend = useCallback(async (friendshipId: string) => {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
    if (error) return { success: false, error: error.message };
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
    refetch: fetchFriends,
  };
}
