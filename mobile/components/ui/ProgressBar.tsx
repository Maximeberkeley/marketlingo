import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { COLORS } from '../../lib/constants';

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  showGlow?: boolean;
}

export function ProgressBar({
  progress,
  height = 8,
  color = COLORS.accent,
  backgroundColor = 'rgba(139, 92, 246, 0.1)',
  animated = true,
  showGlow = false,
}: ProgressBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const clamped = Math.min(100, Math.max(0, progress));
    if (animated) {
      Animated.spring(widthAnim, {
        toValue: clamped,
        friction: 8,
        tension: 100,
        useNativeDriver: false,
      }).start(() => {
        // Shine effect after fill
        if (clamped > 10) {
          Animated.timing(shineAnim, {
            toValue: 2,
            duration: 800,
            delay: 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }).start();
        }
      });
    } else {
      widthAnim.setValue(clamped);
    }
  }, [progress, animated]);

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const shineLeft = shineAnim.interpolate({
    inputRange: [-1, 2],
    outputRange: ['-30%', '130%'],
  });

  return (
    <View style={[styles.track, { height, backgroundColor, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            backgroundColor: color,
            borderRadius: height / 2,
            width,
          },
          showGlow && {
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 6,
          },
        ]}
      >
        {/* Shine overlay */}
        <Animated.View
          style={[
            styles.shine,
            {
              left: shineLeft,
              height,
              borderRadius: height / 2,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 0,
    width: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
