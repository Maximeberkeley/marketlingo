import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';

interface StreakBadgeProps {
  count: number;
}

export function StreakBadge({ count }: StreakBadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔥</Text>
      <Text style={styles.count}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.streak,
  },
});
