import React from "react";
import { Image, Pressable, View } from "react-native";
import { router } from "expo-router";
import { SHOP_ART } from "../../lib/shopArt";
import { triggerHaptic } from "../../lib/haptics";
import { Twinkle } from "./Motion";
import { Sparkle } from "./Scene";
const BOX = { x: 288, y: 672, w: 184, h: 268 };
const PODIUM_MEDALS = ["medal-gold", "medal-silver", "medal-bronze"];
const NAMES = ["Gold", "Silver", "Bronze"];
function MedalGlint({ place, height = 46, interactive = true }) {
  const id = PODIUM_MEDALS[place - 1];
  const art = SHOP_ART[id];
  if (!art) return null;
  const k = height / BOX.h;
  const medal = /* @__PURE__ */ React.createElement(View, { style: { width: BOX.w * k, height, overflow: "hidden" } }, /* @__PURE__ */ React.createElement(Image, { source: art, style: { position: "absolute", left: -BOX.x * k, top: -BOX.y * k, width: 1024 * k, height: 1024 * k }, resizeMode: "contain" }));
  if (!interactive) return medal;
  return /* @__PURE__ */ React.createElement(
    Pressable,
    {
      onPress: () => {
        triggerHaptic("light");
        router.push(`/shop-item?id=${id}`);
      },
      hitSlop: 10,
      accessibilityRole: "button",
      accessibilityLabel: `${NAMES[place - 1]} medal quest`
    },
    medal,
    /* @__PURE__ */ React.createElement(Twinkle, { phase: place * 450, period: 1600, style: { position: "absolute", right: -6, top: -4 } }, /* @__PURE__ */ React.createElement(Sparkle, { size: 10, color: "#FFFFFF" }))
  );
}
export {
  MedalGlint,
  PODIUM_MEDALS
};
