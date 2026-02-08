import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../lib/constants';

interface MascotAvatarProps {
  emoji: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  animated?: boolean;
}

const SIZES = {
  sm: 40,
  md: 56,
  lg: 80,
  xl: 120,
};

const FONT_SIZES = {
  sm: 24,
  md: 36,
  lg: 56,
  xl: 80,
};

export function MascotAvatar({
  emoji,
  size = 'md',
  color = COLORS.accent,
  animated = true,
}: MascotAvatarProps) {
  const bounceAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated, bounceAnim]);

  const containerSize = SIZES[size];
  const fontSize = FONT_SIZES[size];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          backgroundColor: color + '20',
          borderColor: color + '40',
          transform: [{ translateY: bounceAnim }],
        },
      ]}
    >
      <Text style={[styles.emoji, { fontSize }]}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  emoji: {
    textAlign: 'center',
  },
});
