import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Animated, Image, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { useFriends, Friend } from '../hooks/useFriends';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../lib/haptics';
import { trackEvent } from '../lib/analytics';
import { FriendCard } from '../components/friends/FriendCard';
import { FriendActivityFeed } from '../components/friends/FriendActivityFeed';
import { Feather } from '@expo/vector-icons';
import { APP_ICONS } from '../lib/icons';

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [marketId, setMarketId] = useState<string | null>(null);
  const { friends, pendingRequests, loading, sendRequest, acceptRequest, declineRequest, removeFriend } = useFriends(marketId || undefined);
  const [addUsername, setAddUsername] = useState('');
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'activity' | 'requests'>('friends');

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.stagger(100, [
        Animated.spring(headerAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
        Animated.spring(bodyAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const animStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  });

  // Fetch market on mount
  React.useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('selected_market').eq('id', user.id).single().then(({ data }) => {
      setMarketId(data?.selected_market || 'aerospace');
    });
  }, [user]);

  const handleAddFriend = async () => {
    if (!addUsername.trim()) return;
    setAdding(true);
    triggerHaptic('light');
    const result = await sendRequest(addUsername.trim());
    setAdding(false);
    if (result.success) {
      trackEvent('friend_request_sent', { to: addUsername.trim() });
      Alert.alert('Request Sent!', `Friend request sent to "${addUsername}"`);
      setAddUsername('');
    } else {
      Alert.alert('Oops', result.error || 'Something went wrong');
    }
  };

  const handleNudge = async (friend: Friend) => {
    triggerHaptic('medium');
    trackEvent('nudge_sent', { to: friend.id });

    // Send real push notification via edge function
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: friend.id,
            title: '👋 Nudge!',
            body: `${user?.email?.split('@')[0] || 'A friend'} is reminding you to keep learning!`,
            data: { type: 'nudge', route: '/(tabs)/home' },
          },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
    } catch (e) {
      // Non-critical
    }

    Alert.alert('Nudge Sent! 👋', `${friend.username} will get a push notification to keep learning!`);
  };

  const handleRemove = (friend: Friend) => {
    Alert.alert('Remove Friend?', `Remove ${friend.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFriend(friend.friendshipId) },
    ]);
  };

  const handleAccept = (id: string) => {
    triggerHaptic('success');
    trackEvent('friend_request_accepted', {});
    acceptRequest(id);
  };

  const handleShareInvite = async () => {
    triggerHaptic('light');
    trackEvent('share_milestone', { type: 'friend_invite' });
    try {
      await Share.share({
        message: `Join me on MarketLingo! Learn about industries in 5 mins/day 🚀\n\nhttps://marketlingo.app/invite`,
      });
    } catch (e) {
      // User cancelled
    }
  };

  const isActive = (friend: Friend) => {
    if (!friend.lastActivityAt) return false;
    return (Date.now() - new Date(friend.lastActivityAt).getTime()) / (1000 * 60 * 60) < 24;
  };

  const tabs = [
    { key: 'friends' as const, label: `Friends (${friends.length})` },
    { key: 'activity' as const, label: 'Activity' },
    { key: 'requests' as const, label: `Requests${pendingRequests.length ? ` (${pendingRequests.length})` : ''}` },
  ];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { paddingTop: insets.top + 8 }, animStyle(headerAnim)]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends</Text>
        {pendingRequests.length > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{pendingRequests.length}</Text></View>
        )}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShareInvite}>
          <Feather name="share-2" size={16} color={COLORS.accent} />
        </TouchableOpacity>
      </Animated.View>

      {/* Add friend */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Add by username or email..."
          placeholderTextColor={COLORS.textMuted}
          value={addUsername}
          onChangeText={setAddUsername}
          autoCapitalize="none"
          returnKeyType="send"
          onSubmitEditing={handleAddFriend}
        />
        <TouchableOpacity
          style={[styles.addBtn, !addUsername.trim() && { opacity: 0.5 }]}
          onPress={handleAddFriend}
          disabled={!addUsername.trim() || adding}
        >
          {adding ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.addBtnText}>Add</Text>}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 40 }} />
        ) : (
          <Animated.View style={animStyle(bodyAnim)}>
            {activeTab === 'friends' && (
              friends.length === 0 ? (
                <View style={styles.empty}>
                  <Feather name="users" size={48} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyTitle}>No friends yet</Text>
                  <Text style={styles.emptySub}>Add friends by username to see their progress and compete!</Text>
                  <TouchableOpacity style={styles.inviteBtn} onPress={handleShareInvite}>
                    <Feather name="share-2" size={14} color="#FFF" />
                    <Text style={styles.inviteBtnText}>Invite Friends</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.list}>
                  {friends.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      isActive={isActive(friend)}
                      onNudge={handleNudge}
                      onRemove={handleRemove}
                    />
                  ))}
                </View>
              )
            )}

            {activeTab === 'activity' && (
              friends.length === 0 ? (
                <View style={styles.empty}>
                  <Feather name="activity" size={48} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyTitle}>No activity yet</Text>
                  <Text style={styles.emptySub}>Add friends to see what they're up to!</Text>
                </View>
              ) : (
                <FriendActivityFeed friends={friends} />
              )
            )}

            {activeTab === 'requests' && (
              pendingRequests.length === 0 ? (
                <View style={styles.empty}>
                  <Feather name="inbox" size={48} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyTitle}>No pending requests</Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {pendingRequests.map((req) => (
                    <View key={req.id} style={styles.requestCard}>
                      <View style={styles.reqAvatar}>
                        <Text style={styles.reqAvatarText}>{req.fromUsername.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reqName}>{req.fromUsername}</Text>
                        <Text style={styles.reqSub}>wants to be friends</Text>
                      </View>
                      <View style={styles.reqActions}>
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(req.id)}>
                          <Feather name="check" size={16} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.declineBtn} onPress={() => declineRequest(req.id)}>
                          <Feather name="x" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  badge: { backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  shareBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.accentSoft || 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  addRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  addInput: {
    flex: 1, height: 44, backgroundColor: COLORS.bg2, borderRadius: 12, paddingHorizontal: 14,
    fontSize: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  addBtn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  tabRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.bg2 },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: '#FFF' },
  scrollContent: { paddingHorizontal: 16 },
  list: { gap: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '600', marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 20, marginBottom: 20 },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.accent, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  inviteBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  requestCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: COLORS.bg2, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  reqAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  reqAvatarText: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary },
  reqName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  reqSub: { fontSize: 11, color: COLORS.textMuted },
  reqActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' },
  declineBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center' },
});
