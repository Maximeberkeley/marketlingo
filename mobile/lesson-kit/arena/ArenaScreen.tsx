import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { tokens } from '../theme/tokens';
import { PrimaryButton } from '../components/PrimaryButton';
import { FeedbackFooter } from '../components/FeedbackFooter';
import { RevealCorrectProvider, useRevealCorrect } from '../components/RevealCorrect';
import { feedbackCopy } from '../components/feedbackCopy';
import { LeoCoach } from '../components/LeoCoach';
import { leoArenaLine } from '../../components/mascot/leoAnimationRules';
import { renderExerciseByKind, isPassiveKind } from '../components/ExerciseRenderer';
import { ExerciseState } from '../exercises/types';
import { Exercise } from '../types';
import { ArenaWave, arenaXp, beatSeconds, rankForAccuracy, RECOVERY_XP, secondChanceWave } from './buildArena';
import { reviewAnswer, reviewQuestion } from './arenaReview';
import { playSound } from '../../lib/sounds';
import { trackEvent } from '../../lib/analytics';
import { getMarketWorld } from '../../data/marketWorlds';
import { practiceSourceLabel } from '../practice/studiedMaterial';

/** What Leo says while a game is on screen, when the question brings no line of its own. */
const ARENA_IDLE_LINES: Partial<Record<Exercise['kind'], string>> = {
  quickFire: 'Quick calls. You read all of these.',
  matchPairs: 'Start with the one you are sure of.',
  multipleChoice: 'Pick the one you could explain.',
  numberSense: 'Roughly the right size is enough.',
  sortSignal: 'Sort the easy ones first.',
  buildChain: 'What has to happen first?',
  spotFake: 'One of these is wrong. Which?',
  faceOff: 'Two options. Trust your read.',
  theCall: 'Think like you own the decision.',
};

/** The second chance is the only wave with this key. */
const AGAIN_KEY = 'again';

export interface ArenaResult {
  score: number;
  correct: number;
  total: number;
  bestCombo: number;
  waveReached: number;
  survived: boolean;
  xp: number;
  /** Misses put right in the second chance. */
  recovered: number;
}

interface Props {
  waves: ArenaWave[];
  marketId?: string;
  marketName: string;
  bestScore: number;
  onExit: () => void;
  onFinish: (result: ArenaResult) => void;
  onQuestionSeen?: (exercise: Exercise) => void;
  /** A second run the same day still plays in full, but pays reduced XP. */
  replay?: boolean;
}

type Mark = 'right' | 'wrong' | undefined;

/**
 * Daily Arena: three rounds of different games on the learner's own lessons,
 * then a second chance at the questions they missed. Speed and a run of right
 * answers raise the score; a miss only resets the run, so every run reaches the
 * end and full credit comes from getting the questions right the first time.
 */
export function ArenaScreen({ waves, marketId, marketName, bestScore, onExit, onFinish, onQuestionSeen, replay = false }: Props) {
  useEffect(() => { trackEvent('quiz_started', { marketId: marketId ?? null }); }, []);
  const insets = useSafeAreaInsets();
  const world = getMarketWorld(marketId);

  // The second chance joins the run only once the main rounds are over.
  const [again, setAgain] = useState<ArenaWave | null>(null);
  const runWaves = useMemo(() => (again ? [...waves, again] : waves), [waves, again]);
  const [waveIndex, setWaveIndex] = useState(0);
  const [beatIndex, setBeatIndex] = useState(0);
  const [showWaveIntro, setShowWaveIntro] = useState(true);
  const [phase, setPhase] = useState<'answering' | 'feedback'>('answering');
  const [state, setState] = useState<ExerciseState>({ canCheck: false, isCorrect: false });
  // Presentation uses the actual grade, not a selected answer left behind at timeout.
  const [coachCorrect, setCoachCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [graded, setGraded] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastGain, setLastGain] = useState<number | null>(null);
  const [ended, setEnded] = useState<{ survived: boolean } | null>(null);
  const [showExit, setShowExit] = useState(false);
  const [banking, setBanking] = useState(false);
  // One mark per question of the main rounds, and per question of the second chance.
  const [marks, setMarks] = useState<Mark[]>([]);
  const [againMarks, setAgainMarks] = useState<Mark[]>([]);
  const missed = useRef<Exercise[]>([]);
  const [recoveredIds, setRecoveredIds] = useState<string[]>([]);

  const wave = runWaves[waveIndex];
  const exercise: Exercise | undefined = wave?.exercises[beatIndex];
  const passive = isPassiveKind(exercise?.kind);
  const inAgain = wave?.key === AGAIN_KEY;
  // Where this question sits in the main run, for the progress strip.
  const mainTotal = waves.reduce((n, w) => n + w.exercises.length, 0);
  const mainPosition = inAgain ? mainTotal : waves.slice(0, waveIndex).reduce((n, w) => n + w.exercises.length, 0) + beatIndex;
  useEffect(() => {
    if (exercise && !showWaveIntro && !ended && !passive) onQuestionSeen?.(exercise);
  }, [exercise, showWaveIntro, ended, passive, onQuestionSeen]);

  const timerAnim = useRef(new Animated.Value(1)).current;
  const gainAnim = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(1)).current;
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const revealCorrect = useRevealCorrect(scrollRef);

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => clearTick, [clearTick]);

  const popGain = useCallback(
    (amount: number) => {
      setLastGain(amount);
      gainAnim.setValue(0);
      Animated.timing(gainAnim, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => setLastGain(null));
      Animated.sequence([
        Animated.spring(scoreScale, { toValue: 1.18, useNativeDriver: true, tension: 180, friction: 6 }),
        Animated.spring(scoreScale, { toValue: 1, useNativeDriver: true, tension: 180, friction: 8 }),
      ]).start();
    },
    [gainAnim, scoreScale],
  );

  const endRun = useCallback(
    (survived: boolean) => {
      clearTick();
      playSound(survived ? 'lessonComplete' : 'wrong').catch(() => {});
      setEnded({ survived });
    },
    [clearTick],
  );

  const grade = useCallback(
    (isCorrect: boolean, secondsRemaining: number, outOfTime = false) => {
      clearTick();
      setTimedOut(outOfTime);
      setCoachCorrect(isCorrect);
      if (exercise && inAgain) {
        // The second chance never changes the first-time tally; it records what was put right.
        setAgainMarks(m => { const next = [...m]; next[beatIndex] = isCorrect ? 'right' : 'wrong'; return next; });
        if (isCorrect) setRecoveredIds(ids => [...ids, exercise.id.replace(/-again$/, '')]);
      } else if (exercise) {
        setGraded(g => g + 1);
        setMarks(m => { const next = [...m]; next[mainPosition] = isCorrect ? 'right' : 'wrong'; return next; });
        if (!isCorrect) missed.current = [...missed.current, exercise];
      }
      if (isCorrect) {
        const speedBonus = Math.round((secondsRemaining / Math.max(1, beatSecondsFor(wave, exercise))) * 40);
        const comboBonus = Math.round(combo * 15);
        const gain = Math.round((60 + speedBonus + comboBonus) * wave.multiplier);
        setScore(s => s + gain);
        if (!inAgain) setCorrect(c => c + 1);
        setCombo(c => {
          const next = c + 1;
          setBestCombo(b => Math.max(b, next));
          return next;
        });
        popGain(gain);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        playSound('correct').catch(() => {});
        setPhase('feedback');
        return;
      }

      // A miss resets the combo and nothing else: the run always reaches the end.
      setCombo(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      playSound('wrong').catch(() => {});
      setPhase('feedback');
    },
    [clearTick, combo, popGain, wave, exercise, inAgain, beatIndex, mainPosition],
  );

  // Countdown for the current beat
  useEffect(() => {
    if (!wave || !exercise || showWaveIntro || phase === 'feedback' || ended) return;
    if (passive) return;

    setTimeLeft(beatSecondsFor(wave, exercise));
    timerAnim.setValue(1);
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: beatSecondsFor(wave, exercise) * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    clearTick();
    tickRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearTick();
          grade(false, 0, true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return clearTick;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveIndex, beatIndex, showWaveIntro, phase, ended, passive]);

  const nextQuestion = useCallback(() => {
    setPhase('answering');
    setTimedOut(false);
    setState({ canCheck: false, isCorrect: false });
  }, []);

  const advance = useCallback(() => {
    if (!wave) return;
    if (beatIndex < wave.exercises.length - 1) {
      setBeatIndex(i => i + 1);
      nextQuestion();
      return;
    }
    if (waveIndex < runWaves.length - 1) {
      setWaveIndex(i => i + 1);
      setBeatIndex(0);
      nextQuestion();
      setShowWaveIntro(true);
      return;
    }
    // After the last round, the misses come back once before the summary.
    const retry = again ? null : secondChanceWave(missed.current);
    if (retry) {
      setAgain(retry);
      setWaveIndex(i => i + 1);
      setBeatIndex(0);
      nextQuestion();
      setShowWaveIntro(true);
      return;
    }
    endRun(true);
  }, [beatIndex, endRun, wave, waveIndex, runWaves.length, again, nextQuestion]);

  const onAction = useCallback(() => {
    if (passive) {
      advance();
      return;
    }
    if (phase === 'answering') {
      if (!state.canCheck) return;
      grade(state.isCorrect, timeLeft);
      return;
    }
    advance();
  }, [advance, grade, passive, phase, state, timeLeft]);

  /** One shared rule for what the footer says, so the right answer is never printed twice. */
  const feedback = exercise ? feedbackCopy(exercise, state.isCorrect, state.selectedIndex) : null;

  // ── Run summary ───────────────────────────────────────────────
  if (ended) {
    const rank = rankForAccuracy(correct, graded);
    const recovered = recoveredIds.length;
    const xp = arenaXp(correct, graded, replay, recovered);
    // The first run ever has no best to beat.
    const newBest = bestScore > 0 && score > bestScore;
    const perfect = graded > 0 && correct === graded;
    const stillMissed = missed.current.filter(e => !recoveredIds.includes(e.id));
    const putRight = missed.current.filter(e => recoveredIds.includes(e.id));
    const leoLine = graded === 0
      ? 'Nothing graded this time. Try again soon.'
      : perfect
        ? `All ${graded} right first time. Full credit.`
        : !stillMissed.length
          ? 'Every miss put right. Nicely done.'
          : correct / graded >= 0.7
            ? 'Strong run. Skim the misses below.'
            : 'Read the misses below once more.';
    return (
      <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 12 }]}>
        <ScrollView contentContainerStyle={styles.summaryScroll} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[world.colors[0] ?? rank.color, world.colors[1] ?? rank.color]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryHero}
          >
            <Text style={styles.summaryKicker}>DAILY ARENA · {marketName.toUpperCase()}</Text>
            <Text style={styles.summaryScore}>{`${correct} of ${graded}`}</Text>
            <Text style={styles.summaryRank}>right first time</Text>
            <View style={styles.pillRow}>
              <View style={styles.rankPill}>
                <View style={[styles.rankDot, { backgroundColor: rank.color }]} />
                <Text style={styles.rankPillText}>{rank.label}</Text>
              </View>
              {newBest && (
                <View style={styles.bestPill}>
                  <Feather name="trending-up" size={11} color="#FFFFFF" />
                  <Text style={styles.bestPillText}>NEW BEST</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          <View style={styles.statRow}>
            <SummaryStat label="Score" value={`${score}`} />
            <SummaryStat label="Best run" value={`${bestCombo} in a row`} />
            <SummaryStat label="XP" value={`+${xp}`} accent />
          </View>

          {again && (
            <View style={styles.againCard}>
              <Feather name="rotate-ccw" size={16} color={tokens.color.accent} />
              <Text style={styles.againText}>
                Second chance: {recovered} of {again.exercises.length} put right
                {recovered > 0 && !replay ? ` (+${recovered * RECOVERY_XP} XP)` : ''}
              </Text>
            </View>
          )}

          <LeoCoach line={leoLine} mood={graded > 0 && correct / graded >= 0.7 ? 'celebrate' : 'thinking'} />
          {replay && <Text style={styles.replayNote}>Today's first run paid full XP. Extra runs pay a quarter.</Text>}

          {(stillMissed.length > 0 || putRight.length > 0) && (
            <View style={styles.reviewBlock}>
              <Text style={styles.reviewTitle}>{stillMissed.length ? 'Worth another look' : 'What you put right'}</Text>
              {[...stillMissed, ...putRight].map(item => {
                const fixed = recoveredIds.includes(item.id);
                const answer = reviewAnswer(item);
                const from = practiceSourceLabel(item);
                return (
                  <View key={item.id} style={styles.reviewRow}>
                    <Feather
                      name={fixed ? 'check-circle' : 'x-circle'}
                      size={18}
                      color={fixed ? tokens.color.correct : tokens.color.incorrect}
                      style={styles.reviewIcon}
                    />
                    <View style={styles.reviewBody}>
                      <Text style={styles.reviewQuestion}>{reviewQuestion(item)}</Text>
                      {!!answer && <Text style={styles.reviewAnswer}>{answer}</Text>}
                      <Text style={styles.reviewFrom}>{fixed ? `Put right · ${from}` : from}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

        </ScrollView>
        {/* The collect button stays on screen, however long the review list gets. */}
        <View style={styles.summaryFooter}>
          <PrimaryButton
            label={banking ? 'Saving…' : `Collect +${xp} XP`}
            variant={banking ? 'disabled' : 'primary'}
            onPress={() => {
              if (banking) return;
              setBanking(true);
              trackEvent('quiz_finished', { correct, total: graded });
              onFinish({
                score,
                correct,
                total: graded,
                bestCombo,
                waveReached: Math.min(waveIndex + 1, waves.length),
                survived: ended.survived,
                xp,
                recovered,
              });
            }}
          />
        </View>
      </View>
    );
  }

  if (!wave || !exercise) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.emptyTitle}>The arena is resting</Text>
        <Text style={styles.emptyBody}>
          We need a little more {marketName} material before the next run. Try a lesson first.
        </Text>
        <PrimaryButton label="Back to practice" onPress={onExit} />
      </View>
    );
  }

  const timerWidth = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const urgent = timeLeft <= 5 && phase === 'answering';
  const buttonVariant =
    phase === 'feedback'
      ? state.isCorrect
        ? 'correct'
        : 'incorrect'
      : passive || state.canCheck
        ? 'primary'
        : 'disabled';
  const buttonLabel = passive ? 'Continue' : phase === 'feedback' ? 'Next' : 'Lock it in';
  // The strip shows the main run, or the second chance while it plays.
  const strip: Mark[] = inAgain ? wave.exercises.map((_, i) => againMarks[i]) : Array.from({ length: mainTotal }, (_, i) => marks[i]);
  const current = inAgain ? beatIndex : mainPosition;
  const roundLabel = inAgain ? 'SECOND CHANCE' : `ROUND ${waveIndex + 1} OF ${waves.length}`;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* Top HUD: leave, where you are in the run, and the score */}
      <View style={styles.hud}>
        <TouchableOpacity onPress={() => setShowExit(true)} style={styles.hudExit} hitSlop={10} accessibilityLabel="Leave the run">
          <Feather name="x" size={20} color={tokens.color.textMuted} />
        </TouchableOpacity>

        <View style={styles.hudCenter}>
          <Text style={styles.hudWave}>{roundLabel}</Text>
          <View style={styles.strip} accessibilityLabel={`Question ${current + 1} of ${strip.length}`}>
            {strip.map((mark, i) => (
              <View
                key={i}
                style={[
                  styles.segment,
                  mark === 'right' && styles.segmentRight,
                  mark === 'wrong' && styles.segmentWrong,
                  !mark && i === current && styles.segmentCurrent,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.hudRight}>
          <Animated.Text style={[styles.hudScore, { transform: [{ scale: scoreScale }] }]}>
            {score}
          </Animated.Text>
          {combo >= 2 ? (
            <Text style={styles.comboText}>{combo} in a row</Text>
          ) : (
            <Text style={styles.hudScoreLabel}>points</Text>
          )}
        </View>
      </View>

      {/* Timer — hidden behind the round-intro card until Start is tapped */}
      {!showWaveIntro && (
        <>
          <View style={styles.timerTrack}>
            <Animated.View
              style={[
                styles.timerFill,
                { width: timerWidth, backgroundColor: urgent ? tokens.color.incorrect : tokens.color.accent },
              ]}
            />
          </View>
          {!passive && (
            <Text style={[styles.timerLabel, urgent && { color: tokens.color.incorrect }]}>
              {phase === 'feedback' ? (timedOut ? "Time's up" : '\u00a0') : timeLeft <= 10 ? `${timeLeft}s left` : '\u00a0'}
            </Text>
          )}
        </>
      )}

      {lastGain !== null && (
        <Animated.View
          style={[
            styles.gain,
            {
              opacity: gainAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
              transform: [
                { translateY: gainAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) },
              ],
            },
          ]}
        >
          <Text style={styles.gainText}>+{lastGain}</Text>
        </Animated.View>
      )}

      <ScrollView
        ref={scrollRef}
        onScroll={revealCorrect.onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* The question stays behind the round-intro card until Start is tapped */}
        {!showWaveIntro ? (
          <RevealCorrectProvider value={revealCorrect.reveal}>
            {/* Leo is on screen from the start of each game, so feedback never pushes the question down. */}
            {(!!exercise.leo?.line || !!ARENA_IDLE_LINES[exercise.kind] || (phase === 'feedback' && !isPassiveKind(exercise.kind))) && <LeoCoach
              compact
              key={`${waveIndex}/${beatIndex}`}
              line={phase === 'feedback' && !isPassiveKind(exercise.kind)
                ? leoArenaLine(coachCorrect, waveIndex * 31 + beatIndex, { streak: combo, secondChance: inAgain })
                : exercise.leo?.line || ARENA_IDLE_LINES[exercise.kind] || ''}
              mood={phase === 'feedback' && !isPassiveKind(exercise.kind) ? (coachCorrect ? 'correct' : 'incorrect') : (exercise.leo?.mood ?? 'idle')}
              intro={beatIndex === 0}
            />}
            {!!practiceSourceLabel(exercise) && (
              <View style={styles.sourceRow}>
                <Feather name="book-open" size={12} color={tokens.color.textMuted} />
                <Text style={styles.sourceText} numberOfLines={1}>{practiceSourceLabel(exercise)}</Text>
              </View>
            )}
            {renderExerciseByKind(exercise, phase, setState)}
          </RevealCorrectProvider>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {phase === 'feedback' && !passive && (
          <FeedbackFooter
            isCorrect={state.isCorrect}
            explanation={feedback?.insight}
            correctAnswer={feedback?.answer}
            whyWrong={feedback?.whyWrong}
            review={exercise.review}
          />
        )}
        <PrimaryButton label={buttonLabel} onPress={onAction} variant={buttonVariant} />
      </View>

      {/* Round intro */}
      <Modal visible={showWaveIntro} transparent animationType="fade">
        <View style={styles.waveBackdrop}>
          <LinearGradient
            colors={[world.colors[0], world.colors[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.waveCard}
          >
            {!inAgain && (
              <View style={styles.pips}>
                {waves.map((w, i) => (
                  <View key={w.key} style={[styles.pip, i < waveIndex && styles.pipDone, i === waveIndex && styles.pipNow]} />
                ))}
              </View>
            )}
            <Text style={styles.waveKicker}>{inAgain ? 'Bonus round' : `Round ${waveIndex + 1} of ${waves.length}`}</Text>
            {!!wave.name && <Text style={styles.waveName}>{wave.name}</Text>}
            {!!wave.tagline && <Text style={styles.waveTagline}>{wave.tagline}</Text>}
            {!!wave.covers && <Text style={styles.waveCovers}>{wave.covers}</Text>}
            <Text style={styles.waveMetaLine}>
              {wave.exercises.length} {wave.exercises.length === 1 ? 'question' : 'questions'}
              {' \u00b7 '}
              {wave.multiplier < 1 ? 'Half points' : `Points \u00d7${wave.multiplier}`}
            </Text>
            <TouchableOpacity
              style={styles.waveBtn}
              activeOpacity={0.9}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                setShowWaveIntro(false);
              }}
            >
              <Text style={styles.waveBtnText}>{inAgain ? 'Try them again' : waveIndex === 0 ? 'Start' : 'Next round'}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* Exit confirm */}
      <Modal visible={showExit} transparent animationType="fade">
        <View style={styles.exitBackdrop}>
          <View style={styles.exitSheet}>
            <Text style={styles.exitTitle}>Leave the run?</Text>
            <Text style={styles.exitBody}>Your score for this run won't be banked.</Text>
            <PrimaryButton label="Keep going" onPress={() => setShowExit(false)} />
            <TouchableOpacity style={styles.ghostBtn} onPress={onExit} activeOpacity={0.8}>
              <Text style={styles.ghostText}>Leave</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SummaryStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, accent && { color: tokens.color.accent }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: tokens.color.text },
  emptyBody: { fontSize: 14, lineHeight: 21, color: tokens.color.textSecondary, textAlign: 'center' },

  hud: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, gap: 10 },
  hudExit: { width: 32 },
  hudCenter: { flex: 1, gap: 6 },
  hudWave: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: tokens.color.textMuted },
  strip: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 8, borderRadius: 4, backgroundColor: tokens.color.track },
  segmentRight: { backgroundColor: tokens.color.correct },
  segmentWrong: { backgroundColor: tokens.color.incorrect },
  // Ink, not the accent, so "you are here" never reads as the purple timer below.
  segmentCurrent: { backgroundColor: tokens.color.text },
  hudRight: { minWidth: 64, alignItems: 'flex-end' },
  hudScore: { fontSize: 22, fontWeight: '900', color: tokens.color.text, letterSpacing: -0.5 },
  hudScoreLabel: { fontSize: 10, fontWeight: '700', color: tokens.color.textMuted, letterSpacing: 0.4 },
  comboText: { fontSize: 10, fontWeight: '800', color: tokens.color.correctDark, letterSpacing: 0.4 },

  timerTrack: {
    height: 4,
    marginHorizontal: 16,
    borderRadius: 2,
    backgroundColor: tokens.color.track,
    overflow: 'hidden',
  },
  timerFill: { height: '100%', borderRadius: 2 },
  timerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: tokens.color.textMuted,
    textAlign: 'right',
    marginTop: 4,
    marginRight: 16,
  },

  gain: { position: 'absolute', top: 96, alignSelf: 'center', zIndex: 40 },
  gainText: { fontSize: 20, fontWeight: '900', color: tokens.color.correctDark },

  body: { padding: 16, paddingTop: 8, paddingBottom: 28, gap: 14 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: -4 },
  sourceText: { flex: 1, fontSize: 12, fontWeight: '600', color: tokens.color.textMuted },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    backgroundColor: tokens.color.bg,
  },

  waveBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,12,20,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  waveCard: { width: '100%', maxWidth: 440, borderRadius: 26, padding: 24, alignItems: 'center', gap: 6 },
  pips: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  pip: { width: 22, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  pipDone: { backgroundColor: 'rgba(255,255,255,0.7)' },
  pipNow: { backgroundColor: '#FFFFFF', width: 34 },
  waveKicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' },
  waveName: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.8 },
  waveTagline: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 20 },
  waveMetaLine: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 14, marginBottom: 2, textAlign: 'center' },
  waveMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 },
  waveMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  waveMetaText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  waveCovers: { marginTop: 6, fontSize: 14, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  replayNote: { marginTop: -4, fontSize: 12, fontWeight: '600', color: tokens.color.textMuted, textAlign: 'center' },
  waveBtn: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 28,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  waveBtnText: { fontSize: 16, fontWeight: '800', color: '#14182B' },

  exitBackdrop: { flex: 1, backgroundColor: 'rgba(10,12,20,0.6)', justifyContent: 'flex-end' },
  exitSheet: {
    backgroundColor: tokens.color.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 34,
    gap: 12,
  },
  exitTitle: { fontSize: 20, fontWeight: '800', color: tokens.color.text },
  exitBody: { fontSize: 14, lineHeight: 21, color: tokens.color.textSecondary },
  ghostBtn: { alignItems: 'center', paddingVertical: 14 },
  ghostText: { fontSize: 15, fontWeight: '700', color: tokens.color.textMuted },

  summaryScroll: { padding: 20, paddingBottom: 12, gap: 16 },
  summaryFooter: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: tokens.color.border, backgroundColor: tokens.color.bg },
  summaryHero: { borderRadius: 26, paddingVertical: 26, paddingHorizontal: 24, alignItems: 'center', gap: 2 },
  summaryKicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, color: 'rgba(255,255,255,0.85)' },
  summaryScore: { fontSize: 52, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1.5 },
  summaryRank: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  rankDot: { width: 8, height: 8, borderRadius: 4 },
  rankPillText: { fontSize: 11, fontWeight: '800', color: '#111827', letterSpacing: 0.4 },
  bestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  bestPillText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.8 },
  statRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  statValue: { fontSize: 17, fontWeight: '800', color: tokens.color.text },
  statLabel: { fontSize: 10, fontWeight: '700', color: tokens.color.textMuted, letterSpacing: 0.4, textTransform: 'uppercase' },
  againCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: tokens.color.accentSoft,
  },
  againText: { flex: 1, fontSize: 14, fontWeight: '700', color: tokens.color.text },
  reviewBlock: { gap: 10 },
  reviewTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, color: tokens.color.textMuted, textTransform: 'uppercase' },
  reviewRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: tokens.color.card,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  reviewIcon: { marginTop: 1 },
  reviewBody: { flex: 1, gap: 4 },
  reviewQuestion: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: tokens.color.text },
  reviewAnswer: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: tokens.color.correctDark },
  reviewFrom: { fontSize: 12, fontWeight: '600', color: tokens.color.textMuted },
});

/** The round's clock, stretched for long questions (shared with the Arena builder). */
function beatSecondsFor(wave: { seconds: number } | undefined, exercise: Exercise | undefined | null): number {
  return beatSeconds(wave, exercise);
}
