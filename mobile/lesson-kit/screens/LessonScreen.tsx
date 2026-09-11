import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { LessonHeader } from '../components/LessonHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { FeedbackFooter } from '../components/FeedbackFooter';
import { InfoCard } from '../exercises/InfoCard';
import { MultipleChoice } from '../exercises/MultipleChoice';
import { WordBank } from '../exercises/WordBank';
import { ExerciseState } from '../exercises/types';
import { LessonComplete } from './LessonComplete';
import { tokens } from '../theme/tokens';
import { Exercise, Lesson } from '../types';

export interface LessonScreenProps {
  lesson: Lesson;
  onExit: () => void;
  /** Fired when the learner finishes the lesson and taps the final CTA. */
  onFinish: (result: { correct: number; total: number; xp: number; timeSpentSeconds: number }) => void;
  xpPerCorrect?: number;
  /** Rendered above the action button (e.g. Note / Save buttons). */
  renderExtraActions?: (exerciseIndex: number) => React.ReactNode;
  doneLabel?: string;
}

export function LessonScreen({
  lesson,
  onExit,
  onFinish,
  xpPerCorrect = 10,
  renderExtraActions,
  doneLabel,
}: LessonScreenProps) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'answering' | 'feedback'>('answering');
  const [state, setState] = useState<ExerciseState>({ canCheck: false, isCorrect: false });
  const [correctCount, setCorrectCount] = useState(0);
  const [gradedCount, setGradedCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(Date.now());

  const exercise = lesson.exercises[index];
  const isInfo = exercise?.kind === 'info';
  const total = lesson.exercises.length;
  const progress = total > 0 ? (index + (phase === 'feedback' ? 1 : 0)) / total : 0;

  const handleChange = useCallback((next: ExerciseState) => setState(next), []);

  const goNext = useCallback(() => {
    if (index >= total - 1) {
      setFinished(true);
      return;
    }
    setIndex(i => i + 1);
    setPhase('answering');
    setState({ canCheck: false, isCorrect: false });
  }, [index, total]);

  const onAction = useCallback(() => {
    if (isInfo) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      goNext();
      return;
    }
    if (phase === 'answering') {
      if (!state.canCheck) return;
      Haptics.notificationAsync(
        state.isCorrect
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      ).catch(() => {});
      setGradedCount(c => c + 1);
      if (state.isCorrect) setCorrectCount(c => c + 1);
      setPhase('feedback');
      return;
    }
    goNext();
  }, [isInfo, phase, state, goNext]);

  const correctAnswerText = useMemo(() => {
    if (!exercise) return undefined;
    if (exercise.kind === 'multipleChoice') return exercise.options[exercise.correctIndex];
    if (exercise.kind === 'wordBank') return exercise.answer.join(' ');
    return undefined;
  }, [exercise]);

  if (finished || !exercise) {
    return (
      <LessonComplete
        correct={correctCount}
        total={gradedCount}
        xp={correctCount * xpPerCorrect}
        doneLabel={doneLabel}
        onDone={() =>
          onFinish({
            correct: correctCount,
            total: gradedCount,
            xp: correctCount * xpPerCorrect,
            timeSpentSeconds: Math.round((Date.now() - startedAt.current) / 1000),
          })
        }
      />
    );
  }

  const buttonVariant =
    phase === 'feedback'
      ? state.isCorrect
        ? 'correct'
        : 'incorrect'
      : isInfo || state.canCheck
      ? 'primary'
      : 'disabled';

  const buttonLabel = isInfo ? 'Continue' : phase === 'answering' ? 'Check' : 'Continue';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LessonHeader
        progress={progress}
        onExit={onExit}
        lives={lesson.lives}
        label={lesson.title}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {renderExercise(exercise, phase, handleChange)}
      </ScrollView>

      {phase === 'feedback' && !isInfo && (
        <FeedbackFooter
          isCorrect={state.isCorrect}
          explanation={'explanation' in exercise ? exercise.explanation : undefined}
          correctAnswer={state.isCorrect ? undefined : correctAnswerText}
        />
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + tokens.space.lg }]}>
        {renderExtraActions?.(index)}
        <PrimaryButton label={buttonLabel} onPress={onAction} variant={buttonVariant} />
      </View>
    </View>
  );
}

function renderExercise(
  exercise: Exercise,
  phase: 'answering' | 'feedback',
  onChange: (s: ExerciseState) => void,
) {
  switch (exercise.kind) {
    case 'info':
      return <InfoCard exercise={exercise} phase={phase} onChange={onChange} />;
    case 'multipleChoice':
      return <MultipleChoice exercise={exercise} phase={phase} onChange={onChange} />;
    case 'wordBank':
      return <WordBank exercise={exercise} phase={phase} onChange={onChange} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  scroll: { flex: 1 },
  content: {
    padding: tokens.space.lg,
    paddingBottom: tokens.space.xxl,
    gap: tokens.space.lg,
  },
  footer: {
    paddingHorizontal: tokens.space.lg,
    paddingTop: tokens.space.md,
    gap: tokens.space.md,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    backgroundColor: tokens.color.bg,
  },
});
