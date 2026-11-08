import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { tokens } from '../theme/tokens';
import { FaceOffExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { Prompt, tap, useEnter } from './shared';
import { ColorText } from '../components/ColorText';
import { AnswerMark, AnswerTag } from '../components/AnswerMark';
import { answerTag, choiceStateFor } from '../components/answerState';
import { shortLabel } from '../text';
import { choiceOrder } from '../components/choiceOrder';

/** Company Face-Off — two players enter, you pick one. */
export function FaceOff({ exercise, phase, onChange }: ExerciseProps<FaceOffExercise>) {
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
    onChange({ canCheck: true, isCorrect: i === exercise.correctIndex, selectedIndex: i });
  };

  const sides = [exercise.left, exercise.right];
  // Shown mixed; indexes stay the authored ones for grading.
  const order = useMemo(() => choiceOrder(2, `${exercise.id}|${exercise.prompt}|${exercise.left.name}`), [exercise.id, exercise.prompt, exercise.left.name]);

  return (
    <View style={styles.wrap}>
      <Prompt eyebrow="Face-off" text={exercise.prompt} />

      <View style={styles.ring}>
        {order.map((i, pos) => {
          const side = sides[i];
          const reveal = phase === 'feedback';
          const state = choiceStateFor(i, picked, exercise.correctIndex, reveal);
          const translateY = enter.interpolate({
            inputRange: [0, 1],
            outputRange: [pos === 0 ? -26 : 26, 0],
          });
          return (
            <Animated.View key={i} style={[styles.sideWrap, { opacity: enter, transform: [{ translateY }] }]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => choose(i)}
                disabled={reveal}
                accessibilityRole="button"
                accessibilityState={{ selected: state === 'selected' }}
                style={[
                  styles.side,
                  state === 'selected' && styles.sidePicked,
                  state === 'correct' && styles.sideRight,
                  state === 'incorrect' && styles.sideWrong,
                  reveal && state === 'idle' && styles.sideStepBack,
                ]}
              >
                <View style={styles.sideHead}>
                  <Text style={styles.badge}>{pos === 0 ? 'A' : 'B'}</Text>
                  <AnswerMark state={state} revealed={reveal} />
                </View>
                <ColorText text={shortLabel(side.name)} style={styles.name} maxSentences={1} maxLength={60} />
                {!!side.note && <ColorText text={side.note} style={styles.note} maxSentences={1} maxLength={72} />}
                <AnswerTag text={answerTag(i, picked, exercise.correctIndex, reveal)} state={state} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        <View style={styles.vsWrap}>
          <Text style={styles.vs}>VS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  ring: { gap: tokens.space.md, position: 'relative' },
  sideWrap: {},
  side: {
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    backgroundColor: tokens.color.card,
    padding: tokens.space.lg,
    gap: 6,
    minHeight: 104,
    justifyContent: 'center',
  },
  sidePicked: { borderColor: tokens.color.accent, backgroundColor: tokens.color.accentSoft },
  sideRight: { borderColor: tokens.color.correct, backgroundColor: tokens.color.correctSoft },
  sideWrong: { borderColor: tokens.color.incorrect, backgroundColor: tokens.color.incorrectSoft },
  sideStepBack: { opacity: 0.55 },
  sideHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    color: tokens.color.textMuted,
  },
  name: { fontSize: tokens.font.prompt, fontWeight: '900', color: tokens.color.text },
  note: { fontSize: tokens.font.caption + 1, color: tokens.color.textSecondary, lineHeight: 19 },
  vsWrap: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -16,
    width: 40,
    height: 32,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.coldOpen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vs: { color: tokens.color.coldOpenText, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});
