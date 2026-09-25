/**
 * LeoVoiceChatOverlay — Fullscreen immersive voice-first study call with Leo.
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
  Keyboard,
  ScrollView,
  AppState,
} from 'react-native';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { speakWithElevenLabs, stopAllTTS } from '../../lib/tts';
import { isLeoMutedSync, loadLeoMuted, setLeoMuted } from '../../lib/voicePrefs';
import { triggerHaptic } from '../../lib/haptics';
import { log } from '../../lib/logger';


const { width: SCREEN_W } = Dimensions.get('window');
const LEO_STUDY_SCENE = require('../../assets/mascot/leo-voice-study.png');
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
  const [isMuted, setIsMuted] = useState(isLeoMutedSync());

  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const livePulse = useRef(new Animated.Value(1)).current;

  // Entrance animation
  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      setMessages([]);
      setNarrationText('');
      setShowTextInput(false);

      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

      // Auto-greet, unless Leo is muted — that choice is remembered.
      let cancelled = false;
      loadLeoMuted().then(muted => {
        setIsMuted(muted);
        if (cancelled) return;
        setTimeout(() => {
          if (cancelled) return;
          const greeting = "Hey! 🦊 Ask me anything about your industry!";
          setNarrationText(greeting);
          if (!muted) speakResponse(greeting);
        }, 600);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [visible]);


  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, livePulse]);

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
      stopAllTTS().catch(() => {});
      soundRef.current = null;
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
      setIsSpeaking(false);
    }
  }, [visible]);

  // Leaving the app, or unmounting the screen, always silences Leo.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        stopAllTTS().catch(() => {});
        soundRef.current = null;
        setIsSpeaking(false);
      }
    });
    return () => {
      subscription.remove();
      stopAllTTS().catch(() => {});
      soundRef.current = null;
    };
  }, []);

  const speakResponse = useCallback(async (text: string) => {
    if (isLeoMutedSync()) return;
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
        log.warn('Recording failed:', err);
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

  const handleMute = useCallback(async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    triggerHaptic('light');
    if (soundRef.current) {
      try {
        await soundRef.current.setVolumeAsync(nextMuted ? 0 : 1);
      } catch {
        // Audio may finish while the control is being pressed.
      }
    }
  }, [isMuted]);

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

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[st.container, { opacity: fadeAnim }]}>
          <Image source={LEO_STUDY_SCENE} style={st.sceneImage} resizeMode="cover" fadeDuration={0} />
          <View style={st.sceneShade} />
          <View style={st.bottomShade} />

          {/* Top bar */}
          <View style={[st.topBar, { paddingTop: insets.top + 12 }]}>
            <View style={st.statusBadge}>
              <Animated.View
                style={[
                  st.liveDot,
                  {
                    opacity: livePulse,
                    backgroundColor: isSpeaking ? '#F97316' : isRecording ? '#EF4444' : '#10B981',
                  },
                ]}
              />
              <Text style={st.statusBadgeText}>
                {isSpeaking ? 'Speaking' : isRecording ? 'Listening' : isGenerating ? 'Thinking' : 'Live'}
              </Text>
            </View>

            <View style={st.topBarRight}>
              <TouchableOpacity
                style={[st.topBtn, showTextInput && st.topBtnActive]}
                onPress={() => setShowTextInput(!showTextInput)}
                accessibilityRole="button"
                accessibilityLabel="Toggle text mode"
              >
                <Feather name="type" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={st.topBtn} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close Speak to Leo">
                <Feather name="x" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[st.dialogStage, { bottom: insets.bottom + 154 }]}>
            <View style={st.dialogTail} />
            <TouchableOpacity
              style={st.subtitleBox}
              onPress={() => setSubtitlesExpanded(!subtitlesExpanded)}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Leo's latest response"
            >
              {isGenerating || isTranscribing ? (
                <View style={st.statusRow}>
                  <ActivityIndicator size="small" color="#FB7A22" />
                  <Text style={st.subtitleText}>{isTranscribing ? 'Transcribing…' : 'Leo is thinking…'}</Text>
                </View>
              ) : subtitlesExpanded && messages.length > 0 ? (
                <ScrollView style={st.conversationScroll} contentContainerStyle={st.conversationContent} showsVerticalScrollIndicator>
                  {messages.map((message, index) => (
                    <View key={`${message.role}-${index}`} style={[st.conversationBubble, message.role === 'user' ? st.userConversationBubble : st.leoConversationBubble]}>
                      <Text style={st.conversationRole}>{message.role === 'user' ? 'YOU' : 'LEO'}</Text>
                      <Text style={st.conversationText}>{message.content}</Text>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={st.subtitleText} numberOfLines={4}>
                  {narrationText || "Hey! 🦊 Ask me anything about your industry!"}
                </Text>
              )}
              {!subtitlesExpanded && narrationText.length > 150 && (
                <Text style={st.expandHint}>Tap to read more</Text>
              )}
            </TouchableOpacity>

            <View style={st.statusContainer}>
              {isGenerating && (
                <Text style={st.statusText}>Preparing an answer</Text>
              )}
              {isRecording && (
                <View style={st.statusRow}>
                  <Animated.View style={[st.recordDot, { opacity: glowAnim }]} />
                  <Text style={st.statusText}>Listening… tap again to send</Text>
                </View>
              )}
              {isSpeaking && !isGenerating && (
                <Text style={st.statusText}>Leo is speaking…</Text>
              )}
            </View>
          </View>

          <View style={[st.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
            {showTextInput ? (
              <View style={st.keyboardComposer}>
                <TouchableOpacity style={st.keyboardDismiss} onPress={() => { Keyboard.dismiss(); setShowTextInput(false); }} accessibilityLabel="Hide keyboard">
                  <Feather name="chevron-down" size={18} color="#fff" />
                  <Text style={st.keyboardDismissText}>Hide keyboard</Text>
                </TouchableOpacity>
                <View style={st.textInputRow}>
                  <TextInput
                    style={st.textInput}
                    value={textInput}
                    onChangeText={setTextInput}
                    placeholder="Type a message..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    multiline
                    autoFocus
                    blurOnSubmit
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
              </View>
            ) : (
              <View style={st.callToolbar}>
                <TouchableOpacity
                  style={st.sideAction}
                  onPress={handleMute}
                  accessibilityRole="button"
                  accessibilityLabel={isMuted ? 'Unmute Leo' : 'Mute Leo'}
                >
                  <View style={[st.sideActionCircle, isMuted && st.sideActionCircleActive]}>
                    <Feather name={isMuted ? 'mic' : 'mic-off'} size={23} color="#fff" />
                  </View>
                  <Text style={st.sideActionLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={st.primaryAction}
                  onPress={handleLeoTap}
                  activeOpacity={0.8}
                  disabled={isGenerating || isTranscribing}
                  accessibilityRole="button"
                  accessibilityLabel={isRecording ? 'Stop and send recording' : 'Talk to Leo'}
                >
                  <Animated.View
                    style={[
                      st.bigMicBtn,
                      isRecording && st.bigMicBtnRecording,
                      { opacity: isGenerating || isTranscribing ? 0.55 : 1 },
                    ]}
                  >
                    <Feather name={isRecording ? 'square' : 'mic'} size={29} color="#fff" />
                  </Animated.View>
                  <Text style={st.primaryActionLabel}>{isRecording ? 'Tap to send' : 'Tap to talk to Leo'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={st.sideAction}
                  onPress={() => setShowTextInput(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Open keyboard"
                >
                  <View style={st.sideActionCircle}>
                    <Feather name="command" size={22} color="#fff" />
                  </View>
                  <Text style={st.sideActionLabel}>Keyboard</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  sceneImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  sceneShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3,5,18,0.12)',
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '43%',
    backgroundColor: 'rgba(3,5,18,0.72)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
    backgroundColor: 'rgba(14,16,31,0.76)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  topBtnActive: {
    backgroundColor: 'rgba(249,115,22,0.88)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(14,16,31,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.94)',
  },
  dialogStage: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  dialogTail: {
    width: 20,
    height: 20,
    marginBottom: -10,
    backgroundColor: 'rgba(15,17,31,0.9)',
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    transform: [{ rotate: '45deg' }],
    zIndex: 2,
  },
  statusContainer: {
    marginTop: 8,
    alignItems: 'center',
    minHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.68)',
    fontWeight: '600',
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },

  subtitleBox: {
    width: '100%',
    minHeight: 94,
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 28,
    backgroundColor: 'rgba(15,17,31,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    maxHeight: 286,
  },
  conversationScroll: { width: '100%', maxHeight: 232 },
  conversationContent: { gap: 10, paddingVertical: 2 },
  conversationBubble: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 14 },
  userConversationBubble: { backgroundColor: 'rgba(249,115,22,0.22)', alignSelf: 'flex-end', maxWidth: '88%' },
  leoConversationBubble: { backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'flex-start', maxWidth: '94%' },
  conversationRole: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.5)', marginBottom: 3 },
  conversationText: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: '#fff' },
  subtitleText: {
    fontSize: SCREEN_W < 370 ? 16 : 18,
    lineHeight: SCREEN_W < 370 ? 22 : 25,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  expandHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  callToolbar: {
    minHeight: 122,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sideAction: {
    width: 82,
    alignItems: 'center',
    gap: 9,
    paddingTop: 10,
  },
  sideActionCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(28,30,46,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideActionCircleActive: {
    borderColor: 'rgba(249,115,22,0.65)',
    backgroundColor: 'rgba(74,36,22,0.95)',
  },
  sideActionLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryAction: {
    minWidth: 132,
    alignItems: 'center',
    gap: 9,
  },
  bigMicBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.62,
    shadowRadius: 18,
    elevation: 14,
  },
  bigMicBtnRecording: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  primaryActionLabel: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingBottom: 8,
  },
  keyboardComposer: { gap: 8, paddingBottom: 8 },
  keyboardDismiss: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(28,30,46,0.9)' },
  keyboardDismissText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.76)' },
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
    minHeight: 48,
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
