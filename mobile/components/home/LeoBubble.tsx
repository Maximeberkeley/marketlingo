import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from '../../lib/constants';
import { LeoCharacter } from '../mascot/LeoCharacter';

interface LeoBubbleProps {
  message: string;
  animation: 'idle' | 'waving' | 'success' | 'celebrating';
}

/**
 * Leo mascot with an animated speech bubble greeting.
 * Uses the real Leo character asset — never an emoji.
 */
export function LeoBubble({ message, animation }: LeoBubbleProps) {
  const bubbleScale = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const leoScale = useRef(new Animated.Value(0.8)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(leoScale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(bubbleScale, { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }),
        Animated.timing(bubbleOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
    ]).start();

    // Subtle glow pulse behind Leo
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();
  }, [message]);

  return (
    <View style={styles.container}>
      {/* Glow behind Leo */}
      <Animated.View style={[styles.glow, { opacity: glowPulse }]} />

      <Animated.View style={[styles.leoWrap, { transform: [{ scale: leoScale }] }]}>
        <LeoCharacter size="lg" animation={animation} />
      </Animated.View>

      <Animated.View style={[styles.bubble, { opacity: bubbleOpacity, transform: [{ scale: bubbleScale }] }]}>
        <View style={styles.bubbleTail} />
        <Text style={styles.bubbleText}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  glow: {
    position: 'absolute',
    top: 10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.accent,
  },
  leoWrap: {
    marginBottom: 10,
  },
  bubble: {
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
    maxWidth: '88%',
    position: 'relative',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  bubbleTail: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.bg2,
  },
  bubbleText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 21,
  },
});
