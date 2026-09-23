import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
      <Animated.View style={isOnFire ? { transform: [{ rotate: rotation }] } : undefined}>
        <MaterialCommunityIcons name="fire" size={22} color={COLORS.streak} />
      </Animated.View>
      <Text style={styles.count}>{count}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 76,
    minHeight: 42,
    justifyContent: 'center',
    backgroundColor: COLORS.streakBadgeSurface,
    borderWidth: 1,
    borderColor: COLORS.streakBadgeBorder,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 7,
  },
  count: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.streak,
  },
});
