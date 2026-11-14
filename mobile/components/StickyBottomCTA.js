import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../lib/constants";
function StickyBottomCTA({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  style,
  secondaryButton
}) {
  const insets = useSafeAreaInsets();
  const isPrimary = variant === "primary";
  const buttonStyles = [
    styles.button,
    isPrimary ? styles.primaryButton : styles.secondaryButton,
    disabled && styles.disabledButton
  ];
  return /* @__PURE__ */ React.createElement(
    View,
    {
      style: [
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 16) },
        style
      ]
    },
    secondaryButton && /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: [styles.button, styles.secondaryButton, { marginBottom: 12 }],
        onPress: secondaryButton.onPress,
        activeOpacity: 0.8
      },
      /* @__PURE__ */ React.createElement(Text, { style: styles.secondaryButtonText }, secondaryButton.title)
    ),
    /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: buttonStyles,
        onPress,
        disabled: disabled || loading,
        activeOpacity: 0.8
      },
      loading ? /* @__PURE__ */ React.createElement(ActivityIndicator, { color: "#FFFFFF" }) : /* @__PURE__ */ React.createElement(Text, { style: [styles.buttonText, !isPrimary && styles.secondaryButtonText] }, title)
    )
  );
}
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: COLORS.bg0,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButton: {
    backgroundColor: COLORS.accentFill
  },
  secondaryButton: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  disabledButton: {
    opacity: 0.5
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF"
  },
  secondaryButtonText: {
    color: COLORS.textSecondary
  }
});
export {
  StickyBottomCTA
};
