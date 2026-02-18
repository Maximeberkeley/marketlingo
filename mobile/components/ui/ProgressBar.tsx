import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  height = 8,
  color = COLORS.accent,
  backgroundColor = 'rgba(139, 92, 246, 0.15)',
  animated = true,
}: ProgressBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(widthAnim, {
        toValue: Math.min(100, Math.max(0, progress)),
        duration: 600,
        useNativeDriver: false,
      }).start();
    } else {
      widthAnim.setValue(progress);
    }
  }, [progress, animated, widthAnim]);

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
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
        ]}
      />
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
  },
});
