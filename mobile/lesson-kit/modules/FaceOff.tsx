import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { tokens } from '../theme/tokens';
import { FaceOffExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { Prompt, tap, useEnter } from './shared';
import { ColorText } from '../components/ColorText';
import { shortLabel } from '../text';

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
    onChange({ canCheck: true, isCorrect: i === exercise.correctIndex });
  };

  const sides = [exercise.left, exercise.right];

  return (
    <View style={styles.wrap}>
      <Prompt eyebrow="Face-off" text={exercise.prompt} />

      <View style={styles.ring}>
        {sides.map((side, i) => {
          const isPicked = picked === i;
          const reveal = phase === 'feedback';
          const isRight = i === exercise.correctIndex;
          const translateY = enter.interpolate({
            inputRange: [0, 1],
            outputRange: [i === 0 ? -26 : 26, 0],
          });
          return (
            <Animated.View key={i} style={[styles.sideWrap, { opacity: enter, transform: [{ translateY }] }]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => choose(i)}
                style={[
                  styles.side,
                  isPicked && styles.sidePicked,
                  reveal && isRight && styles.sideRight,
                  reveal && isPicked && !isRight && styles.sideWrong,
                ]}
              >
                <Text style={styles.badge}>{i === 0 ? 'A' : 'B'}</Text>
                <ColorText text={shortLabel(side.name)} style={styles.name} maxSentences={1} maxLength={60} />
                {!!side.note && <ColorText text={side.note} style={styles.note} maxSentences={1} maxLength={72} />}
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
    backgroundColor: tokens.color.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vs: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});
