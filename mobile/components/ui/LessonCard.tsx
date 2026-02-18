import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';

interface LessonCardProps {
  title: string;
  subtitle: string;
  headline: string;
  xp: number;
  duration: number;
  colorScheme?: 'purple' | 'blue' | 'green' | 'amber';
  onClick: () => void;
}

const colorMap = {
  purple: { bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)', accent: '#A78BFA', tag: 'rgba(139, 92, 246, 0.2)' },
  blue: { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', accent: '#60A5FA', tag: 'rgba(59, 130, 246, 0.2)' },
  green: { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)', accent: '#4ADE80', tag: 'rgba(34, 197, 94, 0.2)' },
  amber: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', accent: '#FBBF24', tag: 'rgba(245, 158, 11, 0.2)' },
};

export function LessonCard({ title, subtitle, headline, xp, duration, colorScheme = 'purple', onClick }: LessonCardProps) {
  const colors = colorMap[colorScheme];

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}
      onPress={onClick}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={[styles.tag, { backgroundColor: colors.tag }]}>
          <Text style={[styles.tagText, { color: colors.accent }]}>{subtitle}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.metaText}>⚡ {xp} XP</Text>
          <Text style={styles.metaText}>⏱ {duration}m</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.headline} numberOfLines={2}>{headline}</Text>
      <View style={[styles.startButton, { backgroundColor: colors.accent }]}>
        <Text style={styles.startButtonText}>Start →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  meta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  headline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  startButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#0B1020',
    fontWeight: '700',
    fontSize: 13,
  },
});
