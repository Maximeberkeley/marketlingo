import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { tokens } from "../theme/tokens";
import { Prompt, tap, useEnter } from "./shared";
import { ColorText } from "../components/ColorText";
import { AnswerMark, AnswerTag } from "../components/AnswerMark";
import { answerTag, choiceStateFor } from "../components/answerState";
import { choiceOrder } from "../components/choiceOrder";
function SpotTheFake({ exercise, phase, onChange }) {
  const [picked, setPicked] = useState(null);
  const enter = useEnter(exercise.id);
  useEffect(() => {
    setPicked(null);
    onChange({ canCheck: false, isCorrect: false });
  }, [exercise.id]);
  const choose = (i) => {
    if (phase === "feedback") return;
    tap();
    setPicked(i);
    onChange({ canCheck: true, isCorrect: i === exercise.fakeIndex, selectedIndex: i });
  };
  const order = useMemo(() => choiceOrder(exercise.statements.length, `${exercise.id}|${exercise.prompt}|${exercise.statements[0] || ""}`), [exercise.id, exercise.prompt, exercise.statements]);
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(Prompt, { eyebrow: "Spot the fake", text: exercise.prompt }), order.map((i, pos) => {
    const s = exercise.statements[i];
    const reveal = phase === "feedback";
    const isFake = i === exercise.fakeIndex;
    const state = choiceStateFor(i, picked, exercise.fakeIndex, reveal);
    const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [14 * (pos + 1), 0] });
    return /* @__PURE__ */ React.createElement(Animated.View, { key: i, style: { opacity: enter, transform: [{ translateY }] } }, /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        activeOpacity: 0.9,
        onPress: () => choose(i),
        disabled: reveal,
        accessibilityRole: "button",
        accessibilityState: { selected: state === "selected" },
        style: [
          styles.row,
          state === "selected" && styles.rowPicked,
          state === "correct" && styles.rowFake,
          state === "incorrect" && styles.rowMiss,
          reveal && state === "idle" && styles.rowStepBack
        ]
      },
      /* @__PURE__ */ React.createElement(View, { style: styles.iconWrap }, reveal ? /* @__PURE__ */ React.createElement(
        Feather,
        {
          name: isFake ? "alert-triangle" : "check",
          size: 18,
          color: isFake ? tokens.color.correctDark : tokens.color.textMuted
        }
      ) : /* @__PURE__ */ React.createElement(Text, { style: styles.rowNum }, pos + 1)),
      /* @__PURE__ */ React.createElement(View, { style: styles.rowCopy }, /* @__PURE__ */ React.createElement(ColorText, { text: s, style: styles.rowText, maxSentences: 1, maxLength: 90 }), /* @__PURE__ */ React.createElement(AnswerTag, { text: answerTag(i, picked, exercise.fakeIndex, reveal, "The fake"), state })),
      /* @__PURE__ */ React.createElement(AnswerMark, { state, revealed: reveal })
    ));
  }));
}
const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.md },
  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.space.md,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    backgroundColor: tokens.color.card,
    padding: tokens.space.lg
  },
  rowPicked: { borderColor: tokens.color.accent, backgroundColor: tokens.color.accentSoft },
  rowFake: { borderColor: tokens.color.correct, backgroundColor: tokens.color.correctSoft },
  rowMiss: { borderColor: tokens.color.incorrect, backgroundColor: tokens.color.incorrectSoft },
  rowStepBack: { opacity: 0.55 },
  rowCopy: { flex: 1, minWidth: 0 },
  iconWrap: { width: 22, alignItems: "center", paddingTop: 1 },
  rowNum: { fontSize: tokens.font.caption, fontWeight: "900", color: tokens.color.textMuted },
  rowText: { fontSize: tokens.font.body, fontWeight: "600", color: tokens.color.text, lineHeight: 22 }
});
export {
  SpotTheFake
};
