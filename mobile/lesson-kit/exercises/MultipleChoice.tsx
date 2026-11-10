import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChoiceCard } from '../components/ChoiceCard';
import { answerTag, choiceStateFor } from '../components/answerState';
import { tokens } from '../theme/tokens';
import { MultipleChoiceExercise } from '../types';
import { ExerciseProps } from './types';
import { ColorText } from '../components/ColorText';
import { choiceOrder } from '../components/choiceOrder';

export function MultipleChoice({ exercise, phase, onChange }: ExerciseProps<MultipleChoiceExercise>) {
  const [selected, setSelected] = useState<number | null>(null);
  // Shown mixed; indexes stay the authored ones for grading.
  const order = useMemo(() => choiceOrder(exercise.options.length, `${exercise.id}|${exercise.prompt}`), [exercise.id, exercise.prompt, exercise.options.length]);

  useEffect(() => {
    setSelected(null);
    onChange({ canCheck: false, isCorrect: false });
  }, [exercise.id]);

  const pick = (index: number) => {
    if (phase === 'feedback') return;
    setSelected(index);
    onChange({ canCheck: true, isCorrect: index === exercise.correctIndex, selectedIndex: index });
  };

  const revealed = phase === 'feedback';

  return (
    <View style={styles.wrap}>
      <ColorText text={exercise.prompt} style={styles.prompt} maxSentences={2} maxLength={120} />
      {!!exercise.context && (
        <View style={styles.context}>
          <ColorText text={exercise.context} style={styles.contextText} maxSentences={3} maxLength={260} />
        </View>
      )}
      <View style={styles.options}>
        {order.map(i => exercise.options[i]).map((option, pos) => { const i = order[pos]; return (
          <ChoiceCard
            key={`${exercise.id}-${i}`}
            label={option}
            state={choiceStateFor(i, selected, exercise.correctIndex, revealed)}
            tag={answerTag(i, selected, exercise.correctIndex, revealed)}
            revealed={revealed}
            onPress={() => pick(i)}
            disabled={revealed}
          />
        ); })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.space.xl },
  prompt: { fontSize: tokens.font.prompt, fontWeight: '800', color: tokens.color.text, lineHeight: 28 },
  context: {
    marginTop: -tokens.space.sm,
    paddingVertical: tokens.space.md,
    paddingHorizontal: tokens.space.lg,
    borderLeftWidth: 4,
    borderLeftColor: tokens.color.accent,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
  },
  contextText: { fontSize: 17, lineHeight: 25, fontWeight: '600', color: tokens.color.text },
  options: { gap: tokens.space.md },
});
