import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { CaseBrief } from "../components/weekly/CaseBrief";
import { useSelectedMarket } from "../hooks/useSelectedMarket";
import { useUserXP } from "../hooks/useUserXP";
import { useWeeklyCase } from "../hooks/useWeeklyCase";
import { COLORS, TYPE } from "../lib/constants";
import { log } from "../lib/logger";
import { triggerHaptic } from "../lib/haptics";
import { trackEvent } from "../lib/analytics";
import {
  blockingParts,
  canSubmit,
  countdown,
  countWords,
  draftKey,
  hardCap,
  parseDraft,
  partStatus,
  phaseOf,
  resultsDay,
  suggestedMinutes,
  timerLabel,
  totalWords,
  WEEKLY_CASE_XP
} from "../lib/weeklyCase";
import { loadBoard, requestScoring, submitAnswers, xpAlreadyPaid } from "../lib/weeklyCaseApi";
const FAILURE = {
  closed: "This case has just closed, so your answer could not be saved. It is still on this phone.",
  unavailable: "This case is not available any more.",
  invalid: "One of your answers is outside its limits. Check the boxes marked in red.",
  network: "Could not reach the server. Your answer is still saved here. Try again."
};
function Header({ onClose, right }) {
  const insets = useSafeAreaInsets();
  return /* @__PURE__ */ React.createElement(View, { style: [styles.header, { paddingTop: insets.top + 6 }] }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onClose, style: styles.close, accessibilityRole: "button", accessibilityLabel: "Close" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 22, color: COLORS.textPrimary })), /* @__PURE__ */ React.createElement(Text, { style: styles.headerTitle }, "Weekly Case"), /* @__PURE__ */ React.createElement(View, { style: styles.headerRight }, right));
}
function Primary({ label, onPress, disabled, quiet }) {
  return /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      onPress,
      disabled,
      activeOpacity: 0.88,
      accessibilityRole: "button",
      accessibilityState: { disabled: !!disabled },
      style: [styles.primary, quiet && styles.primaryQuiet, disabled && styles.primaryDisabled]
    },
    /* @__PURE__ */ React.createElement(Text, { style: [styles.primaryText, quiet && styles.primaryQuietText] }, label)
  );
}
function Timer({ startedAt, minutes }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(id);
  }, []);
  const t = timerLabel(startedAt ? now - startedAt : 0, minutes);
  return /* @__PURE__ */ React.createElement(View, { style: [styles.timer, t.over && styles.timerOver], accessibilityLabel: t.over ? `Over the suggested time by ${t.text}` : `${t.text} left of the suggested time` }, /* @__PURE__ */ React.createElement(Feather, { name: "clock", size: 13, color: t.over ? COLORS.warning : COLORS.textSecondary }), /* @__PURE__ */ React.createElement(Text, { style: [styles.timerText, t.over && { color: COLORS.warning }] }, t.text));
}
function PartBox({ part, value, onChange, flagged }) {
  const status = partStatus(value, part);
  const words = countWords(value);
  const bad = status === "empty" || status === "short" || status === "toolong";
  return /* @__PURE__ */ React.createElement(View, { style: styles.fieldWrap }, /* @__PURE__ */ React.createElement(Text, { style: styles.fieldLabel }, part.label), /* @__PURE__ */ React.createElement(Text, { style: styles.fieldHint }, part.prompt), /* @__PURE__ */ React.createElement(
    TextInput,
    {
      value,
      onChangeText: onChange,
      multiline: true,
      maxLength: hardCap(part) * 12,
      style: [styles.input, flagged && bad && styles.inputFlag],
      placeholder: "Write here",
      placeholderTextColor: COLORS.textMuted,
      textAlignVertical: "top",
      accessibilityLabel: part.label
    }
  ), /* @__PURE__ */ React.createElement(Text, { style: [styles.counter, (flagged && bad || status === "toolong") && { color: COLORS.error }, status === "over" && { color: COLORS.warning }] }, status === "toolong" ? `${words} words \xB7 over the limit, cut it to ${hardCap(part)} or fewer` : status === "over" ? `${words} / ${part.maxWords} words \xB7 a little long, tighter reads better` : `${words} / ${part.maxWords} words`));
}
function Submitted({ weekly, board }) {
  const now = Date.now();
  const others = board.filter((r) => !r.is_me);
  return /* @__PURE__ */ React.createElement(View, { style: { gap: 14 } }, /* @__PURE__ */ React.createElement(View, { style: styles.doneCard }, /* @__PURE__ */ React.createElement(View, { style: styles.doneIcon }, /* @__PURE__ */ React.createElement(Feather, { name: "check", size: 26, color: COLORS.success })), /* @__PURE__ */ React.createElement(Text, { style: styles.doneTitle }, "Your answer is in"), /* @__PURE__ */ React.createElement(Text, { style: styles.doneBody }, "Scores and feedback are released when the week ends. Results come ", resultsDay(weekly.closesAt, now), ".")), /* @__PURE__ */ React.createElement(View, { style: styles.friendsCard }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionLabel }, "FRIENDS WHO HAVE SUBMITTED"), others.length === 0 ? /* @__PURE__ */ React.createElement(Text, { style: styles.muted }, "None yet. Send a friend this week's case and see who scores higher.") : others.map((r) => /* @__PURE__ */ React.createElement(View, { key: r.user_id, style: styles.friendRow }, /* @__PURE__ */ React.createElement(Feather, { name: "check-circle", size: 16, color: COLORS.success }), /* @__PURE__ */ React.createElement(Text, { style: styles.friendName }, r.display_name), r.friend_code ? /* @__PURE__ */ React.createElement(Text, { style: styles.friendCode }, r.friend_code) : null))));
}
function WeeklyCaseRoute() {
  const insets = useSafeAreaInsets();
  const { marketId } = useSelectedMarket();
  const weekly = useWeeklyCase();
  const { addXP } = useUserXP(marketId);
  const { current, userId, submitted, loading } = weekly;
  const [step, setStep] = useState("brief");
  const [answers, setAnswers] = useState({});
  const [startedAt, setStartedAt] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [board, setBoard] = useState([]);
  const [paid, setPaid] = useState(null);
  const paying = useRef(false);
  const parts = current?.parts ?? [];
  const dKey = userId && current ? draftKey(userId, current.id) : null;
  const done = submitted || justSubmitted;
  useEffect(() => {
    if (!dKey || !current) return;
    let live = true;
    void AsyncStorage.getItem(dKey).then((raw) => {
      if (!live) return;
      const draft = parseDraft(raw, current.parts);
      if (draft) {
        setAnswers(draft.answers);
        setStartedAt(draft.startedAt);
      }
      setDraftLoaded(true);
    }).catch(() => {
      if (live) setDraftLoaded(true);
    });
    return () => {
      live = false;
    };
  }, [dKey, current?.id]);
  useEffect(() => {
    if (!dKey || !draftLoaded || done) return;
    const id = setTimeout(() => {
      AsyncStorage.setItem(dKey, JSON.stringify({ answers, startedAt, savedAt: Date.now() })).catch(() => {
      });
    }, 500);
    return () => clearTimeout(id);
  }, [dKey, draftLoaded, done, answers, startedAt]);
  useEffect(() => {
    if (current && done && phaseOf(current, Date.now()) === "closed") router.replace(`/weekly-case-results?id=${current.id}`);
  }, [current, done]);
  const payXp = useCallback(async () => {
    if (!userId || !current || paying.current) return;
    paying.current = true;
    try {
      if (await xpAlreadyPaid(userId, current.id)) {
        setPaid(true);
        return;
      }
      await addXP(WEEKLY_CASE_XP, "weekly_case", current.id, "Weekly Case");
      setPaid(true);
    } catch (error) {
      log.warn("[WeeklyCase] could not pay XP", error);
      setPaid(null);
    } finally {
      paying.current = false;
    }
  }, [userId, current, addXP]);
  useEffect(() => {
    if (!done || !current) return;
    void loadBoard(current.id).then(setBoard).catch(() => {
    });
    void payXp();
  }, [done, current?.id, payXp]);
  const startWriting = () => {
    triggerHaptic("light");
    if (!startedAt) setStartedAt(Date.now());
    setStep("write");
  };
  const setPart = (id) => (text) => {
    setAnswers((a) => ({ ...a, [id]: text }));
    setMessage(null);
  };
  const hasDraft = useMemo(() => Object.values(answers).some((t) => t.trim()), [answers]);
  const submit = async () => {
    if (!current || !userId || busy) return;
    setBusy(true);
    setMessage(null);
    const seconds = startedAt ? Math.min(7200, Math.floor((Date.now() - startedAt) / 1e3)) : 0;
    const out = await submitAnswers(current.id, answers, seconds);
    setBusy(false);
    if (!out.ok) {
      setConfirming(false);
      setMessage(FAILURE[out.reason]);
      if (out.reason === "invalid") setFlagged(true);
      return;
    }
    trackEvent("weekly_case_submitted", { case_id: current.id, words: totalWords(answers) });
    triggerHaptic("success");
    if (out.created) requestScoring(current.id);
    if (dKey) AsyncStorage.removeItem(dKey).catch(() => {
    });
    setJustSubmitted(true);
    setConfirming(false);
    await weekly.refresh();
  };
  const close = () => router.back();
  if (loading || !userId) {
    return /* @__PURE__ */ React.createElement(View, { style: [styles.root, styles.center] }, /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "large", color: COLORS.accent }));
  }
  if (!current) {
    return /* @__PURE__ */ React.createElement(View, { style: styles.root }, /* @__PURE__ */ React.createElement(Header, { onClose: close }), /* @__PURE__ */ React.createElement(View, { style: styles.center }, /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, "No case this week"), /* @__PURE__ */ React.createElement(Text, { style: styles.muted }, "A new business problem arrives every Monday."), /* @__PURE__ */ React.createElement(Primary, { label: "Back to Practice", onPress: close })));
  }
  const phase = phaseOf(current, Date.now());
  const open = phase === "open";
  if (!done && !open) {
    return /* @__PURE__ */ React.createElement(View, { style: styles.root }, /* @__PURE__ */ React.createElement(Header, { onClose: close }), /* @__PURE__ */ React.createElement(View, { style: styles.center }, /* @__PURE__ */ React.createElement(Text, { style: styles.emptyTitle }, "This case has closed"), /* @__PURE__ */ React.createElement(Text, { style: styles.muted }, "A new one arrives on Monday. Answers are open for a week."), /* @__PURE__ */ React.createElement(Primary, { label: "Back to Practice", onPress: close })));
  }
  const missing = blockingParts(answers, parts);
  const ready = canSubmit(answers, parts);
  const minutes = suggestedMinutes(current);
  return /* @__PURE__ */ React.createElement(KeyboardAvoidingView, { style: styles.root, behavior: Platform.OS === "ios" ? "padding" : void 0 }, /* @__PURE__ */ React.createElement(Header, { onClose: close, right: !done && step === "write" ? /* @__PURE__ */ React.createElement(Timer, { startedAt, minutes }) : void 0 }), /* @__PURE__ */ React.createElement(
    ScrollView,
    {
      contentContainerStyle: { padding: 20, paddingBottom: insets.bottom + 140, gap: 18 },
      keyboardShouldPersistTaps: "handled",
      showsVerticalScrollIndicator: false
    },
    done ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Submitted, { weekly: current, board }), paid ? /* @__PURE__ */ React.createElement(View, { style: styles.xpChip }, /* @__PURE__ */ React.createElement(Feather, { name: "zap", size: 14, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.xpText }, `+${WEEKLY_CASE_XP} XP banked`)) : null, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => setBriefOpen((o) => !o), accessibilityRole: "button", style: styles.toggle }, /* @__PURE__ */ React.createElement(Text, { style: styles.toggleText }, briefOpen ? "Hide the case" : "Read the case again"), /* @__PURE__ */ React.createElement(Feather, { name: briefOpen ? "chevron-up" : "chevron-down", size: 16, color: COLORS.accent })), briefOpen ? /* @__PURE__ */ React.createElement(CaseBrief, { weekly: current }) : null) : step === "brief" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(View, { style: styles.metaRow }, /* @__PURE__ */ React.createElement(View, { style: styles.metaPill }, /* @__PURE__ */ React.createElement(Feather, { name: "clock", size: 13, color: COLORS.textSecondary }), /* @__PURE__ */ React.createElement(Text, { style: styles.metaText }, `About ${minutes} min`)), /* @__PURE__ */ React.createElement(View, { style: styles.metaPill }, /* @__PURE__ */ React.createElement(Feather, { name: "calendar", size: 13, color: COLORS.textSecondary }), /* @__PURE__ */ React.createElement(Text, { style: styles.metaText }, `Closes in ${countdown(current.closesAt - Date.now())}`))), /* @__PURE__ */ React.createElement(CaseBrief, { weekly: current })) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => setBriefOpen((o) => !o), accessibilityRole: "button", style: styles.toggle }, /* @__PURE__ */ React.createElement(Text, { style: styles.toggleText }, briefOpen ? "Hide the case" : "Show the case"), /* @__PURE__ */ React.createElement(Feather, { name: briefOpen ? "chevron-up" : "chevron-down", size: 16, color: COLORS.accent })), briefOpen ? /* @__PURE__ */ React.createElement(CaseBrief, { weekly: current }) : /* @__PURE__ */ React.createElement(Text, { style: styles.questionEcho }, current.question), parts.map((p) => /* @__PURE__ */ React.createElement(PartBox, { key: p.id, part: p, value: answers[p.id] ?? "", onChange: setPart(p.id), flagged })), /* @__PURE__ */ React.createElement(Text, { style: styles.wordCount }, `${totalWords(answers)} words \xB7 saved on this phone`), message ? /* @__PURE__ */ React.createElement(Text, { style: styles.error, accessibilityLiveRegion: "polite" }, message) : null)
  ), !done && /* @__PURE__ */ React.createElement(View, { style: [styles.bar, { paddingBottom: insets.bottom + 12 }] }, step === "brief" ? /* @__PURE__ */ React.createElement(Primary, { label: hasDraft ? "Continue writing" : "Start writing", onPress: startWriting }) : confirming ? /* @__PURE__ */ React.createElement(View, { style: styles.confirm }, /* @__PURE__ */ React.createElement(Text, { style: styles.confirmTitle }, "Submit your answer?"), /* @__PURE__ */ React.createElement(Text, { style: styles.confirmBody }, "You cannot change it after. Results come ", resultsDay(current.closesAt, Date.now()), "."), /* @__PURE__ */ React.createElement(View, { style: styles.confirmRow }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Primary, { label: "Keep editing", quiet: true, onPress: () => setConfirming(false) })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Primary, { label: busy ? "Submitting\u2026" : "Submit", disabled: busy, onPress: submit })))) : /* @__PURE__ */ React.createElement(
    Primary,
    {
      label: ready ? "Review and submit" : `${missing.length} ${missing.length === 1 ? "box" : "boxes"} still to finish`,
      disabled: !ready,
      onPress: () => {
        setFlagged(true);
        setConfirming(true);
      }
    }
  )));
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { ...TYPE.h3, flex: 1, textAlign: "center", color: COLORS.textPrimary },
  headerRight: { width: 76, alignItems: "flex-end", paddingRight: 8 },
  timer: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 14, backgroundColor: COLORS.bg1 },
  timerOver: { backgroundColor: COLORS.warningSoft },
  timerText: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, fontVariant: ["tabular-nums"] },
  metaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: COLORS.bg1 },
  metaText: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  toggle: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", minHeight: 36 },
  toggleText: { fontSize: 14, fontWeight: "700", color: COLORS.accent },
  questionEcho: { ...TYPE.bodyBold, fontSize: 15, lineHeight: 22, color: COLORS.textPrimary, padding: 14, borderRadius: 14, backgroundColor: COLORS.accentSoft },
  fieldWrap: { gap: 5 },
  fieldLabel: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  fieldHint: { fontSize: 13, lineHeight: 18, color: COLORS.textSecondary },
  input: { minHeight: 110, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bg1, color: COLORS.textPrimary, fontSize: 15, lineHeight: 22 },
  inputFlag: { borderColor: COLORS.error },
  counter: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted, alignSelf: "flex-end" },
  wordCount: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted, textAlign: "center" },
  error: { fontSize: 14, fontWeight: "600", color: COLORS.error, textAlign: "center" },
  bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, backgroundColor: COLORS.bg0 },
  primary: { minHeight: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, backgroundColor: COLORS.accent },
  primaryQuiet: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: COLORS.accent },
  primaryDisabled: { opacity: 0.45 },
  primaryText: { fontSize: 16, fontWeight: "800", color: COLORS.textOnAccent },
  primaryQuietText: { color: COLORS.accent },
  confirm: { gap: 8 },
  confirmTitle: { fontSize: 17, fontWeight: "800", color: COLORS.textPrimary },
  confirmBody: { fontSize: 14, color: COLORS.textSecondary },
  confirmRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  emptyTitle: { ...TYPE.h2, color: COLORS.textPrimary, textAlign: "center" },
  muted: { ...TYPE.body, fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  doneCard: { alignItems: "center", gap: 8, padding: 24, borderRadius: 20, backgroundColor: COLORS.successSoft },
  doneIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg0 },
  doneTitle: { ...TYPE.h1, color: COLORS.textPrimary },
  doneBody: { ...TYPE.body, textAlign: "center", color: COLORS.textSecondary },
  friendsCard: { gap: 10, padding: 16, borderRadius: 16, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  sectionLabel: { ...TYPE.overline, color: COLORS.textSecondary },
  friendRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  friendName: { flex: 1, fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  friendCode: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 1 },
  xpChip: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: COLORS.accentSoft },
  xpText: { fontSize: 13, fontWeight: "800", color: COLORS.accent }
});
export {
  WeeklyCaseRoute as default
};
