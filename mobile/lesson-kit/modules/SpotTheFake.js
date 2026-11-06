import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { tokens } from "../theme/tokens";
import { Prompt, tap, useEnter } from "./shared";
import { ColorText } from "../components/ColorText";
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
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(Prompt, { eyebrow: "Spot the fake", text: exercise.prompt }), exercise.statements.map((s, i) => {
    const reveal = phase === "feedback";
    const isFake = i === exercise.fakeIndex;
    const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [14 * (i + 1), 0] });
    return /* @__PURE__ */ React.createElement(Animated.View, { key: i, style: { opacity: enter, transform: [{ translateY }] } }, /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        activeOpacity: 0.9,
        onPress: () => choose(i),
        style: [
          styles.row,
          picked === i && styles.rowPicked,
          reveal && isFake && styles.rowFake,
          reveal && picked === i && !isFake && styles.rowMiss
        ]
      },
      /* @__PURE__ */ React.createElement(View, { style: styles.iconWrap }, reveal ? /* @__PURE__ */ React.createElement(
        Feather,
        {
          name: isFake ? "x-circle" : "check-circle",
          size: 18,
          color: isFake ? tokens.color.incorrectDark : tokens.color.correctDark
        }
      ) : /* @__PURE__ */ React.createElement(Text, { style: styles.rowNum }, i + 1)),
      /* @__PURE__ */ React.createElement(ColorText, { text: s, style: styles.rowText, maxSentences: 1, maxLength: 90 })
    ));
  }));
}
const styles = StyleSheet.create({
  wrap: { flex: 1, gap: tokens.space.md },
  row: {
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
  rowFake: { borderColor: tokens.color.incorrect, backgroundColor: tokens.color.incorrectSoft },
  rowMiss: { borderColor: tokens.color.incorrect },
  iconWrap: { width: 22, alignItems: "center", paddingTop: 1 },
  rowNum: { fontSize: tokens.font.caption, fontWeight: "900", color: tokens.color.textMuted },
  rowText: { flex: 1, fontSize: tokens.font.body, fontWeight: "600", color: tokens.color.text, lineHeight: 22 }
});
export {
  SpotTheFake
};
