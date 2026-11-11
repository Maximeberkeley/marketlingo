import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../lib/constants";
import { isDark } from "../lib/theme";
import { triggerHaptic } from "../lib/haptics";
import { trackEvent } from "../lib/analytics";
import {
  REPAIR_COOLDOWN_DAYS,
  REPAIR_COPY,
  REPAIR_MIN_STREAK,
  STREAK_REPAIR_PRICE
} from "../lib/boosts";
import { useShop } from "../hooks/useShop";
import { useSelectedMarket } from "../hooks/useSelectedMarket";
import { ShopIcon } from "../components/shop/ItemArt";
import { PriceButton } from "../components/shop/ShopKit";
import { ChunkyButton } from "../components/social/ChunkyButton";
import { Float } from "../components/shop/Motion";
const fmt = (n) => n.toLocaleString("en-US");
const dayName = (iso) => (/* @__PURE__ */ new Date(`${iso}T12:00:00`)).toLocaleDateString("en-US", { weekday: "short" });
function StreakRepairScreen() {
  const insets = useSafeAreaInsets();
  const shop = useShop();
  const { marketId, loading: marketLoading } = useSelectedMarket();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const [restored, setRestored] = useState(null);
  const check = useCallback(async () => {
    if (marketLoading) return;
    setStatus(await shop.repairStatus(marketId));
  }, [marketId, marketLoading, shop.repairStatus]);
  useEffect(() => {
    void check();
  }, [check]);
  const short = Math.max(0, STREAK_REPAIR_PRICE - shop.balance.balance);
  const eligible = status?.reason === "eligible";
  const repair = async () => {
    setBusy(true);
    const r = await shop.repairStreak(marketId);
    setBusy(false);
    if (r.ok) {
      triggerHaptic("success");
      trackEvent("streak_repaired", { streak: r.streak });
      setRestored(r.streak);
      setNote(null);
    } else if (r.error === "not_enough") {
      setNote(`${fmt(short)} XP to go.`);
    } else {
      setNote(REPAIR_COPY[r.error] ?? "That did not go through. Try again.");
      void check();
    }
  };
  return /* @__PURE__ */ React.createElement(View, { style: [styles.root, { paddingBottom: insets.bottom + 14 }] }, /* @__PURE__ */ React.createElement(LinearGradient, { colors: isDark ? ["#3B1A0C", "#15171B"] : ["#FFEDD5", "#FFFFFF"], style: [styles.hero, { paddingTop: insets.top + 8 }] }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.back(), hitSlop: 12, style: styles.close, accessibilityRole: "button", accessibilityLabel: "Close" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 22, color: COLORS.textPrimary })), /* @__PURE__ */ React.createElement(Float, { distance: 6 }, /* @__PURE__ */ React.createElement(ShopIcon, { id: "streak-repair", size: 128 })), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.title }, "Streak Repair"), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.sub }, "Lost it? Get it back.")), /* @__PURE__ */ React.createElement(View, { style: styles.body }, !status ? /* @__PURE__ */ React.createElement(ActivityIndicator, { color: COLORS.accent, style: { marginTop: 20 } }) : restored !== null ? /* @__PURE__ */ React.createElement(View, { style: [styles.card, styles.goodCard] }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.2, style: styles.big }, restored), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.cardLabel }, "day streak, back. Do today's lesson to keep it.")) : eligible ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(View, { style: styles.card }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.2, style: styles.big }, status.lostStreak), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.cardLabel }, "day streak ready to repair")), /* @__PURE__ */ React.createElement(View, { style: styles.week }, status.missedDays.map((d) => /* @__PURE__ */ React.createElement(View, { key: d, style: styles.day }, /* @__PURE__ */ React.createElement(View, { style: [styles.dayDot, styles.dayFix] }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: [styles.dayText, { color: "#C2410C" }] }, dayName(d))), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.dayLabel }, "Covered"))))) : /* @__PURE__ */ React.createElement(View, { style: styles.card }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.cardLabel }, status.reason === "used_recently" && status.availableAgain ? `One repair every ${REPAIR_COOLDOWN_DAYS} days. Next one from ${new Date(status.availableAgain).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.` : REPAIR_COPY[status.reason])), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.rule }, `Works for 48 hours after a streak of ${REPAIR_MIN_STREAK}+ days breaks, once every ${REPAIR_COOLDOWN_DAYS} days. It covers the missed days the way a freeze does, so a freeze held ahead is still the cheaper move.`)), /* @__PURE__ */ React.createElement(View, { style: styles.footer }, note ? /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.note }, note) : null, restored !== null ? /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Do today's lesson", onPress: () => router.replace("/(tabs)/home"), height: 52 }) : eligible ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(PriceButton, { price: STREAK_REPAIR_PRICE, label: "Repair streak", onPress: () => {
    void repair();
  }, busy, disabled: short > 0, height: 52 }), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.after }, short > 0 ? `${fmt(short)} XP to go` : `${fmt(shop.balance.balance)} XP now, ${fmt(shop.balance.balance - STREAK_REPAIR_PRICE)} after`)) : /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Get a Streak Freeze", tone: "plain", onPress: () => router.replace("/shop-freeze"), height: 52 })));
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  hero: { alignItems: "center", paddingBottom: 26 },
  close: { alignSelf: "flex-start", marginLeft: 16, width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg2 + "CC", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "900", color: isDark ? "#FDBA74" : "#9A3412", marginTop: 8 },
  sub: { fontSize: 15, fontWeight: "700", color: isDark ? "#FB923C" : "#C2410C", marginTop: 2 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 18, gap: 18 },
  card: { alignItems: "center", gap: 2, padding: 16, borderRadius: 18, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border, backgroundColor: COLORS.bg2 },
  goodCard: { borderColor: COLORS.success },
  big: { fontSize: 44, fontWeight: "900", color: COLORS.streak },
  cardLabel: { fontSize: 15, lineHeight: 21, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  week: { flexDirection: "row", justifyContent: "center", gap: 28 },
  day: { alignItems: "center", gap: 6 },
  dayDot: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  dayFix: { backgroundColor: isDark ? "#431407" : "#FFEDD5", borderWidth: 2, borderColor: "#FB923C" },
  dayText: { fontSize: 13, fontWeight: "900" },
  dayLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  rule: { fontSize: 14, lineHeight: 20, color: COLORS.textSecondary, textAlign: "center" },
  footer: { paddingHorizontal: 20, gap: 8 },
  note: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  after: { fontSize: 12.5, fontWeight: "600", color: COLORS.textMuted, textAlign: "center" }
});
export {
  StreakRepairScreen as default
};
