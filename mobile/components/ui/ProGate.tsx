import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../../lib/constants';

interface ProGateProps {
  feature: string;
  description?: string;
  remaining?: number;
  limit?: number;
}

export function ProGate({ feature, description, remaining, limit }: ProGateProps) {
  const isLimitReached = remaining !== undefined && remaining <= 0;

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={{ fontSize: 28 }}>👑</Text>
      </View>
      <Text style={styles.title}>
        {isLimitReached ? 'Daily Limit Reached' : `${feature} — Pro Feature`}
      </Text>
      <Text style={styles.description}>
        {isLimitReached
          ? `You've used all ${limit} free ${feature.toLowerCase()} today. Upgrade to Pro for unlimited access.`
          : description || `Upgrade to MarketLingo Pro to unlock ${feature}.`}
      </Text>
      <TouchableOpacity
        style={styles.upgradeBtn}
        onPress={() => router.push('/subscription')}
      >
        <Text style={styles.upgradeBtnText}>👑 Unlock with Pro</Text>
      </TouchableOpacity>
      {isLimitReached && (
        <Text style={styles.resetText}>Free limit resets tomorrow at midnight</Text>
      )}
    </View>
  );
}

interface DailyLimitBadgeProps {
  remaining: number;
  limit: number;
}

export function DailyLimitBadge({ remaining, limit }: DailyLimitBadgeProps) {
  if (remaining === Infinity) return null;
  const isLow = remaining <= 1;

  return (
    <View style={[styles.badge, isLow && styles.badgeLow]}>
      <Text style={[styles.badgeText, isLow && styles.badgeTextLow]}>
        {remaining}/{limit} remaining
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center', padding: 24, borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.06)', borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)', marginVertical: 16,
  },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' },
  description: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 16, maxWidth: 280 },
  upgradeBtn: {
    backgroundColor: COLORS.accent, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center',
  },
  upgradeBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  resetText: { fontSize: 11, color: COLORS.textMuted, marginTop: 12 },
  badge: {
    backgroundColor: COLORS.bg2, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  badgeLow: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  badgeText: { fontSize: 10, fontWeight: '500', color: COLORS.textMuted },
  badgeTextLow: { color: '#EF4444' },
});
