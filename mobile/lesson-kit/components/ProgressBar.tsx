import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';

interface Props {
  /** 0 -> 1 */
  progress: number;
}

export function ProgressBar({ progress }: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const anim = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: 320,
      useNativeDriver: false,
    }).start();
  }, [clamped, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    height: tokens.size.progressBar,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.accent,
  },
});
