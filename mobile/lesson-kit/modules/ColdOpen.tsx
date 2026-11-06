import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';
import { ColdOpenExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { ColorText } from '../components/ColorText';
import { shortLabel } from '../text';
import { BriefingReader } from '../components/BriefingReader';
import { BriefingButton } from '../components/BriefingButton';
import { cardTerms, hasExtraBriefing } from '../cardPresentation';

/** Cold open — one arresting line, full bleed, then tap on. */
export function ColdOpen({ exercise, onChange }: ExerciseProps<ColdOpenExercise>) {
  const [showBriefing, setShowBriefing] = useState(false);
  const hasBriefing = hasExtraBriefing(exercise);

  useEffect(() => {
    onChange({ canCheck: true, isCorrect: true });
  }, [exercise.id]);


  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.coverSky} />
        <View style={styles.coverCopy}>
        {!!exercise.eyebrow && <Text style={styles.eyebrow}>{shortLabel(exercise.eyebrow).toUpperCase()}</Text>}
        <ColorText text={exercise.headline} style={styles.headline} maxSentences={4} maxLength={260} />
        {!!exercise.kicker && <ColorText text={exercise.kicker} style={styles.kicker} maxSentences={1} maxLength={80} glossary keyTerms={cardTerms(exercise)} excludedText={[exercise.headline]} />}
        {hasBriefing && (
          <View style={styles.readButton}>
            <BriefingButton text={exercise.fullText} onPress={() => setShowBriefing(true)} />
          </View>
        )}
        </View>
        <View style={styles.coverFoot} />
      </View>
      {hasBriefing && (
        <BriefingReader
          visible={showBriefing}
          title={exercise.detailTitle || exercise.eyebrow || 'Briefing'}
          eyebrow={exercise.eyebrow}
          text={exercise.fullText || ''}
          keyTerms={cardTerms(exercise)}
          sources={exercise.sources}
          onClose={() => setShowBriefing(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, flexShrink: 0, minWidth: 0, maxWidth: '100%', alignSelf: 'stretch' },
  card: {
    flexGrow: 1, flexShrink: 0, minWidth: 0, maxWidth: '100%',
    backgroundColor: tokens.color.coldOpen,
    minHeight: 300,
    padding: tokens.space.xl,
  },
  coverSky: { flexGrow: 0.42, flexBasis: 0 },
  coverCopy: { flexShrink: 0, gap: tokens.space.md },
  coverFoot: { flexGrow: 0.58, flexBasis: 0 },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    color: tokens.color.coldOpenText,
    opacity: 0.6,
  },
  headline: { fontSize: 32, fontWeight: '800', color: tokens.color.coldOpenText, lineHeight: 38 },
  kicker: { fontSize: tokens.font.body, color: tokens.color.coldOpenText, opacity: 0.75, lineHeight: 23 },
  readButton: { marginTop: 4 },
});
