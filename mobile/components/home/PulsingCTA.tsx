import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from '../../lib/constants';
import { LeoCharacter } from '../mascot/LeoCharacter';

interface PulsingCTAProps {
  label: string;
  title: string;
  slideCount: number;
  xpReward: number;
  onPress: () => void;
}

/**
 * Premium pulsing CTA for Today's Lesson with Leo accent.
 */
export function PulsingCTA({ label, title, slideCount, xpReward, onPress }: PulsingCTAProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const enterAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(enterAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: Animated.multiply(enterAnim, pulseAnim) }] }}>
      <TouchableOpacity style={styles.cta} onPress={onPress} activeOpacity={0.85}>
        {/* Gradient accent bar */}
        <View style={styles.accentBar} />

        <View style={styles.content}>
          <View style={styles.left}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            <View style={styles.meta}>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>{slideCount} slides</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>+{xpReward} XP</Text>
              </View>
            </View>
          </View>

          {/* Leo instead of plain arrow */}
          <View style={styles.leoWrap}>
            <LeoCharacter size="sm" animation="waving" />
          </View>
        </View>

        {/* Play button */}
        <View style={styles.playRow}>
          <View style={styles.playBtn}>
            <Text style={styles.playBtnText}>Start Lesson</Text>
            <Text style={styles.playArrow}>→</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cta: {
    backgroundColor: COLORS.bg2,
    borderRadius: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    overflow: 'hidden',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  accentBar: {
    height: 3,
    backgroundColor: COLORS.accent,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    paddingBottom: 12,
  },
  left: { flex: 1 },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 25,
    marginBottom: 10,
  },
  meta: { flexDirection: 'row', gap: 8 },
  metaChip: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: { fontSize: 11, color: COLORS.accent, fontWeight: '600' },
  leoWrap: {
    marginLeft: 8,
  },
  playRow: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  playBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
});
