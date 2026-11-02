import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { getMarketName } from "../../lib/markets";
import { LeoAnimated } from "../mascot/LeoAnimated";
const PROMISES = {
  join_industry: { title: "Become interview-ready", body: "You\u2019ll learn the players, language, economics, and decisions insiders expect you to know." },
  invest: { title: "Build an investor\u2019s lens", body: "You\u2019ll learn valuation, market signals, risk, and how to defend an industry thesis." },
  build_startup: { title: "Find the opening", body: "You\u2019ll learn customer pain, business models, moats, regulation, and where new companies can win." },
  curiosity: { title: "See the whole industry", body: "You\u2019ll learn the breakthroughs, people, numbers, and forces shaping what happens next." }
};
const TOUR = [
  { icon: "home", title: "Home is today\u2019s mission", body: "One focused lesson keeps your streak alive and moves your market journey forward." },
  { icon: "map", title: "Courses build the map", body: "Follow 180 days in order, or revisit any unlocked topic when you need it." },
  { icon: "zap", title: "Practice builds instinct", body: "Arena tests speed. Deep cases, Interview Lab, and Investment Lab test judgment." },
  { icon: "edit-3", title: "Notes keep your edge", body: "Save any insight mid-lesson and turn scattered facts into your own playbook." },
  { icon: "user", title: "You shows the receipts", body: "Track XP, streaks, achievements, and every industry card you collect." }
];
function FeatureTour({ visible, marketId, goal = "curiosity", onComplete }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const [index, setIndex] = useState(0);
  const [clip, setClip] = useState("leo-greet");
  const promise = PROMISES[goal || "curiosity"];
  const pages = useMemo(() => [
    { icon: "target", title: promise.title, body: `${promise.body} Your track is built around ${getMarketName(marketId || "aerospace")}.` },
    ...TOUR
  ], [marketId, promise]);
  const page = pages[index];
  const last = index === pages.length - 1;
  useEffect(() => {
    if (visible) setClip("leo-greet");
  }, [visible]);
  useEffect(() => {
    if (visible && last) setClip("leo-ready");
  }, [visible, last]);
  const settleLeo = useCallback(() => {
    if (visible) setClip("leo-idle-loop");
  }, [visible]);
  const finish = () => {
    setIndex(0);
    onComplete();
  };
  return /* @__PURE__ */ React.createElement(Modal, { visible, animationType: "fade", onRequestClose: finish }, /* @__PURE__ */ React.createElement(View, { style: [styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.topRow }, /* @__PURE__ */ React.createElement(Text, { style: styles.counter }, index + 1, " / ", pages.length), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: finish, style: styles.skip }, /* @__PURE__ */ React.createElement(Text, { style: styles.skipText }, "Skip"))), /* @__PURE__ */ React.createElement(View, { style: styles.middleContent }, /* @__PURE__ */ React.createElement(View, { style: [styles.visual, compact && styles.visualCompact] }, /* @__PURE__ */ React.createElement(View, { style: styles.leoStage }, /* @__PURE__ */ React.createElement(LeoAnimated, { clip, size: 200, fallback: "idle", paused: !visible, onEnd: settleLeo }), /* @__PURE__ */ React.createElement(View, { style: styles.iconBadge }, /* @__PURE__ */ React.createElement(Feather, { name: page.icon, size: 24, color: COLORS.accent })))), /* @__PURE__ */ React.createElement(Text, { style: styles.eyebrow }, index === 0 ? "YOUR LEARNING PROMISE" : "MARKETLINGO IN 3 MINUTES"), /* @__PURE__ */ React.createElement(Text, { style: [styles.title, compact && styles.titleCompact] }, page.title), /* @__PURE__ */ React.createElement(Text, { style: [styles.body, compact && styles.bodyCompact] }, page.body)), /* @__PURE__ */ React.createElement(View, { style: styles.dots }, pages.map((_, dot) => /* @__PURE__ */ React.createElement(View, { key: dot, style: [styles.dot, dot === index && styles.dotActive] }))), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.button, onPress: () => last ? finish() : setIndex((value) => value + 1) }, /* @__PURE__ */ React.createElement(Text, { style: styles.buttonText }, last ? "Start learning" : "Next"), /* @__PURE__ */ React.createElement(Feather, { name: last ? "check" : "arrow-right", size: 18, color: COLORS.bg0 }))));
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 24 },
  middleContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  counter: { color: COLORS.textMuted, fontWeight: "800", fontSize: 12 },
  skip: { paddingHorizontal: 8, paddingVertical: 8 },
  skipText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "700" },
  visual: { height: 300, flexShrink: 0, alignItems: "center", justifyContent: "center" },
  visualCompact: { height: 268 },
  leoStage: { width: 200, height: 200 },
  iconBadge: { position: "absolute", width: 52, height: 52, borderRadius: 26, right: -12, top: 0, backgroundColor: COLORS.accentSoft, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: COLORS.accent, fontSize: 11, letterSpacing: 1.1, fontWeight: "900", textAlign: "center" },
  title: { width: "100%", maxWidth: 400, color: COLORS.textPrimary, fontSize: 29, lineHeight: 34, fontWeight: "900", textAlign: "center", marginTop: 10 },
  titleCompact: { fontSize: 26, lineHeight: 31, marginTop: 8 },
  body: { width: "100%", maxWidth: 400, color: COLORS.textSecondary, fontSize: 16, lineHeight: 23, textAlign: "center", marginTop: 12 },
  bodyCompact: { lineHeight: 22, marginTop: 10 },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", gap: 6, paddingBottom: 22 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { width: 22, backgroundColor: COLORS.accent },
  button: { height: 56, borderRadius: 16, backgroundColor: COLORS.accent, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 9 },
  buttonText: { color: COLORS.bg0, fontSize: 17, fontWeight: "900" }
});
export {
  FeatureTour
};
