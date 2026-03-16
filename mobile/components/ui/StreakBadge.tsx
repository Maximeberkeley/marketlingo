import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../../lib/constants';

interface StreakBadgeProps {
  count: number;
}

export function StreakBadge({ count }: StreakBadgeProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const flameRotate = useRef(new Animated.Value(0)).current;
  const isOnFire = count >= 7;

  useEffect(() => {
    // Pop-in
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  }, [count]);

  useEffect(() => {
    if (isOnFire) {
      const flicker = Animated.loop(
        Animated.sequence([
          Animated.timing(flameRotate, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(flameRotate, { toValue: -1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(flameRotate, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      flicker.start();
      return () => flicker.stop();
    }
  }, [isOnFire]);

  const rotation = flameRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-5deg', '0deg', '5deg'],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <Animated.Text style={[styles.emoji, isOnFire && { transform: [{ rotate: rotation }] }]}>
        🔥
      </Animated.Text>
      <Text style={styles.count}>{count}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.streak,
  },
});
