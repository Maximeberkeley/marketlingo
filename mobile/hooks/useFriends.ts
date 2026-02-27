/**
 * useFriends — friend system with requests, activity feed, and nudges.
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

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

  const fetchFriends = useCallback(async () => {
    if (!user || !marketId) {
      setLoading(false);
      return;
    }

    // Get accepted friendships where I'm either user_id or friend_id
    const { data: friendships } = await supabase
      .from('friendships')
      .select('id, user_id, friend_id, status')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (!friendships?.length) {
      setFriends([]);
      setLoading(false);
    } else {
      const friendIds = friendships.map((f) =>
        f.user_id === user.id ? f.friend_id : f.user_id
      );

      const [{ data: profiles }, { data: xpData }, { data: progressData }] = await Promise.all([
        supabase.from('profiles').select('id, username, avatar_url').in('id', friendIds),
        supabase.from('user_xp').select('user_id, total_xp, current_level').eq('market_id', marketId).in('user_id', friendIds),
        supabase.from('user_progress').select('user_id, current_streak, last_activity_at').eq('market_id', marketId).in('user_id', friendIds),
      ]);

      const friendList: Friend[] = friendIds.map((fId) => {
        const friendship = friendships.find(
          (f) => (f.user_id === fId || f.friend_id === fId)
        );
        const profile = profiles?.find((p) => p.id === fId);
        const xp = xpData?.find((x) => x.user_id === fId);
        const prog = progressData?.find((p) => p.user_id === fId);

        return {
          id: fId,
          friendshipId: friendship?.id || '',
          username: profile?.username?.split('@')[0] || 'Friend',
          avatarUrl: profile?.avatar_url || null,
          totalXP: xp?.total_xp || 0,
          currentStreak: prog?.current_streak || 0,
          currentLevel: xp?.current_level || 1,
          lastActivityAt: prog?.last_activity_at || null,
        };
      });

      friendList.sort((a, b) => b.totalXP - a.totalXP);
      setFriends(friendList);
      setLoading(false);
    }

    // Get pending requests TO me
    const { data: pending } = await supabase
      .from('friendships')
      .select('id, user_id, created_at')
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (pending?.length) {
      const fromIds = pending.map((p) => p.user_id);
      const { data: fromProfiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', fromIds);

      setPendingRequests(
        pending.map((p) => ({
          id: p.id,
          fromUserId: p.user_id,
          fromUsername: fromProfiles?.find((pr) => pr.id === p.user_id)?.username?.split('@')[0] || 'Someone',
          createdAt: p.created_at,
        }))
      );
    }
  }, [user, marketId]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendRequest = useCallback(async (friendUsername: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    // Find user by username
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', `%${friendUsername}%`)
      .neq('id', user.id)
      .limit(1)
      .maybeSingle();

    if (!targetProfile) return { success: false, error: 'User not found' };

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
    await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);
    await fetchFriends();
  }, [fetchFriends]);

  const declineRequest = useCallback(async (friendshipId: string) => {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    setPendingRequests((prev) => prev.filter((r) => r.id !== friendshipId));
  }, []);

  const removeFriend = useCallback(async (friendshipId: string) => {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    await fetchFriends();
  }, [fetchFriends]);

  return {
    friends,
    pendingRequests,
    loading,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    refetch: fetchFriends,
  };
}
