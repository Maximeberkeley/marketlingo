/**
 * LessonDecisionModal — the Decision Engine as the closing beat of a lesson.
 * Predict → decide → consequence → explanation, then hand off to completion.
 * Auto-skips silently when the flag is off or no scenario exists for the day.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { DecisionScenario, fetchScenarios, gradeFromAnswer } from '../../lib/decisionEngine';
import { isFeatureEnabled } from '../../hooks/useFeatureFlags';
import { trackEvent } from '../../lib/analytics';
import { DecisionCard } from './DecisionCard';

interface Props {
  visible: boolean;
  marketId?: string;
  stackId?: string | null;
  dayNumber?: number | null;
  lessonTitle?: string;
  onDone: () => void;
  onGraded?: (grade: number, conceptKey: string) => void;
}

export function LessonDecisionModal({
  visible,
  marketId,
  stackId,
  dayNumber,
  lessonTitle,
  onDone,
  onGraded,
}: Props) {
  const insets = useSafeAreaInsets();
  const [scenario, setScenario] = useState<DecisionScenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!visible) return;

    (async () => {
      setLoading(true);
      setResolved(false);
      setScenario(null);

      if (!marketId || !(await isFeatureEnabled('decision_engine'))) {
        if (!cancelled) onDone();
        return;
      }

      let found = await fetchScenarios({ marketId, stackId, surface: 'lesson', limit: 1 });
      if (found.length === 0 && dayNumber) {
        found = await fetchScenarios({ marketId, dayNumber, surface: 'lesson', limit: 1 });
      }

      if (cancelled) return;
      if (found.length === 0) {
        onDone();
        return;
      }
      setScenario(found[0]);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, marketId, stackId, dayNumber, onDone]);

  if (!visible || (!scenario && !loading)) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onDone}>
      <View style={[styles.sheet, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        {loading || !scenario ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.kicker}>Before you finish</Text>
            <Text style={styles.title}>Make the call</Text>
            <Text style={styles.sub}>
              One decision from today's lesson. There is no penalty — this only shapes what you
              review next.
            </Text>

            <View style={{ marginTop: 18 }}>
              <DecisionCard
                scenario={scenario}
                askConfidence
                lessonContext={lessonTitle}
                onResolved={(res) => {
                  setResolved(true);
                  trackEvent('consequence_viewed', { concept: res.conceptKey, correct: res.isCorrect });
                  onGraded?.(gradeFromAnswer(res.isCorrect, res.confidence), res.conceptKey);
                }}
              />
            </View>

            <TouchableOpacity style={styles.cta} onPress={onDone} activeOpacity={0.85}>
              <Text style={styles.ctaText}>{resolved ? 'Finish lesson' : 'Skip for now'}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 20 },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.accent,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginTop: 6 },
  sub: { fontSize: 15, lineHeight: 22, color: COLORS.textSecondary, marginTop: 8 },
  cta: {
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg1,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
});
