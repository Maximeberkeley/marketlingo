import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { tokens } from "../theme/tokens";
import { Prompt, shuffle, tap, tick, useShake } from "./shared";
import { ColorText } from "../components/ColorText";
function chainSlotHint(slot, total) {
  if (slot === 0) return "Tap the first step";
  if (slot === total - 1) return "Tap the last step";
  return "Tap the next step";
}
function BuildChain({ exercise, phase, onChange }) {
  const bank = useMemo(
    () => shuffle(exercise.steps.map((label, i) => ({ label, i }))),
    [exercise.id]
  );
  const [used, setUsed] = useState([]);
  const [wrongs, setWrongs] = useState(0);
  const { shake, translateX } = useShake();
  const pulse = useMemo(() => new Animated.Value(0), [exercise.id]);
  useEffect(() => {
    setUsed([]);
    setWrongs(0);
    onChange({ canCheck: false, isCorrect: false });
  }, [exercise.id]);
  const complete = used.length === exercise.steps.length;
  useEffect(() => {
    if (!complete) return;
    onChange({ canCheck: true, isCorrect: wrongs === 0 });
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 260, useNativeDriver: true })
    ]).start();
  }, [complete, wrongs]);
  const pick = (stepIndex) => {
    if (phase === "feedback" || complete) return;
    if (used.includes(stepIndex)) return;
    if (stepIndex === used.length) {
      tick(true);
      setUsed((u) => [...u, stepIndex]);
    } else {
      tick(false);
      setWrongs((w) => w + 1);
      shake();
    }
  };
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(Prompt, { eyebrow: "Build the chain", text: exercise.prompt }), /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.chain, { transform: [{ scale }] }] }, exercise.steps.map((_, slot) => {
    const filled = slot < used.length;
    const placeholder = chainSlotHint(slot, exercise.steps.length);
    return /* @__PURE__ */ React.createElement(View, { key: slot, style: styles.slotRow }, /* @__PURE__ */ React.createElement(View, { style: [styles.slot, filled && styles.slotFilled] }, /* @__PURE__ */ React.createElement(Text, { style: [styles.slotNum, filled && styles.slotNumFilled] }, slot + 1), /* @__PURE__ */ React.createElement(
      ColorText,
      {
        text: filled ? exercise.steps[used[slot]] : placeholder,
        style: [styles.slotText, filled && styles.slotTextFilled],
        maxSentences: 1e4,
        maxLength: 1e6
      }
    )), slot < exercise.steps.length - 1 && /* @__PURE__ */ React.createElement(
      Feather,
      {
        name: "chevron-down",
        size: 12,
        color: filled ? tokens.color.accent : tokens.color.border,
        style: styles.arrow
      }
    ));
  })), /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.bank, { transform: [{ translateX }] }] }, bank.map(({ label, i }) => {
    const spent = used.includes(i);
    return /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        key: i,
        disabled: spent || phase === "feedback",
        onPress: () => {
          tap();
          pick(i);
        },
        style: [styles.tile, spent && styles.tileSpent]
      },
      /* @__PURE__ */ React.createElement(Text, { style: [styles.tileText, spent && styles.tileTextSpent] }, label)
    );
  })));
}
const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: 0, maxWidth: "100%", alignSelf: "stretch" },
  chain: { gap: 0 },
  slotRow: { alignItems: "stretch" },
  slot: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.md,
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
    paddingVertical: 8,
    paddingHorizontal: tokens.space.md,
    minHeight: 44
  },
  slotFilled: {
    borderStyle: "solid",
    borderColor: tokens.color.accent,
    backgroundColor: tokens.color.accentSoft
  },
  slotNum: {
    fontSize: tokens.font.caption,
    fontWeight: "900",
    color: tokens.color.textMuted,
    width: 16,
    textAlign: "center"
  },
  slotNumFilled: { color: tokens.color.accentDark },
  slotText: { flex: 1, minWidth: 0, flexShrink: 1, fontSize: tokens.font.caption + 2, fontWeight: "600", color: tokens.color.textMuted },
  slotTextFilled: { color: tokens.color.text, fontWeight: "800" },
  arrow: { alignSelf: "center", marginVertical: 0 },
  bank: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space.sm,
    marginTop: tokens.space.md
  },
  tile: {
    maxWidth: "100%",
    minWidth: 0,
    flexShrink: 1,
    paddingHorizontal: tokens.space.md,
    paddingVertical: 8,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.card,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    borderBottomWidth: 4
  },
  tileSpent: {
    backgroundColor: tokens.color.disabled,
    borderColor: tokens.color.disabled,
    borderBottomWidth: 2
  },
  tileText: { flexShrink: 1, minWidth: 0, maxWidth: "100%", fontSize: tokens.font.caption + 2, fontWeight: "800", color: tokens.color.text },
  tileTextSpent: { color: tokens.color.disabledText }
});
export {
  BuildChain,
  chainSlotHint
};
