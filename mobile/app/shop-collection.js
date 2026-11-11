import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../lib/constants";
import { isDark } from "../lib/theme";
import { COLLECTIONS, COSMETICS, RARITY_COLOR, RARITY_LABEL, SLOT_LABEL, priceOf } from "../lib/shopCatalog";
import { hasArt, useShop } from "../hooks/useShop";
import { LeoAvatar } from "../components/shop/LeoAvatar";
import { SLOT_ICON } from "../components/shop/ItemArt";
import { Flask } from "../components/shop/ShopKit";
import { Float, PressScale } from "../components/shop/Motion";
import { FloatIcon, FloorShadow, SCENES, SceneBackdrop, Sunburst, Twinkles } from "../components/shop/Scene";
const fmt = (n) => n.toLocaleString("en-US");
function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams();
  const shop = useShop();
  const collection = COLLECTIONS.find((c) => c.id === id) ?? COLLECTIONS[0];
  const all = COSMETICS.filter((c) => c.collection === collection.id && !c.hidden);
  const drawn = all.filter((c) => hasArt(c.id)).sort((a, b) => (priceOf(a) ?? 1e9) - (priceOf(b) ?? 1e9));
  const coming = all.filter((c) => !hasArt(c.id));
  const look = Object.fromEntries(drawn.map((c) => [c.slot, c.id]));
  const owned = drawn.filter((c) => shop.owns(c.id)).length;
  const theme = collection.id in SCENES ? collection.id : "promo";
  const t = SCENES[theme];
  const H = 320 + insets.top;
  const floorY = H - 78;
  const leo = Math.min(width * 0.62, (floorY - insets.top - 52) / 0.955);
  const tile = Math.floor((width - 40 - 12) / 2);
  return /* @__PURE__ */ React.createElement(View, { style: styles.root }, /* @__PURE__ */ React.createElement(ScrollView, { contentContainerStyle: { paddingBottom: insets.bottom + 30 }, showsVerticalScrollIndicator: false }, /* @__PURE__ */ React.createElement(View, { style: [styles.hero, { height: H }] }, /* @__PURE__ */ React.createElement(SceneBackdrop, { theme, sceneId: collection.id }), /* @__PURE__ */ React.createElement(Sunburst, { size: 620, cx: width / 2, cy: floorY - leo * 0.45, color: t.ray, opacity: t.rayOpacity }), /* @__PURE__ */ React.createElement(Twinkles, { w: width, h: H, color: t.spark }), /* @__PURE__ */ React.createElement(FloorShadow, { width: leo * 0.86, cx: width / 2, y: floorY, dark: 0.45 }), /* @__PURE__ */ React.createElement(FloatIcon, { id: t.icons[1], size: 44, x: width - 70, y: insets.top + 60, depth: 0, phase: 700 }), /* @__PURE__ */ React.createElement(Float, { distance: 5, style: { position: "absolute", left: width / 2 - leo / 2, top: floorY - leo * 0.955 } }, /* @__PURE__ */ React.createElement(LeoAvatar, { look: drawn.length ? { hat: "", ...look } : {}, size: leo, crop: false })), /* @__PURE__ */ React.createElement(FloatIcon, { id: t.icons[0], size: 54, x: 16, y: H - 150, depth: 2, phase: 200 }), /* @__PURE__ */ React.createElement(FloatIcon, { id: t.icons[2], size: 46, x: width - 64, y: H - 140, depth: 1, phase: 1200 }), /* @__PURE__ */ React.createElement(LinearGradient, { colors: ["transparent", "rgba(0,0,0,0.55)"], style: styles.shade, pointerEvents: "none" }), /* @__PURE__ */ React.createElement(View, { style: styles.heroText }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.2, style: styles.name }, collection.name), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.hook }, collection.hook)), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.back(), hitSlop: 12, style: [styles.close, { top: insets.top + 8 }], accessibilityRole: "button", accessibilityLabel: "Close" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 20, color: "#FFFFFF" }))), drawn.length > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.progress }, /* @__PURE__ */ React.createElement(View, { style: styles.progressRow }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.progressText }, owned === drawn.length ? "Full set collected" : `${owned} of ${drawn.length} collected`), owned === drawn.length && /* @__PURE__ */ React.createElement(Feather, { name: "award", size: 16, color: COLORS.accent })), /* @__PURE__ */ React.createElement(View, { style: styles.track }, /* @__PURE__ */ React.createElement(View, { style: [styles.fill, { width: `${Math.max(3, owned / drawn.length * 100)}%` }] }))), /* @__PURE__ */ React.createElement(View, { style: styles.grid }, drawn.map((c) => {
    const own = shop.owns(c.id);
    const price = priceOf(c);
    const color = RARITY_COLOR[c.rarity];
    return /* @__PURE__ */ React.createElement(PressScale, { key: c.id, onPress: () => router.push(`/shop-item?id=${c.id}`), style: { ...styles.tile, width: tile, ...own ? { borderColor: COLORS.success + "88" } : {} }, accessibilityLabel: `${c.name}, ${own ? "owned" : price !== null ? `${price} XP` : "earn it"}` }, /* @__PURE__ */ React.createElement(View, { style: [styles.art, { height: tile * 0.82, backgroundColor: color + (isDark ? "1F" : "14") }] }, /* @__PURE__ */ React.createElement(Sunburst, { size: tile * 1.6, cx: (tile - 4) / 2, cy: tile * 0.44, color, opacity: 0.26, period: 48e3 }), /* @__PURE__ */ React.createElement(View, { style: { position: "absolute", left: (tile - 4) / 2 - tile * 0.86 / 2, bottom: -2 } }, /* @__PURE__ */ React.createElement(LeoAvatar, { look: { hat: "", [c.slot]: c.id }, size: tile * 0.86, crop: false })), own && /* @__PURE__ */ React.createElement(View, { style: styles.ownBadge }, /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 12, color: "#052E16" }))), /* @__PURE__ */ React.createElement(View, { style: styles.tileBody }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.itemName, numberOfLines: 1 }, c.name), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: [styles.rarity, { color }] }, RARITY_LABEL[c.rarity], " ", SLOT_LABEL[c.slot].toLowerCase()), /* @__PURE__ */ React.createElement(View, { style: styles.priceRow }, own ? /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: [styles.priceText, { color: COLORS.success }] }, "In your wardrobe") : price !== null ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Flask, { size: 15 }), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.priceText }, fmt(price))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Feather, { name: "award", size: 13, color: COLORS.textSecondary }), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.priceText }, "Earn it")))));
  })), coming.length > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.coming }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.comingTitle }, drawn.length ? `${coming.length} more on the way` : "This set is being drawn"), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.comingSub }, drawn.length ? "They join the set as soon as their art is ready." : "Its pieces arrive in the Shop as soon as their art is ready."), /* @__PURE__ */ React.createElement(View, { style: styles.chips }, coming.map((c) => /* @__PURE__ */ React.createElement(View, { key: c.id, style: styles.chip }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: SLOT_ICON[c.slot], size: 14, color: COLORS.textMuted }), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.chipText }, c.name)))))));
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  hero: { overflow: "hidden" },
  shade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 120 },
  heroText: { position: "absolute", left: 20, right: 20, bottom: 16 },
  name: { fontSize: 32, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.4, textShadowColor: "rgba(0,0,0,0.35)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  hook: { fontSize: 15, fontWeight: "700", color: "rgba(255,255,255,0.92)", marginTop: 2 },
  close: { position: "absolute", left: 16, width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.28)", alignItems: "center", justifyContent: "center" },
  progress: { marginHorizontal: 20, marginTop: 18, gap: 8 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  progressText: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  track: { height: 10, borderRadius: 5, backgroundColor: COLORS.border, overflow: "hidden" },
  fill: { height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 20, paddingTop: 18 },
  tile: { borderRadius: 20, backgroundColor: COLORS.bg2, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border, overflow: "hidden" },
  art: { overflow: "hidden" },
  ownBadge: { position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: "#4ADE80", alignItems: "center", justifyContent: "center" },
  tileBody: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  itemName: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  rarity: { fontSize: 12.5, fontWeight: "800", marginTop: 1 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  priceText: { fontSize: 14, fontWeight: "900", color: COLORS.textPrimary },
  coming: { marginHorizontal: 20, marginTop: 22, padding: 16, borderRadius: 20, borderWidth: 2, borderStyle: "dashed", borderColor: COLORS.border },
  comingTitle: { fontSize: 16, fontWeight: "900", color: COLORS.textPrimary },
  comingSub: { fontSize: 13.5, lineHeight: 19, color: COLORS.textSecondary, marginTop: 3 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: COLORS.bg1 },
  chipText: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary }
});
export {
  CollectionScreen as default
};
