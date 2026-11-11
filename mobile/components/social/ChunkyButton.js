import React, { useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../lib/constants";
const TONES = {
  accent: { face: COLORS.accent, lip: COLORS.courseCoinLip, text: "#FFFFFF" },
  streak: { face: COLORS.streak, lip: "#C2410C", text: "#FFFFFF" },
  success: { face: COLORS.success, lip: "#15803D", text: "#FFFFFF" },
  plain: { face: COLORS.bg2, lip: COLORS.courseMutedLip, text: COLORS.textPrimary, border: COLORS.border },
  // The shop's price buttons: dark text on gold reads in both themes.
  gold: { face: "#FFC83D", lip: "#D99A00", text: "#3A2600" }
};
const LIP = 4;
function ChunkyButton({ label, onPress, tone = "accent", icon, busy = false, disabled = false, style, height = 52, accessibilityLabel }) {
  const press = useRef(new Animated.Value(0)).current;
  const t = TONES[tone];
  const off = disabled || busy;
  const to = (v) => Animated.timing(press, { toValue: v, duration: 70, useNativeDriver: true }).start();
  return /* @__PURE__ */ React.createElement(
    Pressable,
    {
      onPress,
      onPressIn: () => !off && to(1),
      onPressOut: () => to(0),
      disabled: off,
      accessibilityRole: "button",
      accessibilityLabel: accessibilityLabel ?? label,
      accessibilityState: { disabled: off, busy },
      style: [{ height: height + LIP, opacity: disabled ? 0.45 : 1 }, style]
    },
    /* @__PURE__ */ React.createElement(View, { style: [styles.lip, { height, top: LIP, backgroundColor: t.lip }] }),
    /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.face, {
      height,
      backgroundColor: t.face,
      borderWidth: t.border ? 2 : 0,
      borderColor: t.border,
      transform: [{ translateY: press.interpolate({ inputRange: [0, 1], outputRange: [0, LIP] }) }]
    }] }, busy ? /* @__PURE__ */ React.createElement(ActivityIndicator, { color: t.text }) : /* @__PURE__ */ React.createElement(React.Fragment, null, icon, /* @__PURE__ */ React.createElement(Text, { style: [styles.label, { color: t.text }], numberOfLines: 1 }, label)))
  );
}
const styles = StyleSheet.create({
  lip: { position: "absolute", left: 0, right: 0, borderRadius: 16 },
  face: { borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 14 },
  label: { fontSize: 16, fontWeight: "800", letterSpacing: 0.2 }
});
export {
  ChunkyButton
};
