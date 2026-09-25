/**
 * AskLeoOverlay — Leo's in-lesson study partner.
 *
 * More than a chat: one-tap modes (simpler, example, why it matters, quiz me),
 * a visible "you're asking about…" strip, animated Leo, typed-out answers,
 * voice input, and save-to-notes so help becomes revision material.
 */
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { speakWithElevenLabs, stopAllTTS } from '../../lib/tts';
import { isLeoMutedSync, loadLeoMuted, setLeoMuted } from '../../lib/voicePrefs';

import * as Haptics from 'expo-haptics';
import { tokens } from '../../lesson-kit/theme/tokens';
import { supabase } from '../../lib/supabase';
import { Audio } from 'expo-av';
import { useAIConsent } from '../../hooks/useAIConsent';
import { isFeatureEnabled } from '../../hooks/useFeatureFlags';
import { AIConsentModal } from './AIConsentModal';
import { transcribeAudio } from '../../lib/interviewVoice';
import { LeoCharacter } from '../mascot/LeoCharacter';
import { log } from '../../lib/logger';

const LEO_VOICE_ID = 'onwK4e9ZLuTAKqWW03F9'; // Daniel - friendly educator

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export interface LeoMessage {
  role: 'user' | 'assistant';
  content: string;
}

type ModeId = 'simpler' | 'example' | 'why' | 'quiz';

interface Mode {
  id: ModeId;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  /** What the learner is shown as having asked. */
  ask: string;
  /** Extra instruction appended for Leo. */
  instruction: string;
}

const MODES: Mode[] = [
  {
    id: 'simpler',
    label: 'Explain simpler',
    icon: 'feather',
    color: tokens.color.accent,
    ask: 'Explain this simpler.',
    instruction:
      'Re-explain the current card at a 9th-grade level in two short sentences, using one everyday comparison.',
  },
  {
    id: 'example',
    label: 'Give an example',
    icon: 'briefcase',
    color: tokens.color.signalData,
    ask: 'Give me a real example.',
    instruction:
      'Give one concrete example from this industry — a real company, deal or number — in two short sentences.',
  },
  {
    id: 'why',
    label: 'Why it matters',
    icon: 'target',
    color: tokens.color.signalEnergy,
    ask: 'Why does this matter?',
    instruction:
      'In two short sentences, say where this shows up in a real job, interview or investment call.',
  },
  {
    id: 'quiz',
    label: 'Quiz me',
    icon: 'zap',
    color: tokens.color.correctDark,
    ask: 'Quiz me on this.',
    instruction:
      'Ask exactly one short question about the current card, with three lettered options (A, B, C). Do not reveal the answer yet. When the learner replies, say if they are right in one sentence and why.',
  },
];

interface AskLeoOverlayProps {
  visible: boolean;
  onClose: () => void;
  /** Current lesson title + card content summary. */
  lessonContext: string;
  /** One-line label of the card the learner is on, shown in the context strip. */
  contextLabel?: string;
  /** Market accent colour so the sheet matches the lesson world. */
  accentColor?: string;
  /** Conversation lifted to the lesson so it survives closing the sheet. */
  messages?: LeoMessage[];
  onMessagesChange?: (messages: LeoMessage[]) => void;
  /** A question asked automatically the first time the sheet opens. */
  autoAsk?: string | null;
  /** Save one of Leo's answers to the notebook. */
  onSaveAnswer?: (text: string) => void;
}

export function AskLeoOverlay({
  visible,
  onClose,
  lessonContext,
  contextLabel,
  accentColor,
  messages: externalMessages,
  onMessagesChange,
  autoAsk,
  onSaveAnswer,
}: AskLeoOverlayProps) {
  const insets = useSafeAreaInsets();
  const [internalMessages, setInternalMessages] = useState<LeoMessage[]>([]);
  const messages = externalMessages ?? internalMessages;
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [typed, setTyped] = useState<string | null>(null);
  const [muted, setMuted] = useState(isLeoMutedSync());

  const [saved, setSaved] = useState<number[]>([]);
  // Mode cards open BIG on every entry, then collapse to compact chips once
  // the learner picks one or types a question. Reopening the sheet resets it.
  const [modesExpanded, setModesExpanded] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const modesAnim = useRef(new Animated.Value(1)).current;
  const recording = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAsked = useRef(false);
  const { requireAI, modalProps } = useAIConsent();

  const accent = accentColor || tokens.color.accent;

  const collapseModes = useCallback(() => {
    Animated.timing(modesAnim, { toValue: 0, duration: 180, useNativeDriver: true })
      .start(() => setModesExpanded(false));
  }, [modesAnim]);

  const setMessages = useCallback(
    (next: LeoMessage[]) => {
      if (onMessagesChange) onMessagesChange(next);
      else setInternalMessages(next);
    },
    [onMessagesChange],
  );

  useEffect(() => {
    if (visible) {
      // Every entry starts with the big mode cards.
      setModesExpanded(true);
      modesAnim.setValue(1);
      loadLeoMuted().then(setMuted);
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 190,
        friction: 22,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(0);
      autoAsked.current = false;
      // Closing the sheet silences Leo at once, including audio still arriving.
      stopAllTTS().catch(() => {});
      soundRef.current = null;
      setIsPlayingAudio(false);
    }
  }, [visible, slideAnim, modesAnim]);

  // Unmounting the lesson must never leave Leo talking.
  useEffect(() => () => {
    stopAllTTS().catch(() => {});
    soundRef.current = null;
  }, []);

  const stopAudio = useCallback(async () => {
    await stopAllTTS();
    soundRef.current = null;
    setIsPlayingAudio(false);
  }, []);

  const toggleMute = useCallback(async () => {
    const next = !muted;
    setMuted(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await setLeoMuted(next);
    if (next) await stopAudio();
  }, [muted, stopAudio]);


  const playTTS = useCallback(
    async (text: string) => {
      if (isPlayingAudio) {
        await stopAudio();
        return;
      }
      if (isLeoMutedSync()) return;

      try {
        setIsPlayingAudio(true);
        if (Platform.OS === 'web') {
          const { data: { session } } = await supabase.auth.getSession();
          const authHeader = session?.access_token
            ? `Bearer ${session.access_token}`
            : `Bearer ${SUPABASE_ANON_KEY}`;
          const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY || '',
              Authorization: authHeader,
            },
            body: JSON.stringify({ text, voiceId: LEO_VOICE_ID }),
          });
          if (!response.ok) throw new Error('TTS failed');
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const webAudio = new window.Audio(audioUrl);
          webAudio.onended = () => setIsPlayingAudio(false);
          await webAudio.play();
        } else {
          const sound = await speakWithElevenLabs(text, LEO_VOICE_ID, 'leo_chat');
          soundRef.current = sound ?? null;
          if (sound) {
            sound.setOnPlaybackStatusUpdate((status: any) => {
              if (status.didJustFinish) {
                setIsPlayingAudio(false);
                sound.unloadAsync().catch(() => {});
                soundRef.current = null;
              }
            });
          } else {
            setIsPlayingAudio(false);
          }
        }
      } catch {
        setIsPlayingAudio(false);
      }
    },
    [isPlayingAudio, stopAudio],
  );

  /** Types Leo's answer out word by word so it feels like he's talking. */
  const typeOut = useCallback((text: string) => {
    if (typingTimer.current) clearInterval(typingTimer.current);
    const words = text.split(' ');
    let i = 0;
    setTyped('');
    typingTimer.current = setInterval(() => {
      i += 1;
      setTyped(words.slice(0, i).join(' '));
      if (i >= words.length) {
        if (typingTimer.current) clearInterval(typingTimer.current);
        typingTimer.current = null;
        setTyped(null);
      }
    }, 45);
  }, []);

  useEffect(
    () => () => {
      if (typingTimer.current) clearInterval(typingTimer.current);
      soundRef.current?.unloadAsync().catch(() => {});
    },
    [],
  );

  const ask = useCallback(
    async (text: string, instruction?: string) => {
      const question = text.trim();
      if (!question || isLoading) return;

      if (!(await isFeatureEnabled('ai_leo'))) {
        setMessages([
          ...messages,
          {
            role: 'assistant',
            content:
              'Leo is taking a short break. Your lessons, drills and reviews all still work.',
          },
        ]);
        return;
      }
      if (!(await requireAI())) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      collapseModes();
      const next: LeoMessage[] = [...messages, { role: 'user', content: question }];
      setMessages(next);
      setInput('');
      setIsLoading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const payload = instruction
          ? [...next.slice(0, -1), { role: 'user' as const, content: `${question}\n\n${instruction}` }]
          : next;

        const response = await fetch(`${SUPABASE_URL}/functions/v1/leo-voice-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
            apikey: SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({ messages: payload, lessonContext }),
        });

        if (!response.ok) throw new Error(`Request failed: ${response.status}`);

        const data = await response.json();
        const answer: string = data.message || "Hmm, that one lost me. Ask me again?";
        setMessages([...next, { role: 'assistant', content: answer }]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        typeOut(answer);
        playTTS(answer);
      } catch (error) {
        log.error('Ask Leo error:', error);
        setMessages([
          ...next,
          { role: 'assistant', content: "I lost the connection there. Try that once more?" },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, setMessages, requireAI, lessonContext, typeOut, playTTS, collapseModes],
  );

  // Auto-ask (e.g. "Explain this" from a wrong answer) so the sheet opens on an answer.
  useEffect(() => {
    if (visible && autoAsk && !autoAsked.current) {
      autoAsked.current = true;
      ask(autoAsk);
    }
  }, [visible, autoAsk, ask]);

  const startRecording = useCallback(async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recording.current = rec;
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch (err) {
      log.warn('Leo voice record error:', err);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const rec = recording.current;
    recording.current = null;
    setIsRecording(false);
    if (!rec) return;
    try {
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = rec.getURI();
      if (!uri) return;
      setIsLoading(true);
      const text = await transcribeAudio(uri);
      setIsLoading(false);
      if (text?.trim()) ask(text.trim());
    } catch (err) {
      setIsLoading(false);
      log.warn('Leo transcription error:', err);
    }
  }, [ask]);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [messages, typed]);

  const lastIndex = messages.length - 1;
  const leoMood = useMemo(() => {
    if (isLoading) return 'thinking' as const;
    if (typed !== null || isPlayingAudio) return 'waving' as const;
    return 'idle' as const;
  }, [isLoading, typed, isPlayingAudio]);

  const handleSave = useCallback(
    (idx: number, text: string) => {
      onSaveAnswer?.(text);
      setSaved(s => [...s, idx]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
    [onSaveAnswer],
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.container,
            {
              paddingBottom: insets.bottom + 10,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [700, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.grabber} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeo}>
              <LeoCharacter size="sm" animation={leoMood} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Leo</Text>
              <Text style={styles.headerSub}>
                {isLoading
                  ? 'Thinking it through…'
                  : isPlayingAudio
                  ? 'Talking'
                  : 'Your study partner for this card'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleMute}
              style={[styles.closeBtn, muted && styles.mutedBtn]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={muted ? 'Turn Leo\'s voice back on' : 'Mute Leo\'s voice'}
            >
              <Feather
                name={muted ? 'volume-x' : 'volume-2'}
                size={18}
                color={muted ? tokens.color.accent : tokens.color.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={18} color={tokens.color.textSecondary} />
            </TouchableOpacity>

          </View>

          {/* Context strip — what he's answering about */}
          {!!contextLabel && (
            <View style={[styles.contextStrip, { borderLeftColor: accent }]}>
              <Text style={styles.contextLabel}>You're asking about</Text>
              <Text style={styles.contextText} numberOfLines={2}>
                {contextLabel}
              </Text>
            </View>
          )}

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 && !isLoading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Stuck on this one?</Text>
                <Text style={styles.emptyText}>
                  Pick a shortcut below, type it, or hold the mic and just say it.
                </Text>
              </View>
            )}

            {messages.map((msg, idx) => {
              const isTyping = idx === lastIndex && msg.role === 'assistant' && typed !== null;
              const body = isTyping ? typed || '' : msg.content;
              return (
                <View
                  key={idx}
                  style={[styles.row, msg.role === 'user' ? styles.rowUser : styles.rowLeo]}
                >
                  <View
                    style={[
                      styles.bubble,
                      msg.role === 'user'
                        ? [styles.userBubble, { backgroundColor: accent }]
                        : styles.leoBubble,
                    ]}
                  >
                    <Text style={msg.role === 'user' ? styles.userText : styles.leoText}>
                      {body}
                      {isTyping ? ' ▍' : ''}
                    </Text>
                  </View>
                  {msg.role === 'assistant' && !isTyping && (
                    <View style={styles.answerActions}>
                      <TouchableOpacity style={styles.answerBtn} onPress={() => playTTS(msg.content)}>
                        <Feather
                          name={isPlayingAudio ? 'pause' : 'volume-2'}
                          size={14}
                          color={tokens.color.textSecondary}
                        />
                        <Text style={styles.answerBtnText}>
                          {isPlayingAudio ? 'Stop' : 'Listen'}
                        </Text>
                      </TouchableOpacity>
                      {!!onSaveAnswer && (
                        <TouchableOpacity
                          style={styles.answerBtn}
                          onPress={() => handleSave(idx, msg.content)}
                          disabled={saved.includes(idx)}
                        >
                          <Feather
                            name={saved.includes(idx) ? 'check' : 'bookmark'}
                            size={14}
                            color={saved.includes(idx) ? tokens.color.correctDark : tokens.color.textSecondary}
                          />
                          <Text
                            style={[
                              styles.answerBtnText,
                              saved.includes(idx) && { color: tokens.color.correctDark },
                            ]}
                          >
                            {saved.includes(idx) ? 'In Notes' : 'Save to Notes'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {isLoading && (
              <View style={[styles.row, styles.rowLeo]}>
                <View style={[styles.bubble, styles.leoBubble, styles.thinkingBubble]}>
                  <Text style={styles.thinkingText}>Leo is thinking…</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Modes — big cards on entry, compact chips once a question is asked */}
          {modesExpanded ? (
            <Animated.View style={{ opacity: modesAnim }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modeRowBig}
                keyboardShouldPersistTaps="handled"
              >
                {MODES.map(mode => (
                  <TouchableOpacity
                    key={mode.id}
                    style={[styles.modeCard, { borderColor: mode.color + '66', backgroundColor: mode.color + '14' }]}
                    onPress={() => ask(mode.ask, mode.instruction)}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.modeCardIcon, { backgroundColor: mode.color + '22' }]}>
                      <Feather name={mode.icon} size={22} color={mode.color} />
                    </View>
                    <Text style={[styles.modeCardText, { color: mode.color }]}>{mode.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          ) : (
            <View style={styles.modeRowSmallWrap}>
              <TouchableOpacity
                style={styles.modeExpandBtn}
                onPress={() => {
                  setModesExpanded(true);
                  Animated.timing(modesAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="grid" size={14} color={tokens.color.textMuted} />
              </TouchableOpacity>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modeRow}
                keyboardShouldPersistTaps="handled"
              >
                {MODES.map(mode => (
                  <TouchableOpacity
                    key={mode.id}
                    style={[styles.modeChip, { borderColor: mode.color + '55', backgroundColor: mode.color + '12' }]}
                    onPress={() => ask(mode.ask, mode.instruction)}
                    disabled={isLoading}
                  >
                    <Feather name={mode.icon} size={13} color={mode.color} />
                    <Text style={[styles.modeText, { color: mode.color }]}>{mode.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder={isRecording ? 'Listening…' : 'Ask Leo anything…'}
              placeholderTextColor={tokens.color.textMuted}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => ask(input)}
            />
            {input.trim().length === 0 ? (
              <TouchableOpacity
                style={[styles.micBtn, isRecording && { backgroundColor: tokens.color.incorrect }]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                disabled={isLoading}
              >
                <Feather name="mic" size={20} color={isRecording ? '#fff' : accent} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: accent }, isLoading && styles.disabled]}
                onPress={() => ask(input)}
                disabled={isLoading}
              >
                <Feather name="arrow-up" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          {isRecording && <Text style={styles.micHint}>Hold to talk, release to send</Text>}
        </Animated.View>
      </KeyboardAvoidingView>
      <AIConsentModal {...modalProps} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,17,26,0.55)', justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  container: {
    backgroundColor: tokens.color.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    minHeight: '62%',
    shadowColor: '#0F111A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.color.borderStrong,
    alignSelf: 'center',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 10,
  },
  headerLeo: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: tokens.color.text },
  headerSub: { fontSize: 12, color: tokens.color.textMuted, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  mutedBtn: {
    backgroundColor: tokens.color.accentSoft,
    borderWidth: 1,
    borderColor: tokens.color.accent,
  },

  contextStrip: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingLeft: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    backgroundColor: tokens.color.surface,
    borderRadius: 10,
  },
  contextLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.color.textMuted,
  },
  contextText: { fontSize: 14, fontWeight: '700', color: tokens.color.text, marginTop: 2 },
  messagesScroll: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingBottom: 12, gap: 14 },
  emptyState: { paddingVertical: 24, paddingHorizontal: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: tokens.color.text, marginBottom: 6 },
  emptyText: { fontSize: 15, lineHeight: 22, color: tokens.color.textSecondary },
  row: { maxWidth: '92%' },
  rowUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowLeo: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 24, paddingHorizontal: 16, paddingVertical: 13 },
  userBubble: { borderBottomRightRadius: 14 },
  leoBubble: {
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderBottomLeftRadius: 14,
  },
  thinkingBubble: { paddingVertical: 10 },
  userText: { fontSize: 15, lineHeight: 22, color: '#fff', fontWeight: '600' },
  leoText: { fontSize: 15, lineHeight: 23, color: tokens.color.text },
  thinkingText: { fontSize: 14, color: tokens.color.textMuted, fontStyle: 'italic' },
  answerActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  answerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  answerBtnText: { fontSize: 12, fontWeight: '700', color: tokens.color.textSecondary },
  modeRow: { paddingRight: 16, paddingBottom: 10, gap: 8 },
  modeRowSmallWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    gap: 8,
  },
  modeExpandBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    marginBottom: 10,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  modeText: { fontSize: 13, fontWeight: '800' },
  modeRowBig: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  modeCard: {
    width: 148,
    height: 132,
    borderRadius: 22,
    borderWidth: 2,
    padding: 14,
    justifyContent: 'space-between',
  },
  modeCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCardText: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: tokens.color.surface,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    color: tokens.color.text,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  micBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.color.surface,
    borderWidth: 1.5,
    borderColor: tokens.color.border,
  },
  micHint: {
    textAlign: 'center',
    fontSize: 12,
    color: tokens.color.textMuted,
    paddingTop: 6,
  },
  disabled: { opacity: 0.5 },
});
