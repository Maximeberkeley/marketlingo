import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { TheCallExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { tap, useEnter } from './shared';

/**
 * The Call — the boss beat. Read the situation, commit, then watch the
 * consequences land one beat at a time like a newswire.
 */
export function TheCall({ exercise, phase, onChange }: ExerciseProps<TheCallExercise>) {
  const [picked, setPicked] = useState<number | null>(null);
  const [beats, setBeats] = useState(0);
  const enter = useEnter(exercise.id);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setPicked(null);
    setBeats(0);
    onChange({ canCheck: false, isCorrect: false });
  }, [exercise.id]);

  useEffect(() => {
    if (phase !== 'feedback') return;
    const list = exercise.consequences ?? [];
    timers.current.forEach(clearTimeout);
    timers.current = list.map((_, i) => setTimeout(() => setBeats(b => Math.max(b, i + 1)), 350 * (i + 1)));
    return () => timers.current.forEach(clearTimeout);
  }, [phase, exercise.id]);

  const choose = (i: number) => {
    if (phase === 'feedback') return;
    tap();
    setPicked(i);
    onChange({ canCheck: true, isCorrect: i === exercise.correctIndex });
  };

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.brief, { opacity: enter, transform: [{ translateY }] }]}>
        <View style={styles.briefHead}>
          <Feather name="radio" size={13} color={tokens.color.textOnAccent} />
          <Text style={styles.briefHeadText}>THE CALL</Text>
        </View>
        <Text style={styles.situation}>{exercise.situation}</Text>
      </Animated.View>

      <Text style={styles.prompt}>{exercise.prompt}</Text>

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
              <Text style={styles.optionText}>{o}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {phase === 'feedback' && !!exercise.consequences?.length && (
        <View style={styles.wire}>
          {exercise.consequences.slice(0, beats).map((c, i) => (
            <View key={i} style={styles.wireRow}>
              <View style={styles.wireDot} />
              <Text style={styles.wireText}>{c}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  brief: {
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.text,
    padding: tokens.space.lg,
    gap: tokens.space.sm,
  },
  briefHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  briefHeadText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    color: tokens.color.textOnAccent,
    opacity: 0.75,
  },
  situation: { fontSize: tokens.font.body + 1, fontWeight: '700', color: '#FFFFFF', lineHeight: 24 },
  prompt: {
    fontSize: tokens.font.prompt,
    fontWeight: '900',
    color: tokens.color.text,
    marginTop: tokens.space.xl,
  },
  options: { gap: tokens.space.sm, marginTop: tokens.space.md },
  option: {
    minHeight: 56,
    justifyContent: 'center',
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    borderBottomWidth: 4,
    backgroundColor: tokens.color.card,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
  },
  optionPicked: { borderColor: tokens.color.accent, backgroundColor: tokens.color.accentSoft },
  optionRight: { borderColor: tokens.color.correct, backgroundColor: tokens.color.correctSoft },
  optionWrong: { borderColor: tokens.color.incorrect, backgroundColor: tokens.color.incorrectSoft },
  optionText: { fontSize: tokens.font.body, fontWeight: '700', color: tokens.color.text, lineHeight: 22 },
  wire: { marginTop: tokens.space.xl, gap: tokens.space.md },
  wireRow: { flexDirection: 'row', gap: tokens.space.md, alignItems: 'flex-start' },
  wireDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.color.accent,
    marginTop: 6,
  },
  wireText: { flex: 1, fontSize: tokens.font.caption + 2, color: tokens.color.textSecondary, lineHeight: 21 },
});
