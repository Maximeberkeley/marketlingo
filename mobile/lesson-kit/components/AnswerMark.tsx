import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import type { ChoiceState } from './answerState';
import { useRevealCorrectTarget } from './RevealCorrect';

/**
 * The mark at the end of a choice: an empty ring to tap, a filled ring once
 * picked, a tick on the right answer and a cross on a wrong pick.
 */
export function AnswerMark({ state, revealed }: { state: ChoiceState; revealed?: boolean }) {
  const reveal = useRevealCorrectTarget();
  const slot = useRef<View>(null);
  useEffect(() => {
    if (state !== 'correct' || !reveal) return;
    // Wait for the feedback panel to take its space, then bring the right answer into view.
    const timer = setTimeout(() => reveal(slot.current), 320);
    return () => clearTimeout(timer);
  }, [state, reveal]);
  let mark: React.ReactNode = null;
  if (state === 'correct') mark = <Feather name="check-circle" size={22} color={tokens.color.correctDark} />;
  else if (state === 'incorrect') mark = <Feather name="x-circle" size={22} color={tokens.color.incorrectDark} />;
  else if (!revealed) {
    mark = (
      <View style={[styles.ring, state === 'selected' && styles.ringSelected]}>
        {state === 'selected' && <View style={styles.dot} />}
      </View>
    );
  }
  return <View ref={slot} collapsable={false} style={styles.slot}>{mark}</View>;
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
  slot: { width: 22, height: 22, marginLeft: tokens.space.sm, alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: tokens.color.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  ringSelected: { borderColor: tokens.color.accent },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: tokens.color.accent },
  tag: { marginTop: 6, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
});
