/**
 * useFriends — friend system with requests, activity feed, and nudges.
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { getMonthlyStandings, standingName } from '../lib/socialStandings';
import { log } from '../lib/logger';

export interface Friend {
  id: string;
  friendshipId: string;
  username: string;
  avatarUrl: string | null;
  totalXP: number;
  currentStreak: number;
  currentLevel: number;
  lastActivityAt: string | null;
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
    if (!user || !marketId) {
      setFriends([]);
      setPendingRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get accepted friendships where I'm either user_id or friend_id
      const { data: friendships, error: friendshipError } = await supabase
        .from('friendships')
        .select('id, user_id, friend_id, status')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (friendshipError) {
        log.warn('Friendships failed to load', friendshipError);
        setError('Friends could not load. Check your connection and try again.');
      } else if (!friendships?.length) {
        setFriends([]);
      } else {
        const friendIds = friendships.map((f) =>
          f.user_id === user.id ? f.friend_id : f.user_id
        );

        let standings: Awaited<ReturnType<typeof getMonthlyStandings>> = [];
        try {
          standings = await getMonthlyStandings(marketId);
        } catch (standingsError) {
          log.warn('Friend standings failed to load', standingsError);
          setError('Friend scores could not load. Check your connection and try again.');
        }

        const friendList: Friend[] = friendIds.map((fId) => {
          const friendship = friendships.find(
            (f) => (f.user_id === fId || f.friend_id === fId)
          );
          const standing = standings.find((row) => row.user_id === fId);

          return {
            id: fId,
            friendshipId: friendship?.id || '',
            username: standing ? standingName(standing) : 'Friend',
            avatarUrl: standing?.avatar_url || null,
            totalXP: standing?.monthly_xp || 0,
            currentStreak: standing?.current_streak || 0,
            currentLevel: standing?.current_level || 1,
            lastActivityAt: standing?.last_activity_at || null,
          };
        });

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
            .select('id, username')
            .in('id', fromIds);

          setPendingRequests(
            pending.map((p) => ({
              id: p.id,
              fromUserId: p.user_id,
              fromUsername:
                fromProfiles?.find((pr) => pr.id === p.user_id)?.username?.split('@')[0] || 'Someone',
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

    // Search by username (which may contain email) — case-insensitive partial match
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
