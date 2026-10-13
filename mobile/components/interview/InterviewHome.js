import React, { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { buildSprintPlan, daysUntil, planConceptSubtitle, shortDate, weekKey } from "../../lib/interviewPrep";
import { InterviewTargetForm } from "./InterviewTargetForm";
import { triggerHaptic } from "../../lib/haptics";
const askedKey = (u, m) => `ml_interview_target_asked:${u}:${m}`;
function InterviewHome({ userId, marketId, readiness, nextQuestion, questionBank = [], bank, topInset, bottomInset, onClose, onStart, onWarmUp, onOpenBrief, onSchool }) {
  const { target, percent, parts, concepts, news } = readiness;
  const days = daysUntil(target?.date);
  const [asked, setAsked] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  useEffect(() => {
    if (!userId || !marketId) return;
    AsyncStorage.getItem(askedKey(userId, marketId)).then((v) => setAsked(v === "1")).catch(() => setAsked(true));
  }, [userId, marketId]);
  const markAsked = () => {
    setAsked(true);
    if (userId && marketId) AsyncStorage.setItem(askedKey(userId, marketId), "1").catch(() => {
    });
  };
  const sprint = useMemo(() => {
    if (!target) return [];
    const left = days != null && days >= 0 ? Math.min(days, 13) : 0;
    return buildSprintPlan({ target, daysLeft: left, concepts, news, bank });
  }, [bank, target?.updatedAt, days, concepts.join("|"), news.join("|")]);
  const today = sprint[0];
  const datedSprint = !!target && days != null && days >= 0 && days < 14;
  const cardQuestion = target && today ? today.mock : nextQuestion;
  const cardScenario = questionBank.find((q) => q.question === cardQuestion)?.scenario;
  const headline = target ? `${target.company} ${target.role}` : "Your next interview question";
  const countdown = days == null || days < 0 ? null : days === 0 ? "Today" : `${days} day${days === 1 ? "" : "s"} left`;
  return /* @__PURE__ */ React.createElement(View, { style: styles.root }, /* @__PURE__ */ React.createElement(View, { style: [styles.topBar, { paddingTop: topInset + 6 }] }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onClose, style: styles.close, accessibilityLabel: "Close" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 22, color: COLORS.textPrimary })), /* @__PURE__ */ React.createElement(Text, { style: styles.topTitle }, "Interview practice"), /* @__PURE__ */ React.createElement(View, { style: styles.close })), /* @__PURE__ */ React.createElement(ScrollView, { contentContainerStyle: [styles.body, { paddingBottom: bottomInset + 28 }], showsVerticalScrollIndicator: false }, /* @__PURE__ */ React.createElement(View, { style: styles.card }, /* @__PURE__ */ React.createElement(Text, { style: styles.headline }, headline, target && countdown ? /* @__PURE__ */ React.createElement(Text, { style: styles.countdown }, ` \xB7 ${countdown}`) : null), target && today ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: styles.stepLabel }, `TODAY \xB7 ${today.dateLabel.toUpperCase()}`), cardScenario ? /* @__PURE__ */ React.createElement(Text, { style: styles.scenario, numberOfLines: 2 }, cardScenario) : null, /* @__PURE__ */ React.createElement(Text, { style: styles.stepText }, today.mock), today.kind === "concept" && /* @__PURE__ */ React.createElement(Text, { style: styles.stepMeta }, `Link it to: ${today.concept}`)) : nextQuestion ? /* @__PURE__ */ React.createElement(React.Fragment, null, cardScenario ? /* @__PURE__ */ React.createElement(Text, { style: styles.scenario, numberOfLines: 2 }, cardScenario) : null, /* @__PURE__ */ React.createElement(Text, { style: styles.stepText }, nextQuestion)) : null, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.primary, activeOpacity: 0.88, onPress: () => {
    triggerHaptic("medium");
    onStart(cardQuestion);
  } }, /* @__PURE__ */ React.createElement(Text, { style: styles.primaryText }, target ? "Answer today\u2019s question" : "Answer a mock question")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.warmUp, activeOpacity: 0.8, onPress: () => {
    triggerHaptic("light");
    onWarmUp();
  }, accessibilityRole: "button", accessibilityLabel: "Warm up with Leo" }, /* @__PURE__ */ React.createElement(Image, { source: require("../../assets/mascot/leo-waving.png"), style: styles.warmUpLeo, resizeMode: "contain" }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.warmUpTitle }, "Warm up with Leo"), /* @__PURE__ */ React.createElement(Text, { style: styles.warmUpSub }, target ? `3-min call \xB7 Leo plays your ${target.company} interviewer` : "3-min call \xB7 Leo plays your interviewer")), /* @__PURE__ */ React.createElement(Feather, { name: "phone", size: 17, color: COLORS.accent })), !target && !formOpen && !asked && /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => {
    triggerHaptic("light");
    setFormOpen(true);
    markAsked();
  }, style: styles.addLink }, /* @__PURE__ */ React.createElement(Text, { style: styles.addLinkText }, "Have an interview coming? ", /* @__PURE__ */ React.createElement(Text, { style: styles.addLinkStrong }, "Add it")))), !target && formOpen && /* @__PURE__ */ React.createElement(InterviewTargetForm, { target: null, initiallyOpen: true, onSave: async (t) => {
    await readiness.saveTarget(t);
    setFormOpen(false);
  }, onCancel: () => setFormOpen(false) }), datedSprint && sprint.length > 1 && /* @__PURE__ */ React.createElement(View, { style: styles.section }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionLabel }, `YOUR PLAN \xB7 ${sprint.length} DAYS`), sprint.slice(1).map((d) => /* @__PURE__ */ React.createElement(View, { key: d.day, style: styles.planRow }, /* @__PURE__ */ React.createElement(Text, { style: styles.planDate }, d.dateLabel), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.planText }, d.label), planConceptSubtitle(d) ? /* @__PURE__ */ React.createElement(Text, { style: styles.planSub }, planConceptSubtitle(d)) : null)))), target && !target.date && /* @__PURE__ */ React.createElement(View, { style: styles.section }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionLabel }, `STAY READY \xB7 WEEK OF ${shortDate(weekKey()).toUpperCase()}`), /* @__PURE__ */ React.createElement(View, { style: styles.planRow }, /* @__PURE__ */ React.createElement(Text, { style: styles.planDate }, "1"), /* @__PURE__ */ React.createElement(Text, { style: styles.planText }, "Answer one mock question.")), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.planRow, onPress: onOpenBrief }, /* @__PURE__ */ React.createElement(Text, { style: styles.planDate }, "2"), /* @__PURE__ */ React.createElement(Text, { style: [styles.planText, { color: COLORS.accent }] }, "Update one line of your Interview Brief."))), /* @__PURE__ */ React.createElement(View, { style: styles.section }, /* @__PURE__ */ React.createElement(View, { style: styles.readyHead }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionLabel }, "READINESS"), /* @__PURE__ */ React.createElement(Text, { style: percent > 0 ? styles.percentBig : styles.percentSmall }, `${percent}%`)), parts.map((p) => /* @__PURE__ */ React.createElement(View, { key: p.key, style: styles.part }, /* @__PURE__ */ React.createElement(View, { style: [styles.dot, { opacity: 0.3 + p.ratio * 0.7 }] }), /* @__PURE__ */ React.createElement(Text, { style: styles.partLabel }, p.label), /* @__PURE__ */ React.createElement(Text, { style: styles.partDetail }, p.detail)))), target && /* @__PURE__ */ React.createElement(InterviewTargetForm, { target, onSave: readiness.saveTarget }), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onSchool, style: styles.schoolLink }, /* @__PURE__ */ React.createElement(Text, { style: styles.schoolText }, "Practicing for something else? ", /* @__PURE__ */ React.createElement(Text, { style: styles.addLinkStrong }, "Scholarship or school interview")))));
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 6 },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  topTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  body: { paddingHorizontal: 18, paddingTop: 8, gap: 14 },
  card: { borderRadius: 22, padding: 20, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, shadowColor: COLORS.cardShadow, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  headline: { fontSize: 22, lineHeight: 28, fontWeight: "900", color: COLORS.textPrimary },
  countdown: { color: COLORS.accent },
  stepLabel: { marginTop: 14, fontSize: 11, fontWeight: "800", color: COLORS.textMuted },
  stepText: { marginTop: 8, fontSize: 17, lineHeight: 24, fontWeight: "700", color: COLORS.textPrimary },
  scenario: { marginTop: 10, fontSize: 14, lineHeight: 20, fontWeight: "400", color: COLORS.textSecondary },
  stepMeta: { marginTop: 6, fontSize: 13, color: COLORS.textSecondary },
  primary: { marginTop: 18, height: 54, borderRadius: 16, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center" },
  primaryText: { color: COLORS.textOnAccent, fontSize: 16, fontWeight: "900" },
  warmUp: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12, paddingVertical: 10, paddingHorizontal: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  warmUpLeo: { width: 40, height: 40 },
  warmUpTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  warmUpSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  addLink: { marginTop: 6, alignSelf: "center", paddingVertical: 6 },
  addLinkText: { fontSize: 13, color: COLORS.textSecondary },
  addLinkStrong: { color: COLORS.accent, fontWeight: "800" },
  section: { borderRadius: 18, padding: 16, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  sectionLabel: { fontSize: 11, fontWeight: "800", color: COLORS.textSecondary, marginBottom: 6 },
  planRow: { flexDirection: "row", gap: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  planDate: { width: 52, fontSize: 13, fontWeight: "800", color: COLORS.textMuted },
  planText: { flex: 1, fontSize: 14, lineHeight: 19, color: COLORS.textPrimary },
  planSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  readyHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  percentSmall: { fontSize: 14, fontWeight: "800", color: COLORS.textMuted },
  percentBig: { fontSize: 24, fontWeight: "900", color: COLORS.textPrimary },
  part: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.accent },
  partLabel: { flex: 1, fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  partDetail: { fontSize: 12, color: COLORS.textSecondary },
  schoolLink: { alignSelf: "center", paddingVertical: 10 },
  schoolText: { fontSize: 13, color: COLORS.textMuted, textAlign: "center" }
});
export {
  InterviewHome
};
