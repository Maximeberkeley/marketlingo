import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { isDark } from "../../lib/theme";
import { raceLine } from "../../lib/rankRace";
import { LeoAvatar } from "../shop/LeoAvatar";
import { Twinkle, useReduceMotion } from "../shop/Motion";
import { FloorShadow, Sparkle, Sunburst, Twinkles } from "../shop/Scene";
function RankCard({ rank, total, market, me, next, second }) {
  const reduce = useReduceMotion();
  const race = raceLine(rank, me, next, second);
  const bar = useRef(new Animated.Value(reduce ? race.fill : 0)).current;
  useEffect(() => {
    if (reduce) {
      bar.setValue(race.fill);
      return;
    }
    Animated.timing(bar, { toValue: race.fill, duration: 900, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [reduce, race.fill, bar]);
  const top = rank === 1;
  const other = top ? second : next;
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap, accessibilityRole: "summary", accessibilityLabel: `${rank ? `Rank ${rank} of ${total}` : "Unranked"}, ${market} this month. ${race.text}` }, /* @__PURE__ */ React.createElement(LinearGradient, { colors: isDark ? ["#2E1065", "#4C1D95", "#6D28D9"] : ["#5B21B6", "#7C3AED", "#A78BFA"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, style: styles.card }, /* @__PURE__ */ React.createElement(Sunburst, { size: 300, cx: 62, cy: 70, color: "#FFFFFF", opacity: 0.22, rays: 16, period: 4e4 }), /* @__PURE__ */ React.createElement(Twinkles, { w: 340, h: 150, color: "#FDE68A", points: [[0.5, 0.16, 12], [0.92, 0.22, 10], [0.06, 0.12, 9]] }), /* @__PURE__ */ React.createElement(View, { style: styles.top }, /* @__PURE__ */ React.createElement(View, { style: styles.leo }, /* @__PURE__ */ React.createElement(FloorShadow, { width: 78, cx: 48, y: 94, dark: 0.35 }), /* @__PURE__ */ React.createElement(LeoAvatar, { look: me?.look ?? {}, crown: !!me?.crown, size: 96, crop: false, name: "You" })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(View, { style: styles.rankRow }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.2, style: styles.rank }, rank ? `#${rank}` : "\u2013"), top && /* @__PURE__ */ React.createElement(View, { style: styles.crownGlint }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "crown", size: 26, color: "#FCD34D" }), /* @__PURE__ */ React.createElement(Twinkle, { style: styles.glint, period: 1400 }, /* @__PURE__ */ React.createElement(Sparkle, { size: 12, color: "#FFFFFF" })))), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.2, style: styles.sub, numberOfLines: 1 }, rank ? `of ${total} \xB7 ${market} this month` : `${market} this month`))), /* @__PURE__ */ React.createElement(View, { style: styles.race }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.2, style: styles.raceText, numberOfLines: 1 }, race.text), rank ? /* @__PURE__ */ React.createElement(View, { style: styles.raceRow }, /* @__PURE__ */ React.createElement(LeoAvatar, { look: me?.look ?? {}, size: 30, ring: "#FFFFFF", ringWidth: 2, bg: "#EDE9FE", name: "You" }), /* @__PURE__ */ React.createElement(View, { style: styles.track }, /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.fill, { transform: [{ scaleX: bar }] }] })), other ? /* @__PURE__ */ React.createElement(LeoAvatar, { look: other.look, crown: !!other.crown, size: 30, ring: "rgba(255,255,255,0.7)", ringWidth: 2, bg: "#EDE9FE", name: other.name }) : null) : null)));
}
const styles = StyleSheet.create({
  wrap: { marginBottom: 16, marginTop: 4 },
  card: { borderRadius: 24, padding: 16, paddingTop: 10, overflow: "hidden", borderBottomWidth: 5, borderColor: isDark ? "#1E0B47" : "#4C1D95" },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  leo: { width: 96, height: 96 },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rank: { fontSize: 44, lineHeight: 50, fontWeight: "900", color: "#FFFFFF", letterSpacing: -1 },
  crownGlint: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  glint: { position: "absolute", right: -4, top: -2 },
  sub: { fontSize: 13.5, fontWeight: "800", color: "#EDE9FE" },
  race: { marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.14)" },
  raceText: { fontSize: 14, fontWeight: "900", color: "#FFFFFF", marginBottom: 8 },
  raceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  track: { flex: 1, height: 12, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.22)", overflow: "hidden" },
  fill: { height: 12, width: "100%", borderRadius: 6, backgroundColor: "#FCD34D", transformOrigin: "left" }
});
export {
  RankCard
};
