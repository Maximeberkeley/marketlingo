import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../lib/constants";
import { isDark } from "../lib/theme";
import { triggerHaptic } from "../lib/haptics";
import { COSMETICS, DEFAULT_HAT, MAX_FREEZES_HELD, SLOT_LABEL, STREAK_FREEZE_ID, WARDROBE_SLOTS, priceOf } from "../lib/shopCatalog";
import { hasArt, useShop } from "../hooks/useShop";
import { LeoAvatar } from "../components/shop/LeoAvatar";
import { ItemArt, SLOT_ICON, ShopIcon } from "../components/shop/ItemArt";
import { Flask } from "../components/shop/ShopKit";
const fmt = (n) => n.toLocaleString("en-US");
function WardrobeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const shop = useShop();
  const [slot, setSlot] = useState("hat");
  const tile = Math.floor((width - 40 - 20) / 3);
  const freezes = shop.owned[STREAK_FREEZE_ID]?.qty ?? 0;
  const inSlot = (c) => (slot === "outfit" ? c.slot === "outfit" || c.slot === "cape" : c.slot === slot) && !c.hidden;
  const items = COSMETICS.filter(inSlot);
  const mine = items.filter((c) => shop.owns(c.id) || c.id === "monthly-crown-keepsake" && shop.owns(c.id));
  const forSale = items.filter((c) => !shop.owns(c.id) && priceOf(c) !== null && hasArt(c.id));
  const wornId = (s) => {
    const v = shop.look[s];
    return v === void 0 ? s === "hat" ? DEFAULT_HAT : "" : v;
  };
  const isWorn = (c) => wornId(c.slot) === c.id;
  const emptyWorn = slot === "outfit" ? !wornId("outfit") && !wornId("cape") : !wornId(slot);
  const wear = (c) => {
    triggerHaptic("selection");
    void shop.equip(c.slot, isWorn(c) ? null : c.id);
  };
  const clear = () => {
    triggerHaptic("selection");
    if (slot === "outfit") {
      void shop.equip("outfit", null);
      void shop.equip("cape", null);
    } else void shop.equip(slot, null);
  };
  return /* @__PURE__ */ React.createElement(View, { style: [styles.root, { paddingTop: insets.top + 6 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.header }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.back(), hitSlop: 12, accessibilityRole: "button", accessibilityLabel: "Back" }, /* @__PURE__ */ React.createElement(Feather, { name: "chevron-left", size: 26, color: COLORS.textPrimary })), /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Dress Leo"), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.back(), hitSlop: 12, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.done }, "Done"))), /* @__PURE__ */ React.createElement(ScrollView, { contentContainerStyle: { paddingBottom: insets.bottom + 30 }, showsVerticalScrollIndicator: false }, /* @__PURE__ */ React.createElement(View, { style: styles.stage }, /* @__PURE__ */ React.createElement(View, { style: styles.shadow }, /* @__PURE__ */ React.createElement(LeoAvatar, { look: shop.look, crown: shop.wearsCrown, size: 208, bg: isDark ? COLORS.bg1 : "#F4F2FB" }))), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.push("/shop-freeze"), style: styles.freezeRow, accessibilityRole: "button", accessibilityLabel: `Streak Freezes: ${freezes} of ${MAX_FREEZES_HELD}` }, /* @__PURE__ */ React.createElement(ShopIcon, { id: "streak-freeze", size: 30 }), /* @__PURE__ */ React.createElement(Text, { style: styles.freezeText }, "Streak Freeze ", /* @__PURE__ */ React.createElement(Text, { style: styles.freezeCount }, "\xD7", freezes)), /* @__PURE__ */ React.createElement(Text, { style: styles.freezeSub }, "Hold up to ", MAX_FREEZES_HELD), /* @__PURE__ */ React.createElement(Feather, { name: "chevron-right", size: 16, color: COLORS.textMuted })), /* @__PURE__ */ React.createElement(View, { style: styles.tabs, accessibilityRole: "tablist" }, WARDROBE_SLOTS.map((s) => {
    const on = s === slot;
    return /* @__PURE__ */ React.createElement(TouchableOpacity, { key: s, onPress: () => setSlot(s), style: styles.tab, accessibilityRole: "tab", accessibilityState: { selected: on }, accessibilityLabel: SLOT_LABEL[s] }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: SLOT_ICON[s], size: 24, color: on ? COLORS.accent : COLORS.textMuted }), /* @__PURE__ */ React.createElement(View, { style: [styles.tabDot, { backgroundColor: on ? COLORS.accent : "transparent" }] }));
  })), /* @__PURE__ */ React.createElement(Text, { style: styles.gridTitle }, SLOT_LABEL[slot], " \xB7 ", mine.length, " owned"), /* @__PURE__ */ React.createElement(View, { style: styles.grid }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: clear, style: [styles.tile, { width: tile, height: tile }, emptyWorn && styles.worn], accessibilityRole: "button", accessibilityLabel: `No ${SLOT_LABEL[slot].toLowerCase()}` }, /* @__PURE__ */ React.createElement(Feather, { name: "slash", size: 26, color: COLORS.textMuted })), mine.map((c) => /* @__PURE__ */ React.createElement(TouchableOpacity, { key: c.id, onPress: () => hasArt(c.id) ? wear(c) : router.push(`/shop-item?id=${c.id}`), style: [styles.tile, { width: tile, height: tile }, isWorn(c) && styles.worn], accessibilityRole: "button", accessibilityLabel: `${c.name}${isWorn(c) ? ", wearing" : ""}` }, /* @__PURE__ */ React.createElement(ItemArt, { item: c, size: tile - 14, showTag: false, tint: "transparent" }))), forSale.map((c) => /* @__PURE__ */ React.createElement(TouchableOpacity, { key: c.id, onPress: () => router.push(`/shop-item?id=${c.id}`), style: [styles.tile, { width: tile, height: tile }], accessibilityRole: "button", accessibilityLabel: `${c.name}, ${fmt(priceOf(c))} XP` }, /* @__PURE__ */ React.createElement(ItemArt, { item: c, size: tile - 30, showTag: false, tint: "transparent" }), /* @__PURE__ */ React.createElement(View, { style: styles.price }, /* @__PURE__ */ React.createElement(Flask, { size: 11 }), /* @__PURE__ */ React.createElement(Text, { style: styles.priceText }, fmt(priceOf(c))))))), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.push("/(tabs)/shop"), style: styles.more, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.moreText }, "Get more in the Shop"), /* @__PURE__ */ React.createElement(Feather, { name: "chevron-right", size: 16, color: COLORS.accent }))));
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 44, gap: 10 },
  title: { flex: 1, fontSize: 20, fontWeight: "900", color: COLORS.textPrimary },
  done: { fontSize: 16, fontWeight: "800", color: COLORS.accent },
  stage: { alignItems: "center", paddingVertical: 18 },
  shadow: { borderRadius: 104, shadowColor: "#4C1D95", shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  freezeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 20, marginBottom: 10, paddingHorizontal: 12, height: 48, borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border, backgroundColor: COLORS.bg2 },
  freezeText: { flex: 1, fontSize: 14.5, fontWeight: "800", color: COLORS.textPrimary },
  freezeCount: { color: isDark ? "#7DD3FC" : "#0284C7" },
  freezeSub: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted },
  tabs: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  tab: { alignItems: "center", paddingVertical: 10, paddingHorizontal: 10, minWidth: 44 },
  tabDot: { width: 5, height: 5, borderRadius: 3, marginTop: 6 },
  gridTitle: { fontSize: 13, fontWeight: "800", color: COLORS.textSecondary, paddingHorizontal: 20, marginTop: 16, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 20 },
  tile: { borderRadius: 18, backgroundColor: COLORS.bg1, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  worn: { borderColor: COLORS.accent },
  price: { position: "absolute", bottom: 6, flexDirection: "row", alignItems: "center", gap: 3 },
  priceText: { fontSize: 11, fontWeight: "800", color: COLORS.textSecondary },
  more: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 20 },
  moreText: { fontSize: 14, fontWeight: "800", color: COLORS.accent }
});
export {
  WardrobeScreen as default
};
