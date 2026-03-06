import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../../lib/constants';
import { useContentAccess } from '../../hooks/useContentAccess';
import { useSubscription, TRIAL_DURATION_DAYS } from '../../hooks/useSubscription';

interface DailyLimitGateProps {
  type: 'games' | 'drills' | 'trainer';
  limitInfo: { remaining: number; limit: number };
  onContinue?: () => void;
}

const typeLabels = { games: 'games', drills: 'drills', trainer: 'trainer scenarios' };
const typeIcons = { games: '', drills: '⚡', trainer: '' };

export function DailyLimitGate({ type, limitInfo, onContinue }: DailyLimitGateProps) {
  const { canStartTrial, startFreeTrial } = useSubscription();
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;

  const label = typeLabels[type];
  const icon = typeIcons[type];

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, damping: 18, stiffness: 250, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(200),
      Animated.spring(iconBounce, { toValue: -8, damping: 8, useNativeDriver: true }),
      Animated.spring(iconBounce, { toValue: 0, damping: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleStartTrial = async () => {
    const success = await startFreeTrial();
    if (success && onContinue) onContinue();
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <Animated.Text style={[styles.icon, { transform: [{ translateY: iconBounce }] }]}>
        {icon}
      </Animated.Text>

      <Text style={styles.title}>Daily Limit Reached</Text>
      <Text style={styles.description}>
        You've used all {limitInfo.limit} free {label} for today.
      </Text>

      <View style={styles.resetRow}>
        <Text style={styles.resetIcon}></Text>
        <Text style={styles.resetText}>Resets at midnight</Text>
      </View>

      {canStartTrial ? (
        <TouchableOpacity style={styles.trialBtn} onPress={handleStartTrial} activeOpacity={0.85}>
          <Text style={styles.trialBtnText}>✨ Try {TRIAL_DURATION_DAYS} Days Free</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.upgradeBtn}
          onPress={() => router.push('/subscription')}
          activeOpacity={0.85}
        >
          <Text style={styles.upgradeBtnText}> Upgrade for Unlimited</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.proNote}>Pro members get unlimited {label} every day</Text>
    </Animated.View>
  );
}

interface DailyLimitBadgeProps {
  remaining: number;
  limit: number;
  type: string;
}

export function DailyLimitBadge({ remaining, limit, type }: DailyLimitBadgeProps) {
  if (remaining === Infinity || remaining === limit) return null;
  const isLow = remaining <= 1;

  return (
    <View style={[styles.badge, isLow && styles.badgeLow]}>
      <Text style={[styles.badgeText, isLow && styles.badgeTextLow]}>
        {remaining}/{limit} left today
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 16,
  },
  icon: { fontSize: 44, marginBottom: 16 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
    maxWidth: 280,
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  resetIcon: { fontSize: 14 },
  resetText: { fontSize: 12, color: COLORS.textMuted },
  trialBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  trialBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  upgradeBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  upgradeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  proNote: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 },
  badge: {
    backgroundColor: COLORS.bg2,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeLow: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  badgeText: { fontSize: 10, fontWeight: '500', color: COLORS.textMuted },
  badgeTextLow: { color: '#EF4444' },
});
