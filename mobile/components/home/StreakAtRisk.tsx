import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS } from '../../lib/constants';

interface StreakAtRiskProps {
  streak: number;
  hoursLeft: number;
  onStartLesson: () => void;
  onDismiss: () => void;
}

export function StreakAtRisk({ streak, hoursLeft, onStartLesson, onDismiss }: StreakAtRiskProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flameScale = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(flameScale, { toValue: 1.2, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(flameScale, { toValue: 0.85, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(flameScale, { toValue: 1, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();

    const timer = setTimeout(() => {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 3, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const urgencyLevel = hoursLeft <= 1 ? 'critical' : hoursLeft <= 3 ? 'warning' : 'caution';
  const bgColor =
    urgencyLevel === 'critical' ? COLORS.errorSoft
    : urgencyLevel === 'warning' ? COLORS.orangeSoft
    : COLORS.goldSoft;
  const borderColor =
    urgencyLevel === 'critical' ? 'rgba(239, 68, 68, 0.25)'
    : urgencyLevel === 'warning' ? 'rgba(251, 146, 60, 0.25)'
    : 'rgba(251, 191, 36, 0.2)';
  const textColor =
    urgencyLevel === 'critical' ? COLORS.error : urgencyLevel === 'warning' ? COLORS.orange : COLORS.warning;

  const timeText = hoursLeft < 1 ? 'less than an hour' : hoursLeft === 1 ? '1 hour' : `${Math.round(hoursLeft)} hours`;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bgColor, borderColor, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }], opacity: opacityAnim },
      ]}
    >
      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Animated.View style={[styles.flameContainer, { transform: [{ scale: flameScale }] }]}>
          <Text style={styles.flame}>🔥</Text>
          {urgencyLevel === 'critical' && <Text style={styles.flameDying}>💀</Text>}
        </Animated.View>
        <View style={styles.messageColumn}>
          <Text style={[styles.headline, { color: textColor }]}>
            {urgencyLevel === 'critical' ? 'Your streak is dying!' : `${streak}-day streak at risk!`}
          </Text>
          <Text style={styles.subtext}>
            {urgencyLevel === 'critical'
              ? `Only ${timeText} left — do a quick lesson now!`
              : `You have ${timeText} to keep your ${streak}-day streak alive`}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.ctaBtn,
          urgencyLevel === 'critical' && { backgroundColor: COLORS.error },
          urgencyLevel === 'warning' && { backgroundColor: COLORS.orange },
          urgencyLevel === 'caution' && { backgroundColor: COLORS.warning },
        ]}
        onPress={onStartLesson}
        activeOpacity={0.8}
      >
        <Text style={styles.ctaBtnText}>
          {urgencyLevel === 'critical' ? 'Save My Streak!' : 'Keep Streak Alive'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function getStreakRiskHours(
  streakExpiresAt: string | null, currentStreak: number, lessonCompletedToday: boolean
): number | null {
  if (!streakExpiresAt || currentStreak === 0 || lessonCompletedToday) return null;
  const expires = new Date(streakExpiresAt);
  const now = new Date();
  const hoursLeft = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursLeft > 0 && hoursLeft <= 6) return hoursLeft;
  return null;
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  dismissBtn: { position: 'absolute', top: 8, right: 10, zIndex: 10 },
  dismissText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  content: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 10, gap: 12 },
  flameContainer: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  flame: { fontSize: 36 },
  flameDying: { fontSize: 14, position: 'absolute', bottom: -2, right: -2 },
  messageColumn: { flex: 1, paddingRight: 20 },
  headline: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  subtext: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 16 },
  ctaBtn: { marginHorizontal: 14, marginBottom: 14, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  ctaBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
