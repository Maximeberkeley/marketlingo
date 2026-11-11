import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { Flask, PriceButton, XPChip } from "../components/shop/ShopKit";
import { Float, useReduceMotion } from "../components/shop/Motion";
import { ChunkyButton } from "../components/social/ChunkyButton";
import { ConfettiBurst } from "../components/ui/ConfettiBurst";
const fmt = (n) => n.toLocaleString("en-US");
function ShopItemScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const shop = useShop();
  const bundle = params.bundle ? BUNDLES.find((b) => b.id === params.bundle) : void 0;
  const item = params.id ? cosmetic(params.id) : void 0;
  const parts = bundle ? bundle.items.map((id) => cosmetic(id)).filter(Boolean) : item ? [item] : [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(params.claimed ? { from: shop.balance.balance, to: shop.balance.balance } : null);
  const [short, setShort] = useState(false);
  if (!parts.length) {
    return /* @__PURE__ */ React.createElement(View, { style: [styles.root, styles.center] }, /* @__PURE__ */ React.createElement(Text, { style: styles.name }, "That item is gone"), /* @__PURE__ */ React.createElement(Text, { style: styles.link, onPress: () => router.back() }, "Back to the Shop"));
  }
  const name = bundle ? bundle.name : item.name;
  const lead = parts[0];
  const color = RARITY_COLOR[lead.rarity];
  const collection = bundle?.collection ?? lead.collection ? collectionOf(bundle?.collection ?? lead.collection) : null;
  const wearing = Object.fromEntries(parts.map((p) => [p.slot, p.id]));
  const owned = parts.every((p) => shop.owns(p.id));
  const worn = parts.every((p) => (shop.look[p.slot] ?? (p.id === "grad-cap" ? "grad-cap" : void 0)) === p.id);
  const art = parts.every((p) => hasArt(p.id));
  const earnOnly = !bundle && lead.acquisition === "reward";
  const progress = earnOnly ? requirementProgress(lead.requires, shop.stats) : null;
  const deal = !bundle && params.deal ? todaysPrice(shop, lead.id).deal : null;
  const full = bundle ? bundleFullPrice(bundle) : priceOf(lead);
  const price = bundle ? bundle.price : deal ? deal.dealPrice : full;
  const block = owned ? "owned" : buyBlock({ price, balance: shop.balance.balance, hasArt: art, earnOnly, comingSoon: !shop.available && shop.ready });
  const goesWith = !bundle && lead.collection ? COSMETICS.filter((c) => c.collection === lead.collection && c.id !== lead.id && c.slot !== lead.slot && hasArt(c.id)).slice(0, 2) : [];
  const wearAll = async () => {
    for (const p of parts) await shop.equip(p.slot, p.id);
  };
  const buy = async () => {
    if (block === "not_enough") {
      setShort(true);
      return;
    }
    if (block) return;
    setBusy(true);
    setError(null);
    const from = shop.balance.balance;
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
    triggerHaptic("success");
    playSound("lessonComplete").catch(() => {
    });
    setSuccess({ from, to: r.balance });
  };
  return /* @__PURE__ */ React.createElement(View, { style: [styles.root, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 14 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.top }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.back(), hitSlop: 12, accessibilityRole: "button", accessibilityLabel: "Close" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 24, color: COLORS.textPrimary })), /* @__PURE__ */ React.createElement(Text, { style: styles.topCaption, numberOfLines: 1 }, collection ? collection.name : SLOT_LABEL[lead.slot]), /* @__PURE__ */ React.createElement(XPChip, { value: shop.balance.balance })), /* @__PURE__ */ React.createElement(View, { style: styles.middle }, /* @__PURE__ */ React.createElement(View, { style: styles.stage }, /* @__PURE__ */ React.createElement(Float, { distance: 4 }, /* @__PURE__ */ React.createElement(LeoAvatar, { look: { ...shop.look, ...wearing }, size: 250, bg: color + "1A" }))), /* @__PURE__ */ React.createElement(View, { style: styles.info }, /* @__PURE__ */ React.createElement(Text, { style: [styles.kicker, { color }] }, bundle ? `SET \xB7 ${parts.length} PIECES` : `${RARITY_LABEL[lead.rarity].toUpperCase()} \xB7 ${SLOT_LABEL[lead.slot].toUpperCase()}`), /* @__PURE__ */ React.createElement(Text, { style: styles.name }, name), bundle ? /* @__PURE__ */ React.createElement(View, { style: styles.parts }, parts.map((p) => /* @__PURE__ */ React.createElement(ItemArt, { key: p.id, item: p, size: 64, showTag: false }))) : earnOnly && progress ? /* @__PURE__ */ React.createElement(View, { style: styles.progressCard }, /* @__PURE__ */ React.createElement(Text, { style: styles.progressLabel }, progress.met ? "Unlocked" : progress.label), /* @__PURE__ */ React.createElement(View, { style: styles.track }, /* @__PURE__ */ React.createElement(View, { style: [styles.fill, { width: `${Math.max(4, progress.current / progress.target * 100)}%` }] })), /* @__PURE__ */ React.createElement(Text, { style: styles.progressCount }, fmt(progress.current), " / ", fmt(progress.target), " \xB7 Earned, not bought")) : collection ? /* @__PURE__ */ React.createElement(Text, { style: styles.line }, collection.hook, ".") : null, goesWith.length > 0 && /* @__PURE__ */ React.createElement(Text, { style: styles.goes }, "Goes with ", goesWith.map((g, i) => /* @__PURE__ */ React.createElement(Text, { key: g.id }, i > 0 ? " and " : "", /* @__PURE__ */ React.createElement(Text, { style: styles.link, onPress: () => router.replace(`/shop-item?id=${g.id}`) }, g.name)))))), /* @__PURE__ */ React.createElement(View, { style: styles.footer }, error ? /* @__PURE__ */ React.createElement(Text, { style: styles.error }, error) : null, owned ? /* @__PURE__ */ React.createElement(ChunkyButton, { label: worn ? "Wearing it" : "Wear it", disabled: worn, onPress: () => {
    triggerHaptic("light");
    void wearAll();
  }, height: 52 }) : block && block !== "not_enough" ? /* @__PURE__ */ React.createElement(View, { style: styles.blocked }, /* @__PURE__ */ React.createElement(Text, { style: styles.blockedText }, block === "earn_only" ? "Earn it, XP cannot buy it" : BLOCK_LABEL[block])) : /* @__PURE__ */ React.createElement(PriceButton, { price, was: bundle || deal ? full : null, label: "Buy & equip", onPress: () => {
    void buy();
  }, busy, height: 52 }), !owned && !block && price !== null && /* @__PURE__ */ React.createElement(Text, { style: styles.after }, fmt(shop.balance.balance), " XP now, ", fmt(shop.balance.balance - price), " after"), block === "not_enough" && price !== null && /* @__PURE__ */ React.createElement(Text, { style: styles.after }, fmt(price - shop.balance.balance), " XP to go")), /* @__PURE__ */ React.createElement(NotEnoughSheet, { visible: short, onClose: () => setShort(false), name, price: price ?? 0, balance: shop.balance.balance, item: lead }), success && /* @__PURE__ */ React.createElement(
    SuccessView,
    {
      name,
      look: { ...shop.look, ...wearing },
      from: success.from,
      to: success.to,
      onEquip: async () => {
        await wearAll();
        router.back();
      },
      onKeep: () => router.back()
    }
  ));
}
function SuccessView({ name, look, from, to, onEquip, onKeep }) {
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const pop = useRef(new Animated.Value(reduce ? 1 : 0.6)).current;
  const roll = useRef(new Animated.Value(from)).current;
  const [shown, setShown] = useState(from);
  useEffect(() => {
    if (reduce) {
      setShown(to);
      return;
    }
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    const id = roll.addListener(({ value }) => setShown(Math.round(value)));
    Animated.timing(roll, { toValue: to, duration: 900, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => roll.removeListener(id);
  }, [reduce, to, pop, roll]);
  return /* @__PURE__ */ React.createElement(View, { style: StyleSheet.absoluteFill }, /* @__PURE__ */ React.createElement(LinearGradient, { colors: ["#6D28D9", "#8B5CF6"], style: [StyleSheet.absoluteFill, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 18, paddingHorizontal: 20 }] }, /* @__PURE__ */ React.createElement(View, { style: { alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement(View, { style: styles.successChip }, /* @__PURE__ */ React.createElement(Flask, { size: 16, color: "#6D28D9" }), /* @__PURE__ */ React.createElement(Text, { style: styles.successChipText }, fmt(shown)))), /* @__PURE__ */ React.createElement(View, { style: styles.successBody }, /* @__PURE__ */ React.createElement(Animated.View, { style: { transform: [{ scale: pop }] } }, /* @__PURE__ */ React.createElement(LeoAvatar, { look, size: 230, ring: "#FCD34D", ringWidth: 5, bg: "rgba(255,255,255,0.16)" })), /* @__PURE__ */ React.createElement(Text, { style: styles.successTitle }, "It's yours!"), /* @__PURE__ */ React.createElement(Text, { style: styles.successLine }, name, " joined your wardrobe.")), /* @__PURE__ */ React.createElement(ChunkyButton, { tone: "gold", label: "Equip", onPress: onEquip, height: 52 }), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onKeep, style: styles.keep, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.keepText }, "Keep shopping"))), /* @__PURE__ */ React.createElement(ConfettiBurst, { show: true, count: 36 }));
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
  return /* @__PURE__ */ React.createElement(Modal, { visible, transparent: true, animationType: "slide", onRequestClose: onClose }, /* @__PURE__ */ React.createElement(Pressable, { style: styles.scrim, onPress: onClose }), /* @__PURE__ */ React.createElement(View, { style: [styles.sheet, { paddingBottom: insets.bottom + 16 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.grip }), /* @__PURE__ */ React.createElement(View, { style: styles.shortHead }, /* @__PURE__ */ React.createElement(ItemArt, { item, size: 58, showTag: false }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.shortTitle }, fmt(Math.max(0, price - balance)), " XP to go"), /* @__PURE__ */ React.createElement(Text, { style: styles.shortSub }, name, " costs ", fmt(price), ". You have ", fmt(balance), "."))), /* @__PURE__ */ React.createElement(View, { style: styles.track }, /* @__PURE__ */ React.createElement(View, { style: [styles.fill, { width: `${Math.max(4, Math.min(100, balance / Math.max(1, price) * 100))}%` }] })), /* @__PURE__ */ React.createElement(Text, { style: styles.earnToday }, "Earn it today"), rows.map((r) => /* @__PURE__ */ React.createElement(TouchableOpacity, { key: r.title, style: styles.earnRow, onPress: () => go(r.path), activeOpacity: 0.85, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(View, { style: styles.earnIcon }, /* @__PURE__ */ React.createElement(Feather, { name: r.icon, size: 17, color: COLORS.accent })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.earnTitle }, r.title), /* @__PURE__ */ React.createElement(Text, { style: styles.earnSub }, r.sub)), /* @__PURE__ */ React.createElement(Text, { style: styles.earnXp }, r.xp))), /* @__PURE__ */ React.createElement(ChunkyButton, { label: "Start today's lesson", onPress: () => go("/(tabs)/home"), height: 50, style: { marginTop: 10 } }), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onClose, style: styles.keep, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: [styles.keepText, { color: COLORS.textSecondary }] }, "Maybe later"))));
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 20 },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  top: { flexDirection: "row", alignItems: "center", gap: 12, height: 44 },
  topCaption: { flex: 1, textAlign: "center", fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  middle: { flex: 1, justifyContent: "center", paddingBottom: 24 },
  stage: { alignItems: "center", justifyContent: "center" },
  info: { alignItems: "center", marginTop: 22, gap: 6 },
  kicker: { fontSize: 11.5, fontWeight: "900", letterSpacing: 1 },
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
  successBody: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  successChip: { flexDirection: "row", alignItems: "center", gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: "#FFFFFF" },
  successChipText: { fontSize: 16, fontWeight: "900", color: "#6D28D9", fontVariant: ["tabular-nums"] },
  successTitle: { fontSize: 34, fontWeight: "900", color: "#FFFFFF", marginTop: 18 },
  successLine: { fontSize: 15, fontWeight: "600", color: "#EDE9FE", textAlign: "center" },
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
