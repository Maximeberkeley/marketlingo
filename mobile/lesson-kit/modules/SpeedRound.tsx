import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { tokens } from '../theme/tokens';
import { SpeedRoundExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { Prompt, tick } from './shared';

/** Beat the Clock — rapid-fire term matching against a shrinking bar. */
export function SpeedRound({ exercise, phase, onChange }: ExerciseProps<SpeedRoundExercise>) {
  const total = exercise.seconds ?? Math.max(12, exercise.rounds.length * 6);
  const [index, setIndex] = useState(0);
  const [hits, setHits] = useState(0);
  const [flash, setFlash] = useState<'none' | 'good' | 'bad'>('none');
  const [left, setLeft] = useState(total);
  const bar = useRef(new Animated.Value(1)).current;
  const finished = index >= exercise.rounds.length || left <= 0;

  useEffect(() => {
    setIndex(0);
    setHits(0);
    setLeft(total);
    setFlash('none');
    bar.setValue(1);
    onChange({ canCheck: false, isCorrect: false });
    Animated.timing(bar, { toValue: 0, duration: total * 1000, useNativeDriver: false }).start();
  }, [exercise.id]);

  useEffect(() => {
    if (phase === 'feedback' || finished) return;
    const t = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [phase, finished]);

  useEffect(() => {
    if (!finished) return;
    bar.stopAnimation();
    const pass = hits >= Math.ceil(exercise.rounds.length * 0.7);
    onChange({ canCheck: true, isCorrect: pass });
  }, [finished, hits]);

  const round = exercise.rounds[index];

  const answer = (i: number) => {
    if (!round || phase === 'feedback' || finished) return;
    const right = i === round.correctIndex;
    tick(right);
    if (right) setHits(h => h + 1);
    setFlash(right ? 'good' : 'bad');
    setTimeout(() => setFlash('none'), 220);
    setIndex(n => n + 1);
  };

  return (
    <View style={styles.wrap}>
      <Prompt eyebrow="Beat the clock" text={exercise.prompt} />

      <View style={styles.timerRow}>
        <View style={styles.timerTrack}>
          <Animated.View
            style={[
              styles.timerFill,
              { width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]}
          />
        </View>
        <Text style={styles.timerText}>{left}s</Text>
      </View>

      <View
        style={[
          styles.stage,
          flash === 'good' && styles.stageGood,
          flash === 'bad' && styles.stageBad,
        ]}
      >
        {finished ? (
          <Text style={styles.score}>
            {hits} / {exercise.rounds.length} right
          </Text>
        ) : (
          <Text style={styles.question}>{round.question}</Text>
        )}
      </View>

      {!finished && (
        <View style={styles.options}>
          {round.options.map((o, i) => (
            <TouchableOpacity key={i} activeOpacity={0.85} style={styles.option} onPress={() => answer(i)}>
              <Text style={styles.optionText}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.counter}>
        {Math.min(index, exercise.rounds.length)} / {exercise.rounds.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md },
  timerTrack: {
    flex: 1,
    height: 8,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.track,
    overflow: 'hidden',
  },
  timerFill: { height: 8, borderRadius: tokens.radius.pill, backgroundColor: tokens.color.heart },
  timerText: { fontSize: tokens.font.caption, fontWeight: '900', color: tokens.color.textSecondary, width: 34 },
  stage: {
    minHeight: 110,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.surface,
    borderWidth: 2,
    borderColor: tokens.color.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space.lg,
    marginTop: tokens.space.lg,
  },
  stageGood: { borderColor: tokens.color.correct, backgroundColor: tokens.color.correctSoft },
  stageBad: { borderColor: tokens.color.incorrect, backgroundColor: tokens.color.incorrectSoft },
  question: {
    fontSize: tokens.font.prompt,
    fontWeight: '800',
    color: tokens.color.text,
    textAlign: 'center',
    lineHeight: 27,
  },
  score: { fontSize: 30, fontWeight: '900', color: tokens.color.text },
  options: { gap: tokens.space.sm, marginTop: tokens.space.lg },
  option: {
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.card,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    borderBottomWidth: 4,
    paddingHorizontal: tokens.space.lg,
  },
  optionText: { fontSize: tokens.font.body, fontWeight: '800', color: tokens.color.text },
  counter: {
    marginTop: tokens.space.md,
    textAlign: 'center',
    fontSize: tokens.font.caption,
    fontWeight: '700',
    color: tokens.color.textMuted,
  },
});
