import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';
import { LeoCharacter } from '../mascot/LeoCharacter';

interface LeoBubbleProps {
  message: string;
  animation: 'idle' | 'waving' | 'success' | 'celebrating';
}

/**
 * Leo mascot with an animated speech bubble greeting.
 */
export function LeoBubble({ message, animation }: LeoBubbleProps) {
  const bubbleScale = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const leoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Leo bounces in, then bubble appears
    Animated.sequence([
      Animated.spring(leoScale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(bubbleScale, { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }),
        Animated.timing(bubbleOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
    ]).start();
  }, [message]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.leoWrap, { transform: [{ scale: leoScale }] }]}>
        <LeoCharacter size="xl" animation={animation} />
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
  leoWrap: {
    marginBottom: 8,
  },
  bubble: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: '85%',
    position: 'relative',
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
