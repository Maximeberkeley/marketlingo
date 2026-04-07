import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface FloatingXPProps {
  amount: number;
  show: boolean;
  isPro?: boolean;
}

export function FloatingXP({ amount, show, isPro = false }: FloatingXPProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  const displayAmount = isPro ? Math.round(amount * 1.5) : amount;

  useEffect(() => {
    if (show && amount > 0) {
      opacity.setValue(0);
      translateY.setValue(0);
      scale.setValue(0.7);

      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -50, duration: 1200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 200, friction: 15, useNativeDriver: true }),
      ]).start(() => {
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }).start();
      });
    }
  }, [show, amount]);

  if (!show || amount <= 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
      pointerEvents="none"
    >
      <Feather name="zap" size={16} color="#FDE047" />
      <Text style={styles.text}>+{displayAmount} XP</Text>
      {isPro && <Text style={styles.proLabel}>1.5×</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  proLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
});
