/**
 * LeoVoiceChatOverlay — Fullscreen immersive voice-first chat with Leo.
 * Same layout as Sophia's ImmersiveNewsOverlay: dark bg, centered avatar, tap to record.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { speakWithElevenLabs } from '../../lib/tts';
import { triggerHaptic } from '../../lib/haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const LEO_IMAGE = require('../../assets/mascot/leo-reference.png');
const LEO_VOICE_ID = 'onwK4e9ZLuTAKqWW03F9'; // Daniel
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LeoVoiceChatOverlayProps {
  visible: boolean;
  onClose: () => void;
  marketId?: string;
  lessonContext?: string;
}

async function transcribeVoice(uri: string): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const authHeader = session?.access_token
      ? `Bearer ${session.access_token}`
      : `Bearer ${SUPABASE_ANON_KEY}`;

    const formData = new FormData();
    formData.append('audio', { uri, type: 'audio/m4a', name: 'recording.m4a' } as any);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-stt`, {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: formData,
    });

    if (!response.ok) return '';
    const data = await response.json();
    return data.text || '';
  } catch {
    return '';
  }
}

export function LeoVoiceChatOverlay({
  visible,
  onClose,
  marketId = 'general',
  lessonContext,
}: LeoVoiceChatOverlayProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [narrationText, setNarrationText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [subtitlesExpanded, setSubtitlesExpanded] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const leoScale = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Entrance animation
  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      leoScale.setValue(0);
      setMessages([]);
      setNarrationText('');
      setShowTextInput(false);

      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(leoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]).start();

      // Auto-greet
      setTimeout(() => {
        const greeting = "Hey! 🦊 Tap me and ask anything about your industry!";
        setNarrationText(greeting);
        speakResponse(greeting);
      }, 600);
    }
  }, [visible]);

  // Pulse animation for speaking
  useEffect(() => {
    if (isSpeaking) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSpeaking]);

  // Glow animation for recording
  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      glowAnim.setValue(0);
    }
  }, [isRecording]);

  // Cleanup on close
  useEffect(() => {
    if (!visible) {
      soundRef.current?.stopAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
  }, [visible]);

  const speakResponse = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      const sound = await speakWithElevenLabs(text, LEO_VOICE_ID, 'leo_home');
      soundRef.current = sound;
      if (sound) {
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            setIsSpeaking(false);
            soundRef.current = null;
          }
        });
      } else {
        setIsSpeaking(false);
      }
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  const sendToLeo = useCallback(async (userText: string) => {
    const userMsg: Message = { role: 'user', content: userText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsGenerating(true);
    setSubtitlesExpanded(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/leo-voice-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          messages: updatedMessages,
          lessonContext: lessonContext || `${marketId} industry learning`,
        }),
      });

      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const data = await response.json();
      const reply = data?.message || "Hmm, let me think about that... 🤔";

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      setNarrationText(reply);
      setIsGenerating(false);
      await speakResponse(reply);
    } catch {
      const fallback = "Oops, I had a hiccup! Try again. 🦊";
      setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
      setNarrationText(fallback);
      setIsGenerating(false);
    }
  }, [messages, marketId, lessonContext, speakResponse]);

  // Tap Leo to record/stop
  const handleLeoTap = useCallback(async () => {
    triggerHaptic('light');

    if (isRecording) {
      // Stop recording → transcribe → send
      setIsRecording(false);
      setIsTranscribing(true);

      try {
        const recording = recordingRef.current;
        if (!recording) { setIsTranscribing(false); return; }
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        recordingRef.current = null;

        if (!uri) { setIsTranscribing(false); return; }

        const transcription = await transcribeVoice(uri);
        setIsTranscribing(false);

        if (!transcription.trim()) return;
        await sendToLeo(transcription);
      } catch {
        setIsTranscribing(false);
      }
    } else {
      // Stop any playing audio
      if (soundRef.current) {
        try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {}
        soundRef.current = null;
        setIsSpeaking(false);
      }

      // Start recording
      try {
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) return;

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY,
        );
        recordingRef.current = recording;
        setIsRecording(true);
      } catch (err) {
        console.warn('Recording failed:', err);
      }
    }
  }, [isRecording, sendToLeo]);

  const handleSendText = useCallback(async () => {
    const text = textInput.trim();
    if (!text || isGenerating) return;
    setTextInput('');
    setShowTextInput(false);
    await sendToLeo(text);
  }, [textInput, isGenerating, sendToLeo]);

  const handleClose = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.stopAsync().catch(() => {});
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    setIsRecording(false);
    setIsSpeaking(false);
    setMessages([]);
    setNarrationText('');
    onClose();
  }, [onClose]);

  if (!visible) return null;

  const ringColor = isRecording
    ? '#EF4444'
    : isSpeaking
    ? '#F97316'
    : 'rgba(255,255,255,0.3)';

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[st.container, { opacity: fadeAnim }]}>
          {/* Dark gradient background */}
          <View style={st.bgGradient} />

          {/* Top bar */}
          <View style={[st.topBar, { paddingTop: insets.top + 12 }]}>
            <View style={st.statusBadge}>
              <View style={[st.liveDot, { backgroundColor: isSpeaking ? '#F97316' : isRecording ? '#EF4444' : '#10B981' }]} />
              <Text style={st.statusBadgeText}>
                {isSpeaking ? 'Speaking' : isRecording ? 'Listening' : isGenerating ? 'Thinking' : 'Live'}
              </Text>
            </View>

            <View style={st.topBarRight}>
              {/* Text input toggle */}
              <TouchableOpacity
                style={st.topBtn}
                onPress={() => setShowTextInput(!showTextInput)}
              >
                <Feather name="type" size={18} color="#fff" />
              </TouchableOpacity>
              {/* Close */}
              <TouchableOpacity style={st.topBtn} onPress={handleClose}>
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Center stage — Leo avatar */}
          <View style={st.centerStage}>
            <Animated.View
              style={[
                st.leoRing,
                {
                  transform: [{ scale: Animated.multiply(leoScale, pulseAnim) }],
                  borderColor: ringColor,
                },
              ]}
            >
              <TouchableOpacity onPress={handleLeoTap} activeOpacity={0.8}>
                <Image source={LEO_IMAGE} style={st.leoAvatar} />
                {isRecording && (
                  <Animated.View style={[st.micBadge, { opacity: glowAnim }]}>
                    <Feather name="mic" size={14} color="#fff" />
                  </Animated.View>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Status text */}
            <View style={st.statusContainer}>
              {isGenerating && (
                <View style={st.statusRow}>
                  <ActivityIndicator size="small" color="#F97316" />
                  <Text style={st.statusText}>Leo is thinking...</Text>
                </View>
              )}
              {isTranscribing && (
                <View style={st.statusRow}>
                  <ActivityIndicator size="small" color="#F97316" />
                  <Text style={st.statusText}>Transcribing...</Text>
                </View>
              )}
              {isRecording && (
                <View style={st.statusRow}>
                  <Animated.View style={[st.recordDot, { opacity: glowAnim }]} />
                  <Text style={st.statusText}>Listening... Tap Leo again to send</Text>
                </View>
              )}
              {isSpeaking && !isGenerating && (
                <Text style={st.statusText}>🎙 Leo is speaking...</Text>
              )}
              {!isSpeaking && !isGenerating && !isRecording && !isTranscribing && narrationText && (
                <Text style={st.statusText}>Tap Leo to ask a question</Text>
              )}
              {!narrationText && !isGenerating && !isRecording && !isTranscribing && !isSpeaking && (
                <Text style={st.statusText}>Tap Leo to start talking</Text>
              )}
            </View>

            {/* Narration subtitle */}
            {narrationText && !isGenerating && (
              <TouchableOpacity
                style={st.subtitleBox}
                onPress={() => setSubtitlesExpanded(!subtitlesExpanded)}
                activeOpacity={0.8}
              >
                <Text style={st.subtitleText} numberOfLines={subtitlesExpanded ? undefined : 3}>
                  {narrationText}
                </Text>
                {!subtitlesExpanded && narrationText.length > 100 && (
                  <Text style={st.expandHint}>Tap to read more</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Conversation history (scrollable, semi-transparent) */}
          {messages.length > 1 && (
            <ScrollView
              style={st.historyScroll}
              contentContainerStyle={st.historyContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.slice(0, -1).map((msg, i) => (
                <View key={i} style={[st.historyBubble, msg.role === 'user' && st.historyBubbleUser]}>
                  <Text style={[st.historyText, msg.role === 'user' && st.historyTextUser]}>
                    {msg.content}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Bottom — text input or mic hint */}
          <View style={[st.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
            {showTextInput ? (
              <View style={st.textInputRow}>
                <TextInput
                  style={st.textInput}
                  value={textInput}
                  onChangeText={setTextInput}
                  placeholder="Type a message..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  multiline
                  maxLength={500}
                  returnKeyType="send"
                  onSubmitEditing={handleSendText}
                />
                <TouchableOpacity
                  style={[st.sendBtn, (!textInput.trim() || isGenerating) && { opacity: 0.4 }]}
                  onPress={handleSendText}
                  disabled={!textInput.trim() || isGenerating}
                >
                  <Feather name="arrow-up" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={st.micHintRow}>
                <TouchableOpacity
                  style={[
                    st.bigMicBtn,
                    isRecording && st.bigMicBtnRecording,
                  ]}
                  onPress={handleLeoTap}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={isRecording ? 'mic-off' : 'mic'}
                    size={24}
                    color="#fff"
                  />
                </TouchableOpacity>
                <Text style={st.micHintText}>
                  {isRecording ? 'Tap to stop' : 'Tap to talk to Leo'}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const TOP_PADDING = Platform.OS === 'ios' ? 56 : 40;

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A1A',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 12,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },

  // Center Leo
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    zIndex: 10,
  },
  leoRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  leoAvatar: {
    width: 136,
    height: 136,
    borderRadius: 68,
    resizeMode: 'contain',
  },
  micBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },

  // Status
  statusContainer: {
    marginTop: 20,
    alignItems: 'center',
    minHeight: 30,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },

  // Subtitle
  subtitleBox: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    maxWidth: SCREEN_W - 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  subtitleText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '400',
  },
  expandHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
  },

  // History
  historyScroll: {
    maxHeight: 120,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  historyContent: {
    gap: 6,
    paddingVertical: 4,
  },
  historyBubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  historyBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(249,115,22,0.2)',
  },
  historyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },
  historyTextUser: {
    color: 'rgba(255,255,255,0.8)',
  },

  // Bottom
  bottomBar: {
    paddingHorizontal: 24,
    zIndex: 10,
  },
  micHintRow: {
    alignItems: 'center',
    gap: 12,
  },
  bigMicBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  bigMicBtnRecording: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  micHintText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
