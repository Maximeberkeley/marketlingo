import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Polygon, Rect } from "react-native-svg";
import { COLORS } from "../lib/constants";
import { triggerHaptic } from "../lib/haptics";
import { playSound } from "../lib/sounds";
import {
  BUNDLES,
  COSMETICS,
  RARITY_COLOR,
  RARITY_LABEL,
  SLOT_LABEL,
  bundleFullPrice,
  collectionOf,
  cosmetic,
  priceOf
} from "../lib/shopCatalog";
import { BLOCK_LABEL, buyBlock, requirementProgress } from "../lib/shopEconomy";
import { hasArt, todaysPrice, useShop } from "../hooks/useShop";
import { LeoAvatar } from "../components/shop/LeoAvatar";
import { ItemArt } from "../components/shop/ItemArt";
import { PriceButton, XPChip } from "../components/shop/ShopKit";
import { Float, Pop, Sheen, useReduceMotion } from "../components/shop/Motion";
import { FloatIcon, FloorShadow, SCENES, SceneBackdrop, Sunburst, Twinkles } from "../components/shop/Scene";
import { ChunkyButton } from "../components/social/ChunkyButton";
import { ConfettiBurst } from "../components/ui/ConfettiBurst";
const fmt = (n) => n.toLocaleString("en-US");
const STAGE_H = 256;
const LEO_TRY = 336;
function ShopItemScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const shop = useShop();
  const { width } = useWindowDimensions();
  const bundle = params.bundle ? BUNDLES.find((b) => b.id === params.bundle) : void 0;
  const item = params.id ? cosmetic(params.id) : void 0;
  const parts = bundle ? bundle.items.map((id) => cosmetic(id)).filter(Boolean) : item ? [item] : [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(!!params.claimed);
  const [short, setShort] = useState(false);
  if (!parts.length) {
    return /* @__PURE__ */ React.createElement(View, { style: [styles.root, styles.center] }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.name }, "That item is gone"), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.link, onPress: () => router.back() }, "Back to the Shop"));
  }
  const name = bundle ? bundle.name : item.name;
  const lead = parts[0];
  const color = RARITY_COLOR[lead.rarity];
  const collection = bundle?.collection ?? lead.collection ? collectionOf(bundle?.collection ?? lead.collection) : null;
  const wearing = Object.fromEntries(parts.map((p) => [p.slot, p.id]));
  const sceneKey = bundle?.collection ?? lead.collection ?? "promo";
  const theme = sceneKey in SCENES ? sceneKey : "promo";
  const stageW = width - 40;
  const owned = parts.every((p) => shop.owns(p.id));
  const worn = parts.every((p) => (shop.look[p.slot] ?? (p.id === "grad-cap" ? "grad-cap" : void 0)) === p.id);
  const art = parts.every((p) => hasArt(p.id));
  const earnOnly = !bundle && lead.acquisition === "reward";
  const progress = earnOnly ? requirementProgress(lead.requires, shop.stats) : null;
  const deal = !bundle && params.deal ? todaysPrice(shop, lead.id).deal : null;
  const full = bundle ? bundleFullPrice(bundle) : priceOf(lead);
  const price = bundle ? bundle.price : deal ? deal.dealPrice : full;
  const block = owned ? "owned" : buyBlock({ price, balance: shop.balance.balance, hasArt: art, earnOnly, comingSoon: !shop.available && shop.ready });
  const paired = (lead.pairsWith ?? []).map((id) => cosmetic(id)).filter((c) => !!c && hasArt(c.id));
  const goesWith = bundle ? [] : (paired.length ? paired : lead.collection ? COSMETICS.filter((c) => c.collection === lead.collection && c.id !== lead.id && c.slot !== lead.slot && hasArt(c.id)) : []).slice(0, 3);
  const wearAll = async () => {
    for (const p of parts) await shop.equip(p.slot, p.id);
  };
  const removeAll = async () => {
    for (const p of parts) await shop.equip(p.slot, null);
  };
  const buy = async () => {
    if (block === "not_enough") {
      setShort(true);
      return;
    }
    if (block) return;
    setBusy(true);
    setError(null);
    const r = await shop.purchase(bundle ? bundle.id : lead.id, { dealDate: deal ? shop.dealDate : void 0 });
    setBusy(false);
    if (r.ok === false) {
      if (r.error === "not_enough") {
        setShort(true);
        return;
      }
      setError(r.error === "requirement_not_met" ? "Finish its requirement first." : r.error === "owned" ? "You already own this." : "That did not go through. Try again.");
      return;
    }
    playSound("lessonComplete").catch(() => {
    });
    setSuccess(true);
  };
  return /* @__PURE__ */ React.createElement(View, { style: [styles.root, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 14 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.top }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.back(), hitSlop: 12, accessibilityRole: "button", accessibilityLabel: "Close" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 24, color: COLORS.textPrimary })), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.topCaption, numberOfLines: 1 }, collection ? collection.name : SLOT_LABEL[lead.slot]), /* @__PURE__ */ React.createElement(XPChip, { value: shop.balance.balance })), /* @__PURE__ */ React.createElement(View, { style: styles.middle }, /* @__PURE__ */ React.createElement(View, { style: [styles.stage, { width: stageW }] }, /* @__PURE__ */ React.createElement(View, { style: styles.stageCard }, /* @__PURE__ */ React.createElement(SceneBackdrop, { theme, sceneId: sceneKey }), /* @__PURE__ */ React.createElement(Sunburst, { size: 520, cx: stageW / 2, cy: STAGE_H * 0.6, color: SCENES[theme].ray, opacity: SCENES[theme].rayOpacity }), /* @__PURE__ */ React.createElement(Twinkles, { w: stageW, h: STAGE_H, color: SCENES[theme].spark }), /* @__PURE__ */ React.createElement(FloorShadow, { width: 260, cx: stageW / 2, y: STAGE_H - 4, dark: 0.45 }), (lead.rarity === "epic" || lead.rarity === "legendary") && /* @__PURE__ */ React.createElement(Sheen, { width: stageW, every: 3600 })), /* @__PURE__ */ React.createElement(FloatIcon, { id: SCENES[theme].icons[0], size: 50, x: 10, y: STAGE_H - 78, depth: 2, phase: 200 }), /* @__PURE__ */ React.createElement(FloatIcon, { id: SCENES[theme].icons[1], size: 40, x: stageW - 58, y: 22, depth: 0, phase: 900 }), /* @__PURE__ */ React.createElement(Float, { distance: 6, style: { position: "absolute", left: stageW / 2 - LEO_TRY / 2, top: STAGE_H - LEO_TRY * 0.955 + 4 } }, /* @__PURE__ */ React.createElement(LeoAvatar, { look: art ? { ...shop.look, ...wearing } : {}, size: LEO_TRY, crop: false })), /* @__PURE__ */ React.createElement(View, { style: [styles.rarityTag, { backgroundColor: color }] }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.rarityTagText }, RARITY_LABEL[lead.rarity].toUpperCase())), !art && /* @__PURE__ */ React.createElement(View, { style: styles.drawing }, /* @__PURE__ */ React.createElement(Feather, { name: "edit-3", size: 13, color: "#FFFFFF" }), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.drawingText }, "Picture on the way"))), /* @__PURE__ */ React.createElement(View, { style: styles.info }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: [styles.kicker, { color }] }, bundle ? `Set of ${parts.length}` : `${RARITY_LABEL[lead.rarity]} ${SLOT_LABEL[lead.slot].toLowerCase()}`), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.name }, name), bundle ? /* @__PURE__ */ React.createElement(View, { style: styles.parts }, parts.map((p) => /* @__PURE__ */ React.createElement(ItemArt, { key: p.id, item: p, size: 64, showTag: false }))) : earnOnly && progress ? /* @__PURE__ */ React.createElement(View, { style: styles.progressCard }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.progressLabel }, progress.met ? "Unlocked" : progress.label), /* @__PURE__ */ React.createElement(View, { style: styles.track }, /* @__PURE__ */ React.createElement(View, { style: [styles.fill, { width: `${Math.max(4, progress.current / progress.target * 100)}%` }] })), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.progressCount }, fmt(progress.current), " / ", fmt(progress.target), " \xB7 Earned, not bought")) : collection ? /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.line }, collection.hook, ".") : null, goesWith.length > 0 && /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.goes }, "Goes with ", goesWith.map((g, i) => /* @__PURE__ */ React.createElement(Text, { key: g.id }, i === 0 ? "" : i === goesWith.length - 1 ? " and " : ", ", /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.link, onPress: () => router.replace(`/shop-item?id=${g.id}`) }, g.name)))))), /* @__PURE__ */ React.createElement(View, { style: styles.footer }, error ? /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.error }, error) : null, owned ? worn ? /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Remove", tone: "plain", onPress: () => {
    triggerHaptic("light");
    void removeAll();
  }, height: 52, accessibilityLabel: `Wearing ${name}. Remove it` }) : /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Wear it", onPress: () => {
    triggerHaptic("light");
    void wearAll();
  }, height: 52 }) : block && block !== "not_enough" ? /* @__PURE__ */ React.createElement(View, { style: styles.blocked }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.blockedText }, block === "earn_only" ? "Earn it, XP cannot buy it" : BLOCK_LABEL[block])) : /* @__PURE__ */ React.createElement(PriceButton, { price, was: bundle || deal ? full : null, label: "Buy & equip", onPress: () => {
    void buy();
  }, busy, height: 52 }), !owned && !block && price !== null && /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.after }, fmt(shop.balance.balance), " XP now, ", fmt(shop.balance.balance - price), " after"), block === "not_enough" && price !== null && /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.after }, fmt(price - shop.balance.balance), " XP to go")), /* @__PURE__ */ React.createElement(NotEnoughSheet, { visible: short, onClose: () => setShort(false), name, price: price ?? 0, balance: shop.balance.balance, item: lead }), success && /* @__PURE__ */ React.createElement(
    SuccessView,
    {
      name,
      look: { ...shop.look, ...wearing },
      rarity: lead.rarity,
      worn,
      onWear: async () => {
        await wearAll();
        router.back();
      },
      onKeep: () => router.back()
    }
  ));
}
function SuccessView({ name, look, rarity, onWear, onKeep, worn }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const color = RARITY_COLOR[rarity];
  const leo = Math.min(300, width * 0.78, height * 0.4);
  const reduce = useReduceMotion();
  useEffect(() => {
    triggerHaptic("success");
  }, []);
  return /* @__PURE__ */ React.createElement(View, { style: StyleSheet.absoluteFill }, /* @__PURE__ */ React.createElement(LinearGradient, { colors: [shade(color, 0.35), color, shade(color, -0.45)], start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 }, style: StyleSheet.absoluteFill }), /* @__PURE__ */ React.createElement(Sunburst, { size: Math.max(width, height) * 1.5, cx: width / 2, cy: height * 0.38, color: "#FFFFFF", opacity: 0.32, rays: 20, period: 22e3 }), /* @__PURE__ */ React.createElement(Twinkles, { w: width, h: height, color: "#FFFFFF", points: [[0.12, 0.16, 20], [0.86, 0.12, 24], [0.2, 0.5, 14], [0.84, 0.46, 16], [0.5, 0.08, 12], [0.1, 0.66, 10], [0.9, 0.62, 12]] }), /* @__PURE__ */ React.createElement(View, { style: [styles.successBody, { paddingTop: insets.top + 24 }] }, /* @__PURE__ */ React.createElement(View, { style: { width: leo, height: leo } }, /* @__PURE__ */ React.createElement(FloorShadow, { width: leo * 0.8, cx: leo / 2, y: leo * 0.95, dark: 0.4 }), /* @__PURE__ */ React.createElement(Pop, { delay: 120 }, /* @__PURE__ */ React.createElement(Float, { distance: 6 }, /* @__PURE__ */ React.createElement(LeoAvatar, { look, size: leo, crop: false })))), /* @__PURE__ */ React.createElement(Pop, { delay: 380 }, /* @__PURE__ */ React.createElement(View, { style: styles.ribbon }, /* @__PURE__ */ React.createElement(Svg, { width: 220, height: 50, viewBox: "0 0 220 50", style: StyleSheet.absoluteFill }, /* @__PURE__ */ React.createElement(Polygon, { points: "0,14 34,14 34,46 0,46 12,30", fill: shade(color, -0.3) }), /* @__PURE__ */ React.createElement(Polygon, { points: "220,14 186,14 186,46 220,46 208,30", fill: shade(color, -0.3) }), /* @__PURE__ */ React.createElement(Polygon, { points: "24,38 34,46 34,38", fill: shade(color, -0.55) }), /* @__PURE__ */ React.createElement(Polygon, { points: "196,38 186,46 186,38", fill: shade(color, -0.55) }), /* @__PURE__ */ React.createElement(Rect, { x: "24", y: "4", width: "172", height: "34", rx: "6", fill: "#FFFFFF" })), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: [styles.ribbonText, { color: shade(color, -0.35) }] }, RARITY_LABEL[rarity].toUpperCase()))), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.successTitle }, "It's yours!"), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.successLine }, name), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.successSub }, "New in your wardrobe")), /* @__PURE__ */ React.createElement(View, { style: { paddingHorizontal: 20, paddingBottom: insets.bottom + 18 } }, /* @__PURE__ */ React.createElement(ChunkyButton, { tone: "gold", label: worn ? "Wearing it" : "Wear it", onPress: onWear, height: 54, haptic: true }), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onKeep, style: styles.keep, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.keepText }, "Keep shopping"))), /* @__PURE__ */ React.createElement(ConfettiBurst, { show: !reduce, count: 40 }));
}
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount));
  const [r, g, b] = [n >> 16 & 255, n >> 8 & 255, n & 255].map(ch);
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}
function NotEnoughSheet({ visible, onClose, name, price, balance, item }) {
  const insets = useSafeAreaInsets();
  const go = (path) => {
    onClose();
    router.push(path);
  };
  const rows = [
    { icon: "home", title: "Finish today's lesson", sub: "The biggest XP of the day", xp: "+90 XP", path: "/(tabs)/home" },
    { icon: "zap", title: "Daily Arena", sub: "Three quick rounds", xp: "up to +100 XP", path: "/arena" },
    { icon: "briefcase", title: "Deep Cases", sub: "Three a day", xp: "+30 XP each", path: "/deep-case" }
  ];
  return /* @__PURE__ */ React.createElement(Modal, { visible, transparent: true, animationType: "slide", onRequestClose: onClose }, /* @__PURE__ */ React.createElement(Pressable, { style: styles.scrim, onPress: onClose }), /* @__PURE__ */ React.createElement(View, { style: [styles.sheet, { paddingBottom: insets.bottom + 16 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.grip }), /* @__PURE__ */ React.createElement(View, { style: styles.shortHead }, /* @__PURE__ */ React.createElement(ItemArt, { item, size: 58, showTag: false }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.shortTitle }, fmt(Math.max(0, price - balance)), " XP to go"), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.shortSub }, name, " costs ", fmt(price), ". You have ", fmt(balance), "."))), /* @__PURE__ */ React.createElement(View, { style: styles.track }, /* @__PURE__ */ React.createElement(View, { style: [styles.fill, { width: `${Math.max(4, Math.min(100, balance / Math.max(1, price) * 100))}%` }] })), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.earnToday }, "Earn it today"), rows.map((r) => /* @__PURE__ */ React.createElement(TouchableOpacity, { key: r.title, style: styles.earnRow, onPress: () => go(r.path), activeOpacity: 0.85, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(View, { style: styles.earnIcon }, /* @__PURE__ */ React.createElement(Feather, { name: r.icon, size: 17, color: COLORS.accent })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.earnTitle }, r.title), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.earnSub }, r.sub)), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: styles.earnXp }, r.xp))), /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Start today's lesson", onPress: () => go("/(tabs)/home"), height: 50, style: { marginTop: 10 } }), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onClose, style: styles.keep, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.3, style: [styles.keepText, { color: COLORS.textSecondary }] }, "Maybe later"))));
}
const styles = StyleSheet.create({
  drawing: { position: "absolute", alignSelf: "center", bottom: 14, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, height: 30, borderRadius: 15, backgroundColor: "rgba(0,0,0,0.45)" },
  drawingText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
  root: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 20 },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  top: { flexDirection: "row", alignItems: "center", gap: 12, height: 44 },
  topCaption: { flex: 1, textAlign: "center", fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  middle: { flex: 1, justifyContent: "center", paddingBottom: 24 },
  stage: { alignSelf: "center", height: STAGE_H, marginTop: 50 },
  stageCard: { ...StyleSheet.absoluteFillObject, borderRadius: 26, overflow: "hidden", borderBottomWidth: 5, borderColor: "rgba(0,0,0,0.18)" },
  rarityTag: { position: "absolute", left: 14, top: 14, paddingHorizontal: 10, height: 24, borderRadius: 12, justifyContent: "center" },
  rarityTagText: { fontSize: 11, fontWeight: "900", letterSpacing: 1, color: "#FFFFFF" },
  info: { alignItems: "center", marginTop: 22, gap: 6 },
  kicker: { fontSize: 13.5, fontWeight: "800" },
  name: { fontSize: 28, fontWeight: "900", color: COLORS.textPrimary, textAlign: "center", letterSpacing: -0.4 },
  line: { fontSize: 15, color: COLORS.textSecondary, textAlign: "center" },
  goes: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 4 },
  link: { color: COLORS.accent, fontWeight: "800" },
  parts: { flexDirection: "row", gap: 10, marginTop: 6 },
  progressCard: { alignSelf: "stretch", marginTop: 8, padding: 14, borderRadius: 16, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  progressLabel: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  progressCount: { fontSize: 12.5, fontWeight: "700", color: COLORS.textSecondary, marginTop: 8 },
  track: { height: 10, borderRadius: 5, backgroundColor: COLORS.border, marginTop: 10, overflow: "hidden" },
  fill: { height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  footer: { gap: 8 },
  error: { fontSize: 13, fontWeight: "700", color: COLORS.error, textAlign: "center" },
  blocked: { height: 56, borderRadius: 16, backgroundColor: COLORS.bg1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  blockedText: { fontSize: 15, fontWeight: "800", color: COLORS.textMuted },
  after: { fontSize: 12.5, fontWeight: "600", color: COLORS.textMuted, textAlign: "center" },
  successBody: { flex: 1, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 40, fontWeight: "900", color: "#FFFFFF", marginTop: 14, letterSpacing: -0.6, textShadowColor: "rgba(0,0,0,0.18)", textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 },
  successLine: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", opacity: 0.92, textAlign: "center", marginTop: 4 },
  ribbon: { width: 220, height: 50, marginTop: -4, alignItems: "center", paddingTop: 11 },
  ribbonText: { fontSize: 15, fontWeight: "900", letterSpacing: 2.5 },
  successSub: { fontSize: 14, fontWeight: "700", color: "#FFFFFF", opacity: 0.75, marginTop: 6 },
  keep: { alignItems: "center", paddingVertical: 14 },
  keepText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  scrim: { flex: 1, backgroundColor: "rgba(10, 10, 20, 0.45)" },
  sheet: { backgroundColor: COLORS.bg0, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10 },
  grip: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.border, marginBottom: 16 },
  shortHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  shortTitle: { fontSize: 20, fontWeight: "900", color: COLORS.textPrimary },
  shortSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  earnToday: { fontSize: 13, fontWeight: "800", color: COLORS.textPrimary, marginTop: 18, marginBottom: 8 },
  earnRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border, marginBottom: 8, backgroundColor: COLORS.bg2 },
  earnIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.accentSoft, alignItems: "center", justifyContent: "center" },
  earnTitle: { fontSize: 14.5, fontWeight: "800", color: COLORS.textPrimary },
  earnSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  earnXp: { fontSize: 13, fontWeight: "900", color: COLORS.accent }
});
export {
  ShopItemScreen as default
};
