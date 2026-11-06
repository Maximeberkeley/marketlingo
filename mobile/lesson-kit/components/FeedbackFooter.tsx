import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { ColorText } from './ColorText';
import { shortLabel } from '../text';
import type { ReviewCard } from '../types';

interface Props {
  isCorrect: boolean;
  explanation?: string;
  correctAnswer?: string;
  /** What the learner's own pick got wrong. */
  whyWrong?: string;
  /** The lesson card behind this question, reopened from "Review this in the lesson". */
  review?: ReviewCard;
}

/** Pull a trailing "Source: …" credit off the insight so it sits on its own line. */
export function splitSource(text: string): { insight: string; source: string } {
  const raw = (text || '').trim();
  const m = raw.match(/^([\s\S]*?)\s*\(?\bSource:\s*([\s\S]+?)\)?\.?\s*$/i);
  if (!m) return { insight: raw, source: '' };
  return { insight: m[1].trim(), source: m[2].trim() };
}

export function FeedbackFooter({ isCorrect, explanation, correctAnswer, whyWrong, review }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const insets = useSafeAreaInsets();
  const tint = isCorrect ? tokens.color.correctDark : tokens.color.incorrectDark;
  const { insight, source } = splitSource(explanation || '');
  const hasMore = Boolean(insight && insight.length > 150);
  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <Feather name={isCorrect ? 'check-circle' : 'x-circle'} size={20} color={tint} />
        <Text style={[styles.title, { color: tint }]}>
          {isCorrect ? 'Correct' : 'Not quite'}
        </Text>
      </View>
      {!isCorrect && !!correctAnswer && (
        <ColorText text={`Answer: ${shortLabel(correctAnswer)}`} style={styles.body} maxSentences={1} maxLength={96} />
      )}
      {!isCorrect && !!whyWrong && <Text style={styles.why}>{whyWrong}</Text>}
      {!!insight && <ColorText text={insight} style={styles.body} maxSentences={expanded ? 100 : 2} maxLength={expanded ? 10000 : 150} />}
      {!!source && <Text style={styles.source}>Source: {source}</Text>}
      {hasMore && (
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded }} style={styles.more} onPress={() => setExpanded(value => !value)}>
          <Text style={[styles.moreText, { color: tint }]}>{expanded ? 'Show less' : 'Read full reasoning'}</Text>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={tint} />
        </TouchableOpacity>
      )}
      {!isCorrect && !!review && (
        <TouchableOpacity accessibilityRole="button" style={styles.more} onPress={() => setReviewing(true)}>
          <Feather name="book-open" size={15} color={tokens.color.accentDark} />
          <Text style={[styles.moreText, { color: tokens.color.accentDark }]}>Review this in the lesson</Text>
        </TouchableOpacity>
      )}
      {!!review && (
        <Modal visible={reviewing} transparent animationType="slide" onRequestClose={() => setReviewing(false)}>
          <View style={styles.sheetBackdrop}>
            <TouchableOpacity style={styles.sheetDismiss} accessibilityLabel="Back to the question" onPress={() => setReviewing(false)} />
            <View style={[styles.sheet, { paddingBottom: insets.bottom + tokens.space.lg }]}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetEyebrow}>FROM YOUR LESSON</Text>
              <Text style={styles.sheetTitle}>{review.title}</Text>
              <ScrollView style={styles.sheetScroll} contentContainerStyle={{ paddingBottom: tokens.space.md }}>
                <Text style={styles.sheetBody}>{review.body}</Text>
              </ScrollView>
              <TouchableOpacity accessibilityRole="button" style={styles.sheetButton} onPress={() => setReviewing(false)}>
                <Text style={styles.sheetButtonText}>Back to the question</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  source: { marginTop: 8, fontSize: 13, lineHeight: 18, fontWeight: '600', color: tokens.color.textMuted },
  wrap: {
    paddingHorizontal: tokens.space.lg,
    paddingTop: tokens.space.md,
    paddingBottom: tokens.space.sm,
    backgroundColor: tokens.color.bg,
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
  why: { marginTop: tokens.space.sm, fontSize: tokens.font.caption + 1, lineHeight: 20, fontWeight: '700', color: tokens.color.text },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetDismiss: { flex: 1 },
  sheet: {
    maxHeight: '75%',
    backgroundColor: tokens.color.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: tokens.space.lg,
    paddingTop: tokens.space.sm,
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: tokens.color.border, marginBottom: tokens.space.md },
  sheetEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: tokens.color.textMuted },
  sheetTitle: { marginTop: 4, fontSize: tokens.font.prompt, fontWeight: '800', color: tokens.color.text },
  sheetScroll: { marginTop: tokens.space.sm, flexGrow: 0 },
  sheetBody: { fontSize: tokens.font.body, lineHeight: 24, color: tokens.color.text },
  sheetButton: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.accent },
  sheetButtonText: { fontSize: 16, fontWeight: '800', color: tokens.color.textOnAccent },
});
