import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { tokens } from '../theme/tokens';
import { MicroInsightExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { ColorText } from '../components/ColorText';
import { shortLabel, shortText } from '../text';
import { BriefingReader } from '../components/BriefingReader';
import { cardCopy, cardTerms, hasExtraBriefing, readingCardKind } from '../cardPresentation';
import { ReadingCopy } from '../components/ReadingCopy';

/** Micro-insight — two lines max, big type, one idea to carry forward. */
export function MicroInsight({ exercise, onChange }: ExerciseProps<MicroInsightExercise>) {
  const kind = readingCardKind(exercise);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showTerm, setShowTerm] = useState(false);
  const keyTerm = cardTerms(exercise)[0];
  const hasBriefing = hasExtraBriefing(exercise);
  const [headline, body, highlight] = cardCopy(exercise);

  useEffect(() => {
    onChange({ canCheck: true, isCorrect: true });
  }, [exercise.id]);


  return (
    <View style={[styles.wrap, kind === 'takeaway' && styles.takeaway]}>
      {kind === 'takeaway' ? <Text style={styles.eyebrow}>The rule</Text> : !!exercise.eyebrow && <Text style={styles.eyebrow}>{shortLabel(exercise.eyebrow).toUpperCase()}</Text>}
      <View style={kind === 'evidence' ? styles.evidence : undefined}>
        <ReadingCopy text={headline} body={body} evidence={kind === 'evidence'} preserveCover={kind === 'takeaway'} />
      </View>
      {!!highlight && (
        <View style={styles.highlight}>
          <ReadingCopy text="" body={highlight} preserveCover={kind === 'takeaway'} />
        </View>
      )}
      {!!keyTerm && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ expanded: showTerm }}
          accessibilityLabel={`${showTerm ? 'Hide' : 'Show'} definition for ${keyTerm.term}`}
          activeOpacity={0.84}
          style={styles.term}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setShowTerm(current => !current);
          }}
        >
          <View style={styles.termHead}>
            <Text style={styles.termWord}>{shortLabel(keyTerm.term)}</Text>
            <Feather name={showTerm ? 'minus' : 'plus'} size={17} color={tokens.color.accent} />
          </View>
          {showTerm && <ColorText text={keyTerm.definition} style={styles.termDef} maxSentences={100} maxLength={10000} />}
        </TouchableOpacity>
      )}
      {hasBriefing && (
        <TouchableOpacity accessibilityRole="button" style={styles.goDeeper} activeOpacity={0.82} onPress={() => setShowBriefing(true)}>
          <Feather name="book-open" size={16} color={tokens.color.accent} />
          <Text style={styles.goDeeperText}>Go deeper</Text>
          <Feather name="chevron-right" size={17} color={tokens.color.textMuted} />
        </TouchableOpacity>
      )}
      {hasBriefing && <BriefingReader visible={showBriefing} title={exercise.detailTitle || exercise.eyebrow || 'Lesson briefing'} text={exercise.fullText || ''} keyTerms={cardTerms(exercise)} sources={exercise.sources} onClose={() => setShowBriefing(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { minWidth: 0, maxWidth: '100%', alignSelf: 'stretch', gap: tokens.space.lg },
  takeaway: { backgroundColor: tokens.color.accentSoft, borderRadius: tokens.radius.lg, padding: tokens.space.xl },
  evidence: { backgroundColor: tokens.color.evidence, borderRadius: tokens.radius.md, padding: tokens.space.xl },
  quote: { fontSize: 22, lineHeight: 30, color: tokens.color.text, fontWeight: '500' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 0, color: tokens.color.accent },
  text: { fontSize: 28, fontWeight: '800', color: tokens.color.text, lineHeight: 32 },
  highlight: {
    paddingTop: tokens.space.sm,
  },
  highlightText: { fontSize: tokens.font.body, color: tokens.color.textSecondary, lineHeight: 23, fontWeight: '600' },
  term: {
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: tokens.space.md,
    gap: 3,
  },
  termWord: { flex: 1, flexShrink: 1, minWidth: 0, fontSize: tokens.font.caption + 1, fontWeight: '900', color: tokens.color.accentDark },
  termHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  termDef: { marginTop: 7, fontSize: tokens.font.body, color: tokens.color.textSecondary, lineHeight: 24 },
  goDeeper: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surface, borderWidth: 1, borderColor: tokens.color.border },
  goDeeperText: { flex: 1, fontSize: 15, fontWeight: '800', color: tokens.color.text },
});
