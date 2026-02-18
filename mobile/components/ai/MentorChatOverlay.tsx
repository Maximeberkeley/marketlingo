import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { COLORS } from '../../lib/constants';
import { Mentor } from '../../data/mentors';
import { MentorAvatar } from './MentorAvatar';

interface ChatMessage {
  id: string;
  role: 'user' | 'mentor';
  content: string;
}

interface MentorChatOverlayProps {
  visible: boolean;
  mentor: Mentor;
  onClose: () => void;
  context?: string;
}

export function MentorChatOverlay({ visible, mentor, onClose, context }: MentorChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'mentor', content: mentor.greeting },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Simulate mentor response
    setTimeout(() => {
      const responses = [
        `Great question! In ${mentor.specialties[0]}, this is a common consideration.`,
        `That's a really insightful point. Let me break it down for you...`,
        `From my experience in ${mentor.expertise[0]}, I'd approach this by looking at the fundamentals first.`,
        `${mentor.expressions?.encouraging?.[0] || "You're on the right track!"} Let me add some context...`,
        `This is exactly the kind of thinking that separates good analysts from great ones.`,
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'mentor', content: response },
      ]);
    }, 1000);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <MentorAvatar emoji={mentor.emoji} name={mentor.name} size="md" />
          <View style={{ flex: 1 }}>
            <Text style={styles.mentorName}>{mentor.name}</Text>
            <Text style={styles.mentorTitle}>{mentor.title}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView style={styles.messages} contentContainerStyle={{ paddingVertical: 12 }}>
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.mentorBubble]}
            >
              {msg.role === 'mentor' && (
                <Text style={styles.bubbleEmoji}>{mentor.emoji}</Text>
              )}
              <Text style={[styles.bubbleText, msg.role === 'user' && styles.userBubbleText]}>
                {msg.content}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={`Ask ${mentor.name.split(' ')[0]}...`}
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, paddingTop: 60,
    backgroundColor: COLORS.bg1, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  mentorName: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  mentorTitle: { fontSize: 11, color: COLORS.textMuted },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: COLORS.textMuted },
  messages: { flex: 1, paddingHorizontal: 16 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12, marginBottom: 8 },
  mentorBubble: {
    alignSelf: 'flex-start', backgroundColor: COLORS.bg2,
    borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', gap: 8, alignItems: 'flex-start',
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: COLORS.accent },
  bubbleEmoji: { fontSize: 16, marginTop: 2 },
  bubbleText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20, flex: 1 },
  userBubbleText: { color: '#FFFFFF' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 36,
    backgroundColor: COLORS.bg1, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 100,
    backgroundColor: COLORS.bg2, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: { fontSize: 18, color: '#FFFFFF', fontWeight: '600' },
});
