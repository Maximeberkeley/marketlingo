import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated,
  TextInput, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { COLORS, SHADOWS, TYPE } from '../lib/constants';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../lib/haptics';
import { getMarketName } from '../lib/markets';
import { speakAsSophia, transcribeAudio, buildFeedbackNarration } from '../lib/interviewVoice';
import {
  StageTracker, VibeMeter, LeoCelebration, ScoreBar, MathDrill,
} from '../components/interview/InterviewLabComponents';
import {
  InterviewPath, InterviewStage, InterviewPersona,
  MECE_FRAMEWORKS, STORY_HERO_STEPS, INTERVIEW_PERSONAS,
} from '../lib/interviewLabData';
import { useInterviewQuestions } from '../hooks/useInterviewQuestions';

const { width: SW } = Dimensions.get('window');
const MOCK_QUESTION_COUNT = 5;

export default function InterviewLabScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [market, setMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState<InterviewPath | null>(null);
  const [stage, setStage] = useState<InterviewStage>(1);
  const [persona, setPersona] = useState<InterviewPersona>('consultant');

  // Stage 3 MCQ state
  const [mcqIndex, setMcqIndex] = useState(0);
  const [mcqSelected, setMcqSelected] = useState<number | null>(null);
  const [mcqScore, setMcqScore] = useState(0);

  // Stage 4 Mock state — 5 sequential questions
  const [mockIndex, setMockIndex] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [mockSessionScores, setMockSessionScores] = useState<number[]>([]);
  const [mockSessionComplete, setMockSessionComplete] = useState(false);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [isSophiaSpeaking, setIsSophiaSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Fetch questions from Supabase
  const {
    mockQuestions, mcqQuestions, mentalMathQuestions, bigBossQuestions,
    loading: questionsLoading, heroProblem,
  } = useInterviewQuestions(market, path || 'consulting');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('selected_market').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.selected_market) setMarket(data.selected_market);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  // ─── Voice: Narrate scenario ───
  const narrateScenario = useCallback(async (text: string) => {
    if (isNarrating) return;
    setIsNarrating(true);
    triggerHaptic('light');
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }
      const sound = await speakAsSophia(text);
      soundRef.current = sound;
      if (sound) {
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) setIsNarrating(false);
        });
      } else { setIsNarrating(false); }
    } catch { setIsNarrating(false); }
  }, [isNarrating]);

  // ─── Voice: Sophia reads feedback ───
  const speakFeedback = useCallback(async (fb: any) => {
    if (isSophiaSpeaking) return;
    setIsSophiaSpeaking(true);
    triggerHaptic('light');
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }
      const narration = buildFeedbackNarration(fb);
      const sound = await speakAsSophia(narration);
      soundRef.current = sound;
      if (sound) {
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) setIsSophiaSpeaking(false);
        });
      } else { setIsSophiaSpeaking(false); }
    } catch { setIsSophiaSpeaking(false); }
  }, [isSophiaSpeaking]);

  // ─── Voice: Record user answer ───
  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
      triggerHaptic('medium');
    } catch (err) { console.warn('Recording error:', err); }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    setSubmitting(true);
    triggerHaptic('light');
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (uri) {
        const transcribed = await transcribeAudio(uri);
        if (transcribed) setUserResponse(transcribed);
      }
    } catch (err) { console.warn('Stop recording error:', err); }
    finally {
      setSubmitting(false);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    }
  }, []);

  // ─── Stop audio on unmount ───
  useEffect(() => {
    return () => {
      if (soundRef.current) { soundRef.current.stopAsync().catch(() => {}); soundRef.current.unloadAsync().catch(() => {}); }
      if (recordingRef.current) { recordingRef.current.stopAndUnloadAsync().catch(() => {}); }
    };
  }, []);

  // ─── Submit mock answer ───
  const submitMock = useCallback(async () => {
    if (!market || !user || userResponse.trim().length < 20) return;
    setSubmitting(true);
    triggerHaptic('medium');

    const current = mockQuestions[mockIndex % mockQuestions.length];

    try {
      const { data, error } = await supabase.functions.invoke('interview-feedback', {
        body: {
          userResponse,
          scenario: current.scenario,
          question: current.question,
          buzzwords: current.buzzwords,
          persona,
          marketId: market,
          path: path || 'consulting',
          questionNumber: mockIndex + 1,
          totalQuestions: Math.min(MOCK_QUESTION_COUNT, mockQuestions.length),
        },
      });

      if (error) throw error;
      setFeedback(data);

      // Track score
      const score = data?.score ?? 5;
      setMockSessionScores(prev => [...prev, score]);

      // Persist attempt
      if (path) {
        supabase.from('interview_lab_attempts').insert({
          user_id: user.id,
          market_id: market,
          path,
          stage: 4,
          attempt_type: 'mock',
          score: score * 10, // convert 1-10 to 0-100 for DB
          structure_score: (data?.communicationScore ?? 0) * 10,
          content_score: (data?.industryKnowledgeScore ?? 0) * 10,
          persona_score: (data?.personaFitScore ?? 0) * 10,
          persona,
          scenario_question: current.question,
          user_response: userResponse,
          feedback: data,
          buzzwords_used: data?.buzzwordsUsed ?? [],
          buzzwords_missed: data?.buzzwordsMissed ?? [],
        }).then(() => {});
      }

      if (score >= 8) {
        triggerHaptic('success');
        setTimeout(() => setShowCelebration(true), 500);
      } else {
        triggerHaptic('light');
      }

      setTimeout(() => speakFeedback(data), 800);
    } catch (err) {
      console.error('Mock submission error:', err);
      setFeedback({
        score: 5,
        industryKnowledgeScore: 4,
        communicationScore: 5,
        personaFitScore: 5,
        whatWentWell: 'You tried — that takes courage!',
        roomForImprovement: 'Check your connection and try again.',
        betterVersion: 'Try again when you have a stable connection.',
        buzzwordsUsed: [],
        buzzwordsMissed: [],
        sophiaSays: 'Looks like we hit a glitch. Try again!',
      });
    } finally {
      setSubmitting(false);
    }
  }, [market, user, userResponse, mockIndex, persona, path, mockQuestions, speakFeedback]);

  // ─── Move to next mock question ───
  const goToNextMockQuestion = useCallback(() => {
    const nextIndex = mockIndex + 1;
    if (nextIndex >= Math.min(MOCK_QUESTION_COUNT, mockQuestions.length)) {
      setMockSessionComplete(true);
    } else {
      setMockIndex(nextIndex);
    }
    setFeedback(null);
    setUserResponse('');
    setShowCelebration(false);
  }, [mockIndex, mockQuestions.length]);

  if (loading || questionsLoading) {
    return <View style={[st.container, st.centered]}><ActivityIndicator size="large" color={COLORS.accent} /></View>;
  }

  // ─── Path Selection ───
  if (!path) {
    return (
      <View style={st.container}>
        <LinearGradient colors={['#1E1B4B', '#312E81', '#4338CA']} style={[st.pathScreen, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
            <Feather name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={st.pathTitle}>Interview Lab</Text>
          <Text style={st.pathSubtitle}>Choose your path</Text>

          <TouchableOpacity style={st.pathCard} onPress={() => { triggerHaptic('light'); setPath('consulting'); }}>
            <LinearGradient colors={['#7C3AED', '#6D28D9']} style={st.pathGradient}>
              <View style={st.pathIconWrap}><Feather name="briefcase" size={28} color="#FDE68A" /></View>
              <Text style={st.pathCardTitle}>Path A: Future Pro</Text>
              <Text style={st.pathCardSub}>Consulting & Job Prep</Text>
              <Text style={st.pathCardDesc}>Profitability cases, market entry analysis, brain teasers, and mental math.</Text>
              <View style={st.pathTags}>
                {['Case Studies', 'Market Sizing', 'Mental Math'].map(t => (
                  <View key={t} style={st.pathTag}><Text style={st.pathTagText}>{t}</Text></View>
                ))}
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={st.pathCard} onPress={() => { triggerHaptic('light'); setPath('academic'); }}>
            <LinearGradient colors={['#4338CA', '#3730A3']} style={st.pathGradient}>
              <View style={st.pathIconWrap}><Feather name="award" size={28} color="#A5B4FC" /></View>
              <Text style={st.pathCardTitle}>Path B: Academic Star</Text>
              <Text style={st.pathCardSub}>School & Scholarship Prep</Text>
              <Text style={st.pathCardDesc}>Values alignment, impact storytelling, and the "Story Hero" method.</Text>
              <View style={st.pathTags}>
                {['Story Hero', 'Impact', 'Values'].map(t => (
                  <View key={t} style={st.pathTag}><Text style={st.pathTagText}>{t}</Text></View>
                ))}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const marketName = market ? getMarketName(market) : 'Industry';
  const currentMCQ = mcqQuestions[mcqIndex % mcqQuestions.length];
  const currentMock = mockQuestions[mockIndex % mockQuestions.length];
  const framework = MECE_FRAMEWORKS[market || ''] || MECE_FRAMEWORKS.aerospace;
  const totalMockQ = Math.min(MOCK_QUESTION_COUNT, mockQuestions.length);

  return (
    <View style={st.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={st.header}>
            <TouchableOpacity onPress={() => {
              if (stage === 1 && !feedback) { setPath(null); }
              else { setStage(Math.max(1, stage - 1) as InterviewStage); }
            }} style={st.backBtn2}>
              <Feather name="arrow-left" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={st.headerTitle}>Interview Lab</Text>
              <Text style={st.headerSub}>{marketName} • {path === 'consulting' ? 'Future Pro' : 'Academic Star'}</Text>
            </View>
            {heroProblem ? (
              <View style={st.heroProblemBadge}>
                <Text style={st.heroProblemText} numberOfLines={1}>{heroProblem}</Text>
              </View>
            ) : null}
          </View>

          <StageTracker current={stage} onTap={(s) => setStage(s)} />

          {/* ─── STAGE 1: Framework Fundamentals ─── */}
          {stage === 1 && (
            <View style={st.stageContainer}>
              <View style={st.stageHeader}>
                <Feather name="layers" size={20} color="#7C3AED" />
                <Text style={st.stageTitle}>
                  {path === 'consulting' ? 'MECE Framework' : 'Story Hero Method'}
                </Text>
              </View>

              {path === 'consulting' ? (
                <>
                  <View style={st.card}>
                    <Text style={st.cardLabel}>What is MECE?</Text>
                    <Text style={st.cardBody}>
                      <Text style={{ fontWeight: '700', color: '#7C3AED' }}>M</Text>utually{' '}
                      <Text style={{ fontWeight: '700', color: '#7C3AED' }}>E</Text>xclusive,{' '}
                      <Text style={{ fontWeight: '700', color: '#7C3AED' }}>C</Text>ollectively{' '}
                      <Text style={{ fontWeight: '700', color: '#7C3AED' }}>E</Text>xhaustive{'\n\n'}
                      Think of it like sorting your closet — every item goes in ONE category, and NO item is left out.
                    </Text>
                  </View>

                  <View style={st.card}>
                    <Text style={st.cardLabel}>{marketName} Example</Text>
                    <Text style={st.cardBody}>Problem: "{framework.label}"</Text>
                    <View style={st.branchContainer}>
                      {framework.branches.map((b, i) => (
                        <View key={i} style={st.branchItem}>
                          <View style={[st.branchDot, { backgroundColor: i === 0 ? '#10B981' : '#EF4444' }]} />
                          <Text style={st.branchText}>{b}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={st.tipBox}>
                      <Feather name="zap" size={14} color="#F59E0B" />
                      <Text style={st.tipText}>{framework.example}</Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={st.card}>
                    <Text style={st.cardLabel}>The Story Hero Method</Text>
                    <Text style={st.cardBody}>
                      Every great interview answer is a mini-story. You are the hero! Use these 4 steps to make your answer unforgettable.
                    </Text>
                  </View>
                  {STORY_HERO_STEPS.map((step) => (
                    <View key={step.letter} style={st.card}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <View style={st.heroLetterBg}>
                          <Text style={st.heroLetter}>{step.letter}</Text>
                        </View>
                        <View>
                          <Text style={st.cardLabel}>{step.label}</Text>
                          <Text style={st.cardBody}>{step.prompt}</Text>
                        </View>
                      </View>
                      <View style={st.exampleBox}>
                        <Text style={st.exampleText}>"{step.example}"</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}

              <TouchableOpacity style={st.nextBtn} onPress={() => { triggerHaptic('light'); setStage(2); }}>
                <Text style={st.nextBtnText}>Next: Expectations →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ─── STAGE 2: Expectation Guide + Mental Math ─── */}
          {stage === 2 && (
            <View style={st.stageContainer}>
              <View style={st.stageHeader}>
                <Feather name="eye" size={20} color="#3B82F6" />
                <Text style={st.stageTitle}>Top "Big Boss" Questions</Text>
              </View>
              <Text style={st.stageDesc}>These are the questions that separate good candidates from great ones in {marketName}.</Text>

              {bigBossQuestions.map((q, i) => (
                <View key={i} style={st.card}>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
                    <View style={st.questionNum}><Text style={st.questionNumText}>{i + 1}</Text></View>
                    <Text style={[st.cardBody, { flex: 1, fontWeight: '600' }]}>{q.question}</Text>
                  </View>
                  <View style={st.tipBox}>
                    <Feather name="zap" size={14} color="#F59E0B" />
                    <Text style={st.tipText}>{q.tip}</Text>
                  </View>
                </View>
              ))}

              {/* Mental Math Minute */}
              {path === 'consulting' && mentalMathQuestions.length > 0 && (
                <>
                  <View style={[st.stageHeader, { marginTop: 20 }]}>
                    <Feather name="clock" size={20} color="#EF4444" />
                    <Text style={st.stageTitle}>Mental Math Minute</Text>
                  </View>
                  {mentalMathQuestions.map((q, i) => (
                    <MathDrill key={i} question={q} />
                  ))}
                </>
              )}

              <TouchableOpacity style={st.nextBtn} onPress={() => { triggerHaptic('light'); setStage(3); setMcqIndex(0); setMcqSelected(null); setMcqScore(0); }}>
                <Text style={st.nextBtnText}>Next: Practice MCQs →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ─── STAGE 3: MCQ Practice ─── */}
          {stage === 3 && mcqQuestions.length > 0 && (
            <View style={st.stageContainer}>
              <View style={st.stageHeader}>
                <Feather name="check-circle" size={20} color="#10B981" />
                <Text style={st.stageTitle}>{path === 'consulting' ? 'Case Practice' : 'Values & Impact'}</Text>
              </View>
              <Text style={st.stageDesc}>Question {mcqIndex + 1} of {mcqQuestions.length}</Text>

              <View style={st.card}>
                <Text style={[st.cardBody, { fontWeight: '600', marginBottom: 14 }]}>{currentMCQ.question}</Text>
                {currentMCQ.options.map((opt, i) => {
                  const selected = mcqSelected === i;
                  const correct = i === currentMCQ.correctIndex;
                  const revealed = mcqSelected !== null;
                  return (
                    <TouchableOpacity
                      key={i}
                      disabled={revealed}
                      onPress={() => {
                        setMcqSelected(i);
                        const isCorrect = i === currentMCQ.correctIndex;
                        triggerHaptic(isCorrect ? 'success' : 'error');
                        if (isCorrect) setMcqScore(s => s + 1);
                        if (user && market && path) {
                          supabase.from('interview_lab_attempts').insert({
                            user_id: user.id, market_id: market, path,
                            stage: 3, attempt_type: 'mcq',
                            score: isCorrect ? 100 : 0,
                            scenario_question: currentMCQ.question,
                          }).then(() => {});
                        }
                      }}
                      style={[
                        st.mcqOption,
                        selected && !correct && st.mcqOptionWrong,
                        revealed && correct && st.mcqOptionCorrect,
                      ]}
                    >
                      <Text style={[st.mcqOptionText, revealed && correct && { color: '#059669' }]}>{opt}</Text>
                      {revealed && correct && <Feather name="check" size={16} color="#059669" />}
                      {selected && !correct && <Feather name="x" size={16} color="#EF4444" />}
                    </TouchableOpacity>
                  );
                })}
                {mcqSelected !== null && (
                  <View style={st.explanationBox}>
                    <Text style={st.explanationText}>{currentMCQ.explanation}</Text>
                  </View>
                )}
              </View>

              {mcqSelected !== null && (
                <TouchableOpacity
                  style={st.nextBtn}
                  onPress={() => {
                    triggerHaptic('light');
                    if (mcqIndex < mcqQuestions.length - 1) {
                      setMcqIndex(i => i + 1);
                      setMcqSelected(null);
                    } else {
                      setStage(4);
                      setMockIndex(0);
                      setMockSessionScores([]);
                      setMockSessionComplete(false);
                      setFeedback(null);
                      setUserResponse('');
                    }
                  }}
                >
                  <Text style={st.nextBtnText}>
                    {mcqIndex < mcqQuestions.length - 1 ? 'Next Question →' : 'Go to Mock Lab →'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ─── STAGE 4: Mock Lab with Sophia — 5 Sequential Questions ─── */}
          {stage === 4 && !mockSessionComplete && (
            <View style={st.stageContainer}>
              <View style={st.stageHeader}>
                <Feather name="mic" size={20} color="#8B5CF6" />
                <Text style={st.stageTitle}>Mock Interview</Text>
                <View style={st.mockProgress}>
                  <Text style={st.mockProgressText}>{mockIndex + 1}/{totalMockQ}</Text>
                </View>
              </View>

              {/* Mock Progress Dots */}
              <View style={st.mockDotsRow}>
                {Array.from({ length: totalMockQ }).map((_, i) => (
                  <View key={i} style={[
                    st.mockDot,
                    i < mockIndex && st.mockDotDone,
                    i === mockIndex && st.mockDotActive,
                    i > mockIndex && st.mockDotPending,
                  ]}>
                    {i < mockIndex && mockSessionScores[i] !== undefined && (
                      <Text style={st.mockDotScore}>{mockSessionScores[i]}</Text>
                    )}
                    {i === mockIndex && <Feather name="mic" size={10} color="#FFF" />}
                  </View>
                ))}
              </View>

              {/* Persona Selector — only before first question */}
              {mockIndex === 0 && !feedback && (
                <View style={st.card}>
                  <Text style={st.cardLabel}>Choose Your Interviewer</Text>
                  <View style={st.personaRow}>
                    {(Object.entries(INTERVIEW_PERSONAS) as [InterviewPersona, typeof INTERVIEW_PERSONAS[InterviewPersona]][]).map(([key, p]) => (
                      <TouchableOpacity
                        key={key}
                        onPress={() => { setPersona(key); triggerHaptic('light'); }}
                        style={[st.personaBtn, persona === key && { borderColor: p.color, backgroundColor: `${p.color}15` }]}
                      >
                        <View style={[st.personaIconWrap, { backgroundColor: persona === key ? p.color : COLORS.bg1 }]}>
                          <Feather name={p.icon as any} size={20} color={persona === key ? '#FFF' : COLORS.textMuted} />
                        </View>
                        <Text style={[st.personaLabel, persona === key && { color: p.color }]}>{p.label}</Text>
                        <Text style={st.personaDesc}>{p.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Scenario Card */}
              <View style={st.card}>
                <View style={st.sophiaHeader}>
                  <View style={st.sophiaAvatar}><Feather name="mic" size={20} color="#7C3AED" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.sophiaName}>Sophia Hernandez</Text>
                    <Text style={st.sophiaRole}>{INTERVIEW_PERSONAS[persona]?.label || 'Interview Coach'}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => narrateScenario(`${currentMock.scenario} ... ${currentMock.question}`)}
                    style={[st.voiceBtn, isNarrating && st.voiceBtnActive]}
                  >
                    <Feather name={isNarrating ? 'volume-2' : 'volume-1'} size={18} color={isNarrating ? '#FFF' : '#7C3AED'} />
                  </TouchableOpacity>
                </View>
                <View style={st.scenarioBox}>
                  <Text style={st.scenarioText}>{currentMock.scenario}</Text>
                </View>
                <Text style={[st.cardBody, { fontWeight: '700', marginTop: 10 }]}>{currentMock.question}</Text>
              </View>

              {/* Response Input */}
              {!feedback && (
                <>
                  <View style={st.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={st.cardLabel}>Your Response</Text>
                      <TouchableOpacity
                        onPress={() => { setVoiceMode(!voiceMode); triggerHaptic('light'); }}
                        style={[st.voiceToggle, voiceMode && st.voiceToggleActive]}
                      >
                        <Feather name={voiceMode ? 'mic' : 'edit-3'} size={14} color={voiceMode ? '#FFF' : '#7C3AED'} />
                        <Text style={[st.voiceToggleText, voiceMode && { color: '#FFF' }]}>
                          {voiceMode ? 'Voice' : 'Text'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {voiceMode ? (
                      <View style={st.voiceRecordArea}>
                        {isRecording ? (
                          <>
                            <Animated.View style={st.recordingPulse}>
                              <TouchableOpacity onPress={stopRecording} style={st.stopRecordBtn}>
                                <Feather name="square" size={24} color="#FFF" />
                              </TouchableOpacity>
                            </Animated.View>
                            <Text style={st.recordingLabel}>Recording... Tap to stop</Text>
                          </>
                        ) : (
                          <>
                            <TouchableOpacity onPress={startRecording} style={st.startRecordBtn}>
                              <Feather name="mic" size={28} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={st.recordingLabel}>Tap to speak your answer</Text>
                            {userResponse.length > 0 && (
                              <View style={st.transcriptPreview}>
                                <Text style={st.transcriptLabel}>Transcription:</Text>
                                <Text style={st.transcriptText}>{userResponse}</Text>
                              </View>
                            )}
                          </>
                        )}
                      </View>
                    ) : (
                      <TextInput
                        style={st.responseInput}
                        multiline
                        placeholder="Type your answer here... Start with 'First, I would...' for a structured approach."
                        placeholderTextColor={COLORS.textMuted}
                        value={userResponse}
                        onChangeText={setUserResponse}
                        textAlignVertical="top"
                      />
                    )}
                    <VibeMeter text={userResponse} />
                  </View>
                  <TouchableOpacity
                    style={[st.submitBtn, userResponse.trim().length < 20 && st.submitBtnDisabled]}
                    disabled={submitting || userResponse.trim().length < 20}
                    onPress={submitMock}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={st.submitBtnText}>Submit to Sophia →</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* ─── NEW FEEDBACK UI: Score/10, What Went Well, Improvement ─── */}
              {feedback && (
                <View style={st.feedbackContainer}>
                  {/* Score Circle — out of 10 */}
                  <View style={st.scoreCard}>
                    <View style={st.scoreCircle}>
                      <Text style={st.scoreNum}>{feedback.score ?? 5}</Text>
                      <Text style={st.scoreSlash}>/10</Text>
                    </View>
                    <View style={st.scoreBreakdown}>
                      <ScoreBar label="Industry" value={(feedback.industryKnowledgeScore ?? 0) * 10} color="#7C3AED" />
                      <ScoreBar label="Comms" value={(feedback.communicationScore ?? 0) * 10} color="#3B82F6" />
                      <ScoreBar label="Persona" value={(feedback.personaFitScore ?? 0) * 10} color="#F59E0B" />
                    </View>
                  </View>

                  {/* Sophia Says */}
                  <View style={st.card}>
                    <View style={st.sophiaHeader}>
                      <View style={st.sophiaAvatar}><Feather name="mic" size={18} color="#7C3AED" /></View>
                      <Text style={[st.sophiaQuote, { flex: 1 }]}>{feedback.sophiaSays}</Text>
                      <TouchableOpacity
                        onPress={() => speakFeedback(feedback)}
                        style={[st.voiceBtn, isSophiaSpeaking && st.voiceBtnActive]}
                      >
                        <Feather name={isSophiaSpeaking ? 'volume-2' : 'volume-1'} size={16} color={isSophiaSpeaking ? '#FFF' : '#7C3AED'} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* What Went Well */}
                  <View style={[st.card, { borderLeftColor: '#10B981', borderLeftWidth: 3 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Feather name="check-circle" size={16} color="#10B981" />
                      <Text style={[st.feedbackHeading, { color: '#10B981' }]}>What Went Well</Text>
                    </View>
                    <Text style={st.feedbackBody}>{feedback.whatWentWell}</Text>
                  </View>

                  {/* Room for Improvement */}
                  <View style={[st.card, { borderLeftColor: '#F59E0B', borderLeftWidth: 3 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Feather name="arrow-up-circle" size={16} color="#F59E0B" />
                      <Text style={[st.feedbackHeading, { color: '#F59E0B' }]}>Room for Improvement</Text>
                    </View>
                    <Text style={st.feedbackBody}>{feedback.roomForImprovement}</Text>
                  </View>

                  {/* Better Version — Pro Rewrite */}
                  <View style={[st.card, { borderLeftColor: '#7C3AED', borderLeftWidth: 3 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Feather name="edit-3" size={16} color="#7C3AED" />
                      <Text style={[st.feedbackHeading, { color: '#7C3AED' }]}>Pro Version</Text>
                    </View>
                    <Text style={st.trySayingText}>"{feedback.betterVersion}"</Text>
                  </View>

                  {/* Buzzwords */}
                  {((feedback.buzzwordsUsed?.length > 0) || (feedback.buzzwordsMissed?.length > 0)) && (
                    <View style={st.card}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Feather name="zap" size={16} color="#8B5CF6" />
                        <Text style={st.feedbackHeading}>Industry Buzz Detector</Text>
                      </View>
                      {feedback.buzzwordsUsed?.length > 0 && (
                        <View style={st.buzzRow}>
                          <Text style={st.buzzLabel}>Used</Text>
                          <View style={st.buzzTags}>
                            {feedback.buzzwordsUsed.map((w: string) => (
                              <View key={w} style={st.buzzTagGood}><Text style={st.buzzTagText}>{w}</Text></View>
                            ))}
                          </View>
                        </View>
                      )}
                      {feedback.buzzwordsMissed?.length > 0 && (
                        <View style={st.buzzRow}>
                          <Text style={st.buzzLabel}>Missed</Text>
                          <View style={st.buzzTags}>
                            {feedback.buzzwordsMissed.map((w: string) => (
                              <View key={w} style={st.buzzTagMiss}><Text style={st.buzzTagTextMiss}>{w}</Text></View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Next Question / Try Again */}
                  <View style={st.feedbackActions}>
                    <TouchableOpacity
                      style={st.retryBtn}
                      onPress={() => { setFeedback(null); setUserResponse(''); setShowCelebration(false); }}
                    >
                      <Feather name="rotate-ccw" size={16} color="#7C3AED" />
                      <Text style={st.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={st.nextBtn} onPress={goToNextMockQuestion}>
                      <Text style={st.nextBtnText}>
                        {mockIndex + 1 >= totalMockQ ? 'Finish Interview →' : `Question ${mockIndex + 2} →`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ─── SESSION COMPLETE SUMMARY ─── */}
          {stage === 4 && mockSessionComplete && (
            <View style={st.stageContainer}>
              <View style={st.sessionCompleteCard}>
                <Feather name="award" size={40} color="#FDE68A" />
                <Text style={st.sessionCompleteTitle}>Mock Interview Complete!</Text>
                <Text style={st.sessionCompleteSubtitle}>{marketName} • {INTERVIEW_PERSONAS[persona]?.label}</Text>

                <View style={st.sessionScoresGrid}>
                  {mockSessionScores.map((s, i) => (
                    <View key={i} style={st.sessionScoreItem}>
                      <Text style={st.sessionScoreLabel}>Q{i + 1}</Text>
                      <Text style={[st.sessionScoreValue, { color: s >= 7 ? '#10B981' : s >= 5 ? '#F59E0B' : '#EF4444' }]}>{s}/10</Text>
                    </View>
                  ))}
                </View>

                <View style={st.sessionAvgWrap}>
                  <Text style={st.sessionAvgLabel}>Average Score</Text>
                  <Text style={st.sessionAvgValue}>
                    {(mockSessionScores.reduce((a, b) => a + b, 0) / mockSessionScores.length).toFixed(1)}/10
                  </Text>
                </View>

                <View style={st.sessionActions}>
                  <TouchableOpacity
                    style={st.retryBtn}
                    onPress={() => {
                      setMockIndex(0);
                      setMockSessionScores([]);
                      setMockSessionComplete(false);
                      setFeedback(null);
                      setUserResponse('');
                    }}
                  >
                    <Feather name="rotate-ccw" size={16} color="#7C3AED" />
                    <Text style={st.retryBtnText}>Try Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={st.nextBtn} onPress={() => router.back()}>
                    <Text style={st.nextBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <LeoCelebration visible={showCelebration} score={(feedback?.score ?? 5) * 10} onDismiss={() => setShowCelebration(false)} />
    </View>
  );
}


// ─── Styles ───
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },

  // Path selection
  pathScreen: { flex: 1, paddingHorizontal: 20 },
  backBtn: { marginBottom: 20, marginTop: 8, width: 40 },
  pathTitle: { ...TYPE.hero, color: '#FFF', fontSize: 32 },
  pathSubtitle: { ...TYPE.body, color: 'rgba(255,255,255,0.7)', marginBottom: 28 },
  pathCard: { marginBottom: 16, borderRadius: 20, overflow: 'hidden', ...SHADOWS.lg },
  pathGradient: { padding: 24, borderRadius: 20 },
  pathIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  pathCardTitle: { ...TYPE.h1, color: '#FFF', marginBottom: 2 },
  pathCardSub: { ...TYPE.caption, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  pathCardDesc: { ...TYPE.body, color: 'rgba(255,255,255,0.85)', lineHeight: 20, marginBottom: 14 },
  pathTags: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pathTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  pathTagText: { ...TYPE.caption, color: '#FFF', fontSize: 10 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8, gap: 12 },
  backBtn2: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TYPE.h2, color: COLORS.textPrimary },
  headerSub: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 11 },
  heroProblemBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(124,58,237,0.1)', maxWidth: 120 },
  heroProblemText: { ...TYPE.caption, color: '#7C3AED', fontSize: 9 },

  // Stages
  stageContainer: { paddingHorizontal: 20 },
  stageHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  stageTitle: { ...TYPE.h2, color: COLORS.textPrimary, fontSize: 18 },
  stageDesc: { ...TYPE.body, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 20 },

  // Cards
  card: { backgroundColor: COLORS.bg2, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardLabel: { ...TYPE.bodyBold, color: COLORS.textPrimary, marginBottom: 6 },
  cardBody: { ...TYPE.body, color: COLORS.textSecondary, lineHeight: 22 },

  // Framework
  branchContainer: { marginTop: 14, gap: 10 },
  branchItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  branchDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  branchText: { ...TYPE.body, color: COLORS.textPrimary, flex: 1, lineHeight: 20 },
  tipBox: { flexDirection: 'row', gap: 8, marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.08)' },
  tipText: { ...TYPE.caption, color: '#D97706', flex: 1, lineHeight: 18 },

  // Hero Steps
  heroLetterBg: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  heroLetter: { ...TYPE.h1, color: '#FFF', fontSize: 18 },
  exampleBox: { padding: 12, borderRadius: 10, backgroundColor: 'rgba(124,58,237,0.06)', marginTop: 8 },
  exampleText: { ...TYPE.body, color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 20 },

  // Question numbers
  questionNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  questionNumText: { ...TYPE.bodyBold, color: '#FFF', fontSize: 12 },

  // MCQ
  mcqOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 8 },
  mcqOptionCorrect: { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.06)' },
  mcqOptionWrong: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.06)' },
  mcqOptionText: { ...TYPE.body, color: COLORS.textPrimary, flex: 1, lineHeight: 20 },
  explanationBox: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.06)' },
  explanationText: { ...TYPE.body, color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },

  // Mock Progress Dots
  mockProgress: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(124,58,237,0.15)' },
  mockProgressText: { ...TYPE.bodyBold, color: '#7C3AED', fontSize: 12 },
  mockDotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  mockDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.border },
  mockDotDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  mockDotActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  mockDotPending: { backgroundColor: COLORS.bg1 },
  mockDotScore: { ...TYPE.caption, color: '#FFF', fontSize: 10, fontWeight: '700' },

  // Persona Selector
  personaRow: { gap: 10 },
  personaBtn: { padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 8 },
  personaIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  personaLabel: { ...TYPE.bodyBold, color: COLORS.textPrimary, marginBottom: 2 },
  personaDesc: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 11 },

  // Sophia
  sophiaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sophiaAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(124,58,237,0.12)', alignItems: 'center', justifyContent: 'center' },
  sophiaName: { ...TYPE.bodyBold, color: COLORS.textPrimary },
  sophiaRole: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 11 },
  sophiaQuote: { ...TYPE.body, color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 20 },
  scenarioBox: { padding: 14, borderRadius: 12, backgroundColor: COLORS.bg1, marginBottom: 6 },
  scenarioText: { ...TYPE.body, color: COLORS.textSecondary, lineHeight: 22 },

  // Voice
  voiceBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(124,58,237,0.12)', alignItems: 'center', justifyContent: 'center' },
  voiceBtnActive: { backgroundColor: '#7C3AED' },
  voiceToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#7C3AED' },
  voiceToggleActive: { backgroundColor: '#7C3AED' },
  voiceToggleText: { ...TYPE.caption, color: '#7C3AED', fontSize: 11, fontWeight: '600' },
  voiceRecordArea: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  startRecordBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', ...SHADOWS.md },
  stopRecordBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  recordingPulse: { borderRadius: 40, borderWidth: 3, borderColor: 'rgba(239,68,68,0.3)', padding: 4 },
  recordingLabel: { ...TYPE.caption, color: COLORS.textMuted },
  transcriptPreview: { width: '100%', padding: 12, borderRadius: 10, backgroundColor: COLORS.bg1, marginTop: 8 },
  transcriptLabel: { ...TYPE.caption, color: COLORS.textMuted, marginBottom: 4 },
  transcriptText: { ...TYPE.body, color: COLORS.textPrimary, lineHeight: 20 },

  // Input
  responseInput: { ...TYPE.body, color: COLORS.textPrimary, minHeight: 120, padding: 14, borderRadius: 12, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, lineHeight: 22, marginBottom: 8 },

  // Buttons
  nextBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', marginTop: 8 },
  nextBtnText: { ...TYPE.bodyBold, color: '#FFF' },
  submitBtn: { paddingVertical: 16, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', marginBottom: 8, ...SHADOWS.md },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { ...TYPE.bodyBold, color: '#FFF', fontSize: 16 },

  // Feedback
  feedbackContainer: { gap: 0 },
  scoreCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12, padding: 18, borderRadius: 16, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border },
  scoreCircle: { alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(124,58,237,0.12)' },
  scoreNum: { fontSize: 28, fontWeight: '900', color: '#7C3AED' },
  scoreSlash: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 12 },
  scoreBreakdown: { flex: 1, gap: 6 },

  feedbackHeading: { ...TYPE.bodyBold, color: COLORS.textPrimary, fontSize: 14 },
  feedbackBody: { ...TYPE.body, color: COLORS.textSecondary, lineHeight: 22 },
  feedbackBullet: { ...TYPE.body, color: COLORS.textSecondary, lineHeight: 22, paddingLeft: 4 },
  trySayingText: { ...TYPE.body, color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 22 },

  // Buzzwords
  buzzRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  buzzLabel: { ...TYPE.caption, color: COLORS.textMuted, width: 40, marginTop: 4, fontSize: 10 },
  buzzTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  buzzTagGood: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(16,185,129,0.12)' },
  buzzTagText: { ...TYPE.caption, color: '#059669', fontSize: 11 },
  buzzTagMiss: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(239,68,68,0.08)' },
  buzzTagTextMiss: { ...TYPE.caption, color: '#DC2626', fontSize: 11 },

  // Actions
  feedbackActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  retryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#7C3AED' },
  retryBtnText: { ...TYPE.bodyBold, color: '#7C3AED' },

  // Session Complete
  sessionCompleteCard: { alignItems: 'center', padding: 28, borderRadius: 20, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border },
  sessionCompleteTitle: { ...TYPE.h1, color: COLORS.textPrimary, fontSize: 22, marginTop: 16, textAlign: 'center' },
  sessionCompleteSubtitle: { ...TYPE.caption, color: COLORS.textMuted, marginBottom: 20 },
  sessionScoresGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  sessionScoreItem: { alignItems: 'center', gap: 4 },
  sessionScoreLabel: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 11 },
  sessionScoreValue: { ...TYPE.h2, fontSize: 18 },
  sessionAvgWrap: { alignItems: 'center', marginBottom: 24, padding: 16, borderRadius: 14, backgroundColor: COLORS.bg1, width: '100%' },
  sessionAvgLabel: { ...TYPE.caption, color: COLORS.textMuted, marginBottom: 4 },
  sessionAvgValue: { ...TYPE.hero, color: '#7C3AED', fontSize: 32 },
  sessionActions: { flexDirection: 'row', gap: 12, width: '100%' },
});
