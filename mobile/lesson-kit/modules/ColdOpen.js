import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { tokens } from "../theme/tokens";
import { ColorText } from "../components/ColorText";
import { shortLabel } from "../text";
import { BriefingReader } from "../components/BriefingReader";
import { cardTerms, hasExtraBriefing } from "../cardPresentation";
function ColdOpen({ exercise, onChange }) {
  const [showBriefing, setShowBriefing] = useState(false);
  const hasBriefing = hasExtraBriefing(exercise);
  useEffect(() => {
    onChange({ canCheck: true, isCorrect: true });
  }, [exercise.id]);
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(View, { style: styles.card }, /* @__PURE__ */ React.createElement(View, { style: styles.coverSky }), /* @__PURE__ */ React.createElement(View, { style: styles.coverCopy }, !!exercise.eyebrow && /* @__PURE__ */ React.createElement(Text, { style: styles.eyebrow }, shortLabel(exercise.eyebrow).toUpperCase()), /* @__PURE__ */ React.createElement(ColorText, { text: exercise.headline, style: styles.headline, maxSentences: 4, maxLength: 260 }), !!exercise.kicker && /* @__PURE__ */ React.createElement(ColorText, { text: exercise.kicker, style: styles.kicker, maxSentences: 1, maxLength: 80, glossary: true, keyTerms: cardTerms(exercise), excludedText: [exercise.headline] }), hasBriefing && /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      accessibilityRole: "button",
      accessibilityLabel: "Read full briefing",
      activeOpacity: 0.82,
      style: styles.readButton,
      onPress: () => setShowBriefing(true)
    },
    /* @__PURE__ */ React.createElement(View, { style: styles.readIcon }, /* @__PURE__ */ React.createElement(Feather, { name: "file-text", size: 15, color: tokens.color.accent })),
    /* @__PURE__ */ React.createElement(View, { style: styles.readCopy }, /* @__PURE__ */ React.createElement(Text, { style: styles.readTitle }, "Read briefing"), /* @__PURE__ */ React.createElement(Text, { style: styles.readNote }, "Full context \xB7 readable view")),
    /* @__PURE__ */ React.createElement(Feather, { name: "chevron-right", size: 18, color: tokens.color.textMuted })
  )), /* @__PURE__ */ React.createElement(View, { style: styles.coverFoot })), hasBriefing && /* @__PURE__ */ React.createElement(
    BriefingReader,
    {
      visible: showBriefing,
      title: exercise.detailTitle || exercise.eyebrow || "Briefing",
      eyebrow: exercise.eyebrow,
      text: exercise.fullText || "",
      keyTerms: cardTerms(exercise),
      sources: exercise.sources,
      onClose: () => setShowBriefing(false)
    }
  ));
}
const styles = StyleSheet.create({
  wrap: { flexGrow: 1, flexShrink: 0, minWidth: 0, maxWidth: "100%", alignSelf: "stretch" },
  card: {
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 0,
    maxWidth: "100%",
    backgroundColor: tokens.color.coldOpen,
    minHeight: 300,
    padding: tokens.space.xl
  },
  coverSky: { flexGrow: 0.42, flexBasis: 0 },
  coverCopy: { flexShrink: 0, gap: tokens.space.md },
  coverFoot: { flexGrow: 0.58, flexBasis: 0 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    color: tokens.color.coldOpenText,
    opacity: 0.6
  },
  headline: { fontSize: 32, fontWeight: "800", color: tokens.color.coldOpenText, lineHeight: 38 },
  kicker: { fontSize: tokens.font.body, color: tokens.color.coldOpenText, opacity: 0.75, lineHeight: 23 },
  readButton: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 11, marginTop: 4, paddingHorizontal: 13, borderRadius: tokens.radius.md, backgroundColor: tokens.color.surface, borderWidth: 1, borderColor: tokens.color.border },
  readIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: tokens.color.accentSoft },
  readCopy: { flex: 1, minWidth: 0 },
  readTitle: { fontSize: 15, fontWeight: "800", color: tokens.color.text },
  readNote: { marginTop: 2, fontSize: 11, fontWeight: "600", color: tokens.color.textMuted }
});
export {
  ColdOpen
};
