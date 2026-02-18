import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';

interface XPBadgeProps {
  xp: number;
  level: number;
  showLevel?: boolean;
}

export function XPBadge({ xp, level, showLevel = false }: XPBadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⚡</Text>
      <Text style={styles.xp}>{xp.toLocaleString()}</Text>
      {showLevel && <Text style={styles.level}>Lv.{level}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  emoji: {
    fontSize: 14,
  },
  xp: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EAB308',
  },
  level: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EAB308',
    opacity: 0.7,
  },
});
