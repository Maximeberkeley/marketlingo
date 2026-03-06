/**
 * AskLeoOverlay — Chat overlay for asking Leo questions about the current lesson.
 * Supports text input with AI-powered responses + TTS playback.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Animated,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { Audio } from 'expo-av';

const LEO_IMAGE = require('../../assets/mascot/leo-reference.png');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AskLeoOverlayProps {
  visible: boolean;
  onClose: () => void;
  lessonContext: string; // Current lesson title + content summary
}

export function AskLeoOverlay({ visible, onClose, lessonContext }: AskLeoOverlayProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 200,
        friction: 20,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/leo-voice-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          messages: newMessages,
          lessonContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.message || "Hmm, I couldn't respond. Try again!",
      };

      setMessages(prev => [...prev, assistantMsg]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Auto-play TTS for Leo's response
      playTTS(assistantMsg.content);
    } catch (error) {
      console.error('Ask Leo error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Oops! I had trouble connecting. Try again?" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, lessonContext]);

  const playTTS = useCallback(async (text: string) => {
    try {
      setIsPlayingAudio(true);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('TTS failed');

      if (Platform.OS === 'web') {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const webAudio = new window.Audio(audioUrl);
        webAudio.onended = () => setIsPlayingAudio(false);
        await webAudio.play();
      } else {
        // Native: use expo-av
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: `data:audio/mpeg;base64,${base64}` },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlayingAudio(false);
              sound.unloadAsync();
            }
          }
        );
      }
    } catch {
      setIsPlayingAudio(false);
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom on new message
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[
            styles.container,
            {
              paddingBottom: insets.bottom + 12,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [600, 0],
                }),
              }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Image source={LEO_IMAGE} style={styles.leoAvatar} />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Ask Leo</Text>
              <Text style={styles.headerSub}>
                {isPlayingAudio ? 'Speaking...' : 'Ask anything about this lesson'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 && (
              <View style={styles.emptyState}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(251,191,36,0.15)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 18, fontWeight: '700', color: '#FCD34D' }}>?</Text></View>
                <Text style={styles.emptyText}>
                  Ask me anything about the lesson! I'll explain it simply and read it aloud.
                </Text>
                <View style={styles.suggestions}>
                  {['Explain this simply', 'Give me an example', 'Why does this matter?'].map(
                    (suggestion) => (
                      <TouchableOpacity
                        key={suggestion}
                        style={styles.suggestionChip}
                        onPress={() => {
                          setInput(suggestion);
                        }}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            )}

            {messages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.leoBubble,
                ]}
              >
                {msg.role === 'assistant' && (
                  <Image source={LEO_IMAGE} style={styles.bubbleAvatar} />
                )}
                <View
                  style={[
                    styles.bubbleContent,
                    msg.role === 'user' ? styles.userBubbleContent : styles.leoBubbleContent,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      msg.role === 'user' ? styles.userBubbleText : styles.leoBubbleText,
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
                {msg.role === 'assistant' && (
                  <TouchableOpacity
                    style={styles.replayBtn}
                    onPress={() => playTTS(msg.content)}
                    disabled={isPlayingAudio}
                  >
                    <Text style={styles.replayIcon}>{isPlayingAudio ? '...' : '▶'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {isLoading && (
              <View style={[styles.messageBubble, styles.leoBubble]}>
                <Image source={LEO_IMAGE} style={styles.bubbleAvatar} />
                <View style={styles.leoBubbleContent}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                  <Text style={styles.thinkingText}>Leo is thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Ask Leo a question..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!input.trim() || isLoading}
            >
              <Text style={styles.sendText}>↑</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.bg0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  leoAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'contain',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestionChip: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  suggestionText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  leoBubble: {
    justifyContent: 'flex-start',
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    resizeMode: 'contain',
  },
  bubbleContent: {
    maxWidth: '75%',
    borderRadius: 18,
    padding: 14,
  },
  userBubbleContent: {
    backgroundColor: COLORS.accent,
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  leoBubbleContent: {
    backgroundColor: COLORS.bg2,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userBubbleText: {
    color: '#fff',
  },
  leoBubbleText: {
    color: COLORS.textPrimary,
  },
  thinkingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  replayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayIcon: {
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    maxHeight: 100,
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
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
});
