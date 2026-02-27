import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { useFriends, Friend, FriendRequest } from '../hooks/useFriends';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../lib/haptics';

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [marketId, setMarketId] = useState<string | null>(null);
  const { friends, pendingRequests, loading, sendRequest, acceptRequest, declineRequest, removeFriend } = useFriends(marketId || undefined);
  const [addUsername, setAddUsername] = useState('');
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

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
      Alert.alert('Request Sent! 🎉', `Friend request sent to "${addUsername}"`);
      setAddUsername('');
    } else {
      Alert.alert('Oops', result.error || 'Something went wrong');
    }
  };

  const isActive = (friend: Friend) => {
    if (!friend.lastActivityAt) return false;
    const hoursSince = (Date.now() - new Date(friend.lastActivityAt).getTime()) / (1000 * 60 * 60);
    return hoursSince < 24;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👥 Friends</Text>
        {pendingRequests.length > 0 && (
          <View style={styles.badge}><Text style={styles.badgeText}>{pendingRequests.length}</Text></View>
        )}
      </View>

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
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Requests ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 40 }} />
        ) : activeTab === 'friends' ? (
          friends.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>👋</Text>
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptySub}>Add friends by username to see their progress and compete!</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {friends.map((friend) => (
                <View key={friend.id} style={styles.friendCard}>
                  <View style={styles.friendAvatar}>
                    <Text style={{ fontSize: 20 }}>{friend.username.charAt(0).toUpperCase()}</Text>
                    {isActive(friend) && <View style={styles.onlineDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>{friend.username}</Text>
                    <View style={styles.friendMeta}>
                      <Text style={styles.friendStat}>⚡ {friend.totalXP.toLocaleString()} XP</Text>
                      {friend.currentStreak > 0 && <Text style={styles.friendStat}>🔥 {friend.currentStreak}</Text>}
                      <Text style={styles.friendStat}>Lv. {friend.currentLevel}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert('Remove Friend?', `Remove ${friend.username}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => removeFriend(friend.friendshipId) },
                      ]);
                    }}
                  >
                    <Text style={{ color: COLORS.textMuted, fontSize: 18 }}>···</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )
        ) : (
          pendingRequests.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📬</Text>
              <Text style={styles.emptyTitle}>No pending requests</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {pendingRequests.map((req) => (
                <View key={req.id} style={styles.requestCard}>
                  <View style={styles.friendAvatar}>
                    <Text style={{ fontSize: 20 }}>{req.fromUsername.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>{req.fromUsername}</Text>
                    <Text style={styles.requestTime}>wants to be friends</Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => { triggerHaptic('success'); acceptRequest(req.id); }}
                    >
                      <Text style={styles.acceptBtnText}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={() => declineRequest(req.id)}
                    >
                      <Text style={styles.declineBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )
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
  backBtnText: { fontSize: 18, color: COLORS.textPrimary },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  badge: { backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  addRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  addInput: {
    flex: 1, height: 44, backgroundColor: COLORS.bg2, borderRadius: 12, paddingHorizontal: 14,
    fontSize: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  addBtn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  tabRow: {
    flexDirection: 'row', gap: 4, paddingHorizontal: 16, marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.bg2 },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: '#FFF' },
  scrollContent: { paddingHorizontal: 16 },
  list: { gap: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '500', marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 20 },
  friendCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: COLORS.bg2, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  friendAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(139,92,246,0.15)',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: COLORS.bg2,
  },
  friendName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  friendMeta: { flexDirection: 'row', gap: 10 },
  friendStat: { fontSize: 11, color: COLORS.textMuted },
  requestCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: COLORS.bg2, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  requestTime: { fontSize: 11, color: COLORS.textMuted },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center',
  },
  acceptBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  declineBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  declineBtnText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
});
