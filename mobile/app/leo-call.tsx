/**
 * Leo call — full-screen, 3-minute spoken practice call.
 * Hold to talk → transcribe → Leo replies (spoken). Recap + Interview Brief line after.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, Pressable, Animated, ActivityIndicator,
  ScrollView, TextInput, KeyboardAvoidingView, Platform, AppState, StatusBar,
} from 'react-native';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { speakWithElevenLabs, stopAllTTS } from '../lib/tts';
import { isLeoMutedSync, loadLeoMuted } from '../lib/voicePrefs';
import { triggerHaptic } from '../lib/haptics';
import { log } from '../lib/logger';
import { useAuth } from '../hooks/useAuth';
import { useUserProgress } from '../hooks/useUserProgress';
import { useDeliverable } from '../hooks/useDeliverable';
import { useUserXP } from '../hooks/useUserXP';
import { loadInterviewTarget, type InterviewTarget } from '../lib/interviewPrep';
import { getMarketName } from '../lib/markets';
import {
  CALL_SECONDS, CALL_TYPE_LABEL, CALL_XP, advanceCallType, hasCalledToday, leoCallRecap, leoCallTurn,
  markCalledToday, nextCallType, sentenceStarter,
  type LeoCallContext, type LeoCallMessage, type LeoCallRecap, type LeoCallType,
} from '../lib/leoCall';

const LEO_VOICE_ID = 'onwK4e9ZLuTAKqWW03F9';
const POSE = {
  talking: require('../assets/mascot/leo-waving.png'),
  listening: require('../assets/mascot/leo-idle.png'),
  thinking: require('../assets/mascot/leo-thinking.png'),
};
type Pose = keyof typeof POSE;
type Phase = 'loading' | 'limit' | 'live' | 'recap' | 'error';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

async function transcribe(uri: string): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const form = new FormData();
    form.append('audio', { uri, type: 'audio/m4a', name: 'call.m4a' } as any);
    const res = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-stt`, {
      method: 'POST',
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      body: form,
    });
    if (!res.ok) return '';
    const data = await res.json();
    return String(data.text || '').trim();
  } catch {
    return '';
  }
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function LeoCallScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ marketId?: string; lessonTitle?: string; takeaway?: string; mode?: string }>();
  const marketId = params.marketId ? String(params.marketId) : undefined;
  const { user } = useAuth();
  const { progress } = useUserProgress(marketId);
  const goal = (progress as { learning_goal?: string } | null)?.learning_goal ?? null;
  const level = (progress as { familiarity_level?: string } | null)?.familiarity_level ?? null;
  const dossier = useDeliverable(marketId, goal);
  const { addXP } = useUserXP(marketId);

  const [phase, setPhase] = useState<Phase>('loading');
  const [callType, setCallType] = useState<LeoCallType>('explain');
  const [target, setTarget] = useState<InterviewTarget | null>(null);
  const [messages, setMessages] = useState<LeoCallMessage[]>([]);
  const [pose, setPose] = useState<Pose>('thinking');
  const [busy, setBusy] = useState(false); // transcribing or waiting on Leo
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [captions, setCaptions] = useState(false);
  const [helper, setHelper] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recap, setRecap] = useState<LeoCallRecap | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);
  const [briefDraft, setBriefDraft] = useState('');
  const [briefSaved, setBriefSaved] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  const recRef = useRef<Audio.Recording | null>(null);
  const messagesRef = useRef<LeoCallMessage[]>([]);
  const endingRef = useRef(false);
  const startedRef = useRef(false);
  const markedRef = useRef(false);
  const fade = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const muted = useRef(false);

  const context: LeoCallContext = useMemo(() => ({
    callType,
    lessonTitle: params.lessonTitle ? String(params.lessonTitle) : undefined,
    takeaway: params.takeaway ? String(params.takeaway) : undefined,
    goal, level,
    industry: marketId ? getMarketName(marketId) : undefined,
    target: target ? { company: target.company, role: target.role, date: target.date } : null,
    briefLines: dossier.entries.filter(e => e.source === 'learner').slice(0, 8).map(e => ({
      section: dossier.template.sections.find(s => s.key === e.sectionKey)?.title ?? e.sectionKey,
      text: e.content,
    })),
    briefSections: dossier.template.sections.map(s => ({ key: s.key, title: s.title })),
  }), [callType, params.lessonTitle, params.takeaway, goal, level, marketId, target, dossier.entries, dossier.template]);
  const contextRef = useRef(context);
  contextRef.current = context;

  const learnerTurns = messages.filter(m => m.role === 'user').length;
  const lastLeo = [...messages].reverse().find(m => m.role === 'assistant')?.content ?? '';
  const lastLearner = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';

  // Crossfade poses (static images inside an Animated.View).
  const showPose = useCallback((next: Pose) => {
    setPose(prev => {
      if (prev === next) return prev;
      fade.setValue(0.4);
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      return next;
    });
  }, [fade]);

  // Setup: daily limit, call type, target.
  useEffect(() => {
    if (!user || dossier.loading) return;
    let cancelled = false;
    (async () => {
      const [called, rotated, savedTarget, isMuted] = await Promise.all([
        hasCalledToday(user.id),
        nextCallType(user.id),
        loadInterviewTarget(user.id, marketId),
        loadLeoMuted(),
      ]);
      if (cancelled || startedRef.current) return;
      muted.current = isMuted;
      if (isMuted) setCaptions(true);
      setTarget(savedTarget);
      if (called) { setPhase('limit'); return; }
      setCallType(params.mode === 'interview' ? 'interview' : rotated);
      setPhase('live');
      Audio.requestPermissionsAsync().catch(() => {});
    })();
    return () => { cancelled = true; };
  }, [user, dossier.loading, marketId, params.mode]);

  // Timer.
  useEffect(() => {
    if (phase !== 'live') return;
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Hold button pulse while recording.
  useEffect(() => {
    if (!recording) { pulse.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 650, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [recording, pulse]);

  const finishCall = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    stopAllTTS().catch(() => {});
    if (recRef.current) { recRef.current.stopAndUnloadAsync().catch(() => {}); recRef.current = null; }
    setRecording(false); setSpeaking(false); setBusy(false);
    triggerHaptic('medium');
    const history = messagesRef.current;
    const turns = history.filter(m => m.role === 'user').length;
    setPhase('recap');
    if (turns === 0) return;
    if (user) advanceCallType(user.id);
    setRecapLoading(true);
    try {
      const { recap: r } = await leoCallRecap(contextRef.current, history);
      setRecap(r);
      if (r?.briefLine) setBriefDraft(r.briefLine);
    } catch (e) {
      log.warn('[LeoCall] recap failed', e);
    } finally {
      setRecapLoading(false);
    }
    if (turns >= 2) {
      try { await addXP(CALL_XP, 'leo_call', undefined, `Leo call · ${CALL_TYPE_LABEL[contextRef.current.callType].title}`); setXpAwarded(true); }
      catch (e) { log.warn('[LeoCall] XP failed', e); }
    }
  }, [user, addXP]);

  const speak = useCallback(async (text: string, thenEnd: boolean) => {
    showPose('talking');
    if (muted.current || isLeoMutedSync()) {
      setSpeaking(false); showPose('listening');
      if (thenEnd) setTimeout(() => finishCall(), 2200);
      return;
    }
    setSpeaking(true);
    try {
      const sound = await speakWithElevenLabs(text, LEO_VOICE_ID, 'leo_call');
      if (!sound) { setSpeaking(false); showPose('listening'); if (thenEnd) finishCall(); return; }
      sound.setOnPlaybackStatusUpdate((s: any) => {
        if (s.didJustFinish) {
          setSpeaking(false); showPose('listening');
          if (thenEnd) finishCall();
        }
      });
    } catch {
      setSpeaking(false); showPose('listening');
      if (thenEnd) finishCall();
    }
  }, [showPose, finishCall]);

  const askLeo = useCallback(async (history: LeoCallMessage[]) => {
    setBusy(true); setError(null); showPose('thinking');
    try {
      const { reply, ended } = await leoCallTurn(contextRef.current, history);
      if (endingRef.current) return;
      const next = [...history, { role: 'assistant' as const, content: reply }];
      messagesRef.current = next; setMessages(next);
      setBusy(false);
      await speak(reply, ended);
    } catch (e) {
      setBusy(false); showPose('listening');
      setError(e instanceof Error ? e.message : 'Leo couldn’t connect.');
      if (history.length === 0) setPhase('error');
    }
  }, [speak, showPose]);

  // Leo speaks first.
  useEffect(() => {
    if (phase !== 'live' || startedRef.current) return;
    startedRef.current = true;
    askLeo([]);
  }, [phase, askLeo]);

  // Leave the call cleanly if the app goes to background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => { if (s !== 'active') stopAllTTS().catch(() => {}); });
    return () => {
      sub.remove();
      stopAllTTS().catch(() => {});
      recRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  const startTalking = useCallback(async () => {
    if (phase !== 'live' || busy || recRef.current) return;
    triggerHaptic('light');
    setHelper(null);
    if (speaking) { await stopAllTTS(); setSpeaking(false); }
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) { setError('Allow the microphone in Settings to talk to Leo.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recRef.current = rec;
      setRecording(true); showPose('listening');
    } catch (e) {
      log.warn('[LeoCall] record failed', e);
    }
  }, [phase, busy, speaking, showPose]);

  const stopTalking = useCallback(async () => {
    const rec = recRef.current;
    if (!rec) return;
    recRef.current = null;
    setRecording(false);
    setBusy(true); showPose('thinking');
    try {
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }).catch(() => {});
      const uri = rec.getURI();
      const text = uri ? await transcribe(uri) : '';
      if (!text || endingRef.current) {
        setBusy(false); showPose('listening');
        if (!text) setError('I didn’t catch that. Hold the button while you talk.');
        return;
      }
      if (!markedRef.current && user) { markedRef.current = true; markCalledToday(user.id); }
      const next = [...messagesRef.current, { role: 'user' as const, content: text }];
      messagesRef.current = next; setMessages(next);
      await askLeo(next);
    } catch (e) {
      log.warn('[LeoCall] stop failed', e);
      setBusy(false); showPose('listening');
    }
  }, [askLeo, showPose, user]);

  const saveBrief = useCallback(async () => {
    const text = briefDraft.trim();
    if (!recap || text.length < 3) return;
    const ok = await dossier.addLine(recap.sectionKey || dossier.template.sections[0].key, text, undefined, 'learner');
    if (ok) { setBriefSaved(true); triggerHaptic('success'); }
  }, [briefDraft, recap, dossier]);

  const label = CALL_TYPE_LABEL[callType];
  const status = recording ? 'Listening…' : busy ? 'Leo is thinking…' : speaking ? 'Leo is talking' : 'Hold to talk';
  const overTime = elapsed >= CALL_SECONDS;

  // ── Limit ──────────────────────────────────────────────
  if (phase === 'limit') {
    return (
      <View style={[styles.dark, styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <StatusBar barStyle="light-content" />
        <Image source={require('../assets/mascot/leo-sleeping.png')} style={styles.leoSmall} resizeMode="contain" />
        <Text style={styles.limitTitle}>Next call tomorrow</Text>
        <Text style={styles.limitBody}>You’ve had today’s call with Leo. He’ll be ready again after midnight.</Text>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => router.back()}><Text style={styles.ghostText}>Back</Text></TouchableOpacity>
      </View>
    );
  }

  // ── Recap ──────────────────────────────────────────────
  if (phase === 'recap') {
    const sectionTitle = dossier.template.sections.find(s => s.key === recap?.sectionKey)?.title;
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.light}>
        <ScrollView contentContainerStyle={[styles.recapBody, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
          <Image source={POSE.talking} style={styles.leoRecap} resizeMode="contain" />
          <Text style={styles.recapTitle}>{learnerTurns ? 'Nice call.' : 'Call ended'}</Text>
          <Text style={styles.recapSub}>{learnerTurns ? `${label.title} · ${fmt(elapsed)}` : 'You didn’t say anything this time — no worries.'}</Text>

          {recapLoading && <ActivityIndicator color={COLORS.accent} style={{ marginTop: 24 }} />}
          {recap && (
            <View style={styles.recapCard}>
              <RecapRow icon="check" label="You explained well" text={recap.explainedWell} />
              <RecapRow icon="arrow-up-right" label="Next time" text={recap.nextTime} />
              {!!recap.insiderWord && <RecapRow icon="key" label="Insider word you used" text={recap.insiderWord} last />}
            </View>
          )}

          {recap?.briefLine ? (
            <View style={styles.briefCard}>
              <Text style={styles.briefEyebrow}>{`ADD TO MY ${dossier.template.title.toUpperCase()}${sectionTitle ? ` · ${sectionTitle.toUpperCase()}` : ''}`}</Text>
              <TextInput
                value={briefDraft}
                onChangeText={t => { setBriefDraft(t); setBriefSaved(false); }}
                multiline
                editable={!briefSaved}
                style={styles.briefInput}
                placeholder="Your line"
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity disabled={briefSaved || briefDraft.trim().length < 3} onPress={saveBrief} style={[styles.briefBtn, briefSaved && styles.briefBtnDone]}>
                <Text style={styles.briefBtnText}>{briefSaved ? 'Added ✓' : `Add to my ${dossier.template.title}`}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {xpAwarded && <Text style={styles.xp}>{`+${CALL_XP} XP`}</Text>}
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}><Text style={styles.primaryText}>Done</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Live / loading / error ─────────────────────────────
  return (
    <View style={[styles.dark, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.top}>
        <View>
          <Text style={styles.callType}>{label.title}</Text>
          <Text style={[styles.timer, overTime && { color: COLORS.warning }]}>{phase === 'live' ? fmt(elapsed) : ' '}</Text>
        </View>
        <TouchableOpacity
          accessibilityLabel={captions ? 'Hide captions' : 'Show captions'}
          onPress={() => { triggerHaptic('light'); setCaptions(c => !c); }}
          style={[styles.ccBtn, captions && styles.ccOn]}
        >
          <Text style={[styles.ccText, captions && { color: '#15171B' }]}>CC</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stage}>
        <Animated.View style={{ opacity: fade }}>
          <Image source={POSE[pose]} style={styles.leo} resizeMode="contain" />
        </Animated.View>
        <Text style={styles.status}>{phase === 'loading' ? 'Calling Leo…' : phase === 'error' ? 'Couldn’t reach Leo' : status}</Text>
        {captions && phase === 'live' && (
          <View style={styles.captions}>
            {!!lastLeo && <Text style={styles.capLeo}>{lastLeo}</Text>}
            {!!lastLearner && <Text style={styles.capYou}>{`You: ${lastLearner}`}</Text>}
          </View>
        )}
        {!!error && <Text style={styles.error}>{error}</Text>}
        {!!helper && <View style={styles.helper}><Text style={styles.helperText}>{helper}</Text></View>}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          accessibilityLabel="Help me"
          disabled={phase !== 'live'}
          onPress={() => { triggerHaptic('light'); setHelper(sentenceStarter(callType, learnerTurns, context.takeaway)); }}
          style={styles.sideBtn}
        >
          <Feather name="help-circle" size={20} color="#F2F4F8" />
          <Text style={styles.sideText}>Help me</Text>
        </TouchableOpacity>

        <Pressable
          accessibilityLabel="Hold to talk"
          disabled={phase !== 'live' || busy}
          onPressIn={startTalking}
          onPressOut={stopTalking}
          style={styles.talkWrap}
        >
          <Animated.View style={[styles.talkRing, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }] }]} />
          <View style={[styles.talkBtn, recording && styles.talkActive, (busy || phase !== 'live') && { opacity: 0.5 }]}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Feather name="mic" size={34} color="#FFFFFF" />}
          </View>
        </Pressable>

        <TouchableOpacity accessibilityLabel="Hang up" onPress={() => (phase === 'error' ? router.back() : finishCall())} style={styles.hangBtn}>
          <Feather name="phone-off" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RecapRow({ icon, label, text, last }: { icon: any; label: string; text: string; last?: boolean }) {
  return (
    <View style={[styles.recapRow, !last && styles.recapDivider]}>
      <Feather name={icon} size={16} color={COLORS.accent} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.recapLabel}>{label}</Text>
        <Text style={styles.recapText}>{text}</Text>
      </View>
    </View>
  );
}

const DARK = '#15171B';
const styles = StyleSheet.create({
  dark: { flex: 1, backgroundColor: DARK },
  light: { flex: 1, backgroundColor: COLORS.bg0 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 },
  callType: { color: '#AAB1BC', fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  timer: { color: '#F2F4F8', fontSize: 22, fontWeight: '800', marginTop: 2, fontVariant: ['tabular-nums'] },
  ccBtn: { minWidth: 44, height: 32, borderRadius: 8, borderWidth: 1.5, borderColor: '#7C848F', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  ccOn: { backgroundColor: '#F2F4F8', borderColor: '#F2F4F8' },
  ccText: { color: '#F2F4F8', fontWeight: '800', fontSize: 13 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  leo: { width: 260, height: 260 },
  leoSmall: { width: 160, height: 160, marginBottom: 16 },
  status: { color: '#AAB1BC', fontSize: 15, fontWeight: '600', marginTop: 12 },
  captions: { marginTop: 18, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 14, gap: 8 },
  capLeo: { color: '#F2F4F8', fontSize: 17, lineHeight: 24, fontWeight: '600' },
  capYou: { color: '#AAB1BC', fontSize: 15, lineHeight: 21 },
  error: { color: '#FCA5A5', fontSize: 14, marginTop: 12, textAlign: 'center' },
  helper: { marginTop: 14, backgroundColor: 'rgba(167,139,250,0.16)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 },
  helperText: { color: '#E9E2FF', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28 },
  sideBtn: { width: 64, alignItems: 'center', gap: 4 },
  sideText: { color: '#F2F4F8', fontSize: 12, fontWeight: '600' },
  talkWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  talkRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#A78BFA' },
  talkBtn: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  talkActive: { backgroundColor: '#7C3AED', transform: [{ scale: 1.05 }] },
  hangBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  limitTitle: { color: '#F2F4F8', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  limitBody: { color: '#AAB1BC', fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 8 },
  ghostBtn: { marginTop: 28, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14, borderWidth: 1, borderColor: '#3A3F47' },
  ghostText: { color: '#F2F4F8', fontWeight: '700', fontSize: 16 },
  recapBody: { paddingHorizontal: 22, alignItems: 'center' },
  leoRecap: { width: 120, height: 120 },
  recapTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, marginTop: 8 },
  recapSub: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  recapCard: { alignSelf: 'stretch', marginTop: 22, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg2, paddingHorizontal: 16 },
  recapRow: { flexDirection: 'row', gap: 12, paddingVertical: 14 },
  recapDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  recapLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.3 },
  recapText: { fontSize: 16, lineHeight: 22, color: COLORS.textPrimary, marginTop: 2 },
  briefCard: { alignSelf: 'stretch', marginTop: 16, borderRadius: 18, backgroundColor: COLORS.bg1, padding: 16 },
  briefEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: COLORS.accent },
  briefInput: { marginTop: 10, minHeight: 72, maxHeight: 150, fontSize: 16, lineHeight: 22, color: COLORS.textPrimary, backgroundColor: COLORS.bg0, borderRadius: 12, padding: 12, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.border },
  briefBtn: { marginTop: 12, height: 46, borderRadius: 12, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  briefBtnDone: { backgroundColor: COLORS.success },
  briefBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  xp: { marginTop: 18, fontSize: 16, fontWeight: '800', color: COLORS.accent },
  primaryBtn: { marginTop: 20, alignSelf: 'stretch', height: 54, borderRadius: 16, backgroundColor: COLORS.textPrimary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: COLORS.bg0, fontWeight: '800', fontSize: 17 },
});
