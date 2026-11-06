import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { tokens } from '../theme/tokens';
import { MapMarketExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { Prompt, tap, useEnter } from './shared';
import { ColorText } from '../components/ColorText';
import { AnswerMark, AnswerTag } from '../components/AnswerMark';
import { answerTag, choiceStateFor } from '../components/answerState';
import { shortLabel } from '../text';

/** Map the Market — a stylised value-chain board; tap the node that fits. */
export function MapMarket({ exercise, phase, onChange }: ExerciseProps<MapMarketExercise>) {
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

  return (
    <View style={styles.wrap}>
      <Prompt eyebrow="Map the market" text={exercise.prompt} />

      <View style={styles.board}>
        <View style={styles.spine} />
        {exercise.nodes.map((n, i) => {
          const reveal = phase === 'feedback';
          const state = choiceStateFor(i, picked, exercise.correctIndex, reveal);
          const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
          return (
            <Animated.View key={i} style={[styles.nodeRow, { opacity: enter, transform: [{ scale }] }]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => choose(i)}
                disabled={reveal}
                accessibilityRole="button"
                accessibilityState={{ selected: state === 'selected' }}
                style={[
                  styles.node,
                  state === 'selected' && styles.nodePicked,
                  state === 'correct' && styles.nodeRight2,
                  state === 'incorrect' && styles.nodeWrong,
                  reveal && state === 'idle' && styles.nodeStepBack,
                ]}
              >
                <View style={styles.nodeCopy}>
                  <Text style={styles.nodeLabel}>{shortLabel(n.label)}</Text>
                  {!!n.sub && <ColorText text={n.sub} style={styles.nodeSub} maxSentences={1} maxLength={70} />}
                  <AnswerTag text={answerTag(i, picked, exercise.correctIndex, reveal)} state={state} />
                </View>
                <AnswerMark state={state} revealed={reveal} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  board: { position: 'relative', paddingVertical: tokens.space.sm },
  spine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: tokens.color.border,
  },
  nodeRow: { marginBottom: tokens.space.md },
  // Full-width rows: the whole line is the touch target; the spine shows in the gaps.
  node: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    backgroundColor: tokens.color.card,
    padding: tokens.space.md,
    gap: 2,
  },
  nodePicked: { borderColor: tokens.color.accent, backgroundColor: tokens.color.accentSoft },
  nodeRight2: { borderColor: tokens.color.correct, backgroundColor: tokens.color.correctSoft },
  nodeWrong: { borderColor: tokens.color.incorrect, backgroundColor: tokens.color.incorrectSoft },
  nodeStepBack: { opacity: 0.55 },
  nodeCopy: { flex: 1, minWidth: 0, gap: 2 },
  nodeLabel: { fontSize: tokens.font.body, fontWeight: '800', color: tokens.color.text },
  nodeSub: { fontSize: tokens.font.caption, color: tokens.color.textSecondary },
});
