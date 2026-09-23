import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
      <Animated.View style={[styles.potionWrap, { transform: [{ rotate: rotation }] }]}>
        <MaterialCommunityIcons name="flask" size={24} color={COLORS.xpBadgeIcon} />
        <MaterialCommunityIcons name="star-four-points" size={11} color={COLORS.xpBadgeSpark} style={styles.sparkle} />
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
    minWidth: 82,
    minHeight: 42,
    justifyContent: 'center',
    backgroundColor: COLORS.xpBadgeSurface,
    borderWidth: 1,
    borderColor: COLORS.xpBadgeBorder,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 7,
  },
  potionWrap: {
    width: 27,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  xp: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.xpBadgeText,
  },
  level: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.xpBadgeText,
    opacity: 0.7,
  },
});
