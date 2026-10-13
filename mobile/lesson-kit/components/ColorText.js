import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { shortText } from "../text";
import { glossaryFor } from "../glossary";
import { useDeepDiveTarget } from "./DeepDiveContext";
import { tokens } from "../theme/tokens";
const SIGNAL = /(\$?\d[\d,.]*(?:%|[KMBT])?)/gi;
const NUMBER = /^\$?\d/i;
function figures(text, keyPrefix) {
  return text.split(SIGNAL).map((part, index) => NUMBER.test(part) ? /* @__PURE__ */ React.createElement(Text, { key: `${keyPrefix}-${index}`, style: { fontWeight: "800" } }, part) : part);
}
function ColorText({ text, style, maxSentences = 2, maxLength = 170, numberOfLines, glossary = false, keyTerms }) {
  const { marketId } = useDeepDiveTarget();
  const [open, setOpen] = useState(null);
  const shown = shortText(text, maxSentences, maxLength);
  const terms = useMemo(() => glossary ? glossaryFor(marketId, keyTerms) : null, [glossary, marketId, keyTerms]);
  const content = useMemo(() => {
    if (!terms) return figures(shown, "f");
    const out = [];
    let last = 0;
    for (const m of shown.matchAll(terms.pattern)) {
      const entry = terms.lookup(m[0]);
      const at = m.index ?? 0;
      if (!entry) continue;
      out.push(...figures(shown.slice(last, at), `p${at}`));
      out.push(/* @__PURE__ */ React.createElement(Text, { key: `t${at}`, style: styles.term, onPress: () => setOpen(entry), suppressHighlighting: true }, m[0]));
      last = at + m[0].length;
    }
    out.push(...figures(shown.slice(last), "end"));
    return out;
  }, [shown, terms]);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style, numberOfLines }, content), terms && /* @__PURE__ */ React.createElement(Modal, { visible: !!open, transparent: true, animationType: "fade", onRequestClose: () => setOpen(null) }, /* @__PURE__ */ React.createElement(Pressable, { style: styles.scrim, onPress: () => setOpen(null), accessibilityLabel: "Close definition" }, /* @__PURE__ */ React.createElement(View, { style: styles.sheet }, /* @__PURE__ */ React.createElement(Text, { style: styles.sheetTerm }, open?.term), /* @__PURE__ */ React.createElement(Text, { style: styles.sheetDef }, open?.definition), /* @__PURE__ */ React.createElement(Text, { style: styles.sheetHint }, "Tap anywhere to close")))));
}
const styles = StyleSheet.create({
  term: { color: tokens.color.accent, fontWeight: "700", textDecorationLine: "underline", textDecorationStyle: "dotted", textDecorationColor: tokens.color.accent },
  scrim: { flex: 1, backgroundColor: tokens.color.scrim, justifyContent: "flex-end", padding: tokens.space.lg, paddingBottom: 40 },
  sheet: { backgroundColor: tokens.color.card, borderRadius: tokens.radius.xl, padding: tokens.space.xl, gap: tokens.space.sm, borderWidth: 1, borderColor: tokens.color.border },
  sheetTerm: { fontSize: 20, fontWeight: "800", color: tokens.color.accent },
  sheetDef: { fontSize: 17, lineHeight: 25, color: tokens.color.text },
  sheetHint: { marginTop: tokens.space.xs, fontSize: 12, fontWeight: "600", color: tokens.color.textMuted }
});
export {
  ColorText
};
