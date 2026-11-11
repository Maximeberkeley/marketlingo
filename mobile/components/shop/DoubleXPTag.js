import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { isDark } from "../../lib/theme";
import { useShop } from "../../hooks/useShop";
import { boostClock, doubleXpActive } from "../../lib/boosts";
function DoubleXPTag() {
  const { doubleXpUntil } = useShop();
  const [now, setNow] = useState(() => Date.now());
  const active = doubleXpActive(doubleXpUntil, now);
  useEffect(() => {
    if (!doubleXpActive(doubleXpUntil, Date.now())) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(t);
  }, [doubleXpUntil]);
  if (!active) return null;
  return /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      onPress: () => router.push("/shop-boost"),
      activeOpacity: 0.85,
      accessibilityRole: "button",
      accessibilityLabel: `Double XP on, ${boostClock(doubleXpUntil, now)} left`
    },
    /* @__PURE__ */ React.createElement(View, { style: styles.tag }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.2, style: styles.x }, "2x"), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.2, style: styles.clock }, boostClock(doubleXpUntil, now)))
  );
}
const styles = StyleSheet.create({
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: isDark ? "rgba(245,158,11,0.18)" : "#FEF3C7",
    borderWidth: 1.5,
    borderColor: "#F59E0B"
  },
  x: { fontSize: 14, fontWeight: "900", color: isDark ? "#FCD34D" : "#B45309" },
  clock: { fontSize: 13, fontWeight: "800", color: isDark ? "#FDE68A" : "#92400E", fontVariant: ["tabular-nums"] }
});
export {
  DoubleXPTag
};
