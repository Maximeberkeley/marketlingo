import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../lib/constants";
function SocialAvatar({ name, size = 44, ring, ringWidth = 2.5, dim = false, dashed = false, tint }) {
  return /* @__PURE__ */ React.createElement(View, { style: [styles.avatar, {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: ringWidth,
    borderColor: ring ?? COLORS.border,
    borderStyle: dashed ? "dashed" : "solid",
    backgroundColor: tint ?? COLORS.bg1,
    opacity: dim ? 0.55 : 1
  }] }, /* @__PURE__ */ React.createElement(Text, { style: [styles.initial, { fontSize: Math.round(size * 0.38) }] }, (name.trim().charAt(0) || "?").toUpperCase()));
}
const styles = StyleSheet.create({
  avatar: { alignItems: "center", justifyContent: "center" },
  initial: { fontWeight: "800", color: COLORS.textPrimary }
});
export {
  SocialAvatar
};
