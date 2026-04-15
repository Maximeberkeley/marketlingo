import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { useSeminarChat, ChatMessage } from '../../hooks/useSeminars';

interface Props {
  seminarId: string;
}

export function SeminarChat({ seminarId }: Props) {
  const { messages, loading, sendMessage } = useSeminarChat(seminarId);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text;
    setText('');
    await sendMessage(msg);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageBubble, item.is_pinned && styles.pinnedBubble]}>
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
        <Text style={styles.username} numberOfLines={1}>{item.username || 'Anonymous'}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={styles.messageText}>{item.message}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={120}>
      <View style={styles.chatHeader}>
        <Feather name="message-circle" size={16} color={COLORS.textPrimary} />
        <Text style={styles.chatTitle}>Discussion</Text>
        <Text style={styles.chatCount}>{messages.length}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="message-square" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
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
  messageList: { flex: 1 },
  messageListContent: { padding: 16, gap: 8 },
  messageBubble: { backgroundColor: COLORS.bg1, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  pinnedBubble: { borderColor: '#DDD6FE', backgroundColor: '#FAF5FF' },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  pinnedText: { fontSize: 10, fontWeight: '700', color: '#7C3AED' },
  messageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  avatarSmall: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 11, fontWeight: '700', color: '#4338CA' },
  username: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  timestamp: { fontSize: 10, color: COLORS.textMuted },
  messageText: { fontSize: 14, lineHeight: 20, color: COLORS.textSecondary, marginLeft: 30 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: '#FFF' },
  input: { flex: 1, backgroundColor: COLORS.bg1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: COLORS.textPrimary, maxHeight: 80, borderWidth: 1, borderColor: COLORS.border },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4338CA', alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { backgroundColor: '#E0E7FF' },
});
