import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ProgressBar } from './ProgressBar';
import { tokens } from '../theme/tokens';

interface Props {
  progress: number;
  onExit: () => void;
  lives?: number;
  label?: string;
}

export function LessonHeader({ progress, onExit, lives, label }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TouchableOpacity onPress={onExit} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Feather name="x" size={24} color={tokens.color.textMuted} />
        </TouchableOpacity>

        <ProgressBar progress={progress} />

        {typeof lives === 'number' ? (
          <View style={styles.lives}>
            <Feather name="heart" size={18} color={tokens.color.heart} />
            <Text style={styles.livesText}>{lives}</Text>
          </View>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
      {!!label && <Text style={styles.label} numberOfLines={1}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: tokens.space.lg,
    paddingTop: tokens.space.sm,
    paddingBottom: tokens.space.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md },
  lives: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 34 },
  livesText: { color: tokens.color.heart, fontWeight: '700', fontSize: tokens.font.caption },
  spacer: { width: 8 },
  label: {
    marginTop: tokens.space.sm,
    fontSize: tokens.font.caption,
    color: tokens.color.textMuted,
    fontWeight: '600',
  },
});
