import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Dimensions, Easing } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#8B5CF6', // purple
  '#22C55E', // green
  '#F97316', // orange
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#EAB308', // yellow
];

interface ConfettiBurstProps {
  show: boolean;
  count?: number;
}

function ConfettiPiece({ index, total }: { index: number; total: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const angle = (index / total) * Math.PI * 2;
  const radius = 120 + Math.random() * 200;
  const targetX = Math.cos(angle) * radius;
  const targetY = Math.sin(angle) * radius + SCREEN_H * 0.4;
  const size = 6 + Math.random() * 6;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1400 + Math.random() * 600,
      delay: index * 20,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, targetX],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, targetY],
  });
  const scale = anim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 1.5, 0.8],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${Math.random() * 720 - 360}deg`],
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: SCREEN_W / 2,
          top: SCREEN_H * 0.35,
          width: size,
          height: Math.random() > 0.5 ? size : size * 2.5,
          borderRadius: Math.random() > 0.5 ? size : 2,
          backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
          transform: [{ translateX }, { translateY }, { scale }, { rotate }],
          opacity,
        },
      ]}
    />
  );
}

export function ConfettiBurst({ show, count = 20 }: ConfettiBurstProps) {
  if (!show) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <ConfettiPiece key={i} index={i} total={count} />
      ))}
    </View>
  );
}
