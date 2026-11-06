import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { tokens } from "../theme/tokens";
const LEO_HINT_KEY = "@marketlingo/leo_quiz_hint_seen";
function shouldShowLeoHint(seen, passive, phase, leoOpen) {
  return !seen && !passive && phase === "answering" && !leoOpen;
}
function LeoHintBubble({ top, onPress }) {
  return /* @__PURE__ */ React.createElement(View, { pointerEvents: "box-none", style: [styles.anchor, { top }] }, /* @__PURE__ */ React.createElement(View, { style: styles.tail }), /* @__PURE__ */ React.createElement(TouchableOpacity, { accessibilityRole: "button", accessibilityLabel: "Ask Leo for a simpler explanation", onPress, style: styles.bubble, activeOpacity: 0.9 }, /* @__PURE__ */ React.createElement(Text, { style: styles.text }, "Stuck? Tap me for a simpler explanation.")));
}
const styles = StyleSheet.create({
  anchor: { position: "absolute", right: 10, alignItems: "flex-end", zIndex: 20 },
  tail: {
    width: 14,
    height: 14,
    marginRight: 16,
    marginBottom: -7,
    transform: [{ rotate: "45deg" }],
    backgroundColor: tokens.color.accent
  },
  bubble: {
    maxWidth: 240,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: tokens.color.accent,
    shadowColor: "#0F111A",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  text: { fontSize: 14, fontWeight: "700", lineHeight: 19, color: tokens.color.textOnAccent }
});
export {
  LEO_HINT_KEY,
  LeoHintBubble,
  shouldShowLeoHint
};
