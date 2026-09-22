import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

const DEFAULT_LEO = require('../../assets/mascot/leo-idle.png');

interface FoxMascotProps {
  industry: string;
  size?: number;
}

/**
 * Displays the current industry Leo, with the established default as fallback.
 */
export function FoxMascot({ industry: _industry, size = 220 }: FoxMascotProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.02, duration: 2200, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <View style={[styles.container, { height: size }]}>
      <Animated.View style={{ transform: [{ scale: Animated.multiply(scaleAnim, breatheAnim) }] }}>
        <Image
          source={DEFAULT_LEO}
          style={{ width: size, height: size, resizeMode: 'contain' }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
