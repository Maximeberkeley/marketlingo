import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { buildSprintPlan, daysUntil, weekKey } from "../../lib/interviewPrep";
import { InterviewTargetForm } from "./InterviewTargetForm";
import { triggerHaptic } from "../../lib/haptics";
function ReadinessCard({ visible, inline = false, readiness, onClose, onStartMock, onOpenBrief }) {
  const rise = useRef(new Animated.Value(0)).current;
  const [answered, setAnswered] = useState({});
  useEffect(() => {
    if (!visible) return;
    rise.setValue(0);
    Animated.spring(rise, { toValue: 1, tension: 70, friction: 11, useNativeDriver: true }).start();
  }, [visible]);
  const { target, percent, parts, concepts, news } = readiness;
  const days = daysUntil(target?.date);
  const sprint = useMemo(
    () => target && days != null && days >= 0 && days < 14 ? buildSprintPlan({ target, daysLeft: days, concepts, news }) : null,
    [target?.updatedAt, days, concepts.join("|"), news.join("|")]
  );
  const weekly = target && !target.date;
  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const body = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: styles.eyebrow }, "INTERVIEW READINESS"), /* @__PURE__ */ React.createElement(View, { style: styles.scoreRow }, /* @__PURE__ */ React.createElement(Text, { style: styles.score }, percent, "%"), target ? /* @__PURE__ */ React.createElement(Text, { style: styles.scoreSub }, `${target.role}
${target.company}${days != null && days >= 0 ? ` \xB7 ${days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}` : ""}`) : null), /* @__PURE__ */ React.createElement(View, { style: styles.bar }, /* @__PURE__ */ React.createElement(View, { style: [styles.barFill, { width: `${Math.max(3, percent)}%` }] })), parts.map((p) => /* @__PURE__ */ React.createElement(View, { key: p.key, style: styles.part }, /* @__PURE__ */ React.createElement(View, { style: [styles.dot, { opacity: 0.3 + p.ratio * 0.7 }] }), /* @__PURE__ */ React.createElement(Text, { style: styles.partLabel }, p.label), /* @__PURE__ */ React.createElement(Text, { style: styles.partDetail }, p.detail))), !target && /* @__PURE__ */ React.createElement(View, { style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement(InterviewTargetForm, { target: null, onSave: readiness.saveTarget })), sprint && /* @__PURE__ */ React.createElement(View, { style: { marginTop: 18 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.section }, `SPRINT \xB7 ${sprint.length} DAY${sprint.length === 1 ? "" : "S"}`), sprint.map((d, i) => /* @__PURE__ */ React.createElement(View, { key: d.day, style: [styles.day, i === 0 && styles.dayToday] }, /* @__PURE__ */ React.createElement(Text, { style: styles.dayHead }, i === 0 ? `Today \xB7 ${d.dateLabel}` : `Day ${d.day} \xB7 ${d.dateLabel}`), d.fullMock ? /* @__PURE__ */ React.createElement(Text, { style: styles.dayLine }, /* @__PURE__ */ React.createElement(Text, { style: styles.dayKey }, "Full mock  "), d.mock) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: styles.dayLine }, /* @__PURE__ */ React.createElement(Text, { style: styles.dayKey }, "Concept  "), d.concept), /* @__PURE__ */ React.createElement(Text, { style: styles.dayLine }, /* @__PURE__ */ React.createElement(Text, { style: styles.dayKey }, "Mock  "), d.mock), d.news && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: styles.dayLine }, /* @__PURE__ */ React.createElement(Text, { style: styles.dayKey }, "News  "), d.news.title), /* @__PURE__ */ React.createElement(Text, { style: styles.howTo }, "How to mention this in your interview: ", d.news.howToMention), i === 0 && /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      disabled: answered[d.news.title],
      onPress: () => {
        triggerHaptic("success");
        setAnswered((a) => ({ ...a, [d.news.title]: true }));
        void readiness.markCurrentEvent(d.news.title);
      },
      style: styles.chip
    },
    /* @__PURE__ */ React.createElement(Text, { style: styles.chipText }, answered[d.news.title] ? "Practised" : "I practised mentioning it")
  ))), i === 0 && /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onStartMock, style: styles.primary }, /* @__PURE__ */ React.createElement(Text, { style: styles.primaryText }, d.fullMock ? "Start full mock" : "Answer today\u2019s mock"))))), weekly && /* @__PURE__ */ React.createElement(View, { style: { marginTop: 18 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.section }, `STAY READY \xB7 WEEK OF ${weekKey()}`), /* @__PURE__ */ React.createElement(View, { style: [styles.day, styles.dayToday] }, /* @__PURE__ */ React.createElement(Text, { style: styles.dayLine }, /* @__PURE__ */ React.createElement(Text, { style: styles.dayKey }, "1  "), "Answer one mock question."), /* @__PURE__ */ React.createElement(Text, { style: styles.dayLine }, /* @__PURE__ */ React.createElement(Text, { style: styles.dayKey }, "2  "), "Update one line of your Interview Brief."), /* @__PURE__ */ React.createElement(View, { style: { flexDirection: "row", gap: 10, marginTop: 10 } }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onStartMock, style: [styles.primary, { flex: 1, marginTop: 0 }] }, /* @__PURE__ */ React.createElement(Text, { style: styles.primaryText }, "Mock question")), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onOpenBrief, style: [styles.secondary, { flex: 1 }] }, /* @__PURE__ */ React.createElement(Text, { style: styles.secondaryText }, "Update Brief"))))), target && !sprint && !weekly && /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onStartMock, style: styles.primary }, /* @__PURE__ */ React.createElement(Text, { style: styles.primaryText }, "Start a mock")));
  if (inline) {
    return /* @__PURE__ */ React.createElement(View, { style: [styles.glass, styles.inline] }, /* @__PURE__ */ React.createElement(View, { style: styles.sheen, pointerEvents: "none" }), body);
  }
  return /* @__PURE__ */ React.createElement(Modal, { visible, transparent: true, animationType: "fade", onRequestClose: onClose }, /* @__PURE__ */ React.createElement(View, { style: styles.backdrop }, /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.glass, { opacity: rise, transform: [{ translateY }] }] }, /* @__PURE__ */ React.createElement(View, { style: styles.sheen, pointerEvents: "none" }), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onClose, hitSlop: 12, style: styles.close, accessibilityLabel: "Close" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 18, color: COLORS.textMuted })), /* @__PURE__ */ React.createElement(ScrollView, { showsVerticalScrollIndicator: false, contentContainerStyle: { paddingBottom: 6 } }, body))));
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: COLORS.imageScrim, justifyContent: "center", padding: 18 },
  glass: {
    maxHeight: "86%",
    borderRadius: 28,
    padding: 22,
    overflow: "hidden",
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.cardShadow,
    shadowOpacity: 0.22,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 14
  },
  inline: { maxHeight: void 0, elevation: 3, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, borderColor: COLORS.border },
  sheen: { position: "absolute", top: -60, left: -40, right: -40, height: 140, backgroundColor: COLORS.accentSoft, borderRadius: 140 },
  close: { position: "absolute", right: 16, top: 16, zIndex: 2 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0, color: COLORS.accent },
  scoreRow: { flexDirection: "row", alignItems: "flex-end", gap: 14, marginTop: 6 },
  score: { fontSize: 52, lineHeight: 56, fontWeight: "900", color: COLORS.textPrimary, letterSpacing: 0 },
  scoreSub: { flex: 1, fontSize: 13, lineHeight: 18, color: COLORS.textSecondary, marginBottom: 8, fontWeight: "600" },
  bar: { height: 6, borderRadius: 3, backgroundColor: COLORS.accentMedium, marginTop: 12, marginBottom: 14, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  part: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  partLabel: { flex: 1, fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  partDetail: { fontSize: 13, color: COLORS.textSecondary },
  section: { fontSize: 11, fontWeight: "800", letterSpacing: 0, color: COLORS.textSecondary, marginBottom: 8 },
  day: { borderRadius: 16, padding: 14, marginBottom: 8, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  dayToday: { borderColor: COLORS.accentMedium, backgroundColor: COLORS.accentSoft },
  dayHead: { fontSize: 12, fontWeight: "800", color: COLORS.textSecondary, marginBottom: 2 },
  dayLine: { fontSize: 14, lineHeight: 20, color: COLORS.textPrimary },
  dayKey: { fontWeight: "800", color: COLORS.accent },
  howTo: { fontSize: 13, lineHeight: 18, color: COLORS.textSecondary, fontStyle: "italic" },
  chip: { alignSelf: "flex-start", marginTop: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: COLORS.accentSoft },
  chipText: { fontSize: 12, fontWeight: "800", color: COLORS.accent },
  primary: { marginTop: 10, backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  primaryText: { color: COLORS.textOnAccent, fontWeight: "800", fontSize: 15 },
  secondary: { borderRadius: 14, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: COLORS.accentMedium },
  secondaryText: { color: COLORS.accent, fontWeight: "800", fontSize: 15 }
});
export {
  ReadinessCard
};
