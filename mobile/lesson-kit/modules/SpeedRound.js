import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { tokens } from "../theme/tokens";
import { Prompt, tick } from "./shared";
import { ColorText } from "../components/ColorText";
function SpeedRound({ exercise, phase, onChange }) {
  const total = exercise.seconds ?? Math.max(12, exercise.rounds.length * 6);
  const [index, setIndex] = useState(0);
  const [hits, setHits] = useState(0);
  const [flash, setFlash] = useState("none");
  const [left, setLeft] = useState(total);
  const bar = useRef(new Animated.Value(1)).current;
  const flashTimer = useRef(null);
  const finished = index >= exercise.rounds.length || left <= 0;
  useEffect(() => {
    setIndex(0);
    setHits(0);
    setLeft(total);
    setFlash("none");
    bar.setValue(1);
    onChange({ canCheck: false, isCorrect: false });
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, [exercise.id]);
  useEffect(() => {
    Animated.timing(bar, {
      toValue: Math.max(0, left / total),
      duration: 220,
      useNativeDriver: false
    }).start();
  }, [bar, left, total]);
  useEffect(() => {
    if (phase === "feedback" || finished) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1e3);
    return () => clearInterval(t);
  }, [phase, finished]);
  useEffect(() => {
    if (!finished) return;
    bar.stopAnimation();
    const pass = hits >= Math.ceil(exercise.rounds.length * 0.7);
    onChange({ canCheck: true, isCorrect: pass, score: exercise.rounds.length ? hits / exercise.rounds.length : 1 });
  }, [finished, hits]);
  const round = exercise.rounds[index];
  const answer = (i) => {
    if (!round || phase === "feedback" || finished) return;
    const right = i === round.correctIndex;
    tick(right);
    if (right) setHits((h) => h + 1);
    setFlash(right ? "good" : "bad");
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash("none"), 220);
    setIndex((n) => n + 1);
  };
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(Prompt, { eyebrow: "Beat the clock", text: exercise.prompt }), /* @__PURE__ */ React.createElement(View, { style: styles.timerRow }, /* @__PURE__ */ React.createElement(View, { style: styles.timerTrack }, /* @__PURE__ */ React.createElement(
    Animated.View,
    {
      style: [
        styles.timerFill,
        { width: bar.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }
      ]
    }
  )), /* @__PURE__ */ React.createElement(Text, { style: styles.timerText }, left, "s")), /* @__PURE__ */ React.createElement(
    View,
    {
      style: [
        styles.stage,
        flash === "good" && styles.stageGood,
        flash === "bad" && styles.stageBad
      ]
    },
    finished ? /* @__PURE__ */ React.createElement(Text, { style: styles.score }, hits, " / ", exercise.rounds.length, " right") : /* @__PURE__ */ React.createElement(ColorText, { text: round.question, style: styles.question, maxSentences: 1, maxLength: 90 })
  ), !finished && /* @__PURE__ */ React.createElement(View, { style: styles.options }, round.options.map((o, i) => /* @__PURE__ */ React.createElement(TouchableOpacity, { key: i, activeOpacity: 0.85, style: styles.option, onPress: () => answer(i) }, /* @__PURE__ */ React.createElement(ColorText, { text: o, style: styles.optionText, maxSentences: 1, maxLength: 64 })))), /* @__PURE__ */ React.createElement(Text, { style: styles.counter }, Math.min(index, exercise.rounds.length), " / ", exercise.rounds.length));
}
const styles = StyleSheet.create({
  wrap: { flex: 1 },
  timerRow: { flexDirection: "row", alignItems: "center", gap: tokens.space.md },
  timerTrack: {
    flex: 1,
    height: 8,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.track,
    overflow: "hidden"
  },
  timerFill: { height: 8, borderRadius: tokens.radius.pill, backgroundColor: tokens.color.heart },
  timerText: { fontSize: tokens.font.caption, fontWeight: "900", color: tokens.color.textSecondary, width: 34 },
  stage: {
    minHeight: 110,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.surface,
    borderWidth: 2,
    borderColor: tokens.color.border,
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space.lg,
    marginTop: tokens.space.lg
  },
  stageGood: { borderColor: tokens.color.correct, backgroundColor: tokens.color.correctSoft },
  stageBad: { borderColor: tokens.color.incorrect, backgroundColor: tokens.color.incorrectSoft },
  question: {
    fontSize: tokens.font.prompt,
    fontWeight: "800",
    color: tokens.color.text,
    textAlign: "center",
    lineHeight: 27
  },
  score: { fontSize: 30, fontWeight: "900", color: tokens.color.text },
  options: { gap: tokens.space.sm, marginTop: tokens.space.lg },
  option: {
    minHeight: 52,
    justifyContent: "center",
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.card,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    borderBottomWidth: 4,
    paddingHorizontal: tokens.space.lg
  },
  optionText: { fontSize: tokens.font.body, fontWeight: "800", color: tokens.color.text },
  counter: {
    marginTop: tokens.space.md,
    textAlign: "center",
    fontSize: tokens.font.caption,
    fontWeight: "700",
    color: tokens.color.textMuted
  }
});
export {
  SpeedRound
};
