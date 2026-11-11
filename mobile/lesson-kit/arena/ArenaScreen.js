import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Modal
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { tokens } from "../theme/tokens";
import { PrimaryButton } from "../components/PrimaryButton";
import { FeedbackFooter } from "../components/FeedbackFooter";
import { RevealCorrectProvider, useRevealCorrect } from "../components/RevealCorrect";
import { feedbackCopy } from "../components/feedbackCopy";
import { LeoCoach } from "../components/LeoCoach";
import { leoArenaLine } from "../../components/mascot/leoAnimationRules";
import { renderExerciseByKind, isPassiveKind } from "../components/ExerciseRenderer";
import { arenaXp, beatSeconds, rankForAccuracy, RECOVERY_XP, secondChanceWave } from "./buildArena";
import { reviewAnswer, reviewQuestion } from "./arenaReview";
import { playSound } from "../../lib/sounds";
import { trackEvent } from "../../lib/analytics";
import { getMarketWorld } from "../../data/marketWorlds";
import { practiceSourceLabel } from "../practice/studiedMaterial";
const ARENA_IDLE_LINES = {
  quickFire: "Quick calls. You read all of these.",
  matchPairs: "Start with the one you are sure of.",
  multipleChoice: "Pick the one you could explain.",
  numberSense: "Roughly the right size is enough.",
  sortSignal: "Sort the easy ones first.",
  buildChain: "What has to happen first?",
  spotFake: "One of these is wrong. Which?",
  faceOff: "Two options. Trust your read.",
  theCall: "Think like you own the decision."
};
const AGAIN_KEY = "again";
function ArenaScreen({ waves, marketId, marketName, bestScore, onExit, onFinish, onQuestionSeen, replay = false, fixedXp }) {
  useEffect(() => {
    trackEvent("quiz_started", { marketId: marketId ?? null });
  }, []);
  const insets = useSafeAreaInsets();
  const world = getMarketWorld(marketId);
  const [again, setAgain] = useState(null);
  const runWaves = useMemo(() => again ? [...waves, again] : waves, [waves, again]);
  const [waveIndex, setWaveIndex] = useState(0);
  const [beatIndex, setBeatIndex] = useState(0);
  const [showWaveIntro, setShowWaveIntro] = useState(true);
  const [phase, setPhase] = useState("answering");
  const [state, setState] = useState({ canCheck: false, isCorrect: false });
  const [coachCorrect, setCoachCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [graded, setGraded] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastGain, setLastGain] = useState(null);
  const [ended, setEnded] = useState(null);
  const [showExit, setShowExit] = useState(false);
  const [banking, setBanking] = useState(false);
  const [marks, setMarks] = useState([]);
  const [againMarks, setAgainMarks] = useState([]);
  const missed = useRef([]);
  const [recoveredIds, setRecoveredIds] = useState([]);
  const wave = runWaves[waveIndex];
  const exercise = wave?.exercises[beatIndex];
  const passive = isPassiveKind(exercise?.kind);
  const inAgain = wave?.key === AGAIN_KEY;
  const mainTotal = waves.reduce((n, w) => n + w.exercises.length, 0);
  const mainPosition = inAgain ? mainTotal : waves.slice(0, waveIndex).reduce((n, w) => n + w.exercises.length, 0) + beatIndex;
  useEffect(() => {
    if (exercise && !showWaveIntro && !ended && !passive) onQuestionSeen?.(exercise);
  }, [exercise, showWaveIntro, ended, passive, onQuestionSeen]);
  const timerAnim = useRef(new Animated.Value(1)).current;
  const gainAnim = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(1)).current;
  const tickRef = useRef(null);
  const scrollRef = useRef(null);
  const revealCorrect = useRevealCorrect(scrollRef);
  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);
  useEffect(() => clearTick, [clearTick]);
  const popGain = useCallback(
    (amount) => {
      setLastGain(amount);
      gainAnim.setValue(0);
      Animated.timing(gainAnim, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      }).start(() => setLastGain(null));
      Animated.sequence([
        Animated.spring(scoreScale, { toValue: 1.18, useNativeDriver: true, tension: 180, friction: 6 }),
        Animated.spring(scoreScale, { toValue: 1, useNativeDriver: true, tension: 180, friction: 8 })
      ]).start();
    },
    [gainAnim, scoreScale]
  );
  const endRun = useCallback(
    (survived) => {
      clearTick();
      playSound(survived ? "lessonComplete" : "wrong").catch(() => {
      });
      setEnded({ survived });
    },
    [clearTick]
  );
  const grade = useCallback(
    (isCorrect, secondsRemaining, outOfTime = false) => {
      clearTick();
      setTimedOut(outOfTime);
      setCoachCorrect(isCorrect);
      if (exercise && inAgain) {
        setAgainMarks((m) => {
          const next = [...m];
          next[beatIndex] = isCorrect ? "right" : "wrong";
          return next;
        });
        if (isCorrect) setRecoveredIds((ids) => [...ids, exercise.id.replace(/-again$/, "")]);
      } else if (exercise) {
        setGraded((g) => g + 1);
        setMarks((m) => {
          const next = [...m];
          next[mainPosition] = isCorrect ? "right" : "wrong";
          return next;
        });
        if (!isCorrect) missed.current = [...missed.current, exercise];
      }
      if (isCorrect) {
        const speedBonus = Math.round(secondsRemaining / Math.max(1, beatSecondsFor(wave, exercise)) * 40);
        const comboBonus = Math.round(combo * 15);
        const gain = Math.round((60 + speedBonus + comboBonus) * wave.multiplier);
        setScore((s) => s + gain);
        if (!inAgain) setCorrect((c) => c + 1);
        setCombo((c) => {
          const next = c + 1;
          setBestCombo((b) => Math.max(b, next));
          return next;
        });
        popGain(gain);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
        });
        playSound("correct").catch(() => {
        });
        setPhase("feedback");
        return;
      }
      setCombo(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {
      });
      playSound("wrong").catch(() => {
      });
      setPhase("feedback");
    },
    [clearTick, combo, popGain, wave, exercise, inAgain, beatIndex, mainPosition]
  );
  useEffect(() => {
    if (!wave || !exercise || showWaveIntro || phase === "feedback" || ended) return;
    if (passive) return;
    setTimeLeft(beatSecondsFor(wave, exercise));
    timerAnim.setValue(1);
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: beatSecondsFor(wave, exercise) * 1e3,
      easing: Easing.linear,
      useNativeDriver: false
    }).start();
    clearTick();
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTick();
          grade(false, 0, true);
          return 0;
        }
        return t - 1;
      });
    }, 1e3);
    return clearTick;
  }, [waveIndex, beatIndex, showWaveIntro, phase, ended, passive]);
  const nextQuestion = useCallback(() => {
    setPhase("answering");
    setTimedOut(false);
    setState({ canCheck: false, isCorrect: false });
  }, []);
  const advance = useCallback(() => {
    if (!wave) return;
    if (beatIndex < wave.exercises.length - 1) {
      setBeatIndex((i) => i + 1);
      nextQuestion();
      return;
    }
    if (waveIndex < runWaves.length - 1) {
      setWaveIndex((i) => i + 1);
      setBeatIndex(0);
      nextQuestion();
      setShowWaveIntro(true);
      return;
    }
    const retry = again || fixedXp !== void 0 ? null : secondChanceWave(missed.current);
    if (retry) {
      setAgain(retry);
      setWaveIndex((i) => i + 1);
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
    if (phase === "answering") {
      if (!state.canCheck) return;
      grade(state.isCorrect, timeLeft);
      return;
    }
    advance();
  }, [advance, grade, passive, phase, state, timeLeft]);
  const feedback = exercise ? feedbackCopy(exercise, state.isCorrect, state.selectedIndex) : null;
  if (ended) {
    const rank = rankForAccuracy(correct, graded);
    const recovered = recoveredIds.length;
    const xp = fixedXp ?? arenaXp(correct, graded, replay, recovered);
    const newBest = bestScore > 0 && score > bestScore;
    const perfect = graded > 0 && correct === graded;
    const stillMissed = missed.current.filter((e) => !recoveredIds.includes(e.id));
    const putRight = missed.current.filter((e) => recoveredIds.includes(e.id));
    const leoLine = graded === 0 ? "Nothing graded this time. Try again soon." : perfect ? `All ${graded} right first time. Full credit.` : !stillMissed.length ? "Every miss put right. Nicely done." : correct / graded >= 0.7 ? "Strong run. Skim the misses below." : "Read the misses below once more.";
    return /* @__PURE__ */ React.createElement(View, { style: [styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 12 }] }, /* @__PURE__ */ React.createElement(ScrollView, { contentContainerStyle: styles.summaryScroll, showsVerticalScrollIndicator: false }, /* @__PURE__ */ React.createElement(
      LinearGradient,
      {
        colors: [world.colors[0] ?? rank.color, world.colors[1] ?? rank.color],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
        style: styles.summaryHero
      },
      /* @__PURE__ */ React.createElement(Text, { style: styles.summaryKicker }, "DAILY ARENA \xB7 ", marketName.toUpperCase()),
      /* @__PURE__ */ React.createElement(Text, { style: styles.summaryScore }, `${correct} of ${graded}`),
      /* @__PURE__ */ React.createElement(Text, { style: styles.summaryRank }, "right first time"),
      /* @__PURE__ */ React.createElement(View, { style: styles.pillRow }, /* @__PURE__ */ React.createElement(View, { style: styles.rankPill }, /* @__PURE__ */ React.createElement(View, { style: [styles.rankDot, { backgroundColor: rank.color }] }), /* @__PURE__ */ React.createElement(Text, { style: styles.rankPillText }, rank.label)), newBest && /* @__PURE__ */ React.createElement(View, { style: styles.bestPill }, /* @__PURE__ */ React.createElement(Feather, { name: "trending-up", size: 11, color: "#FFFFFF" }), /* @__PURE__ */ React.createElement(Text, { style: styles.bestPillText }, "NEW BEST")))
    ), /* @__PURE__ */ React.createElement(View, { style: styles.statRow }, /* @__PURE__ */ React.createElement(SummaryStat, { label: "Score", value: `${score}` }), /* @__PURE__ */ React.createElement(SummaryStat, { label: "Best run", value: `${bestCombo} in a row` }), /* @__PURE__ */ React.createElement(SummaryStat, { label: "XP", value: `+${xp}`, accent: true })), again && /* @__PURE__ */ React.createElement(View, { style: styles.againCard }, /* @__PURE__ */ React.createElement(Feather, { name: "rotate-ccw", size: 16, color: tokens.color.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.againText }, "Second chance: ", recovered, " of ", again.exercises.length, " put right", recovered > 0 && !replay ? ` (+${recovered * RECOVERY_XP} XP)` : "")), /* @__PURE__ */ React.createElement(LeoCoach, { line: leoLine, mood: graded > 0 && correct / graded >= 0.7 ? "celebrate" : "thinking" }), replay && /* @__PURE__ */ React.createElement(Text, { style: styles.replayNote }, "Today's first run paid full XP. Extra runs pay a quarter."), (stillMissed.length > 0 || putRight.length > 0) && /* @__PURE__ */ React.createElement(View, { style: styles.reviewBlock }, /* @__PURE__ */ React.createElement(Text, { style: styles.reviewTitle }, stillMissed.length ? "Worth another look" : "What you put right"), [...stillMissed, ...putRight].map((item) => {
      const fixed = recoveredIds.includes(item.id);
      const answer = reviewAnswer(item);
      const from = practiceSourceLabel(item);
      return /* @__PURE__ */ React.createElement(View, { key: item.id, style: styles.reviewRow }, /* @__PURE__ */ React.createElement(
        Feather,
        {
          name: fixed ? "check-circle" : "x-circle",
          size: 18,
          color: fixed ? tokens.color.correct : tokens.color.incorrect,
          style: styles.reviewIcon
        }
      ), /* @__PURE__ */ React.createElement(View, { style: styles.reviewBody }, /* @__PURE__ */ React.createElement(Text, { style: styles.reviewQuestion }, reviewQuestion(item)), !!answer && /* @__PURE__ */ React.createElement(Text, { style: styles.reviewAnswer }, answer), /* @__PURE__ */ React.createElement(Text, { style: styles.reviewFrom }, fixed ? `Put right \xB7 ${from}` : from)));
    }))), /* @__PURE__ */ React.createElement(View, { style: styles.summaryFooter }, /* @__PURE__ */ React.createElement(
      PrimaryButton,
      {
        label: banking ? "Saving\u2026" : `Collect +${xp} XP`,
        variant: banking ? "disabled" : "primary",
        onPress: () => {
          if (banking) return;
          setBanking(true);
          trackEvent("quiz_finished", { correct, total: graded });
          onFinish({
            score,
            correct,
            total: graded,
            bestCombo,
            waveReached: Math.min(waveIndex + 1, waves.length),
            survived: ended.survived,
            xp,
            recovered,
            missed: missed.current
          });
        }
      }
    )));
  }
  if (!wave || !exercise) {
    return /* @__PURE__ */ React.createElement(View, { style: [styles.root, styles.centered] }, /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, "The arena is resting"), /* @__PURE__ */ React.createElement(Text, { style: styles.emptyBody }, "We need a little more ", marketName, " material before the next run. Try a lesson first."), /* @__PURE__ */ React.createElement(PrimaryButton, { label: "Back to practice", onPress: onExit }));
  }
  const timerWidth = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const urgent = timeLeft <= 5 && phase === "answering";
  const buttonVariant = phase === "feedback" ? state.isCorrect ? "correct" : "incorrect" : passive || state.canCheck ? "primary" : "disabled";
  const buttonLabel = passive ? "Continue" : phase === "feedback" ? "Next" : "Lock it in";
  const strip = inAgain ? wave.exercises.map((_, i) => againMarks[i]) : Array.from({ length: mainTotal }, (_, i) => marks[i]);
  const current = inAgain ? beatIndex : mainPosition;
  const roundLabel = inAgain ? "SECOND CHANCE" : `ROUND ${waveIndex + 1} OF ${waves.length}`;
  return /* @__PURE__ */ React.createElement(View, { style: [styles.root, { paddingTop: insets.top + 8 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.hud }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => setShowExit(true), style: styles.hudExit, hitSlop: 10, accessibilityLabel: "Leave the run" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 20, color: tokens.color.textMuted })), /* @__PURE__ */ React.createElement(View, { style: styles.hudCenter }, /* @__PURE__ */ React.createElement(Text, { style: styles.hudWave }, roundLabel), /* @__PURE__ */ React.createElement(View, { style: styles.strip, accessibilityLabel: `Question ${current + 1} of ${strip.length}` }, strip.map((mark, i) => /* @__PURE__ */ React.createElement(
    View,
    {
      key: i,
      style: [
        styles.segment,
        mark === "right" && styles.segmentRight,
        mark === "wrong" && styles.segmentWrong,
        !mark && i === current && styles.segmentCurrent
      ]
    }
  )))), /* @__PURE__ */ React.createElement(View, { style: styles.hudRight }, /* @__PURE__ */ React.createElement(Animated.Text, { style: [styles.hudScore, { transform: [{ scale: scoreScale }] }] }, score), combo >= 2 ? /* @__PURE__ */ React.createElement(Text, { style: styles.comboText }, combo, " in a row") : /* @__PURE__ */ React.createElement(Text, { style: styles.hudScoreLabel }, "points"))), !showWaveIntro && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(View, { style: styles.timerTrack }, /* @__PURE__ */ React.createElement(
    Animated.View,
    {
      style: [
        styles.timerFill,
        { width: timerWidth, backgroundColor: urgent ? tokens.color.incorrect : tokens.color.accent }
      ]
    }
  )), !passive && /* @__PURE__ */ React.createElement(Text, { style: [styles.timerLabel, urgent && { color: tokens.color.incorrect }] }, phase === "feedback" ? timedOut ? "Time's up" : "\xA0" : timeLeft <= 10 ? `${timeLeft}s left` : "\xA0")), lastGain !== null && /* @__PURE__ */ React.createElement(
    Animated.View,
    {
      style: [
        styles.gain,
        {
          opacity: gainAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
          transform: [
            { translateY: gainAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) }
          ]
        }
      ]
    },
    /* @__PURE__ */ React.createElement(Text, { style: styles.gainText }, "+", lastGain)
  ), /* @__PURE__ */ React.createElement(
    ScrollView,
    {
      ref: scrollRef,
      onScroll: revealCorrect.onScroll,
      scrollEventThrottle: 16,
      contentContainerStyle: styles.body,
      showsVerticalScrollIndicator: false,
      keyboardShouldPersistTaps: "handled"
    },
    !showWaveIntro ? /* @__PURE__ */ React.createElement(RevealCorrectProvider, { value: revealCorrect.reveal }, (!!exercise.leo?.line || !!ARENA_IDLE_LINES[exercise.kind] || phase === "feedback" && !isPassiveKind(exercise.kind)) && /* @__PURE__ */ React.createElement(
      LeoCoach,
      {
        compact: true,
        key: `${waveIndex}/${beatIndex}`,
        line: phase === "feedback" && !isPassiveKind(exercise.kind) ? leoArenaLine(coachCorrect, waveIndex * 31 + beatIndex, { streak: combo, secondChance: inAgain }) : exercise.leo?.line || ARENA_IDLE_LINES[exercise.kind] || "",
        mood: phase === "feedback" && !isPassiveKind(exercise.kind) ? coachCorrect ? "correct" : "incorrect" : exercise.leo?.mood ?? "idle",
        intro: beatIndex === 0
      }
    ), !!practiceSourceLabel(exercise) && /* @__PURE__ */ React.createElement(View, { style: styles.sourceRow }, /* @__PURE__ */ React.createElement(Feather, { name: "book-open", size: 12, color: tokens.color.textMuted }), /* @__PURE__ */ React.createElement(Text, { style: styles.sourceText, numberOfLines: 1 }, practiceSourceLabel(exercise))), renderExerciseByKind(exercise, phase, setState)) : null
  ), /* @__PURE__ */ React.createElement(View, { style: [styles.footer, { paddingBottom: insets.bottom + 12 }] }, phase === "feedback" && !passive && /* @__PURE__ */ React.createElement(
    FeedbackFooter,
    {
      isCorrect: state.isCorrect,
      explanation: feedback?.insight,
      correctAnswer: feedback?.answer,
      whyWrong: feedback?.whyWrong,
      review: exercise.review
    }
  ), /* @__PURE__ */ React.createElement(PrimaryButton, { label: buttonLabel, onPress: onAction, variant: buttonVariant })), /* @__PURE__ */ React.createElement(Modal, { visible: showWaveIntro, transparent: true, animationType: "fade" }, /* @__PURE__ */ React.createElement(View, { style: styles.waveBackdrop }, /* @__PURE__ */ React.createElement(
    LinearGradient,
    {
      colors: [world.colors[0], world.colors[1]],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
      style: styles.waveCard
    },
    !inAgain && /* @__PURE__ */ React.createElement(View, { style: styles.pips }, waves.map((w, i) => /* @__PURE__ */ React.createElement(View, { key: w.key, style: [styles.pip, i < waveIndex && styles.pipDone, i === waveIndex && styles.pipNow] }))),
    /* @__PURE__ */ React.createElement(Text, { style: styles.waveKicker }, inAgain ? "Bonus round" : `Round ${waveIndex + 1} of ${waves.length}`),
    !!wave.name && /* @__PURE__ */ React.createElement(Text, { style: styles.waveName }, wave.name),
    !!wave.tagline && /* @__PURE__ */ React.createElement(Text, { style: styles.waveTagline }, wave.tagline),
    !!wave.covers && /* @__PURE__ */ React.createElement(Text, { style: styles.waveCovers }, wave.covers),
    /* @__PURE__ */ React.createElement(Text, { style: styles.waveMetaLine }, wave.exercises.length, " ", wave.exercises.length === 1 ? "question" : "questions", " \xB7 ", wave.multiplier < 1 ? "Half points" : `Points \xD7${wave.multiplier}`),
    /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: styles.waveBtn,
        activeOpacity: 0.9,
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
          });
          setShowWaveIntro(false);
        }
      },
      /* @__PURE__ */ React.createElement(Text, { style: styles.waveBtnText }, inAgain ? "Try them again" : waveIndex === 0 ? "Start" : "Next round")
    )
  ))), /* @__PURE__ */ React.createElement(Modal, { visible: showExit, transparent: true, animationType: "fade" }, /* @__PURE__ */ React.createElement(View, { style: styles.exitBackdrop }, /* @__PURE__ */ React.createElement(View, { style: styles.exitSheet }, /* @__PURE__ */ React.createElement(Text, { style: styles.exitTitle }, "Leave the run?"), /* @__PURE__ */ React.createElement(Text, { style: styles.exitBody }, "Your score for this run won't be banked."), /* @__PURE__ */ React.createElement(PrimaryButton, { label: "Keep going", onPress: () => setShowExit(false) }), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.ghostBtn, onPress: onExit, activeOpacity: 0.8 }, /* @__PURE__ */ React.createElement(Text, { style: styles.ghostText }, "Leave"))))));
}
function SummaryStat({ label, value, accent = false }) {
  return /* @__PURE__ */ React.createElement(View, { style: styles.statCard }, /* @__PURE__ */ React.createElement(Text, { style: [styles.statValue, accent && { color: tokens.color.accent }], numberOfLines: 1, adjustsFontSizeToFit: true }, value), /* @__PURE__ */ React.createElement(Text, { style: styles.statLabel }, label));
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  centered: { alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: tokens.color.text },
  emptyBody: { fontSize: 14, lineHeight: 21, color: tokens.color.textSecondary, textAlign: "center" },
  hud: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10, gap: 10 },
  hudExit: { width: 32 },
  hudCenter: { flex: 1, gap: 6 },
  hudWave: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, color: tokens.color.textMuted },
  strip: { flexDirection: "row", gap: 4 },
  segment: { flex: 1, height: 8, borderRadius: 4, backgroundColor: tokens.color.track },
  segmentRight: { backgroundColor: tokens.color.correct },
  segmentWrong: { backgroundColor: tokens.color.incorrect },
  // Ink, not the accent, so "you are here" never reads as the purple timer below.
  segmentCurrent: { backgroundColor: tokens.color.text },
  hudRight: { minWidth: 64, alignItems: "flex-end" },
  hudScore: { fontSize: 22, fontWeight: "900", color: tokens.color.text, letterSpacing: -0.5 },
  hudScoreLabel: { fontSize: 10, fontWeight: "700", color: tokens.color.textMuted, letterSpacing: 0.4 },
  comboText: { fontSize: 10, fontWeight: "800", color: tokens.color.correctDark, letterSpacing: 0.4 },
  timerTrack: {
    height: 4,
    marginHorizontal: 16,
    borderRadius: 2,
    backgroundColor: tokens.color.track,
    overflow: "hidden"
  },
  timerFill: { height: "100%", borderRadius: 2 },
  timerLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: tokens.color.textMuted,
    textAlign: "right",
    marginTop: 4,
    marginRight: 16
  },
  gain: { position: "absolute", top: 96, alignSelf: "center", zIndex: 40 },
  gainText: { fontSize: 20, fontWeight: "900", color: tokens.color.correctDark },
  body: { padding: 16, paddingTop: 8, paddingBottom: 28, gap: 14 },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: -4 },
  sourceText: { flex: 1, fontSize: 12, fontWeight: "600", color: tokens.color.textMuted },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    backgroundColor: tokens.color.bg
  },
  waveBackdrop: {
    flex: 1,
    backgroundColor: "rgba(10,12,20,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  waveCard: { width: "100%", maxWidth: 440, borderRadius: 26, padding: 24, alignItems: "center", gap: 6 },
  pips: { flexDirection: "row", gap: 6, marginBottom: 6 },
  pip: { width: 22, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.3)" },
  pipDone: { backgroundColor: "rgba(255,255,255,0.7)" },
  pipNow: { backgroundColor: "#FFFFFF", width: 34 },
  waveKicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.6, color: "rgba(255,255,255,0.8)", textTransform: "uppercase" },
  waveName: { fontSize: 30, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.8 },
  waveTagline: { fontSize: 14, color: "rgba(255,255,255,0.9)", textAlign: "center", lineHeight: 20 },
  waveMetaLine: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.85)", marginTop: 14, marginBottom: 2, textAlign: "center" },
  waveMetaRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 12 },
  waveMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20
  },
  waveMetaText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  waveCovers: { marginTop: 6, fontSize: 14, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  replayNote: { marginTop: -4, fontSize: 12, fontWeight: "600", color: tokens.color.textMuted, textAlign: "center" },
  waveBtn: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 28,
    alignSelf: "stretch",
    alignItems: "center"
  },
  waveBtnText: { fontSize: 16, fontWeight: "800", color: "#14182B" },
  exitBackdrop: { flex: 1, backgroundColor: "rgba(10,12,20,0.6)", justifyContent: "flex-end" },
  exitSheet: {
    backgroundColor: tokens.color.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 34,
    gap: 12
  },
  exitTitle: { fontSize: 20, fontWeight: "800", color: tokens.color.text },
  exitBody: { fontSize: 14, lineHeight: 21, color: tokens.color.textSecondary },
  ghostBtn: { alignItems: "center", paddingVertical: 14 },
  ghostText: { fontSize: 15, fontWeight: "700", color: tokens.color.textMuted },
  summaryScroll: { padding: 20, paddingBottom: 12, gap: 16 },
  summaryFooter: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: tokens.color.border, backgroundColor: tokens.color.bg },
  summaryHero: { borderRadius: 26, paddingVertical: 26, paddingHorizontal: 24, alignItems: "center", gap: 2 },
  summaryKicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.6, color: "rgba(255,255,255,0.85)" },
  summaryScore: { fontSize: 52, fontWeight: "900", color: "#FFFFFF", letterSpacing: -1.5 },
  summaryRank: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  pillRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  rankPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20
  },
  rankDot: { width: 8, height: 8, borderRadius: 4 },
  rankPillText: { fontSize: 11, fontWeight: "800", color: "#111827", letterSpacing: 0.4 },
  bestPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20
  },
  bestPillText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.8 },
  statRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border
  },
  statValue: { fontSize: 17, fontWeight: "800", color: tokens.color.text },
  statLabel: { fontSize: 10, fontWeight: "700", color: tokens.color.textMuted, letterSpacing: 0.4, textTransform: "uppercase" },
  againCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: tokens.color.accentSoft
  },
  againText: { flex: 1, fontSize: 14, fontWeight: "700", color: tokens.color.text },
  reviewBlock: { gap: 10 },
  reviewTitle: { fontSize: 13, fontWeight: "800", letterSpacing: 0.6, color: tokens.color.textMuted, textTransform: "uppercase" },
  reviewRow: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: tokens.color.card,
    borderWidth: 1,
    borderColor: tokens.color.border
  },
  reviewIcon: { marginTop: 1 },
  reviewBody: { flex: 1, gap: 4 },
  reviewQuestion: { fontSize: 15, lineHeight: 21, fontWeight: "700", color: tokens.color.text },
  reviewAnswer: { fontSize: 14, lineHeight: 20, fontWeight: "600", color: tokens.color.correctDark },
  reviewFrom: { fontSize: 12, fontWeight: "600", color: tokens.color.textMuted }
});
function beatSecondsFor(wave, exercise) {
  return beatSeconds(wave, exercise);
}
export {
  ArenaScreen
};
