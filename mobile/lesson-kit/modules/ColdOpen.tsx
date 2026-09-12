import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { tokens } from '../theme/tokens';
import { ColdOpenExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { useEnter } from './shared';

/** Cold open — one arresting line, full bleed, then tap on. */
export function ColdOpen({ exercise, onChange }: ExerciseProps<ColdOpenExercise>) {
  const enter = useEnter(exercise.id);

  useEffect(() => {
    onChange({ canCheck: true, isCorrect: true });
  }, [exercise.id]);

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.card, { opacity: enter, transform: [{ translateY }, { scale }] }]}>
        {!!exercise.eyebrow && <Text style={styles.eyebrow}>{exercise.eyebrow.toUpperCase()}</Text>}
        <Text style={styles.headline}>{exercise.headline}</Text>
        {!!exercise.kicker && <Text style={styles.kicker}>{exercise.kicker}</Text>}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center' },
  card: {
    borderRadius: tokens.radius.xl,
    backgroundColor: tokens.color.text,
    padding: tokens.space.xl,
    gap: tokens.space.md,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    color: '#FFFFFF',
    opacity: 0.6,
  },
  headline: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', lineHeight: 36, letterSpacing: -0.5 },
  kicker: { fontSize: tokens.font.body, color: '#FFFFFF', opacity: 0.75, lineHeight: 23 },
});
