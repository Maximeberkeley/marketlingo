import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { parseRichText } from "../../lib/richText";
function RichText({ text, style, color }) {
  const blocks = useMemo(() => parseRichText(text), [text]);
  const base = { fontSize: 15, lineHeight: 22, color, ...style || {} };
  const spans = (list) => list.map((s, i) => /* @__PURE__ */ React.createElement(Text, { key: i, style: [s.bold && styles.bold, s.italic && styles.italic] }, s.text));
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, blocks.map((b, i) => {
    if (b.kind === "heading") return /* @__PURE__ */ React.createElement(Text, { key: i, style: [base, styles.bold, { marginTop: i ? 4 : 0 }] }, spans(b.spans));
    if (b.kind === "para") return /* @__PURE__ */ React.createElement(Text, { key: i, style: base }, spans(b.spans));
    return /* @__PURE__ */ React.createElement(View, { key: i, style: styles.item }, /* @__PURE__ */ React.createElement(Text, { style: [base, styles.marker] }, b.kind === "number" ? `${b.n}.` : "\u2022"), /* @__PURE__ */ React.createElement(Text, { style: [base, styles.itemText] }, spans(b.spans)));
  }));
}
const styles = StyleSheet.create({
  wrap: { gap: 8 },
  bold: { fontWeight: "800" },
  italic: { fontStyle: "italic" },
  item: { flexDirection: "row", gap: 8 },
  marker: { minWidth: 14, fontWeight: "800" },
  itemText: { flex: 1 }
});
export {
  RichText
};
