import React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, TYPE } from "../../lib/constants";
import { presenter } from "../../lib/weeklyCase";
function Rich({ text, style }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return /* @__PURE__ */ React.createElement(Text, { style }, parts.map((part, i) => /^\*\*[^*]+\*\*$/.test(part) ? /* @__PURE__ */ React.createElement(Text, { key: i, style: styles.bold }, part.slice(2, -2)) : /* @__PURE__ */ React.createElement(Text, { key: i }, part)));
}
function Exhibit({ exhibit }) {
  const rows = [exhibit.columns, ...exhibit.rows];
  return /* @__PURE__ */ React.createElement(View, { style: styles.exhibit }, /* @__PURE__ */ React.createElement(Text, { style: styles.exhibitTitle }, exhibit.title), /* @__PURE__ */ React.createElement(View, null, rows.map((row, r) => /* @__PURE__ */ React.createElement(View, { key: r, style: [styles.tableRow, r === 0 && styles.tableHead] }, row.map((cell, c) => /* @__PURE__ */ React.createElement(
    Text,
    {
      key: c,
      style: [styles.cell, c === 0 ? styles.cellFirst : styles.cellNum, r === 0 && styles.cellHead]
    },
    cell
  ))))), exhibit.note ? /* @__PURE__ */ React.createElement(Text, { style: styles.exhibitNote }, exhibit.note) : null);
}
const when = (iso) => {
  const m = iso && /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";
};
function CaseBrief({ weekly, showQuestion = true }) {
  const by = presenter(weekly);
  return /* @__PURE__ */ React.createElement(View, { style: { gap: 14 } }, /* @__PURE__ */ React.createElement(View, { style: styles.topRow }, /* @__PURE__ */ React.createElement(View, { style: styles.topicChip }, /* @__PURE__ */ React.createElement(Text, { style: styles.topicText }, weekly.topic)), by ? /* @__PURE__ */ React.createElement(Text, { style: styles.byText, numberOfLines: 1 }, "Presented by ", by) : null), /* @__PURE__ */ React.createElement(Text, { style: styles.title }, weekly.title), weekly.hook ? /* @__PURE__ */ React.createElement(Text, { style: styles.hook }, weekly.hook) : null, weekly.brief.map((para, i) => /* @__PURE__ */ React.createElement(Rich, { key: i, text: para, style: styles.para })), weekly.exhibits.map((exhibit) => /* @__PURE__ */ React.createElement(Exhibit, { key: exhibit.id || exhibit.title, exhibit })), showQuestion ? /* @__PURE__ */ React.createElement(View, { style: styles.question }, /* @__PURE__ */ React.createElement(Text, { style: styles.questionLabel }, "YOUR QUESTION"), /* @__PURE__ */ React.createElement(Text, { style: styles.questionText }, weekly.question)) : null, weekly.sources.length > 0 || weekly.disclosure ? /* @__PURE__ */ React.createElement(View, { style: styles.sources }, weekly.disclosure ? /* @__PURE__ */ React.createElement(Text, { style: styles.sourceText }, weekly.disclosure) : null, weekly.sources.length > 0 ? /* @__PURE__ */ React.createElement(Text, { style: [styles.sourcesLabel, { marginTop: 6 }] }, "Sources") : null, weekly.sources.map((s, i) => {
    const label = `${s.title}${s.published ? ` \xB7 ${when(s.published)}` : ""}`;
    return s.url ? /* @__PURE__ */ React.createElement(TouchableOpacity, { key: s.id || i, onPress: () => Linking.openURL(s.url).catch(() => {
    }), accessibilityRole: "link" }, /* @__PURE__ */ React.createElement(Text, { style: [styles.sourceText, styles.sourceLink] }, label)) : /* @__PURE__ */ React.createElement(Text, { key: s.id || i, style: styles.sourceText }, label);
  })) : null);
}
const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  topicChip: { flexShrink: 1, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: COLORS.accentSoft },
  topicText: { ...TYPE.caption, color: COLORS.accent, fontSize: 12, lineHeight: 16, fontWeight: "800" },
  byText: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary, flexShrink: 1 },
  hook: { ...TYPE.body, fontSize: 17, lineHeight: 25, fontWeight: "600", color: COLORS.textSecondary },
  title: { ...TYPE.hero, fontSize: 26, lineHeight: 32, color: COLORS.textPrimary },
  para: { ...TYPE.body, fontSize: 16, lineHeight: 24, color: COLORS.textPrimary },
  bold: { fontWeight: "800" },
  exhibit: { padding: 14, borderRadius: 16, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
  exhibitTitle: { ...TYPE.overline, color: COLORS.textSecondary },
  tableRow: { flexDirection: "row", paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, gap: 8 },
  tableHead: { borderTopWidth: 0, paddingTop: 0 },
  cell: { fontSize: 13, lineHeight: 18, color: COLORS.textPrimary },
  cellFirst: { flex: 1.9, fontWeight: "600" },
  cellNum: { flex: 1, textAlign: "right", fontVariant: ["tabular-nums"] },
  cellHead: { fontSize: 11, fontWeight: "800", color: COLORS.textSecondary, letterSpacing: 0.4 },
  exhibitNote: { fontSize: 12, lineHeight: 17, color: COLORS.textMuted },
  question: { padding: 16, borderRadius: 16, backgroundColor: COLORS.accentSoft, borderLeftWidth: 4, borderLeftColor: COLORS.accent, gap: 6 },
  questionLabel: { ...TYPE.overline, color: COLORS.accent },
  questionText: { fontSize: 17, lineHeight: 24, fontWeight: "700", color: COLORS.textPrimary },
  sources: { gap: 4, paddingTop: 4 },
  sourcesLabel: { ...TYPE.overline, color: COLORS.textMuted },
  sourceText: { fontSize: 12, lineHeight: 17, color: COLORS.textMuted },
  sourceLink: { color: COLORS.accent, textDecorationLine: "underline" }
});
export {
  CaseBrief
};
