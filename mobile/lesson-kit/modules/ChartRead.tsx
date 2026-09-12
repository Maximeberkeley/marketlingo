import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { tokens } from '../theme/tokens';
import { ChartReadExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { Prompt, tap } from './shared';

/** A tiny bar-based sparkline drawn with plain views — no chart library. */
function Spark({
  values,
  color,
  height = 60,
  faded = false,
}: {
  values: number[];
  color: string;
  height?: number;
  faded?: boolean;
}) {
  return (
    <View style={[styles.spark, { height }]}>
      {values.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            marginHorizontal: 1,
            borderRadius: 2,
            backgroundColor: color,
            opacity: faded ? 0.35 : 1,
            height: Math.max(4, Math.min(1, Math.max(0, v)) * height),
          }}
        />
      ))}
    </View>
  );
}

/** Chart Read — where does the line go next? */
export function ChartRead({ exercise, phase, onChange }: ExerciseProps<ChartReadExercise>) {
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    setPicked(null);
    onChange({ canCheck: false, isCorrect: false });
  }, [exercise.id]);

  const choose = (i: number) => {
    if (phase === 'feedback') return;
    tap();
    setPicked(i);
    onChange({ canCheck: true, isCorrect: i === exercise.correctIndex });
  };

  return (
    <View style={styles.wrap}>
      <Prompt eyebrow="Read the chart" text={exercise.prompt} />

      <View style={styles.history}>
        <Spark values={exercise.history} color={tokens.color.text} height={80} />
        <Text style={styles.axis}>so far</Text>
      </View>

      <View style={styles.options}>
        {exercise.options.map((o, i) => {
          const reveal = phase === 'feedback';
          const right = i === exercise.correctIndex;
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.9}
              onPress={() => choose(i)}
              style={[
                styles.option,
                picked === i && styles.optionPicked,
                reveal && right && styles.optionRight,
                reveal && picked === i && !right && styles.optionWrong,
              ]}
            >
              <Spark values={exercise.history.slice(-3)} color={tokens.color.textMuted} height={44} faded />
              <Spark
                values={o}
                color={reveal && right ? tokens.color.correct : tokens.color.accent}
                height={44}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  spark: { flexDirection: 'row', alignItems: 'flex-end', flex: 1 },
  history: {
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.surface,
    borderWidth: 2,
    borderColor: tokens.color.border,
    padding: tokens.space.md,
    gap: 6,
  },
  axis: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: tokens.color.textMuted,
    textTransform: 'uppercase',
  },
  options: { gap: tokens.space.sm, marginTop: tokens.space.lg },
  option: {
    flexDirection: 'row',
    gap: 4,
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    backgroundColor: tokens.color.card,
    padding: tokens.space.md,
    height: 72,
  },
  optionPicked: { borderColor: tokens.color.accent, backgroundColor: tokens.color.accentSoft },
  optionRight: { borderColor: tokens.color.correct, backgroundColor: tokens.color.correctSoft },
  optionWrong: { borderColor: tokens.color.incorrect, backgroundColor: tokens.color.incorrectSoft },
});
