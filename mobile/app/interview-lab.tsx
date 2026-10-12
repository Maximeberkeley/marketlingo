import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../lib/constants';
import { useSelectedMarket } from '../hooks/useSelectedMarket';
import { useInterviewQuestions } from '../hooks/useInterviewQuestions';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../lib/analytics';
import { useUserXP } from '../hooks/useUserXP';
import { usePracticeRewards } from '../hooks/usePracticeRewards';
import { useCollectibles } from '../hooks/useCollectibles';
import { supabase } from '../lib/supabase';
import { getMarketName } from '../lib/markets';
import { getMarketWorld } from '../data/marketWorlds';
import { InterviewPath, InterviewPersona, INTERVIEW_PERSONAS, MECE_FRAMEWORKS, STORY_HERO_STEPS, trackMocks } from '../lib/interviewLabData';
import { speakAsLeo, transcribeAudio } from '../lib/interviewVoice';
import { triggerHaptic } from '../lib/haptics';
import { log } from '../lib/logger';
import { useInterviewReadiness } from '../hooks/useInterviewReadiness';
import { InterviewHome } from '../components/interview/InterviewHome';
import { personaForTrack, roleTrack } from '../lib/interviewPrep';

const LEO = require('../assets/mascot/leo-idle.png');
type Stage = 'brief' | 'framework' | 'pressure' | 'response' | 'verdict';
type Feedback = {
  score?: number; industryKnowledgeScore?: number; communicationScore?: number;
  personaFitScore?: number; whatWentWell?: string; roomForImprovement?: string;
  betterVersion?: string; leoSays?: string; sophiaSays?: string; buzzwordsUsed?: string[]; buzzwordsMissed?: string[];
};
const STAGES: { key: Stage; label: string }[] = [
  { key: 'brief', label: 'Brief' }, { key: 'framework', label: 'Frame' },
  { key: 'pressure', label: 'Pressure' }, { key: 'response', label: 'Answer' },
  { key: 'verdict', label: 'Verdict' },
];
const short = (value?: string, max = 155) => {
  const clean = (value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 70))}…`;
};

export default function InterviewLabScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  React.useEffect(() => { trackEvent('interview_practice_started', {}); }, []);
  const { marketId, loading: marketLoading } = useSelectedMarket();
  const world = getMarketWorld(marketId);
  const marketName = getMarketName(marketId);
  const [path, setPath] = useState<InterviewPath | null>(null);
  const [persona, setPersona] = useState<InterviewPersona>('consultant');
  const [stage, setStage] = useState<Stage>('brief');
  const [pressureChoice, setPressureChoice] = useState<number | null>(null);
  const [pressureCorrect, setPressureCorrect] = useState(false);
  const [response, setResponse] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [banked, setBanked] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const questions = useInterviewQuestions(marketId, path || 'consulting');
  const readiness = useInterviewReadiness(marketId);
  const track = readiness.target ? roleTrack(readiness.target.role) : null;
  const { addXP } = useUserXP(marketId);
  const { recordCaseRun } = usePracticeRewards();
  const { evaluateRewards } = useCollectibles(marketId);

  const [mockIdx, setMockIdx] = useState(0);
  const [pressureIdx, setPressureIdx] = useState(0);
  const usedMock = useRef<Set<number>>(new Set());
  const usedPressure = useRef<Set<number>>(new Set());
  const pickUnused = (size: number, used: Set<number>): number => {
    if (size <= 0) return 0;
    if (used.size >= size) used.clear();
    const open: number[] = [];
    for (let i = 0; i < size; i++) if (!used.has(i)) open.push(i);
    const pick = open[Math.floor(Math.random() * open.length)];
    used.add(pick);
    return pick;
  };
  // Technical and behavioral roles use their own bank first; never consulting cases or
  // mental math unless the role is genuinely a case track. No saved target = join_industry
  // default: technical + behavioral bank.
  const mockPool = useMemo(() => {
    if (path !== 'consulting') return questions.mockQuestions;
    if (track === null) {
      const bank = [...trackMocks(marketId, 'technical'), ...trackMocks(marketId, 'behavioral')];
      return bank.length ? bank : questions.mockQuestions;
    }
    const bank = trackMocks(marketId, track);
    if (track === 'technical') {
      const fit = questions.mockQuestions.filter(m => /certif|technical|system|standard|regulat|engineer|architect|safety|spec/i.test(`${m.scenario} ${m.question}`));
      return bank.length || fit.length ? [...bank, ...fit] : questions.mockQuestions;
    }
    return bank.length ? bank : questions.mockQuestions;
  }, [path, track, marketId, questions.mockQuestions]);
  const allowMath = path === 'consulting' && track === 'case';
  const pressurePoolSize = allowMath && questions.mentalMathQuestions.length ? questions.mentalMathQuestions.length : questions.mcqQuestions.length;
  const rollQuestions = useCallback(() => {
    setMockIdx(pickUnused(mockPool.length, usedMock.current));
    setPressureIdx(pickUnused(pressurePoolSize, usedPressure.current));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockPool, pressurePoolSize]);
  useEffect(() => { usedMock.current.clear(); usedPressure.current.clear(); rollQuestions(); }, [rollQuestions, path]);
  const poolMock = mockPool[mockIdx] || mockPool[0];
  // The question shown on the home card is the question that opens on tap — locked at start.
  const [lockedMock, setLockedMock] = useState<typeof poolMock | null>(null);
  const mock = lockedMock || poolMock;
  // Steps count from the stage the run actually started on (direct starts skip Brief/Frame).
  const [startStage, setStartStage] = useState<Stage>('brief');
  const pressure = useMemo(() => {
    if (allowMath && questions.mentalMathQuestions.length) return questions.mentalMathQuestions[pressureIdx % questions.mentalMathQuestions.length];
    return questions.mcqQuestions.length ? questions.mcqQuestions[pressureIdx % questions.mcqQuestions.length] : undefined;
  }, [allowMath, pressureIdx, questions.mentalMathQuestions, questions.mcqQuestions]);
  const framework = MECE_FRAMEWORKS[marketId] || MECE_FRAMEWORKS.aerospace;
  const stageIndex = Math.max(0, STAGES.findIndex(item => item.key === stage));
  const startIndex = Math.max(0, STAGES.findIndex(item => item.key === startStage));
  const visibleStages = STAGES.slice(startIndex);
  const visibleIndex = Math.max(0, stageIndex - startIndex);

  useEffect(() => () => {
    soundRef.current?.unloadAsync().catch(() => {});
    recordingRef.current?.stopAndUnloadAsync().catch(() => {});
  }, []);

  const next = (target: Stage) => { triggerHaptic('light'); setStage(target); };
  const choosePressure = (index: number) => {
    if (!pressure || pressureChoice !== null) return;
    setPressureChoice(index);
    setPressureCorrect(index === pressure.correctIndex);
    triggerHaptic(index === pressure.correctIndex ? 'success' : 'error');
  };
  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const created = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = created.recording;
      setRecording(true);
    } catch (error) { log.warn('[Interview] Recording failed:', error); }
  }, []);
  const stopRecording = useCallback(async () => {
    const active = recordingRef.current;
    if (!active) return;
    setRecording(false);
    setSubmitting(true);
    try {
      await active.stopAndUnloadAsync();
      const uri = active.getURI();
      recordingRef.current = null;
      if (uri) setResponse(await transcribeAudio(uri));
    } catch (error) { log.warn('[Interview] Transcription failed:', error); }
    finally { setSubmitting(false); await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); }
  }, []);
  const playCoach = async (text?: string) => {
    if (!text || speaking) return;
    setSpeaking(true);
    try {
      const sound = await speakAsLeo(text);
      soundRef.current = sound;
      sound?.setOnPlaybackStatusUpdate(status => {
        if ('didJustFinish' in status && status.didJustFinish) setSpeaking(false);
      });
      if (!sound) setSpeaking(false);
    } catch { setSpeaking(false); }
  };
  const submit = async () => {
    if (!user || !mock || response.trim().length < 20) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('interview-feedback', {
        body: { userResponse: response, scenario: mock.scenario, question: mock.question, buzzwords: mock.buzzwords, persona, marketId, path },
      });
      if (error) throw error;
      const result = data as Feedback;
      trackEvent('interview_feedback_received', { score: Math.round((result.score || 5) * 10) });
      setFeedback(result);
      setStage('verdict');
      const score = Math.round((result.score || 5) * 10);
      await supabase.from('interview_lab_attempts').insert({
        user_id: user.id, market_id: marketId, path, stage: 4, attempt_type: 'mock', score,
        structure_score: (result.communicationScore || 0) * 10,
        content_score: (result.industryKnowledgeScore || 0) * 10,
        persona_score: (result.personaFitScore || 0) * 10,
        persona, scenario_question: mock.question, user_response: response, feedback: result,
        buzzwords_used: result.buzzwordsUsed || [], buzzwords_missed: result.buzzwordsMissed || [],
      });
    } catch (error) {
      log.warn('[Interview] Feedback failed:', error);
      setFeedback({ score: 5, leoSays: 'The connection flinched. Your answer still counts as a rep.', whatWentWell: 'You committed to an answer.', roomForImprovement: 'Try again for a full review.', betterVersion: 'Lead with your answer, then prove it.' });
      setStage('verdict');
    } finally { setSubmitting(false); }
  };
  const bankResult = async () => {
    if (banked) { router.back(); return; }
    setBanked(true);
    const score = Math.round((feedback?.score || 5) * 10);
    const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'D';
    const xp = score >= 90 ? 90 : score >= 75 ? 70 : score >= 60 ? 45 : 25;
    try {
      await Promise.all([
        addXP(xp, 'interview_lab', mock?.id, `Interview mission graded ${grade}`),
        recordCaseRun(grade),
        evaluateRewards('interview_lab', `interview:${mock?.id || Date.now()}`, score / 100),
      ]);
    } catch (error) { log.warn('[Interview] Reward banking failed:', error); }
    router.back();
  };

  if (marketLoading || questions.loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.accent} /></View>;
  if (!path) return (
    <InterviewHome
      userId={user?.id}
      marketId={marketId}
      readiness={readiness}
      nextQuestion={mock?.question}
      topInset={insets.top}
      bottomInset={insets.bottom}
      onClose={() => router.back()}
      onOpenBrief={() => router.push('/deliverable' as any)}
      onWarmUp={() => router.push({ pathname: '/leo-call', params: { marketId: marketId ?? '', mode: 'interview' } } as any)}
      onStart={(question?: string) => {
        setPersona(personaForTrack(track));
        if (question && question !== poolMock?.question) {
          setLockedMock({ id: `card-${Date.now()}`, scenario: target?.company ? `${target.company} interview` : 'Mock interview', question, buzzwords: [], sampleAnswer: '' } as any);
        } else if (poolMock) {
          setLockedMock(poolMock);
        }
        setStartStage('response'); setPath('consulting'); setStage('response');
      }}
      onSchool={() => { setPersona('recruiter'); setStartStage('brief'); setPath('academic'); setStage('brief'); }}
    />
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.close}><Feather name="x" size={22} color={COLORS.textPrimary} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={styles.headerTitle}>{marketName} Interview</Text><Text style={styles.headerSub}>{INTERVIEW_PERSONAS[persona].label}</Text></View>
        <Image source={LEO} style={styles.leoSmall} resizeMode="contain" />
      </View>
      <View style={styles.rail}>{STAGES.map((item, index) => <View key={item.key} style={[styles.railSegment, { backgroundColor: index <= stageIndex ? world.colors[0] : COLORS.border }]} />)}</View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.stageLabel, { color: world.colors[0] }]}>{STAGES[stageIndex].label.toUpperCase()} · {stageIndex + 1}/5</Text>

        {stage === 'brief' && <>
          <Text style={styles.title}>Pick your interviewer.</Text><Text style={styles.subtitle}>Your coach changes what a strong answer sounds like.</Text>
          <View style={styles.personas}>{(Object.entries(INTERVIEW_PERSONAS) as [InterviewPersona, typeof INTERVIEW_PERSONAS[InterviewPersona]][]).map(([key, item]) => (
            <TouchableOpacity key={key} onPress={() => setPersona(key)} style={[styles.persona, persona === key && { borderColor: item.color, backgroundColor: `${item.color}10` }]}>
              <Feather name={item.icon as keyof typeof Feather.glyphMap} size={19} color={item.color} />
              <View style={{ flex: 1 }}><Text style={styles.personaTitle}>{item.label}</Text><Text style={styles.personaText}>{short(item.description, 58)}</Text></View>
              {persona === key && <Feather name="check-circle" size={18} color={item.color} />}
            </TouchableOpacity>
          ))}</View>
          <Coach text="I’ll listen for structure, evidence, and whether you actually answered the question." onSpeak={() => playCoach('I will listen for structure, evidence, and whether you actually answered the question.')} speaking={speaking} />
          <Action label="Build my framework" color={world.colors[0]} onPress={() => next('framework')} />
        </>}

        {stage === 'framework' && <>
          <Text style={styles.title}>{path === 'consulting' ? 'Build the frame.' : 'Build the story.'}</Text>
          {path === 'consulting' ? <>
            <View style={styles.prompt}><Text style={styles.promptLabel}>THE PROBLEM</Text><Text style={styles.promptText}>{short(framework.label, 120)}</Text></View>
            {framework.branches.slice(0, 3).map((branch, index) => <View key={branch} style={styles.frameworkRow}><Text style={[styles.frameworkNumber, { color: world.colors[index % 3] }]}>{index + 1}</Text><Text style={styles.frameworkText}>{short(branch, 92)}</Text></View>)}
          </> : STORY_HERO_STEPS.map((item, index) => <View key={item.letter} style={styles.frameworkRow}><Text style={[styles.frameworkNumber, { color: world.colors[index % 3] }]}>{item.letter}</Text><View style={{ flex: 1 }}><Text style={styles.frameworkText}>{item.label}</Text><Text style={styles.personaText}>{item.prompt}</Text></View></View>)}
          <Coach text={path === 'consulting' ? 'Split the problem into parts that don\'t overlap.' : 'Keep the setup short. Spend most time on what you did.'} />
          <Action label="Enter pressure round" color={world.colors[0]} onPress={() => next('pressure')} />
        </>}

        {stage === 'pressure' && pressure && <>
          <Text style={styles.title}>No warm-up. Make the call.</Text><Text style={styles.subtitle}>{path === 'consulting' && questions.mentalMathQuestions.length ? 'Mental math under pressure.' : 'One choice. No essay.'}</Text>
          <View style={styles.prompt}><Text style={styles.promptText}>{short(pressure.question, 170)}</Text></View>
          <View style={styles.options}>{pressure.options.map((option, index) => {
            const revealed = pressureChoice !== null; const correct = index === pressure.correctIndex; const picked = index === pressureChoice;
            return <TouchableOpacity key={`${option}-${index}`} disabled={revealed} onPress={() => choosePressure(index)} style={[styles.option, revealed && correct && styles.correct, revealed && picked && !correct && styles.wrong]}><Text style={styles.optionLetter}>{String.fromCharCode(65 + index)}</Text><Text style={styles.optionText}>{short(option, 90)}</Text></TouchableOpacity>;
          })}</View>
          {pressureChoice !== null && <><View style={[styles.feedback, { backgroundColor: pressureCorrect ? COLORS.successSoft : COLORS.errorSoft }]}><Text style={styles.feedbackTitle}>{pressureCorrect ? 'Correct.' : 'Not quite. Here\'s why:'}</Text><Text style={styles.feedbackText}>{short(pressure.explanation, 155)}</Text></View><Action label="Answer the question" color={world.colors[0]} onPress={() => next('response')} /></>}
        </>}

        {stage === 'response' && mock && <>
          <Text style={styles.title}>Answer out loud—or type.</Text>
          <View style={styles.prompt}><Text style={styles.promptLabel}>{short(mock.scenario, 95)}</Text><Text style={styles.promptText}>{short(mock.question, 180)}</Text></View>
          <TextInput value={response} onChangeText={setResponse} multiline maxLength={1200} style={styles.input} placeholder="Lead with your answer. Then prove it." placeholderTextColor={COLORS.textMuted} />
          <View style={styles.responseActions}>
            <TouchableOpacity onPress={recording ? stopRecording : startRecording} style={[styles.record, recording && styles.recording]}><Feather name={recording ? 'square' : 'mic'} size={18} color={recording ? COLORS.bg0 : world.colors[0]} /><Text style={[styles.recordText, recording && { color: COLORS.bg0 }]}>{recording ? 'Stop' : 'Record'}</Text></TouchableOpacity>
            <Text style={styles.count}>{response.trim().split(/\s+/).filter(Boolean).length} words</Text>
          </View>
          <Action label={submitting ? 'Leo is grading…' : 'Lock answer'} color={world.colors[0]} disabled={submitting || response.trim().length < 20} onPress={submit} />
        </>}

        {stage === 'verdict' && feedback && <>
          <LinearGradient colors={[scoreColor(feedback.score), world.colors[1]]} style={styles.verdict}>
            <Text style={styles.verdictLabel}>INTERVIEW VERDICT</Text><Text style={styles.verdictScore}>{Math.round((feedback.score || 5) * 10)}</Text><Text style={styles.verdictGrade}>{gradeLabel(feedback.score)}</Text>
          </LinearGradient>
          <Coach text={feedback.leoSays || feedback.sophiaSays || 'The structure is forming. Make every sentence earn its place.'} onSpeak={() => playCoach(feedback.leoSays || feedback.sophiaSays)} speaking={speaking} />
          <Debrief icon="check-circle" title="Keep" body={feedback.whatWentWell} color={COLORS.success} />
          <Debrief icon="target" title="Fix next" body={feedback.roomForImprovement} color={COLORS.warning} />
          <Debrief icon="zap" title="Sharper version" body={feedback.betterVersion} color={world.colors[0]} />
          {mock && mock.buzzwords.length > 0 && <View style={styles.debrief}><Feather name="book-open" size={19} color={world.colors[0]} /><View style={{ flex: 1 }}><Text style={[styles.debriefTitle, { color: world.colors[0] }]}>Words a pro would use</Text><View style={[styles.keywordRow, { marginTop: 6 }]}>{mock.buzzwords.slice(0, 6).map(word => <View key={word} style={styles.keyword}><Text style={styles.keywordText}>{word}</Text></View>)}</View></View></View>}
          <Action label="Bank result" color={world.colors[0]} onPress={bankResult} />
          <TouchableOpacity onPress={() => { setFeedback(null); setResponse(''); setPressureChoice(null); setPressureCorrect(false); rollQuestions(); setStage('brief'); }} style={styles.retry}><Text style={styles.retryText}>Run another mission</Text></TouchableOpacity>
        </>}
      </ScrollView>
    </View>
  );
}

function Coach({ text, onSpeak, speaking }: { text: string; onSpeak?: () => void; speaking?: boolean }) { return <View style={styles.coach}><Image source={LEO} style={styles.coachAvatar} resizeMode="contain" /><Text style={styles.coachText}>{text}</Text>{onSpeak && <TouchableOpacity onPress={onSpeak}><Feather name={speaking ? 'volume-2' : 'volume-1'} size={18} color={COLORS.accent} /></TouchableOpacity>}</View>; }
function Action({ label, color, onPress, disabled }: { label: string; color: string; onPress: () => void; disabled?: boolean }) { return <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.action, { backgroundColor: color }, disabled && styles.disabled]}><Text style={styles.actionText}>{label}</Text><Feather name="arrow-right" size={18} color={COLORS.bg0} /></TouchableOpacity>; }
function Debrief({ icon, title, body, color }: { icon: keyof typeof Feather.glyphMap; title: string; body: string; color: string }) { return <View style={styles.debrief}><Feather name={icon} size={19} color={color} /><View style={{ flex: 1 }}><Text style={[styles.debriefTitle, { color }]}>{title}</Text><Text style={styles.debriefBody}>{body || 'No note this round.'}</Text></View></View>; }
const scoreColor = (score = 5) => score >= 8 ? '#16A34A' : score >= 6 ? '#F59E0B' : '#EF4444';
const gradeLabel = (score = 5) => score >= 9 ? 'Offer-ready' : score >= 7.5 ? 'Strong signal' : score >= 6 ? 'Promising' : 'Needs another rep';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg0 },
  pathHero: { height: 335, paddingHorizontal: 22, paddingBottom: 28, justifyContent: 'flex-end', overflow: 'hidden' }, close: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  pathBody: { padding: 18, gap: 12 }, pathCard: { flexDirection: 'row', alignItems: 'center', minHeight: 92, padding: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, gap: 14, backgroundColor: COLORS.bg2 }, pathIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, pathTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary }, pathSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }, smallPrint: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 },
  warmUp: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.accent, backgroundColor: COLORS.bg2, marginBottom: 12 }, warmUpLeo: { width: 48, height: 48 }, warmUpTitle: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 16 }, warmUpSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  header: { height: 58, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }, headerTitle: { color: COLORS.textPrimary, fontWeight: '900', fontSize: 15 }, headerSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 1 }, leoSmall: { width: 40, height: 40, marginRight: 6 }, rail: { flexDirection: 'row', gap: 4, paddingHorizontal: 16 }, railSegment: { flex: 1, height: 5, borderRadius: 3 },
  scroll: { padding: 20, gap: 14 }, stageLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1 }, title: { color: COLORS.textPrimary, fontSize: 27, lineHeight: 32, fontWeight: '900' }, subtitle: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 21 },
  personas: { gap: 10 }, persona: { minHeight: 72, borderRadius: 15, borderWidth: 2, borderColor: COLORS.border, padding: 13, flexDirection: 'row', gap: 12, alignItems: 'center' }, personaTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary }, personaText: { fontSize: 12, lineHeight: 17, color: COLORS.textSecondary, marginTop: 2 },
  coach: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 15, backgroundColor: COLORS.accentSoft }, coachAvatar: { width: 44, height: 44 }, coachText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600', color: COLORS.textPrimary },
  prompt: { padding: 18, borderRadius: 16, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border }, promptLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '900', letterSpacing: 1, marginBottom: 7 }, promptText: { fontSize: 19, lineHeight: 25, color: COLORS.textPrimary, fontWeight: '800' },
  frameworkRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border }, frameworkNumber: { width: 28, fontSize: 22, fontWeight: '900', textAlign: 'center' }, frameworkText: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '700', color: COLORS.textPrimary },
  options: { gap: 9 }, option: { minHeight: 60, padding: 12, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 11 }, optionLetter: { width: 28, height: 28, textAlign: 'center', textAlignVertical: 'center', borderRadius: 8, backgroundColor: COLORS.bg1, color: COLORS.textSecondary, fontWeight: '900' }, optionText: { flex: 1, color: COLORS.textPrimary, fontSize: 14, lineHeight: 19, fontWeight: '600' }, correct: { borderColor: COLORS.success, backgroundColor: COLORS.successSoft }, wrong: { borderColor: COLORS.error, backgroundColor: COLORS.errorSoft },
  feedback: { padding: 14, borderRadius: 14 }, feedbackTitle: { fontSize: 15, fontWeight: '900', color: COLORS.textPrimary }, feedbackText: { fontSize: 13, lineHeight: 18, color: COLORS.textSecondary, marginTop: 4 },
  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, keyword: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: COLORS.accentSoft }, keywordText: { fontSize: 11, color: COLORS.accentDark, fontWeight: '800' }, input: { minHeight: 150, borderRadius: 16, borderWidth: 2, borderColor: COLORS.border, padding: 16, fontSize: 16, lineHeight: 23, color: COLORS.textPrimary, textAlignVertical: 'top' }, responseActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, record: { height: 42, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 7 }, recording: { backgroundColor: COLORS.error, borderColor: COLORS.error }, recordText: { color: COLORS.textPrimary, fontWeight: '800' }, count: { color: COLORS.textMuted, fontSize: 12 },
  action: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 4 }, actionText: { color: COLORS.bg0, fontSize: 16, fontWeight: '900' }, disabled: { opacity: 0.4 },
  verdict: { minHeight: 210, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, verdictLabel: { color: COLORS.bg0, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 }, verdictScore: { color: COLORS.bg0, fontSize: 72, lineHeight: 78, fontWeight: '900' }, verdictGrade: { color: COLORS.bg0, fontSize: 16, fontWeight: '800' },
  debrief: { flexDirection: 'row', gap: 12, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border }, debriefTitle: { fontSize: 13, fontWeight: '900' }, debriefBody: { fontSize: 14, lineHeight: 19, color: COLORS.textPrimary, marginTop: 3 }, retry: { alignItems: 'center', paddingVertical: 12 }, retryText: { color: COLORS.textSecondary, fontWeight: '800' },
});
