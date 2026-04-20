import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../lib/constants';
import { useSeminarChat, ChatMessage } from '../../hooks/useSeminars';

interface Props {
  seminarId: string;
}

type Sort = 'newest' | 'top';

export function SeminarChat({ seminarId }: Props) {
  const { messages, loading, sendMessage, deleteMessage, toggleLike, currentUserId } = useSeminarChat(seminarId);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [sort, setSort] = useState<Sort>('newest');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Group into top-level + replies
  const threaded = useMemo(() => {
    const tops = messages.filter(m => !m.parent_id);
    const replies = new Map<string, ChatMessage[]>();
    messages.filter(m => m.parent_id).forEach(r => {
      const arr = replies.get(r.parent_id!) || [];
      arr.push(r);
      replies.set(r.parent_id!, arr);
    });
    const sorted = [...tops].sort((a, b) => {
      if (sort === 'top') return (b.like_count - a.like_count) || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    return sorted.map(top => ({
      top,
      replies: (replies.get(top.id) || []).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    }));
  }, [messages, sort]);

  useEffect(() => {
    if (sort === 'newest' && messages.length > 0 && !replyTo) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [messages.length, sort]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text;
    const parent = replyTo?.id || null;
    setText('');
    setReplyTo(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await sendMessage(msg, parent);
  };

  const handleReply = (msg: ChatMessage) => {
    setReplyTo(msg);
    setExpandedThreads(prev => new Set(prev).add(msg.id));
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleDelete = (msg: ChatMessage) => {
    Alert.alert('Delete comment?', 'This will permanently remove your comment.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          await deleteMessage(msg.id);
        }
      },
    ]);
  };

  const handleLike = (msg: ChatMessage) => {
    Haptics.selectionAsync().catch(() => {});
    toggleLike(msg.id, !!msg.liked_by_me);
  };

  const toggleThread = (id: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const renderBubble = (item: ChatMessage, isReply: boolean = false) => {
    const isOwn = item.user_id === currentUserId;
    return (
      <View key={item.id} style={[styles.messageBubble, item.is_pinned && styles.pinnedBubble, isReply && styles.replyBubble]}>
        {item.is_pinned && (
          <View style={styles.pinnedBadge}>
            <Feather name="bookmark" size={10} color="#7C3AED" />
            <Text style={styles.pinnedText}>Pinned</Text>
          </View>
        )}
        <View style={styles.messageHeader}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarLetter}>{(item.username || 'A')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.username} numberOfLines={1}>{item.username || 'Anonymous'}{isOwn && ' · You'}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.messageText}>{item.message}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => handleLike(item)} style={styles.actionBtn} hitSlop={8}>
            <Feather name="heart" size={14} color={item.liked_by_me ? '#EF4444' : COLORS.textMuted} {...(item.liked_by_me && { style: { opacity: 1 } } as any)} />
            <Text style={[styles.actionText, item.liked_by_me && { color: '#EF4444', fontWeight: '700' }]}>
              {item.like_count > 0 ? item.like_count : 'Like'}
            </Text>
          </TouchableOpacity>

          {!isReply && (
            <TouchableOpacity onPress={() => handleReply(item)} style={styles.actionBtn} hitSlop={8}>
              <Feather name="corner-up-left" size={13} color={COLORS.textMuted} />
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>
          )}

          {isOwn && (
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn} hitSlop={8}>
              <Feather name="trash-2" size={13} color={COLORS.textMuted} />
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderThread = ({ item }: { item: { top: ChatMessage; replies: ChatMessage[] } }) => {
    const expanded = expandedThreads.has(item.top.id);
    return (
      <View style={{ gap: 6 }}>
        {renderBubble(item.top)}
        {item.replies.length > 0 && (
          <TouchableOpacity onPress={() => toggleThread(item.top.id)} style={styles.threadToggle}>
            <View style={styles.threadLine} />
            <Text style={styles.threadToggleText}>
              {expanded ? 'Hide' : 'View'} {item.replies.length} {item.replies.length === 1 ? 'reply' : 'replies'}
            </Text>
            <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color="#4338CA" />
          </TouchableOpacity>
        )}
        {expanded && (
          <View style={styles.repliesContainer}>
            {item.replies.map(r => renderBubble(r, true))}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={120}>
      <View style={styles.chatHeader}>
        <Feather name="message-circle" size={16} color={COLORS.textPrimary} />
        <Text style={styles.chatTitle}>Discussion</Text>
        <Text style={styles.chatCount}>{messages.length}</Text>
        <TouchableOpacity
          onPress={() => setSort(s => s === 'newest' ? 'top' : 'newest')}
          style={styles.sortBtn}
          hitSlop={8}
        >
          <Feather name={sort === 'top' ? 'trending-up' : 'clock'} size={12} color="#4338CA" />
          <Text style={styles.sortText}>{sort === 'top' ? 'Top' : 'Newest'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={threaded}
        renderItem={renderThread}
        keyExtractor={item => item.top.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="message-square" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
          </View>
        }
      />

      {replyTo && (
        <View style={styles.replyingBanner}>
          <Feather name="corner-up-left" size={12} color="#4338CA" />
          <Text style={styles.replyingText} numberOfLines={1}>
            Replying to <Text style={{ fontWeight: '700' }}>{replyTo.username}</Text>
          </Text>
          <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={8}>
            <Feather name="x" size={14} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={replyTo ? `Reply to ${replyTo.username}...` : 'Type a message...'}
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit
        />
        <TouchableOpacity onPress={handleSend} style={[styles.sendButton, !text.trim() && styles.sendDisabled]} disabled={!text.trim()}>
          <Feather name="send" size={18} color={text.trim() ? '#FFF' : '#A5B4FC'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chatTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  chatCount: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, backgroundColor: COLORS.bg1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#EEF2FF' },
  sortText: { fontSize: 11, fontWeight: '700', color: '#4338CA' },
  messageList: { flex: 1 },
  messageListContent: { padding: 16, gap: 10 },
  messageBubble: { backgroundColor: COLORS.bg1, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  replyBubble: { backgroundColor: '#FFF' },
  pinnedBubble: { borderColor: '#DDD6FE', backgroundColor: '#FAF5FF' },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  pinnedText: { fontSize: 10, fontWeight: '700', color: '#7C3AED' },
  messageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  avatarSmall: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 11, fontWeight: '700', color: '#4338CA' },
  username: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  timestamp: { fontSize: 10, color: COLORS.textMuted },
  messageText: { fontSize: 14, lineHeight: 20, color: COLORS.textSecondary, marginLeft: 30 },
  actionRow: { flexDirection: 'row', gap: 16, marginTop: 8, marginLeft: 30 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  threadToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 38, marginTop: 2 },
  threadLine: { width: 18, height: 1, backgroundColor: '#C7D2FE' },
  threadToggleText: { fontSize: 12, fontWeight: '700', color: '#4338CA' },
  repliesContainer: { marginLeft: 24, gap: 6, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#E0E7FF' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  replyingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#EEF2FF', borderTopWidth: 1, borderTopColor: '#C7D2FE' },
  replyingText: { flex: 1, fontSize: 12, color: '#4338CA' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: '#FFF' },
  input: { flex: 1, backgroundColor: COLORS.bg1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: COLORS.textPrimary, maxHeight: 80, borderWidth: 1, borderColor: COLORS.border },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4338CA', alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { backgroundColor: '#E0E7FF' },
});
