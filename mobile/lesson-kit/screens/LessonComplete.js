import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { PrimaryButton } from "../components/PrimaryButton";
import { tokens } from "../theme/tokens";
import { playSound } from "../../lib/sounds";
import { triggerHaptic } from "../../lib/haptics";
import { lessonRewards, scoreHeadline } from "./lessonRewards";
import { useUserProgress } from "../../hooks/useUserProgress";
import { useDeliverable } from "../../hooks/useDeliverable";
import { useAuth } from "../../hooks/useAuth";
import { hasCalledToday } from "../../lib/leoCall";
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} min ${s.toString().padStart(2, "0")}` : `${s} sec`;
}
function LessonComplete({
  correct,
  total,
  baseXp,
  bestCombo = 0,
  heartsLeft,
  timeSpentSeconds = 0,
  streakDays,
  onDone,
  doneLabel = "Continue",
  leoQuestions = 0,
  marketId,
  lessonTitle,
  takeaway
}) {
  const { user } = useAuth();
  const [calledToday, setCalledToday] = useState(false);
  useEffect(() => {
    let live = true;
    hasCalledToday(user?.id).then((v) => {
      if (live) setCalledToday(v);
    });
    return () => {
      live = false;
    };
  }, [user?.id]);
  const { progress } = useUserProgress(marketId);
  const goal = progress?.learning_goal ?? null;
  const dossier = useDeliverable(marketId, goal);
  const sectionCount = dossier.template.sections.length;
  const nextSection = dossier.firstOpenSection;
  const accuracy = total > 0 ? Math.round(correct / total * 100) : 100;
  const praise = scoreHeadline(accuracy, total);
  const bonuses = useRef(lessonRewards(baseXp, accuracy, total, bestCombo, heartsLeft, timeSpentSeconds)).current;
  const totalXp = bonuses.reduce((sum, line) => sum + line.xp, 0);
  const [shown, setShown] = useState(0);
  const [saving, setSaving] = useState(false);
  const saveInFlight = useRef(false);
  const finish = async (navigate) => {
    if (saveInFlight.current) return;
    saveInFlight.current = true;
    setSaving(true);
    try {
      const saved = await onDone(totalXp);
      if (saved !== false) navigate?.();
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  };
  useEffect(() => {
    playSound("celebration").catch(() => {
    });
  }, []);
  useEffect(() => {
    if (shown >= bonuses.length) return;
    const t = setTimeout(() => {
      setShown((s) => s + 1);
      playSound("xpEarn").catch(() => {
      });
    }, 350 + shown * 300);
    return () => clearTimeout(t);
  }, [shown, bonuses.length]);
  return /* @__PURE__ */ React.createElement(
    ScrollView,
    {
      style: styles.scroll,
      contentContainerStyle: styles.wrap,
      showsVerticalScrollIndicator: false
    },
    /* @__PURE__ */ React.createElement(Image, { source: require("../../assets/mascot/leo-celebrating.png"), style: styles.leoHero, resizeMode: "contain" }),
    /* @__PURE__ */ React.createElement(Text, { style: styles.title }, praise),
    typeof streakDays === "number" && streakDays > 0 ? /* @__PURE__ */ React.createElement(Text, { style: styles.subtitle }, "\u{1F525} ", streakDays, "-day streak \u2014 come back tomorrow to keep it.") : /* @__PURE__ */ React.createElement(Text, { style: styles.subtitle }, "You just started a streak. Come back tomorrow to keep it."),
    /* @__PURE__ */ React.createElement(Text, { style: styles.xpBig }, "+", totalXp, " XP"),
    total > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.bonusList }, bonuses.map((b, i) => /* @__PURE__ */ React.createElement(View, { key: i, style: styles.bonusRow }, /* @__PURE__ */ React.createElement(Feather, { name: "zap", size: 14, color: tokens.color.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.bonusLabel }, b.label), /* @__PURE__ */ React.createElement(Text, { style: styles.bonusXp }, "+", b.xp)))),
    leoQuestions > 0 && /* @__PURE__ */ React.createElement(Text, { style: styles.leoLine }, "You asked Leo ", leoQuestions, " ", leoQuestions === 1 ? "thing" : "things", ". That's how it sticks."),
    /* @__PURE__ */ React.createElement(View, { style: styles.stats }, total > 0 && /* @__PURE__ */ React.createElement(Stat, { label: "Accuracy", value: `${accuracy}%` }), total > 0 && /* @__PURE__ */ React.createElement(Stat, { label: "Correct", value: `${correct}/${total}` }), /* @__PURE__ */ React.createElement(Stat, { label: "Time", value: formatTime(timeSpentSeconds) })),
    !dossier.loading && /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: styles.dossierCard,
        disabled: saving,
        activeOpacity: 0.85,
        onPress: () => {
          triggerHaptic("medium");
          void finish(() => router.push({ pathname: "/deliverable", params: nextSection ? { section: nextSection.key } : {} }));
        }
      },
      /* @__PURE__ */ React.createElement(View, { style: styles.dossierIcon }, /* @__PURE__ */ React.createElement(Feather, { name: "file-text", size: 18, color: tokens.color.accent })),
      /* @__PURE__ */ React.createElement(View, { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.dossierEyebrow }, dossier.template.title.toUpperCase()), /* @__PURE__ */ React.createElement(Text, { style: styles.dossierTitle }, `${dossier.template.title} \xB7 ${dossier.filledSections} of ${sectionCount} sections written by you`), /* @__PURE__ */ React.createElement(Text, { style: styles.dossierBody }, nextSection ? `Next: ${nextSection.title}` : "Every section is written. Open it to review or export.")),
      /* @__PURE__ */ React.createElement(Feather, { name: "chevron-right", size: 18, color: tokens.color.accent })
    ),
    /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        accessibilityRole: "button",
        accessibilityLabel: calledToday ? "Next call tomorrow" : "Call Leo, 3 minutes",
        disabled: calledToday || saving,
        style: [styles.callBtn, calledToday && { opacity: 0.55 }],
        activeOpacity: 0.8,
        onPress: () => {
          triggerHaptic("medium");
          void finish(() => router.push({ pathname: "/leo-call", params: { marketId: marketId ?? "", lessonTitle: lessonTitle ?? "", takeaway: takeaway ?? "" } }));
        }
      },
      /* @__PURE__ */ React.createElement(Feather, { name: "phone", size: 16, color: tokens.color.accent }),
      /* @__PURE__ */ React.createElement(Text, { style: styles.callBtnText }, calledToday ? "Next call tomorrow" : "Call Leo \xB7 3 min")
    ),
    /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        accessibilityRole: "link",
        accessibilityLabel: "Today's intel \xB7 3 stories \u2192",
        style: styles.intelLink,
        disabled: saving,
        activeOpacity: 0.7,
        onPress: () => {
          triggerHaptic("light");
          void finish(() => router.push({ pathname: "/(tabs)/roadmap", params: { autoOpen: "1" } }));
        }
      },
      /* @__PURE__ */ React.createElement(Text, { style: styles.intelLinkText }, "Today's intel \xB7 3 stories \u2192")
    ),
    /* @__PURE__ */ React.createElement(
      PrimaryButton,
      {
        label: saving ? "Saving your XP\u2026" : doneLabel,
        variant: saving ? "disabled" : "primary",
        onPress: () => {
          triggerHaptic("light");
          void finish();
        },
        style: styles.cta
      }
    )
  );
}
function Stat({ label, value }) {
  return /* @__PURE__ */ React.createElement(View, { style: styles.stat }, /* @__PURE__ */ React.createElement(Text, { style: styles.statValue }, value), /* @__PURE__ */ React.createElement(Text, { style: styles.statLabel }, label));
}
const styles = StyleSheet.create({
  leoHero: { width: 132, height: 132, alignSelf: "center", marginBottom: 8 },
  scroll: { flex: 1, backgroundColor: tokens.color.bg },
  wrap: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space.xl,
    paddingBottom: tokens.space.xl * 2,
    gap: tokens.space.sm,
    backgroundColor: tokens.color.bg
  },
  callBtn: { alignSelf: "stretch", minHeight: 50, borderRadius: 14, borderWidth: 1.5, borderColor: tokens.color.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 },
  callBtnText: { fontSize: tokens.font.body, fontWeight: "700", color: tokens.color.accent },
  intelLink: { minHeight: 44, justifyContent: "center", alignSelf: "stretch", alignItems: "center" },
  intelLinkText: { fontSize: tokens.font.caption + 1, color: tokens.color.accent, fontWeight: "600", textAlign: "center" },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: tokens.color.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: tokens.space.sm
  },
  title: { maxWidth: "100%", textAlign: "center", fontSize: tokens.font.title, fontWeight: "800", color: tokens.color.text },
  subtitle: { maxWidth: "100%", textAlign: "center", fontSize: tokens.font.body, color: tokens.color.textSecondary, textAlign: "center" },
  xpBig: {
    fontSize: 40,
    fontWeight: "900",
    color: tokens.color.accent,
    marginTop: tokens.space.md
  },
  leoLine: {
    fontSize: tokens.font.caption,
    fontWeight: "700",
    color: tokens.color.accent,
    textAlign: "center",
    marginBottom: tokens.space.md
  },
  bonusList: { alignSelf: "stretch", gap: 6, marginTop: tokens.space.sm },
  bonusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm
  },
  bonusLabel: { flex: 1, minWidth: 0, flexShrink: 1, fontSize: tokens.font.caption + 1, fontWeight: "700", color: tokens.color.textSecondary },
  bonusXp: { fontSize: tokens.font.caption + 1, fontWeight: "800", color: tokens.color.accent },
  stats: {
    flexDirection: "row",
    gap: tokens.space.md,
    marginTop: tokens.space.lg,
    width: "100%"
  },
  stat: {
    flex: 1,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderColor: tokens.color.border,
    paddingVertical: tokens.space.lg,
    alignItems: "center",
    gap: 4
  },
  statValue: { fontSize: tokens.font.body, fontWeight: "800", color: tokens.color.text },
  statLabel: { fontSize: tokens.font.caption, color: tokens.color.textMuted, fontWeight: "600" },
  cta: { alignSelf: "stretch", marginTop: tokens.space.lg },
  dossierCard: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.md,
    marginTop: tokens.space.lg,
    padding: tokens.space.md,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.color.accent,
    backgroundColor: tokens.color.card,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4
  },
  dossierIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.color.accentSoft
  },
  dossierEyebrow: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 1,
    color: tokens.color.accent
  },
  dossierTitle: {
    fontSize: tokens.font.caption + 2,
    fontWeight: "800",
    color: tokens.color.text,
    marginTop: 3
  },
  dossierBody: { fontSize: tokens.font.caption, color: tokens.color.textSecondary, marginTop: 2 }
});
export {
  LessonComplete
};
