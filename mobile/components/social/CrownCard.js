import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../lib/constants";
import { isDark } from "../../lib/theme";
import { LeoAnimated } from "../mascot/LeoAnimated";
import { ChunkyButton } from "./ChunkyButton";
import { crownCopy } from "../../lib/crown";
const LEO_KING = require("../../assets/mascot/leo-king.png");
const GOLD_TEXT = isDark ? COLORS.gold : "#B7791F";
function CrownCard({ crown, onAction }) {
  const copy = crownCopy(crown);
  return /* @__PURE__ */ React.createElement(View, { style: styles.card, accessibilityRole: "summary" }, /* @__PURE__ */ React.createElement(View, { style: styles.leo, pointerEvents: "none" }, /* @__PURE__ */ React.createElement(LeoAnimated, { clip: "leo-king", size: 138, fallback: LEO_KING })), /* @__PURE__ */ React.createElement(View, { style: styles.body }, /* @__PURE__ */ React.createElement(Text, { style: styles.kicker }, "THIS MONTH'S CROWN"), /* @__PURE__ */ React.createElement(Text, { style: styles.title, numberOfLines: 2 }, copy.title), /* @__PURE__ */ React.createElement(Text, { style: styles.line, numberOfLines: 2 }, copy.line), /* @__PURE__ */ React.createElement(ChunkyButton, { label: copy.action, onPress: onAction, height: 40, style: styles.button })));
}
const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
    minHeight: 150,
    borderRadius: 22,
    borderWidth: 2,
    borderBottomWidth: 5,
    backgroundColor: isDark ? "rgba(252, 211, 77, 0.12)" : "#FFF7E0",
    borderColor: isDark ? "rgba(252, 211, 77, 0.45)" : "#F6D77A"
  },
  leo: { width: 132, height: 146, marginLeft: 2, alignItems: "center", justifyContent: "flex-end" },
  body: { flex: 1, minWidth: 0, paddingVertical: 14, paddingRight: 14 },
  kicker: { fontSize: 11, fontWeight: "900", letterSpacing: 1, color: GOLD_TEXT },
  title: { fontSize: 18, fontWeight: "900", color: COLORS.textPrimary, marginTop: 4, lineHeight: 22 },
  line: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, marginTop: 3, lineHeight: 17 },
  button: { alignSelf: "flex-start", marginTop: 10, minWidth: 140 }
});
export {
  CrownCard
};
