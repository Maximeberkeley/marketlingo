import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { COLORS } from "../../lib/constants";
import { LEO_BASE, SHOP_ART } from "../../lib/shopArt";
import { avatarLayers } from "../../lib/shopEconomy";
import { SocialAvatar } from "../social/SocialAvatar";
const hasArt = (id) => id in SHOP_ART;
function LeoAvatar({ look, size = 44, crown = false, ring, ringWidth = 0, bg, name, dim = false, style, crop = true }) {
  if (look === void 0 && name !== void 0) {
    return /* @__PURE__ */ React.createElement(SocialAvatar, { name, size, ring, ringWidth: ringWidth || 2.5, dim });
  }
  const layers = avatarLayers(look ?? {}, { crown, hasArt });
  if (!crop) {
    return /* @__PURE__ */ React.createElement(View, { style: [{ width: size, height: size, opacity: dim ? 0.55 : 1 }, style], accessibilityRole: "image", accessibilityLabel: name ? `${name}'s Leo` : "Leo" }, layers.map((key) => /* @__PURE__ */ React.createElement(Image, { key, source: key === "base" ? LEO_BASE : SHOP_ART[key], style: { position: "absolute", width: size, height: size }, resizeMode: "contain" })));
  }
  const inner = size - ringWidth * 2;
  return /* @__PURE__ */ React.createElement(
    View,
    {
      style: [{ width: size, height: size, borderRadius: size / 2, borderWidth: ringWidth, borderColor: ring ?? "transparent", opacity: dim ? 0.55 : 1 }, style],
      accessibilityRole: "image",
      accessibilityLabel: name ? `${name}'s Leo` : "Leo"
    },
    /* @__PURE__ */ React.createElement(View, { style: [styles.disc, { width: inner, height: inner, borderRadius: inner / 2, backgroundColor: bg ?? COLORS.xpBadgeSurface }] }, layers.map((key) => /* @__PURE__ */ React.createElement(Image, { key, source: key === "base" ? LEO_BASE : SHOP_ART[key], style: { position: "absolute", width: inner, height: inner }, resizeMode: "contain" })))
  );
}
const styles = StyleSheet.create({
  disc: { overflow: "hidden" }
});
export {
  LeoAvatar
};
