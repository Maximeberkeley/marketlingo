import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { SpotFakeExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { Prompt, tap, useEnter } from './shared';
import { ColorText } from '../components/ColorText';

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
    onChange({ canCheck: true, isCorrect: i === exercise.fakeIndex });
  };

  return (
    <View style={styles.wrap}>
      <Prompt eyebrow="Spot the fake" text={exercise.prompt} />

      {exercise.statements.map((s, i) => {
        const reveal = phase === 'feedback';
        const isFake = i === exercise.fakeIndex;
        const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [14 * (i + 1), 0] });
        return (
          <Animated.View key={i} style={{ opacity: enter, transform: [{ translateY }] }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => choose(i)}
              style={[
                styles.row,
                picked === i && styles.rowPicked,
                reveal && isFake && styles.rowFake,
                reveal && picked === i && !isFake && styles.rowMiss,
              ]}
            >
              <View style={styles.iconWrap}>
                {reveal ? (
                  <Feather
                    name={isFake ? 'x-circle' : 'check-circle'}
                    size={18}
                    color={isFake ? tokens.color.incorrectDark : tokens.color.correctDark}
                  />
                ) : (
                  <Text style={styles.rowNum}>{i + 1}</Text>
                )}
              </View>
              <ColorText text={s} style={styles.rowText} maxSentences={1} maxLength={90} />
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
  rowFake: { borderColor: tokens.color.incorrect, backgroundColor: tokens.color.incorrectSoft },
  rowMiss: { borderColor: tokens.color.incorrect },
  iconWrap: { width: 22, alignItems: 'center', paddingTop: 1 },
  rowNum: { fontSize: tokens.font.caption, fontWeight: '900', color: tokens.color.textMuted },
  rowText: { flex: 1, fontSize: tokens.font.body, fontWeight: '600', color: tokens.color.text, lineHeight: 22 },
});
