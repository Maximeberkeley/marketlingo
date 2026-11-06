import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChoiceCard } from '../components/ChoiceCard';
import { answerTag, choiceStateFor } from '../components/answerState';
import { tokens } from '../theme/tokens';
import { MultipleChoiceExercise } from '../types';
import { ExerciseProps } from './types';
import { ColorText } from '../components/ColorText';

export function MultipleChoice({ exercise, phase, onChange }: ExerciseProps<MultipleChoiceExercise>) {
  const [selected, setSelected] = useState<number | null>(null);

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
      <View style={styles.options}>
        {exercise.options.map((option, i) => (
          <ChoiceCard
            key={`${exercise.id}-${i}`}
            label={option}
            state={choiceStateFor(i, selected, exercise.correctIndex, revealed)}
            tag={answerTag(i, selected, exercise.correctIndex, revealed)}
            revealed={revealed}
            onPress={() => pick(i)}
            disabled={revealed}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.space.xl },
  prompt: { fontSize: tokens.font.prompt, fontWeight: '800', color: tokens.color.text, lineHeight: 28 },
  options: { gap: tokens.space.md },
});
