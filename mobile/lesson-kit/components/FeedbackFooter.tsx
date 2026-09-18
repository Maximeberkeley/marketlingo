import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  const [expanded, setExpanded] = useState(false);
  const tint = isCorrect ? tokens.color.correctDark : tokens.color.incorrectDark;
  const hasMore = Boolean(explanation && explanation.length > 150);
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
      {!!explanation && <ColorText text={explanation} style={styles.body} maxSentences={expanded ? 100 : 2} maxLength={expanded ? 10000 : 150} />}
      {hasMore && (
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded }} style={styles.more} onPress={() => setExpanded(value => !value)}>
          <Text style={[styles.moreText, { color: tint }]}>{expanded ? 'Show less' : 'Read full reasoning'}</Text>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={tint} />
        </TouchableOpacity>
      )}
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
  more: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  moreText: { fontSize: 13, fontWeight: '800' },
});
