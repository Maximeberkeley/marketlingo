import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../lib/constants";
import { isDark } from "../lib/theme";
import { triggerHaptic } from "../lib/haptics";
import { trackEvent } from "../lib/analytics";
import { DOUBLE_XP_ID, DOUBLE_XP_MINUTES, boostClock, doubleXpActive } from "../lib/boosts";
import { useShop } from "../hooks/useShop";
import { ShopIcon } from "../components/shop/ItemArt";
import { ChunkyButton } from "../components/social/ChunkyButton";
import { Float } from "../components/shop/Motion";
const COUNTS = ["Lessons", "Daily Arena", "Deep Cases", "Reviews", "Leo calls"];
function DoubleXpScreen() {
  const insets = useSafeAreaInsets();
  const shop = useShop();
  const held = shop.owned[DOUBLE_XP_ID]?.qty ?? 0;
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const running = doubleXpActive(shop.doubleXpUntil, now);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(t);
  }, [running]);
  const start = async () => {
    setBusy(true);
    const r = await shop.startDoubleXp();
    setBusy(false);
    setNow(Date.now());
    if (r.ok) {
      triggerHaptic("success");
      trackEvent("double_xp_started");
      setNote("Double XP is on. Go learn.");
    } else setNote(r.error === "active" ? "One is already running." : r.error === "none" ? "No Double XP left. Submit a Weekly Case to earn one." : "That did not go through. Try again.");
  };
  return /* @__PURE__ */ React.createElement(View, { style: [styles.root, { paddingBottom: insets.bottom + 14 }] }, /* @__PURE__ */ React.createElement(LinearGradient, { colors: isDark ? ["#3B2A0C", "#15171B"] : ["#FEF3C7", "#FFFFFF"], style: [styles.hero, { paddingTop: insets.top + 8 }] }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.back(), hitSlop: 12, style: styles.close, accessibilityRole: "button", accessibilityLabel: "Close" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 22, color: COLORS.textPrimary })), /* @__PURE__ */ React.createElement(Float, { distance: 6 }, /* @__PURE__ */ React.createElement(ShopIcon, { id: "countdown", size: 128 })), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.title }, "Double XP"), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.sub }, `${DOUBLE_XP_MINUTES} minutes. Every XP counts twice.`)), /* @__PURE__ */ React.createElement(View, { style: styles.body }, running ? /* @__PURE__ */ React.createElement(View, { style: [styles.card, styles.runningCard], accessibilityLabel: `Double XP running, ${boostClock(shop.doubleXpUntil, now)} left` }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.2, style: styles.clock }, boostClock(shop.doubleXpUntil, now)), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.clockLabel }, "left on Double XP")) : /* @__PURE__ */ React.createElement(View, { style: styles.card }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.holdLabel }, "You hold"), /* @__PURE__ */ React.createElement(View, { style: styles.count }, /* @__PURE__ */ React.createElement(ShopIcon, { id: "countdown", size: 30 }), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.holdCount }, held))), /* @__PURE__ */ React.createElement(View, { style: styles.chips }, COUNTS.map((c) => /* @__PURE__ */ React.createElement(View, { key: c, style: styles.chip }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.chipText }, c, " x2")))), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.rule }, "You earn one with every Weekly Case you submit. Start it when you have time to learn. It counts for friend races and the crown, because everyone earns it the same way.")), /* @__PURE__ */ React.createElement(View, { style: styles.footer }, note ? /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.note }, note) : null, running ? /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Keep learning", onPress: () => router.replace("/(tabs)/home"), height: 52 }) : held > 0 ? /* @__PURE__ */ React.createElement(ChunkyButton, { label: `Start ${DOUBLE_XP_MINUTES} minutes`, tone: "gold", onPress: () => {
    void start();
  }, busy, height: 52, haptic: true }) : /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Go to the Weekly Case", tone: "plain", onPress: () => router.push("/weekly-case"), height: 52 })));
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  hero: { alignItems: "center", paddingBottom: 26 },
  close: { alignSelf: "flex-start", marginLeft: 16, width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg2 + "CC", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "900", color: isDark ? "#FDE68A" : "#92400E", marginTop: 8 },
  sub: { fontSize: 15, fontWeight: "700", color: isDark ? "#FCD34D" : "#B45309", marginTop: 2 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 18, gap: 18 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border, backgroundColor: COLORS.bg2 },
  runningCard: { flexDirection: "column", gap: 2, borderColor: "#F59E0B", backgroundColor: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB" },
  clock: { fontSize: 44, fontWeight: "900", color: isDark ? "#FCD34D" : "#B45309", fontVariant: ["tabular-nums"] },
  clockLabel: { fontSize: 14, fontWeight: "700", color: COLORS.textSecondary },
  holdLabel: { flex: 1, fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  count: { flexDirection: "row", alignItems: "center", gap: 6 },
  holdCount: { fontSize: 20, fontWeight: "900", color: COLORS.textPrimary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: isDark ? "rgba(245,158,11,0.14)" : "#FEF3C7" },
  chipText: { fontSize: 13, fontWeight: "800", color: isDark ? "#FDE68A" : "#92400E" },
  rule: { fontSize: 14, lineHeight: 20, color: COLORS.textSecondary, textAlign: "center" },
  footer: { paddingHorizontal: 20, gap: 8 },
  note: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" }
});
export {
  DoubleXpScreen as default
};
