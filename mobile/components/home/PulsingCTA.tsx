import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';

interface PulsingCTAProps {
  label: string;
  title: string;
  slideCount: number;
  xpReward: number;
  onPress: () => void;
}

/**
 * Pulsing main CTA button for Today's Lesson with glow effect.
 */
export function PulsingCTA({ label, title, slideCount, xpReward, onPress }: PulsingCTAProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const enterAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Enter animation
    Animated.parallel([
      Animated.spring(enterAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Subtle pulse loop
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: Animated.multiply(enterAnim, pulseAnim) }] }}>
      <TouchableOpacity style={styles.cta} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.left}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaText}>📖 {slideCount} slides</Text>
            <Text style={styles.metaText}>⚡ +{xpReward} XP</Text>
          </View>
        </View>
        <View style={styles.arrow}>
          <Text style={styles.arrowText}>▶</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  left: { flex: 1 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 26,
    marginBottom: 8,
  },
  meta: { flexDirection: 'row', gap: 12 },
  metaText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  arrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  arrowText: { fontSize: 18, color: '#fff' },
});
