import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { SpotFakeExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { Prompt, tap, useEnter } from './shared';
import { ColorText } from '../components/ColorText';
import { AnswerMark, AnswerTag } from '../components/AnswerMark';
import { answerTag, choiceStateFor } from '../components/answerState';

/** Spot the Fake — three statements, one is a plant. Tap the lie. */
export function SpotTheFake({ exercise, phase, onChange }: ExerciseProps<SpotFakeExercise>) {
  const [picked, setPicked] = useState<number | null>(null);
  const enter = useEnter(exercise.id);

  useEffect(() => {
    setPicked(null);
    onChange({ canCheck: false, isCorrect: false });
  }, [exercise.id]);

  const choose = (i: number) => {
    if (phase === 'feedback') return;
    tap();
    setPicked(i);
    onChange({ canCheck: true, isCorrect: i === exercise.fakeIndex, selectedIndex: i });
  };

  return (
    <View style={styles.wrap}>
      <Prompt eyebrow="Spot the fake" text={exercise.prompt} />

      {exercise.statements.map((s, i) => {
        const reveal = phase === 'feedback';
        const isFake = i === exercise.fakeIndex;
        // The fake is the right answer here, so it takes the "right" look.
        const state = choiceStateFor(i, picked, exercise.fakeIndex, reveal);
        const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [14 * (i + 1), 0] });
        return (
          <Animated.View key={i} style={{ opacity: enter, transform: [{ translateY }] }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => choose(i)}
              disabled={reveal}
              accessibilityRole="button"
              accessibilityState={{ selected: state === 'selected' }}
              style={[
                styles.row,
                state === 'selected' && styles.rowPicked,
                state === 'correct' && styles.rowFake,
                state === 'incorrect' && styles.rowMiss,
                reveal && state === 'idle' && styles.rowStepBack,
              ]}
            >
              <View style={styles.iconWrap}>
                {reveal ? (
                  <Feather
                    name={isFake ? 'alert-triangle' : 'check'}
                    size={18}
                    color={isFake ? tokens.color.correctDark : tokens.color.textMuted}
                  />
                ) : (
                  <Text style={styles.rowNum}>{i + 1}</Text>
                )}
              </View>
              <View style={styles.rowCopy}>
                <ColorText text={s} style={styles.rowText} maxSentences={1} maxLength={90} />
                <AnswerTag text={answerTag(i, picked, exercise.fakeIndex, reveal, 'The fake')} state={state} />
              </View>
              <AnswerMark state={state} revealed={reveal} />
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.md },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.space.md,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    backgroundColor: tokens.color.card,
    padding: tokens.space.lg,
  },
  rowPicked: { borderColor: tokens.color.accent, backgroundColor: tokens.color.accentSoft },
  rowFake: { borderColor: tokens.color.correct, backgroundColor: tokens.color.correctSoft },
  rowMiss: { borderColor: tokens.color.incorrect, backgroundColor: tokens.color.incorrectSoft },
  rowStepBack: { opacity: 0.55 },
  rowCopy: { flex: 1, minWidth: 0 },
  iconWrap: { width: 22, alignItems: 'center', paddingTop: 1 },
  rowNum: { fontSize: tokens.font.caption, fontWeight: '900', color: tokens.color.textMuted },
  rowText: { fontSize: tokens.font.body, fontWeight: '600', color: tokens.color.text, lineHeight: 22 },
});
