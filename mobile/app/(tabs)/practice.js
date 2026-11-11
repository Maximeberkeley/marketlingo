import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { triggerHaptic } from "../../lib/haptics";
import { playSound } from "../../lib/sounds";
import { useStudiedLessons } from "../../hooks/useStudiedLessons";
import { useUserXP } from "../../hooks/useUserXP";
import { COLORS, TYPE } from "../../lib/constants";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { getMarketName } from "../../lib/markets";
import { INTERVIEW_ARTWORK } from "../../lib/interviewArtwork";
import { localDateString } from "../../lib/dayMath";
import { practiceCards, UNLOCK_LINE } from "../../lib/practiceCards";
import { dueEntries, dueMeta, loadLedger, nextDue, REVIEW_XP, REVIEW_ROUND_LIMIT, STAGES } from "../../lib/reviewLedger";
const ART = {
  interview: INTERVIEW_ARTWORK.practice,
  investment: INTERVIEW_ARTWORK.investment,
  "deep-case": INTERVIEW_ARTWORK.case,
  arena: INTERVIEW_ARTWORK.quiz
};
const AMBER = "#B45309";
function PracticeCard({ card, first }) {
  const open = () => {
    if (card.locked || !card.button) return;
    triggerHaptic("light");
    playSound("tap").catch(() => {
    });
    router.push(card.path);
  };
  const quiet = card.done;
  return /* @__PURE__ */ React.createElement(View, { style: [styles.card, first && !card.locked && !card.done && styles.cardFirst] }, /* @__PURE__ */ React.createElement(Image, { source: ART[card.id], style: [styles.thumb, card.locked && styles.thumbLocked], resizeMode: "cover" }), /* @__PURE__ */ React.createElement(View, { style: styles.cardBody }, /* @__PURE__ */ React.createElement(Text, { style: [styles.eyebrow, card.locked && { color: COLORS.textMuted }] }, card.eyebrow), /* @__PURE__ */ React.createElement(Text, { style: styles.cardTitle }, card.title), card.done ? /* @__PURE__ */ React.createElement(View, { style: styles.doneRow }, /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 15, color: COLORS.success }), /* @__PURE__ */ React.createElement(Text, { style: styles.doneText }, card.state.before)) : /* @__PURE__ */ React.createElement(Text, { style: styles.stateLine }, card.state.before, card.state.bold ? /* @__PURE__ */ React.createElement(Text, { style: styles.stateBold }, card.state.bold) : null, card.state.after), card.locked ? /* @__PURE__ */ React.createElement(View, { style: styles.lockRow }, /* @__PURE__ */ React.createElement(Feather, { name: "lock", size: 14, color: COLORS.textMuted }), /* @__PURE__ */ React.createElement(Text, { style: styles.lockText }, UNLOCK_LINE)) : card.button ? /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      onPress: open,
      activeOpacity: 0.88,
      accessibilityRole: "button",
      style: [styles.button, quiet && styles.buttonQuiet]
    },
    /* @__PURE__ */ React.createElement(Text, { style: [styles.buttonText, quiet && styles.buttonQuietText] }, card.button)
  ) : null));
}
function WorthAnotherLook({ entries, today, later }) {
  const due = dueEntries(entries, today);
  if (entries.length === 0) return null;
  if (due.length === 0) {
    return /* @__PURE__ */ React.createElement(View, { style: styles.look }, /* @__PURE__ */ React.createElement(View, { style: styles.lookStripe }), /* @__PURE__ */ React.createElement(View, { style: styles.lookHead }, /* @__PURE__ */ React.createElement(View, { style: styles.lookIcon }, /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 20, color: COLORS.success })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.lookTitle }, "Worth another look"), /* @__PURE__ */ React.createElement(Text, { style: styles.stateLine }, later ? "All caught up. More are due soon." : "All caught up."))));
  }
  const round = Math.min(due.length, REVIEW_ROUND_LIMIT);
  return /* @__PURE__ */ React.createElement(View, { style: styles.look }, /* @__PURE__ */ React.createElement(View, { style: styles.lookStripe }), /* @__PURE__ */ React.createElement(View, { style: styles.lookHead }, /* @__PURE__ */ React.createElement(View, { style: styles.lookIcon }, /* @__PURE__ */ React.createElement(Feather, { name: "rotate-ccw", size: 20, color: AMBER })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.lookTitle }, "Worth another look"), /* @__PURE__ */ React.createElement(Text, { style: styles.stateLine }, "Due for review today")), /* @__PURE__ */ React.createElement(View, { style: styles.count, accessibilityLabel: `${due.length} due` }, /* @__PURE__ */ React.createElement(Text, { style: styles.countText }, due.length))), /* @__PURE__ */ React.createElement(View, { style: { marginTop: 12 } }, due.slice(0, 3).map((entry) => /* @__PURE__ */ React.createElement(View, { key: entry.key, style: styles.item }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.itemName, numberOfLines: 1 }, entry.title), /* @__PURE__ */ React.createElement(Text, { style: styles.itemMeta }, dueMeta(entry, today))), /* @__PURE__ */ React.createElement(View, { style: styles.pips, accessibilityRole: "image", accessibilityLabel: `Review stage ${entry.stage + 1} of ${STAGES}` }, Array.from({ length: STAGES }, (_, i) => /* @__PURE__ */ React.createElement(View, { key: i, style: [styles.pip, i <= entry.stage && styles.pipOn] })))))), /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      style: styles.lookButton,
      activeOpacity: 0.88,
      accessibilityRole: "button",
      onPress: () => {
        triggerHaptic("light");
        playSound("tap").catch(() => {
        });
        router.push("/review");
      }
    },
    /* @__PURE__ */ React.createElement(Text, { style: styles.buttonText }, `Review ${round} now \xB7 +${REVIEW_XP} XP`)
  ));
}
function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState(null);
  const [mocks, setMocks] = useState([]);
  const [ledger, setLedger] = useState([]);
  const studied = useStudiedLessons(selectedMarket || void 0);
  const { dailyCompletion } = useUserXP(selectedMarket || void 0);
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("selected_market").eq("id", user.id).single().then(({ data }) => {
      if (data?.selected_market) {
        setSelectedMarket(data.selected_market);
        supabase.from("user_progress").select("learning_goal").eq("user_id", user.id).eq("market_id", data.selected_market).maybeSingle().then(({ data: prog }) => setGoal(prog?.learning_goal || null));
      }
      setLoading(false);
    });
  }, [user]);
  useFocusEffect(useCallback(() => {
    if (!user?.id || !selectedMarket) return;
    let active = true;
    void loadLedger(user.id, selectedMarket).then((rows) => {
      if (active) setLedger(rows);
    });
    void Promise.resolve(supabase.from("interview_lab_attempts").select("score").eq("user_id", user.id).eq("market_id", selectedMarket).eq("attempt_type", "mock").order("created_at", { ascending: false }).limit(200)).then(({ data }) => {
      if (active) setMocks(Array.isArray(data) ? data : []);
    }).catch(() => {
    });
    return () => {
      active = false;
    };
  }, [user?.id, selectedMarket]));
  if (loading || studied.isLoading) {
    return /* @__PURE__ */ React.createElement(View, { style: [styles.container, styles.centered] }, /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "large", color: COLORS.accent }));
  }
  const today = localDateString();
  const cards = practiceCards({
    goal,
    lessonsStudied: studied.lessons.length,
    gamesCompleted: dailyCompletion?.games_completed,
    drillsCompleted: dailyCompletion?.drills_completed,
    mocks
  });
  return /* @__PURE__ */ React.createElement(View, { style: styles.container }, /* @__PURE__ */ React.createElement(
    ScrollView,
    {
      contentContainerStyle: { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100, paddingHorizontal: 20, gap: 14 },
      showsVerticalScrollIndicator: false
    },
    /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Text, { style: styles.headerTitle }, "Practice"), selectedMarket && /* @__PURE__ */ React.createElement(View, { style: styles.marketBadge }, /* @__PURE__ */ React.createElement(View, { style: styles.marketDot }), /* @__PURE__ */ React.createElement(Text, { style: styles.marketBadgeText }, getMarketName(selectedMarket)))),
    cards.map((card, i) => /* @__PURE__ */ React.createElement(PracticeCard, { key: card.id, card, first: i === 0 })),
    /* @__PURE__ */ React.createElement(WorthAnotherLook, { entries: ledger, today, later: nextDue(ledger, today) })
  ));
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: "center", justifyContent: "center" },
  headerTitle: { ...TYPE.hero, fontSize: 32, color: COLORS.textPrimary, letterSpacing: -0.8 },
  marketBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: COLORS.accentSoft, borderRadius: 20, alignSelf: "flex-start" },
  marketDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  marketBadgeText: { ...TYPE.caption, color: COLORS.accent, fontSize: 11 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 12, borderRadius: 20, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  cardFirst: { borderColor: COLORS.accent, borderWidth: 2 },
  thumb: { width: 84, height: 84, borderRadius: 14, backgroundColor: COLORS.accentSoft },
  thumbLocked: { opacity: 0.45 },
  cardBody: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: COLORS.accent },
  cardTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  stateLine: { fontSize: 13, lineHeight: 18, color: COLORS.textSecondary },
  stateBold: { fontWeight: "700", color: COLORS.textPrimary },
  doneRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  doneText: { fontSize: 13, fontWeight: "700", color: COLORS.success },
  lockRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  lockText: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  button: { marginTop: 8, alignSelf: "flex-start", minHeight: 44, paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.accent },
  buttonQuiet: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: COLORS.accent },
  buttonText: { fontSize: 14, fontWeight: "700", color: COLORS.textOnAccent },
  buttonQuietText: { color: COLORS.accent },
  look: { padding: 16, paddingTop: 18, borderRadius: 20, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  lookStripe: { position: "absolute", left: 0, right: 0, top: 0, height: 4, backgroundColor: COLORS.warning },
  lookHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  lookIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.warningSoft, alignItems: "center", justifyContent: "center" },
  lookTitle: { fontSize: 17, fontWeight: "800", color: COLORS.textPrimary },
  count: { minWidth: 44, height: 44, borderRadius: 14, backgroundColor: AMBER, alignItems: "center", justifyContent: "center" },
  countText: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  itemName: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  itemMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  pips: { flexDirection: "row", alignItems: "flex-end", gap: 3 },
  pip: { width: 7, height: 16, borderRadius: 3, backgroundColor: COLORS.border },
  pipOn: { backgroundColor: COLORS.warning },
  lookButton: { marginTop: 6, minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: AMBER }
});
export {
  PracticeScreen as default
};
