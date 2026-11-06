import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { tokens } from "../theme/tokens";
import { ColorText } from "./ColorText";
import { shortLabel } from "../text";
function splitSource(text) {
  const raw = (text || "").trim();
  const m = raw.match(/^([\s\S]*?)\s*\(?\bSource:\s*([\s\S]+?)\)?\.?\s*$/i);
  if (!m) return { insight: raw, source: "" };
  return { insight: m[1].trim(), source: m[2].trim() };
}
function FeedbackFooter({ isCorrect, explanation, correctAnswer, whyWrong, review }) {
  const [expanded, setExpanded] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const insets = useSafeAreaInsets();
  const tint = isCorrect ? tokens.color.correctDark : tokens.color.incorrectDark;
  const { insight, source } = splitSource(explanation || "");
  const hasMore = Boolean(insight && insight.length > 150);
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(View, { style: styles.headRow }, /* @__PURE__ */ React.createElement(Feather, { name: isCorrect ? "check-circle" : "x-circle", size: 20, color: tint }), /* @__PURE__ */ React.createElement(Text, { style: [styles.title, { color: tint }] }, isCorrect ? "Correct" : "Not quite")), !isCorrect && !!correctAnswer && /* @__PURE__ */ React.createElement(ColorText, { text: `Answer: ${shortLabel(correctAnswer)}`, style: styles.body, maxSentences: 1, maxLength: 96 }), !isCorrect && !!whyWrong && /* @__PURE__ */ React.createElement(Text, { style: styles.why }, whyWrong), !!insight && /* @__PURE__ */ React.createElement(ColorText, { text: insight, style: styles.body, maxSentences: expanded ? 100 : 2, maxLength: expanded ? 1e4 : 150 }), !!source && /* @__PURE__ */ React.createElement(Text, { style: styles.source }, "Source: ", source), hasMore && /* @__PURE__ */ React.createElement(TouchableOpacity, { accessibilityRole: "button", accessibilityState: { expanded }, style: styles.more, onPress: () => setExpanded((value) => !value) }, /* @__PURE__ */ React.createElement(Text, { style: [styles.moreText, { color: tint }] }, expanded ? "Show less" : "Read full reasoning"), /* @__PURE__ */ React.createElement(Feather, { name: expanded ? "chevron-up" : "chevron-down", size: 15, color: tint })), !isCorrect && !!review && /* @__PURE__ */ React.createElement(TouchableOpacity, { accessibilityRole: "button", style: styles.more, onPress: () => setReviewing(true) }, /* @__PURE__ */ React.createElement(Feather, { name: "book-open", size: 15, color: tokens.color.accentDark }), /* @__PURE__ */ React.createElement(Text, { style: [styles.moreText, { color: tokens.color.accentDark }] }, "Review this in the lesson")), !!review && /* @__PURE__ */ React.createElement(Modal, { visible: reviewing, transparent: true, animationType: "slide", onRequestClose: () => setReviewing(false) }, /* @__PURE__ */ React.createElement(View, { style: styles.sheetBackdrop }, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.sheetDismiss, accessibilityLabel: "Back to the question", onPress: () => setReviewing(false) }), /* @__PURE__ */ React.createElement(View, { style: [styles.sheet, { paddingBottom: insets.bottom + tokens.space.lg }] }, /* @__PURE__ */ React.createElement(View, { style: styles.sheetHandle }), /* @__PURE__ */ React.createElement(Text, { style: styles.sheetEyebrow }, "FROM YOUR LESSON"), /* @__PURE__ */ React.createElement(Text, { style: styles.sheetTitle }, review.title), /* @__PURE__ */ React.createElement(ScrollView, { style: styles.sheetScroll, contentContainerStyle: { paddingBottom: tokens.space.md } }, /* @__PURE__ */ React.createElement(Text, { style: styles.sheetBody }, review.body)), /* @__PURE__ */ React.createElement(TouchableOpacity, { accessibilityRole: "button", style: styles.sheetButton, onPress: () => setReviewing(false) }, /* @__PURE__ */ React.createElement(Text, { style: styles.sheetButtonText }, "Back to the question"))))));
}
const styles = StyleSheet.create({
  source: { marginTop: 8, fontSize: 13, lineHeight: 18, fontWeight: "600", color: tokens.color.textMuted },
  wrap: {
    paddingHorizontal: tokens.space.lg,
    paddingTop: tokens.space.md,
    paddingBottom: tokens.space.sm,
    backgroundColor: tokens.color.bg
  },
  headRow: { flexDirection: "row", alignItems: "center", gap: tokens.space.sm },
  title: { fontSize: tokens.font.prompt, fontWeight: "800" },
  body: {
    marginTop: tokens.space.sm,
    fontSize: tokens.font.caption + 1,
    lineHeight: 20,
    color: tokens.color.textSecondary
  },
  more: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start" },
  moreText: { fontSize: 13, fontWeight: "800" },
  why: { marginTop: tokens.space.sm, fontSize: tokens.font.caption + 1, lineHeight: 20, fontWeight: "700", color: tokens.color.text },
  sheetBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheetDismiss: { flex: 1 },
  sheet: {
    maxHeight: "75%",
    backgroundColor: tokens.color.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: tokens.space.lg,
    paddingTop: tokens.space.sm
  },
  sheetHandle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: tokens.color.border, marginBottom: tokens.space.md },
  sheetEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, color: tokens.color.textMuted },
  sheetTitle: { marginTop: 4, fontSize: tokens.font.prompt, fontWeight: "800", color: tokens.color.text },
  sheetScroll: { marginTop: tokens.space.sm, flexGrow: 0 },
  sheetBody: { fontSize: tokens.font.body, lineHeight: 24, color: tokens.color.text },
  sheetButton: { minHeight: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: tokens.color.accent },
  sheetButtonText: { fontSize: 16, fontWeight: "800", color: tokens.color.textOnAccent }
});
export {
  FeedbackFooter,
  splitSource
};
