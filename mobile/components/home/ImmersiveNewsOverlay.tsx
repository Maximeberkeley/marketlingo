/**
 * ImmersiveNewsOverlay — TikTok/Stories-style fullscreen news experience.
 * Sophia narrates why each article matters for the user's goal.
 * Swipe left/right = next/previous story, scroll to read, Ask Sophia = voice Q&A.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
  ActivityIndicator,
  Linking,
  StatusBar,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPE } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { speakWithElevenLabs } from '../../lib/tts';
import { log } from '../../lib/logger';

// ── Types ──
interface NewsItem {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  categoryTag: string;
  summary?: string;
  imageUrl?: string | null;
}

interface ImmersiveNewsOverlayProps {
  visible: boolean;
  articles: NewsItem[];
  initialIndex: number;
  onClose: () => void;
  onOpenChat: (article: NewsItem) => void;
  onQuiz?: (article: NewsItem) => void;
  /** Fires for each story the learner actually lands on. */
  onArticleView?: (article: NewsItem) => void;
  marketId: string;
  learningGoal?: string;
}

// ── Constants ──
const SWIPE_THRESHOLD = 80;
/** Story copy and controls stay a readable column on iPad and in Split View. */
export const STORY_COLUMN_MAX = 720;
const SOPHIA_VOICE_ID = 'pFZP5JQG7iQjIQuC4Bku'; // Lily (Sophia’s previous voice)
const EDGE_URL = process.env.EXPO_PUBLIC_EDGE_FUNCTIONS_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

const SOPHIA_MUTED_KEY = 'news_sophia_muted';
const sophiaAvatar = require('../../assets/mentors/mentor-sophia.png');

const GOAL_LABELS: Record<string, string> = {
  join_industry: 'joining and building a career in',
  invest: 'investing in',
  build_startup: 'finding a valuable gap in',
  curiosity: 'learning about and understanding',
};

// ── Helpers ──
async function generateNarration(article: NewsItem, marketId: string, goal: string): Promise<string> {
  const goalPhrase = GOAL_LABELS[goal] || 'learning about';
  const { data: { session } } = await supabase.auth.getSession();
  const authHeader = session?.access_token
    ? `Bearer ${session.access_token}`
    : `Bearer ${SUPABASE_ANON_KEY}`;

  const systemPrompt = `You are Sophia Hernández, a warm and inspiring Growth Advisor. You're narrating a news briefing in a conversational, podcast-style tone. Keep it under 4 sentences (about 30 seconds when spoken). Be direct and insightful — no filler.

Rules:
- Start with a brief hook about the news (1 sentence)
- Explain why it matters for someone whose goal is ${goalPhrase} the ${marketId} industry (2 sentences)
- End with an actionable insight or encouraging nudge (1 sentence)
- Don't use markdown, lists, or special formatting — this will be spoken aloud
- Sound natural and warm, like you're talking to a friend`;

  const userMessage = `News article to discuss:
Title: "${article.title}"
Source: ${article.sourceName}
Summary: ${article.summary || 'No summary available'}
Category: ${article.categoryTag}`;

  const { data, error } = await supabase.functions.invoke('mentor-chat', {
    body: {
      messages: [{ role: 'user', content: userMessage }],
      systemPrompt,
    },
  });

  if (error) throw error;
  return data?.message || "I couldn't generate insights for this article right now.";
}

async function speakText(text: string, voiceId: string): Promise<Audio.Sound | null> {
  if (!text || text.trim().length < 5) {
    log.warn('[Sophia TTS] Text too short to speak');
    return null;
  }
  try {
    log.debug('[Sophia TTS] Calling speakWithElevenLabs, text length:', text.length);
    const sound = await speakWithElevenLabs(text, voiceId, 'sophia_news');
    if (!sound) {
      log.warn('[Sophia TTS] speakWithElevenLabs returned null — check env vars and edge function');
    }
    return sound;
  } catch (err) {
    log.error('[Sophia TTS] Error:', err);
    return null;
  }
}

async function transcribeVoice(uri: string): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const authHeader = session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${SUPABASE_ANON_KEY}`;

    const formData = new FormData();
    formData.append('audio', { uri, type: 'audio/m4a', name: 'recording.m4a' } as any);

    const response = await fetch(`${EDGE_URL}/functions/v1/elevenlabs-stt`, {
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

// ── Component ──
export function ImmersiveNewsOverlay({
  visible,
  articles,
  initialIndex,
  onClose,
  onOpenChat,
  onQuiz,
  onArticleView,
  marketId,
  learningGoal = 'curiosity',
}: ImmersiveNewsOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  // Live window size: iPad rotation and Split View resize the window while a story is open.
  const { width: windowW, height: windowH } = useWindowDimensions();
  const windowSize = useRef({ w: windowW, h: windowH });
  windowSize.current = { w: windowW, h: windowH };
  const insets = useSafeAreaInsets();
  const [narrationText, setNarrationText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDoneSpeaking, setIsDoneSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [subtitlesExpanded, setSubtitlesExpanded] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  // Mute is remembered on-device until the learner taps it again.
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const [muteLoaded, setMuteLoaded] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(SOPHIA_MUTED_KEY)
      .then((v) => { mutedRef.current = v === '1'; setMuted(v === '1'); })
      .catch(() => {})
      .finally(() => setMuteLoaded(true));
  }, []);
  const toggleMute = useCallback(async () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    AsyncStorage.setItem(SOPHIA_MUTED_KEY, next ? '1' : '0').catch(() => {});
    if (next && soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
      setIsSpeaking(false);
      setIsDoneSpeaking(true);
    }
  }, []);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const currentIndexRef = useRef(currentIndex);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sophiaScale = useRef(new Animated.Value(0)).current;

  // Keep ref in sync
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  const article = articles[currentIndex];

  // Count every story the learner lands on toward their daily intel reads.
  useEffect(() => {
    if (visible && article && onArticleView) onArticleView(article);
  }, [visible, article?.id]);

  // Reset state when index or visibility changes
  useEffect(() => {
    if (visible && article) {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  // Entrance animation
  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      sophiaScale.setValue(0);
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(sophiaScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  // Generate narration when article changes
  useEffect(() => {
    if (!visible || !article || !muteLoaded) return;
    let cancelled = false;

    const run = async () => {
      // Stop previous audio
      if (soundRef.current) {
        try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {}
        soundRef.current = null;
      }
      setNarrationText('');
      setIsSpeaking(false);
      setIsDoneSpeaking(false);
      setIsGenerating(true);

      try {
        const text = await generateNarration(article, marketId, learningGoal);
        if (cancelled) return;
        setNarrationText(text);
        setIsGenerating(false);

        if (mutedRef.current) { setIsDoneSpeaking(true); return; }
        // Auto-speak — only set isSpeaking AFTER audio loads
        const sound = await speakText(text, SOPHIA_VOICE_ID);
        if (cancelled) { sound?.unloadAsync(); return; }
        soundRef.current = sound;

        if (sound) {
          setIsSpeaking(true);
          sound.setOnPlaybackStatusUpdate((status) => {
            if ('didJustFinish' in status && status.didJustFinish) {
              setIsSpeaking(false);
              setIsDoneSpeaking(true);
              soundRef.current = null;
            }
          });
        } else {
          log.warn('[Sophia News] No sound returned — skipping audio');
          setIsSpeaking(false);
          setIsDoneSpeaking(true);
        }
      } catch {
        if (!cancelled) {
          setIsGenerating(false);
          setNarrationText("Hmm, I couldn't load my thoughts on this one. Try the next article!");
          setIsDoneSpeaking(true);
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [visible, currentIndex, article?.id, muteLoaded]);

  // Pulse animation for speaking state
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

  // Navigate to article
  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= articles.length) return;
    const cur = currentIndexRef.current;
    const dir = index > cur ? -1 : 1;
    Animated.timing(translateX, { toValue: dir * windowSize.current.w, duration: 200, useNativeDriver: true }).start(() => {
      setCurrentIndex(index);
      currentIndexRef.current = index;
      setSubtitlesExpanded(false);
      translateX.setValue(-dir * windowSize.current.w);
      Animated.spring(translateX, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }).start();
    });
  }, [articles.length]);

  // Pan gesture for swipe
  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        // Only clearly sideways swipes change story; vertical drags scroll the story.
        return Math.abs(g.dx) > 18 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        // Stop any ongoing animations
        translateX.stopAnimation();
        translateY.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        const idx = currentIndexRef.current;

        // Swipe left → next
        if (g.dx < -SWIPE_THRESHOLD && Math.abs(g.dx) > Math.abs(g.dy)) {
          const next = idx + 1;
          if (next < articles.length) {
            Animated.timing(translateX, { toValue: -windowSize.current.w, duration: 200, useNativeDriver: true }).start(() => {
              currentIndexRef.current = next;
              setCurrentIndex(next);
              setSubtitlesExpanded(false);
              translateX.setValue(windowSize.current.w);
              Animated.spring(translateX, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }).start();
            });
          } else {
            Animated.spring(translateX, { toValue: 0, friction: 8, useNativeDriver: true }).start();
          }
          return;
        }
        // Swipe right → prev
        if (g.dx > SWIPE_THRESHOLD && Math.abs(g.dx) > Math.abs(g.dy)) {
          const prev = idx - 1;
          if (prev >= 0) {
            Animated.timing(translateX, { toValue: windowSize.current.w, duration: 200, useNativeDriver: true }).start(() => {
              currentIndexRef.current = prev;
              setCurrentIndex(prev);
              setSubtitlesExpanded(false);
              translateX.setValue(-windowSize.current.w);
              Animated.spring(translateX, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }).start();
            });
          } else {
            Animated.spring(translateX, { toValue: 0, friction: 8, useNativeDriver: true }).start();
          }
          return;
        }

        // Snap back
        Animated.spring(translateX, { toValue: 0, friction: 8, useNativeDriver: true }).start();
      },
    }),
  [articles.length, onClose]);

  // Voice Q&A — tap Sophia to record
  const handleSophiaTap = useCallback(async () => {
    if (isRecording) {
      // Stop recording and process
      setIsRecording(false);
      setIsTranscribing(true);

      try {
        const recording = recordingRef.current;
        if (!recording) return;
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        recordingRef.current = null;

        if (!uri) { setIsTranscribing(false); return; }

        const transcription = await transcribeVoice(uri);
        if (!transcription.trim()) {
          setIsTranscribing(false);
          return;
        }

        setIsTranscribing(false);
        setIsGenerating(true);

        // Get Sophia's verbal answer
        const systemPrompt = `You are Sophia Hernández, a warm Growth Advisor having a spoken conversation about a news article. Keep your answer under 3 sentences — this will be spoken aloud. Be conversational, not formal. Don't use markdown or lists.

Context — the article being discussed:
Title: "${article.title}"
Source: ${article.sourceName}
Summary: ${article.summary || 'N/A'}
Market: ${marketId}
User's goal: ${learningGoal}`;

        const { data } = await supabase.functions.invoke('mentor-chat', {
          body: {
            messages: [
              { role: 'assistant', content: narrationText },
              { role: 'user', content: transcription },
            ],
            systemPrompt,
          },
        });

        const answer = data?.message || "Sorry, I didn't catch that. Try again?";
        setNarrationText(answer);
        setSubtitlesExpanded(false);
        setIsGenerating(false);
        setIsSpeaking(true);
        setIsDoneSpeaking(false);

        const sound = await speakText(answer, SOPHIA_VOICE_ID);
        soundRef.current = sound;
        if (sound) {
          sound.setOnPlaybackStatusUpdate((status) => {
            if ('didJustFinish' in status && status.didJustFinish) {
              setIsSpeaking(false);
              setIsDoneSpeaking(true);
              soundRef.current = null;
            }
          });
        } else {
          setIsSpeaking(false);
          setIsDoneSpeaking(true);
        }
      } catch {
        setIsTranscribing(false);
        setIsGenerating(false);
      }
    } else {
      // Stop any playing audio first
      if (soundRef.current) {
        try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {}
        soundRef.current = null;
        setIsSpeaking(false);
      }

      // Start recording
      try {
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) {
          log.warn('Recording failed: microphone permission not granted');
          return;
        }

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
  }, [isRecording, article, narrationText, marketId, learningGoal]);

  // Play Sophia again, or stop her mid-sentence.
  const handleReplay = useCallback(async () => {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
      setIsSpeaking(false);
      setIsDoneSpeaking(true);
      return;
    }
    if (!narrationText) return;
    if (mutedRef.current) { mutedRef.current = false; setMuted(false); AsyncStorage.setItem(SOPHIA_MUTED_KEY, '0').catch(() => {}); }
    const sound = await speakText(narrationText, SOPHIA_VOICE_ID);
    soundRef.current = sound;
    if (!sound) return;
    setIsSpeaking(true);
    setIsDoneSpeaking(false);
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        setIsSpeaking(false);
        setIsDoneSpeaking(true);
        soundRef.current = null;
      }
    });
  }, [narrationText]);

  if (!visible || !article) return null;

  const hasNext = currentIndex < articles.length - 1;
  const hasPrev = currentIndex > 0;
  const columnW = Math.min(windowW, STORY_COLUMN_MAX);
  const imageH = Math.round((columnW - 40) * 0.6);
  const status = isRecording ? 'Listening. Tap again to send.'
    : isTranscribing ? 'Getting your question…'
    : isGenerating ? 'Sophia is reading the story…'
    : null;

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[st.container, { opacity: fadeAnim }]} {...panResponder.panHandlers}>
        {/* Progress, one segment per story, then source and controls */}
        <View style={[st.column, st.top, { paddingTop: Math.max(insets.top, 20) + 6 }]}>
          <View style={st.segments} accessibilityLabel={`Story ${currentIndex + 1} of ${articles.length}`}>
            {articles.map((_, i) => (
              <View key={i} style={[st.segment, i < currentIndex && st.segmentSeen, i === currentIndex && st.segmentNow]} />
            ))}
          </View>
          <View style={st.topRow}>
            <View style={st.sourceBadge}><Text style={st.sourceInitial}>{(article.sourceName || '?').trim().charAt(0).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={st.sourceName} numberOfLines={1} maxFontSizeMultiplier={1.3}>{article.sourceName}</Text>
              <Text style={st.sourceDate} maxFontSizeMultiplier={1.3}>{article.publishedAt}</Text>
            </View>
            <TouchableOpacity style={st.topBtn} onPress={toggleMute} accessibilityRole="button" accessibilityLabel={muted ? 'Unmute Sophia' : 'Mute Sophia'}>
              <Feather name={muted ? 'volume-x' : 'volume-2'} size={19} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={st.topBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close stories">
              <Feather name="x" size={21} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={{ flex: 1, transform: [{ translateX }] }}>
          <ScrollView
            key={article.id}
            style={{ flex: 1 }}
            contentContainerStyle={[st.column, st.scroll, { paddingBottom: 120 + Math.max(insets.bottom, 12) }]}
            showsVerticalScrollIndicator={false}
          >
            {/* The picture */}
            <View style={[st.imageCard, { height: imageH }]}>
              {article.imageUrl ? (
                <Image source={{ uri: article.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, st.noImage]}><Feather name="radio" size={40} color="rgba(255,255,255,0.35)" /></View>
              )}
              {article.categoryTag ? <View style={st.category}><Text style={st.categoryText} maxFontSizeMultiplier={1.3}>{article.categoryTag}</Text></View> : null}
            </View>

            {/* The story itself */}
            <Text style={st.title} maxFontSizeMultiplier={1.3}>{article.title}</Text>
            <Text style={st.summary} maxFontSizeMultiplier={1.4}>
              {article.summary || 'Open the source to read the full story.'}
            </Text>
            {article.sourceUrl ? (
              <TouchableOpacity style={st.sourceLink} onPress={() => Linking.openURL(article.sourceUrl).catch(() => {})} accessibilityRole="link">
                <Text style={st.sourceLinkText} maxFontSizeMultiplier={1.3}>Read it on {article.sourceName}</Text>
                <Feather name="arrow-up-right" size={16} color={DARK.accent} />
              </TouchableOpacity>
            ) : null}

            {/* Sophia: why it matters to you */}
            <View style={st.sophiaCard}>
              <View style={st.sophiaHead}>
                <Animated.View style={[st.sophiaRing, {
                  transform: [{ scale: Animated.multiply(sophiaScale, pulseAnim) }],
                  borderColor: isRecording ? '#F87171' : isSpeaking ? DARK.accent : 'transparent',
                }]}>
                  <Image source={sophiaAvatar} style={st.sophiaAvatar} />
                </Animated.View>
                <View style={{ flex: 1 }}>
                  <Text style={st.sophiaTitle} maxFontSizeMultiplier={1.3}>Why it matters to you</Text>
                  <Text style={st.sophiaSub} maxFontSizeMultiplier={1.3}>Sophia, growth advisor</Text>
                </View>
                {narrationText && !isGenerating ? (
                  <TouchableOpacity style={st.playBtn} onPress={handleReplay} accessibilityRole="button" accessibilityLabel={isSpeaking ? 'Stop Sophia' : 'Play Sophia'}>
                    <Feather name={isSpeaking ? 'pause' : 'play'} size={17} color="#fff" />
                  </TouchableOpacity>
                ) : null}
              </View>
              {isGenerating ? (
                <View style={st.skeleton}>
                  <View style={[st.skelLine, { width: '96%' }]} />
                  <View style={[st.skelLine, { width: '88%' }]} />
                  <View style={[st.skelLine, { width: '64%' }]} />
                </View>
              ) : narrationText ? (
                <Text style={st.narration} maxFontSizeMultiplier={1.4}>{narrationText}</Text>
              ) : null}
              <View style={st.askRow}>
                <TouchableOpacity
                  style={[st.askBtn, isRecording && st.askBtnLive]}
                  onPress={handleSophiaTap}
                  disabled={isTranscribing || isGenerating}
                  accessibilityRole="button"
                  accessibilityLabel={isRecording ? 'Send your question' : 'Ask Sophia out loud'}
                >
                  <Feather name={isRecording ? 'send' : 'mic'} size={15} color="#fff" />
                  <Text style={st.askText} maxFontSizeMultiplier={1.3}>{isRecording ? 'Send' : 'Ask Sophia'}</Text>
                </TouchableOpacity>
                {status ? (
                  <View style={st.statusRow}>
                    {isRecording ? <View style={st.recordDot} /> : <ActivityIndicator size="small" color={DARK.accent} />}
                    <Text style={st.statusText} maxFontSizeMultiplier={1.3}>{status}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Actions stay in reach */}
        <View style={[st.bottom, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
          <View style={[st.column, st.bottomRow]}>
            <TouchableOpacity
              style={st.discussBtn}
              onPress={() => { onClose(); setTimeout(() => onOpenChat(article), 300); }}
              accessibilityRole="button"
              accessibilityLabel="Discuss this story"
            >
              <Feather name="message-circle" size={18} color="#fff" />
              <Text style={st.discussText} maxFontSizeMultiplier={1.3}>Discuss</Text>
            </TouchableOpacity>
            {onQuiz ? (
              <TouchableOpacity style={st.quizBtn} onPress={() => onQuiz(article)} accessibilityRole="button" accessibilityLabel="Quiz me on this story">
                <Text style={st.quizText} maxFontSizeMultiplier={1.3}>Quiz me</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {hasNext || hasPrev ? (
            <Text style={st.swipeHint} maxFontSizeMultiplier={1.3}>{hasNext ? 'Swipe for the next story' : 'Swipe back for the last story'}</Text>
          ) : null}
        </View>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ──
/** Stories always read on a dark stage, whatever the app theme. */
const DARK = { bg: '#0E0F14', card: '#1A1C24', line: 'rgba(255,255,255,0.10)', text: '#F5F5F7', soft: 'rgba(245,245,247,0.74)', muted: 'rgba(245,245,247,0.5)', accent: '#B9A4FF' };

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK.bg },
  column: { width: '100%', maxWidth: STORY_COLUMN_MAX, alignSelf: 'center' },
  top: { paddingHorizontal: 20, paddingBottom: 10 },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' },
  segmentSeen: { backgroundColor: 'rgba(255,255,255,0.55)' },
  segmentNow: { backgroundColor: '#FFFFFF' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  sourceBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2A2D38', alignItems: 'center', justifyContent: 'center' },
  sourceInitial: { fontSize: 15, fontWeight: '900', color: DARK.text },
  sourceName: { fontSize: 14.5, fontWeight: '800', color: DARK.text },
  sourceDate: { fontSize: 12.5, fontWeight: '600', color: DARK.muted },
  topBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: 20, paddingTop: 6 },
  imageCard: { borderRadius: 20, overflow: 'hidden', backgroundColor: DARK.card },
  noImage: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#24203A' },
  category: { position: 'absolute', left: 12, top: 12, paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center' },
  categoryText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
  title: { fontSize: 25, lineHeight: 31, fontWeight: '900', color: DARK.text, marginTop: 18, letterSpacing: -0.3 },
  summary: { fontSize: 17, lineHeight: 26, color: DARK.soft, marginTop: 10 },
  sourceLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-start', paddingVertical: 4 },
  sourceLinkText: { fontSize: 15, fontWeight: '800', color: DARK.accent },

  sophiaCard: { marginTop: 22, padding: 16, borderRadius: 20, backgroundColor: DARK.card, borderWidth: 1, borderColor: DARK.line },
  sophiaHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sophiaRing: { width: 50, height: 50, borderRadius: 25, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  sophiaAvatar: { width: 42, height: 42, borderRadius: 21 },
  sophiaTitle: { fontSize: 16, fontWeight: '900', color: DARK.text },
  sophiaSub: { fontSize: 12.5, fontWeight: '600', color: DARK.muted, marginTop: 1 },
  playBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#7C5CE6', alignItems: 'center', justifyContent: 'center' },
  skeleton: { gap: 8, marginTop: 14 },
  skelLine: { height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.10)' },
  narration: { fontSize: 16, lineHeight: 24, color: DARK.text, marginTop: 12 },
  askRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, flexWrap: 'wrap' },
  askBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 38, paddingHorizontal: 14, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.10)' },
  askBtnLive: { backgroundColor: '#DC2626' },
  askText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  statusText: { fontSize: 13, fontWeight: '600', color: DARK.soft, flexShrink: 1 },
  recordDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#F87171' },

  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 12, paddingHorizontal: 20, backgroundColor: DARK.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: DARK.line },
  bottomRow: { flexDirection: 'row', gap: 10 },
  discussBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, paddingHorizontal: 18, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.10)' },
  discussText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  quizBtn: { flex: 1, height: 52, borderRadius: 16, backgroundColor: '#A78BFA', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: '#7C5CE6' },
  quizText: { fontSize: 17, fontWeight: '900', color: '#1B1530' },
  swipeHint: { fontSize: 12.5, fontWeight: '600', color: DARK.muted, textAlign: 'center', marginTop: 10 },
});
