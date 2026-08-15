/**
 * DecisionCard — the Decision Engine loop in one component:
 * predict → decide → confidence → consequence → mechanism → coach.
 *
 * Correctness and mastery come back from the server RPC; nothing is graded here.
 */
import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../lib/constants';
import {
  Confidence,
  DecisionResult,
  DecisionScenario,
  submitDecision,
} from '../../lib/decisionEngine';
import { ConfidenceSelector } from './ConfidenceSelector';
import { LeoCoachChips } from '../ai/LeoCoachChips';

interface Props {
  scenario: DecisionScenario;
  askConfidence?: boolean;
  onResolved?: (result: DecisionResult) => void;
  lessonContext?: string;
}

export function DecisionCard({ scenario, askConfidence = true, onResolved, lessonContext }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(askConfidence ? null : 'fairly_sure');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const startedAt = useRef(Date.now());

  const canSubmit = selected !== null && (!askConfidence || confidence !== null) && !submitting && !result;

  const handleSubmit = useCallback(async () => {
    if (selected === null) return;
    setSubmitting(true);
    const res = await submitDecision({
      scenarioId: scenario.id,
      selectedOption: selected,
      confidence: confidence || 'fairly_sure',
      timeSpentSeconds: Math.round((Date.now() - startedAt.current) / 1000),
    });
    setSubmitting(false);
    if (!res) return;
    setResult(res);
    Haptics.notificationAsync(
      res.isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    );
    onResolved?.(res);
  }, [selected, confidence, scenario.id, onResolved]);

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Feather name="target" size={12} color={COLORS.accent} />
          <Text style={styles.badgeText}>Make the call</Text>
        </View>
        {!!scenario.era_tag && <Text style={styles.era}>{scenario.era_tag}</Text>}
      </View>

      {!!scenario.situation && <Text style={styles.situation}>{scenario.situation}</Text>}
      <Text style={styles.prompt}>{scenario.prompt}</Text>

      {scenario.options.map((opt, i) => {
        const isSelected = selected === i;
        const isAnswer = result && i === result.correctIndex;
        const isWrongPick = result && isSelected && !result.isCorrect;
        return (
          <TouchableOpacity
            key={i}
            activeOpacity={0.85}
            disabled={!!result || submitting}
            onPress={() => {
              Haptics.selectionAsync();
              setSelected(i);
            }}
            style={[
              styles.option,
              isSelected && styles.optionSelected,
              isAnswer && styles.optionCorrect,
              isWrongPick && styles.optionWrong,
            ]}
          >
            <Text style={[styles.optionText, (isAnswer || isWrongPick) && { fontWeight: '700' }]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}

      {askConfidence && !result && (
        <ConfidenceSelector value={confidence} onChange={setConfidence} disabled={selected === null} />
      )}

      {!result && (
        <TouchableOpacity
          style={[styles.submit, !canSubmit && { opacity: 0.45 }]}
          disabled={!canSubmit}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Lock in decision</Text>
          )}
        </TouchableOpacity>
      )}

      {result && (
        <View style={styles.reveal}>
          <Text style={[styles.verdict, { color: result.isCorrect ? COLORS.success : COLORS.error }]}>
            {result.isCorrect
              ? 'Right call'
              : result.confidence === 'certain'
                ? 'Confidently wrong — worth a second look'
                : 'Not quite'}
          </Text>
          <Text style={styles.sectionLabel}>What happened</Text>
          <Text style={styles.body}>{result.consequence}</Text>
          <Text style={styles.sectionLabel}>Why it works that way</Text>
          <Text style={styles.body}>{result.mechanism}</Text>

          <LeoCoachChips
            context={{
              lessonContext: lessonContext || scenario.prompt,
              question: scenario.prompt,
              chosenAnswer: selected !== null ? scenario.options[selected] : '',
              correctAnswer: scenario.options[result.correctIndex] || '',
              misconception: result.misconception,
              conceptKey: result.conceptKey,
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: COLORS.accent },
  era: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  situation: { fontSize: 15, lineHeight: 22, color: COLORS.textSecondary, marginTop: 14 },
  prompt: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 14,
  },
  option: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg1,
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
  },
  optionSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },
  optionCorrect: { borderColor: COLORS.success, backgroundColor: COLORS.successSoft },
  optionWrong: { borderColor: COLORS.error, backgroundColor: COLORS.errorSoft },
  optionText: { fontSize: 16, lineHeight: 22, color: COLORS.textPrimary },
  submit: {
    marginTop: 16,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  reveal: { marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: 16 },
  verdict: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.textMuted,
    marginTop: 10,
    marginBottom: 4,
  },
  body: { fontSize: 16, lineHeight: 23, color: COLORS.textPrimary },
});
