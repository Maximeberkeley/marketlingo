import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { tokens } from "../theme/tokens";
import { ColorText } from "../components/ColorText";
import { shortLabel } from "../text";
import { BriefingReader } from "../components/BriefingReader";
import { cardCopy, cardTerms, hasExtraBriefing, readingCardKind } from "../cardPresentation";
import { ReadingCopy, readingTermCopy } from "../components/ReadingCopy";
function MicroInsight({ exercise, onChange }) {
  const kind = readingCardKind(exercise);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showTerm, setShowTerm] = useState(false);
  const keyTerm = cardTerms(exercise)[0];
  const hasBriefing = hasExtraBriefing(exercise);
  const [headline, body, highlight] = cardCopy(exercise);
  useEffect(() => {
    onChange({ canCheck: true, isCorrect: true });
  }, [exercise.id]);
  return /* @__PURE__ */ React.createElement(View, { style: [styles.wrap, kind === "takeaway" && styles.takeaway] }, kind === "takeaway" ? /* @__PURE__ */ React.createElement(Text, { style: styles.eyebrow }, "The rule") : !!exercise.eyebrow && /* @__PURE__ */ React.createElement(Text, { style: styles.eyebrow }, shortLabel(exercise.eyebrow).toUpperCase()), /* @__PURE__ */ React.createElement(View, { style: kind === "evidence" ? styles.evidence : void 0 }, /* @__PURE__ */ React.createElement(ReadingCopy, { text: headline, body, evidence: kind === "evidence", preserveCover: kind === "takeaway", keyTerms: cardTerms(exercise) })), !!highlight && /* @__PURE__ */ React.createElement(View, { style: styles.highlight }, /* @__PURE__ */ React.createElement(ReadingCopy, { text: "", body: highlight, preserveCover: kind === "takeaway", keyTerms: cardTerms(exercise), ...readingTermCopy(headline, body, kind === "evidence", kind === "takeaway") })), !!keyTerm && /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      accessibilityRole: "button",
      accessibilityState: { expanded: showTerm },
      accessibilityLabel: `${showTerm ? "Hide" : "Show"} definition for ${keyTerm.term}`,
      activeOpacity: 0.84,
      style: styles.term,
      onPress: () => {
        Haptics.selectionAsync().catch(() => {
        });
        setShowTerm((current) => !current);
      }
    },
    /* @__PURE__ */ React.createElement(View, { style: styles.termHead }, /* @__PURE__ */ React.createElement(Text, { style: styles.termWord }, shortLabel(keyTerm.term)), /* @__PURE__ */ React.createElement(Feather, { name: showTerm ? "minus" : "plus", size: 17, color: tokens.color.accent })),
    showTerm && /* @__PURE__ */ React.createElement(ColorText, { text: keyTerm.definition, style: styles.termDef, maxSentences: 100, maxLength: 1e4 })
  ), hasBriefing && /* @__PURE__ */ React.createElement(TouchableOpacity, { accessibilityRole: "button", style: styles.goDeeper, activeOpacity: 0.82, onPress: () => setShowBriefing(true) }, /* @__PURE__ */ React.createElement(Feather, { name: "book-open", size: 16, color: tokens.color.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.goDeeperText }, "Go deeper"), /* @__PURE__ */ React.createElement(Feather, { name: "chevron-right", size: 17, color: tokens.color.textMuted })), hasBriefing && /* @__PURE__ */ React.createElement(BriefingReader, { visible: showBriefing, title: exercise.detailTitle || exercise.eyebrow || "Lesson briefing", text: exercise.fullText || "", keyTerms: cardTerms(exercise), sources: exercise.sources, onClose: () => setShowBriefing(false) }));
}
const styles = StyleSheet.create({
  wrap: { minWidth: 0, maxWidth: "100%", alignSelf: "stretch", gap: tokens.space.lg },
  takeaway: { backgroundColor: tokens.color.accentSoft, borderRadius: tokens.radius.lg, padding: tokens.space.xl },
  evidence: { backgroundColor: tokens.color.evidence, borderRadius: tokens.radius.md, padding: tokens.space.xl },
  quote: { fontSize: 22, lineHeight: 30, color: tokens.color.text, fontWeight: "500" },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 0, color: tokens.color.accent },
  text: { fontSize: 28, fontWeight: "800", color: tokens.color.text, lineHeight: 32 },
  highlight: {
    paddingTop: tokens.space.sm
  },
  highlightText: { fontSize: tokens.font.body, color: tokens.color.textSecondary, lineHeight: 23, fontWeight: "600" },
  term: {
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
    padding: tokens.space.md,
    gap: 3
  },
  termWord: { flex: 1, flexShrink: 1, minWidth: 0, fontSize: tokens.font.caption + 1, fontWeight: "900", color: tokens.color.accentDark },
  termHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  termDef: { marginTop: 7, fontSize: tokens.font.body, color: tokens.color.textSecondary, lineHeight: 24 },
  goDeeper: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surface, borderWidth: 1, borderColor: tokens.color.border },
  goDeeperText: { flex: 1, fontSize: 15, fontWeight: "800", color: tokens.color.text }
});
export {
  MicroInsight
};
