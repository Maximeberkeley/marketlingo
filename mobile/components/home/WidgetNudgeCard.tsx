import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../lib/constants';
import { triggerHaptic } from '../../lib/sensory';

interface WidgetNudgeCardProps {
  streak: number;
  onAdded: () => void;
  onSnooze: () => void;
}

export function WidgetNudgeCard({ streak, onAdded, onSnooze }: WidgetNudgeCardProps) {
  return (
    <LinearGradient
      colors={['#F97316', '#DC2626']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.headRow}>
        <View style={styles.badge}>
          <Feather name="grid" size={13} color="#FFFFFF" />
          <Text style={styles.badgeText}>LEO WIDGET</Text>
        </View>
        <TouchableOpacity onPress={onSnooze} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={16} color="rgba(255,255,255,0.75)" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Put me on your home screen.</Text>
      <Text style={styles.body}>
        {streak > 0
          ? `I'll guard your ${streak}-day streak from there. Out of sight, out of fluency.`
          : `Lock screen too. You'll see me before you see your excuses.`}
      </Text>

      <View style={styles.steps}>
        <Text style={styles.step}>1. Long-press your home screen, tap Edit, then Add Widget.</Text>
        <Text style={styles.step}>2. Search MarketLingo, pick Leo Streak, place it.</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primary}
          activeOpacity={0.88}
          onPress={() => { triggerHaptic('medium'); onAdded(); }}
        >
          <Text style={styles.primaryText}>Done, it's on there</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} activeOpacity={0.8} onPress={onSnooze}>
          <Text style={styles.secondaryText}>Later</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  body: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 14,
  },
  steps: {
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    marginBottom: 14,
  },
  step: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
  },
  secondary: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '800',
  },
});
