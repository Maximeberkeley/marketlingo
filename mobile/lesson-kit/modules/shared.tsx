import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { tokens } from '../theme/tokens';
import { triggerHaptic } from '../../lib/haptics';
import { playSound } from '../../lib/sounds';

/** Big prompt line used at the top of every game module. */
export function Prompt({ text, eyebrow }: { text: string; eyebrow?: string }) {
  return (
    <View style={styles.promptWrap}>
      {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>}
      <Text style={styles.prompt}>{text}</Text>
    </View>
  );
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function tick(good: boolean) {
  triggerHaptic(good ? 'success' : 'warning').catch(() => {});
  playSound(good ? 'correct' : 'wrong').catch(() => {});
}

export function tap() {
  triggerHaptic('light').catch(() => {});
  playSound('tap').catch(() => {});
}

/** A value that springs to 1 whenever `key` changes — used for entrances. */
export function useEnter(key: string | number) {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }).start();
  }, [key, anim]);
  return anim;
}

/** Quick shake for a wrong drop / wrong tap. */
export function useShake() {
  const anim = React.useRef(new Animated.Value(0)).current;
  const shake = React.useCallback(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [anim]);
  const translateX = anim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -8, 8, -6, 4, 0],
  });
  return { shake, translateX };
}

export const styles = StyleSheet.create({
  promptWrap: { gap: 6, marginBottom: tokens.space.lg },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: tokens.color.accent,
  },
  prompt: {
    fontSize: tokens.font.prompt,
    fontWeight: '800',
    color: tokens.color.text,
    lineHeight: 27,
  },
});
