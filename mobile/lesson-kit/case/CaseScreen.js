import React, { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { tokens } from "../theme/tokens";
import { PrimaryButton } from "../components/PrimaryButton";
import { FeedbackFooter } from "../components/FeedbackFooter";
import { LeoCoach } from "../components/LeoCoach";
import { renderExerciseByKind, isPassiveKind } from "../components/ExerciseRenderer";
import { gradeCase } from "./buildCase";
import { playSound } from "../../lib/sounds";
import { getMarketWorld } from "../../data/marketWorlds";
import { BriefingReader } from "../components/BriefingReader";
import { trackEvent } from "../../lib/analytics";
const CONFIDENCE = [
  { key: "low", label: "Not sure", note: "Small position, check again next week" },
  { key: "medium", label: "Fairly sure", note: "Normal position" },
  { key: "high", label: "Certain", note: "Larger position" }
];
const PLAIN_CONFIDENCE = [
  { key: "low", label: "Not sure", note: "I could see this going either way" },
  { key: "medium", label: "Fairly sure", note: "I would back this with a reason" },
  { key: "high", label: "Certain", note: "I would defend this out loud" }
];
const GRADE_COLOR = {
  A: "#22C55E",
  B: "#0EA5E9",
  C: "#F59E0B",
  D: "#EF4444"
};
function CaseScreen({ deepCase, marketId, marketName, onExit, onFinish, goal }) {
  React.useEffect(() => {
    trackEvent("case_started", { caseId: deepCase.id });
  }, [deepCase.id]);
  const CONVICTION = goal === "invest" ? CONFIDENCE : PLAIN_CONFIDENCE;
  const insets = useSafeAreaInsets();
  const world = getMarketWorld(marketId);
  const [stageIndex, setStageIndex] = useState(0);
  const [phase, setPhase] = useState("answering");
  const [state, setState] = useState({ canCheck: false, isCorrect: false });
  const [correct, setCorrect] = useState(0);
  const [graded, setGraded] = useState(0);
  const [confidence, setConfidence] = useState(null);
  const [askConfidence, setAskConfidence] = useState(false);
  const [callCorrect, setCallCorrect] = useState(false);
  const [debrief, setDebrief] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [banking, setBanking] = useState(false);
  const stage = deepCase.stages[stageIndex];
  const passive = isPassiveKind(stage?.exercise.kind);
  const isCall = stage?.key === "call";
  const advance = useCallback(() => {
    if (stageIndex < deepCase.stages.length - 1) {
      setStageIndex((i) => i + 1);
      setPhase("answering");
      setState({ canCheck: false, isCorrect: false });
      return;
    }
    playSound("lessonComplete").catch(() => {
    });
    setDebrief(true);
  }, [deepCase.stages.length, stageIndex]);
  const check = useCallback(() => {
    setGraded((g) => g + 1);
    if (state.isCorrect) {
      setCorrect((c) => c + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
      });
      playSound("correct").catch(() => {
      });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {
      });
      playSound("wrong").catch(() => {
      });
    }
    if (isCall) setCallCorrect(state.isCorrect);
    setPhase("feedback");
  }, [isCall, state.isCorrect]);
  const onAction = useCallback(() => {
    if (passive) {
      advance();
      return;
    }
    if (phase === "answering") {
      if (!state.canCheck) return;
      if (isCall && !confidence) {
        setAskConfidence(true);
        return;
      }
      check();
      return;
    }
    advance();
  }, [advance, check, confidence, isCall, passive, phase, state.canCheck]);
  const correctAnswerText = useMemo(() => {
    const ex = stage?.exercise;
    if (!ex) return void 0;
    if (ex.kind === "multipleChoice") return ex.options[ex.correctIndex];
    if (ex.kind === "theCall") return ex.options[ex.correctIndex];
    if (ex.kind === "spotFake") return ex.statements[ex.fakeIndex];
    if (ex.kind === "mapMarket") return ex.nodes[ex.correctIndex]?.label;
    if (ex.kind === "faceOff") return ex.correctIndex === 0 ? ex.left.name : ex.right.name;
    return void 0;
  }, [stage]);
  if (debrief) {
    const result = gradeCase(correct, graded, callCorrect, confidence || "medium");
    const xp = { A: 90, B: 70, C: 45, D: 25 }[result.grade];
    return /* @__PURE__ */ React.createElement(View, { style: [styles.root, { paddingTop: insets.top + 12 }] }, /* @__PURE__ */ React.createElement(ScrollView, { contentContainerStyle: styles.debriefScroll, showsVerticalScrollIndicator: false }, /* @__PURE__ */ React.createElement(
      LinearGradient,
      {
        colors: [GRADE_COLOR[result.grade], world.colors[1]],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
        style: styles.gradeHero
      },
      /* @__PURE__ */ React.createElement(Text, { style: styles.gradeKicker }, "CASE VERDICT"),
      /* @__PURE__ */ React.createElement(Text, { style: styles.gradeLetter }, result.grade),
      /* @__PURE__ */ React.createElement(Text, { style: styles.gradeNote }, result.note)
    ), /* @__PURE__ */ React.createElement(View, { style: styles.debriefRow }, /* @__PURE__ */ React.createElement(DebriefStat, { icon: "check-circle", label: "Stages right", value: `${correct + Math.max(0, deepCase.stages.length - graded)}/${deepCase.stages.length}` }), /* @__PURE__ */ React.createElement(DebriefStat, { icon: "flag", label: "Final call", value: callCorrect ? "Correct" : "Missed" }), /* @__PURE__ */ React.createElement(
      DebriefStat,
      {
        icon: "activity",
        label: "How sure",
        value: CONVICTION.find((c) => c.key === confidence)?.label || "Standard"
      }
    )), !!deepCase.proReasoning && /* @__PURE__ */ React.createElement(DebriefBlock, { icon: "award", title: "How a pro reads it", body: deepCase.proReasoning, tint: tokens.color.accent }), !!deepCase.commonMistake && /* @__PURE__ */ React.createElement(DebriefBlock, { icon: "alert-triangle", title: "Where most people slip", body: deepCase.commonMistake, tint: tokens.color.signalEnergy }), !!deepCase.mentalModel && /* @__PURE__ */ React.createElement(DebriefBlock, { icon: "compass", title: "Keep this model", body: deepCase.mentalModel, tint: tokens.color.signalData }), /* @__PURE__ */ React.createElement(
      LeoCoach,
      {
        line: "Another case solved. Your reasoning is getting sharper.",
        mood: result.grade === "A" || result.grade === "B" ? "celebrate" : "thinking"
      }
    ), /* @__PURE__ */ React.createElement(
      PrimaryButton,
      {
        label: banking ? "Saving your case\u2026" : `Bank +${xp} XP`,
        variant: banking ? "disabled" : "primary",
        onPress: () => {
          if (banking) return;
          setBanking(true);
          onFinish({
            grade: result.grade,
            correct,
            total: graded,
            callCorrect,
            confidence: confidence || "medium",
            xp
          });
        }
      }
    ), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.ghostBtn, onPress: onExit, disabled: banking, activeOpacity: 0.8 }, /* @__PURE__ */ React.createElement(Text, { style: styles.ghostText }, "Back to practice"))));
  }
  if (!stage) {
    return /* @__PURE__ */ React.createElement(View, { style: [styles.root, styles.centered] }, /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, "No case ready"), /* @__PURE__ */ React.createElement(Text, { style: styles.emptyBody }, "We need more ", marketName, " case material. Try a lesson first."), /* @__PURE__ */ React.createElement(PrimaryButton, { label: "Back to practice", onPress: onExit }));
  }
  const buttonVariant = phase === "feedback" ? state.isCorrect ? "correct" : "incorrect" : passive || state.canCheck ? "primary" : "disabled";
  const buttonLabel = passive ? "Open the case" : phase === "feedback" ? stageIndex === deepCase.stages.length - 1 ? "See your result" : "Next stage" : isCall ? "Make the call" : "Check my read";
  return /* @__PURE__ */ React.createElement(View, { style: [styles.root, { paddingTop: insets.top + 8 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.railRow }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => setShowExit(true), hitSlop: 10, style: { width: 34 } }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 20, color: tokens.color.textMuted })), /* @__PURE__ */ React.createElement(View, { style: styles.rail }, deepCase.stages.map((s, i) => {
    const done = i < stageIndex;
    const active = i === stageIndex;
    return /* @__PURE__ */ React.createElement(View, { key: s.key, style: styles.railItem }, /* @__PURE__ */ React.createElement(
      View,
      {
        style: [
          styles.railDot,
          done && { backgroundColor: tokens.color.correct, borderColor: tokens.color.correct },
          active && { borderColor: tokens.color.accent, backgroundColor: tokens.color.accentSoft }
        ]
      },
      done ? /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 11, color: "#FFFFFF" }) : /* @__PURE__ */ React.createElement(Text, { style: [styles.railNum, active && { color: tokens.color.accent }] }, i + 1)
    ), /* @__PURE__ */ React.createElement(Text, { style: [styles.railLabel, active && { color: tokens.color.text, fontWeight: "800" }] }, s.label));
  }))), stage.hint ? /* @__PURE__ */ React.createElement(Text, { style: styles.stageHint }, stage.hint) : null, /* @__PURE__ */ React.createElement(ScrollView, { contentContainerStyle: styles.body, showsVerticalScrollIndicator: false }, !!stage.exercise.leo?.line && /* @__PURE__ */ React.createElement(LeoCoach, { line: stage.exercise.leo.line, mood: stage.exercise.leo.mood }), renderExerciseByKind(stage.exercise, phase, setState), isCall && confidence && phase === "answering" && /* @__PURE__ */ React.createElement(View, { style: styles.convictionChip }, /* @__PURE__ */ React.createElement(Feather, { name: "activity", size: 12, color: tokens.color.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.convictionChipText }, "How sure: ", CONVICTION.find((c) => c.key === confidence)?.label))), /* @__PURE__ */ React.createElement(View, { style: [styles.footer, { paddingBottom: insets.bottom + 12 }] }, phase === "feedback" && !passive && /* @__PURE__ */ React.createElement(
    FeedbackFooter,
    {
      isCorrect: state.isCorrect,
      explanation: stage.exercise.explanation,
      correctAnswer: correctAnswerText
    }
  ), /* @__PURE__ */ React.createElement(PrimaryButton, { label: buttonLabel, onPress: onAction, variant: buttonVariant })), /* @__PURE__ */ React.createElement(Modal, { visible: askConfidence, transparent: true, animationType: "slide" }, /* @__PURE__ */ React.createElement(View, { style: styles.sheetBackdrop }, /* @__PURE__ */ React.createElement(View, { style: styles.sheet }, /* @__PURE__ */ React.createElement(Text, { style: styles.sheetTitle }, "How sure are you?"), /* @__PURE__ */ React.createElement(Text, { style: styles.sheetBody }, "Calibration counts. Being loudly wrong costs more than being quietly right."), CONVICTION.map((opt) => /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      key: opt.key,
      style: styles.convictionOption,
      activeOpacity: 0.86,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        });
        setConfidence(opt.key);
        setAskConfidence(false);
        check();
      }
    },
    /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.convictionLabel }, opt.label), /* @__PURE__ */ React.createElement(Text, { style: styles.convictionNote }, opt.note)),
    /* @__PURE__ */ React.createElement(Feather, { name: "chevron-right", size: 18, color: tokens.color.textMuted })
  ))))), /* @__PURE__ */ React.createElement(Modal, { visible: showExit, transparent: true, animationType: "fade" }, /* @__PURE__ */ React.createElement(View, { style: styles.sheetBackdrop }, /* @__PURE__ */ React.createElement(View, { style: styles.sheet }, /* @__PURE__ */ React.createElement(Text, { style: styles.sheetTitle }, "Leave the case?"), /* @__PURE__ */ React.createElement(Text, { style: styles.sheetBody }, "You will lose your progress on this case."), /* @__PURE__ */ React.createElement(PrimaryButton, { label: "Stay on the case", onPress: () => setShowExit(false) }), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.ghostBtn, onPress: onExit, activeOpacity: 0.8 }, /* @__PURE__ */ React.createElement(Text, { style: styles.ghostText }, "Leave"))))));
}
function DebriefStat({
  icon,
  label,
  value
}) {
  return /* @__PURE__ */ React.createElement(View, { style: styles.debriefStat }, /* @__PURE__ */ React.createElement(Feather, { name: icon, size: 14, color: tokens.color.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.debriefValue }, value), /* @__PURE__ */ React.createElement(Text, { style: styles.debriefLabel }, label));
}
function DebriefBlock({
  icon,
  title,
  body,
  tint
}) {
  const [showDetail, setShowDetail] = useState(false);
  const long = body.length > 180;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(View, { style: styles.debriefBlock }, /* @__PURE__ */ React.createElement(View, { style: styles.debriefHead }, /* @__PURE__ */ React.createElement(Feather, { name: icon, size: 14, color: tint }), /* @__PURE__ */ React.createElement(Text, { style: [styles.debriefTitle, { color: tint }] }, title)), /* @__PURE__ */ React.createElement(Text, { style: styles.debriefBody, numberOfLines: long ? 3 : void 0 }, body), long && /* @__PURE__ */ React.createElement(TouchableOpacity, { accessibilityRole: "button", style: styles.debriefMore, onPress: () => setShowDetail(true) }, /* @__PURE__ */ React.createElement(Text, { style: [styles.debriefMoreText, { color: tint }] }, "Read full reasoning"), /* @__PURE__ */ React.createElement(Feather, { name: "arrow-up-right", size: 14, color: tint }))), /* @__PURE__ */ React.createElement(BriefingReader, { visible: showDetail, eyebrow: "CASE DEBRIEF", title, text: body, onClose: () => setShowDetail(false) }));
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  centered: { alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: tokens.color.text },
  emptyBody: { fontSize: 14, lineHeight: 21, color: tokens.color.textSecondary, textAlign: "center" },
  railRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 6 },
  rail: { flex: 1, flexDirection: "row", justifyContent: "space-between" },
  railItem: { alignItems: "center", gap: 4, flex: 1 },
  railDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: tokens.color.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.color.surface
  },
  railNum: { fontSize: 11, fontWeight: "800", color: tokens.color.textMuted },
  railLabel: { fontSize: 10, fontWeight: "600", color: tokens.color.textMuted },
  stageHint: {
    fontSize: 12,
    color: tokens.color.textSecondary,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 24
  },
  body: { padding: 16, paddingBottom: 28, gap: 14 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.color.border,
    backgroundColor: tokens.color.bg
  },
  convictionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: tokens.color.accentSoft
  },
  convictionChipText: { fontSize: 11, fontWeight: "700", color: tokens.color.accent },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(10,12,20,0.62)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: tokens.color.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 34,
    gap: 10
  },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: tokens.color.text },
  sheetBody: { fontSize: 13, lineHeight: 20, color: tokens.color.textSecondary, marginBottom: 4 },
  convictionOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border
  },
  convictionLabel: { fontSize: 15, fontWeight: "800", color: tokens.color.text },
  convictionNote: { fontSize: 11, color: tokens.color.textMuted, marginTop: 2 },
  ghostBtn: { alignItems: "center", paddingVertical: 14 },
  ghostText: { fontSize: 15, fontWeight: "700", color: tokens.color.textMuted },
  debriefScroll: { padding: 20, gap: 14 },
  gradeHero: { borderRadius: 26, padding: 24, alignItems: "center", gap: 4 },
  gradeKicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.6, color: "rgba(255,255,255,0.85)" },
  gradeLetter: { fontSize: 62, fontWeight: "900", color: "#FFFFFF", letterSpacing: -2 },
  gradeNote: { fontSize: 13, lineHeight: 20, color: "#FFFFFF", textAlign: "center" },
  debriefRow: { flexDirection: "row", gap: 10 },
  debriefStat: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border
  },
  debriefValue: { fontSize: 15, fontWeight: "800", color: tokens.color.text },
  debriefLabel: { fontSize: 9, fontWeight: "700", color: tokens.color.textMuted, letterSpacing: 0.4 },
  debriefBlock: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    gap: 6
  },
  debriefHead: { flexDirection: "row", alignItems: "center", gap: 7 },
  debriefTitle: { fontSize: 12, fontWeight: "800", letterSpacing: 0.4 },
  debriefBody: { fontSize: 14, lineHeight: 21, color: tokens.color.textSecondary },
  debriefMore: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start" },
  debriefMoreText: { fontSize: 13, fontWeight: "800" }
});
export {
  CaseScreen
};
