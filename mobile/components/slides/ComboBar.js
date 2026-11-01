import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
function ComboBar({ combo, correctCount, totalAnswered }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fireOpacity = useRef(new Animated.Value(0)).current;
  const slideIn = useRef(new Animated.Value(-50)).current;
  useEffect(() => {
    Animated.spring(slideIn, {
      toValue: 0,
      tension: 200,
      friction: 20,
      useNativeDriver: true
    }).start();
  }, []);
  useEffect(() => {
    if (combo.streak === 0) return;
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.25, duration: 120, useNativeDriver: true }),
      Animated.spring(pulseAnim, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true })
    ]).start();
  }, [combo.streak]);
  useEffect(() => {
    Animated.timing(fireOpacity, {
      toValue: combo.isOnFire ? 1 : 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [combo.isOnFire]);
  if (totalAnswered === 0) return null;
  const multiplierColor = combo.multiplier >= 3 ? "#F97316" : combo.multiplier >= 2 ? "#EAB308" : combo.multiplier > 1 ? "#22C55E" : COLORS.textMuted;
  return /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.container, { transform: [{ translateY: slideIn }] }] }, /* @__PURE__ */ React.createElement(View, { style: styles.comboSection }, /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.fireWrap, { opacity: fireOpacity }] }, /* @__PURE__ */ React.createElement(Text, { style: styles.fireEmoji }, "\u{1F525}")), /* @__PURE__ */ React.createElement(Animated.Text, { style: [
    styles.comboCount,
    { transform: [{ scale: pulseAnim }], color: combo.isOnFire ? "#F97316" : COLORS.textPrimary }
  ] }, combo.streak), /* @__PURE__ */ React.createElement(Text, { style: styles.comboLabel }, "combo")), combo.multiplier > 1 && /* @__PURE__ */ React.createElement(View, { style: [styles.multiplierBadge, { backgroundColor: multiplierColor + "18", borderColor: multiplierColor + "40" }] }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "flask", size: 12, color: multiplierColor }), /* @__PURE__ */ React.createElement(Text, { style: [styles.multiplierText, { color: multiplierColor }] }, combo.multiplier, "x XP")), /* @__PURE__ */ React.createElement(View, { style: styles.scoreSection }, /* @__PURE__ */ React.createElement(Text, { style: styles.scoreText }, correctCount, "/", totalAnswered), /* @__PURE__ */ React.createElement(Feather, { name: "check-circle", size: 14, color: COLORS.success })));
}
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12
  },
  comboSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  fireWrap: {
    marginRight: 2
  },
  fireEmoji: {
    fontSize: 16
  },
  comboCount: {
    fontSize: 20,
    fontWeight: "900"
  },
  comboLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  multiplierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1
  },
  multiplierText: {
    fontSize: 12,
    fontWeight: "800"
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  scoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary
  }
});
export {
  ComboBar
};
