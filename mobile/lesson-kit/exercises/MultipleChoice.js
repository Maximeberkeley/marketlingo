import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { ChoiceCard } from "../components/ChoiceCard";
import { answerTag, choiceStateFor } from "../components/answerState";
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
  const revealed = phase === "feedback";
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(ColorText, { text: exercise.prompt, style: styles.prompt, maxSentences: 2, maxLength: 120 }), /* @__PURE__ */ React.createElement(View, { style: styles.options }, exercise.options.map((option, i) => /* @__PURE__ */ React.createElement(
    ChoiceCard,
    {
      key: `${exercise.id}-${i}`,
      label: option,
      state: choiceStateFor(i, selected, exercise.correctIndex, revealed),
      tag: answerTag(i, selected, exercise.correctIndex, revealed),
      revealed,
      onPress: () => pick(i),
      disabled: revealed
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
