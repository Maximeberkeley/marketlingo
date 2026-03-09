import React, { useState, useRef, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../lib/constants';
import { Mentor } from '../../data/mentors';
import { MentorAvatar } from './MentorAvatar';
import { supabase } from '../../lib/supabase';

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
  marketId?: string;
}

export function MentorChatOverlay({ visible, mentor, onClose, context, marketId }: MentorChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && mentor) {
      const initial: ChatMessage[] = [{ id: '0', role: 'mentor', content: mentor.greeting }];
      // If context contains a news article, show it as a visible context card
      if (context && context.includes('news article')) {
        // Extract title and summary from context
        const titleMatch = context.match(/Title: "([^"]+)"/);
        const sourceMatch = context.match(/Source: (.+)/);
        const summaryMatch = context.match(/Summary: (.+?)(?:\n|$)/);
        if (titleMatch) {
          const newsPreview = `📰 **${titleMatch[1]}**${sourceMatch ? `\n_${sourceMatch[1]}_` : ''}${summaryMatch && summaryMatch[1] !== 'N/A' ? `\n\n${summaryMatch[1]}` : ''}`;
          initial.push({ id: '0-context', role: 'mentor', content: newsPreview });
          initial.push({ id: '0-prompt', role: 'mentor', content: `I've loaded this article for you. What would you like to know — investment implications, competitive impact, or something else?` });
        }
      }
      setMessages(initial);
    }
  }, [visible, mentor?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const industryName = marketId
        ? marketId.charAt(0).toUpperCase() + marketId.slice(1).replace(/-/g, ' ')
        : 'the selected industry';

      const systemPrompt = `You are ${mentor.name}, ${mentor.title}. ${mentor.personality}

Your specialties include: ${mentor.specialties.join(', ')}.

CRITICAL RULE: You are EXCLUSIVELY an expert in the **${industryName}** industry. You MUST ONLY discuss topics, companies, trends, investments, and technologies related to ${industryName}. If the user asks about other industries, politely redirect the conversation back to ${industryName}. Never reference or discuss other industries unless directly comparing them to ${industryName}.

You're helping a user learn about the ${industryName} industry to prepare them to build a startup or invest in this space.
Be conversational, helpful, and draw from deep industry knowledge. Keep responses concise but insightful (2-3 paragraphs max).

${context ? `Current context: ${context}` : ''}`;

      const history = messages
        .filter((m) => m.id !== '0')
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));

      const { data, error } = await supabase.functions.invoke('mentor-chat', {
        body: {
          messages: [...history, { role: 'user', content: userText }],
          systemPrompt,
        },
      });

      if (error) throw error;

      const reply = data?.message || "I'm having a moment. Let's try that again.";
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'mentor', content: reply },
      ]);
    } catch (err: any) {
      console.error('Mentor chat error:', err);
      const errorMsg =
        err?.message?.includes('429') || err?.status === 429
          ? "I'm getting a lot of questions right now. Give me a moment and try again!"
          : err?.message?.includes('402') || err?.status === 402
          ? 'AI credits are running low. Please try again later.'
          : "I'm having a moment. Let's try that again — what were you asking about?";

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'mentor', content: errorMsg },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Resolve mentor ID for image lookup
  const mentorId = mentor.id || mentor.name.toLowerCase().split(' ')[0];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <MentorAvatar mentorId={mentorId} name={mentor.name} size="md" />
          <View style={{ flex: 1 }}>
            <Text style={styles.mentorName}>{mentor.name}</Text>
            <Text style={styles.mentorTitle}>{mentor.title}</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>AI</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messages}
          contentContainerStyle={{ paddingVertical: 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.mentorBubble]}
            >
              {msg.role === 'mentor' && (
                <View style={styles.bubbleMentorAvatar}>
                  <MentorAvatar mentorId={mentorId} name={mentor.name} size="sm" />
                </View>
              )}
              <Text style={[styles.bubbleText, msg.role === 'user' && styles.userBubbleText]}>
                {msg.content}
              </Text>
            </View>
          ))}
          {isLoading && (
            <View style={[styles.bubble, styles.mentorBubble]}>
              <View style={styles.bubbleMentorAvatar}>
                <MentorAvatar mentorId={mentorId} name={mentor.name} size="sm" />
              </View>
              <View style={styles.typingDots}>
                <ActivityIndicator size="small" color={COLORS.textMuted} />
                <Text style={styles.typingText}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggested prompts — contextual */}
        {messages.length <= 3 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionsRow}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}
          >
            {getContextualPrompts(context).map((prompt) => (
              <TouchableOpacity
                key={prompt}
                style={styles.suggestionChip}
                onPress={() => setInput(prompt)}
              >
                <Text style={styles.suggestionText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={`Ask ${mentor.name.split(' ')[0]}...`}
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isLoading) && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendBtnText}>→</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    backgroundColor: COLORS.bg1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mentorName: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  mentorTitle: { fontSize: 11, color: COLORS.textMuted },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139,92,246,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8B5CF6' },
  liveText: { fontSize: 10, color: '#A78BFA', fontWeight: '600' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: COLORS.textMuted },
  messages: { flex: 1, paddingHorizontal: 16 },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  mentorBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.accent,
    flexDirection: 'row-reverse',
  },
  bubbleMentorAvatar: { marginTop: 2 },
  bubbleText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 21, flex: 1 },
  userBubbleText: { color: '#FFFFFF' },
  typingDots: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },
  suggestionsRow: { flexShrink: 0, maxHeight: 52, borderTopWidth: 1, borderTopColor: COLORS.border },
  suggestionChip: {
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionText: { fontSize: 12, color: COLORS.textSecondary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
    backgroundColor: COLORS.bg1,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: COLORS.bg2,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: { fontSize: 18, color: '#FFFFFF', fontWeight: '600' },
});
