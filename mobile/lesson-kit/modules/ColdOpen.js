import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { tokens } from "../theme/tokens";
import { ColorText } from "../components/ColorText";
import { shortLabel } from "../text";
import { BriefingReader } from "../components/BriefingReader";
import { BriefingButton } from "../components/BriefingButton";
import { cardTerms, hasExtraBriefing } from "../cardPresentation";
function ColdOpen({ exercise, onChange }) {
  const [showBriefing, setShowBriefing] = useState(false);
  const hasBriefing = hasExtraBriefing(exercise);
  useEffect(() => {
    onChange({ canCheck: true, isCorrect: true });
  }, [exercise.id]);
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(View, { style: styles.card }, /* @__PURE__ */ React.createElement(View, { style: styles.coverSky }), /* @__PURE__ */ React.createElement(View, { style: styles.coverCopy }, !!exercise.eyebrow && /* @__PURE__ */ React.createElement(Text, { style: styles.eyebrow }, shortLabel(exercise.eyebrow).toUpperCase()), /* @__PURE__ */ React.createElement(ColorText, { text: exercise.headline, style: [styles.headline, headlineSize(exercise.headline)], maxSentences: 4, maxLength: 260 }), !!exercise.kicker && /* @__PURE__ */ React.createElement(ColorText, { text: exercise.kicker, style: styles.kicker, maxSentences: 1, maxLength: 80, glossary: true, keyTerms: cardTerms(exercise), excludedText: [exercise.headline] }), hasBriefing && /* @__PURE__ */ React.createElement(View, { style: styles.readButton }, /* @__PURE__ */ React.createElement(BriefingButton, { text: exercise.fullText, onPress: () => setShowBriefing(true) }))), /* @__PURE__ */ React.createElement(View, { style: styles.coverFoot })), hasBriefing && /* @__PURE__ */ React.createElement(
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
function headlineSize(text) {
  if (text.length > 120) return { fontSize: 24, lineHeight: 31 };
  if (text.length > 80) return { fontSize: 28, lineHeight: 34 };
  return null;
}
const styles = StyleSheet.create({
  wrap: { flexGrow: 1, flexShrink: 0, minWidth: 0, maxWidth: "100%", alignSelf: "stretch" },
  card: {
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 0,
    maxWidth: "100%",
    backgroundColor: tokens.color.coldOpen,
    borderRadius: tokens.radius.lg,
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
  readButton: { marginTop: 4 }
});
export {
  ColdOpen
};
