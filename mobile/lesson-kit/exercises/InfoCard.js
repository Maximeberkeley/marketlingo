import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { tokens } from "../theme/tokens";
import { ColorText } from "../components/ColorText";
import { shortLabel, shortText } from "../text";
import { BriefingReader } from "../components/BriefingReader";
import { cardCopy, cardTerms, hasExtraBriefing, readingCardKind } from "../cardPresentation";
import { ReadingCopy } from "../components/ReadingCopy";
function InfoCard({ exercise, onChange }) {
  const [showBriefing, setShowBriefing] = useState(false);
  const terms = cardTerms(exercise);
  const hasBriefing = hasExtraBriefing(exercise);
  const kind = readingCardKind(exercise);
  const [title, body] = cardCopy(exercise);
  useEffect(() => {
    onChange({ canCheck: true, isCorrect: true });
  }, [exercise.id]);
  const bodyIsEcho = !!exercise.title && normalize(exercise.body) === normalize(exercise.title);
  return /* @__PURE__ */ React.createElement(View, { style: [styles.wrap, kind === "takeaway" && styles.takeaway] }, kind === "takeaway" ? /* @__PURE__ */ React.createElement(Text, { style: styles.eyebrow }, "The rule") : !!exercise.eyebrow && /* @__PURE__ */ React.createElement(Text, { style: styles.eyebrow }, shortLabel(exercise.eyebrow)), /* @__PURE__ */ React.createElement(View, { style: kind === "evidence" ? styles.evidence : void 0 }, /* @__PURE__ */ React.createElement(ReadingCopy, { text: title, body: bodyIsEcho ? "" : body, preserveCover: kind === "takeaway", keyTerms: terms })), exercise.bullets?.slice(0, 2).map((b, i) => /* @__PURE__ */ React.createElement(View, { key: i, style: styles.bulletRow }, /* @__PURE__ */ React.createElement(View, { style: styles.dot }), /* @__PURE__ */ React.createElement(ColorText, { text: shortText(b, 1, 90), style: styles.bullet, maxSentences: 1, maxLength: 90, glossary: true, keyTerms: terms, excludedText: [title], precedingText: [bodyIsEcho ? "" : body, ...(exercise.bullets || []).slice(0, i).map((line) => shortText(line, 1, 90))] }))), terms.slice(0, 1).map((t, i) => /* @__PURE__ */ React.createElement(View, { key: `t${i}`, style: styles.termCard }, /* @__PURE__ */ React.createElement(Text, { style: styles.term }, shortLabel(t.term)), /* @__PURE__ */ React.createElement(ColorText, { text: t.definition, style: styles.termDef, maxSentences: 1, maxLength: 100 }))), !!exercise.sources?.length && /* @__PURE__ */ React.createElement(Text, { style: styles.sources }, "Sources: ", exercise.sources.map((s) => s.label).join(" \xB7 ")), hasBriefing && /* @__PURE__ */ React.createElement(TouchableOpacity, { accessibilityRole: "button", style: styles.readButton, activeOpacity: 0.82, onPress: () => setShowBriefing(true) }, /* @__PURE__ */ React.createElement(Feather, { name: "book-open", size: 16, color: tokens.color.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.readText }, "Read briefing"), /* @__PURE__ */ React.createElement(Feather, { name: "chevron-right", size: 17, color: tokens.color.textMuted })), hasBriefing && /* @__PURE__ */ React.createElement(BriefingReader, { visible: showBriefing, title: exercise.detailTitle || exercise.title || exercise.eyebrow || "Lesson briefing", text: exercise.fullText || "", keyTerms: terms, sources: exercise.sources, onClose: () => setShowBriefing(false) }));
}
function normalize(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
const styles = StyleSheet.create({
  wrap: { minWidth: 0, maxWidth: "100%", gap: tokens.space.md, alignSelf: "stretch" },
  takeaway: { backgroundColor: tokens.color.accentSoft, borderRadius: tokens.radius.lg, padding: tokens.space.xl },
  evidence: { backgroundColor: tokens.color.evidence, borderRadius: tokens.radius.md, padding: tokens.space.xl },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
    color: tokens.color.accent
  },
  title: { fontSize: 28, fontWeight: "800", color: tokens.color.text, lineHeight: 32 },
  body: { fontSize: tokens.font.body + 1, lineHeight: 26, color: tokens.color.text },
  bulletRow: { flexDirection: "row", gap: tokens.space.md, alignItems: "flex-start" },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 9,
    backgroundColor: tokens.color.accent
  },
  bullet: { flex: 1, fontSize: tokens.font.body, lineHeight: 24, color: tokens.color.textSecondary },
  termCard: {
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
    padding: tokens.space.lg,
    gap: 4
  },
  term: { fontSize: tokens.font.body, fontWeight: "800", color: tokens.color.text },
  termDef: { fontSize: tokens.font.body - 1, lineHeight: 22, color: tokens.color.textSecondary },
  sources: { fontSize: tokens.font.caption, color: tokens.color.textMuted },
  readButton: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surface, borderWidth: 1, borderColor: tokens.color.border },
  readText: { flex: 1, fontSize: 15, fontWeight: "800", color: tokens.color.text }
});
export {
  InfoCard
};
