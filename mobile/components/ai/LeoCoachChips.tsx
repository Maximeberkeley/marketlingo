/**
 * LeoCoachChips — contextual Leo after a mistake or a decision reveal.
 * Structured actions instead of a blank chat box: bounded prompts, lower cost,
 * lower hallucination risk. Leo explains; it never grades or writes mastery.
 */
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { trackEvent } from '../../lib/analytics';
import { useAIConsent } from '../../hooks/useAIConsent';
import { isFeatureEnabled } from '../../hooks/useFeatureFlags';
import { AIConsentModal } from './AIConsentModal';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export interface CoachContext {
  lessonContext: string;
  question: string;
  chosenAnswer: string;
  correctAnswer: string;
  misconception?: string | null;
  conceptKey?: string;
  learnerLevel?: string;
}

type ActionId = 'why' | 'simpler' | 'consequence' | 'example' | 'challenge';

const ACTIONS: { id: ActionId; label: string; icon: keyof typeof Feather.glyphMap; instruction: string }[] = [
  { id: 'why', label: 'Why?', icon: 'help-circle', instruction: 'Explain in 3 sentences why the chosen answer is wrong and the correct one is right.' },
  { id: 'simpler', label: 'Explain more simply', icon: 'feather', instruction: 'Re-explain the idea at a 9th-grade reading level, with no jargon.' },
  { id: 'consequence', label: 'Show the market consequence', icon: 'trending-up', instruction: 'Describe what happens in the real market when someone makes this mistake.' },
  { id: 'example', label: 'Give me another example', icon: 'layers', instruction: 'Give one short, concrete example of the same idea in a different situation.' },
  { id: 'challenge', label: 'Challenge me again', icon: 'zap', instruction: 'Ask one new question that tests the same idea. Do not reveal the answer.' },
];

export function LeoCoachChips({ context }: { context: CoachContext }) {
  const [loadingAction, setLoadingAction] = useState<ActionId | null>(null);
  const [response, setResponse] = useState<{ label: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { requireAI, modalProps } = useAIConsent();

  const run = useCallback(
    async (action: (typeof ACTIONS)[number]) => {
      Haptics.selectionAsync();
      setError(null);

      if (!(await isFeatureEnabled('ai_leo'))) {
        setError('Leo is temporarily unavailable. The lesson explanation above still covers this.');
        return;
      }
      if (!(await requireAI())) return;

      setLoadingAction(action.id);
      trackEvent('explanation_requested', { action: action.id, concept: context.conceptKey || null });

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const prompt = [
          action.instruction,
          `Lesson context: ${context.lessonContext}`,
          `Question: ${context.question}`,
          `Learner chose: ${context.chosenAnswer}`,
          `Correct answer: ${context.correctAnswer}`,
          context.misconception ? `Likely misconception: ${context.misconception}` : '',
          context.learnerLevel ? `Learner level: ${context.learnerLevel}` : '',
          'Keep it under 90 words. Professional, plain language. No emojis.',
        ]
          .filter(Boolean)
          .join('\n');

        const res = await fetch(`${SUPABASE_URL}/functions/v1/leo-voice-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
            apikey: SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            lessonContext: context.lessonContext,
          }),
        });

        if (res.status === 429) throw new Error('Leo is busy right now. Try again in a moment.');
        if (res.status === 402) throw new Error('AI coaching is unavailable right now.');
        if (!res.ok) throw new Error('Leo could not respond. Try again.');

        const data = await res.json();
        setResponse({ label: action.label, text: data.message || 'No answer came back. Try again.' });
      } catch (e: any) {
        trackEvent('ai_failure', { action: action.id });
        setError(e?.message || 'Leo could not respond. Try again.');
      } finally {
        setLoadingAction(null);
      }
    },
    [context, requireAI],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Ask Leo</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {ACTIONS.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[styles.chip, loadingAction === a.id && styles.chipActive]}
            onPress={() => run(a)}
            disabled={loadingAction !== null}
            activeOpacity={0.85}
          >
            {loadingAction === a.id ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Feather name={a.icon} size={13} color={COLORS.accent} />
            )}
            <Text style={styles.chipText}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {!!response && (
        <View style={styles.answer}>
          <Text style={styles.answerLabel}>{response.label}</Text>
          <Text style={styles.answerText}>{response.text}</Text>
          <Text style={styles.disclosure}>Generated by AI. Check anything you rely on.</Text>
        </View>
      )}

      <AIConsentModal {...modalProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 18 },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg1,
  },
  chipActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  error: { marginTop: 10, fontSize: 14, color: COLORS.error, lineHeight: 20 },
  answer: {
    marginTop: 12,
    backgroundColor: COLORS.bg1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  answerLabel: { fontSize: 13, fontWeight: '700', color: COLORS.accent, marginBottom: 6 },
  answerText: { fontSize: 16, lineHeight: 23, color: COLORS.textPrimary },
  disclosure: { marginTop: 10, fontSize: 12, color: COLORS.textMuted },
});
