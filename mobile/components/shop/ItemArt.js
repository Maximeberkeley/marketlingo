import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { isDark } from "../../lib/theme";
import { SHOP_ART, SHOP_ICONS } from "../../lib/shopArt";
import { RARITY_COLOR } from "../../lib/shopCatalog";
import { LeoAvatar } from "./LeoAvatar";
const SLOT_ICON = {
  hat: "hat-fedora",
  glasses: "glasses",
  outfit: "tshirt-crew-outline",
  cape: "shield-outline",
  held: "hand-back-left-outline",
  background: "image-outline",
  frame: "circle-outline"
};
function ShopIcon({ id, size }) {
  const src = SHOP_ICONS[id];
  return src ? /* @__PURE__ */ React.createElement(Image, { source: src, style: { width: size, height: size }, resizeMode: "contain" }) : null;
}
function ItemArt({ item, size, tint, style, showTag = true }) {
  const color = RARITY_COLOR[item.rarity];
  if (item.id in SHOP_ART) {
    return /* @__PURE__ */ React.createElement(View, { style: [{ width: size, height: size, alignItems: "center", justifyContent: "center" }, style] }, /* @__PURE__ */ React.createElement(LeoAvatar, { look: { [item.slot]: item.id }, size, bg: tint ?? "transparent" }));
  }
  return /* @__PURE__ */ React.createElement(View, { style: [styles.placeholder, { width: size, height: size, borderRadius: size * 0.22, backgroundColor: color + (isDark ? "22" : "14") }, style] }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: SLOT_ICON[item.slot], size: Math.round(size * 0.42), color: color + (isDark ? "AA" : "88") }), showTag && size >= 64 && /* @__PURE__ */ React.createElement(View, { style: styles.tag }, /* @__PURE__ */ React.createElement(Text, { style: styles.tagText }, "Art soon")));
}
const styles = StyleSheet.create({
  placeholder: { alignItems: "center", justifyContent: "center" },
  tag: { position: "absolute", bottom: 6, paddingHorizontal: 7, height: 18, borderRadius: 9, backgroundColor: COLORS.bg2, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  tagText: { fontSize: 9.5, fontWeight: "800", letterSpacing: 0.3, color: COLORS.textMuted }
});
export {
  ItemArt,
  SLOT_ICON,
  ShopIcon
};
