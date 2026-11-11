import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardEvent,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { Mentor } from '../../data/mentors';
import { MentorAvatar } from './MentorAvatar';
import { RichText } from './RichText';
import { supabase } from '../../lib/supabase';
import { log } from '../../lib/logger';

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

/** The article a news chat is about, read from the context the caller passes. */
function storyFromContext(context?: string): { title: string; source?: string; summary?: string } | null {
  if (!context || !context.includes('news article')) return null;
  const title = context.match(/Title: "([^"]+)"/)?.[1];
  if (!title) return null;
  const source = context.match(/Source: (.+)/)?.[1]?.trim();
  const summary = context.match(/Summary: (.+?)(?:\n|$)/)?.[1]?.trim();
  return { title, source, summary: summary && summary !== 'N/A' ? summary : undefined };
}

/**
 * A chat with one of the AI mentors. Replies render their markdown (bold, lists) instead of showing symbols; a
 * news chat opens on a card for the story; suggestion chips send at once; and the input always sits on top of the
 * keyboard, measured from the keyboard itself because a page-sheet modal does not start at the top of the screen.
 */
export function MentorChatOverlay({ visible, mentor, onClose, context, marketId }: MentorChatOverlayProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboard, setKeyboard] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const rootRef = useRef<View>(null);
  const story = storyFromContext(context);
  const first = mentor.name.split(' ')[0];

  useEffect(() => {
    if (!visible || !mentor) return;
    setMessages([{
      id: '0',
      role: 'mentor',
      content: story ? `I've read this story. Ask me anything about it, or pick a question below.` : mentor.greeting,
    }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mentor?.id]);

  // Keep the input on the keyboard: pad by how far the keyboard reaches into this sheet.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const animate = (e?: KeyboardEvent) => {
      if (Platform.OS === 'ios') LayoutAnimation.configureNext({ duration: e?.duration || 250, update: { type: 'keyboard' } });
    };
    const onShow = (e: KeyboardEvent) => {
      const kbTop = e.endCoordinates.screenY;
      rootRef.current?.measureInWindow((_x, y, _w, h) => {
        animate(e);
        setKeyboard(Math.max(0, y + h - kbTop));
      });
    };
    const onHide = (e: KeyboardEvent) => { animate(e); setKeyboard(0); };
    const a = Keyboard.addListener(showEvt, onShow);
    const b = Keyboard.addListener(hideEvt, onHide);
    return () => { a.remove(); b.remove(); };
  }, []);

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, isLoading, keyboard]);

  const send = useCallback(async (raw?: string) => {
    const userText = (raw ?? input).trim();
    if (!userText || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);
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
Be conversational, helpful, and draw from deep industry knowledge. Keep responses concise but insightful (2-3 short paragraphs max). Use **bold** sparingly for key terms and "- " bullets only for real lists.

${context ? `Current context: ${context}` : ''}`;

      const history = messages
        .filter(m => m.id !== '0')
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

      const { data, error } = await supabase.functions.invoke('mentor-chat', {
        body: { messages: [...history, { role: 'user', content: userText }], systemPrompt },
      });
      if (error) throw error;

      const reply = data?.message || "I'm having a moment. Let's try that again.";
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'mentor', content: reply }]);
    } catch (err: any) {
      log.error('Mentor chat error:', err);
      const errorMsg =
        err?.message?.includes('429') || err?.status === 429
          ? "I'm getting a lot of questions right now. Give me a moment and try again."
          : err?.message?.includes('402') || err?.status === 402
          ? 'AI credits are running low. Please try again later.'
          : "That didn't go through. Ask me again?";
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'mentor', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, marketId, mentor, messages, context]);

  const mentorId = mentor.id || mentor.name.toLowerCase().split(' ')[0];
  const asked = messages.some(m => m.role === 'user');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View ref={rootRef} style={[styles.container, { paddingBottom: keyboard }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 14 : Math.max(insets.top, 12) }]}>
          <View style={styles.grabber} />
          <View style={styles.headerRow}>
            <MentorAvatar mentorId={mentorId} name={mentor.name} size="md" />
            <View style={{ flex: 1 }}>
              <Text style={styles.mentorName} maxFontSizeMultiplier={1.3}>{mentor.name}</Text>
              <Text style={styles.mentorTitle} maxFontSizeMultiplier={1.3}>{mentor.title} · AI</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close chat">
              <Feather name="x" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {story && (
            <View style={styles.storyCard} accessibilityLabel={`About this story: ${story.title}`}>
              <View style={styles.storyLabelRow}>
                <Feather name="file-text" size={13} color={COLORS.accent} />
                <Text style={styles.storyLabel} maxFontSizeMultiplier={1.3}>About this story</Text>
              </View>
              <Text style={styles.storyTitle} maxFontSizeMultiplier={1.3}>{story.title}</Text>
              {story.source ? <Text style={styles.storySource} maxFontSizeMultiplier={1.3}>{story.source}</Text> : null}
              {story.summary ? <Text style={styles.storySummary} numberOfLines={3} maxFontSizeMultiplier={1.3}>{story.summary}</Text> : null}
            </View>
          )}

          {messages.map((msg, i) => {
            const mine = msg.role === 'user';
            const showAvatar = !mine && messages[i - 1]?.role !== 'mentor';
            return mine ? (
              <View key={msg.id} style={[styles.bubble, styles.userBubble]}>
                <Text style={styles.userText} maxFontSizeMultiplier={1.4}>{msg.content}</Text>
              </View>
            ) : (
              <View key={msg.id} style={styles.mentorRow}>
                <View style={styles.avatarSlot}>{showAvatar && <MentorAvatar mentorId={mentorId} name={mentor.name} size="sm" />}</View>
                <View style={[styles.bubble, styles.mentorBubble]}>
                  <RichText text={msg.content} color={COLORS.textPrimary} />
                </View>
              </View>
            );
          })}

          {isLoading && (
            <View style={styles.mentorRow}>
              <View style={styles.avatarSlot}><MentorAvatar mentorId={mentorId} name={mentor.name} size="sm" /></View>
              <View style={[styles.bubble, styles.mentorBubble, styles.typing]}>
                <TypingDots />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestions send at once, until the first question */}
        {!asked && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsRow} contentContainerStyle={styles.suggestions} keyboardShouldPersistTaps="handled">
            {getContextualPrompts(context).map(prompt => (
              <TouchableOpacity key={prompt} style={styles.suggestionChip} onPress={() => { void send(prompt); }} accessibilityRole="button">
                <Text style={styles.suggestionText} maxFontSizeMultiplier={1.3}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View style={[styles.inputRow, { paddingBottom: keyboard > 0 ? 10 : Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.input}
            placeholder={`Ask ${first}…`}
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={600}
            editable={!isLoading}
            accessibilityLabel={`Message ${first}`}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendOff]}
            onPress={() => { void send(); }}
            disabled={!input.trim() || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Send"
          >
            {isLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Feather name="arrow-up" size={20} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/** Three dots that rise in turn while the mentor writes. */
function TypingDots() {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const loops = dots.map((d, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 140),
      Animated.timing(d, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(d, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.delay((2 - i) * 140 + 200),
    ])));
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [dots]);
  return (
    <View style={styles.dots} accessibilityLabel="Writing">
      {dots.map((d, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }), transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />
      ))}
    </View>
  );
}

/** Return contextual prompt chips based on chat context */
function getContextualPrompts(context?: string): string[] {
  if (context?.includes('news article')) {
    return ['Why does this matter?', 'Who wins and who loses?', 'What are the risks?', 'Explain it simply'];
  }
  if (context?.includes('lesson') || context?.includes('slide') || context?.includes('concept')) {
    return ['Explain this simply', 'Real-world example?', 'Why does this matter?', 'How is this applied in practice?'];
  }
  if (context?.includes('trainer') || context?.includes('scenario')) {
    return ['Walk me through the reasoning', 'What framework applies here?', 'Common mistakes to avoid?', 'Similar real-world case?'];
  }
  return ['What are the biggest trends?', 'Key players to watch?', 'Best entry points for beginners?', 'What skills do I need?'];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  header: { paddingHorizontal: 16, paddingBottom: 12, backgroundColor: COLORS.bg0, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: COLORS.border, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mentorName: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  mentorTitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 1 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center' },

  messages: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 10 },
  storyCard: { padding: 14, borderRadius: 16, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, marginBottom: 6 },
  storyLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  storyLabel: { fontSize: 12.5, fontWeight: '800', color: COLORS.accent },
  storyTitle: { fontSize: 16, lineHeight: 21, fontWeight: '800', color: COLORS.textPrimary },
  storySource: { fontSize: 12.5, fontWeight: '600', color: COLORS.textMuted, marginTop: 3 },
  storySummary: { fontSize: 14, lineHeight: 20, color: COLORS.textSecondary, marginTop: 8 },

  mentorRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '92%' },
  avatarSlot: { width: 32, alignItems: 'center' },
  bubble: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  mentorBubble: { flexShrink: 1, backgroundColor: COLORS.bg2, borderBottomLeftRadius: 6 },
  userBubble: { alignSelf: 'flex-end', maxWidth: '82%', backgroundColor: COLORS.accent, borderBottomRightRadius: 6 },
  userText: { fontSize: 15, lineHeight: 22, color: '#FFFFFF' },
  typing: { paddingVertical: 14 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.textMuted },

  suggestionsRow: { flexGrow: 0 },
  suggestions: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  suggestionChip: { height: 36, justifyContent: 'center', borderRadius: 18, paddingHorizontal: 14, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  suggestionText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 8, backgroundColor: COLORS.bg0, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  input: { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: COLORS.bg2, borderRadius: 22, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 15, color: COLORS.textPrimary },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  sendOff: { opacity: 0.35 },
});
