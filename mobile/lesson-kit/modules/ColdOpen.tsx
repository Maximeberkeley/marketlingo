import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
import { ColdOpenExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { ColorText } from '../components/ColorText';
import { shortLabel } from '../text';
import { BriefingReader } from '../components/BriefingReader';
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
        {!!exercise.kicker && <ColorText text={exercise.kicker} style={styles.kicker} maxSentences={1} maxLength={80} />}
        {hasBriefing && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Read full briefing"
            activeOpacity={0.82}
            style={styles.readButton}
            onPress={() => setShowBriefing(true)}
          >
            <View style={styles.readIcon}><Feather name="file-text" size={15} color={tokens.color.accent} /></View>
            <View style={styles.readCopy}>
              <Text style={styles.readTitle}>Read briefing</Text>
              <Text style={styles.readNote}>Full context · readable view</Text>
            </View>
            <Feather name="chevron-right" size={18} color={tokens.color.textMuted} />
          </TouchableOpacity>
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
  wrap: { flexGrow: 1, flexBasis: 0, minWidth: 0, maxWidth: '100%', alignSelf: 'stretch' },
  card: {
    flexGrow: 1, flexBasis: 0, minWidth: 0, maxWidth: '100%',
    backgroundColor: tokens.color.coldOpen,
    minHeight: 300,
    padding: tokens.space.xl,
  },
  coverSky: { flexGrow: 2, flexBasis: 0 },
  coverCopy: { flexShrink: 0, gap: tokens.space.md },
  coverFoot: { flexGrow: 1, flexBasis: 0 },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    color: tokens.color.coldOpenText,
    opacity: 0.6,
  },
  headline: { fontSize: 32, fontWeight: '800', color: tokens.color.coldOpenText, lineHeight: 38 },
  kicker: { fontSize: tokens.font.body, color: tokens.color.coldOpenText, opacity: 0.75, lineHeight: 23 },
  readButton: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 4, paddingHorizontal: 13, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surface, borderWidth: 1, borderColor: tokens.color.border },
  readIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.accentSoft },
  readCopy: { flex: 1, minWidth: 0 },
  readTitle: { fontSize: 15, fontWeight: '800', color: tokens.color.text },
  readNote: { marginTop: 2, fontSize: 11, fontWeight: '600', color: tokens.color.textMuted },
});
