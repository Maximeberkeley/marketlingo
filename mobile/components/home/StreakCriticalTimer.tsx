/**
 * StreakCriticalTimer — live countdown for the last 2 hours before streak expires.
 * Shows mm:ss countdown with pulsing fire animation and urgent CTA.
 * Pro users get a "Leo added logs to your fire" option (1-day extension).
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Alert,
} from 'react-native';
import { COLORS } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptics';

interface StreakCriticalTimerProps {
  streak: number;
  expiresAt: string;
  onStartLesson: () => void;
  isProUser: boolean;
  canUseLeoLogs: boolean;
  onUseLeoLogs: () => Promise<boolean>;
}

export function StreakCriticalTimer({
  streak, expiresAt, onStartLesson, isProUser, canUseLeoLogs, onUseLeoLogs,
}: StreakCriticalTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [expired, setExpired] = useState(false);
  const [usingLogs, setUsingLogs] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Calculate seconds remaining
  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff <= 0) setExpired(true);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Pulsing fire animation — faster as time runs out
  useEffect(() => {
    const duration = secondsLeft < 300 ? 400 : secondsLeft < 1800 ? 600 : 800;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.8, duration: duration * 0.8, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: duration * 0.6, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [secondsLeft < 300, secondsLeft < 1800]);

  // Red glow pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;
  const isUltraCritical = secondsLeft < 300; // < 5 min

  const handleLeoLogs = async () => {
    setUsingLogs(true);
    triggerHaptic('success');
    const ok = await onUseLeoLogs();
    setUsingLogs(false);
    if (ok) {
      Alert.alert(
        '🦁 Leo added logs to your fire!',
        `Your ${streak}-day streak is safe for 24 more hours. Leo's got your back!`,
      );
    } else {
      Alert.alert('Already Used', "You've already used Leo's logs this week.");
    }
  };

  if (expired) {
    return (
      <View style={[styles.container, styles.expiredContainer]}>
        <Text style={styles.expiredEmoji}>💀</Text>
        <Text style={styles.expiredTitle}>Streak Lost</Text>
        <Text style={styles.expiredSub}>Your {streak}-day streak has ended. Start a new one today!</Text>
        <TouchableOpacity style={styles.restartBtn} onPress={onStartLesson} activeOpacity={0.8}>
          <Text style={styles.restartBtnText}>Start Fresh 🔥</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: glowAnim.interpolate({ inputRange: [0.3, 1], outputRange: [0.92, 1] }) }]}>
      {/* Timer display */}
      <View style={styles.timerRow}>
        <Animated.Text style={[styles.fireEmoji, { transform: [{ scale: pulseAnim }] }]}>
          {isUltraCritical ? '🔥' : '🔥'}
        </Animated.Text>
        <View style={styles.timerContent}>
          <Text style={[styles.timerLabel, isUltraCritical && { color: COLORS.error }]}>
            {isUltraCritical ? '⚠️ STREAK DYING' : 'STREAK EXPIRES IN'}
          </Text>
          <Text style={[styles.timerValue, isUltraCritical && { color: COLORS.error }]}>
            {timeStr}
          </Text>
        </View>
        <View style={styles.streakPill}>
          <Text style={styles.streakPillText}>{streak}🔥</Text>
        </View>
      </View>

      {/* Message */}
      <Text style={styles.message}>
        {isUltraCritical
          ? `${streak} days of progress about to vanish! Do a quick lesson NOW!`
          : `Complete a lesson to keep your ${streak}-day streak alive`}
      </Text>

      {/* CTAs */}
      <TouchableOpacity
        style={[styles.ctaBtn, isUltraCritical && { backgroundColor: COLORS.error }]}
        onPress={() => { triggerHaptic('medium'); onStartLesson(); }}
        activeOpacity={0.8}
      >
        <Text style={styles.ctaBtnText}>
          {isUltraCritical ? '🚨 Save My Streak!' : '🔥 Start Lesson Now'}
        </Text>
      </TouchableOpacity>

      {/* Pro: Leo Logs */}
      {isProUser && canUseLeoLogs && (
        <TouchableOpacity
          style={styles.leoLogsBtn}
          onPress={handleLeoLogs}
          activeOpacity={0.8}
          disabled={usingLogs}
        >
          <Text style={styles.leoLogsBtnText}>
            {usingLogs ? 'Adding logs...' : '🦁 Leo added logs to your fire (+24h)'}
          </Text>
        </TouchableOpacity>
      )}

      {!isProUser && (
        <Text style={styles.proHint}>
          🔒 Pro members can extend streaks with Leo's fire logs
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20, borderWidth: 1.5, marginBottom: 16, overflow: 'hidden',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 16,
  },
  timerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
  },
  fireEmoji: { fontSize: 36 },
  timerContent: { flex: 1 },
  timerLabel: {
    fontSize: 10, fontWeight: '800', color: '#F97316',
    letterSpacing: 1.2, marginBottom: 2,
  },
  timerValue: {
    fontSize: 32, fontWeight: '900', color: '#F97316',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  streakPill: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  streakPillText: { fontSize: 14, fontWeight: '800', color: '#F97316' },
  message: {
    fontSize: 13, color: COLORS.textSecondary, lineHeight: 18,
    marginBottom: 14,
  },
  ctaBtn: {
    backgroundColor: '#F97316', paddingVertical: 14, borderRadius: 14,
    alignItems: 'center',
  },
  ctaBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  leoLogsBtn: {
    marginTop: 10, paddingVertical: 12, borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  leoLogsBtnText: { fontSize: 13, fontWeight: '700', color: '#8B5CF6' },
  proHint: {
    fontSize: 10, color: COLORS.textMuted, textAlign: 'center',
    marginTop: 10,
  },
  // Expired state
  expiredContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
  },
  expiredEmoji: { fontSize: 40, marginBottom: 8 },
  expiredTitle: { fontSize: 20, fontWeight: '800', color: COLORS.error, marginBottom: 4 },
  expiredSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 14 },
  restartBtn: {
    backgroundColor: COLORS.error, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 14, alignItems: 'center',
  },
  restartBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
