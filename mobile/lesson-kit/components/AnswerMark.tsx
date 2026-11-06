import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import type { ChoiceState } from './answerState';

/**
 * The mark at the end of a choice: an empty ring to tap, a filled ring once
 * picked, a tick on the right answer and a cross on a wrong pick.
 */
export function AnswerMark({ state, revealed }: { state: ChoiceState; revealed?: boolean }) {
  if (state === 'correct') return <Feather name="check-circle" size={22} color={tokens.color.correctDark} style={styles.icon} />;
  if (state === 'incorrect') return <Feather name="x-circle" size={22} color={tokens.color.incorrectDark} style={styles.icon} />;
  if (revealed) return <View style={styles.spacer} />;
  return (
    <View style={[styles.ring, state === 'selected' && styles.ringSelected]}>
      {state === 'selected' && <View style={styles.dot} />}
    </View>
  );
}

/** "Your answer" / "Right answer" under a graded choice, in the state's colour. */
export function AnswerTag({ text, state }: { text: string | null; state: ChoiceState }) {
  if (!text) return null;
  return (
    <Text style={[styles.tag, { color: state === 'incorrect' ? tokens.color.incorrectDark : tokens.color.correctDark }]}>
      {text.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: { marginLeft: tokens.space.sm },
  spacer: { width: 22, marginLeft: tokens.space.sm },
  ring: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: tokens.color.borderStrong,
    alignItems: 'center', justifyContent: 'center', marginLeft: tokens.space.sm,
  },
  ringSelected: { borderColor: tokens.color.accent },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: tokens.color.accent },
  tag: { marginTop: 6, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
});
