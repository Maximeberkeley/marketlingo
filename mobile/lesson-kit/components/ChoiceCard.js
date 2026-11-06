import React from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { tokens } from "../theme/tokens";
import { ColorText } from "./ColorText";
import { AnswerMark, AnswerTag } from "./AnswerMark";
import { choiceA11yState } from "./answerState";
const BG = {
  idle: tokens.color.card,
  selected: tokens.color.accentSoft,
  correct: tokens.color.correctSoft,
  incorrect: tokens.color.incorrectSoft
};
const BORDER = {
  idle: tokens.color.border,
  selected: tokens.color.accent,
  correct: tokens.color.correct,
  incorrect: tokens.color.incorrect
};
const TEXT = {
  idle: tokens.color.text,
  selected: tokens.color.accentDark,
  correct: tokens.color.correctDark,
  incorrect: tokens.color.incorrectDark
};
function ChoiceCard({ label, state, onPress, disabled, tag = null, revealed = false }) {
  const a11y = [choiceA11yState(state), tag?.toLowerCase()].filter(Boolean).join(", ");
  return /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      activeOpacity: 0.85,
      disabled,
      onPress,
      accessibilityRole: "button",
      accessibilityState: { selected: state === "selected", disabled },
      accessibilityLabel: a11y ? `${label}, ${a11y}` : label,
      style: [styles.card, { backgroundColor: BG[state], borderColor: BORDER[state] }, revealed && state === "idle" && styles.stepBack]
    },
    /* @__PURE__ */ React.createElement(View, { style: styles.copy }, /* @__PURE__ */ React.createElement(ColorText, { text: label, style: [styles.label, { color: TEXT[state] }], maxSentences: 1e4, maxLength: 1e6 }), /* @__PURE__ */ React.createElement(AnswerTag, { text: tag, state })),
    /* @__PURE__ */ React.createElement(AnswerMark, { state, revealed })
  );
}
const styles = StyleSheet.create({
  card: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    alignSelf: "stretch",
    minHeight: tokens.size.choiceMinHeight,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    paddingVertical: tokens.space.md,
    paddingHorizontal: tokens.space.lg,
    flexDirection: "row",
    alignItems: "center"
  },
  stepBack: { opacity: 0.55 },
  copy: { flex: 1, minWidth: 0 },
  label: {
    minWidth: 0,
    flexShrink: 1,
    fontSize: tokens.font.body,
    fontWeight: "600",
    lineHeight: 22
  }
});
export {
  ChoiceCard
};
