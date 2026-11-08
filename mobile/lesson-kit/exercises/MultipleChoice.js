import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { ChoiceCard } from "../components/ChoiceCard";
import { answerTag, choiceStateFor } from "../components/answerState";
import { tokens } from "../theme/tokens";
import { ColorText } from "../components/ColorText";
import { choiceOrder } from "../components/choiceOrder";
function MultipleChoice({ exercise, phase, onChange }) {
  const [selected, setSelected] = useState(null);
  const order = useMemo(() => choiceOrder(exercise.options.length, `${exercise.id}|${exercise.prompt}`), [exercise.id, exercise.prompt, exercise.options.length]);
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
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(ColorText, { text: exercise.prompt, style: styles.prompt, maxSentences: 2, maxLength: 120 }), /* @__PURE__ */ React.createElement(View, { style: styles.options }, order.map((i) => exercise.options[i]).map((option, pos) => {
    const i = order[pos];
    return /* @__PURE__ */ React.createElement(
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
    );
  })));
}
const styles = StyleSheet.create({
  wrap: { gap: tokens.space.xl },
  prompt: { fontSize: tokens.font.prompt, fontWeight: "800", color: tokens.color.text, lineHeight: 28 },
  options: { gap: tokens.space.md }
});
export {
  MultipleChoice
};
