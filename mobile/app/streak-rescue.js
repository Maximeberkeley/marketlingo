import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useSelectedMarket } from "../hooks/useSelectedMarket";
import { useStudiedLessons } from "../hooks/useStudiedLessons";
import { useStreakFreeze } from "../hooks/useStreakFreeze";
import { useUserProgress } from "../hooks/useUserProgress";
import { triggerCelebration, triggerHaptic } from "../lib/haptics";
import { playSound } from "../lib/sounds";
import { log } from "../lib/logger";
import { getMarketName } from "../lib/markets";
import { lessonStatements } from "../lesson-kit/practice/lessonQuestions";
import { localDateString, nextLocalMidnightISOString, streakCountdownLabel } from "../lib/dayMath";
const NEEDED_CORRECT = 2;
function StreakRescueScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { marketId } = useSelectedMarket();
  const studied = useStudiedLessons(marketId || void 0);
  const { progress, refetch: refetchProgress } = useUserProgress(marketId || void 0);
  const { canFreeze, useFreeze, freezesUsedThisWeek, maxFreezes } = useStreakFreeze(marketId || void 0);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [saving, setSaving] = useState(false);
  const [started, setStarted] = useState(false);
  const [lessonDoneToday, setLessonDoneToday] = useState(null);
  const [clockNow, setClockNow] = useState(() => /* @__PURE__ */ new Date());
  const heart = useRef(new Animated.Value(1)).current;
  const streak = progress?.current_streak ?? 0;
  const marketName = marketId ? getMarketName(marketId) : "your industry";
  useEffect(() => {
    const timer = setInterval(() => setClockNow(/* @__PURE__ */ new Date()), 15e3);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!user || !marketId) return;
    let live = true;
    setLessonDoneToday(null);
    supabase.from("daily_completions").select("lesson_completed").eq("user_id", user.id).eq("market_id", marketId).eq("completion_date", localDateString()).maybeSingle().then(({ data, error }) => {
      if (live) setLessonDoneToday(error ? true : Boolean(data?.lesson_completed));
    });
    return () => {
      live = false;
    };
  }, [user?.id, marketId, localDateString(clockNow)]);
  const rescueWindowOpen = lessonDoneToday === false && Boolean(streakCountdownLabel(streak, false, clockNow));
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(heart, { toValue: 1.15, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(heart, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);
  useEffect(() => {
    if (studied.isLoading) return;
    const rows = lessonStatements(studied.lessons, 8);
    setQuestions(
      [...rows].sort(() => Math.random() - 0.5).slice(0, 3).map((row) => ({ id: row.id, statement: row.statement, isTrue: row.isTrue, explanation: row.explanation }))
    );
    setLoading(false);
  }, [studied.isLoading, studied.lessons]);
  const finish = useCallback(async (finalCorrect) => {
    setSaving(true);
    if (!user || !marketId || !rescueWindowOpen) {
      setSaving(false);
      return;
    }
    const { data: today, error: todayError } = await supabase.from("daily_completions").select("lesson_completed").eq("user_id", user.id).eq("market_id", marketId).eq("completion_date", localDateString()).maybeSingle();
    if (todayError || today?.lesson_completed) {
      setLessonDoneToday(true);
      setSaving(false);
      return;
    }
    if (finalCorrect >= NEEDED_CORRECT) {
      let saved = false;
      if (canFreeze) {
        saved = await useFreeze();
      }
      if (!saved && user && marketId) {
        const { error } = await supabase.from("user_progress").update({ streak_expires_at: nextLocalMidnightISOString() }).eq("user_id", user.id).eq("market_id", marketId);
        if (error) log.warn("Rescue clock extension failed", error);
      }
      await refetchProgress();
      triggerCelebration();
      playSound("streakMilestone");
      setOutcome("saved");
    } else {
      triggerHaptic("heavy");
      playSound("wrong");
      setOutcome("lost");
    }
    setSaving(false);
  }, [canFreeze, useFreeze, user, marketId, refetchProgress, rescueWindowOpen]);
  const onAnswer = (value) => {
    if (answer !== null) return;
    const q2 = questions[index];
    const right = value === q2.isTrue;
    setAnswer(value);
    if (right) {
      setCorrect((c) => c + 1);
      triggerHaptic("light");
      playSound("correct");
    } else {
      triggerHaptic("medium");
      playSound("wrong");
    }
  };
  const onNext = () => {
    const q2 = questions[index];
    const wasRight2 = answer === q2.isTrue;
    const runningCorrect = correct;
    if (index + 1 >= questions.length) {
      finish(runningCorrect);
    } else {
      setIndex((i) => i + 1);
      setAnswer(null);
    }
    if (!wasRight2) triggerHaptic("light");
  };
  if (loading || lessonDoneToday === null) {
    return <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={COLORS.streak} />
      </View>;
  }
  if (!rescueWindowOpen && !outcome) {
    return <View style={[styles.screen, styles.center, { padding: 24 }]}>
        <Feather name="check-circle" size={32} color={COLORS.success} />
        <Text style={styles.title}>{lessonDoneToday ? "Today's lesson is done" : "No rescue needed now"}</Text>
        <Text style={styles.body}>{lessonDoneToday ? "Your streak is safe for today." : "Study a lesson to keep your streak going."}</Text>
        <TouchableOpacity style={styles.primary} onPress={() => router.back()}>
          <Text style={styles.primaryText}>Back to Course</Text>
        </TouchableOpacity>
      </View>;
  }
  if (!questions.length) {
    return <View style={[styles.screen, styles.center, { padding: 24 }]}>
        <Text style={styles.title}>No rescue round available yet</Text>
        <Text style={styles.body}>Do today's lesson instead — that always keeps the streak alive.</Text>
        <TouchableOpacity style={styles.primary} onPress={() => router.back()}>
          <Text style={styles.primaryText}>Back</Text>
        </TouchableOpacity>
      </View>;
  }
  if (outcome) {
    const saved = outcome === "saved";
    return <LinearGradient
      colors={saved ? ["#F59E0B", "#EA580C", "#C2410C"] : ["#475569", "#334155", "#1E293B"]}
      style={styles.full}
    >
        <View style={[styles.fullInner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.fullEyebrow}>{saved ? "STREAK RESCUED" : "STREAK LOST"}</Text>
          <Animated.View style={[styles.bigNumberWrap, { transform: [{ scale: heart }] }]}>
            <Feather name="zap" size={44} color="#FFFFFF" />
            <Text style={styles.bigNumber}>{saved ? streak : 0}</Text>
          </Animated.View>
          <Text style={styles.fullTitle}>
            {saved ? `${streak} days of ${marketName}, still yours` : "Day one starts today"}
          </Text>
          <Text style={styles.fullBody}>
            {saved ? `${correct} of ${questions.length} right. You kept it \u2014 now bank today's lesson so it never comes to this again.` : `Only ${correct} of ${questions.length} right this time. Nothing you learned is gone, just the count. Day one is the easiest day to win.`}
          </Text>
          <Image source={require("../assets/leo-sticker.png")} style={styles.fullLeo} resizeMode="contain" />
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.whiteCta} onPress={() => router.replace("/(tabs)/home")} activeOpacity={0.9}>
            <Text style={[styles.whiteCtaText, { color: saved ? "#C2410C" : "#1E293B" }]}>
              {saved ? "GO DO TODAY'S LESSON" : "START AGAIN TODAY"}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>;
  }
  if (!started) {
    return <LinearGradient colors={["#F59E0B", "#EA580C", "#C2410C"]} style={styles.full}>
        <View style={[styles.fullInner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.fullEyebrow}>YOUR STREAK IS ON THE LINE</Text>
          <View style={styles.bigNumberWrap}>
            <Feather name="zap" size={44} color="#FFFFFF" />
            <Text style={styles.bigNumber}>{streak}</Text>
          </View>
          <Text style={styles.fullTitle}>Rescue your {streak}-day streak</Text>
          <Text style={styles.fullBody}>
            Three fast true-or-false calls from {marketName}. Get {NEEDED_CORRECT} right and the streak stays yours.
          </Text>
          <Image source={require("../assets/leo-sticker.png")} style={styles.fullLeo} resizeMode="contain" />
          <View style={{ flex: 1 }} />
          <TouchableOpacity
      style={styles.whiteCta}
      onPress={() => {
        triggerHaptic("medium");
        setStarted(true);
      }}
      activeOpacity={0.9}
    >
            <Text style={[styles.whiteCtaText, { color: "#C2410C" }]}>RESCUE MY STREAK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostCta} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.ghostCtaText}>NOT NOW</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>;
  }
  const q = questions[index];
  const answered = answer !== null;
  const wasRight = answered && answer === q.isTrue;
  return <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Feather name="x" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(index + (answered ? 1 : 0)) / questions.length * 100}%` }]} />
        </View>
        <View style={styles.streakChip}>
          <Feather name="zap" size={12} color={COLORS.streak} />
          <Text style={styles.streakChipText}>{streak}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <Text style={styles.eyebrow}>RESCUE ROUND · {NEEDED_CORRECT} OF {questions.length} TO SAVE IT</Text>
        <Text style={styles.title}>True or false?</Text>
        <View style={styles.statementCard}>
          <Text style={styles.statement}>{q.statement}</Text>
        </View>

        <View style={styles.answerRow}>
          {[true, false].map((value) => {
    const selected = answer === value;
    const isCorrectChoice = answered && value === q.isTrue;
    return <TouchableOpacity
      key={String(value)}
      style={[
        styles.answerBtn,
        selected && { borderColor: wasRight ? COLORS.success : COLORS.error },
        isCorrectChoice && { backgroundColor: COLORS.successSoft, borderColor: COLORS.success }
      ]}
      onPress={() => onAnswer(value)}
      activeOpacity={0.85}
      disabled={answered}
    >
                <Feather name={value ? "check" : "x"} size={18} color={value ? COLORS.success : COLORS.error} />
                <Text style={styles.answerText}>{value ? "True" : "False"}</Text>
              </TouchableOpacity>;
  })}
        </View>

        {answered && <View style={[styles.feedback, { backgroundColor: wasRight ? COLORS.successSoft : COLORS.errorSoft }]}>
            <Text style={[styles.feedbackTitle, { color: wasRight ? COLORS.success : COLORS.error }]}>
              {wasRight ? "Correct" : "Not quite"}
            </Text>
            <Text style={styles.feedbackBody}>{q.explanation}</Text>
          </View>}

        <Text style={styles.footnote}>
          Freezes used this week: {freezesUsedThisWeek}/{maxFreezes}
        </Text>
      </ScrollView>

      {answered && <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.primary} onPress={onNext} disabled={saving} activeOpacity={0.9}>
            <Text style={styles.primaryText}>
              {saving ? "Saving\u2026" : index + 1 >= questions.length ? "See the result" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>}
    </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg0 },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  progressTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: COLORS.bg1, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: COLORS.streak },
  streakChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.orangeSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  streakChipText: { fontSize: 12, fontWeight: "800", color: COLORS.streak },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1, color: COLORS.streak, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 14, textAlign: "center" },
  body: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 21, paddingHorizontal: 8 },
  statementCard: { backgroundColor: COLORS.bg2, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 18, marginBottom: 18, ...SHADOWS.sm },
  statement: { fontSize: 16, lineHeight: 24, color: COLORS.textPrimary, fontWeight: "600" },
  answerRow: { flexDirection: "row", gap: 12 },
  answerBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.bg2 },
  answerText: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  feedback: { borderRadius: 16, padding: 16, marginTop: 18 },
  feedbackTitle: { fontSize: 13, fontWeight: "800", marginBottom: 6 },
  feedbackBody: { fontSize: 13, lineHeight: 20, color: COLORS.textSecondary },
  footnote: { fontSize: 11, color: COLORS.textMuted, marginTop: 18, textAlign: "center" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: COLORS.bg0, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  primary: { backgroundColor: COLORS.streak, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 8, paddingHorizontal: 28 },
  primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  full: { flex: 1 },
  fullInner: { flex: 1, alignItems: "center", paddingHorizontal: 28 },
  fullEyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.6, color: "rgba(255,255,255,0.85)" },
  bigNumberWrap: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18 },
  bigNumber: { fontSize: 92, lineHeight: 100, fontWeight: "900", color: "#FFFFFF" },
  fullTitle: { fontSize: 26, fontWeight: "900", color: "#FFFFFF", textAlign: "center", marginTop: 6 },
  fullBody: { fontSize: 15, lineHeight: 23, color: "rgba(255,255,255,0.92)", textAlign: "center", marginTop: 12 },
  fullLeo: { width: 150, height: 150, marginTop: 18 },
  whiteCta: {
    alignSelf: "stretch",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: "center",
    ...SHADOWS.sm
  },
  whiteCtaText: { fontSize: 15, fontWeight: "900", letterSpacing: 0.6 },
  ghostCta: { alignSelf: "stretch", paddingVertical: 15, alignItems: "center", marginTop: 4 },
  ghostCtaText: { fontSize: 14, fontWeight: "900", letterSpacing: 0.6, color: "rgba(255,255,255,0.85)" }
});
export {
  StreakRescueScreen as default
};
