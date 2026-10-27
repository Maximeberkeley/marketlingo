import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity, Animated, Easing, AccessibilityInfo } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LessonHeader } from "../components/LessonHeader";
import { PrimaryButton } from "../components/PrimaryButton";
import { FeedbackFooter } from "../components/FeedbackFooter";
import { InfoCard } from "../exercises/InfoCard";
import { MultipleChoice } from "../exercises/MultipleChoice";
import { WordBank } from "../exercises/WordBank";
import { ColdOpen } from "../modules/ColdOpen";
import { MicroInsight } from "../modules/MicroInsight";
import { SortSignal } from "../modules/SortSignal";
import { BuildChain } from "../modules/BuildChain";
import { FaceOff } from "../modules/FaceOff";
import { SpeedRound } from "../modules/SpeedRound";
import { NumberSense } from "../modules/NumberSense";
import { SpotTheFake } from "../modules/SpotTheFake";
import { MapMarket } from "../modules/MapMarket";
import { ChartRead } from "../modules/ChartRead";
import { TheCall } from "../modules/TheCall";
import { SayIt } from "../modules/SayIt";
import { LessonComplete } from "./LessonComplete";
import { tokens } from "../theme/tokens";
import { playSound } from "../../lib/sounds";
import { getMarketWorld } from "../../data/marketWorlds";
import { AskLeoOverlay } from "../../components/ai/AskLeoOverlay";
import { normalizedCopy, readingCardKind } from "../cardPresentation";
import { trackEvent } from "../../lib/analytics";
function lessonTakeaway(exercises) {
  const reading = exercises.filter((e) => e.kind === "info" || e.kind === "microInsight");
  const card = reading.find((e) => readingCardKind(e) === "takeaway") ?? reading[reading.length - 1];
  if (!card) return "";
  const rec = card;
  const text = [rec.title, rec.text, rec.body].filter((v) => typeof v === "string" && v).join(" \u2014 ");
  return text.slice(0, 300);
}
function exerciseContext(exercise) {
  if (!exercise) return "";
  const e = exercise;
  const parts = [];
  for (const key of ["title", "headline", "prompt", "text", "body", "question"]) {
    const v = e[key];
    if (typeof v === "string" && v.trim()) parts.push(v.trim());
  }
  return parts.join("\n");
}
const MAX_HEARTS = 3;
const PASSIVE_KINDS = ["info", "coldOpen", "microInsight", "sayIt"];
const isPassiveKind = (kind) => PASSIVE_KINDS.includes(kind);
function LessonScreen({
  lesson,
  onExit,
  onFinish,
  xpPerCorrect = 10,
  renderExtraActions,
  doneLabel,
  streakDays,
  confirmExit = true,
  marketId,
  onSaveLeoAnswer,
  stackId
}) {
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState(lesson.exercises);
  const [cardSpace, setCardSpace] = useState(0);
  const [measuredCard, setMeasuredCard] = useState(null);
  const [index, setIndex] = useState(0);
  const [maxIndexReached, setMaxIndexReached] = useState(0);
  const [phase, setPhase] = useState("answering");
  const [state, setState] = useState({ canCheck: false, isCorrect: false });
  const [correctCount, setCorrectCount] = useState(0);
  const [gradedCount, setGradedCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const livesEnabled = typeof lesson.lives === "number";
  const [hearts, setHearts] = useState(lesson.lives ?? MAX_HEARTS);
  const [missed, setMissed] = useState([]);
  const [results, setResults] = useState({});
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [showHeartsPrompt, setShowHeartsPrompt] = useState(false);
  const [showAskLeo, setShowAskLeo] = useState(false);
  const [leoMessages, setLeoMessages] = useState([]);
  const [leoAutoAsk, setLeoAutoAsk] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const enter = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(Date.now());
  const world = getMarketWorld(marketId);
  const [pop, setPop] = useState(null);
  const popAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setQueue(lesson.exercises);
    setMeasuredCard(null);
    setIndex(0);
    setPhase("answering");
    setState({ canCheck: false, isCorrect: false });
    setCorrectCount(0);
    setGradedCount(0);
    setCombo(0);
    setBestCombo(0);
    setHearts(lesson.lives ?? MAX_HEARTS);
    setMissed([]);
    setResults({});
    setShowExitPrompt(false);
    setShowHeartsPrompt(false);
    setFinished(false);
    startedAt.current = Date.now();
    setLeoMessages([]);
    setLeoAutoAsk(null);
    setShowActions(false);
  }, [lesson.id]);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduceMotion(value);
    }).catch(() => {
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setShowActions(false);
    enter.setValue(reduceMotion ? 1 : 0);
    const animation = Animated.timing(enter, {
      toValue: 1,
      duration: reduceMotion ? 0 : 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    });
    animation.start();
    return () => animation.stop();
  }, [index, lesson.id, reduceMotion, enter]);
  const exercise = queue[index];
  const combined = exercise?.kind === "microInsight" && Boolean(exercise.mergedCards?.length);
  const combinedFits = measuredCard?.id === exercise?.id && cardSpace > 0 && measuredCard.height <= cardSpace;
  useEffect(() => {
    if (!combined || !exercise || measuredCard?.id !== exercise.id || cardSpace <= 0 || measuredCard.height <= cardSpace) return;
    setQueue((current) => {
      const position = current.findIndex((card) => card.id === exercise.id);
      if (position < 0) return current;
      return [...current.slice(0, position), ...exercise.kind === "microInsight" ? exercise.mergedCards || [exercise] : [exercise], ...current.slice(position + 1)];
    });
    setMeasuredCard(null);
  }, [combined, exercise, measuredCard, cardSpace]);
  const sourceIndex = lesson.exercises.findIndex((card) => card.id === exercise?.id || card.kind === "microInsight" && card.mergedCards?.some((original) => original.id === exercise?.id));
  const actionIndex = sourceIndex >= 0 ? sourceIndex : index;
  const isInfo = isPassiveKind(exercise?.kind);
  const total = queue.length;
  const progress = total > 0 ? (index + (phase === "feedback" ? 1 : 0)) / total : 0;
  const handleChange = useCallback((next) => setState(next), []);
  const openLeo = useCallback((question) => {
    setLeoAutoAsk(question ?? null);
    setShowActions(false);
    setShowAskLeo(true);
  }, []);
  const firePop = useCallback((label) => {
    setPop(label);
    popAnim.setValue(0);
    Animated.timing(popAnim, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start(() => setPop(null));
  }, [popAnim]);
  const goToBeat = useCallback((target) => {
    const beat = queue[target];
    setIndex(target);
    setShowActions(false);
    const graded = beat && !isPassiveKind(beat.kind) ? results[beat.id] : void 0;
    if (graded !== void 0) {
      setPhase("feedback");
      setState({ canCheck: true, isCorrect: graded });
    } else {
      setPhase("answering");
      setState({ canCheck: false, isCorrect: false });
    }
  }, [queue, results]);
  const goNext = useCallback(() => {
    if (index >= total - 1) {
      playSound("lessonComplete").catch(() => {
      });
      setFinished(true);
      return;
    }
    setMaxIndexReached((prev) => Math.max(prev, index + 1));
    goToBeat(index + 1);
  }, [index, total, goToBeat]);
  const continueLesson = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
    });
    goNext();
  }, [goNext]);
  const onAction = useCallback(() => {
    if (isInfo) {
      continueLesson();
      return;
    }
    if (phase === "answering") {
      if (!state.canCheck) return;
      if (exercise) setResults((r) => ({ ...r, [exercise.id]: state.isCorrect }));
      if (index >= maxIndexReached) {
        setGradedCount((c) => c + 1);
        if (state.isCorrect) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
          });
          playSound("correct").catch(() => {
          });
          setCorrectCount((c) => c + 1);
          const nextCombo = combo + 1;
          setCombo(nextCombo);
          setBestCombo((previous) => Math.max(previous, nextCombo));
          firePop(`+${xpPerCorrect} XP`);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {
          });
          playSound("wrong").catch(() => {
          });
          setCombo(0);
          setMissed((m) => exercise ? [...m, exercise] : m);
          if (livesEnabled) {
            const nextHearts = Math.max(0, hearts - 1);
            setHearts(nextHearts);
            if (nextHearts === 0) setShowHeartsPrompt(true);
          }
        }
      }
      setPhase("feedback");
      return;
    }
    continueLesson();
  }, [isInfo, phase, state, continueLesson, exercise, xpPerCorrect, firePop, combo, hearts, livesEnabled, index, maxIndexReached]);
  const retryMissed = useCallback(() => {
    setShowHeartsPrompt(false);
    setHearts(lesson.lives ?? MAX_HEARTS);
    if (!missed.length) return;
    const retryItems = missed.map((e, i) => ({ ...e, id: `${e.id}-retry${i}` }));
    setMissed([]);
    setQueue((q) => {
      const next = [...q];
      next.splice(index + 1, 0, ...retryItems);
      return next;
    });
  }, [missed, index]);
  const exitLesson = useCallback(() => {
    if (!finished) trackEvent("lesson_exit", { stackId: stackId || lesson.id || null, beatIndex: index });
    onExit();
  }, [finished, stackId, lesson.id, index, onExit]);
  const handleExitPress = useCallback(() => {
    if (!confirmExit || finished) {
      exitLesson();
      return;
    }
    setShowExitPrompt(true);
  }, [confirmExit, finished, exitLesson]);
  const feedbackExplanation = exercise && "explanation" in exercise ? normalizedCopy(exercise.explanation || "") : "";
  const answerCopy = exercise && exercise.kind === "multipleChoice" ? normalizedCopy(exercise.options[exercise.correctIndex] || "") : "";
  const repeatsAnswer = Boolean(answerCopy && feedbackExplanation.includes(answerCopy));
  const correctAnswerText = useMemo(() => {
    if (!exercise) return void 0;
    if (exercise.kind === "multipleChoice") return exercise.options[exercise.correctIndex];
    if (exercise.kind === "wordBank") return exercise.answer.join(" ");
    if (exercise.kind === "theCall") return exercise.options[exercise.correctIndex];
    if (exercise.kind === "faceOff")
      return exercise.correctIndex === 0 ? exercise.left.name : exercise.right.name;
    if (exercise.kind === "spotFake") return exercise.statements[exercise.fakeIndex];
    if (exercise.kind === "mapMarket") return exercise.nodes[exercise.correctIndex]?.label;
    return void 0;
  }, [exercise]);
  if (finished || !exercise) {
    const timeSpentSeconds = Math.round((Date.now() - startedAt.current) / 1e3);
    return /* @__PURE__ */ React.createElement(
      LessonComplete,
      {
        correct: correctCount,
        total: gradedCount,
        baseXp: correctCount * xpPerCorrect,
        bestCombo,
        heartsLeft: livesEnabled ? hearts : void 0,
        timeSpentSeconds,
        streakDays,
        doneLabel,
        marketId,
        lessonTitle: lesson.title,
        takeaway: lessonTakeaway(lesson.exercises),
        leoQuestions: leoMessages.filter((m) => m.role === "user").length,
        onDone: (xp) => onFinish({
          correct: correctCount,
          total: gradedCount,
          xp,
          timeSpentSeconds
        })
      }
    );
  }
  const buttonVariant = combined && !combinedFits ? "disabled" : phase === "feedback" || isInfo || state.canCheck ? "primary" : "disabled";
  const buttonLabel = isInfo ? "Continue" : phase === "answering" ? "Check" : "Continue";
  return /* @__PURE__ */ React.createElement(View, { style: [styles.root, { paddingTop: insets.top }] }, /* @__PURE__ */ React.createElement(
    LessonHeader,
    {
      progress,
      onExit: handleExitPress,
      onAskLeo: () => openLeo(),
      onMore: renderExtraActions ? () => setShowActions((value) => !value) : void 0,
      menuOpen: showActions
    }
  ), !!pop && /* @__PURE__ */ React.createElement(
    Animated.View,
    {
      key: exercise.id,
      pointerEvents: "none",
      style: [
        styles.pop,
        {
          opacity: popAnim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
          transform: [
            { translateY: popAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -46] }) }
          ]
        }
      ]
    },
    /* @__PURE__ */ React.createElement(Text, { style: styles.popText }, pop)
  ), /* @__PURE__ */ React.createElement(
    ScrollView,
    {
      ref: scrollRef,
      style: styles.scroll,
      onLayout: (event) => setCardSpace(Math.max(0, event.nativeEvent.layout.height - 48)),
      contentContainerStyle: [styles.content, exercise.kind === "coldOpen" && styles.coverContent],
      keyboardShouldPersistTaps: "handled",
      scrollEnabled: exercise.kind !== "sortSignal"
    },
    exercise.kind !== "coldOpen" && /* @__PURE__ */ React.createElement(View, { style: styles.upperSpace }),
    /* @__PURE__ */ React.createElement(
      Animated.View,
      {
        onLayout: (event) => {
          if (combined) setMeasuredCard({ id: exercise.id, height: event.nativeEvent.layout.height });
        },
        style: [styles.beat, exercise.kind === "coldOpen" && styles.fullBleed, { opacity: combined && !combinedFits ? 0 : enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]
      },
      exercise.kind === "sayIt" ? /* @__PURE__ */ React.createElement(SayIt, { key: exercise.id, exercise, marketId, stackId: stackId || lesson.id, onDone: continueLesson }) : renderExercise(exercise, phase, handleChange)
    ),
    exercise.kind !== "coldOpen" && /* @__PURE__ */ React.createElement(View, { style: styles.lowerSpace })
  ), phase === "feedback" && !isInfo && /* @__PURE__ */ React.createElement(
    FeedbackFooter,
    {
      key: exercise.id,
      isCorrect: state.isCorrect,
      explanation: "explanation" in exercise ? exercise.explanation : void 0,
      correctAnswer: state.isCorrect || repeatsAnswer ? void 0 : correctAnswerText
    }
  ), exercise.kind === "sayIt" ? /* @__PURE__ */ React.createElement(View, { style: { height: insets.bottom + tokens.space.lg } }) : /* @__PURE__ */ React.createElement(View, { style: [styles.footer, { paddingBottom: insets.bottom + tokens.space.lg }] }, /* @__PURE__ */ React.createElement(PrimaryButton, { label: buttonLabel, onPress: onAction, variant: buttonVariant })), /* @__PURE__ */ React.createElement(Modal, { visible: showActions, transparent: true, animationType: "fade", onRequestClose: () => setShowActions(false) }, /* @__PURE__ */ React.createElement(View, { style: styles.menuLayer }, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: StyleSheet.absoluteFillObject, activeOpacity: 1, onPress: () => setShowActions(false), accessibilityRole: "button", accessibilityLabel: "Dismiss lesson actions" }), /* @__PURE__ */ React.createElement(View, { style: [styles.actionsMenu, { marginTop: insets.top + 64 }] }, renderExtraActions?.(actionIndex, () => setShowActions(false), exercise)))), /* @__PURE__ */ React.createElement(Modal, { visible: showExitPrompt, transparent: true, animationType: "fade", onRequestClose: () => setShowExitPrompt(false) }, /* @__PURE__ */ React.createElement(View, { style: styles.backdrop }, /* @__PURE__ */ React.createElement(View, { style: styles.sheet }, /* @__PURE__ */ React.createElement(Text, { style: styles.sheetTitle }, "Leave now?"), /* @__PURE__ */ React.createElement(Text, { style: styles.sheetBody }, "You'll lose your progress in this lesson", typeof streakDays === "number" && streakDays > 0 ? ` and put your ${streakDays}-day streak at risk` : "", "."), /* @__PURE__ */ React.createElement(PrimaryButton, { label: "Keep learning", onPress: () => setShowExitPrompt(false) }), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => {
    setShowExitPrompt(false);
    exitLesson();
  }, style: styles.ghost }, /* @__PURE__ */ React.createElement(Text, { style: styles.ghostText }, "Leave anyway"))))), /* @__PURE__ */ React.createElement(Modal, { visible: livesEnabled && showHeartsPrompt, transparent: true, animationType: "fade", onRequestClose: () => setShowHeartsPrompt(false) }, /* @__PURE__ */ React.createElement(View, { style: styles.backdrop }, /* @__PURE__ */ React.createElement(View, { style: styles.sheet }, /* @__PURE__ */ React.createElement(Text, { style: styles.sheetTitle }, "Out of hearts"), /* @__PURE__ */ React.createElement(Text, { style: styles.sheetBody }, "No problem \u2014 nothing is locked. Redo the questions you missed to lock the ideas in."), /* @__PURE__ */ React.createElement(PrimaryButton, { label: "Retry what I missed", onPress: retryMissed }), /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      onPress: () => {
        setShowHeartsPrompt(false);
        setHearts(lesson.lives ?? MAX_HEARTS);
      },
      style: styles.ghost
    },
    /* @__PURE__ */ React.createElement(Text, { style: styles.ghostText }, "Keep going")
  )))), /* @__PURE__ */ React.createElement(
    AskLeoOverlay,
    {
      visible: showAskLeo,
      onClose: () => {
        setShowAskLeo(false);
        setLeoAutoAsk(null);
      },
      lessonContext: `Lesson: ${lesson.title}
World: ${world.worldName}
Current beat: ${exerciseContext(exercise)}`,
      contextLabel: exerciseContext(exercise).split("\n")[0] || lesson.title,
      accentColor: world.colors[0],
      messages: leoMessages,
      onMessagesChange: setLeoMessages,
      autoAsk: leoAutoAsk,
      onSaveAnswer: onSaveLeoAnswer ? (text) => onSaveLeoAnswer(text, actionIndex, exercise) : void 0
    }
  ));
}
function renderExercise(exercise, phase, onChange) {
  switch (exercise.kind) {
    case "info":
      return /* @__PURE__ */ React.createElement(InfoCard, { exercise, phase, onChange });
    case "multipleChoice":
      return /* @__PURE__ */ React.createElement(MultipleChoice, { exercise, phase, onChange });
    case "wordBank":
      return /* @__PURE__ */ React.createElement(WordBank, { exercise, phase, onChange });
    case "coldOpen":
      return /* @__PURE__ */ React.createElement(ColdOpen, { exercise, phase, onChange });
    case "microInsight":
      return /* @__PURE__ */ React.createElement(MicroInsight, { exercise, phase, onChange });
    case "sortSignal":
      return /* @__PURE__ */ React.createElement(SortSignal, { exercise, phase, onChange });
    case "buildChain":
      return /* @__PURE__ */ React.createElement(BuildChain, { exercise, phase, onChange });
    case "faceOff":
      return /* @__PURE__ */ React.createElement(FaceOff, { exercise, phase, onChange });
    case "speedRound":
      return /* @__PURE__ */ React.createElement(SpeedRound, { exercise, phase, onChange });
    case "numberSense":
      return /* @__PURE__ */ React.createElement(NumberSense, { exercise, phase, onChange });
    case "spotFake":
      return /* @__PURE__ */ React.createElement(SpotTheFake, { exercise, phase, onChange });
    case "mapMarket":
      return /* @__PURE__ */ React.createElement(MapMarket, { exercise, phase, onChange });
    case "chartRead":
      return /* @__PURE__ */ React.createElement(ChartRead, { exercise, phase, onChange });
    case "theCall":
      return /* @__PURE__ */ React.createElement(TheCall, { exercise, phase, onChange });
    default:
      return null;
  }
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  beat: { width: "100%", alignSelf: "stretch", flexShrink: 0 },
  upperSpace: { flexGrow: 0.42, flexBasis: 0 },
  lowerSpace: { flexGrow: 0.58, flexBasis: 0 },
  fullBleed: { flexGrow: 1 },
  coverContent: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0, gap: 0 },
  menuLayer: { flex: 1 },
  actionsMenu: { alignSelf: "flex-end", marginRight: tokens.space.lg, minWidth: 176, maxWidth: "90%", padding: tokens.space.sm, backgroundColor: tokens.color.card, borderWidth: 1, borderColor: tokens.color.border, borderRadius: tokens.radius.sm },
  scroll: { flex: 1, width: "100%" },
  content: {
    width: "100%",
    alignItems: "stretch",
    paddingHorizontal: tokens.space.lg,
    paddingTop: 24,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: "flex-start"
  },
  pop: {
    position: "absolute",
    top: 64,
    alignSelf: "center",
    zIndex: 30
  },
  popText: {
    fontSize: tokens.font.body,
    fontWeight: "900",
    color: tokens.color.correctDark
  },
  footer: {
    paddingHorizontal: tokens.space.lg,
    paddingTop: tokens.space.md,
    gap: tokens.space.md,
    backgroundColor: tokens.color.bg
  },
  backdrop: {
    flex: 1,
    backgroundColor: tokens.color.scrim,
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: tokens.color.card,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    padding: tokens.space.xl,
    paddingBottom: tokens.space.xxl,
    gap: tokens.space.md
  },
  sheetTitle: { fontSize: tokens.font.prompt, fontWeight: "800", color: tokens.color.text },
  sheetBody: { fontSize: tokens.font.body, lineHeight: 24, color: tokens.color.textSecondary },
  ghost: { alignItems: "center", paddingVertical: tokens.space.md },
  ghostText: { fontSize: tokens.font.body, fontWeight: "700", color: tokens.color.textMuted }
});
export {
  LessonScreen
};
