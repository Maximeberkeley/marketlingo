import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { tokens } from "../theme/tokens";
function AnswerMark({ state, revealed }) {
  if (state === "correct") return /* @__PURE__ */ React.createElement(Feather, { name: "check-circle", size: 22, color: tokens.color.correctDark, style: styles.icon });
  if (state === "incorrect") return /* @__PURE__ */ React.createElement(Feather, { name: "x-circle", size: 22, color: tokens.color.incorrectDark, style: styles.icon });
  if (revealed) return /* @__PURE__ */ React.createElement(View, { style: styles.spacer });
  return /* @__PURE__ */ React.createElement(View, { style: [styles.ring, state === "selected" && styles.ringSelected] }, state === "selected" && /* @__PURE__ */ React.createElement(View, { style: styles.dot }));
}
function AnswerTag({ text, state }) {
  if (!text) return null;
  return /* @__PURE__ */ React.createElement(Text, { style: [styles.tag, { color: state === "incorrect" ? tokens.color.incorrectDark : tokens.color.correctDark }] }, text.toUpperCase());
}
const styles = StyleSheet.create({
  icon: { marginLeft: tokens.space.sm },
  spacer: { width: 22, marginLeft: tokens.space.sm },
  ring: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: tokens.color.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: tokens.space.sm
  },
  ringSelected: { borderColor: tokens.color.accent },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: tokens.color.accent },
  tag: { marginTop: 6, fontSize: 11, fontWeight: "900", letterSpacing: 0.6 }
});
export {
  AnswerMark,
  AnswerTag
};
