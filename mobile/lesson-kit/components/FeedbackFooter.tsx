import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { ColorText } from './ColorText';
import { shortLabel } from '../text';

interface Props {
  isCorrect: boolean;
  explanation?: string;
  correctAnswer?: string;
}

export function FeedbackFooter({ isCorrect, explanation, correctAnswer }: Props) {
  const tint = isCorrect ? tokens.color.correctDark : tokens.color.incorrectDark;
  return (
    <View style={[styles.wrap, { backgroundColor: isCorrect ? tokens.color.correctSoft : tokens.color.incorrectSoft }]}>
      <View style={styles.headRow}>
        <Feather name={isCorrect ? 'check-circle' : 'x-circle'} size={20} color={tint} />
        <Text style={[styles.title, { color: tint }]}>
          {isCorrect ? 'Correct' : 'Not quite'}
        </Text>
      </View>
      {!isCorrect && !!correctAnswer && (
        <ColorText text={`Answer: ${shortLabel(correctAnswer)}`} style={styles.body} maxSentences={1} maxLength={96} />
      )}
      {!!explanation && <ColorText text={explanation} style={styles.body} maxSentences={2} maxLength={150} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: tokens.space.lg,
    paddingTop: tokens.space.md,
    paddingBottom: tokens.space.sm,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
  title: { fontSize: tokens.font.prompt, fontWeight: '800' },
  body: {
    marginTop: tokens.space.sm,
    fontSize: tokens.font.caption + 1,
    lineHeight: 20,
    color: tokens.color.textSecondary,
  },
});
