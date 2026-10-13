import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ColorText } from "./ColorText";
import { colonList } from "../cardPresentation";
import { interviewQA } from "../glossary";
import { tokens } from "../theme/tokens";
const ALL = { maxSentences: 1e4, maxLength: 1e6, glossary: true };
function ReadingCopy({ text, body = "", evidence = false, preserveCover = false, keyTerms }) {
  const copyProps = { ...ALL, keyTerms };
  const qa = interviewQA([text, body].filter(Boolean).join(" "));
  if (qa) {
    return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, !!qa.before && /* @__PURE__ */ React.createElement(ColorText, { text: qa.before, style: styles.body, ...copyProps }), /* @__PURE__ */ React.createElement(View, { style: styles.qCard }, /* @__PURE__ */ React.createElement(Text, { style: styles.chip }, "INTERVIEW QUESTION"), /* @__PURE__ */ React.createElement(ColorText, { text: qa.question, style: styles.question, ...copyProps })), /* @__PURE__ */ React.createElement(View, { style: styles.aCard }, /* @__PURE__ */ React.createElement(Text, { style: [styles.chip, styles.aChip] }, "SAMPLE ANSWER"), /* @__PURE__ */ React.createElement(ColorText, { text: qa.answer, style: styles.answer, ...copyProps })));
  }
  const headlineList = preserveCover ? null : colonList(text);
  const followingBody = [headlineList?.body, body].filter(Boolean).join("\n\n");
  const rows = (items) => /* @__PURE__ */ React.createElement(View, null, items.map((item, index) => /* @__PURE__ */ React.createElement(View, { key: `${index}-${item}`, style: [styles.row, index > 0 && styles.divider] }, /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 15, color: tokens.color.accent, style: styles.check }), /* @__PURE__ */ React.createElement(ColorText, { text: item, style: styles.rowText, ...copyProps }))));
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, !!text && /* @__PURE__ */ React.createElement(ColorText, { text: headlineList?.headline || text, style: evidence ? styles.body : styles.headline, ...copyProps }), headlineList && rows(headlineList.items), !!followingBody && /* @__PURE__ */ React.createElement(ColorText, { text: followingBody, style: styles.body, ...copyProps }));
}
const styles = StyleSheet.create({
  wrap: { gap: tokens.space.lg, minWidth: 0 },
  headline: { fontSize: 32, lineHeight: 38, fontWeight: "800", color: tokens.color.text },
  body: { fontSize: 19, lineHeight: 28, fontWeight: "400", color: tokens.color.text, opacity: 0.8 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: tokens.space.md, paddingVertical: tokens.space.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: tokens.color.border },
  check: { marginTop: 6 },
  rowText: { flex: 1, minWidth: 0, fontSize: 19, lineHeight: 28, color: tokens.color.text, opacity: 0.8 },
  qCard: { gap: tokens.space.sm, padding: tokens.space.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.color.surface, borderWidth: 1, borderColor: tokens.color.border },
  aCard: { marginTop: tokens.space.xs, gap: tokens.space.sm, padding: tokens.space.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.color.accentSoft, borderLeftWidth: 3, borderLeftColor: tokens.color.accent },
  chip: { fontSize: 11, fontWeight: "900", letterSpacing: 0.8, color: tokens.color.textSecondary },
  aChip: { color: tokens.color.accent },
  question: { fontSize: 20, lineHeight: 27, fontWeight: "800", color: tokens.color.text },
  answer: { fontSize: 17, lineHeight: 26, color: tokens.color.text }
});
export {
  ReadingCopy
};
