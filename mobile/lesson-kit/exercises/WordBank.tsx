import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';
import { WordBankExercise } from '../types';
import { ExerciseProps } from './types';
import { ColorText } from '../components/ColorText';

interface Tile {
  key: string;
  word: string;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function WordBank({ exercise, phase, onChange }: ExerciseProps<WordBankExercise>) {
  const bank = useMemo<Tile[]>(
    () =>
      shuffle(
        [...exercise.answer, ...(exercise.distractors ?? [])].map((word, i) => ({
          key: `${exercise.id}-${i}-${word}`,
          word,
        })),
      ),
    [exercise.id],
  );

  const [placed, setPlaced] = useState<Tile[]>([]);

  useEffect(() => {
    setPlaced([]);
    onChange({ canCheck: false, isCorrect: false });
  }, [exercise.id]);

  const emit = (next: Tile[]) => {
    const sentence = next.map(t => t.word).join(' ');
    onChange({
      canCheck: next.length > 0,
      isCorrect: sentence === exercise.answer.join(' '),
    });
  };

  const add = (tile: Tile) => {
    if (phase === 'feedback') return;
    const next = [...placed, tile];
    setPlaced(next);
    emit(next);
  };

  const remove = (tile: Tile) => {
    if (phase === 'feedback') return;
    const next = placed.filter(t => t.key !== tile.key);
    setPlaced(next);
    emit(next);
  };

  const available = bank.filter(t => !placed.some(p => p.key === t.key));

  return (
    <View style={styles.wrap}>
      <ColorText text={exercise.prompt} style={styles.prompt} maxSentences={2} maxLength={120} />

      <View style={styles.answerArea}>
        {placed.length === 0 ? (
          <Text style={styles.placeholder}>Tap the words to build your answer</Text>
        ) : (
          <View style={styles.tileRow}>
            {placed.map(tile => (
              <TouchableOpacity key={tile.key} style={[styles.tile, styles.tilePlaced]} onPress={() => remove(tile)}>
                <Text style={styles.tileText}>{tile.word}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.tileRow}>
        {available.map(tile => (
          <TouchableOpacity key={tile.key} style={styles.tile} onPress={() => add(tile)}>
            <Text style={styles.tileText}>{tile.word}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.space.xl },
  prompt: { fontSize: tokens.font.prompt, fontWeight: '800', color: tokens.color.text, lineHeight: 28 },
  answerArea: {
    minHeight: 96,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
    padding: tokens.space.md,
    justifyContent: 'center',
  },
  placeholder: { color: tokens.color.textMuted, fontSize: tokens.font.caption + 1 },
  tileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm },
  tile: {
    height: tokens.size.tileHeight,
    paddingHorizontal: tokens.space.lg,
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilePlaced: {
    borderColor: tokens.color.accent,
    backgroundColor: tokens.color.accentSoft,
  },
  tileText: { fontSize: tokens.font.body, fontWeight: '600', color: tokens.color.text },
});
