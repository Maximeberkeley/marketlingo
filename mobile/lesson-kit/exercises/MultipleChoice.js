import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { ChoiceCard } from "../components/ChoiceCard";
import { tokens } from "../theme/tokens";
import { ColorText } from "../components/ColorText";
function MultipleChoice({ exercise, phase, onChange }) {
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    setSelected(null);
    onChange({ canCheck: false, isCorrect: false });
  }, [exercise.id]);
  const pick = (index) => {
    if (phase === "feedback") return;
    setSelected(index);
    onChange({ canCheck: true, isCorrect: index === exercise.correctIndex, selectedIndex: index });
  };
  const stateFor = (index) => {
    if (phase === "feedback") {
      if (index === exercise.correctIndex) return "correct";
      if (index === selected) return "incorrect";
      return "idle";
    }
    return index === selected ? "selected" : "idle";
  };
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(ColorText, { text: exercise.prompt, style: styles.prompt, maxSentences: 2, maxLength: 120 }), /* @__PURE__ */ React.createElement(View, { style: styles.options }, exercise.options.map((option, i) => /* @__PURE__ */ React.createElement(
    ChoiceCard,
    {
      key: `${exercise.id}-${i}`,
      label: option,
      state: stateFor(i),
      onPress: () => pick(i),
      disabled: phase === "feedback"
    }
  ))));
}
const styles = StyleSheet.create({
  wrap: { gap: tokens.space.xl },
  prompt: { fontSize: tokens.font.prompt, fontWeight: "800", color: tokens.color.text, lineHeight: 28 },
  options: { gap: tokens.space.md }
});
export {
  MultipleChoice
};
