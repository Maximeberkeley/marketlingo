import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Image, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { PrimaryButton } from "../components/PrimaryButton";
import { tokens } from "../theme/tokens";
import { playSound } from "../../lib/sounds";
import { triggerHaptic } from "../../lib/haptics";
import { useIntelHabit } from "../../hooks/useIntelHabit";
import { useDisplayName } from "../../hooks/useDisplayName";
import { useUserProgress } from "../../hooks/useUserProgress";
import { useDeliverable } from "../../hooks/useDeliverable";
function computeBonuses(accuracy, bestCombo, heartsLeft, timeSpentSeconds) {
  const bonuses = [];
  if (accuracy === 100) bonuses.push({ label: "Flawless run", xp: 25 });
  if (heartsLeft === 3 && accuracy < 100) bonuses.push({ label: "All hearts intact", xp: 10 });
  if (bestCombo >= 3) bonuses.push({ label: `${bestCombo} in a row`, xp: bestCombo * 3 });
  if (timeSpentSeconds > 0 && timeSpentSeconds < 180 && accuracy >= 80) {
    bonuses.push({ label: "Sharp and quick", xp: 15 });
  }
  bonuses.push({ label: "Daily lesson", xp: 5 + Math.floor(Math.random() * 16) });
  return bonuses;
}
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
  heartsLeft = 3,
  timeSpentSeconds = 0,
  streakDays,
  onDone,
  doneLabel = "Continue",
  leoQuestions = 0,
  marketId
}) {
  const { displayName } = useDisplayName();
  const intel = useIntelHabit(marketId);
  const { progress } = useUserProgress(marketId);
  const goal = progress?.learning_goal ?? null;
  const dossier = useDeliverable(marketId, goal);
  const openSlot = dossier.loading ? null : dossier.template.sections.find((s) => (dossier.bySection[s.key]?.length ?? 0) === 0) ?? null;
  const accuracy = total > 0 ? Math.round(correct / total * 100) : 100;
  const praise = accuracy === 100 ? `Brilliant work, ${displayName}!` : accuracy >= 80 ? `Spot on, ${displayName}! You're mastering this.` : `Way to crush today's module, ${displayName}!`;
  const bonuses = useRef(computeBonuses(accuracy, bestCombo, heartsLeft, timeSpentSeconds)).current;
  const bonusXp = bonuses.reduce((sum, b) => sum + b.xp, 0);
  const totalXp = baseXp + bonusXp;
  const [step, setStep] = useState("rewards");
  const [shown, setShown] = useState(0);
  const counter = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const id = counter.addListener(({ value }) => setDisplay(Math.round(value)));
    Animated.timing(counter, {
      toValue: totalXp,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start();
    playSound("celebration").catch(() => {
    });
    return () => counter.removeListener(id);
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
  if (step === "intel") {
    return <View style={styles.intelWrap}>
        <Image source={require("../../assets/leo-sticker.png")} style={styles.intelHeroLeo} resizeMode="contain" />
        <Text style={styles.intelEyebrow}>ONE LAST STEP</Text>
        <Text style={styles.intelHeadline}>Now read today's intel</Text>
        <Text style={styles.intelSub}>
          {intel.done ? `All ${intel.target} stories read today. You're current.` : `${intel.remaining} ${intel.remaining === 1 ? "story" : "stories"} left today \xB7 ${intel.readToday}/${intel.target} \xB7 +20 XP when you finish`}
        </Text>
        <Text style={styles.intelQuote}>
          {intel.done ? 'Leo: "Go see what changed since this morning anyway."' : 'Leo: "The concept is yours. Now see it happening this week."'}
        </Text>
        <PrimaryButton
      label="Open today's intel"
      onPress={() => {
        triggerHaptic("medium");
        onDone(totalXp);
        router.push({ pathname: "/(tabs)/roadmap", params: { autoOpen: "1" } });
      }}
      style={styles.cta}
    />
        <TouchableOpacity onPress={() => onDone(totalXp)} style={styles.laterBtn} activeOpacity={0.7}>
          <Text style={styles.laterText}>Maybe later</Text>
        </TouchableOpacity>
      </View>;
  }
  return <ScrollView
    style={styles.scroll}
    contentContainerStyle={styles.wrap}
    showsVerticalScrollIndicator={false}
  >
      <View style={styles.badge}>
        <Feather name="award" size={40} color={tokens.color.accent} />
      </View>
      <Text style={styles.title}>{praise}</Text>
      {typeof streakDays === "number" && streakDays > 0 ? <Text style={styles.subtitle}>🔥 {streakDays}-day streak — come back tomorrow to keep it.</Text> : <Text style={styles.subtitle}>You just started a streak. Come back tomorrow to keep it.</Text>}

      <Text style={styles.xpBig}>+{display} XP</Text>

      <View style={styles.bonusList}>
        {bonuses.slice(0, shown).map((b, i) => <View key={i} style={styles.bonusRow}>
            <Feather name="zap" size={14} color={tokens.color.accent} />
            <Text style={styles.bonusLabel}>{b.label}</Text>
            <Text style={styles.bonusXp}>+{b.xp}</Text>
          </View>)}
      </View>

      {leoQuestions > 0 && <Text style={styles.leoLine}>
          You asked Leo {leoQuestions} {leoQuestions === 1 ? "thing" : "things"}. That's how it sticks.
        </Text>}

      <View style={styles.stats}>
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Correct" value={`${correct}/${total}`} />
        <Stat label="Time" value={formatTime(timeSpentSeconds)} />
      </View>

      {
    /* One slot of their own dossier is now within reach. */
  }
      {openSlot && <TouchableOpacity
    style={styles.dossierCard}
    activeOpacity={0.85}
    onPress={() => {
      triggerHaptic("medium");
      onDone(totalXp);
      router.push({ pathname: "/deliverable", params: { section: openSlot.key } });
    }}
  >
          <View style={styles.dossierIcon}>
            <Feather name="file-text" size={18} color={tokens.color.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dossierEyebrow}>
              {dossier.template.title.toUpperCase()} · {dossier.completion}% WRITTEN
            </Text>
            <Text style={styles.dossierTitle}>Slot open: {openSlot.title}</Text>
            <Text style={styles.dossierBody}>{openSlot.prompt}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={tokens.color.accent} />
        </TouchableOpacity>}

      <PrimaryButton
    label={intel.loading ? doneLabel : "Continue"}
    onPress={() => {
      triggerHaptic("light");
      if (intel.loading) onDone(totalXp);
      else setStep("intel");
    }}
    style={styles.cta}
  />
    </ScrollView>;
}
function Stat({ label, value }) {
  return <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>;
}
const styles = StyleSheet.create({
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
  intelWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space.xl,
    backgroundColor: tokens.color.bg
  },
  intelHeroLeo: { width: 132, height: 132, marginBottom: tokens.space.lg },
  intelEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: tokens.color.accent
  },
  intelHeadline: {
    fontSize: tokens.font.title + 2,
    fontWeight: "900",
    color: tokens.color.text,
    textAlign: "center",
    marginTop: 8
  },
  intelSub: {
    fontSize: tokens.font.body,
    color: tokens.color.textSecondary,
    textAlign: "center",
    marginTop: 10
  },
  intelQuote: {
    fontSize: tokens.font.caption + 1,
    color: tokens.color.textMuted,
    textAlign: "center",
    marginTop: tokens.space.md,
    fontStyle: "italic"
  },
  laterBtn: { marginTop: tokens.space.md, padding: tokens.space.sm },
  laterText: { fontSize: tokens.font.caption + 1, fontWeight: "700", color: tokens.color.textMuted },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: tokens.color.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: tokens.space.sm
  },
  title: { fontSize: tokens.font.title, fontWeight: "800", color: tokens.color.text },
  subtitle: { fontSize: tokens.font.body, color: tokens.color.textSecondary, textAlign: "center" },
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
  bonusLabel: { flex: 1, fontSize: tokens.font.caption + 1, fontWeight: "700", color: tokens.color.textSecondary },
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
  intelCard: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.md,
    marginTop: tokens.space.lg,
    padding: tokens.space.md,
    borderRadius: tokens.radius.lg,
    borderWidth: 2,
    borderColor: tokens.color.accent,
    backgroundColor: tokens.color.accentSoft
  },
  intelLeo: { width: 44, height: 44 },
  intelTitle: { fontSize: tokens.font.caption + 2, fontWeight: "800", color: tokens.color.text },
  intelBody: { fontSize: tokens.font.caption, color: tokens.color.textSecondary, marginTop: 2 },
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
