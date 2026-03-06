import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../lib/constants';
import { Feather } from '@expo/vector-icons';

const LEO_IMAGE = require('../../assets/mascot/leo-reference.png');

type InterstitialType = 'encouragement' | 'fun-fact' | 'check-in' | 'celebration' | 'halfway';

interface LeoInterstitialProps {
  type: InterstitialType;
  progress: number;
  slideTitle?: string;
  customMessage?: string;
}

const MESSAGES: Record<InterstitialType, string[]> = {
  encouragement: [
    "You're doing great! Keep going!",
    "Love the focus! You're learning fast.",
    "This is your superpower building!",
    "Pro tip: try to explain this to someone later!",
  ],
  'fun-fact': [
    "Did you know? Top investors read for 5+ hours daily.",
    "Fun fact: Your brain forms new connections right now!",
    "Each concept you learn compounds over time.",
    "The best founders never stop learning.",
  ],
  'check-in': [
    "Quick check — can you recall the last concept?",
    "Try to summarize what you just learned!",
    "What's the key takeaway so far?",
  ],
  celebration: [
    "You crushed it! Another lesson conquered!",
    "Amazing work! Knowledge is your edge!",
    "Lesson complete! You're leveling up!",
  ],
  halfway: [
    "Halfway there! You're unstoppable!",
    "50% done — the momentum is real!",
    "Keep this energy! Almost there!",
  ],
};

const TYPE_FEATHER_ICONS: Record<InterstitialType, keyof typeof Feather.glyphMap> = {
  encouragement: 'activity',
  'fun-fact': 'layers',
  'check-in': 'target',
  celebration: 'award',
  halfway: 'bar-chart-2',
};

const ACCENT_COLORS: Record<InterstitialType, string> = {
  encouragement: '#22C55E',
  'fun-fact': '#3B82F6',
  'check-in': '#F59E0B',
  celebration: '#8B5CF6',
  halfway: '#F97316',
};

export function LeoInterstitial({ type, progress, slideTitle, customMessage }: LeoInterstitialProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [message] = useState(() => {
    if (customMessage) return customMessage;
    const msgs = MESSAGES[type];
    return msgs[Math.floor(Math.random() * msgs.length)];
  });
  const accent = ACCENT_COLORS[type];

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 15, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -8, duration: 600, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ).start();

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      {/* Leo with glow */}
      <View style={styles.leoContainer}>
        <View style={[styles.glow, { backgroundColor: accent + '20' }]} />
        <Animated.Image
          source={LEO_IMAGE}
          style={[styles.leoImage, { transform: [{ translateY: bounceAnim }] }]}
        />
      </View>

      {/* Type icon */}
      <View style={[styles.iconCircle, { backgroundColor: accent + '20' }]}>
        <Feather name={TYPE_FEATHER_ICONS[type]} size={22} color={accent} />
      </View>

      {/* Message */}
      <Text style={[styles.message, { color: accent }]}>{message}</Text>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: accent,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress * 100)}% complete</Text>
      </View>

      {/* Tap hint */}
      <Text style={styles.tapHint}>Tap to continue</Text>
    </Animated.View>
  );
}

export function shouldShowLeoCard(
  cardIndex: number,
  totalCards: number,
): InterstitialType | null {
  if (cardIndex < 3 || cardIndex >= totalCards - 2) return null;
  const midpoint = Math.floor(totalCards / 2);
  if (cardIndex === midpoint) return 'halfway';
  if ((cardIndex - 3) % 6 === 0 && cardIndex !== midpoint) {
    const types: InterstitialType[] = ['encouragement', 'fun-fact', 'check-in'];
    return types[Math.floor(Math.random() * types.length)];
  }
  return null;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 300,
  },
  leoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  leoImage: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  typeIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  message: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressTrack: {
    width: '80%',
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  tapHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    opacity: 0.6,
  },
});
