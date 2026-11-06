import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { tokens } from "../theme/tokens";
import { useRevealCorrectTarget } from "./RevealCorrect";
function AnswerMark({ state, revealed }) {
  const reveal = useRevealCorrectTarget();
  const slot = useRef(null);
  useEffect(() => {
    if (state !== "correct" || !reveal) return;
    const timer = setTimeout(() => reveal(slot.current), 320);
    return () => clearTimeout(timer);
  }, [state, reveal]);
  let mark = null;
  if (state === "correct") mark = /* @__PURE__ */ React.createElement(Feather, { name: "check-circle", size: 22, color: tokens.color.correctDark });
  else if (state === "incorrect") mark = /* @__PURE__ */ React.createElement(Feather, { name: "x-circle", size: 22, color: tokens.color.incorrectDark });
  else if (!revealed) {
    mark = /* @__PURE__ */ React.createElement(View, { style: [styles.ring, state === "selected" && styles.ringSelected] }, state === "selected" && /* @__PURE__ */ React.createElement(View, { style: styles.dot }));
  }
  return /* @__PURE__ */ React.createElement(View, { ref: slot, collapsable: false, style: styles.slot }, mark);
}
function AnswerTag({ text, state }) {
  if (!text) return null;
  return /* @__PURE__ */ React.createElement(Text, { style: [styles.tag, { color: state === "incorrect" ? tokens.color.incorrectDark : tokens.color.correctDark }] }, text.toUpperCase());
}
const styles = StyleSheet.create({
  slot: { width: 22, height: 22, marginLeft: tokens.space.sm, alignItems: "center", justifyContent: "center" },
  ring: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    alignItems: "center",
    justifyContent: "center"
  },
  ringSelected: { borderColor: tokens.color.accent },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: tokens.color.accent },
  tag: { marginTop: 6, fontSize: 11, fontWeight: "900", letterSpacing: 0.6 }
});
export {
  AnswerMark,
  AnswerTag
};
