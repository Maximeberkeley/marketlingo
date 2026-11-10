import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { tokens } from '../theme/tokens';
import { MatchPairsExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { Prompt, tap, tick, useShake } from './shared';
import { ColorText } from '../components/ColorText';
import { choiceOrder } from '../components/choiceOrder';

/** One slip is forgiven: a learner who matches every pair with at most one miss gets the credit. */
export const MATCH_MISSES_ALLOWED = 1;

/** Match the pairs — tap a term, then the definition it belongs to. */
export function MatchPairs({ exercise, phase, onChange }: ExerciseProps<MatchPairsExercise>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [wrongCard, setWrongCard] = useState<number | null>(null);
  const { shake, translateX } = useShake();
  // Definitions are shown mixed; indexes stay the authored pair indexes.
  const order = useMemo(
    () => choiceOrder(exercise.pairs.length, `${exercise.id}|${exercise.pairs.map(p => p.left).join('|')}`),
    [exercise.id, exercise.pairs],
  );

  useEffect(() => {
    setSelected(null);
    setMatched([]);
    setMisses(0);
    setWrongCard(null);
    onChange({ canCheck: false, isCorrect: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);

  const reveal = phase === 'feedback';
  const done = matched.length === exercise.pairs.length;

  const pickTerm = (index: number) => {
    if (reveal || matched.includes(index)) return;
    tap();
    setSelected(index);
  };

  const pickDefinition = (index: number) => {
    if (reveal || selected === null || matched.includes(index)) return;
    if (index === selected) {
      tick(true);
      const next = [...matched, index];
      setMatched(next);
      setSelected(null);
      if (next.length === exercise.pairs.length) onChange({ canCheck: true, isCorrect: misses <= MATCH_MISSES_ALLOWED });
      return;
    }
    tick(false);
    setMisses(m => m + 1);
    setWrongCard(index);
    shake();
    setTimeout(() => setWrongCard(null), 360);
  };

  return (
    <View style={styles.wrap}>
      <Prompt eyebrow="Match the pairs" text={exercise.prompt} />

      <View style={styles.terms}>
        {exercise.pairs.map((pair, i) => {
          const isMatched = matched.includes(i) || reveal;
          const isSelected = selected === i && !isMatched;
          return (
            <TouchableOpacity
              key={`term-${i}`}
              activeOpacity={0.85}
              onPress={() => pickTerm(i)}
              disabled={isMatched}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: isMatched }}
              accessibilityLabel={`${pair.left}${isMatched ? ', matched' : ''}`}
              style={[styles.term, isSelected && styles.termSelected, isMatched && styles.termMatched]}
            >
              <Text style={[styles.termText, isSelected && styles.termTextSelected, isMatched && styles.termTextMatched]} numberOfLines={2}>
                {pair.left}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.hint}>
        {reveal ? 'Every pair, as the lesson defined it' : done ? 'All matched' : selected === null ? 'Pick a term, then its meaning' : 'Now tap what it means'}
      </Text>

      <View style={styles.cards}>
        {order.map(i => {
          const pair = exercise.pairs[i];
          const isMatched = matched.includes(i) || reveal;
          const isWrong = wrongCard === i;
          return (
            <Animated.View key={`card-${i}`} style={isWrong ? { transform: [{ translateX }] } : undefined}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => pickDefinition(i)}
                disabled={isMatched || selected === null}
                accessibilityRole="button"
                accessibilityLabel={isMatched ? `${pair.left}: ${pair.right}` : pair.right}
                style={[styles.card, isMatched && styles.cardMatched, isWrong && styles.cardWrong, selected !== null && !isMatched && styles.cardReady]}
              >
                {isMatched && <Text style={styles.cardTerm}>{pair.left}</Text>}
                <ColorText text={pair.right} style={styles.cardText} maxSentences={1} maxLength={110} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {misses > 0 && !reveal && (
        <Text style={styles.misses}>{misses === 1 ? 'One miss. One is forgiven.' : `${misses} misses`}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  terms: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm },
  term: {
    minHeight: 44,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: 10,
    borderRadius: tokens.radius.pill,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: tokens.color.borderStrong,
    backgroundColor: tokens.color.card,
    justifyContent: 'center',
    maxWidth: '100%',
  },
  termSelected: { borderColor: tokens.color.accent, backgroundColor: tokens.color.accentSoft },
  termMatched: { borderColor: tokens.color.correct, backgroundColor: tokens.color.correctSoft, borderBottomWidth: 2 },
  termText: { fontSize: tokens.font.body, fontWeight: '800', color: tokens.color.text },
  termTextSelected: { color: tokens.color.accent },
  termTextMatched: { color: tokens.color.correctDark },
  hint: {
    marginTop: tokens.space.lg,
    marginBottom: tokens.space.sm,
    fontSize: tokens.font.caption,
    fontWeight: '700',
    color: tokens.color.textMuted,
  },
  cards: { gap: tokens.space.sm },
  card: {
    minHeight: 58,
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.card,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    justifyContent: 'center',
    gap: 4,
  },
  cardReady: { borderColor: tokens.color.borderStrong },
  cardMatched: { borderColor: tokens.color.correct, backgroundColor: tokens.color.correctSoft },
  cardWrong: { borderColor: tokens.color.incorrect, backgroundColor: tokens.color.incorrectSoft },
  cardTerm: { fontSize: 11, fontWeight: '900', letterSpacing: 0.6, color: tokens.color.correctDark, textTransform: 'uppercase' },
  cardText: { fontSize: tokens.font.body - 1, lineHeight: 21, color: tokens.color.text },
  misses: { marginTop: tokens.space.md, textAlign: 'center', fontSize: tokens.font.caption, fontWeight: '700', color: tokens.color.textMuted },
});
