import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { tokens } from "../theme/tokens";
import { briefingNote } from "../cardPresentation";
const BRIEFING_BUTTON_TITLE = "Read the full briefing";
function BriefingButton({ text, onPress }) {
  const note = briefingNote(text);
  return /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      accessibilityRole: "button",
      accessibilityLabel: `${BRIEFING_BUTTON_TITLE}. ${note}`,
      activeOpacity: 0.82,
      style: styles.button,
      onPress
    },
    /* @__PURE__ */ React.createElement(View, { style: styles.icon }, /* @__PURE__ */ React.createElement(Feather, { name: "book-open", size: 15, color: tokens.color.accent })),
    /* @__PURE__ */ React.createElement(View, { style: styles.copy }, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, BRIEFING_BUTTON_TITLE), /* @__PURE__ */ React.createElement(Text, { style: styles.note }, note)),
    /* @__PURE__ */ React.createElement(Feather, { name: "chevron-right", size: 18, color: tokens.color.textMuted })
  );
}
const styles = StyleSheet.create({
  button: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 13, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surface, borderWidth: 1, borderColor: tokens.color.border },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: tokens.color.accentSoft },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: "800", color: tokens.color.text },
  note: { marginTop: 2, fontSize: 11, fontWeight: "600", color: tokens.color.textMuted }
});
export {
  BRIEFING_BUTTON_TITLE,
  BriefingButton
};
