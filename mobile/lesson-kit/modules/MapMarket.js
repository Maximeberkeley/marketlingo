import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { tokens } from "../theme/tokens";
import { Prompt, tap, useEnter } from "./shared";
import { ColorText } from "../components/ColorText";
import { shortLabel } from "../text";
function MapMarket({ exercise, phase, onChange }) {
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
    onChange({ canCheck: true, isCorrect: i === exercise.correctIndex, selectedIndex: i });
  };
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(Prompt, { eyebrow: "Map the market", text: exercise.prompt }), /* @__PURE__ */ React.createElement(View, { style: styles.board }, /* @__PURE__ */ React.createElement(View, { style: styles.spine }), exercise.nodes.map((n, i) => {
    const reveal = phase === "feedback";
    const right = i === exercise.correctIndex;
    const offset = i % 2 === 0 ? styles.nodeLeft : styles.nodeRight;
    const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
    return /* @__PURE__ */ React.createElement(Animated.View, { key: i, style: [styles.nodeRow, { opacity: enter, transform: [{ scale }] }] }, /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        activeOpacity: 0.9,
        onPress: () => choose(i),
        style: [
          styles.node,
          offset,
          picked === i && styles.nodePicked,
          reveal && right && styles.nodeRight2,
          reveal && picked === i && !right && styles.nodeWrong
        ]
      },
      /* @__PURE__ */ React.createElement(Text, { style: styles.nodeLabel }, shortLabel(n.label)),
      !!n.sub && /* @__PURE__ */ React.createElement(ColorText, { text: n.sub, style: styles.nodeSub, maxSentences: 1, maxLength: 70 })
    ));
  })));
}
const styles = StyleSheet.create({
  wrap: { flex: 1 },
  board: { position: "relative", paddingVertical: tokens.space.sm },
  spine: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: tokens.color.border
  },
  nodeRow: { marginBottom: tokens.space.md },
  node: {
    width: "78%",
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    backgroundColor: tokens.color.card,
    padding: tokens.space.md,
    gap: 2
  },
  nodeLeft: { alignSelf: "flex-start" },
  nodeRight: { alignSelf: "flex-end" },
  nodePicked: { borderColor: tokens.color.accent, backgroundColor: tokens.color.accentSoft },
  nodeRight2: { borderColor: tokens.color.correct, backgroundColor: tokens.color.correctSoft },
  nodeWrong: { borderColor: tokens.color.incorrect, backgroundColor: tokens.color.incorrectSoft },
  nodeLabel: { fontSize: tokens.font.body, fontWeight: "800", color: tokens.color.text },
  nodeSub: { fontSize: tokens.font.caption, color: tokens.color.textSecondary }
});
export {
  MapMarket
};
