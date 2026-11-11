import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { CaseBrief } from '../components/weekly/CaseBrief';
import { useSelectedMarket } from '../hooks/useSelectedMarket';
import { useUserXP } from '../hooks/useUserXP';
import { useWeeklyCase } from '../hooks/useWeeklyCase';
import { COLORS, TYPE } from '../lib/constants';
import { log } from '../lib/logger';
import { triggerHaptic } from '../lib/haptics';
import { trackEvent } from '../lib/analytics';
import {
  blockingParts, canSubmit, countdown, countWords, draftKey, hardCap, parseDraft, partStatus, phaseOf, resultsDay,
  suggestedMinutes, timerLabel, totalWords, WEEKLY_CASE_XP, WeeklyAnswers, WeeklyPart,
} from '../lib/weeklyCase';
import { loadBoard, requestScoring, submitAnswers, xpAlreadyPaid } from '../lib/weeklyCaseApi';
import type { WeeklyBoardRow } from '../lib/weeklyCase';

type Step = 'brief' | 'write';

const FAILURE: Record<string, string> = {
  closed: 'This case has just closed, so your answer could not be saved. It is still on this phone.',
  unavailable: 'This case is not available any more.',
  invalid: 'One of your answers is outside its limits. Check the boxes marked in red.',
  network: 'Could not reach the server. Your answer is still saved here. Try again.',
};

function Header({ onClose, right }: { onClose: () => void; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <TouchableOpacity onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
        <Feather name="x" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Weekly Case</Text>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

function Primary({ label, onPress, disabled, quiet }: { label: string; onPress: () => void; disabled?: boolean; quiet?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={[styles.primary, quiet && styles.primaryQuiet, disabled && styles.primaryDisabled]}
    >
      <Text style={[styles.primaryText, quiet && styles.primaryQuietText]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Timer({ startedAt, minutes }: { startedAt: number | null; minutes: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const t = timerLabel(startedAt ? now - startedAt : 0, minutes);
  return (
    <View style={[styles.timer, t.over && styles.timerOver]} accessibilityLabel={t.over ? `Over the suggested time by ${t.text}` : `${t.text} left of the suggested time`}>
      <Feather name="clock" size={13} color={t.over ? COLORS.warning : COLORS.textSecondary} />
      <Text style={[styles.timerText, t.over && { color: COLORS.warning }]}>{t.text}</Text>
    </View>
  );
}

function PartBox({ part, value, onChange, flagged }: { part: WeeklyPart; value: string; onChange: (v: string) => void; flagged: boolean }) {
  const status = partStatus(value, part);
  const words = countWords(value);
  const bad = status === 'empty' || status === 'short' || status === 'toolong';
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{part.label}</Text>
      <Text style={styles.fieldHint}>{part.prompt}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline
        maxLength={hardCap(part) * 12}
        style={[styles.input, flagged && bad && styles.inputFlag]}
        placeholder="Write here"
        placeholderTextColor={COLORS.textMuted}
        textAlignVertical="top"
        accessibilityLabel={part.label}
      />
      <Text style={[styles.counter, ((flagged && bad) || status === 'toolong') && { color: COLORS.error }, status === 'over' && { color: COLORS.warning }]}>
        {status === 'toolong'
          ? `${words} words · over the limit, cut it to ${hardCap(part)} or fewer`
          : status === 'over'
            ? `${words} / ${part.maxWords} words · a little long, tighter reads better`
            : `${words} / ${part.maxWords} words`}
      </Text>
    </View>
  );
}

function Submitted({ weekly, board }: { weekly: NonNullable<ReturnType<typeof useWeeklyCase>['current']>; board: WeeklyBoardRow[] }) {
  const now = Date.now();
  const others = board.filter(r => !r.is_me);
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.doneCard}>
        <View style={styles.doneIcon}><Feather name="check" size={26} color={COLORS.success} /></View>
        <Text style={styles.doneTitle}>Your answer is in</Text>
        <Text style={styles.doneBody}>
          Scores and feedback are released when the week ends. Results come {resultsDay(weekly.closesAt, now)}.
        </Text>
      </View>
      <View style={styles.friendsCard}>
        <Text style={styles.sectionLabel}>FRIENDS WHO HAVE SUBMITTED</Text>
        {others.length === 0
          ? <Text style={styles.muted}>None yet. Send a friend this week's case and see who scores higher.</Text>
          : others.map(r => (
            <View key={r.user_id} style={styles.friendRow}>
              <Feather name="check-circle" size={16} color={COLORS.success} />
              <Text style={styles.friendName}>{r.display_name}</Text>
              {r.friend_code ? <Text style={styles.friendCode}>{r.friend_code}</Text> : null}
            </View>
          ))}
      </View>
    </View>
  );
}

export default function WeeklyCaseRoute() {
  const insets = useSafeAreaInsets();
  const { marketId } = useSelectedMarket();
  const weekly = useWeeklyCase();
  const { addXP } = useUserXP(marketId);
  const { current, userId, submitted, loading } = weekly;

  const [step, setStep] = useState<Step>('brief');
  const [answers, setAnswers] = useState<WeeklyAnswers>({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [board, setBoard] = useState<WeeklyBoardRow[]>([]);
  const [paid, setPaid] = useState<boolean | null>(null);
  const paying = useRef(false);

  const parts = current?.parts ?? [];
  const dKey = userId && current ? draftKey(userId, current.id) : null;
  const done = submitted || justSubmitted;

  // Pick the draft up where the learner left it.
  useEffect(() => {
    if (!dKey || !current) return;
    let live = true;
    void AsyncStorage.getItem(dKey).then(raw => {
      if (!live) return;
      const draft = parseDraft(raw, current.parts);
      if (draft) { setAnswers(draft.answers); setStartedAt(draft.startedAt); }
      setDraftLoaded(true);
    }).catch(() => { if (live) setDraftLoaded(true); });
    return () => { live = false; };
  }, [dKey, current?.id]);

  // Autosave, a moment after the last keystroke.
  useEffect(() => {
    if (!dKey || !draftLoaded || done) return;
    const id = setTimeout(() => {
      AsyncStorage.setItem(dKey, JSON.stringify({ answers, startedAt, savedAt: Date.now() })).catch(() => {});
    }, 500);
    return () => clearTimeout(id);
  }, [dKey, draftLoaded, done, answers, startedAt]);

  // Once it is in, results day is the story: send anyone whose results are out straight there.
  useEffect(() => {
    if (current && done && phaseOf(current, Date.now()) === 'closed') router.replace(`/weekly-case-results?id=${current.id}` as any);
  }, [current, done]);

  // Who has submitted so far, and the XP if it has not been paid yet.
  const payXp = useCallback(async () => {
    if (!userId || !current || paying.current) return;
    paying.current = true;
    try {
      if (await xpAlreadyPaid(userId, current.id)) { setPaid(true); return; }
      await addXP(WEEKLY_CASE_XP, 'weekly_case', current.id, 'Weekly Case');
      setPaid(true);
    } catch (error) {
      // Not paid and not sure: stay quiet and try again the next time this screen opens.
      log.warn('[WeeklyCase] could not pay XP', error);
      setPaid(null);
    } finally {
      paying.current = false;
    }
  }, [userId, current, addXP]);

  useEffect(() => {
    if (!done || !current) return;
    void loadBoard(current.id).then(setBoard).catch(() => {});
    void payXp();
  }, [done, current?.id, payXp]);

  const startWriting = () => {
    triggerHaptic('light');
    if (!startedAt) setStartedAt(Date.now());
    setStep('write');
  };

  const setPart = (id: string) => (text: string) => { setAnswers(a => ({ ...a, [id]: text })); setMessage(null); };
  const hasDraft = useMemo(() => Object.values(answers).some(t => t.trim()), [answers]);

  const submit = async () => {
    if (!current || !userId || busy) return;
    setBusy(true);
    setMessage(null);
    const seconds = startedAt ? Math.min(7200, Math.floor((Date.now() - startedAt) / 1000)) : 0;
    const out = await submitAnswers(current.id, answers, seconds);
    setBusy(false);
    if (!out.ok) {
      setConfirming(false);
      setMessage(FAILURE[out.reason]);
      if (out.reason === 'invalid') setFlagged(true);
      return;
    }
    trackEvent('weekly_case_submitted', { case_id: current.id, words: totalWords(answers) });
    triggerHaptic('success');
    if (out.created) requestScoring(current.id);
    if (dKey) AsyncStorage.removeItem(dKey).catch(() => {});
    setJustSubmitted(true);
    setConfirming(false);
    await weekly.refresh();
  };

  const close = () => router.back();

  if (loading || !userId) {
    return <View style={[styles.root, styles.center]}><ActivityIndicator size="large" color={COLORS.accent} /></View>;
  }

  if (!current) {
    return (
      <View style={styles.root}>
        <Header onClose={close} />
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No case this week</Text>
          <Text style={styles.muted}>A new business problem arrives every Monday.</Text>
          <Primary label="Back to Practice" onPress={close} />
        </View>
      </View>
    );
  }

  const phase = phaseOf(current, Date.now());
  const open = phase === 'open';

  if (!done && !open) {
    return (
      <View style={styles.root}>
        <Header onClose={close} />
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>This case has closed</Text>
          <Text style={styles.muted}>A new one arrives on Monday. Answers are open for a week.</Text>
          <Primary label="Back to Practice" onPress={close} />
        </View>
      </View>
    );
  }

  const missing = blockingParts(answers, parts);
  const ready = canSubmit(answers, parts);
  const minutes = suggestedMinutes(current);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header onClose={close} right={!done && step === 'write' ? <Timer startedAt={startedAt} minutes={minutes} /> : undefined} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 140, gap: 18 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {done ? (
          <>
            <Submitted weekly={current} board={board} />
            {paid ? <View style={styles.xpChip}><Feather name="zap" size={14} color={COLORS.accent} /><Text style={styles.xpText}>{`+${WEEKLY_CASE_XP} XP banked`}</Text></View> : null}
            <TouchableOpacity onPress={() => setBriefOpen(o => !o)} accessibilityRole="button" style={styles.toggle}>
              <Text style={styles.toggleText}>{briefOpen ? 'Hide the case' : 'Read the case again'}</Text>
              <Feather name={briefOpen ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.accent} />
            </TouchableOpacity>
            {briefOpen ? <CaseBrief weekly={current} /> : null}
          </>
        ) : step === 'brief' ? (
          <>
            <View style={styles.metaRow}>
              <View style={styles.metaPill}><Feather name="clock" size={13} color={COLORS.textSecondary} /><Text style={styles.metaText}>{`About ${minutes} min`}</Text></View>
              <View style={styles.metaPill}><Feather name="calendar" size={13} color={COLORS.textSecondary} /><Text style={styles.metaText}>{`Closes in ${countdown(current.closesAt - Date.now())}`}</Text></View>
            </View>
            <CaseBrief weekly={current} />
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => setBriefOpen(o => !o)} accessibilityRole="button" style={styles.toggle}>
              <Text style={styles.toggleText}>{briefOpen ? 'Hide the case' : 'Show the case'}</Text>
              <Feather name={briefOpen ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.accent} />
            </TouchableOpacity>
            {briefOpen ? <CaseBrief weekly={current} /> : <Text style={styles.questionEcho}>{current.question}</Text>}
            {parts.map(p => (
              <PartBox key={p.id} part={p} value={answers[p.id] ?? ''} onChange={setPart(p.id)} flagged={flagged} />
            ))}
            <Text style={styles.wordCount}>{`${totalWords(answers)} words · saved on this phone`}</Text>
            {message ? <Text style={styles.error} accessibilityLiveRegion="polite">{message}</Text> : null}
          </>
        )}
      </ScrollView>

      {!done && (
        <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
          {step === 'brief' ? (
            <Primary label={hasDraft ? 'Continue writing' : 'Start writing'} onPress={startWriting} />
          ) : confirming ? (
            <View style={styles.confirm}>
              <Text style={styles.confirmTitle}>Submit your answer?</Text>
              <Text style={styles.confirmBody}>You cannot change it after. Results come {resultsDay(current.closesAt, Date.now())}.</Text>
              <View style={styles.confirmRow}>
                <View style={{ flex: 1 }}><Primary label="Keep editing" quiet onPress={() => setConfirming(false)} /></View>
                <View style={{ flex: 1 }}><Primary label={busy ? 'Submitting…' : 'Submit'} disabled={busy} onPress={submit} /></View>
              </View>
            </View>
          ) : (
            <Primary
              label={ready ? 'Review and submit' : `${missing.length} ${missing.length === 1 ? 'box' : 'boxes'} still to finish`}
              disabled={!ready}
              onPress={() => { setFlagged(true); setConfirming(true); }}
            />
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPE.h3, flex: 1, textAlign: 'center', color: COLORS.textPrimary },
  headerRight: { width: 76, alignItems: 'flex-end', paddingRight: 8 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 14, backgroundColor: COLORS.bg1 },
  timerOver: { backgroundColor: COLORS.warningSoft },
  timerText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, fontVariant: ['tabular-nums'] },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: COLORS.bg1 },
  metaText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 36 },
  toggleText: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  questionEcho: { ...TYPE.bodyBold, fontSize: 15, lineHeight: 22, color: COLORS.textPrimary, padding: 14, borderRadius: 14, backgroundColor: COLORS.accentSoft },
  fieldWrap: { gap: 5 },
  fieldLabel: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  fieldHint: { fontSize: 13, lineHeight: 18, color: COLORS.textSecondary },
  input: { minHeight: 110, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bg1, color: COLORS.textPrimary, fontSize: 15, lineHeight: 22 },
  inputFlag: { borderColor: COLORS.error },
  counter: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, alignSelf: 'flex-end' },
  wordCount: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
  error: { fontSize: 14, fontWeight: '600', color: COLORS.error, textAlign: 'center' },
  bar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, backgroundColor: COLORS.bg0 },
  primary: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, backgroundColor: COLORS.accent },
  primaryQuiet: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.accent },
  primaryDisabled: { opacity: 0.45 },
  primaryText: { fontSize: 16, fontWeight: '800', color: COLORS.textOnAccent },
  primaryQuietText: { color: COLORS.accent },
  confirm: { gap: 8 },
  confirmTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  confirmBody: { fontSize: 14, color: COLORS.textSecondary },
  confirmRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  emptyTitle: { ...TYPE.h2, color: COLORS.textPrimary, textAlign: 'center' },
  muted: { ...TYPE.body, fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  doneCard: { alignItems: 'center', gap: 8, padding: 24, borderRadius: 20, backgroundColor: COLORS.successSoft },
  doneIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg0 },
  doneTitle: { ...TYPE.h1, color: COLORS.textPrimary },
  doneBody: { ...TYPE.body, textAlign: 'center', color: COLORS.textSecondary },
  friendsCard: { gap: 10, padding: 16, borderRadius: 16, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  sectionLabel: { ...TYPE.overline, color: COLORS.textSecondary },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  friendName: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  friendCode: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 },
  xpChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: COLORS.accentSoft },
  xpText: { fontSize: 13, fontWeight: '800', color: COLORS.accent },
});
