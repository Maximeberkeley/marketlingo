import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { tokens } from '../theme/tokens';
import { MicroInsightExercise } from '../types';
import { ExerciseProps } from '../exercises/types';
import { useEnter } from './shared';
import { ColorText } from '../components/ColorText';
import { shortLabel, shortText } from '../text';
import { BriefingReader } from '../components/BriefingReader';

/** Micro-insight — two lines max, big type, one idea to carry forward. */
export function MicroInsight({ exercise, onChange }: ExerciseProps<MicroInsightExercise>) {
  const enter = useEnter(exercise.id);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showTerm, setShowTerm] = useState(false);

  useEffect(() => {
    onChange({ canCheck: true, isCorrect: true });
  }, [exercise.id]);

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View style={[styles.wrap, { opacity: enter, transform: [{ translateY }] }]}>
      {!!exercise.eyebrow && <Text style={styles.eyebrow}>{shortLabel(exercise.eyebrow).toUpperCase()}</Text>}
      <ColorText text={exercise.text} style={styles.text} maxSentences={2} maxLength={150} />
      {!!exercise.highlight && (
        <View style={styles.highlight}>
          <ColorText text={exercise.highlight} style={styles.highlightText} maxSentences={1} maxLength={100} />
        </View>
      )}
      {!!exercise.keyTerm && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ expanded: showTerm }}
          accessibilityLabel={`${showTerm ? 'Hide' : 'Show'} definition for ${exercise.keyTerm.term}`}
          activeOpacity={0.84}
          style={styles.term}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setShowTerm(current => !current);
          }}
        >
          <View style={styles.termHead}>
            <Text style={styles.termWord}>{shortLabel(exercise.keyTerm.term)}</Text>
            <Feather name={showTerm ? 'minus' : 'plus'} size={17} color={tokens.color.accent} />
          </View>
          {showTerm && <ColorText text={exercise.keyTerm.definition} style={styles.termDef} maxSentences={100} maxLength={10000} />}
        </TouchableOpacity>
      )}
      {!!exercise.fullText && exercise.fullText.trim() !== exercise.text.trim() && (
        <TouchableOpacity accessibilityRole="button" style={styles.goDeeper} activeOpacity={0.82} onPress={() => setShowBriefing(true)}>
          <Feather name="book-open" size={16} color={tokens.color.accent} />
          <Text style={styles.goDeeperText}>Go deeper</Text>
          <Feather name="chevron-right" size={17} color={tokens.color.textMuted} />
        </TouchableOpacity>
      )}
      {!!exercise.fullText && <BriefingReader visible={showBriefing} title={exercise.detailTitle || exercise.eyebrow || 'Lesson briefing'} text={exercise.fullText} keyTerms={exercise.keyTerms || (exercise.keyTerm ? [exercise.keyTerm] : undefined)} sources={exercise.sources} onClose={() => setShowBriefing(false)} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: tokens.space.lg },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.4, color: tokens.color.accent },
  text: { fontSize: 24, fontWeight: '800', color: tokens.color.text, lineHeight: 32 },
  highlight: {
    borderLeftWidth: 4,
    borderLeftColor: tokens.color.accent,
    paddingLeft: tokens.space.md,
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
  termWord: { fontSize: tokens.font.caption + 1, fontWeight: '900', color: tokens.color.accentDark },
  termHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  termDef: { marginTop: 7, fontSize: tokens.font.body, color: tokens.color.textSecondary, lineHeight: 24 },
  goDeeper: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surface, borderWidth: 1, borderColor: tokens.color.border },
  goDeeperText: { flex: 1, fontSize: 15, fontWeight: '800', color: tokens.color.text },
});
