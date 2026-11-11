import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { ChunkyButton } from "../social/ChunkyButton";
import { Dots, useReduceMotion } from "./Motion";
const FLASK_ON_GOLD = "#6D28D9";
const fmt = (n) => n.toLocaleString("en-US");
function Flask({ size = 16, color = COLORS.xpBadgeIcon }) {
  return /* @__PURE__ */ React.createElement(View, { style: { width: size + 2, height: size + 2, alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "flask", size, color }), /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "star-four-points", size: Math.round(size * 0.46), color: COLORS.xpBadgeSpark, style: { position: "absolute", top: -3, right: -3 } }));
}
function XPChip({ value, onPress, label }) {
  const body = /* @__PURE__ */ React.createElement(View, { style: styles.chip }, /* @__PURE__ */ React.createElement(Flask, { size: 18 }), /* @__PURE__ */ React.createElement(Text, { style: styles.chipText }, fmt(value)));
  return onPress ? /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress, activeOpacity: 0.85, accessibilityRole: "button", accessibilityLabel: label ?? `${fmt(value)} XP to spend` }, body) : body;
}
function PriceButton({ price, was, label, onPress, disabled, busy, height = 48, style }) {
  return /* @__PURE__ */ React.createElement(
    ChunkyButton,
    {
      tone: "gold",
      height,
      onPress,
      disabled,
      busy,
      style,
      accessibilityLabel: `${label ?? "Buy"} for ${fmt(price)} XP${was ? `, was ${fmt(was)}` : ""}`,
      icon: /* @__PURE__ */ React.createElement(View, { style: styles.priceIcon }, /* @__PURE__ */ React.createElement(Flask, { size: 17, color: FLASK_ON_GOLD }), was ? /* @__PURE__ */ React.createElement(Text, { style: styles.was }, fmt(was)) : null),
      label: label ? `${fmt(price)} \xB7 ${label}` : fmt(price)
    }
  );
}
function SectionHead({ title, sub, action, onAction, tag }) {
  return /* @__PURE__ */ React.createElement(View, { style: styles.head }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(View, { style: styles.titleRow }, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, title), tag ? /* @__PURE__ */ React.createElement(View, { style: styles.tag }, /* @__PURE__ */ React.createElement(Text, { style: styles.tagText }, tag)) : null), sub ? /* @__PURE__ */ React.createElement(Text, { style: styles.sub }, sub) : null), action && onAction ? /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onAction, hitSlop: 10, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.action }, action)) : null);
}
function Carousel({ items, render, keyOf, autoMs = 4e3, cardWidth: forced }) {
  const { width } = useWindowDimensions();
  const cardWidth = forced ?? Math.min(340, width - 52);
  const gap = 12;
  const ref = useRef(null);
  const [index, setIndex] = useState(0);
  const touched = useRef(false);
  const reduce = useReduceMotion();
  useEffect(() => {
    if (reduce || items.length < 2 || !autoMs) return;
    const id = setInterval(() => {
      if (touched.current) return;
      setIndex((i) => {
        const next = (i + 1) % items.length;
        ref.current?.scrollTo({ x: next * (cardWidth + gap), animated: true });
        return next;
      });
    }, autoMs);
    return () => clearInterval(id);
  }, [reduce, items.length, autoMs, cardWidth]);
  return /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(
    ScrollView,
    {
      ref,
      horizontal: true,
      showsHorizontalScrollIndicator: false,
      snapToInterval: cardWidth + gap,
      decelerationRate: "fast",
      contentContainerStyle: { paddingHorizontal: 20, gap },
      onScrollBeginDrag: () => {
        touched.current = true;
      },
      onMomentumScrollEnd: (e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (cardWidth + gap)))
    },
    items.map((item) => /* @__PURE__ */ React.createElement(View, { key: keyOf(item), style: { width: cardWidth } }, render(item, cardWidth)))
  ), /* @__PURE__ */ React.createElement(Dots, { count: items.length, index: Math.min(index, items.length - 1), color: COLORS.accent, idle: COLORS.border }));
}
function Row({ children }) {
  return /* @__PURE__ */ React.createElement(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: { paddingHorizontal: 20, gap: 12, paddingBottom: 6 } }, children);
}
const styles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 6, height: 38, paddingHorizontal: 13, borderRadius: 19, backgroundColor: COLORS.xpBadgeSurface, borderWidth: 1, borderColor: COLORS.xpBadgeBorder },
  chipText: { fontSize: 17, fontWeight: "800", color: COLORS.xpBadgeText },
  priceIcon: { flexDirection: "row", alignItems: "center", gap: 5 },
  was: { fontSize: 14, fontWeight: "700", color: "#7A5A00", textDecorationLine: "line-through" },
  head: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 20, marginBottom: 12, gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 22, fontWeight: "900", color: COLORS.textPrimary, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  action: { fontSize: 14, fontWeight: "800", color: COLORS.accent, marginBottom: 2 },
  tag: { paddingHorizontal: 8, height: 20, borderRadius: 6, backgroundColor: "#14141F", alignItems: "center", justifyContent: "center" },
  tagText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8, color: "#FCD34D" }
});
export {
  Carousel,
  Flask,
  PriceButton,
  Row,
  SectionHead,
  XPChip
};
