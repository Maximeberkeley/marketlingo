import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { BuildChainExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { Prompt, shuffle, tap, tick, useShake } from './shared';
import { ColorText } from '../components/ColorText';
import { shortLabel } from '../text';

/**
 * Build the Chain — tap the steps in the real order.
 * Each correct step snaps into the chain; the whole chain pulses when complete.
 */
export function BuildChain({ exercise, phase, onChange }: ExerciseProps<BuildChainExercise>) {
  const bank = useMemo(
    () => shuffle(exercise.steps.map((label, i) => ({ label, i }))),
    [exercise.id],
  );
  const [used, setUsed] = useState<number[]>([]);
  const [wrongs, setWrongs] = useState(0);
  const { shake, translateX } = useShake();
  const pulse = useMemo(() => new Animated.Value(0), [exercise.id]);

  useEffect(() => {
    setUsed([]);
    setWrongs(0);
    onChange({ canCheck: false, isCorrect: false });
  }, [exercise.id]);

  const complete = used.length === exercise.steps.length;

  useEffect(() => {
    if (!complete) return;
    onChange({ canCheck: true, isCorrect: wrongs === 0 });
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [complete, wrongs]);

  const pick = (stepIndex: number) => {
    if (phase === 'feedback' || complete) return;
    if (used.includes(stepIndex)) return;
    if (stepIndex === used.length) {
      tick(true);
      setUsed(u => [...u, stepIndex]);
    } else {
      tick(false);
      setWrongs(w => w + 1);
      shake();
    }
  };

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  return (
    <View style={styles.wrap}>
      <Prompt eyebrow="Build the chain" text={exercise.prompt} />

      <Animated.View style={[styles.chain, { transform: [{ scale }] }]}>
        {exercise.steps.map((_, slot) => {
          const filled = slot < used.length;
          return (
            <View key={slot} style={styles.slotRow}>
              <View style={[styles.slot, filled && styles.slotFilled]}>
                <Text style={[styles.slotNum, filled && styles.slotNumFilled]}>{slot + 1}</Text>
                <ColorText
                  text={filled ? exercise.steps[used[slot]] : 'Tap the next step'}
                  style={[styles.slotText, filled && styles.slotTextFilled]}
                  maxSentences={1}
                  maxLength={64}
                  numberOfLines={2}
                />
              </View>
              {slot < exercise.steps.length - 1 && (
                <Feather
                  name="chevron-down"
                  size={16}
                  color={filled ? tokens.color.accent : tokens.color.border}
                  style={styles.arrow}
                />
              )}
            </View>
          );
        })}
      </Animated.View>

      <Animated.View style={[styles.bank, { transform: [{ translateX }] }]}>
        {bank.map(({ label, i }) => {
          const spent = used.includes(i);
          return (
            <TouchableOpacity
              key={i}
              disabled={spent || phase === 'feedback'}
              onPress={() => {
                tap();
                pick(i);
              }}
              style={[styles.tile, spent && styles.tileSpent]}
            >
              <Text style={[styles.tileText, spent && styles.tileTextSpent]}>{shortLabel(label)}</Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  chain: { gap: 0 },
  slotRow: { alignItems: 'stretch' },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.md,
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
    paddingVertical: tokens.space.md,
    paddingHorizontal: tokens.space.md,
    minHeight: 54,
  },
  slotFilled: {
    borderStyle: 'solid',
    borderColor: tokens.color.accent,
    backgroundColor: tokens.color.accentSoft,
  },
  slotNum: {
    fontSize: tokens.font.caption,
    fontWeight: '900',
    color: tokens.color.textMuted,
    width: 16,
    textAlign: 'center',
  },
  slotNumFilled: { color: tokens.color.accentDark },
  slotText: { flex: 1, fontSize: tokens.font.caption + 2, fontWeight: '600', color: tokens.color.textMuted },
  slotTextFilled: { color: tokens.color.text, fontWeight: '800' },
  arrow: { alignSelf: 'center', marginVertical: 2 },
  bank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space.sm,
    marginTop: tokens.space.xl,
  },
  tile: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: 10,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.card,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    borderBottomWidth: 4,
  },
  tileSpent: {
    backgroundColor: tokens.color.disabled,
    borderColor: tokens.color.disabled,
    borderBottomWidth: 2,
  },
  tileText: { fontSize: tokens.font.caption + 2, fontWeight: '800', color: tokens.color.text },
  tileTextSpent: { color: tokens.color.disabledText },
});
