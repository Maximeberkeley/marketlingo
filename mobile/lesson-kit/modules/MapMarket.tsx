import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { tokens } from '../theme/tokens';
import { MapMarketExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { Prompt, tap, useEnter } from './shared';

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
    onChange({ canCheck: true, isCorrect: i === exercise.correctIndex });
  };

  return (
    <View style={styles.wrap}>
      <Prompt eyebrow="Map the market" text={exercise.prompt} />

      <View style={styles.board}>
        <View style={styles.spine} />
        {exercise.nodes.map((n, i) => {
          const reveal = phase === 'feedback';
          const right = i === exercise.correctIndex;
          const offset = i % 2 === 0 ? styles.nodeLeft : styles.nodeRight;
          const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
          return (
            <Animated.View key={i} style={[styles.nodeRow, { opacity: enter, transform: [{ scale }] }]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => choose(i)}
                style={[
                  styles.node,
                  offset,
                  picked === i && styles.nodePicked,
                  reveal && right && styles.nodeRight2,
                  reveal && picked === i && !right && styles.nodeWrong,
                ]}
              >
                <Text style={styles.nodeLabel}>{n.label}</Text>
                {!!n.sub && <Text style={styles.nodeSub}>{n.sub}</Text>}
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
  node: {
    width: '78%',
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    backgroundColor: tokens.color.card,
    padding: tokens.space.md,
    gap: 2,
  },
  nodeLeft: { alignSelf: 'flex-start' },
  nodeRight: { alignSelf: 'flex-end' },
  nodePicked: { borderColor: tokens.color.accent, backgroundColor: tokens.color.accentSoft },
  nodeRight2: { borderColor: tokens.color.correct, backgroundColor: tokens.color.correctSoft },
  nodeWrong: { borderColor: tokens.color.incorrect, backgroundColor: tokens.color.incorrectSoft },
  nodeLabel: { fontSize: tokens.font.body, fontWeight: '800', color: tokens.color.text },
  nodeSub: { fontSize: tokens.font.caption, color: tokens.color.textSecondary },
});
