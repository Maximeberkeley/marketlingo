import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../../lib/constants';

interface XPBadgeProps {
  xp: number;
  level: number;
  showLevel?: boolean;
}

export function XPBadge({ xp, level, showLevel = false }: XPBadgeProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const boltRotate = useRef(new Animated.Value(0)).current;
  const prevXP = useRef(xp);
  const [displayXP, setDisplayXP] = useState(xp);
  const countAnim = useRef(new Animated.Value(xp)).current;

  useEffect(() => {
    const from = prevXP.current;
    prevXP.current = xp;

    // Skip animation if same value or first render
    if (from === xp) return;

    // Quick bounce
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 300, useNativeDriver: true }),
    ]).start();

    // Bolt wiggle
    Animated.sequence([
      Animated.timing(boltRotate, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(boltRotate, { toValue: -1, duration: 100, useNativeDriver: true }),
      Animated.timing(boltRotate, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();

    // Count from previous to new — fast
    countAnim.setValue(from);
    Animated.timing(countAnim, {
      toValue: xp,
      duration: Math.min(400, Math.abs(xp - from) * 2),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const listener = countAnim.addListener(({ value }) => {
      setDisplayXP(Math.round(value));
    });
    return () => countAnim.removeListener(listener);
  }, [xp]);

  const rotation = boltRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <Animated.Text style={[styles.emoji, { transform: [{ rotate: rotation }] }]}>⚡</Animated.Text>
      <Text style={styles.xp}>{displayXP.toLocaleString()}</Text>
      {showLevel && <Text style={styles.level}>Lv.{level}</Text>}
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  emoji: {
    fontSize: 14,
  },
  xp: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  level: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
    opacity: 0.7,
  },
});
