import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { tokens } from "../theme/tokens";
const BG = {
  primary: tokens.color.accentFill,
  correct: tokens.color.correct,
  incorrect: tokens.color.incorrect,
  disabled: tokens.color.disabled,
  ghost: "transparent"
};
const FG = {
  primary: tokens.color.textOnAccent,
  correct: tokens.color.textOnAccent,
  incorrect: tokens.color.textOnAccent,
  disabled: tokens.color.disabledText,
  ghost: tokens.color.textSecondary
};
function PrimaryButton({ label, onPress, variant = "primary", style }) {
  const disabled = variant === "disabled";
  return /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      activeOpacity: 0.85,
      disabled,
      onPress,
      style: [
        styles.button,
        { backgroundColor: BG[variant] },
        variant === "ghost" && styles.ghost,
        style
      ]
    },
    /* @__PURE__ */ React.createElement(Text, { style: [styles.label, { color: FG[variant] }] }, label)
  );
}
const styles = StyleSheet.create({
  button: {
    height: tokens.size.buttonHeight,
    borderRadius: tokens.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space.xl
  },
  ghost: {
    borderWidth: 2,
    borderColor: tokens.color.border
  },
  label: {
    fontSize: tokens.font.button,
    fontWeight: "800",
    letterSpacing: 0.3
  }
});
export {
  PrimaryButton
};
