/**
 * ImmersiveNewsOverlay — TikTok/Stories-style fullscreen news experience.
 * Sophia narrates why each article matters for the user's goal.
 * Swipe right/left = next/prev article, swipe up = close, tap Sophia = voice Q&A.
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
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPE } from '../../lib/constants';
import { supabase } from '../../lib/supabase';

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
  marketId: string;
  learningGoal?: string;
}

// ── Constants ──
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;
const SOPHIA_VOICE_ID = 'pFZP5JQG7iQjIQuC4Bku'; // Lily
const EDGE_URL = process.env.EXPO_PUBLIC_EDGE_FUNCTIONS_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const sophiaAvatar = require('../../assets/mentors/mentor-sophia.png');

const GOAL_LABELS: Record<string, string> = {
  join_industry: 'joining and building a career in',
  invest: 'investing in',
  build_startup: 'building a startup in',
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
  if (!text || text.trim().length < 5) return null;
  try {
    const { speakWithElevenLabs } = require('../../lib/tts');
    return await speakWithElevenLabs(text, voiceId, 'sophia_news');
  } catch {
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
  marketId,
  learningGoal = 'curiosity',
}: ImmersiveNewsOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [narrationText, setNarrationText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDoneSpeaking, setIsDoneSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [subtitlesExpanded, setSubtitlesExpanded] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
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
    if (!visible || !article) return;
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

        // Auto-speak
        setIsSpeaking(true);
        const sound = await speakText(text, SOPHIA_VOICE_ID);
        if (cancelled) { sound?.unloadAsync(); return; }
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
        if (!cancelled) {
          setIsGenerating(false);
          setNarrationText("Hmm, I couldn't load my thoughts on this one. Try the next article!");
          setIsDoneSpeaking(true);
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [visible, currentIndex, article?.id]);

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
    Animated.timing(translateX, { toValue: dir * SCREEN_W, duration: 200, useNativeDriver: true }).start(() => {
      setCurrentIndex(index);
      currentIndexRef.current = index;
      setSubtitlesExpanded(false);
      translateX.setValue(-dir * SCREEN_W);
      Animated.spring(translateX, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }).start();
    });
  }, [articles.length]);

  // Pan gesture for swipe
  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        // Only claim the gesture if horizontal movement is significant
        return Math.abs(g.dx) > 15 || (g.dy < -15 && Math.abs(g.dy) > Math.abs(g.dx));
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        // Stop any ongoing animations
        translateX.stopAnimation();
        translateY.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dy) > Math.abs(g.dx) && g.dy < 0) {
          translateY.setValue(g.dy);
        } else {
          translateX.setValue(g.dx);
        }
      },
      onPanResponderRelease: (_, g) => {
        const idx = currentIndexRef.current;

        // Swipe up → close
        if (g.dy < -SWIPE_THRESHOLD && Math.abs(g.dy) > Math.abs(g.dx)) {
          Animated.timing(translateY, { toValue: -SCREEN_H, duration: 300, useNativeDriver: true }).start(() => {
            translateY.setValue(0);
            onClose();
          });
          return;
        }
        Animated.spring(translateY, { toValue: 0, friction: 8, useNativeDriver: true }).start();

        // Swipe left → next
        if (g.dx < -SWIPE_THRESHOLD && Math.abs(g.dx) > Math.abs(g.dy)) {
          const next = idx + 1;
          if (next < articles.length) {
            Animated.timing(translateX, { toValue: -SCREEN_W, duration: 200, useNativeDriver: true }).start(() => {
              currentIndexRef.current = next;
              setCurrentIndex(next);
              setSubtitlesExpanded(false);
              translateX.setValue(SCREEN_W);
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
            Animated.timing(translateX, { toValue: SCREEN_W, duration: 200, useNativeDriver: true }).start(() => {
              currentIndexRef.current = prev;
              setCurrentIndex(prev);
              setSubtitlesExpanded(false);
              translateX.setValue(-SCREEN_W);
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
  }, [isRecording, article, narrationText, marketId, learningGoal]);

  if (!visible || !article) return null;

  const hasNext = currentIndex < articles.length - 1;
  const hasPrev = currentIndex > 0;

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent>
      <StatusBar barStyle="light-content" />
      <Animated.View
        style={[st.container, { opacity: fadeAnim, transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        {/* Background image */}
        <Animated.View style={[st.bgContainer, { transform: [{ translateX }] }]}>
          {article.imageUrl ? (
            <Image source={{ uri: article.imageUrl }} style={st.bgImage} blurRadius={1} />
          ) : (
            <View style={[st.bgImage, { backgroundColor: '#1A1035' }]} />
          )}
          <View style={st.bgOverlay} />
        </Animated.View>

        {/* Top bar */}
        <View style={st.topBar}>
          {/* Article counter */}
          <View style={st.counterBadge}>
            <Text style={st.counterText}>{currentIndex + 1}/{articles.length}</Text>
          </View>

          <View style={st.topBarRight}>
            {/* Discuss with AI */}
            <TouchableOpacity
              style={st.topBtn}
              onPress={() => { onClose(); setTimeout(() => onOpenChat(article), 300); }}
            >
              <Feather name="message-circle" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Close */}
            <TouchableOpacity style={st.topBtn} onPress={onClose}>
              <Feather name="x" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sophia center stage */}
        <View style={st.centerStage}>
          <Animated.View style={[st.sophiaRing, {
            transform: [{ scale: Animated.multiply(sophiaScale, pulseAnim) }],
            borderColor: isRecording ? '#EF4444' : isSpeaking ? COLORS.accent : 'rgba(255,255,255,0.3)',
          }]}>
            <TouchableOpacity onPress={handleSophiaTap} activeOpacity={0.8}>
              <Image source={sophiaAvatar} style={st.sophiaAvatar} />
              {isRecording && (
                <View style={st.micBadge}>
                  <Feather name="mic" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Status text */}
          <View style={st.statusContainer}>
            {isGenerating && (
              <View style={st.statusRow}>
                <ActivityIndicator size="small" color={COLORS.accent} />
                <Text style={st.statusText}>Sophia is thinking...</Text>
              </View>
            )}
            {isTranscribing && (
              <View style={st.statusRow}>
                <ActivityIndicator size="small" color={COLORS.accent} />
                <Text style={st.statusText}>Transcribing your question...</Text>
              </View>
            )}
            {isRecording && (
              <View style={st.statusRow}>
                <View style={st.recordDot} />
                <Text style={st.statusText}>Listening... Tap again to send</Text>
              </View>
            )}
            {isSpeaking && !isGenerating && (
              <Text style={st.statusText}>🎙 Sophia is speaking...</Text>
            )}
            {isDoneSpeaking && !isGenerating && !isRecording && !isTranscribing && (
              <Text style={st.statusText}>Tap Sophia to ask a question</Text>
            )}
          </View>

          {/* Narration text (subtitle-style, tap to expand) */}
          {narrationText && !isGenerating && (
            <TouchableOpacity
              style={st.subtitleBox}
              onPress={() => setSubtitlesExpanded(!subtitlesExpanded)}
              activeOpacity={0.8}
            >
              <Text style={st.subtitleText} numberOfLines={subtitlesExpanded ? undefined : 2}>
                {narrationText}
              </Text>
              {!subtitlesExpanded && narrationText.length > 80 && (
                <Text style={st.expandHint}>Tap to read more</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Article title */}
        <View style={st.titleContainer}>
          <Text style={st.articleTitle} numberOfLines={2}>{article.title}</Text>
          <Text style={st.articleMeta}>{article.sourceName} · {article.publishedAt}</Text>
        </View>

        {/* Bottom bar */}
        <View style={st.bottomBar}>
          <TouchableOpacity
            style={st.sourceBtn}
            onPress={() => Linking.openURL(article.sourceUrl).catch(() => {})}
          >
            <Feather name="external-link" size={16} color="#fff" />
            <Text style={st.sourceBtnText}>Read Full Article</Text>
          </TouchableOpacity>

          {/* Swipe hints */}
          {isDoneSpeaking && hasNext && (
            <Text style={st.swipeHint}>Swipe left for next article →</Text>
          )}
        </View>

        {/* Navigation dots */}
        <View style={st.dotsRow}>
          {articles.map((_, i) => (
            <View
              key={i}
              style={[st.dot, i === currentIndex && st.dotActive]}
            />
          ))}
        </View>

      </Animated.View>
    </Modal>
  );
}

const BOTTOM_PADDING = Platform.OS === 'ios' ? 40 : 24;
const TOP_PADDING = Platform.OS === 'ios' ? 56 : 40;

// ── Styles ──
const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  bgImage: {
    width: SCREEN_W,
    height: SCREEN_H,
    resizeMode: 'cover',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: TOP_PADDING,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },

  // Center Sophia
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    zIndex: 10,
  },
  sophiaRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sophiaAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
    marginTop: 16,
    alignItems: 'center',
    minHeight: 30,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  // Subtitle
  subtitleBox: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    maxWidth: SCREEN_W - 60,
  },
  subtitleText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '400',
  },
  expandHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },

  // Title
  titleContainer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  articleTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 26,
    marginBottom: 4,
  },
  articleMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },

  // Bottom
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 10,
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  sourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sourceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  swipeHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: BOTTOM_PADDING,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
    borderRadius: 3,
  },
});
