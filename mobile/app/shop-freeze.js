import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../lib/constants";
import { isDark } from "../lib/theme";
import { triggerHaptic } from "../lib/haptics";
import { MAX_FREEZES_HELD, STREAK_FREEZE_ID, STREAK_FREEZE_PRICE } from "../lib/shopCatalog";
import { BLOCK_LABEL, buyBlock } from "../lib/shopEconomy";
import { useShop } from "../hooks/useShop";
import { ShopIcon } from "../components/shop/ItemArt";
import { PriceButton } from "../components/shop/ShopKit";
import { Float } from "../components/shop/Motion";
const fmt = (n) => n.toLocaleString("en-US");
function StreakFreezeScreen() {
  const insets = useSafeAreaInsets();
  const shop = useShop();
  const held = shop.owned[STREAK_FREEZE_ID]?.qty ?? 0;
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const block = buyBlock({ price: STREAK_FREEZE_PRICE, balance: shop.balance.balance, held, comingSoon: !shop.available && shop.ready });
  const buy = async () => {
    if (block) return;
    setBusy(true);
    const r = await shop.purchase(STREAK_FREEZE_ID);
    setBusy(false);
    if (r.ok) {
      triggerHaptic("success");
      setNote("Freeze added. It waits for a day you miss.");
    } else setNote(r.error === "not_enough" ? `${fmt(STREAK_FREEZE_PRICE - shop.balance.balance)} XP to go.` : "That did not go through. Try again.");
  };
  return /* @__PURE__ */ React.createElement(View, { style: [styles.root, { paddingBottom: insets.bottom + 14 }] }, /* @__PURE__ */ React.createElement(LinearGradient, { colors: isDark ? ["#0C2A3B", "#15171B"] : ["#D8F0FD", "#FFFFFF"], style: [styles.hero, { paddingTop: insets.top + 8 }] }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.back(), hitSlop: 12, style: styles.close, accessibilityRole: "button", accessibilityLabel: "Close" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 22, color: COLORS.textPrimary })), /* @__PURE__ */ React.createElement(Float, { distance: 6 }, /* @__PURE__ */ React.createElement(ShopIcon, { id: "streak-freeze", size: 128 })), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.title }, "Streak Freeze"), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.sub }, "Miss a day. Keep the streak.")), /* @__PURE__ */ React.createElement(View, { style: styles.body }, /* @__PURE__ */ React.createElement(View, { style: styles.holdCard }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.holdLabel }, "You hold"), /* @__PURE__ */ React.createElement(View, { style: styles.slots }, Array.from({ length: MAX_FREEZES_HELD }, (_, i) => /* @__PURE__ */ React.createElement(View, { key: i, style: [styles.slot, i < held ? styles.slotFull : styles.slotEmpty] }, i < held ? /* @__PURE__ */ React.createElement(ShopIcon, { id: "streak-freeze", size: 30 }) : null))), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.holdCount }, held, " of ", MAX_FREEZES_HELD)), /* @__PURE__ */ React.createElement(View, { style: styles.week }, [["Mon", "You learn", "done"], ["Tue", "Freeze used", "ice"], ["Wed", "Streak safe", "done"]].map(([d, l, kind]) => /* @__PURE__ */ React.createElement(View, { key: d, style: styles.day }, /* @__PURE__ */ React.createElement(View, { style: [styles.dayDot, kind === "ice" ? styles.dayIce : styles.dayDone] }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: [styles.dayText, kind === "ice" && { color: "#0369A1" }] }, d)), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.dayLabel }, l)))), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.rule }, "You get one free every week. Bought freezes cover any extra missed day, and you choose when to use one."), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.push("/shop-repair"), accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.repair }, "Already lost it? Try Streak Repair"))), /* @__PURE__ */ React.createElement(View, { style: styles.footer }, note ? /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.note }, note) : null, block && block !== "not_enough" ? /* @__PURE__ */ React.createElement(View, { style: styles.blocked }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.blockedText }, BLOCK_LABEL[block])) : /* @__PURE__ */ React.createElement(PriceButton, { price: STREAK_FREEZE_PRICE, label: "Buy a freeze", onPress: () => {
    void buy();
  }, busy, disabled: block === "not_enough", height: 52 }), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.after }, block === "not_enough" ? `${fmt(STREAK_FREEZE_PRICE - shop.balance.balance)} XP to go` : `${fmt(shop.balance.balance)} XP now, ${fmt(Math.max(0, shop.balance.balance - STREAK_FREEZE_PRICE))} after`)));
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  hero: { alignItems: "center", paddingBottom: 26 },
  close: { alignSelf: "flex-start", marginLeft: 16, width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg2 + "CC", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "900", color: isDark ? "#BAE6FD" : "#075985", marginTop: 8 },
  sub: { fontSize: 15, fontWeight: "700", color: isDark ? "#7DD3FC" : "#0369A1", marginTop: 2 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 18, gap: 18 },
  holdCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border, backgroundColor: COLORS.bg2 },
  holdLabel: { flex: 1, fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  slots: { flexDirection: "row", gap: 8 },
  slot: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  slotFull: { backgroundColor: isDark ? "rgba(56,189,248,0.16)" : "#E0F2FE", borderWidth: 2, borderColor: "#7DD3FC" },
  slotEmpty: { borderWidth: 2, borderStyle: "dashed", borderColor: COLORS.border },
  holdCount: { fontSize: 15, fontWeight: "900", color: COLORS.textPrimary },
  week: { flexDirection: "row", justifyContent: "space-around" },
  day: { alignItems: "center", gap: 6 },
  dayDot: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  dayDone: { backgroundColor: COLORS.accent },
  dayIce: { backgroundColor: isDark ? "#0C4A6E" : "#E0F2FE", borderWidth: 2, borderColor: "#38BDF8" },
  dayText: { fontSize: 13, fontWeight: "900", color: "#FFFFFF" },
  dayLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  rule: { fontSize: 14, lineHeight: 20, color: COLORS.textSecondary, textAlign: "center" },
  repair: { fontSize: 13, fontWeight: "800", color: COLORS.accent, textAlign: "center" },
  footer: { paddingHorizontal: 20, gap: 8 },
  note: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  blocked: { height: 56, borderRadius: 16, backgroundColor: COLORS.bg1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  blockedText: { fontSize: 15, fontWeight: "800", color: COLORS.textMuted },
  after: { fontSize: 12.5, fontWeight: "600", color: COLORS.textMuted, textAlign: "center" }
});
export {
  StreakFreezeScreen as default
};
