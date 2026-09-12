import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { LessonHeader } from '../components/LessonHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { FeedbackFooter } from '../components/FeedbackFooter';
import { InfoCard } from '../exercises/InfoCard';
import { MultipleChoice } from '../exercises/MultipleChoice';
import { WordBank } from '../exercises/WordBank';
import { ColdOpen } from '../modules/ColdOpen';
import { MicroInsight } from '../modules/MicroInsight';
import { SortSignal } from '../modules/SortSignal';
import { BuildChain } from '../modules/BuildChain';
import { FaceOff } from '../modules/FaceOff';
import { SpeedRound } from '../modules/SpeedRound';
import { NumberSense } from '../modules/NumberSense';
import { SpotTheFake } from '../modules/SpotTheFake';
import { MapMarket } from '../modules/MapMarket';
import { ChartRead } from '../modules/ChartRead';
import { TheCall } from '../modules/TheCall';
import { ExerciseState } from '../exercises/types';
import { LeoCoach, LeoMood } from '../components/LeoCoach';

import { LessonComplete } from './LessonComplete';
import { tokens } from '../theme/tokens';
import { Exercise, Lesson } from '../types';
import { playSound } from '../../lib/sounds';
import { getMarketWorld } from '../../data/marketWorlds';

const MAX_HEARTS = 3;

/** Beats that need no answer — the button just says Continue. */
const PASSIVE_KINDS = ['info', 'coldOpen', 'microInsight'] as const;
const isPassiveKind = (kind?: string) => PASSIVE_KINDS.includes(kind as (typeof PASSIVE_KINDS)[number]);

export interface LessonScreenProps {
  lesson: Lesson;
  onExit: () => void;
  /** Fired when the learner finishes the lesson and taps the final CTA. */
  onFinish: (result: { correct: number; total: number; xp: number; timeSpentSeconds: number }) => void;
  xpPerCorrect?: number;
  /** Rendered above the action button (e.g. Note / Save buttons). */
  renderExtraActions?: (exerciseIndex: number) => React.ReactNode;
  doneLabel?: string;
  /** Current daily streak, shown on the finish screen. */
  streakDays?: number;
  /** Skip the leave-confirmation prompt (e.g. review mode). */
  confirmExit?: boolean;
  marketId?: string;
}

export function LessonScreen({
  lesson,
  onExit,
  onFinish,
  xpPerCorrect = 10,
  renderExtraActions,
  doneLabel,
  streakDays,
  confirmExit = true,
  marketId,
}: LessonScreenProps) {
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState<Exercise[]>(lesson.exercises);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'answering' | 'feedback'>('answering');
  const [state, setState] = useState<ExerciseState>({ canCheck: false, isCorrect: false });
  const [correctCount, setCorrectCount] = useState(0);
  const [gradedCount, setGradedCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [missed, setMissed] = useState<Exercise[]>([]);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [showHeartsPrompt, setShowHeartsPrompt] = useState(false);
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(Date.now());
  const world = getMarketWorld(marketId);

  // XP pop animation
  const [pop, setPop] = useState<string | null>(null);
  const popAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setQueue(lesson.exercises);
  }, [lesson]);

  const exercise = queue[index];
  const isInfo = isPassiveKind(exercise?.kind);
  const total = queue.length;
  const hasGraded = useMemo(() => queue.some(e => !isPassiveKind(e.kind)), [queue]);
  const progress = total > 0 ? (index + (phase === 'feedback' ? 1 : 0)) / total : 0;

  const handleChange = useCallback((next: ExerciseState) => setState(next), []);

  const firePop = useCallback((label: string) => {
    setPop(label);
    popAnim.setValue(0);
    Animated.timing(popAnim, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setPop(null));
  }, [popAnim]);

  const goNext = useCallback(() => {
    if (index >= total - 1) {
      playSound('lessonComplete').catch(() => {});
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
      setGradedCount(c => c + 1);
      if (state.isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        playSound('correct').catch(() => {});
        setCorrectCount(c => c + 1);
        setCombo(c => {
          const next = c + 1;
          setBestCombo(b => Math.max(b, next));
          return next;
        });
        firePop(`+${xpPerCorrect} XP`);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        playSound('wrong').catch(() => {});
        setCombo(0);
        setMissed(m => (exercise ? [...m, exercise] : m));
        setHearts(h => {
          const next = Math.max(0, h - 1);
          if (next === 0) setShowHeartsPrompt(true);
          return next;
        });
      }
      setPhase('feedback');
      return;
    }
    goNext();
  }, [isInfo, phase, state, goNext, exercise, xpPerCorrect, firePop]);

  const retryMissed = useCallback(() => {
    setShowHeartsPrompt(false);
    setHearts(MAX_HEARTS);
    if (!missed.length) return;
    const retryItems = missed.map((e, i) => ({ ...e, id: `${e.id}-retry${i}` } as Exercise));
    setMissed([]);
    setQueue(q => {
      const next = [...q];
      next.splice(index + 1, 0, ...retryItems);
      return next;
    });
  }, [missed, index]);

  const handleExitPress = useCallback(() => {
    if (!confirmExit || finished) {
      onExit();
      return;
    }
    setShowExitPrompt(true);
  }, [confirmExit, finished, onExit]);

  /** Leo coaches the beat, then reacts to the answer. */
  const leoCoach = useMemo(() => {
    if (phase === 'feedback' && !isInfo) {
      const pool = state.isCorrect ? lesson.leoReactions?.win : lesson.leoReactions?.miss;
      if (pool?.length) {
        const line = pool[index % pool.length];
        return { line, mood: (state.isCorrect ? 'correct' : 'incorrect') as LeoMood };
      }
      return null;
    }
    const line = exercise?.leo?.line;
    if (!line) return null;
    return { line, mood: (exercise?.leo?.mood ?? 'idle') as LeoMood };
  }, [phase, isInfo, state.isCorrect, lesson.leoReactions, index, exercise]);

  const correctAnswerText = useMemo(() => {

    if (!exercise) return undefined;
    if (exercise.kind === 'multipleChoice') return exercise.options[exercise.correctIndex];
    if (exercise.kind === 'wordBank') return exercise.answer.join(' ');
    if (exercise.kind === 'theCall') return exercise.options[exercise.correctIndex];
    if (exercise.kind === 'faceOff')
      return exercise.correctIndex === 0 ? exercise.left.name : exercise.right.name;
    if (exercise.kind === 'spotFake') return exercise.statements[exercise.fakeIndex];
    if (exercise.kind === 'mapMarket') return exercise.nodes[exercise.correctIndex]?.label;
    return undefined;
  }, [exercise]);

  if (finished || !exercise) {
    const timeSpentSeconds = Math.round((Date.now() - startedAt.current) / 1000);
    return (
      <LessonComplete
        correct={correctCount}
        total={gradedCount}
        baseXp={correctCount * xpPerCorrect}
        bestCombo={bestCombo}
        heartsLeft={hearts}
        timeSpentSeconds={timeSpentSeconds}
        streakDays={streakDays}
        doneLabel={doneLabel}
        onDone={xp =>
          onFinish({
            correct: correctCount,
            total: gradedCount,
            xp,
            timeSpentSeconds,
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
        onExit={handleExitPress}
        lives={hasGraded ? hearts : undefined}
        label={`${world.worldName} · ${lesson.title}`}
        accentColor={world.colors[0]}
      />

      {combo >= 2 && (
        <View style={styles.comboRow}>
          <Text style={styles.comboText}>{combo} in a row</Text>
        </View>
      )}

      {!!pop && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pop,
            {
              opacity: popAnim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
              transform: [
                { translateY: popAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -46] }) },
              ],
            },
          ]}
        >
          <Text style={styles.popText}>{pop}</Text>
        </Animated.View>
      )}

      <View style={[styles.worldRail, { backgroundColor: world.colors[0] }]} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {!!leoCoach && <LeoCoach line={leoCoach.line} mood={leoCoach.mood} />}
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

      {/* Leave confirmation — loss aversion */}
      <Modal visible={showExitPrompt} transparent animationType="fade" onRequestClose={() => setShowExitPrompt(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Leave now?</Text>
            <Text style={styles.sheetBody}>
              You'll lose your progress in this lesson{typeof streakDays === 'number' && streakDays > 0
                ? ` and put your ${streakDays}-day streak at risk`
                : ''}.
            </Text>
            <PrimaryButton label="Keep learning" onPress={() => setShowExitPrompt(false)} />
            <TouchableOpacity onPress={() => { setShowExitPrompt(false); onExit(); }} style={styles.ghost}>
              <Text style={styles.ghostText}>Leave anyway</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Out of hearts — offer a retry instead of ending the lesson */}
      <Modal visible={showHeartsPrompt} transparent animationType="fade" onRequestClose={() => setShowHeartsPrompt(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Out of hearts</Text>
            <Text style={styles.sheetBody}>
              No problem — nothing is locked. Redo the questions you missed to lock the ideas in.
            </Text>
            <PrimaryButton label="Retry what I missed" onPress={retryMissed} />
            <TouchableOpacity
              onPress={() => { setShowHeartsPrompt(false); setHearts(MAX_HEARTS); }}
              style={styles.ghost}
            >
              <Text style={styles.ghostText}>Keep going</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    case 'coldOpen':
      return <ColdOpen exercise={exercise} phase={phase} onChange={onChange} />;
    case 'microInsight':
      return <MicroInsight exercise={exercise} phase={phase} onChange={onChange} />;
    case 'sortSignal':
      return <SortSignal exercise={exercise} phase={phase} onChange={onChange} />;
    case 'buildChain':
      return <BuildChain exercise={exercise} phase={phase} onChange={onChange} />;
    case 'faceOff':
      return <FaceOff exercise={exercise} phase={phase} onChange={onChange} />;
    case 'speedRound':
      return <SpeedRound exercise={exercise} phase={phase} onChange={onChange} />;
    case 'numberSense':
      return <NumberSense exercise={exercise} phase={phase} onChange={onChange} />;
    case 'spotFake':
      return <SpotTheFake exercise={exercise} phase={phase} onChange={onChange} />;
    case 'mapMarket':
      return <MapMarket exercise={exercise} phase={phase} onChange={onChange} />;
    case 'chartRead':
      return <ChartRead exercise={exercise} phase={phase} onChange={onChange} />;
    case 'theCall':
      return <TheCall exercise={exercise} phase={phase} onChange={onChange} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  worldRail: { height: 3, marginHorizontal: tokens.space.lg, borderRadius: 2 },
  scroll: { flex: 1 },
  content: {
    padding: tokens.space.lg,
    paddingBottom: tokens.space.xxl,
    gap: tokens.space.lg,
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  comboRow: { alignItems: 'center', paddingBottom: tokens.space.sm },
  comboText: {
    fontSize: tokens.font.caption,
    fontWeight: '800',
    color: tokens.color.accent,
    backgroundColor: tokens.color.accentSoft,
    paddingHorizontal: tokens.space.md,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    overflow: 'hidden',
  },
  pop: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    zIndex: 30,
  },
  popText: {
    fontSize: tokens.font.body,
    fontWeight: '900',
    color: tokens.color.correctDark,
  },
  footer: {
    paddingHorizontal: tokens.space.lg,
    paddingTop: tokens.space.md,
    gap: tokens.space.md,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    backgroundColor: tokens.color.bg,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,17,26,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: tokens.color.card,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    padding: tokens.space.xl,
    paddingBottom: tokens.space.xxl,
    gap: tokens.space.md,
  },
  sheetTitle: { fontSize: tokens.font.prompt, fontWeight: '800', color: tokens.color.text },
  sheetBody: { fontSize: tokens.font.body, lineHeight: 24, color: tokens.color.textSecondary },
  ghost: { alignItems: 'center', paddingVertical: tokens.space.md },
  ghostText: { fontSize: tokens.font.body, fontWeight: '700', color: tokens.color.textMuted },
});
