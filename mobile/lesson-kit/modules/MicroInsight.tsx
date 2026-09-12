import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Linking, TouchableOpacity } from 'react-native';
import { tokens } from '../theme/tokens';
import { MicroInsightExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { useEnter } from './shared';

/** Micro-insight — two lines max, big type, one idea to carry forward. */
export function MicroInsight({ exercise, onChange }: ExerciseProps<MicroInsightExercise>) {
  const enter = useEnter(exercise.id);

  useEffect(() => {
    onChange({ canCheck: true, isCorrect: true });
  }, [exercise.id]);

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View style={[styles.wrap, { opacity: enter, transform: [{ translateY }] }]}>
      {!!exercise.eyebrow && <Text style={styles.eyebrow}>{exercise.eyebrow.toUpperCase()}</Text>}
      <Text style={styles.text}>{exercise.text}</Text>
      {!!exercise.highlight && (
        <View style={styles.highlight}>
          <Text style={styles.highlightText}>{exercise.highlight}</Text>
        </View>
      )}
      {!!exercise.keyTerm && (
        <View style={styles.term}>
          <Text style={styles.termWord}>{exercise.keyTerm.term}</Text>
          <Text style={styles.termDef}>{exercise.keyTerm.definition}</Text>
        </View>
      )}
      {!!exercise.sources?.length && (
        <View style={styles.sources}>
          {exercise.sources.map((s, i) => (
            <TouchableOpacity key={i} onPress={() => Linking.openURL(s.url).catch(() => {})}>
              <Text style={styles.source}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: tokens.space.lg },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.4, color: tokens.color.accent },
  text: { fontSize: 24, fontWeight: '800', color: tokens.color.text, lineHeight: 32, letterSpacing: -0.3 },
  highlight: {
    borderLeftWidth: 4,
    borderLeftColor: tokens.color.accent,
    paddingLeft: tokens.space.md,
  },
  highlightText: { fontSize: tokens.font.body, color: tokens.color.textSecondary, lineHeight: 23, fontWeight: '600' },
  term: {
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: tokens.space.md,
    gap: 3,
  },
  termWord: { fontSize: tokens.font.caption + 1, fontWeight: '900', color: tokens.color.accentDark },
  termDef: { fontSize: tokens.font.caption + 1, color: tokens.color.textSecondary, lineHeight: 19 },
  sources: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm },
  source: { fontSize: tokens.font.caption - 1, color: tokens.color.textMuted, textDecorationLine: 'underline' },
});
