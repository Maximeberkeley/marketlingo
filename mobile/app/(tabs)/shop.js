import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../../lib/constants";
import { isDark } from "../../lib/theme";
import { triggerHaptic } from "../../lib/haptics";
import {
  BUNDLES,
  COLLECTIONS,
  COSMETICS,
  PERKS,
  POWER_UPS,
  RARITY_COLOR,
  RARITY_LABEL,
  STREAK_FREEZE_ID,
  bundleFullPrice,
  cosmetic,
  priceOf
} from "../../lib/shopCatalog";
import { formatCountdown, msUntilLocalMidnight, msUntilNextMonday, requirementProgress, weeklyFeature } from "../../lib/shopEconomy";
import { hasArt, useShop } from "../../hooks/useShop";
import { LeoAvatar } from "../../components/shop/LeoAvatar";
import { ItemArt, ShopIcon } from "../../components/shop/ItemArt";
import { Carousel, Flask, PriceButton, Row, SectionHead, XPChip } from "../../components/shop/ShopKit";
import { Float, Rise, Sheen, useNow } from "../../components/shop/Motion";
import { XPSheet } from "../../components/shop/XPSheet";
import { ChunkyButton } from "../../components/social/ChunkyButton";
const SHOP_SEEN_KEY = "ml_shop_tab_seen_v1";
const fmt = (n) => n.toLocaleString("en-US");
const open = (path) => {
  triggerHaptic("light");
  router.push(path);
};
function ShopScreen() {
  const insets = useSafeAreaInsets();
  const shop = useShop();
  const now = useNow();
  const [xpOpen, setXpOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useFocusEffect(useCallback(() => {
    AsyncStorage.setItem(SHOP_SEEN_KEY, "1").catch(() => {
    });
    void shop.refresh().then(() => shop.checkRewards());
  }, []));
  const onRefresh = async () => {
    setRefreshing(true);
    await shop.refresh();
    setRefreshing(false);
  };
  const feature = useMemo(() => {
    const sets = BUNDLES.filter((b) => b.items.every(hasArt)).map((bundle) => ({ kind: "bundle", bundle }));
    const items = COSMETICS.filter((c) => priceOf(c) !== null && hasArt(c.id) && (c.rarity === "epic" || c.rarity === "legendary")).map((item) => ({ kind: "item", item }));
    const pool = sets.length ? sets : items;
    const pick = weeklyFeature(pool.map((f) => ({ id: f.kind === "bundle" ? f.bundle.id : f.item.id, f })), now);
    return pick?.f ?? null;
  }, [now.toDateString()]);
  const freezes = shop.owned[STREAK_FREEZE_ID]?.qty ?? 0;
  const wardrobeCount = COSMETICS.filter((c) => !c.hidden && shop.owns(c.id)).length;
  const toClaim = COSMETICS.filter((c) => shop.owned[c.id]?.source === "reward" && !shop.owned[c.id]?.seenAt);
  const earnable = COSMETICS.filter((c) => c.acquisition === "reward" && !c.hidden && !shop.owns(c.id)).map((c) => ({ c, p: requirementProgress(c.requires, shop.stats) })).sort((a, b) => b.p.current / b.p.target - a.p.current / a.p.target).slice(0, 8);
  return /* @__PURE__ */ React.createElement(View, { style: styles.root }, /* @__PURE__ */ React.createElement(View, { style: [styles.header, { paddingTop: insets.top + 8 }] }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => open("/wardrobe"), accessibilityRole: "button", accessibilityLabel: "Dress Leo" }, /* @__PURE__ */ React.createElement(LeoAvatar, { look: shop.look, crown: shop.wearsCrown, size: 42, ring: COLORS.border, ringWidth: 1.5 })), /* @__PURE__ */ React.createElement(Text, { style: styles.headerTitle }, "Shop"), /* @__PURE__ */ React.createElement(XPChip, { value: shop.balance.balance, onPress: () => setXpOpen(true) })), /* @__PURE__ */ React.createElement(
    ScrollView,
    {
      contentContainerStyle: { paddingBottom: insets.bottom + 110, paddingTop: 6 },
      showsVerticalScrollIndicator: false,
      refreshControl: /* @__PURE__ */ React.createElement(RefreshControl, { refreshing, onRefresh, tintColor: COLORS.accent })
    },
    feature && /* @__PURE__ */ React.createElement(Rise, { index: 0, style: styles.pad }, /* @__PURE__ */ React.createElement(PromoCard, { feature, now, owned: feature.kind === "item" ? shop.owns(feature.item.id) : feature.bundle.items.every(shop.owns), look: shop.look })),
    /* @__PURE__ */ React.createElement(Rise, { index: 1, style: styles.section }, /* @__PURE__ */ React.createElement(SectionHead, { title: "Perks", tag: "REAL VALUE", sub: "Real help from people who hire.", action: "How it works", onAction: () => open(`/shop-perk?id=${PERKS[0].id}`) }), /* @__PURE__ */ React.createElement(
      Carousel,
      {
        items: PERKS,
        keyOf: (p) => p.id,
        render: (p, w) => /* @__PURE__ */ React.createElement(
          PerkCard,
          {
            perk: p,
            width: w,
            waitlist: shop.perks[p.id]?.waitlist ?? 0,
            joined: !!shop.perks[p.id]?.joined,
            locked: !!p.requires && !requirementProgress(p.requires, shop.stats).met,
            onJoin: () => {
              triggerHaptic("success");
              void shop.joinWaitlist(p.id);
            }
          }
        )
      }
    )),
    /* @__PURE__ */ React.createElement(Rise, { index: 2, style: styles.section }, /* @__PURE__ */ React.createElement(SectionHead, { title: "Your items" }), /* @__PURE__ */ React.createElement(View, { style: styles.yourItems }, /* @__PURE__ */ React.createElement(ItemTile, { label: "Streak Freeze", count: `\xD7${freezes}`, onPress: () => open("/shop-freeze") }, /* @__PURE__ */ React.createElement(ShopIcon, { id: "streak-freeze", size: 52 })), /* @__PURE__ */ React.createElement(ItemTile, { label: "Wardrobe", count: `${wardrobeCount} ${wardrobeCount === 1 ? "piece" : "pieces"}`, onPress: () => open("/wardrobe") }, /* @__PURE__ */ React.createElement(LeoAvatar, { look: shop.look, crown: shop.wearsCrown, size: 52, bg: "transparent" })), /* @__PURE__ */ React.createElement(ItemTile, { label: "To spend", count: fmt(shop.balance.balance), onPress: () => setXpOpen(true) }, /* @__PURE__ */ React.createElement(ShopIcon, { id: "xp-crate", size: 52 })))),
    toClaim.length > 0 && /* @__PURE__ */ React.createElement(Rise, { index: 3, style: styles.section }, /* @__PURE__ */ React.createElement(SectionHead, { title: "One-time rewards" }), /* @__PURE__ */ React.createElement(View, { style: styles.pad }, toClaim.map((c, i) => /* @__PURE__ */ React.createElement(View, { key: c.id, style: [styles.claimRow, i > 0 && styles.claimBorder] }, /* @__PURE__ */ React.createElement(ItemArt, { item: c, size: 48, showTag: false }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.claimTitle, numberOfLines: 1 }, c.name), /* @__PURE__ */ React.createElement(Text, { style: styles.claimSub, numberOfLines: 1 }, "Earned \xB7 ", c.rule)), /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        onPress: () => {
          triggerHaptic("success");
          void shop.markSeen([c.id]);
          open(`/shop-item?id=${c.id}&claimed=1`);
        },
        hitSlop: 8,
        accessibilityRole: "button",
        accessibilityLabel: `Claim ${c.name}`
      },
      /* @__PURE__ */ React.createElement(Text, { style: styles.claim }, "CLAIM")
    ))))),
    /* @__PURE__ */ React.createElement(Rise, { index: 4, style: styles.section }, /* @__PURE__ */ React.createElement(SectionHead, { title: "Power-ups" }), /* @__PURE__ */ React.createElement(Row, null, POWER_UPS.map((p) => /* @__PURE__ */ React.createElement(TouchableOpacity, { key: p.id, activeOpacity: 0.9, disabled: !p.live, onPress: () => open("/shop-freeze"), style: styles.powerTile, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(View, { style: [styles.powerArt, { backgroundColor: p.live ? isDark ? "rgba(56,189,248,0.14)" : "#EAF6FE" : COLORS.bg1 }] }, /* @__PURE__ */ React.createElement(Float, { distance: 4, phase: p.live ? 0 : 700 }, /* @__PURE__ */ React.createElement(View, { style: { opacity: p.live ? 1 : 0.55 } }, /* @__PURE__ */ React.createElement(ShopIcon, { id: p.icon, size: 64 })))), /* @__PURE__ */ React.createElement(View, { style: styles.tileBody }, /* @__PURE__ */ React.createElement(Text, { style: styles.tileTitle }, p.name), /* @__PURE__ */ React.createElement(Text, { style: styles.tileSub, numberOfLines: 2 }, p.line), p.live && p.price ? /* @__PURE__ */ React.createElement(PriceButton, { price: p.price, onPress: () => open("/shop-freeze"), height: 40, style: { marginTop: 10 } }) : /* @__PURE__ */ React.createElement(View, { style: styles.soonPill }, /* @__PURE__ */ React.createElement(Text, { style: styles.soonText }, "Coming soon"))))))),
    shop.deals.length > 0 && /* @__PURE__ */ React.createElement(Rise, { index: 5, style: styles.section }, /* @__PURE__ */ React.createElement(View, { style: styles.dealHead }, /* @__PURE__ */ React.createElement(SectionHead, { title: "Daily deals", sub: "New picks every midnight" }), /* @__PURE__ */ React.createElement(View, { style: styles.clock }, /* @__PURE__ */ React.createElement(Feather, { name: "clock", size: 13, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.clockText }, formatCountdown(msUntilLocalMidnight(now))))), /* @__PURE__ */ React.createElement(Row, null, shop.deals.map((d) => {
      const c = cosmetic(d.itemId);
      if (!c) return null;
      const owned = shop.owns(c.id);
      const color = RARITY_COLOR[c.rarity];
      return /* @__PURE__ */ React.createElement(TouchableOpacity, { key: d.itemId, activeOpacity: 0.9, onPress: () => open(`/shop-item?id=${c.id}&deal=1`), style: [styles.dealTile, { borderColor: color + "66" }], accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(View, { style: [styles.dealArt, { backgroundColor: color + (isDark ? "1F" : "14") }] }, /* @__PURE__ */ React.createElement(ItemArt, { item: c, size: 112 }), /* @__PURE__ */ React.createElement(View, { style: styles.offBadge }, /* @__PURE__ */ React.createElement(Text, { style: styles.offText }, "-30%")), c.rarity !== "common" && /* @__PURE__ */ React.createElement(Sheen, { width: 168, every: 4200, delay: 600 })), /* @__PURE__ */ React.createElement(View, { style: styles.tileBody }, /* @__PURE__ */ React.createElement(Text, { style: styles.tileTitle, numberOfLines: 1 }, c.name), /* @__PURE__ */ React.createElement(Text, { style: [styles.rarity, { color }] }, RARITY_LABEL[c.rarity].toUpperCase()), owned ? /* @__PURE__ */ React.createElement(View, { style: styles.ownedPill }, /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 13, color: COLORS.success }), /* @__PURE__ */ React.createElement(Text, { style: styles.ownedText }, "Owned")) : /* @__PURE__ */ React.createElement(PriceButton, { price: d.dealPrice, was: d.price, onPress: () => open(`/shop-item?id=${c.id}&deal=1`), height: 40, style: { marginTop: 10 } })));
    }))),
    /* @__PURE__ */ React.createElement(Rise, { index: 6, style: styles.section }, /* @__PURE__ */ React.createElement(SectionHead, { title: "Leo collections", sub: "Swipe through. Tap to try on." }), /* @__PURE__ */ React.createElement(Carousel, { items: COLLECTIONS, keyOf: (c) => c.id, autoMs: 5e3, render: (c, w) => /* @__PURE__ */ React.createElement(CollectionCard, { collection: c, width: w, owned: shop.owns }) })),
    /* @__PURE__ */ React.createElement(Rise, { index: 7, style: styles.section }, /* @__PURE__ */ React.createElement(SectionHead, { title: "Bundles", sub: "The full look for less" }), /* @__PURE__ */ React.createElement(Row, null, [...BUNDLES].sort((a, b) => Number(b.items.every(hasArt)) - Number(a.items.every(hasArt))).map((b) => {
      const ready = b.items.every(hasArt);
      const wear = Object.fromEntries(b.items.filter(hasArt).map((id) => [cosmetic(id).slot, id]));
      const owned = b.items.every(shop.owns);
      const full = bundleFullPrice(b);
      const save = Math.round((1 - b.price / full) * 100);
      return /* @__PURE__ */ React.createElement(TouchableOpacity, { key: b.id, activeOpacity: 0.9, onPress: () => open(`/shop-item?bundle=${b.id}`), style: styles.bundleTile, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(View, { style: [styles.bundleArt, { backgroundColor: isDark ? "rgba(251,191,36,0.10)" : "#FFF7E6" }] }, /* @__PURE__ */ React.createElement(LeoAvatar, { look: { hat: "", ...wear }, size: 100, bg: "transparent" }), /* @__PURE__ */ React.createElement(Text, { style: styles.bundleCount }, b.items.length, " pieces"), /* @__PURE__ */ React.createElement(View, { style: styles.saveBadge }, /* @__PURE__ */ React.createElement(Text, { style: styles.offText }, "Save ", save, "%"))), /* @__PURE__ */ React.createElement(View, { style: styles.tileBody }, /* @__PURE__ */ React.createElement(Text, { style: styles.tileTitle }, b.name), /* @__PURE__ */ React.createElement(Text, { style: styles.tileSub, numberOfLines: 1 }, b.line), owned ? /* @__PURE__ */ React.createElement(View, { style: styles.ownedPill }, /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 13, color: COLORS.success }), /* @__PURE__ */ React.createElement(Text, { style: styles.ownedText }, "Owned")) : ready ? /* @__PURE__ */ React.createElement(PriceButton, { price: b.price, was: full, onPress: () => open(`/shop-item?bundle=${b.id}`), height: 42, style: { marginTop: 10 } }) : /* @__PURE__ */ React.createElement(View, { style: [styles.soonPill, { marginTop: 12 }] }, /* @__PURE__ */ React.createElement(Text, { style: styles.soonText }, "Art soon \xB7 ", fmt(b.price), " XP"))));
    }))),
    earnable.length > 0 && /* @__PURE__ */ React.createElement(Rise, { index: 8, style: styles.section }, /* @__PURE__ */ React.createElement(LinearGradient, { colors: isDark ? ["#2A1858", "#1B1240"] : ["#5B21B6", "#4C1D95"], style: styles.earnBand }, /* @__PURE__ */ React.createElement(Text, { style: styles.earnTitle }, "Earn these"), /* @__PURE__ */ React.createElement(Text, { style: styles.earnSub }, "XP can't buy them. Only you can."), /* @__PURE__ */ React.createElement(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: { gap: 12, paddingTop: 14, paddingRight: 20 } }, earnable.map(({ c, p }) => /* @__PURE__ */ React.createElement(TouchableOpacity, { key: c.id, activeOpacity: 0.9, onPress: () => open(`/shop-item?id=${c.id}`), style: styles.earnTile, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(View, { style: styles.earnArt }, /* @__PURE__ */ React.createElement(View, { style: { opacity: p.met ? 1 : 0.55 } }, /* @__PURE__ */ React.createElement(ItemArt, { item: c, size: 92, showTag: false, tint: "transparent" })), /* @__PURE__ */ React.createElement(View, { style: [styles.lock, p.met && { backgroundColor: "#4ADE80" }] }, /* @__PURE__ */ React.createElement(Feather, { name: p.met ? "check" : "lock", size: 13, color: p.met ? "#052E16" : "#3A2600" }))), /* @__PURE__ */ React.createElement(Text, { style: styles.earnName, numberOfLines: 1 }, c.name), /* @__PURE__ */ React.createElement(Text, { style: styles.earnRule, numberOfLines: 2 }, p.label), /* @__PURE__ */ React.createElement(View, { style: styles.earnTrack }, /* @__PURE__ */ React.createElement(View, { style: [styles.earnFill, { width: `${Math.max(4, p.current / p.target * 100)}%` }] })), /* @__PURE__ */ React.createElement(Text, { style: styles.earnCount }, p.met ? "Earned \xB7 on its way" : `${fmt(p.current)} / ${fmt(p.target)}`)))))),
    !shop.available && shop.ready && /* @__PURE__ */ React.createElement(Text, { style: styles.offline }, "Buying opens soon. Your XP is safe and keeps growing.")
  ), /* @__PURE__ */ React.createElement(XPSheet, { visible: xpOpen, onClose: () => setXpOpen(false), inShop: true }));
}
function PromoCard({ feature, now, owned, look }) {
  const isSet = feature.kind === "bundle";
  const title = isSet ? feature.bundle.name : `Leo's ${feature.item.name.toLowerCase()}`;
  const line = isSet ? `${feature.bundle.line} \xB7 save ${Math.round((1 - feature.bundle.price / bundleFullPrice(feature.bundle)) * 100)}%` : `${RARITY_LABEL[feature.item.rarity]} \xB7 new this week`;
  const price = isSet ? feature.bundle.price : priceOf(feature.item);
  const was = isSet ? bundleFullPrice(feature.bundle) : null;
  const wear = isSet ? Object.fromEntries(feature.bundle.items.map((id) => [cosmetic(id).slot, id])) : { [feature.item.slot]: feature.item.id };
  const path = isSet ? `/shop-item?bundle=${feature.bundle.id}` : `/shop-item?id=${feature.item.id}`;
  return /* @__PURE__ */ React.createElement(TouchableOpacity, { activeOpacity: 0.94, onPress: () => open(path), accessibilityRole: "button", accessibilityLabel: `${title}. ${line}` }, /* @__PURE__ */ React.createElement(LinearGradient, { colors: ["#1E1B4B", "#4C1D95", "#7C3AED"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, style: styles.promo }, /* @__PURE__ */ React.createElement(View, { style: styles.promoTop }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(View, { style: styles.promoKicker }, /* @__PURE__ */ React.createElement(Feather, { name: "clock", size: 11, color: "#E9D5FF" }), /* @__PURE__ */ React.createElement(Text, { style: styles.promoKickerText }, "Featured \xB7 ", formatCountdown(msUntilNextMonday(now)))), /* @__PURE__ */ React.createElement(Text, { style: styles.promoTitle, numberOfLines: 2 }, title), /* @__PURE__ */ React.createElement(Text, { style: styles.promoLine, numberOfLines: 2 }, line)), /* @__PURE__ */ React.createElement(Float, { distance: 6 }, /* @__PURE__ */ React.createElement(LeoAvatar, { look: { ...look, ...wear }, size: 118, bg: "rgba(255,255,255,0.12)" })), /* @__PURE__ */ React.createElement(Float, { distance: 4, phase: 500, style: styles.sparkA }, /* @__PURE__ */ React.createElement(Text, { style: styles.spark }, "\u2726")), /* @__PURE__ */ React.createElement(Float, { distance: 5, phase: 900, style: styles.sparkB }, /* @__PURE__ */ React.createElement(Text, { style: [styles.spark, { fontSize: 14 }] }, "\u2726"))), /* @__PURE__ */ React.createElement(View, { style: styles.promoBtn }, owned ? /* @__PURE__ */ React.createElement(Text, { style: styles.promoBtnText }, "Owned \xB7 Wear it") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Flask, { size: 17, color: "#6D28D9" }), was ? /* @__PURE__ */ React.createElement(Text, { style: styles.promoWas }, fmt(was)) : null, /* @__PURE__ */ React.createElement(Text, { style: styles.promoBtnText }, fmt(price), " \xB7 Get the look"))), /* @__PURE__ */ React.createElement(Sheen, { width: 360, every: 4200 })));
}
function PerkCard({ perk, width, waitlist, joined, locked, onJoin }) {
  const status = locked ? "Unlocks after your Weekly Case" : waitlist >= 10 ? `Coming soon \xB7 ${fmt(waitlist)} on the waitlist` : "Coming soon";
  return /* @__PURE__ */ React.createElement(TouchableOpacity, { activeOpacity: 0.94, onPress: () => open(`/shop-perk?id=${perk.id}`), style: [styles.perk, { width }], accessibilityRole: "button", accessibilityLabel: `${perk.name}. ${status}` }, /* @__PURE__ */ React.createElement(LinearGradient, { colors: ["#171327", "#2B1F4E"], style: styles.perkArt }, /* @__PURE__ */ React.createElement(View, { style: styles.perkGlow }), /* @__PURE__ */ React.createElement(View, { style: styles.perkTag }, /* @__PURE__ */ React.createElement(Text, { style: styles.perkTagText }, "\u2726 PERK")), /* @__PURE__ */ React.createElement(Text, { style: styles.perkKicker }, perk.kicker.toUpperCase()), /* @__PURE__ */ React.createElement(Float, { distance: 5 }, /* @__PURE__ */ React.createElement(View, { style: styles.perkBadge }, /* @__PURE__ */ React.createElement(Feather, { name: perk.icon, size: 34, color: "#FCD34D" }))), /* @__PURE__ */ React.createElement(Sheen, { width, every: 5200, delay: 1200 })), /* @__PURE__ */ React.createElement(View, { style: styles.perkBody }, /* @__PURE__ */ React.createElement(Text, { style: styles.perkName, numberOfLines: 2 }, perk.name), /* @__PURE__ */ React.createElement(View, { style: styles.perkStatus }, /* @__PURE__ */ React.createElement(View, { style: [styles.statusDot, { backgroundColor: locked ? COLORS.textMuted : COLORS.success }] }), /* @__PURE__ */ React.createElement(Text, { style: styles.perkStatusText, numberOfLines: 1 }, status)), /* @__PURE__ */ React.createElement(View, { style: styles.perkActions }, /* @__PURE__ */ React.createElement(View, { style: styles.perkPrice }, /* @__PURE__ */ React.createElement(Flask, { size: 15, color: "#6D28D9" }), /* @__PURE__ */ React.createElement(Text, { style: styles.perkPriceText }, fmt(perk.price))), joined ? /* @__PURE__ */ React.createElement(View, { style: styles.joined }, /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 15, color: COLORS.success }), /* @__PURE__ */ React.createElement(Text, { style: styles.joinedText }, "You're on the list")) : /* @__PURE__ */ React.createElement(ChunkyButton, { label: locked ? "Notify me" : "Join waitlist", onPress: onJoin, height: 42, style: { flex: 1 } }))));
}
function CollectionCard({ collection, width, owned }) {
  const items = COSMETICS.filter((c) => c.collection === collection.id && !c.hidden);
  const drawn = items.filter((c) => hasArt(c.id));
  const look = Object.fromEntries(drawn.map((c) => [c.slot, c.id]));
  const have = items.filter((c) => owned(c.id)).length;
  const first = drawn[0] ?? items[0];
  return /* @__PURE__ */ React.createElement(TouchableOpacity, { activeOpacity: 0.94, onPress: () => open(`/shop-collection?id=${collection.id}`), style: [styles.coll, { width }], accessibilityRole: "button", accessibilityLabel: `${collection.name} collection` }, /* @__PURE__ */ React.createElement(LinearGradient, { colors: collection.tint, style: styles.collArt }, /* @__PURE__ */ React.createElement(View, { style: styles.collPill }, /* @__PURE__ */ React.createElement(Text, { style: styles.collPillText }, "COLLECTION")), /* @__PURE__ */ React.createElement(LeoAvatar, { look, size: 176, bg: "rgba(255,255,255,0.22)" }), !drawn.length && /* @__PURE__ */ React.createElement(View, { style: styles.collSoon }, /* @__PURE__ */ React.createElement(Text, { style: styles.soonText }, "Art soon")), /* @__PURE__ */ React.createElement(Sheen, { width, every: 5600, delay: 300 })), /* @__PURE__ */ React.createElement(View, { style: styles.collBody }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.collName }, collection.name), /* @__PURE__ */ React.createElement(Text, { style: styles.collHook, numberOfLines: 1 }, collection.hook), /* @__PURE__ */ React.createElement(Text, { style: styles.collOwned }, have, " of ", items.length, " owned")), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => open(first ? `/shop-collection?id=${collection.id}` : "/(tabs)/shop"), style: styles.seeSet, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.seeSetText }, "See set"))));
}
function ItemTile({ label, count, onPress, children }) {
  return /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress, activeOpacity: 0.88, style: styles.itemTile, accessibilityRole: "button", accessibilityLabel: `${label}: ${count}` }, /* @__PURE__ */ React.createElement(View, { style: styles.itemArt }, children), /* @__PURE__ */ React.createElement(Text, { style: styles.itemCount }, count), /* @__PURE__ */ React.createElement(Text, { style: styles.itemLabel, numberOfLines: 1 }, label));
}
const CARD = { backgroundColor: COLORS.bg2, borderRadius: 20, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border };
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 10, gap: 12, backgroundColor: COLORS.bg0 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 20, fontWeight: "900", color: COLORS.textPrimary },
  pad: { paddingHorizontal: 20 },
  section: { marginTop: 30 },
  promo: { borderRadius: 24, padding: 18, overflow: "hidden" },
  promoTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  promoKicker: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 9, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.14)" },
  promoKickerText: { fontSize: 11, fontWeight: "800", color: "#F3E8FF" },
  promoTitle: { fontSize: 24, lineHeight: 28, fontWeight: "900", color: "#FFFFFF", marginTop: 10 },
  promoLine: { fontSize: 13, fontWeight: "600", color: "#DDD6FE", marginTop: 4 },
  promoBtn: { marginTop: 16, height: 50, borderRadius: 25, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  promoBtnText: { fontSize: 16, fontWeight: "900", color: "#1E1B4B" },
  promoWas: { fontSize: 15, fontWeight: "700", color: "#9CA3AF", textDecorationLine: "line-through" },
  sparkA: { position: "absolute", right: 4, top: -2 },
  sparkB: { position: "absolute", right: 118, bottom: 4 },
  spark: { fontSize: 20, color: "#FDE68A" },
  perk: { ...CARD, overflow: "hidden" },
  perkArt: { height: 150, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  perkGlow: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(252, 211, 77, 0.16)" },
  perkTag: { position: "absolute", top: 12, left: 12, paddingHorizontal: 9, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: "#FCD34D", alignItems: "center", justifyContent: "center" },
  perkTagText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.8, color: "#FCD34D" },
  perkKicker: { position: "absolute", top: 17, right: 14, fontSize: 10.5, fontWeight: "800", letterSpacing: 1, color: "#C4B5FD" },
  perkBadge: { width: 76, height: 76, borderRadius: 38, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 2, borderColor: "rgba(252,211,77,0.55)", alignItems: "center", justifyContent: "center" },
  perkBody: { padding: 16, gap: 8 },
  perkName: { fontSize: 18, lineHeight: 23, fontWeight: "900", color: COLORS.textPrimary },
  perkStatus: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  perkStatusText: { flex: 1, fontSize: 12.5, fontWeight: "700", color: COLORS.textSecondary },
  perkActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  perkPrice: { flexDirection: "row", alignItems: "center", gap: 5, height: 42, paddingHorizontal: 12, borderRadius: 14, backgroundColor: isDark ? "rgba(255,200,61,0.16)" : "#FFF4D1" },
  perkPriceText: { fontSize: 15, fontWeight: "900", color: isDark ? "#FCD34D" : "#7A5A00" },
  joined: { flex: 1, height: 42, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: COLORS.successSoft },
  joinedText: { fontSize: 14, fontWeight: "800", color: COLORS.success },
  yourItems: { flexDirection: "row", gap: 10, paddingHorizontal: 20 },
  itemTile: { flex: 1, alignItems: "center", paddingVertical: 12, ...CARD },
  itemArt: { height: 56, alignItems: "center", justifyContent: "center" },
  itemCount: { fontSize: 15, fontWeight: "900", color: COLORS.textPrimary, marginTop: 6 },
  itemLabel: { fontSize: 11.5, fontWeight: "600", color: COLORS.textSecondary, marginTop: 1 },
  claimRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  claimBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  claimTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  claimSub: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 1 },
  claim: { fontSize: 14, fontWeight: "900", letterSpacing: 0.6, color: COLORS.accent },
  powerTile: { width: 168, overflow: "hidden", ...CARD },
  powerArt: { height: 104, alignItems: "center", justifyContent: "center" },
  tileBody: { padding: 12 },
  tileTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  tileSub: { fontSize: 12, lineHeight: 16, color: COLORS.textSecondary, marginTop: 2, minHeight: 32 },
  soonPill: { marginTop: 10, height: 36, borderRadius: 12, backgroundColor: COLORS.bg1, alignItems: "center", justifyContent: "center" },
  soonText: { fontSize: 12.5, fontWeight: "800", color: COLORS.textMuted },
  rarity: { fontSize: 10.5, fontWeight: "900", letterSpacing: 0.8, marginTop: 2 },
  ownedPill: { marginTop: 10, height: 40, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: COLORS.successSoft },
  ownedText: { fontSize: 13.5, fontWeight: "800", color: COLORS.success },
  dealHead: { flexDirection: "row", alignItems: "flex-start" },
  clock: { flexDirection: "row", alignItems: "center", gap: 5, height: 28, paddingHorizontal: 10, borderRadius: 14, backgroundColor: COLORS.accentSoft, marginRight: 20, marginTop: 4 },
  clockText: { fontSize: 12.5, fontWeight: "800", color: COLORS.accent, fontVariant: ["tabular-nums"] },
  dealTile: { width: 168, overflow: "hidden", backgroundColor: COLORS.bg2, borderRadius: 20, borderWidth: 2, borderBottomWidth: 4 },
  dealArt: { height: 128, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  offBadge: { position: "absolute", top: 8, left: 8, paddingHorizontal: 7, height: 22, borderRadius: 7, backgroundColor: "#E11D48", alignItems: "center", justifyContent: "center" },
  offText: { fontSize: 11.5, fontWeight: "900", color: "#FFFFFF" },
  coll: { ...CARD, overflow: "hidden" },
  collArt: { height: 206, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  collPill: { position: "absolute", top: 12, left: 12, paddingHorizontal: 9, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.32)", justifyContent: "center" },
  collPillText: { fontSize: 10, fontWeight: "900", letterSpacing: 1, color: "#FFFFFF" },
  collSoon: { position: "absolute", bottom: 10, right: 12, paddingHorizontal: 9, height: 22, borderRadius: 11, backgroundColor: COLORS.bg2, justifyContent: "center" },
  collBody: { flexDirection: "row", alignItems: "flex-end", padding: 16, gap: 12 },
  collName: { fontSize: 20, fontWeight: "900", color: COLORS.textPrimary },
  collHook: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  collOwned: { fontSize: 12.5, fontWeight: "800", color: COLORS.accent, marginTop: 10 },
  seeSet: { height: 42, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  seeSetText: { fontSize: 14, fontWeight: "800", color: COLORS.accent },
  bundleTile: { width: 276, overflow: "hidden", ...CARD },
  bundleArt: { height: 116, alignItems: "center", justifyContent: "center" },
  bundleCount: { position: "absolute", right: 12, bottom: 10, fontSize: 11.5, fontWeight: "800", color: COLORS.textMuted },
  saveBadge: { position: "absolute", top: 8, left: 8, paddingHorizontal: 8, height: 22, borderRadius: 7, backgroundColor: "#E11D48", alignItems: "center", justifyContent: "center" },
  earnBand: { paddingVertical: 22, paddingLeft: 20 },
  earnTitle: { fontSize: 22, fontWeight: "900", color: "#FFFFFF" },
  earnSub: { fontSize: 13, fontWeight: "600", color: "#DDD6FE", marginTop: 2 },
  earnTile: { width: 168, padding: 12, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.16)" },
  earnArt: { height: 100, borderRadius: 14, backgroundColor: "rgba(0,0,0,0.18)", alignItems: "center", justifyContent: "center" },
  lock: { position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: "#FCD34D", alignItems: "center", justifyContent: "center" },
  earnName: { fontSize: 15, fontWeight: "800", color: "#FFFFFF", marginTop: 10 },
  earnRule: { fontSize: 12, lineHeight: 16, color: "#DDD6FE", marginTop: 2, minHeight: 32 },
  earnTrack: { height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.18)", marginTop: 8, overflow: "hidden" },
  earnFill: { height: 7, borderRadius: 4, backgroundColor: "#FCD34D" },
  earnCount: { fontSize: 12.5, fontWeight: "800", color: "#FDE68A", marginTop: 6 },
  offline: { fontSize: 12.5, color: COLORS.textMuted, textAlign: "center", marginTop: 28, paddingHorizontal: 32 }
});
export {
  SHOP_SEEN_KEY,
  ShopScreen as default
};
