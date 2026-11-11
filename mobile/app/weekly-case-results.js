import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { markResultsSeen } from "../hooks/useWeeklyCase";
import { useAuth } from "../hooks/useAuth";
import { useEquippedLooks } from "../hooks/useEquippedLooks";
import { LeoAvatar } from "../components/shop/LeoAvatar";
import { COLORS, TYPE } from "../lib/constants";
import { log } from "../lib/logger";
import { triggerHaptic } from "../lib/haptics";
import {
  scoreHeadline,
  shareText,
  weekNumber
} from "../lib/weeklyCase";
import { loadBoard, loadCaseById, loadMySubmissions, loadResult, loadReveal, requestRelease } from "../lib/weeklyCaseApi";
const scoreColor = (score) => score >= 70 ? COLORS.success : score >= 50 ? COLORS.warning : COLORS.error;
function Bar({ score }) {
  return /* @__PURE__ */ React.createElement(View, { style: styles.pips, accessibilityRole: "image", accessibilityLabel: `${score} out of 5` }, [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ React.createElement(View, { key: i, style: [styles.pip, i <= score && { backgroundColor: scoreColor(score * 20) }] })));
}
function WeeklyCaseResultsRoute() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [weekly, setWeekly] = useState(null);
  const [result, setResult] = useState(null);
  const [board, setBoard] = useState([]);
  const looks = useEquippedLooks(board.map((r) => r.user_id));
  const [answers, setAnswers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reveal, setReveal] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const load = useCallback(async () => {
    if (!id || !user?.id) return;
    setFailed(false);
    try {
      const c = await loadCaseById(id);
      setWeekly(c);
      let r = await loadResult(id);
      if (r.state === "waiting" && c && Date.now() >= c.closesAt) {
        await requestRelease();
        r = await loadResult(id);
      }
      setResult(r);
      if (r.state === "ready") {
        void markResultsSeen(user.id, id);
        const [b, subs, rv] = await Promise.all([loadBoard(id), loadMySubmissions(user.id, [id]), loadReveal(id).catch(() => null)]);
        setBoard(b);
        setReveal(rv);
        setAnswers(subs[0]?.answers ?? null);
      }
    } catch (error) {
      log.warn("[WeeklyCase] results failed to load", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);
  useEffect(() => {
    void load();
  }, [load]);
  const close = () => router.back();
  const header = /* @__PURE__ */ React.createElement(View, { style: [styles.header, { paddingTop: insets.top + 6 }] }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: close, style: styles.close, accessibilityRole: "button", accessibilityLabel: "Close" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 22, color: COLORS.textPrimary })), /* @__PURE__ */ React.createElement(Text, { style: styles.headerTitle }, "Your results"), /* @__PURE__ */ React.createElement(View, { style: styles.close }));
  if (loading) return /* @__PURE__ */ React.createElement(View, { style: [styles.root, styles.center] }, /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "large", color: COLORS.accent }));
  if (failed || !weekly || !result || result.state !== "ready") {
    const text = failed ? "Results could not load. Check your connection." : result?.state === "none" ? "You did not submit an answer to this case." : result?.state === "waiting" ? "Your results are being finalised. Check back in a little while." : "This case could not be found.";
    return /* @__PURE__ */ React.createElement(View, { style: styles.root }, header, /* @__PURE__ */ React.createElement(View, { style: styles.center }, /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, failed || result?.state === "waiting" ? "Not ready yet" : "No results"), /* @__PURE__ */ React.createElement(Text, { style: styles.muted }, text), failed || result?.state === "waiting" ? /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => {
      setLoading(true);
      void load();
    }, style: styles.primary, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.primaryText }, "Try again")) : null));
  }
  const score = Math.round(result.score ?? 0);
  const myRank = board.find((r) => r.is_me)?.rank ?? null;
  const share = async () => {
    triggerHaptic("light");
    try {
      await Share.share({ message: shareText(weekly.title, score, myRank, board.length) });
    } catch {
    }
  };
  return /* @__PURE__ */ React.createElement(View, { style: styles.root }, header, /* @__PURE__ */ React.createElement(ScrollView, { contentContainerStyle: { padding: 20, paddingBottom: insets.bottom + 32, gap: 16 }, showsVerticalScrollIndicator: false }, /* @__PURE__ */ React.createElement(View, { style: styles.hero }, /* @__PURE__ */ React.createElement(Text, { style: styles.heroLabel }, `WEEKLY CASE \xB7 WEEK ${weekNumber(weekly.weekStart)}`), /* @__PURE__ */ React.createElement(Text, { style: styles.heroTitle }, weekly.title), /* @__PURE__ */ React.createElement(View, { style: styles.scoreRow }, /* @__PURE__ */ React.createElement(Text, { style: [styles.score, { color: scoreColor(score) }], accessibilityLabel: `Score ${score} out of 100` }, score), /* @__PURE__ */ React.createElement(Text, { style: styles.outOf }, "/ 100")), /* @__PURE__ */ React.createElement(Text, { style: styles.headline }, scoreHeadline(score)), result.beat_pct != null ? /* @__PURE__ */ React.createElement(Text, { style: styles.beat }, `Better than ${result.beat_pct}% of ${result.participants} players`) : null, result.expert_flag ? /* @__PURE__ */ React.createElement(View, { style: styles.flag }, /* @__PURE__ */ React.createElement(Feather, { name: "award", size: 14, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.flagText }, "Picked for expert feedback")) : null), /* @__PURE__ */ React.createElement(View, { style: styles.card }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionLabel }, "HOW IT WAS SCORED"), (result.breakdown ?? []).map((row) => /* @__PURE__ */ React.createElement(View, { key: row.id, style: styles.crit }, /* @__PURE__ */ React.createElement(View, { style: styles.critHead }, /* @__PURE__ */ React.createElement(Text, { style: styles.critLabel }, row.name), /* @__PURE__ */ React.createElement(Bar, { score: row.score })), /* @__PURE__ */ React.createElement(Text, { style: styles.critComment }, row.comment)))), result.strongest_move ? /* @__PURE__ */ React.createElement(View, { style: [styles.note, { backgroundColor: COLORS.successSoft }] }, /* @__PURE__ */ React.createElement(Feather, { name: "check-circle", size: 18, color: COLORS.success }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.noteTitle }, "Your strongest move"), /* @__PURE__ */ React.createElement(Text, { style: styles.noteBody }, result.strongest_move))) : null, result.sharpen ? /* @__PURE__ */ React.createElement(View, { style: [styles.note, { backgroundColor: COLORS.warningSoft }] }, /* @__PURE__ */ React.createElement(Feather, { name: "target", size: 18, color: COLORS.warning }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.noteTitle }, "What to sharpen"), /* @__PURE__ */ React.createElement(Text, { style: styles.noteBody }, result.sharpen))) : null, /* @__PURE__ */ React.createElement(View, { style: styles.card }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionLabel }, "AMONG YOUR FRIENDS"), board.length <= 1 ? /* @__PURE__ */ React.createElement(Text, { style: styles.muted }, "No friends played this week. Add friends to compete next time.") : board.map((r) => /* @__PURE__ */ React.createElement(View, { key: r.user_id, style: [styles.rankRow, r.is_me && styles.rankMe] }, /* @__PURE__ */ React.createElement(Text, { style: styles.rank }, r.rank ?? "\u2013"), /* @__PURE__ */ React.createElement(LeoAvatar, { look: looks[r.user_id]?.look, crown: looks[r.user_id]?.wearsCrown, size: 30, name: r.is_me ? "You" : r.display_name || "?" }), /* @__PURE__ */ React.createElement(Text, { style: styles.rankName, numberOfLines: 1 }, r.is_me ? "You" : r.display_name), r.friend_code && !r.is_me ? /* @__PURE__ */ React.createElement(Text, { style: styles.friendCode }, r.friend_code) : null, /* @__PURE__ */ React.createElement(Text, { style: styles.rankScore }, r.score ?? "\u2013")))), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: share, style: styles.primary, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Feather, { name: "share", size: 17, color: COLORS.textOnAccent }), /* @__PURE__ */ React.createElement(Text, { style: styles.primaryText }, "Share my score")), answers ? /* @__PURE__ */ React.createElement(View, { style: styles.card }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => setShowAnswer((s) => !s), accessibilityRole: "button", style: styles.answerToggle }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionLabel }, "YOUR ANSWER"), /* @__PURE__ */ React.createElement(Feather, { name: showAnswer ? "chevron-up" : "chevron-down", size: 16, color: COLORS.textSecondary })), showAnswer ? weekly.parts.map((p) => /* @__PURE__ */ React.createElement(View, { key: p.id, style: { gap: 3 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.critLabel }, p.label), /* @__PURE__ */ React.createElement(Text, { style: styles.critComment }, answers[p.id]))) : null) : null, reveal ? /* @__PURE__ */ React.createElement(View, { style: styles.card }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => setShowModel((s) => !s), accessibilityRole: "button", style: styles.answerToggle }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionLabel }, "ONE STRONG ANSWER"), /* @__PURE__ */ React.createElement(Feather, { name: showModel ? "chevron-up" : "chevron-down", size: 16, color: COLORS.textSecondary })), showModel ? /* @__PURE__ */ React.createElement(View, { style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.noteBody }, reveal.model_answer.summary), reveal.model_answer.parts.map((mp) => /* @__PURE__ */ React.createElement(View, { key: mp.part_id, style: { gap: 3 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.critLabel }, weekly.parts.find((p) => p.id === mp.part_id)?.label ?? mp.part_id), /* @__PURE__ */ React.createElement(Text, { style: styles.critComment }, mp.text))), (reveal.model_answer.alternatives ?? []).length > 0 ? /* @__PURE__ */ React.createElement(View, { style: { gap: 6 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionLabel }, "OTHER DEFENSIBLE ANSWERS"), (reveal.model_answer.alternatives ?? []).map((a) => /* @__PURE__ */ React.createElement(Text, { key: a.option, style: styles.critComment }, /* @__PURE__ */ React.createElement(Text, { style: styles.critLabel }, a.option, ". "), `Better when ${a.better_when.charAt(0).toLowerCase()}${a.better_when.slice(1)}`))) : null, (reveal.common_traps ?? []).length > 0 ? /* @__PURE__ */ React.createElement(View, { style: { gap: 6 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionLabel }, "COMMON TRAPS"), (reveal.common_traps ?? []).map((t) => /* @__PURE__ */ React.createElement(Text, { key: t.trap, style: styles.critComment }, /* @__PURE__ */ React.createElement(Text, { style: styles.critLabel }, t.trap, ". "), t.why))) : null) : null) : null));
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { ...TYPE.h3, flex: 1, textAlign: "center", color: COLORS.textPrimary },
  emptyTitle: { ...TYPE.h2, color: COLORS.textPrimary, textAlign: "center" },
  muted: { ...TYPE.body, fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  hero: { alignItems: "center", gap: 6, padding: 22, borderRadius: 22, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  heroLabel: { ...TYPE.overline, color: COLORS.accent },
  heroTitle: { ...TYPE.h3, textAlign: "center", color: COLORS.textPrimary },
  scoreRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginTop: 6 },
  score: { fontSize: 72, lineHeight: 78, fontWeight: "900", letterSpacing: -2, fontVariant: ["tabular-nums"] },
  outOf: { fontSize: 20, fontWeight: "700", color: COLORS.textSecondary, paddingBottom: 12 },
  headline: { ...TYPE.bodyBold, color: COLORS.textPrimary, textAlign: "center" },
  beat: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary },
  flag: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: COLORS.accentSoft },
  flagText: { fontSize: 12, fontWeight: "800", color: COLORS.accent },
  card: { gap: 12, padding: 16, borderRadius: 18, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  sectionLabel: { ...TYPE.overline, color: COLORS.textSecondary },
  crit: { gap: 4 },
  critHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  critLabel: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  critComment: { fontSize: 14, lineHeight: 20, color: COLORS.textSecondary },
  pips: { flexDirection: "row", gap: 3 },
  pip: { width: 18, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  note: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 16, alignItems: "flex-start" },
  noteTitle: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 2 },
  noteBody: { fontSize: 14, lineHeight: 20, color: COLORS.textPrimary },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 12 },
  rankMe: { backgroundColor: COLORS.accentSoft },
  rank: { width: 22, fontSize: 15, fontWeight: "800", color: COLORS.textSecondary, textAlign: "center" },
  rankName: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  friendCode: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 1 },
  rankScore: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary, fontVariant: ["tabular-nums"] },
  primary: { minHeight: 52, borderRadius: 14, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, backgroundColor: COLORS.accent },
  primaryText: { fontSize: 16, fontWeight: "800", color: COLORS.textOnAccent },
  answerToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }
});
export {
  WeeklyCaseResultsRoute as default
};
