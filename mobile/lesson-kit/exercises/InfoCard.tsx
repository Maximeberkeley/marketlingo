import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';
import { InfoExercise } from '../types';
import { ExerciseProps } from './types';

export function InfoCard({ exercise, onChange }: ExerciseProps<InfoExercise>) {
  useEffect(() => {
    onChange({ canCheck: true, isCorrect: true });
  }, [exercise.id]);

  return (
    <View style={styles.wrap}>
      {!!exercise.title && <Text style={styles.title}>{exercise.title}</Text>}
      <Text style={styles.body}>{exercise.body}</Text>
      {exercise.bullets?.map((b, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={styles.dot} />
          <Text style={styles.bullet}>{b}</Text>
        </View>
      ))}
      {!!exercise.sources?.length && (
        <Text style={styles.sources}>
          Sources: {exercise.sources.map(s => s.label).join(' · ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.space.md },
  title: { fontSize: tokens.font.title, fontWeight: '800', color: tokens.color.text },
  body: { fontSize: tokens.font.body + 1, lineHeight: 26, color: tokens.color.text },
  bulletRow: { flexDirection: 'row', gap: tokens.space.md, alignItems: 'flex-start' },
  dot: {
    width: 7, height: 7, borderRadius: 4, marginTop: 9,
    backgroundColor: tokens.color.accent,
  },
  bullet: { flex: 1, fontSize: tokens.font.body, lineHeight: 24, color: tokens.color.textSecondary },
  sources: { fontSize: tokens.font.caption, color: tokens.color.textMuted },
});
