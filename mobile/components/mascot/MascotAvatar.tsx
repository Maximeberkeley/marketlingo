import React from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../lib/constants';

interface MascotAvatarProps {
  /** Legacy prop — ignored. Always renders Leo image now. */
  emoji?: string;
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

/**
 * Always renders the real Leo mascot image — never an emoji.
 */
export function MascotAvatar({
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
            toValue: -6,
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

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          backgroundColor: color + '15',
          borderColor: color + '30',
          transform: [{ translateY: bounceAnim }],
        },
      ]}
    >
      <Image
        source={require('../../assets/mascot/leo-reference.png')}
        style={{ width: containerSize * 0.75, height: containerSize * 0.75, resizeMode: 'contain' }}
      />
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
});
