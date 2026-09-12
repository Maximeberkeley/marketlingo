import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';
import { InfoExercise } from '../types';
import { ExerciseProps } from './types';
import { ColorText } from '../components/ColorText';
import { shortLabel, shortText } from '../text';

export function InfoCard({ exercise, onChange }: ExerciseProps<InfoExercise>) {
  useEffect(() => {
    onChange({ canCheck: true, isCorrect: true });
  }, [exercise.id]);

  const bodyIsEcho =
    !!exercise.title &&
    normalize(exercise.body) === normalize(exercise.title);

  return (
    <View style={styles.wrap}>
      {!!exercise.eyebrow && <Text style={styles.eyebrow}>{shortLabel(exercise.eyebrow)}</Text>}
      {!!exercise.title && <ColorText text={exercise.title} style={styles.title} maxSentences={1} maxLength={80} />}

      {!!exercise.body && !bodyIsEcho && <ColorText text={exercise.body} style={styles.body} maxSentences={2} maxLength={150} />}

      {exercise.bullets?.slice(0, 2).map((b, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={styles.dot} />
          <ColorText text={shortText(b, 1, 90)} style={styles.bullet} maxSentences={1} maxLength={90} />
        </View>
      ))}

      {exercise.keyTerms?.slice(0, 1).map((t, i) => (
        <View key={`t${i}`} style={styles.termCard}>
          <Text style={styles.term}>{shortLabel(t.term)}</Text>
          <ColorText text={t.definition} style={styles.termDef} maxSentences={1} maxLength={100} />
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

function normalize(s: string) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.space.md, alignSelf: 'stretch' },
  eyebrow: {
    fontSize: tokens.font.caption,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: tokens.color.accent,
  },
  title: { fontSize: tokens.font.title, fontWeight: '800', color: tokens.color.text, lineHeight: 32 },
  body: { fontSize: tokens.font.body + 1, lineHeight: 26, color: tokens.color.text },
  bulletRow: { flexDirection: 'row', gap: tokens.space.md, alignItems: 'flex-start' },
  dot: {
    width: 7, height: 7, borderRadius: 4, marginTop: 9,
    backgroundColor: tokens.color.accent,
  },
  bullet: { flex: 1, fontSize: tokens.font.body, lineHeight: 24, color: tokens.color.textSecondary },
  termCard: {
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
    padding: tokens.space.lg,
    gap: 4,
  },
  term: { fontSize: tokens.font.body, fontWeight: '800', color: tokens.color.text },
  termDef: { fontSize: tokens.font.body - 1, lineHeight: 22, color: tokens.color.textSecondary },
  sources: { fontSize: tokens.font.caption, color: tokens.color.textMuted },
});
