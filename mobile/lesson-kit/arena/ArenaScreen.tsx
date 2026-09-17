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
import { LeoCoach } from '../components/LeoCoach';
import { renderExerciseByKind, isPassiveKind } from '../components/ExerciseRenderer';
import { ExerciseState } from '../exercises/types';
import { Exercise } from '../types';
import { ArenaWave, rankForScore } from './buildArena';
import { playSound } from '../../lib/sounds';
import { getMarketWorld } from '../../data/marketWorlds';

const START_SHIELDS = 2;

export interface ArenaResult {
  score: number;
  correct: number;
  total: number;
  bestCombo: number;
  waveReached: number;
  survived: boolean;
  xp: number;
}

interface Props {
  waves: ArenaWave[];
  marketId?: string;
  marketName: string;
  bestScore: number;
  onExit: () => void;
  onFinish: (result: ArenaResult) => void;
}

/**
 * Daily Arena — a timed, escalating run through the market's own material.
 * Speed and combos multiply the score; shields absorb misses until sudden death.
 */
export function ArenaScreen({ waves, marketId, marketName, bestScore, onExit, onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const world = getMarketWorld(marketId);

  const [waveIndex, setWaveIndex] = useState(0);
  const [beatIndex, setBeatIndex] = useState(0);
  const [showWaveIntro, setShowWaveIntro] = useState(true);
  const [phase, setPhase] = useState<'answering' | 'feedback'>('answering');
  const [state, setState] = useState<ExerciseState>({ canCheck: false, isCorrect: false });
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [graded, setGraded] = useState(0);
  const [shields, setShields] = useState(START_SHIELDS);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastGain, setLastGain] = useState<number | null>(null);
  const [ended, setEnded] = useState<{ survived: boolean } | null>(null);
  const [showExit, setShowExit] = useState(false);

  const wave = waves[waveIndex];
  const exercise: Exercise | undefined = wave?.exercises[beatIndex];
  const passive = isPassiveKind(exercise?.kind);

  const timerAnim = useRef(new Animated.Value(1)).current;
  const gainAnim = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(1)).current;
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    (isCorrect: boolean, secondsRemaining: number) => {
      clearTick();
      setGraded(g => g + 1);
      if (isCorrect) {
        const speedBonus = Math.round((secondsRemaining / Math.max(1, wave.seconds)) * 40);
        const comboBonus = Math.round(combo * 15);
        const gain = Math.round((60 + speedBonus + comboBonus) * wave.multiplier);
        setScore(s => s + gain);
        setCorrect(c => c + 1);
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

      setCombo(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      playSound('wrong').catch(() => {});

      const suddenDeath = wave.key === 'sudden';
      if (suddenDeath || shields === 0) {
        setPhase('feedback');
        setShields(s => Math.max(0, s - 1));
        setTimeout(() => endRun(false), 900);
        return;
      }
      setShields(s => s - 1);
      setPhase('feedback');
    },
    [clearTick, combo, endRun, popGain, shields, wave],
  );

  // Countdown for the current beat
  useEffect(() => {
    if (!wave || !exercise || showWaveIntro || phase === 'feedback' || ended) return;
    if (passive) return;

    setTimeLeft(wave.seconds);
    timerAnim.setValue(1);
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: wave.seconds * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    clearTick();
    tickRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearTick();
          grade(false, 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return clearTick;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveIndex, beatIndex, showWaveIntro, phase, ended, passive]);

  const advance = useCallback(() => {
    if (!wave) return;
    if (beatIndex < wave.exercises.length - 1) {
      setBeatIndex(i => i + 1);
      setPhase('answering');
      setState({ canCheck: false, isCorrect: false });
      return;
    }
    if (waveIndex < waves.length - 1) {
      setWaveIndex(i => i + 1);
      setBeatIndex(0);
      setPhase('answering');
      setState({ canCheck: false, isCorrect: false });
      setShowWaveIntro(true);
      return;
    }
    endRun(true);
  }, [beatIndex, endRun, wave, waveIndex, waves.length]);

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

  const correctAnswerText = useMemo(() => {
    if (!exercise) return undefined;
    if (exercise.kind === 'multipleChoice') return exercise.options[exercise.correctIndex];
    if (exercise.kind === 'theCall') return exercise.options[exercise.correctIndex];
    if (exercise.kind === 'faceOff')
      return exercise.correctIndex === 0 ? exercise.left.name : exercise.right.name;
    if (exercise.kind === 'spotFake') return exercise.statements[exercise.fakeIndex];
    if (exercise.kind === 'mapMarket') return exercise.nodes[exercise.correctIndex]?.label;
    return undefined;
  }, [exercise]);

  // ── Run summary ───────────────────────────────────────────────
  if (ended) {
    const rank = rankForScore(score);
    const xp = Math.max(10, Math.round(score / 8) + correct * 4);
    const newBest = score > bestScore;
    return (
      <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>
        <ScrollView contentContainerStyle={styles.summaryScroll} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[rank.color, world.colors[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryHero}
          >
            <Text style={styles.summaryKicker}>{ended.survived ? 'RUN COMPLETE' : 'RUN ENDED'}</Text>
            <Text style={styles.summaryScore}>{score}</Text>
            <Text style={styles.summaryRank}>{rank.label}</Text>
            {newBest && (
              <View style={styles.bestPill}>
                <Feather name="trending-up" size={11} color="#FFFFFF" />
                <Text style={styles.bestPillText}>NEW PERSONAL BEST</Text>
              </View>
            )}
          </LinearGradient>

          <View style={styles.statGrid}>
            <SummaryStat icon="check-circle" label="Correct" value={`${correct}/${graded}`} />
            <SummaryStat icon="zap" label="Best combo" value={`x${bestCombo}`} />
            <SummaryStat icon="layers" label="Wave" value={`${waveIndex + 1}/${waves.length}`} />
            <SummaryStat icon="award" label="XP earned" value={`+${xp}`} />
          </View>

          <LeoCoach
            line={
              ended.survived
                ? `Clean run in ${marketName}. That combo is what separates a desk analyst from a tourist.`
                : `The clock got you. Come back and take the ${rank.label} title.`
            }
            mood={ended.survived ? 'celebrate' : 'thinking'}
          />

          <View style={{ height: 12 }} />
          <PrimaryButton
            label={`Bank +${xp} XP`}
            onPress={() =>
              onFinish({
                score,
                correct,
                total: graded,
                bestCombo,
                waveReached: waveIndex + 1,
                survived: ended.survived,
                xp,
              })
            }
          />
          <TouchableOpacity style={styles.ghostBtn} onPress={onExit} activeOpacity={0.8}>
            <Text style={styles.ghostText}>Leave the arena</Text>
          </TouchableOpacity>
        </ScrollView>
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

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* Top HUD */}
      <View style={styles.hud}>
        <TouchableOpacity onPress={() => setShowExit(true)} style={styles.hudExit} hitSlop={10}>
          <Feather name="x" size={20} color={tokens.color.textMuted} />
        </TouchableOpacity>

        <View style={styles.hudCenter}>
          <Text style={styles.hudWave}>
            WAVE {waveIndex + 1} · {wave.name.toUpperCase()}
          </Text>
          <Animated.Text style={[styles.hudScore, { transform: [{ scale: scoreScale }] }]}>
            {score}
          </Animated.Text>
        </View>

        <View style={styles.hudRight}>
          <View style={styles.shieldRow}>
            {Array.from({ length: START_SHIELDS }).map((_, i) => (
              <Feather
                key={i}
                name="shield"
                size={15}
                color={i < shields ? tokens.color.accent : tokens.color.disabled}
              />
            ))}
          </View>
          {combo >= 2 && <Text style={styles.comboText}>x{combo} combo</Text>}
        </View>
      </View>

      {/* Timer */}
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
          {phase === 'feedback' ? 'Locked' : `${timeLeft}s · x${wave.multiplier} points`}
        </Text>
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
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!!exercise.leo?.line && <LeoCoach line={exercise.leo.line} mood={exercise.leo.mood} />}
        {renderExerciseByKind(exercise, phase, setState)}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {phase === 'feedback' && !passive && (
          <FeedbackFooter
            isCorrect={state.isCorrect}
            explanation={(exercise as any).explanation}
            correctAnswer={correctAnswerText}
          />
        )}
        <PrimaryButton label={buttonLabel} onPress={onAction} variant={buttonVariant} />
      </View>

      {/* Wave intro */}
      <Modal visible={showWaveIntro} transparent animationType="fade">
        <View style={styles.waveBackdrop}>
          <LinearGradient
            colors={[world.colors[0], world.colors[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.waveCard}
          >
            <Text style={styles.waveKicker}>WAVE {waveIndex + 1} OF {waves.length}</Text>
            <Text style={styles.waveName}>{wave.name}</Text>
            <Text style={styles.waveTagline}>{wave.tagline}</Text>
            <View style={styles.waveMetaRow}>
              <View style={styles.waveMeta}>
                <Feather name="clock" size={12} color="#FFFFFF" />
                <Text style={styles.waveMetaText}>{wave.seconds}s per call</Text>
              </View>
              <View style={styles.waveMeta}>
                <Feather name="star" size={12} color="#FFFFFF" />
                <Text style={styles.waveMetaText}>x{wave.multiplier} points</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.waveBtn}
              activeOpacity={0.9}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                setShowWaveIntro(false);
              }}
            >
              <Text style={styles.waveBtnText}>Enter the wave</Text>
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

function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Feather name={icon} size={15} color={tokens.color.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: tokens.color.text },
  emptyBody: { fontSize: 14, lineHeight: 21, color: tokens.color.textSecondary, textAlign: 'center' },

  hud: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  hudExit: { width: 40 },
  hudCenter: { flex: 1, alignItems: 'center' },
  hudWave: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: tokens.color.textMuted },
  hudScore: { fontSize: 26, fontWeight: '900', color: tokens.color.text, letterSpacing: -0.6 },
  hudRight: { width: 62, alignItems: 'flex-end', gap: 3 },
  shieldRow: { flexDirection: 'row', gap: 3 },
  comboText: { fontSize: 10, fontWeight: '800', color: tokens.color.accent },

  timerTrack: {
    height: 6,
    marginHorizontal: 16,
    borderRadius: 4,
    backgroundColor: tokens.color.track,
    overflow: 'hidden',
  },
  timerFill: { height: '100%', borderRadius: 4 },
  timerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: tokens.color.textMuted,
    textAlign: 'center',
    marginTop: 5,
  },

  gain: { position: 'absolute', top: 96, alignSelf: 'center', zIndex: 40 },
  gainText: { fontSize: 20, fontWeight: '900', color: tokens.color.correctDark },

  body: { padding: 16, paddingBottom: 28, gap: 14 },
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
  waveCard: { width: '100%', borderRadius: 26, padding: 24, alignItems: 'center', gap: 6 },
  waveKicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, color: 'rgba(255,255,255,0.8)' },
  waveName: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.8 },
  waveTagline: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 20 },
  waveMetaRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
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
  waveBtn: {
    marginTop: 18,
    backgroundColor: tokens.color.card,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 28,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  waveBtnText: { fontSize: 16, fontWeight: '800', color: '#1A1F36' },

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

  summaryScroll: { padding: 20, gap: 16 },
  summaryHero: { borderRadius: 26, padding: 24, alignItems: 'center', gap: 2 },
  summaryKicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, color: 'rgba(255,255,255,0.85)' },
  summaryScore: { fontSize: 52, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1.5 },
  summaryRank: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  bestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  bestPillText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.8 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flexGrow: 1,
    flexBasis: '46%',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: tokens.color.text },
  statLabel: { fontSize: 10, fontWeight: '700', color: tokens.color.textMuted, letterSpacing: 0.4 },
});
