import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import { tokens } from '../theme/tokens';
import { NumberSenseExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { Prompt, tap } from './shared';

function fmt(n: number, unit?: string) {
  const abs = Math.abs(n);
  let s: string;
  if (abs >= 1_000_000_000) s = `${(n / 1_000_000_000).toFixed(1)}B`;
  else if (abs >= 1_000_000) s = `${(n / 1_000_000).toFixed(1)}M`;
  else if (abs >= 1_000) s = `${(n / 1_000).toFixed(1)}K`;
  else s = `${Math.round(n * 10) / 10}`;
  return unit ? `${s}${unit.length <= 2 ? unit : ' ' + unit}` : s;
}

/** Number Sense — drag the dial, then watch the real number land. */
export function NumberSense({ exercise, phase, onChange }: ExerciseProps<NumberSenseExercise>) {
  const [width, setWidth] = useState(0);
  const [ratio, setRatio] = useState(0.5);
  const [touched, setTouched] = useState(false);
  const startRatio = useRef(0.5);
  const reveal = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(exercise.min);

  const tolerance = exercise.tolerance ?? 0.12;
  const guess = exercise.min + ratio * (exercise.max - exercise.min);
  const off = Math.abs(guess - exercise.value) / (exercise.max - exercise.min);
  const correct = off <= tolerance;

  useEffect(() => {
    setRatio(0.5);
    setTouched(false);
    reveal.setValue(0);
    onChange({ canCheck: false, isCorrect: false });
  }, [exercise.id]);

  useEffect(() => {
    if (phase !== 'feedback') return;
    const id = reveal.addListener(({ value }) => {
      setShown(guess + (exercise.value - guess) * value);
    });
    Animated.timing(reveal, { toValue: 1, duration: 900, useNativeDriver: false }).start();
    return () => reveal.removeListener(id);
  }, [phase]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => phase === 'answering',
        onPanResponderGrant: () => {
          startRatio.current = ratio;
          tap();
        },
        onPanResponderMove: (_e, g) => {
          if (!width) return;
          const next = Math.min(1, Math.max(0, startRatio.current + g.dx / width));
          setRatio(next);
          if (!touched) setTouched(true);
        },
        onPanResponderRelease: () => {
          setTouched(true);
          onChange({ canCheck: true, isCorrect: correct });
        },
      }),
    [phase, ratio, width, correct, touched],
  );

  useEffect(() => {
    if (touched) onChange({ canCheck: true, isCorrect: correct });
  }, [ratio, touched, correct]);

  const targetRatio = (exercise.value - exercise.min) / (exercise.max - exercise.min);

  return (
    <View style={styles.wrap}>
      <Prompt eyebrow="Number sense" text={exercise.prompt} />

      <View style={styles.readoutWrap}>
        <Text style={styles.readout}>
          {phase === 'feedback' ? fmt(shown, exercise.unit) : fmt(guess, exercise.unit)}
        </Text>
        <Text style={styles.readoutLabel}>
          {phase === 'feedback' ? 'the real number' : touched ? 'your guess' : 'drag to guess'}
        </Text>
      </View>

      <View style={styles.trackWrap} onLayout={e => setWidth(e.nativeEvent.layout.width)} {...responder.panHandlers}>
        <View style={styles.track} />
        {phase === 'feedback' && (
          <View style={[styles.target, { left: `${targetRatio * 100}%` }]} />
        )}
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        <View style={[styles.knob, { left: `${ratio * 100}%` }]} />
      </View>

      <View style={styles.scale}>
        <Text style={styles.scaleText}>{fmt(exercise.min, exercise.unit)}</Text>
        <Text style={styles.scaleText}>{fmt(exercise.max, exercise.unit)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  readoutWrap: { alignItems: 'center', marginVertical: tokens.space.xl, gap: 4 },
  readout: { fontSize: 46, fontWeight: '900', color: tokens.color.text, letterSpacing: -1 },
  readoutLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: tokens.color.textMuted,
    textTransform: 'uppercase',
  },
  trackWrap: { height: 44, justifyContent: 'center' },
  track: { height: 10, borderRadius: tokens.radius.pill, backgroundColor: tokens.color.track },
  fill: {
    position: 'absolute',
    height: 10,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.accent,
  },
  knob: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -15,
    borderRadius: tokens.radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: tokens.color.accent,
    shadowColor: '#1A1F36',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  target: {
    position: 'absolute',
    width: 4,
    height: 28,
    marginLeft: -2,
    borderRadius: 2,
    backgroundColor: tokens.color.correct,
  },
  scale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: tokens.space.sm },
  scaleText: { fontSize: tokens.font.caption, fontWeight: '700', color: tokens.color.textMuted },
});
