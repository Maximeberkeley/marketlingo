import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../lib/constants";
import { getMarketWorld } from "../../data/marketWorlds";
import { getMarketName } from "../../lib/markets";
import { SpeechBubble } from "../ui/SpeechBubble";
import { lessonGoalLabels } from "../../lib/lessonGoals";
function LessonGoalsScreen({ title, slides, objectives, marketId, day = 1, isBite, onStart, onBack }) {
  const insets = useSafeAreaInsets();
  const world = getMarketWorld(marketId);
  const marketName = getMarketName(marketId || "aerospace");
  const goals = useMemo(() => lessonGoalLabels(objectives, slides), [objectives, slides]);
  const safeGoals = goals.length ? goals : ["Read the signal", "Make the call", "Keep the insight"];
  return /* @__PURE__ */ React.createElement(View, { style: [styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 18 }] }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onBack, style: styles.back, accessibilityLabel: "Back to home" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 22, color: COLORS.textPrimary })), /* @__PURE__ */ React.createElement(LinearGradient, { colors: [world.colors[0], world.colors[1]], style: styles.hero }, /* @__PURE__ */ React.createElement(Image, { source: world.illustration, style: styles.illustration }), /* @__PURE__ */ React.createElement(Text, { style: styles.kicker }, isBite ? "QUICK BITE" : `DAY ${day}`), /* @__PURE__ */ React.createElement(Text, { style: styles.title }, title), /* @__PURE__ */ React.createElement(View, { style: styles.timeChip }, /* @__PURE__ */ React.createElement(Feather, { name: "clock", size: 14, color: COLORS.bg0 }), /* @__PURE__ */ React.createElement(Text, { style: styles.timeText }, marketName, " \xB7 ", isBite ? "1 min" : "6 min"))), /* @__PURE__ */ React.createElement(ScrollView, { style: styles.body, contentContainerStyle: styles.bodyContent, showsVerticalScrollIndicator: false }, /* @__PURE__ */ React.createElement(Text, { style: styles.heading }, goals.length ? "In this lesson" : "Your next lesson"), /* @__PURE__ */ React.createElement(View, { style: styles.goals }, safeGoals.map((goal, index) => /* @__PURE__ */ React.createElement(View, { key: `${goal}-${index}`, style: styles.goalRow }, /* @__PURE__ */ React.createElement(View, { style: [styles.number, { backgroundColor: world.colors[index % world.colors.length] }] }, /* @__PURE__ */ React.createElement(Text, { style: styles.numberText }, index + 1)), /* @__PURE__ */ React.createElement(Text, { style: styles.goalText }, goal)))), /* @__PURE__ */ React.createElement(View, { style: styles.leoRow }, /* @__PURE__ */ React.createElement(Image, { source: require("../../assets/mascot/leo-sassy.png"), style: styles.leo }), /* @__PURE__ */ React.createElement(SpeechBubble, { text: "Three sharp moves. Then make the call.", tail: "left", showLabel: true, style: styles.leoBalloon }))), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: [styles.start, { backgroundColor: world.colors[0], shadowColor: world.colors[0] }], onPress: onStart, activeOpacity: 0.86 }, /* @__PURE__ */ React.createElement(Text, { style: styles.startText }, "Start mission"), /* @__PURE__ */ React.createElement(Feather, { name: "arrow-right", size: 19, color: COLORS.bg0 })));
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 16 },
  back: { width: 42, height: 42, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  hero: { minHeight: 206, borderRadius: 22, padding: 22, justifyContent: "flex-end", overflow: "hidden" },
  illustration: { position: "absolute", width: 174, height: 174, right: -14, top: -6, resizeMode: "contain", opacity: 0.88 },
  kicker: { color: COLORS.bg0, fontSize: 11, fontWeight: "900", letterSpacing: 1.2, opacity: 0.82 },
  title: { color: COLORS.bg0, fontSize: 29, lineHeight: 34, fontWeight: "700", maxWidth: "76%", marginTop: 7 },
  timeChip: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
  timeText: { color: COLORS.bg0, fontSize: 13, fontWeight: "700" },
  body: { flex: 1 },
  bodyContent: { paddingTop: 18, paddingBottom: 14 },
  heading: { fontSize: 19, fontWeight: "800", color: COLORS.textPrimary },
  subheading: { marginTop: 4, fontSize: 15, color: COLORS.textSecondary },
  goals: { gap: 8, marginTop: 12 },
  goalRow: { flexDirection: "row", alignItems: "center", gap: 11, minHeight: 42 },
  number: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  numberText: { color: COLORS.bg0, fontSize: 14, fontWeight: "900" },
  goalText: { flex: 1, fontSize: 15, lineHeight: 20, color: COLORS.textPrimary, fontWeight: "700" },
  leoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18 },
  leo: { width: 112, height: 136, flexShrink: 0, resizeMode: "contain" },
  leoBalloon: { flexShrink: 1, alignSelf: "center" },
  leoLine: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  start: { height: 56, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.34, shadowRadius: 16, elevation: 10 },
  startText: { color: COLORS.bg0, fontSize: 17, fontWeight: "900" }
});
export {
  LessonGoalsScreen
};
