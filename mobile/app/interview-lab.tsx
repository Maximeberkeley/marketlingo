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
  InterviewPath, InterviewStage, ConfidencePersona,
  MECE_FRAMEWORKS, BIG_BOSS_QUESTIONS, STORY_HERO_STEPS,
  CONFIDENCE_PERSONAS, getMCQForMarket, getMockPromptsForMarket,
  getMentalMathForMarket, getAcademicQuestionsForMarket,
} from '../lib/interviewLabData';

const { width: SW } = Dimensions.get('window');


export default function InterviewLabScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [market, setMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState<InterviewPath | null>(null);
  const [stage, setStage] = useState<InterviewStage>(1);
  const [persona, setPersona] = useState<ConfidencePersona>('humble_leader');

  // Stage 3 MCQ state
  const [mcqIndex, setMcqIndex] = useState(0);
  const [mcqSelected, setMcqSelected] = useState<number | null>(null);
  const [mcqScore, setMcqScore] = useState(0);

  // Stage 4 Mock state
  const [mockIndex, setMockIndex] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [isSophiaSpeaking, setIsSophiaSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false); // toggle voice vs text input
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  // Issue #12: Handle market fetch failure
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('selected_market').eq('id', user.id).single()
      .then(({ data, error }) => {
        if (error) {
          console.warn('Failed to fetch market:', error);
        }
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
      // Stop any existing playback
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }
      const sound = await speakAsSophia(text);
      soundRef.current = sound;
      if (sound) {
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) {
            setIsNarrating(false);
          }
        });
      } else {
        setIsNarrating(false);
      }
    } catch {
      setIsNarrating(false);
    }
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
          if ('didJustFinish' in status && status.didJustFinish) {
            setIsSophiaSpeaking(false);
          }
        });
      } else {
        setIsSophiaSpeaking(false);
      }
    } catch {
      setIsSophiaSpeaking(false);
    }
  }, [isSophiaSpeaking]);

  // ─── Voice: Record user answer ───
  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      triggerHaptic('medium');
    } catch (err) {
      console.warn('Recording error:', err);
    }
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
        if (transcribed) {
          setUserResponse(transcribed);
        }
      }
    } catch (err) {
      console.warn('Stop recording error:', err);
    } finally {
      setSubmitting(false);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    }
  }, []);

  // ─── Stop audio on unmount ───
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const submitMock = useCallback(async () => {
    if (!market || !user || userResponse.trim().length < 20) return;
    setSubmitting(true);
    triggerHaptic('medium');

    const prompts = getMockPromptsForMarket(market);
    const current = prompts[mockIndex % prompts.length];

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
        },
      });

      if (error) throw error;
      setFeedback(data);

      // Issue #11: Persist mock attempt to database
      if (path) {
        supabase.from('interview_lab_attempts').insert({
          user_id: user.id,
          market_id: market,
          path,
          stage: 4,
          attempt_type: 'mock',
          score: data?.score ?? 0,
          structure_score: data?.structureScore,
          content_score: data?.contentScore,
          persona_score: data?.personaScore,
          persona,
          scenario_question: current.question,
          user_response: userResponse,
          feedback: data,
          buzzwords_used: data?.buzzwordsUsed ?? [],
          buzzwords_missed: data?.buzzwordsMissed ?? [],
        }).then(() => {});
      }

      if (data?.score >= 80) {
        triggerHaptic('success');
        setTimeout(() => setShowCelebration(true), 500);
      } else {
        triggerHaptic('light');
      }

      // Auto-narrate feedback with Sophia's voice
      setTimeout(() => speakFeedback(data), 800);
    } catch (err) {
      console.error('Mock submission error:', err);
      setFeedback({
        score: 0,
        awesome: ['You tried!'],
        missing: ['Could not analyze — check your connection'],
        trySaying: 'Try again when you have a stable connection.',
        buzzwordsUsed: [],
        buzzwordsMissed: [],
        sophiaSays: 'Looks like we hit a glitch! Try again? 💪',
      });
    } finally {
      setSubmitting(false);
    }
  }, [market, user, userResponse, mockIndex, persona, path, speakFeedback]);

  if (loading) {
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
  const mcqs = path === 'consulting' ? getMCQForMarket(market || '') : getAcademicQuestionsForMarket(market || '');
  const currentMCQ = mcqs[mcqIndex % mcqs.length];
  const mockPrompts = getMockPromptsForMarket(market || '');
  const currentMock = mockPrompts[mockIndex % mockPrompts.length];
  const framework = MECE_FRAMEWORKS[market || ''] || MECE_FRAMEWORKS.aerospace;
  const bigBoss = BIG_BOSS_QUESTIONS[market || ''] || BIG_BOSS_QUESTIONS.aerospace;
  const mentalMath = getMentalMathForMarket(market || '');

  return (
    <View style={st.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={st.header}>
            <TouchableOpacity onPress={() => { if (stage === 1 && !feedback) { setPath(null); } else { setStage(Math.max(1, stage - 1) as InterviewStage); }}} style={st.backBtn2}>
              <Feather name="arrow-left" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={st.headerTitle}>Interview Lab</Text>
              <Text style={st.headerSub}>{marketName} • {path === 'consulting' ? 'Future Pro' : 'Academic Star'}</Text>
            </View>
          </View>

          {/* Stage Tracker */}
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
                    <Text style={st.cardLabel}>🎯 {marketName} Example</Text>
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
                    <Text style={st.cardLabel}>🦸 The Story Hero Method</Text>
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

          {/* ─── STAGE 2: Expectation Guide ─── */}
          {stage === 2 && (
            <View style={st.stageContainer}>
              <View style={st.stageHeader}>
                <Feather name="eye" size={20} color="#3B82F6" />
                <Text style={st.stageTitle}>Top 5 "Big Boss" Questions</Text>
              </View>
              <Text style={st.stageDesc}>These are the questions that separate good candidates from great ones in {marketName}.</Text>

              {bigBoss.map((q, i) => (
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
              {path === 'consulting' && mentalMath.length > 0 && (
                <>
                  <View style={[st.stageHeader, { marginTop: 20 }]}>
                    <Feather name="clock" size={20} color="#EF4444" />
                    <Text style={st.stageTitle}>🧮 Mental Math Minute</Text>
                  </View>
                  {mentalMath.map((q, i) => (
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
          {stage === 3 && (
            <View style={st.stageContainer}>
              <View style={st.stageHeader}>
                <Feather name="check-circle" size={20} color="#10B981" />
                <Text style={st.stageTitle}>{path === 'consulting' ? 'Case Practice' : 'Values & Impact'}</Text>
              </View>
              <Text style={st.stageDesc}>Question {mcqIndex + 1} of {mcqs.length}</Text>

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
                        // Issue #10: Persist MCQ attempt
                        if (user && market && path) {
                          supabase.from('interview_lab_attempts').insert({
                            user_id: user.id,
                            market_id: market,
                            path,
                            stage: 3,
                            attempt_type: 'mcq',
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
                    if (mcqIndex < mcqs.length - 1) {
                      setMcqIndex(i => i + 1);
                      setMcqSelected(null);
                    } else {
                      setStage(4);
                    }
                  }}
                >
                  <Text style={st.nextBtnText}>
                    {mcqIndex < mcqs.length - 1 ? 'Next Question →' : 'Go to Mock Lab →'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ─── STAGE 4: Mock Lab with Sophia ─── */}
          {stage === 4 && (
            <View style={st.stageContainer}>
              <View style={st.stageHeader}>
                <Feather name="mic" size={20} color="#8B5CF6" />
                <Text style={st.stageTitle}>Mock Lab with Sophia</Text>
              </View>

              {/* Confidence Persona Toggle */}
              {!feedback && (
                <View style={st.card}>
                  <Text style={st.cardLabel}>Choose Your Persona</Text>
                  <View style={st.personaRow}>
                    {(Object.entries(CONFIDENCE_PERSONAS) as [ConfidencePersona, typeof CONFIDENCE_PERSONAS[ConfidencePersona]][]).map(([key, p]) => (
                      <TouchableOpacity
                        key={key}
                        onPress={() => { setPersona(key); triggerHaptic('light'); }}
                        style={[st.personaBtn, persona === key && st.personaBtnActive]}
                      >
                        <Text style={st.personaEmoji}>{p.emoji}</Text>
                        <Text style={[st.personaLabel, persona === key && st.personaLabelActive]}>{p.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Scenario */}
              <View style={st.card}>
                <View style={st.sophiaHeader}>
                  <View style={st.sophiaAvatar}><Text style={{ fontSize: 20 }}>👩‍💼</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.sophiaName}>Sophia Hernández</Text>
                    <Text style={st.sophiaRole}>Case Interview Coach</Text>
                  </View>
                  {/* Narrate scenario button */}
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
                      {/* Voice/Text toggle */}
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
                      /* Voice Recording Mode */
                      <View style={st.voiceRecordArea}>
                        {isRecording ? (
                          <>
                            <Animated.View style={st.recordingPulse}>
                              <TouchableOpacity onPress={stopRecording} style={st.stopRecordBtn}>
                                <Feather name="square" size={24} color="#FFF" />
                              </TouchableOpacity>
                            </Animated.View>
                            <Text style={st.recordingLabel}>🔴 Recording... Tap to stop</Text>
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
                      /* Text Input Mode */
                      <>
                        <TextInput
                          style={st.responseInput}
                          multiline
                          placeholder="Type your answer here... Start with 'First, I would...' for a structured approach."
                          placeholderTextColor={COLORS.textMuted}
                          value={userResponse}
                          onChangeText={setUserResponse}
                          textAlignVertical="top"
                        />
                      </>
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

              {/* Feedback */}
              {feedback && (
                <View style={st.feedbackContainer}>
                  {/* Score */}
                  <View style={st.scoreCard}>
                    <View style={st.scoreCircle}>
                      <Text style={st.scoreNum}>{feedback.score ?? 0}</Text>
                      <Text style={st.scoreSlash}>/100</Text>
                    </View>
                    <View style={st.scoreBreakdown}>
                      <ScoreBar label="Structure" value={feedback.structureScore ?? 0} color="#7C3AED" />
                      <ScoreBar label="Content" value={feedback.contentScore ?? 0} color="#3B82F6" />
                      <ScoreBar label="Persona" value={feedback.personaScore ?? 0} color="#F59E0B" />
                    </View>
                  </View>

                  {/* Sophia Says */}
                  <View style={st.card}>
                    <View style={st.sophiaHeader}>
                      <View style={st.sophiaAvatar}><Text style={{ fontSize: 20 }}>👩‍💼</Text></View>
                      <Text style={[st.sophiaQuote, { flex: 1 }]}>{feedback.sophiaSays}</Text>
                      <TouchableOpacity
                        onPress={() => speakFeedback(feedback)}
                        style={[st.voiceBtn, isSophiaSpeaking && st.voiceBtnActive]}
                      >
                        <Feather name={isSophiaSpeaking ? 'volume-2' : 'volume-1'} size={16} color={isSophiaSpeaking ? '#FFF' : '#7C3AED'} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Awesome */}
                  <View style={[st.card, { borderLeftColor: '#10B981', borderLeftWidth: 3 }]}>
                    <Text style={st.feedbackHeading}>✅ What Was Awesome</Text>
                    {(feedback.awesome || []).map((b: string, i: number) => (
                      <Text key={i} style={st.feedbackBullet}>• {b}</Text>
                    ))}
                  </View>

                  {/* Missing */}
                  <View style={[st.card, { borderLeftColor: '#F59E0B', borderLeftWidth: 3 }]}>
                    <Text style={st.feedbackHeading}>⚡ What Was Missing</Text>
                    {(feedback.missing || []).map((b: string, i: number) => (
                      <Text key={i} style={st.feedbackBullet}>• {b}</Text>
                    ))}
                  </View>

                  {/* Try Saying */}
                  <View style={[st.card, { borderLeftColor: '#7C3AED', borderLeftWidth: 3 }]}>
                    <Text style={st.feedbackHeading}>💡 Try Saying This Instead</Text>
                    <Text style={st.trySayingText}>"{feedback.trySaying}"</Text>
                  </View>

                  {/* Buzzwords */}
                  {((feedback.buzzwordsUsed?.length > 0) || (feedback.buzzwordsMissed?.length > 0)) && (
                    <View style={st.card}>
                      <Text style={st.feedbackHeading}>🔑 Buzzword Detector</Text>
                      {feedback.buzzwordsUsed?.length > 0 && (
                        <View style={st.buzzRow}>
                          <Text style={st.buzzLabel}>Used ✅</Text>
                          <View style={st.buzzTags}>
                            {feedback.buzzwordsUsed.map((w: string) => (
                              <View key={w} style={st.buzzTagGood}><Text style={st.buzzTagText}>{w}</Text></View>
                            ))}
                          </View>
                        </View>
                      )}
                      {feedback.buzzwordsMissed?.length > 0 && (
                        <View style={st.buzzRow}>
                          <Text style={st.buzzLabel}>Missed 🎯</Text>
                          <View style={st.buzzTags}>
                            {feedback.buzzwordsMissed.map((w: string) => (
                              <View key={w} style={st.buzzTagMiss}><Text style={st.buzzTagTextMiss}>{w}</Text></View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Try Again / Next */}
                  <View style={st.feedbackActions}>
                    <TouchableOpacity
                      style={st.retryBtn}
                      onPress={() => { setFeedback(null); setUserResponse(''); setShowCelebration(false); }}
                    >
                      <Feather name="rotate-ccw" size={16} color="#7C3AED" />
                      <Text style={st.retryBtnText}>Try Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={st.nextBtn}
                      onPress={() => {
                        setFeedback(null);
                        setUserResponse('');
                        setMockIndex(i => i + 1);
                        setShowCelebration(false);
                      }}
                    >
                      <Text style={st.nextBtnText}>Next Scenario →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <LeoCelebration visible={showCelebration} score={feedback?.score ?? 0} onDismiss={() => setShowCelebration(false)} />
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

  // Stage Tracker
  trackerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, marginBottom: 20, gap: 0 },
  trackerDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bg2, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  trackerDotActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  trackerDotDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  trackerLine: { flex: 1, height: 2, backgroundColor: COLORS.border },
  trackerLineActive: { backgroundColor: '#7C3AED' },

  // Stage content
  stageContainer: { paddingHorizontal: 20 },
  stageHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  stageTitle: { ...TYPE.h2, color: COLORS.textPrimary, fontSize: 18 },
  stageDesc: { ...TYPE.body, color: COLORS.textMuted, marginBottom: 16 },

  // Cards
  card: { backgroundColor: COLORS.bg2, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardLabel: { ...TYPE.bodyBold, color: COLORS.textPrimary, marginBottom: 6 },
  cardBody: { ...TYPE.body, color: COLORS.textSecondary, lineHeight: 22 },

  // MECE branches
  branchContainer: { marginTop: 12, gap: 8 },
  branchItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  branchDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  branchText: { ...TYPE.body, color: COLORS.textPrimary, flex: 1 },

  // Tips
  tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: 'rgba(245, 158, 11, 0.08)' },
  tipText: { ...TYPE.body, color: COLORS.textSecondary, flex: 1, fontSize: 13, fontStyle: 'italic' },

  // Story Hero
  heroLetterBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  heroLetter: { fontSize: 20, fontWeight: '800', color: '#7C3AED' },
  exampleBox: { padding: 10, borderRadius: 8, backgroundColor: 'rgba(139, 92, 246, 0.06)' },
  exampleText: { ...TYPE.body, fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },

  // Big Boss
  questionNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  questionNumText: { fontWeight: '800', color: '#7C3AED', fontSize: 13 },

  // MCQ
  mcqOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 8 },
  mcqOptionCorrect: { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.06)' },
  mcqOptionWrong: { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.06)' },
  mcqOptionText: { ...TYPE.body, color: COLORS.textPrimary, flex: 1, paddingRight: 8 },
  explanationBox: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.06)' },
  explanationText: { ...TYPE.body, color: COLORS.textSecondary, fontSize: 13, marginTop: 8 },

  // Mental Math
  mathOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, minWidth: '40%' },
  mathOptionText: { ...TYPE.bodyBold, color: COLORS.textPrimary, textAlign: 'center' },

  // Next button
  nextBtn: { backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8, marginBottom: 4 },
  nextBtnText: { ...TYPE.bodyBold, color: '#FFF', fontSize: 15 },

  // Sophia & Mock
  sophiaHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  sophiaAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  sophiaName: { ...TYPE.bodyBold, color: COLORS.textPrimary },
  sophiaRole: { ...TYPE.caption, color: COLORS.textMuted },
  sophiaQuote: { ...TYPE.body, color: COLORS.textSecondary, flex: 1, fontStyle: 'italic' },
  scenarioBox: { padding: 14, borderRadius: 12, backgroundColor: 'rgba(139, 92, 246, 0.06)', marginBottom: 4 },
  scenarioText: { ...TYPE.body, color: COLORS.textSecondary, lineHeight: 22 },

  // Persona toggle
  personaRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  personaBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  personaBtnActive: { borderColor: '#7C3AED', backgroundColor: 'rgba(139, 92, 246, 0.06)' },
  personaEmoji: { fontSize: 24, marginBottom: 4 },
  personaLabel: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 10, textAlign: 'center' },
  personaLabelActive: { color: '#7C3AED' },

  // Response input
  responseInput: { minHeight: 160, ...TYPE.body, color: COLORS.textPrimary, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bg1, textAlignVertical: 'top', marginBottom: 8 },

  // Vibe meter
  vibeMeter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vibeTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.bg1, overflow: 'hidden' },
  vibeFill: { height: '100%', borderRadius: 3 },
  vibeLabel: { ...TYPE.caption, fontSize: 10, fontWeight: '700', width: 80, textAlign: 'right' },

  // Submit
  submitBtn: { backgroundColor: '#7C3AED', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { ...TYPE.bodyBold, color: '#FFF', fontSize: 15 },

  // Feedback
  feedbackContainer: { marginTop: 8 },
  scoreCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.bg2, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 28, fontWeight: '900', color: '#7C3AED' },
  scoreSlash: { fontSize: 12, color: COLORS.textMuted },
  scoreBreakdown: { flex: 1, gap: 6 },
  scoreBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreBarLabel: { ...TYPE.caption, color: COLORS.textMuted, width: 60, fontSize: 10 },
  scoreBarTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.bg1, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 3 },
  scoreBarVal: { ...TYPE.caption, color: COLORS.textMuted, width: 24, textAlign: 'right', fontSize: 10 },

  feedbackHeading: { ...TYPE.bodyBold, color: COLORS.textPrimary, marginBottom: 8 },
  feedbackBullet: { ...TYPE.body, color: COLORS.textSecondary, marginBottom: 4, paddingLeft: 4 },
  trySayingText: { ...TYPE.body, color: '#7C3AED', fontStyle: 'italic', lineHeight: 22 },

  // Buzzwords
  buzzRow: { marginTop: 8 },
  buzzLabel: { ...TYPE.caption, color: COLORS.textMuted, marginBottom: 6 },
  buzzTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  buzzTagGood: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  buzzTagText: { ...TYPE.caption, color: '#059669', fontSize: 11 },
  buzzTagMiss: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  buzzTagTextMiss: { ...TYPE.caption, color: '#D97706', fontSize: 11 },

  // Feedback actions
  feedbackActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  retryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#7C3AED' },
  retryBtnText: { ...TYPE.bodyBold, color: '#7C3AED' },

  // Leo celebration
  celebrationOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  celebrationContent: { alignItems: 'center', padding: 32 },
  celebrationScore: { fontSize: 56, fontWeight: '900', color: '#FDE68A', marginTop: 16 },
  celebrationTitle: { ...TYPE.h1, color: '#FFF', fontSize: 24, marginTop: 8 },
  celebrationSub: { ...TYPE.body, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  celebrationBtn: { marginTop: 24, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14, backgroundColor: '#7C3AED' },
  celebrationBtnText: { ...TYPE.bodyBold, color: '#FFF' },

  // Voice controls
  voiceBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(139, 92, 246, 0.1)', alignItems: 'center', justifyContent: 'center' },
  voiceBtnActive: { backgroundColor: '#7C3AED' },
  voiceToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#7C3AED' },
  voiceToggleActive: { backgroundColor: '#7C3AED' },
  voiceToggleText: { ...TYPE.caption, color: '#7C3AED', fontSize: 11, fontWeight: '700' },
  voiceRecordArea: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  startRecordBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', ...SHADOWS.accent },
  stopRecordBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', ...SHADOWS.accent },
  recordingPulse: { borderRadius: 40, borderWidth: 3, borderColor: 'rgba(239, 68, 68, 0.3)', padding: 4 },
  recordingLabel: { ...TYPE.body, color: COLORS.textMuted, fontSize: 13 },
  transcriptPreview: { width: '100%', marginTop: 8, padding: 12, borderRadius: 10, backgroundColor: COLORS.bg1 },
  transcriptLabel: { ...TYPE.caption, color: COLORS.textMuted, marginBottom: 4 },
  transcriptText: { ...TYPE.body, color: COLORS.textPrimary, lineHeight: 20 },
});
