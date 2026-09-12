/**
 * Streak Rescue Round — the comeback moment.
 *
 * When a streak is about to die, the learner gets one fast round of three
 * fact-checked statements from their own market. Two right saves the streak
 * (a freeze is spent and the streak clock extended). It is a rescue, not a
 * giveaway: getting it wrong means the streak goes.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useSelectedMarket } from '../hooks/useSelectedMarket';
import { useStreakFreeze } from '../hooks/useStreakFreeze';
import { useUserProgress } from '../hooks/useUserProgress';
import { triggerCelebration, triggerHaptic } from '../lib/haptics';
import { playSound } from '../lib/sounds';
import { log } from '../lib/logger';

interface RescueQuestion {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
}

const NEEDED_CORRECT = 2;

export default function StreakRescueScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { marketId } = useSelectedMarket();
  const { progress, refetch: refetchProgress } = useUserProgress(marketId || undefined);
  const { canFreeze, useFreeze, freezesUsedThisWeek, maxFreezes } = useStreakFreeze(marketId || undefined);

  const [questions, setQuestions] = useState<RescueQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answer, setAnswer] = useState<null | boolean>(null);
  const [outcome, setOutcome] = useState<null | 'saved' | 'lost'>(null);
  const [saving, setSaving] = useState(false);

  const heart = useRef(new Animated.Value(1)).current;
  const streak = progress?.current_streak ?? 0;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(heart, { toValue: 1.15, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(heart, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!marketId) return;
      const { data } = await supabase
        .from('drill_questions')
        .select('id, statement, is_true, explanation')
        .eq('market_id', marketId)
        .limit(40);

      if (cancelled) return;
      const rows = (data ?? []).filter((r) => r.statement && r.explanation);
      const shuffled = [...rows].sort(() => Math.random() - 0.5).slice(0, 3);
      setQuestions(
        shuffled.map((r) => ({
          id: r.id as string,
          statement: r.statement as string,
          isTrue: !!r.is_true,
          explanation: r.explanation as string,
        })),
      );
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [marketId]);

  const finish = useCallback(async (finalCorrect: number) => {
    setSaving(true);
    if (finalCorrect >= NEEDED_CORRECT) {
      let saved = false;
      if (canFreeze) {
        saved = await useFreeze();
      }
      if (!saved && user && marketId) {
        // No freeze left: still extend the clock so the round is never a dead end.
        const { error } = await supabase
          .from('user_progress')
          .update({ streak_expires_at: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString() })
          .eq('user_id', user.id)
          .eq('market_id', marketId);
        if (error) log.warn('Rescue clock extension failed', error);
      }
      await refetchProgress();
      triggerCelebration();
      playSound('streakMilestone');
      setOutcome('saved');
    } else {
      triggerHaptic('heavy');
      playSound('wrong');
      setOutcome('lost');
    }
    setSaving(false);
  }, [canFreeze, useFreeze, user, marketId, refetchProgress]);

  const onAnswer = (value: boolean) => {
    if (answer !== null) return;
    const q = questions[index];
    const right = value === q.isTrue;
    setAnswer(value);
    if (right) {
      setCorrect((c) => c + 1);
      triggerHaptic('light');
      playSound('correct');
    } else {
      triggerHaptic('medium');
      playSound('wrong');
    }
  };

  const onNext = () => {
    const q = questions[index];
    const wasRight = answer === q.isTrue;
    const runningCorrect = correct;
    if (index + 1 >= questions.length) {
      finish(runningCorrect);
    } else {
      setIndex((i) => i + 1);
      setAnswer(null);
    }
    if (!wasRight) triggerHaptic('light');
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={COLORS.streak} />
      </View>
    );
  }

  if (!questions.length) {
    return (
      <View style={[styles.screen, styles.center, { padding: 24 }]}>
        <Text style={styles.title}>No rescue round available yet</Text>
        <Text style={styles.body}>Do today's lesson instead — that always keeps the streak alive.</Text>
        <TouchableOpacity style={styles.primary} onPress={() => router.back()}>
          <Text style={styles.primaryText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (outcome) {
    const saved = outcome === 'saved';
    return (
      <View style={[styles.screen, styles.center, { padding: 24 }]}>
        <Animated.View style={{ transform: [{ scale: heart }] }}>
          <Feather name={saved ? 'shield' : 'alert-triangle'} size={64} color={saved ? COLORS.success : COLORS.error} />
        </Animated.View>
        <Text style={styles.title}>{saved ? 'Streak rescued' : 'Streak lost'}</Text>
        <Text style={styles.body}>
          {saved
            ? `You got ${correct} of ${questions.length} right. Your ${streak}-day streak is safe — now bank today's lesson so it never comes to this.`
            : `Only ${correct} of ${questions.length} right this time. Start a fresh streak today: day one is always the easiest one to win.`}
        </Text>
        <TouchableOpacity style={[styles.primary, saved && { backgroundColor: COLORS.success }]} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.primaryText}>{saved ? 'Go do today\'s lesson' : 'Start again today'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const q = questions[index];
  const answered = answer !== null;
  const wasRight = answered && answer === q.isTrue;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Feather name="x" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }]} />
        </View>
        <View style={styles.streakChip}>
          <Feather name="zap" size={12} color={COLORS.streak} />
          <Text style={styles.streakChipText}>{streak}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <Text style={styles.eyebrow}>RESCUE ROUND · {NEEDED_CORRECT} OF {questions.length} TO SAVE IT</Text>
        <Text style={styles.title}>True or false?</Text>
        <View style={styles.statementCard}>
          <Text style={styles.statement}>{q.statement}</Text>
        </View>

        <View style={styles.answerRow}>
          {[true, false].map((value) => {
            const selected = answer === value;
            const isCorrectChoice = answered && value === q.isTrue;
            return (
              <TouchableOpacity
                key={String(value)}
                style={[
                  styles.answerBtn,
                  selected && { borderColor: wasRight ? COLORS.success : COLORS.error },
                  isCorrectChoice && { backgroundColor: COLORS.successSoft, borderColor: COLORS.success },
                ]}
                onPress={() => onAnswer(value)}
                activeOpacity={0.85}
                disabled={answered}
              >
                <Feather name={value ? 'check' : 'x'} size={18} color={value ? COLORS.success : COLORS.error} />
                <Text style={styles.answerText}>{value ? 'True' : 'False'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {answered && (
          <View style={[styles.feedback, { backgroundColor: wasRight ? COLORS.successSoft : COLORS.errorSoft }]}>
            <Text style={[styles.feedbackTitle, { color: wasRight ? COLORS.success : COLORS.error }]}>
              {wasRight ? 'Correct' : 'Not quite'}
            </Text>
            <Text style={styles.feedbackBody}>{q.explanation}</Text>
          </View>
        )}

        <Text style={styles.footnote}>
          Freezes used this week: {freezesUsedThisWeek}/{maxFreezes}
        </Text>
      </ScrollView>

      {answered && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.primary} onPress={onNext} disabled={saving} activeOpacity={0.9}>
            <Text style={styles.primaryText}>
              {saving ? 'Saving…' : index + 1 >= questions.length ? 'See the result' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg0 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  progressTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: COLORS.bg1, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.streak },
  streakChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.orangeSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  streakChipText: { fontSize: 12, fontWeight: '800', color: COLORS.streak },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1, color: COLORS.streak, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14, textAlign: 'center' },
  body: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21, paddingHorizontal: 8 },
  statementCard: { backgroundColor: COLORS.bg2, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 18, marginBottom: 18, ...SHADOWS.sm },
  statement: { fontSize: 16, lineHeight: 24, color: COLORS.textPrimary, fontWeight: '600' },
  answerRow: { flexDirection: 'row', gap: 12 },
  answerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.bg2 },
  answerText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  feedback: { borderRadius: 16, padding: 16, marginTop: 18 },
  feedbackTitle: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  feedbackBody: { fontSize: 13, lineHeight: 20, color: COLORS.textSecondary },
  footnote: { fontSize: 11, color: COLORS.textMuted, marginTop: 18, textAlign: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: COLORS.bg0, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  primary: { backgroundColor: COLORS.streak, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8, paddingHorizontal: 28 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
