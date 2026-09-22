import React, { useRef, useEffect, useState } from 'react';
import { Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';

interface XPBadgeProps {
  xp: number;
  level: number;
  showLevel?: boolean;
}

export function XPBadge({ xp, level, showLevel = false }: XPBadgeProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const potionRotate = useRef(new Animated.Value(0)).current;
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

    // Potion wiggle
    Animated.sequence([
      Animated.timing(potionRotate, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(potionRotate, { toValue: -1, duration: 100, useNativeDriver: true }),
      Animated.timing(potionRotate, { toValue: 0, duration: 80, useNativeDriver: true }),
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

  const rotation = potionRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <Animated.View style={[styles.potionIcon, { transform: [{ rotate: rotation }] }]}>
        <MaterialCommunityIcons name="flask" size={18} color={COLORS.accent} />
        <MaterialCommunityIcons name="star-four-points" size={7} color={COLORS.info} style={styles.potionSpark} />
      </Animated.View>
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
  potionIcon: { width: 20, height: 19, alignItems: 'center', justifyContent: 'center' },
  potionSpark: { position: 'absolute', right: -1, top: -2 },
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
