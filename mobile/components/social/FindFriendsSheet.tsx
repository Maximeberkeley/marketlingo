import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { getMarketName } from '../../lib/markets';
import { log } from '../../lib/logger';
import type { FriendSearchResult } from '../../hooks/useFriends';
import { SocialAvatar } from './SocialAvatar';

export interface SentRequestRow { id: string; toUserId: string; toUsername: string; toMarket: string | null }

/** Search by name or code, enter a friend's code, and see the requests you sent. */
export function FindFriendsSheet({ visible, searchPeople, friendIds, sentRequests, incomingFromIds, busyId, onAdd, onCancelSent, onRedeem, onShare, onClose }: {
  visible: boolean;
  searchPeople: (q: string) => Promise<FriendSearchResult[]>;
  friendIds: Set<string>;
  sentRequests: SentRequestRow[];
  incomingFromIds: Set<string>;
  busyId: string | null;
  onAdd: (person: FriendSearchResult) => void;
  onCancelSent: (requestId: string) => void;
  onRedeem: (code: string) => Promise<{ ok: boolean; message: string }>;
  onShare: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [codeNote, setCodeNote] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => { if (!visible) { setQuery(''); setResults([]); setCode(''); setCodeNote(null); } }, [visible]);

  // Debounced live search (2+ characters, 300 ms). Stale replies are dropped.
  const seqRef = useRef(0);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setSearching(false); setSearchError(false); return; }
    const seq = ++seqRef.current;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const found = await searchPeople(q);
        if (seq !== seqRef.current) return;
        setResults(found);
        setSearchError(false);
      } catch (err) {
        if (seq !== seqRef.current) return;
        log.warn('Friend search failed', err);
        setResults([]);
        setSearchError(true);
      } finally {
        if (seq === seqRef.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, searchPeople]);

  const redeem = async () => {
    if (redeeming || code.trim().length < 4) return;
    setRedeeming(true);
    const note = await onRedeem(code);
    setRedeeming(false);
    setCodeNote(note);
    if (note.ok) setCode('');
  };

  if (!visible) return null;
  const typing = query.trim().length >= 2;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav} pointerEvents="box-none">
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <Text style={styles.title}>Find friends</Text>
            <TouchableOpacity onPress={onClose} style={styles.close} accessibilityLabel="Close"><Feather name="x" size={18} color={COLORS.textMuted} /></TouchableOpacity>
          </View>

          <View style={styles.search}>
            <Feather name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Name or friend code"
              placeholderTextColor={COLORS.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searching && <ActivityIndicator size="small" color={COLORS.accent} />}
          </View>

          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
            {typing ? (
              searchError ? <Text style={styles.note}>Search is unavailable right now. Please try again.</Text>
              : !searching && results.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.note}>No one found with that name. Send them your link instead.</Text>
                  <TouchableOpacity style={styles.linkBtn} onPress={onShare}><Feather name="share" size={15} color={COLORS.accent} /><Text style={styles.linkBtnText}>Share invite link</Text></TouchableOpacity>
                </View>
              ) : results.map(p => {
                const isFriend = friendIds.has(p.id);
                const sent = sentRequests.some(r => r.toUserId === p.id);
                const incoming = incomingFromIds.has(p.id);
                return (
                  <View key={p.id} style={styles.row}>
                    <SocialAvatar name={p.displayName} size={44} />
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName} numberOfLines={1}>{p.displayName}</Text>
                      <Text style={styles.rowMeta} numberOfLines={1}>{[p.selectedMarket ? getMarketName(p.selectedMarket) : null, p.friendCode].filter(Boolean).join(' · ')}</Text>
                    </View>
                    {isFriend ? <Text style={styles.friends}>Friends</Text>
                      : busyId === p.id ? <ActivityIndicator size="small" color={COLORS.accent} />
                      : (
                        <TouchableOpacity style={[styles.add, sent && styles.addGhost]} onPress={() => onAdd(p)} accessibilityLabel={sent ? `Cancel request to ${p.displayName}` : `Add ${p.displayName}`}>
                          {!sent && <Feather name={incoming ? 'check' : 'user-plus'} size={15} color="#FFFFFF" />}
                          <Text style={sent ? styles.addGhostText : styles.addText}>{sent ? 'Requested' : incoming ? 'Accept' : 'Add'}</Text>
                        </TouchableOpacity>
                      )}
                  </View>
                );
              })
            ) : (
              <>
                <Text style={styles.label}>Have a friend's code?</Text>
                <View style={styles.codeRow}>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="ABC123"
                    placeholderTextColor={COLORS.textMuted}
                    value={code}
                    onChangeText={t => { setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '')); setCodeNote(null); }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={12}
                    returnKeyType="done"
                    onSubmitEditing={redeem}
                  />
                  <TouchableOpacity style={[styles.add, code.trim().length < 4 && { opacity: 0.4 }]} onPress={redeem} disabled={code.trim().length < 4 || redeeming} accessibilityLabel="Add friend by code">
                    {redeeming ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.addText}>Add</Text>}
                  </TouchableOpacity>
                </View>
                {!!codeNote && <Text style={[styles.note, { color: codeNote.ok ? COLORS.success : COLORS.error }]}>{codeNote.message}</Text>}

                {sentRequests.length > 0 && (
                  <>
                    <Text style={[styles.label, { marginTop: 10 }]}>Waiting for them to accept</Text>
                    {sentRequests.map(r => (
                      <View key={r.id} style={styles.row}>
                        <SocialAvatar name={r.toUsername} size={40} dashed />
                        <View style={styles.rowInfo}>
                          <Text style={styles.rowName} numberOfLines={1}>{r.toUsername}</Text>
                          <Text style={styles.rowMeta} numberOfLines={1}>{r.toMarket ? getMarketName(r.toMarket) : 'Request sent'}</Text>
                        </View>
                        {busyId === r.id ? <ActivityIndicator size="small" color={COLORS.accent} /> : (
                          <TouchableOpacity style={[styles.add, styles.addGhost]} onPress={() => onCancelSent(r.id)} accessibilityLabel={`Cancel request to ${r.toUsername}`}>
                            <Text style={styles.addGhostText}>Cancel</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11, 16, 32, 0.55)' },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, gap: 12, width: '100%', maxWidth: 680, alignSelf: 'center', maxHeight: '88%', minHeight: '60%' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.border },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, borderRadius: 16, paddingHorizontal: 14, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.bg1 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 16, color: COLORS.textPrimary, height: '100%' },
  label: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, color: COLORS.textMuted, textTransform: 'uppercase' },
  codeRow: { flexDirection: 'row', gap: 10 },
  codeInput: { flex: 1, minWidth: 0, height: 50, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, paddingHorizontal: 14, fontSize: 18, fontWeight: '800', letterSpacing: 3, color: COLORS.textPrimary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  rowMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  add: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 12, backgroundColor: COLORS.accent },
  addText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  addGhost: { backgroundColor: COLORS.bg2, borderWidth: 2, borderColor: COLORS.border },
  addGhostText: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary },
  friends: { fontSize: 13, fontWeight: '800', color: COLORS.success },
  note: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  empty: { gap: 10, paddingVertical: 8 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, height: 38, borderRadius: 12, backgroundColor: COLORS.accentSoft },
  linkBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.accent },
});
