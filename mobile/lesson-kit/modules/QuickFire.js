import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { tokens } from "../theme/tokens";
import { Prompt, tick } from "./shared";
import { ColorText } from "../components/ColorText";
const QUICK_FIRE_MISSES_ALLOWED = 1;
function QuickFire({ exercise, phase, onChange }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [flash, setFlash] = useState("none");
  const flashTimer = useRef(null);
  const total = exercise.cards.length;
  const finished = answers.length >= total;
  useEffect(() => {
    setIndex(0);
    setAnswers([]);
    setFlash("none");
    onChange({ canCheck: false, isCorrect: false });
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, [exercise.id]);
  const answer = (saysTrue) => {
    if (phase === "feedback" || finished) return;
    const card2 = exercise.cards[index];
    const right = card2.isTrue === saysTrue;
    tick(right);
    const next = [...answers, right];
    setAnswers(next);
    setFlash(right ? "good" : "bad");
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => {
      setFlash("none");
      setIndex((i) => Math.min(total - 1, i + 1));
    }, 420);
    if (next.length === total) {
      const misses = next.filter((ok) => !ok).length;
      onChange({ canCheck: true, isCorrect: misses <= QUICK_FIRE_MISSES_ALLOWED });
    }
  };
  const reveal = phase === "feedback";
  const card = exercise.cards[Math.min(index, total - 1)];
  const lastRight = answers[answers.length - 1];
  if (reveal || finished && flash === "none") {
    return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(Prompt, { eyebrow: "Quick fire", text: exercise.prompt }), /* @__PURE__ */ React.createElement(Text, { style: styles.score }, answers.filter(Boolean).length, " of ", total, " right"), /* @__PURE__ */ React.createElement(View, { style: styles.review }, exercise.cards.map((c, i) => {
      const ok = answers[i];
      return /* @__PURE__ */ React.createElement(View, { key: i, style: [styles.reviewRow, ok === false && styles.reviewRowMissed] }, /* @__PURE__ */ React.createElement(Feather, { name: ok ? "check-circle" : "x-circle", size: 18, color: ok ? tokens.color.correctDark : tokens.color.incorrectDark }), /* @__PURE__ */ React.createElement(View, { style: styles.reviewCopy }, /* @__PURE__ */ React.createElement(Text, { style: styles.reviewVerdict }, c.isTrue ? "TRUE" : "FALSE"), /* @__PURE__ */ React.createElement(ColorText, { text: c.text, style: styles.reviewText, maxSentences: 2, maxLength: 150 }), !c.isTrue && !!c.why && /* @__PURE__ */ React.createElement(Text, { style: styles.reviewWhy }, c.why)));
    })));
  }
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(Prompt, { eyebrow: "Quick fire", text: exercise.prompt }), /* @__PURE__ */ React.createElement(View, { style: styles.dots, accessibilityLabel: `Card ${Math.min(index + 1, total)} of ${total}` }, exercise.cards.map((_, i) => /* @__PURE__ */ React.createElement(
    View,
    {
      key: i,
      style: [
        styles.dot,
        i === answers.length && styles.dotCurrent,
        answers[i] === true && styles.dotGood,
        answers[i] === false && styles.dotBad
      ]
    }
  ))), /* @__PURE__ */ React.createElement(View, { style: [styles.card, flash === "good" && styles.cardGood, flash === "bad" && styles.cardBad] }, flash !== "none" && /* @__PURE__ */ React.createElement(Text, { style: [styles.verdict, { color: lastRight ? tokens.color.correctDark : tokens.color.incorrectDark }] }, lastRight ? "Right" : `It's ${card.isTrue ? "true" : "false"}`), /* @__PURE__ */ React.createElement(ColorText, { text: card.text, style: styles.cardText, maxSentences: 2, maxLength: 150 })), /* @__PURE__ */ React.createElement(View, { style: styles.buttons }, [false, true].map((value) => /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      key: String(value),
      activeOpacity: 0.85,
      onPress: () => answer(value),
      disabled: flash !== "none",
      accessibilityRole: "button",
      accessibilityLabel: value ? "True" : "False",
      style: [styles.button, value ? styles.buttonTrue : styles.buttonFalse]
    },
    /* @__PURE__ */ React.createElement(Feather, { name: value ? "check" : "x", size: 22, color: value ? tokens.color.correctDark : tokens.color.incorrectDark }),
    /* @__PURE__ */ React.createElement(Text, { style: [styles.buttonText, { color: value ? tokens.color.correctDark : tokens.color.incorrectDark }] }, value ? "True" : "False")
  ))));
}
const styles = StyleSheet.create({
  wrap: { flex: 1 },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: tokens.space.md },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: tokens.color.track },
  dotCurrent: { backgroundColor: tokens.color.accent },
  dotGood: { backgroundColor: tokens.color.correct },
  dotBad: { backgroundColor: tokens.color.incorrect },
  card: {
    minHeight: 150,
    borderRadius: tokens.radius.xl,
    borderWidth: 2,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.card,
    padding: tokens.space.xl,
    justifyContent: "center",
    gap: tokens.space.sm
  },
  cardGood: { borderColor: tokens.color.correct, backgroundColor: tokens.color.correctSoft },
  cardBad: { borderColor: tokens.color.incorrect, backgroundColor: tokens.color.incorrectSoft },
  verdict: { fontSize: 12, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  cardText: { fontSize: tokens.font.prompt - 1, lineHeight: 26, fontWeight: "700", color: tokens.color.text },
  buttons: { flexDirection: "row", gap: tokens.space.md, marginTop: tokens.space.lg },
  button: {
    flex: 1,
    minHeight: 60,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: tokens.color.card
  },
  buttonTrue: { borderColor: tokens.color.correct },
  buttonFalse: { borderColor: tokens.color.incorrect },
  buttonText: { fontSize: tokens.font.button, fontWeight: "900" },
  score: { fontSize: 22, fontWeight: "900", color: tokens.color.text, marginBottom: tokens.space.md },
  review: { gap: tokens.space.sm },
  reviewRow: {
    flexDirection: "row",
    gap: tokens.space.md,
    alignItems: "flex-start",
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface
  },
  reviewRowMissed: { backgroundColor: tokens.color.incorrectSoft },
  reviewCopy: { flex: 1, gap: 2 },
  reviewVerdict: { fontSize: 11, fontWeight: "900", letterSpacing: 0.8, color: tokens.color.textMuted },
  reviewText: { fontSize: tokens.font.body - 1, lineHeight: 21, color: tokens.color.text },
  reviewWhy: { fontSize: tokens.font.caption, lineHeight: 18, color: tokens.color.textSecondary }
});
export {
  QUICK_FIRE_MISSES_ALLOWED,
  QuickFire
};
