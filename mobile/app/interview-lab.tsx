import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated,
  TextInput, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform,
  Image,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMarketName } from '../lib/markets';
import { speakAsSophia, transcribeAudio, buildFeedbackNarration } from '../lib/interviewVoice';
import {
  VibeMeter, ScoreBar, MathDrill,
} from '../components/interview/InterviewLabComponents';
import {
  InterviewPath, InterviewStage, InterviewPersona,
  MECE_FRAMEWORKS, STORY_HERO_STEPS, INTERVIEW_PERSONAS,
} from '../lib/interviewLabData';
import { useInterviewQuestions } from '../hooks/useInterviewQuestions';
import { MentalMathTab } from '../components/interview/MentalMathTab';
import { FrameworksTab } from '../components/interview/FrameworksTab';
import { BehavioralQA } from '../components/interview/BehavioralQA';
import { InterviewGlossary } from '../components/interview/InterviewGlossary';
import { useSubscription } from '../hooks/useSubscription';
import { ProUpsellModal } from '../components/subscription/ProUpsellModal';

// Assets
const SOPHIA_AVATAR = require('../assets/mascot/sophia-hernandez.png');
const LEO_GRADUATION = require('../assets/mascot/leo-graduation.png');
const LEO_DIZZY = require('../assets/mascot/leo-dizzy.png');

const { width: SW } = Dimensions.get('window');
const MOCK_QUESTION_COUNT = 5;

type BottomTab = 'learn' | 'math' | 'frameworks' | 'glossary';

// ─── Stage Tracker ───
function StageTracker({ current, onTap }: { current: InterviewStage; onTap: (s: InterviewStage) => void }) {
  const stages: { stage: InterviewStage; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { stage: 1, label: 'Framework', icon: 'layers' },
    { stage: 2, label: 'Expect', icon: 'eye' },
    { stage: 3, label: 'Practice', icon: 'check-circle' },
    { stage: 4, label: 'Mock Lab', icon: 'mic' },
  ];

  return (
    <View style={st.trackerRow}>
      {stages.map((s, i) => {
        const done = current > s.stage;
        const active = current === s.stage;
        return (
          <React.Fragment key={s.stage}>
            {i > 0 && <View style={[st.trackerLine, (done || active) && st.trackerLineActive]} />}
            <TouchableOpacity
              onPress={() => onTap(s.stage)}
              style={[st.trackerDot, active && st.trackerDotActive, done && st.trackerDotDone]}
            >
              <Feather name={done ? 'check' : s.icon} size={14} color={active || done ? '#FFF' : COLORS.textMuted} />
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─── Leo Graduation Celebration ───
function LeoGraduationCelebration({ visible, score, onDismiss }: { visible: boolean; score: number; onDismiss: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const isHighScore = score >= 80;
  const leoImage = isHighScore ? LEO_GRADUATION : LEO_DIZZY;

  return (
    <Animated.View style={[st.celebrationOverlay, { opacity: opacityAnim }]}>
      <Animated.View style={[st.celebrationContent, { transform: [{ scale: scaleAnim }] }]}>
        <Image source={leoImage} style={st.celebrationLeo} />
        <Text style={st.celebrationScore}>{score}%</Text>
        <Text style={st.celebrationTitle}>
          {score >= 90 ? 'Outstanding! 🎓' : score >= 80 ? 'Great Job! 🎉' : score >= 60 ? 'Good effort!' : 'Keep practicing!'}
        </Text>
        <Text style={st.celebrationSub}>
          {isHighScore ? 'Leo earned his graduation cap!' : 'Keep going — you\'ll get there!'}
        </Text>
        <TouchableOpacity style={st.celebrationBtn} onPress={() => { triggerHaptic('light'); onDismiss(); }}>
          <Text style={st.celebrationBtnText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Bottom Tab Bar ───
function BottomTabBar({ active, onSelect, insetBottom }: { active: BottomTab; onSelect: (t: BottomTab) => void; insetBottom: number }) {
  const tabs: { key: BottomTab; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: 'learn', label: 'Learn', icon: 'book-open' },
    { key: 'math', label: 'Math', icon: 'hash' },
    { key: 'frameworks', label: 'Frameworks', icon: 'grid' },
    { key: 'glossary', label: 'Glossary', icon: 'book' },
  ];

  return (
    <View style={[st.bottomBar, { paddingBottom: Math.max(insetBottom, 8) }]}>
      {tabs.map(t => {
        const isActive = active === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => { onSelect(t.key); triggerHaptic('light'); }}
            style={st.bottomTab}
          >
            <View style={[st.bottomTabIcon, isActive && st.bottomTabIconActive]}>
              <Feather name={t.icon} size={20} color={isActive ? '#7C3AED' : COLORS.textMuted} />
            </View>
            <Text style={[st.bottomTabLabel, isActive && st.bottomTabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function InterviewLabScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const [showProGate, setShowProGate] = useState(false);
  const [market, setMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState<InterviewPath | null>(null);
  const [stage, setStage] = useState<InterviewStage>(1);
  const [persona, setPersona] = useState<InterviewPersona>('consultant');
  const [activeTab, setActiveTab] = useState<BottomTab>('learn');

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
  const [mockSessionScores, setMockSessionScores] = useState<number[]>([]);
  const [mockSessionComplete, setMockSessionComplete] = useState(false);

  // Curriculum progress tracking
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [mcqCycleCount, setMcqCycleCount] = useState(0);
  const [introCompleted, setIntroCompleted] = useState(false);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [isSophiaSpeaking, setIsSophiaSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const scrollRef = useRef<ScrollView>(null);

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

  // ─── Load curriculum progress ───
  useEffect(() => {
    if (!user || !market) return;
    const key = `interview_progress_${user.id}_${market}`;
    AsyncStorage.getItem(key).then(data => {
      if (data) {
        const parsed = JSON.parse(data);
        setCyclesCompleted(parsed.cyclesCompleted || 0);
        setTotalQuestionsAnswered(parsed.totalQuestionsAnswered || 0);
        setMcqCycleCount(parsed.mcqCycleCount || 0);
        if (parsed.introCompleted) {
          setIntroCompleted(true);
          setStage(4); // Skip intro stages on subsequent visits
        }
      }
    }).catch(() => {});
  }, [user, market]);

  const saveCurriculumProgress = useCallback(async (updates: {
    cyclesCompleted?: number;
    totalQuestionsAnswered?: number;
    mcqCycleCount?: number;
  }) => {
    if (!user || !market) return;
    const key = `interview_progress_${user.id}_${market}`;
    const current = {
      cyclesCompleted: updates.cyclesCompleted ?? cyclesCompleted,
      totalQuestionsAnswered: updates.totalQuestionsAnswered ?? totalQuestionsAnswered,
      mcqCycleCount: updates.mcqCycleCount ?? mcqCycleCount,
    };
    try { await AsyncStorage.setItem(key, JSON.stringify(current)); } catch {}
  }, [user, market, cyclesCompleted, totalQuestionsAnswered, mcqCycleCount]);

  // Save feedback to notebook
  const saveFeedbackToNotebook = useCallback(async (fb: any, questionText: string) => {
    if (!user || !market || !fb) return;
    triggerHaptic('medium');
    try {
      const content = `🎤 Mock Interview Feedback\n\nQ: ${questionText}\n\n📊 Score: ${Math.round((fb.score ?? 5) * 10)}/100\n\n✅ What Went Well: ${fb.whatWentWell || ''}\n\n📈 Room for Improvement: ${fb.roomForImprovement || ''}\n\n💎 Pro Version: "${fb.betterVersion || ''}"`;
      await supabase.from('notes').insert({
        user_id: user.id,
        content,
        linked_label: 'interview-feedback',
        market_id: market,
      });
      triggerHaptic('success');
    } catch (err) {
      console.warn('Save feedback error:', err);
    }
  }, [user, market]);

  // ─── Voice helpers ───
  const stopNarration = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch {}
    setIsNarrating(false);
    setIsSophiaSpeaking(false);
  }, []);

  const narrateScenario = useCallback(async (text: string) => {
    if (isNarrating) {
      // Tap again to mute/stop
      await stopNarration();
      return;
    }
    setIsNarrating(true);
    triggerHaptic('light');
    try {
      if (soundRef.current) { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); }
      const sound = await speakAsSophia(text);
      soundRef.current = sound;
      if (sound) {
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) { setIsNarrating(false); soundRef.current = null; }
        });
      } else { setIsNarrating(false); }
    } catch { setIsNarrating(false); }
  }, [isNarrating, stopNarration]);

  const speakFeedback = useCallback(async (fb: any) => {
    if (isSophiaSpeaking) {
      // Tap again to mute/stop
      await stopNarration();
      return;
    }
    setIsSophiaSpeaking(true);
    triggerHaptic('light');
    try {
      if (soundRef.current) { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); }
      const narration = buildFeedbackNarration(fb);
      const sound = await speakAsSophia(narration);
      soundRef.current = sound;
      if (sound) {
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) { setIsSophiaSpeaking(false); soundRef.current = null; }
        });
      } else { setIsSophiaSpeaking(false); }
    } catch { setIsSophiaSpeaking(false); }
  }, [isSophiaSpeaking, stopNarration]);

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
          userResponse, scenario: current.scenario, question: current.question,
          buzzwords: current.buzzwords, persona, marketId: market,
          path: path || 'consulting', questionNumber: mockIndex + 1,
          totalQuestions: Math.min(MOCK_QUESTION_COUNT, mockQuestions.length),
        },
      });
      if (error) throw error;
      setFeedback(data);
      const score = data?.score ?? 5;
      setMockSessionScores(prev => [...prev, score]);

      if (path) {
        supabase.from('interview_lab_attempts').insert({
          user_id: user.id, market_id: market, path, stage: 4,
          attempt_type: 'mock', score: score * 10,
          structure_score: (data?.communicationScore ?? 0) * 10,
          content_score: (data?.industryKnowledgeScore ?? 0) * 10,
          persona_score: (data?.personaFitScore ?? 0) * 10,
          persona, scenario_question: current.question,
          user_response: userResponse, feedback: data,
          buzzwords_used: data?.buzzwordsUsed ?? [],
          buzzwords_missed: data?.buzzwordsMissed ?? [],
        }).then(() => {});
      }

      if (score >= 8) {
        triggerHaptic('success');
        setTimeout(() => setShowCelebration(true), 500);
      } else {
        triggerHaptic('light');
        setTimeout(() => setShowCelebration(true), 500);
      }

      setTimeout(() => speakFeedback(data), 800);
    } catch (err) {
      console.error('Mock submission error:', err);
      setFeedback({
        score: 5, industryKnowledgeScore: 4, communicationScore: 5, personaFitScore: 5,
        whatWentWell: 'You tried — that takes courage!',
        roomForImprovement: 'Check your connection and try again.',
        betterVersion: 'Try again when you have a stable connection.',
        buzzwordsUsed: [], buzzwordsMissed: [],
        sophiaSays: 'Looks like we hit a glitch. Try again!',
      });
    } finally { setSubmitting(false); }
  }, [market, user, userResponse, mockIndex, persona, path, mockQuestions, speakFeedback]);

  const goToNextMockQuestion = useCallback(() => {
    const nextIndex = mockIndex + 1;
    const newTotal = totalQuestionsAnswered + 1;
    setTotalQuestionsAnswered(newTotal);

    if (nextIndex >= Math.min(MOCK_QUESTION_COUNT, mockQuestions.length)) {
      const newCycles = cyclesCompleted + 1;
      setCyclesCompleted(newCycles);
      setMockSessionComplete(true);
      saveCurriculumProgress({ cyclesCompleted: newCycles, totalQuestionsAnswered: newTotal });
    } else {
      setMockIndex(nextIndex);
      saveCurriculumProgress({ totalQuestionsAnswered: newTotal });
    }
    setFeedback(null);
    setUserResponse('');
    setShowCelebration(false);
  }, [mockIndex, mockQuestions.length, totalQuestionsAnswered, cyclesCompleted, saveCurriculumProgress]);

  if (loading || questionsLoading) {
    return <View style={[st.container, st.centered]}><ActivityIndicator size="large" color={COLORS.accent} /></View>;
  }

  // PRO gate — show upsell if not pro
  if (!isProUser) {
    return (
      <View style={[st.container, st.centered, { paddingHorizontal: 20 }]}>
        <View style={{ alignItems: 'center', gap: 16 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(124,58,237,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="lock" size={36} color="#7C3AED" />
          </View>
          <Text style={{ ...TYPE.h2, color: COLORS.textPrimary, textAlign: 'center' }}>Interview Lab is a Pro Feature</Text>
          <Text style={{ ...TYPE.body, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 }}>
            Unlock mock interviews with AI coach Sophia, mental math drills, frameworks library, and more.
          </Text>
          <TouchableOpacity
            style={{ paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, backgroundColor: '#7C3AED', ...SHADOWS.accent }}
            onPress={() => { triggerHaptic('medium'); router.push('/subscription' as any); }}
          >
            <Text style={{ ...TYPE.bodyBold, color: '#FFF', fontSize: 16 }}>Upgrade to Pro</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 10 }}>
            <Text style={{ ...TYPE.body, color: COLORS.textMuted }}>Go Back</Text>
          </TouchableOpacity>
        </View>
        <ProUpsellModal isOpen={showProGate} onClose={() => setShowProGate(false)} trigger="feature_gate" featureName="Interview Lab" />
      </View>
    );
  }

  const marketName = market ? getMarketName(market) : 'Industry';

  // ─── Path Selection ───
  if (!path) {
    return (
      <View style={st.container}>
        <LinearGradient colors={['#1E1B4B', '#312E81', '#4338CA']} style={[st.pathScreen, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
            <Feather name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>

          <View style={st.pathHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={st.pathTitle}>Interview Lab</Text>
              <Text style={st.pathSubtitle}>Choose your preparation path</Text>
            </View>
            <Image source={SOPHIA_AVATAR} style={st.pathSophiaAvatar} />
          </View>

          <View style={st.sophiaIntroCard}>
            <Image source={SOPHIA_AVATAR} style={st.sophiaIntroImg} />
            <View style={{ flex: 1 }}>
              <Text style={st.sophiaIntroName}>Sophia Hernández</Text>
              <Text style={st.sophiaIntroRole}>Your AI Interview Coach</Text>
              <Text style={st.sophiaIntroText}>I'll guide you through frameworks, practice questions, and mock interviews tailored to your industry.</Text>
            </View>
          </View>

          <TouchableOpacity style={st.pathCard} onPress={() => { triggerHaptic('light'); setPath('consulting'); }}>
            <LinearGradient colors={['#7C3AED', '#6D28D9']} style={st.pathGradient}>
              <View style={st.pathIconWrap}><Feather name="briefcase" size={24} color="#FDE68A" /></View>
              <Text style={st.pathCardTitle}>Path A: Future Pro</Text>
              <Text style={st.pathCardSub}>Consulting & Job Prep</Text>
              <Text style={st.pathCardDesc}>Case interviews, business frameworks, mental math, and behavioral prep.</Text>
              <View style={st.pathTags}>
                {['Case Studies', 'Mental Math', 'Frameworks', 'Behavioral'].map(t => (
                  <View key={t} style={st.pathTag}><Text style={st.pathTagText}>{t}</Text></View>
                ))}
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={st.pathCard} onPress={() => { triggerHaptic('light'); setPath('academic'); }}>
            <LinearGradient colors={['#4338CA', '#3730A3']} style={st.pathGradient}>
              <View style={st.pathIconWrap}><Feather name="award" size={24} color="#A5B4FC" /></View>
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

  const currentMCQ = mcqQuestions[mcqIndex % mcqQuestions.length];
  const currentMock = mockQuestions[mockIndex % mockQuestions.length];
  const framework = MECE_FRAMEWORKS[market || ''] || MECE_FRAMEWORKS.aerospace;
  const totalMockQ = Math.min(MOCK_QUESTION_COUNT, mockQuestions.length);

  // ─── Render tab content ───
  const renderTabContent = () => {
    switch (activeTab) {
      case 'math':
        return <MentalMathTab marketName={marketName} marketId={market || 'aerospace'} />;
      case 'frameworks':
        return <FrameworksTab marketName={marketName} marketId={market || 'aerospace'} />;
      case 'glossary':
        return <InterviewGlossary marketName={marketName} marketId={market || 'aerospace'} />;
      case 'learn':
      default:
        return renderLearnTab();
    }
  };

  // ─── Learn Tab (Interview Flow) ───
  const renderLearnTab = () => (
    <>
      {/* Stage Progress */}
      <StageTracker current={stage} onTap={(s) => setStage(s)} />

      {/* ═══ STAGE 1: Framework ═══ */}
      {stage === 1 && (
        <View style={st.stageContainer}>
          <View style={st.sectionHeader}>
            <LinearGradient colors={['#7C3AED', '#6D28D9']} style={st.sectionIconBg}>
              <Feather name="layers" size={16} color="#FFF" />
            </LinearGradient>
            <View>
              <Text style={st.sectionTitle}>
                {path === 'consulting' ? 'MECE Framework' : 'Story Hero Method'}
              </Text>
              <Text style={st.sectionSubtitle}>Learn the key framework</Text>
            </View>
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
                    <View style={{ flex: 1 }}>
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

          <TouchableOpacity style={st.primaryBtn} onPress={() => { triggerHaptic('light'); setStage(2); }}>
            <Text style={st.primaryBtnText}>Next: Expectations</Text>
            <Feather name="arrow-right" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ═══ STAGE 2: Expectations + Behavioral Q&A ═══ */}
      {stage === 2 && (
        <View style={st.stageContainer}>
          <View style={st.sectionHeader}>
            <LinearGradient colors={['#3B82F6', '#2563EB']} style={st.sectionIconBg}>
              <Feather name="eye" size={16} color="#FFF" />
            </LinearGradient>
            <View>
              <Text style={st.sectionTitle}>Top "Big Boss" Questions</Text>
              <Text style={st.sectionSubtitle}>What separates good from great in {marketName}</Text>
            </View>
          </View>

          {bigBossQuestions.map((q, i) => (
            <View key={i} style={st.card}>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
                <View style={st.questionNum}><Text style={st.questionNumText}>{i + 1}</Text></View>
                <Text style={[st.cardBody, { flex: 1, fontWeight: '600', color: COLORS.textPrimary }]}>{q.question}</Text>
              </View>
              <View style={st.tipBox}>
                <Feather name="zap" size={14} color="#F59E0B" />
                <Text style={st.tipText}>{q.tip}</Text>
              </View>
            </View>
          ))}

          {/* Mental Math Preview (consulting only) */}
          {path === 'consulting' && mentalMathQuestions.length > 0 && (
            <>
              <View style={[st.sectionHeader, { marginTop: 20 }]}>
                <LinearGradient colors={['#EF4444', '#DC2626']} style={st.sectionIconBg}>
                  <Feather name="clock" size={16} color="#FFF" />
                </LinearGradient>
                <View>
                  <Text style={st.sectionTitle}>Mental Math Minute</Text>
                  <Text style={st.sectionSubtitle}>Quick calculations under pressure</Text>
                </View>
              </View>
              {mentalMathQuestions.slice(0, 3).map((q, i) => (
                <MathDrill key={i} question={q} />
              ))}
              <TouchableOpacity
                style={[st.secondaryBtn, { marginBottom: 12 }]}
                onPress={() => { setActiveTab('math'); triggerHaptic('light'); }}
              >
                <Feather name="hash" size={14} color="#7C3AED" />
                <Text style={st.secondaryBtnText}>Full Math Drills →</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Behavioral Q&A CTA */}
          <TouchableOpacity
            style={[st.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}
            onPress={() => { setActiveTab('glossary'); triggerHaptic('light'); }}
          >
            <View style={[st.sectionIconBg, { backgroundColor: '#10B981', width: 36, height: 36, borderRadius: 12 }]}>
              <Feather name="message-circle" size={16} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.cardLabel}>Behavioral Q&A</Text>
              <Text style={[st.cardBody, { fontSize: 12 }]}>Practice common interview questions with notes</Text>
            </View>
            <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={st.primaryBtn} onPress={() => { triggerHaptic('light'); setStage(3); setMcqIndex(0); setMcqSelected(null); setMcqScore(0); }}>
            <Text style={st.primaryBtnText}>Next: Practice MCQs</Text>
            <Feather name="arrow-right" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ═══ STAGE 3: MCQ Practice ═══ */}
      {stage === 3 && mcqQuestions.length > 0 && (
        <View style={st.stageContainer}>
          <View style={st.sectionHeader}>
            <LinearGradient colors={['#10B981', '#059669']} style={st.sectionIconBg}>
              <Feather name="check-circle" size={16} color="#FFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={st.sectionTitle}>{path === 'consulting' ? 'Case Practice' : 'Values & Impact'}</Text>
              <Text style={st.sectionSubtitle}>Question {mcqIndex + 1} of {mcqQuestions.length}</Text>
            </View>
            <View style={st.scorePill}>
              <Text style={st.scorePillText}>{mcqScore}/{mcqIndex + (mcqSelected !== null ? 1 : 0)}</Text>
            </View>
          </View>

          <View style={st.progressTrack}>
            <View style={[st.progressFill, { width: `${((mcqIndex + (mcqSelected !== null ? 1 : 0)) / mcqQuestions.length) * 100}%` }]} />
          </View>

          <View style={st.card}>
            <Text style={[st.cardBody, { fontWeight: '600', marginBottom: 14, color: COLORS.textPrimary, fontSize: 16, lineHeight: 24 }]}>{currentMCQ.question}</Text>
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
                    triggerHaptic(i === currentMCQ.correctIndex ? 'success' : 'error');
                    if (i === currentMCQ.correctIndex) setMcqScore(s => s + 1);
                    if (user && market && path) {
                      supabase.from('interview_lab_attempts').insert({
                        user_id: user.id, market_id: market, path,
                        stage: 3, attempt_type: 'mcq',
                        score: i === currentMCQ.correctIndex ? 100 : 0,
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
                  <View style={[st.mcqRadio, revealed && correct && st.mcqRadioCorrect, selected && !correct && st.mcqRadioWrong]}>
                    {(revealed && correct) && <Feather name="check" size={12} color="#FFF" />}
                    {(selected && !correct) && <Feather name="x" size={12} color="#FFF" />}
                  </View>
                  <Text style={[st.mcqOptionText, revealed && correct && { color: '#059669', fontWeight: '600' }]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
            {mcqSelected !== null && (
              <View style={st.explanationBox}>
                <Feather name="info" size={14} color="#3B82F6" style={{ marginTop: 2 }} />
                <Text style={st.explanationText}>{currentMCQ.explanation}</Text>
              </View>
            )}
          </View>

          {mcqSelected !== null && (
            <TouchableOpacity
              style={st.primaryBtn}
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
              <Text style={st.primaryBtnText}>
                {mcqIndex < mcqQuestions.length - 1 ? 'Next Question' : 'Go to Mock Lab'}
              </Text>
              <Feather name="arrow-right" size={18} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ═══ STAGE 4: Mock Lab ═══ */}
      {stage === 4 && !mockSessionComplete && (
        <View style={st.stageContainer}>
          <View style={st.sectionHeader}>
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={st.sectionIconBg}>
              <Feather name="mic" size={16} color="#FFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={st.sectionTitle}>Mock Interview</Text>
              <Text style={st.sectionSubtitle}>Question {mockIndex + 1} of {totalMockQ}</Text>
            </View>
            <View style={st.mockProgressPill}>
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
                  <Text style={st.mockDotScore}>{Math.round(mockSessionScores[i] * 10)}</Text>
                )}
                {i === mockIndex && <Feather name="mic" size={10} color="#FFF" />}
              </View>
            ))}
          </View>

          {/* Persona Selector — first question only */}
          {mockIndex === 0 && !feedback && (
            <View style={st.card}>
              <Text style={st.cardLabel}>Choose Your Interviewer</Text>
              <View style={st.personaRow}>
                {(Object.entries(INTERVIEW_PERSONAS) as [InterviewPersona, typeof INTERVIEW_PERSONAS[InterviewPersona]][]).map(([key, p]) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => { setPersona(key); triggerHaptic('light'); }}
                    style={[st.personaBtn, persona === key && { borderColor: p.color, backgroundColor: `${p.color}10` }]}
                  >
                    <View style={[st.personaIconWrap, { backgroundColor: persona === key ? p.color : COLORS.bg1 }]}>
                      <Feather name={p.icon as any} size={18} color={persona === key ? '#FFF' : COLORS.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[st.personaLabel, persona === key && { color: p.color }]}>{p.label}</Text>
                      <Text style={st.personaDesc}>{p.description}</Text>
                    </View>
                    {persona === key && (
                      <View style={[st.personaCheck, { backgroundColor: p.color }]}>
                        <Feather name="check" size={12} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Sophia Scenario Card */}
          <View style={[st.card, st.sophiaCard]}>
            <View style={st.sophiaHeader}>
              <Image source={SOPHIA_AVATAR} style={st.sophiaAvatarImg} />
              <View style={{ flex: 1 }}>
                <Text style={st.sophiaName}>Sophia Hernández</Text>
                <Text style={st.sophiaRole}>{INTERVIEW_PERSONAS[persona]?.label || 'Interview Coach'}</Text>
              </View>
              <TouchableOpacity
                onPress={() => narrateScenario(`${currentMock.scenario} ... ${currentMock.question}`)}
                style={[st.voiceBtn, isNarrating && st.voiceBtnActive]}
              >
                <Feather name={isNarrating ? 'volume-2' : 'volume-1'} size={16} color={isNarrating ? '#FFF' : '#7C3AED'} />
              </TouchableOpacity>
            </View>
            <View style={st.scenarioBox}>
              <Text style={st.scenarioText}>{currentMock.scenario}</Text>
            </View>
            <Text style={st.scenarioQuestion}>{currentMock.question}</Text>
          </View>

          {/* Response Input */}
          {!feedback && (
            <>
              <View style={st.card}>
                <View style={st.responseHeader}>
                  <Text style={st.cardLabel}>Your Response</Text>
                  <TouchableOpacity
                    onPress={() => { setVoiceMode(!voiceMode); triggerHaptic('light'); }}
                    style={[st.voiceToggle, voiceMode && st.voiceToggleActive]}
                  >
                    <Feather name={voiceMode ? 'mic' : 'edit-3'} size={12} color={voiceMode ? '#FFF' : '#7C3AED'} />
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
                  <>
                    <Text style={st.submitBtnText}>Submit to Sophia</Text>
                    <Feather name="send" size={16} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Feedback */}
          {feedback && (
            <View style={st.feedbackContainer}>
              <View style={st.scoreCard}>
                <View style={[st.scoreCircle, { backgroundColor: (feedback.score ?? 5) >= 8 ? 'rgba(16,185,129,0.12)' : (feedback.score ?? 5) >= 5 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                  <Text style={[st.scoreNum, { color: (feedback.score ?? 5) >= 8 ? '#10B981' : (feedback.score ?? 5) >= 5 ? '#F59E0B' : '#EF4444' }]}>{Math.round((feedback.score ?? 5) * 10)}</Text>
                  <Text style={st.scoreSlash}>/100</Text>
                </View>
                <View style={st.scoreBreakdown}>
                  <ScoreBar label="Industry" value={(feedback.industryKnowledgeScore ?? 0) * 10} color="#7C3AED" />
                  <ScoreBar label="Structure" value={(feedback.communicationScore ?? 0) * 10} color="#3B82F6" />
                  <ScoreBar label="Persona" value={(feedback.personaFitScore ?? 0) * 10} color="#F59E0B" />
                </View>
              </View>

              {/* Sophia Says */}
              <View style={[st.card, st.sophiaFeedbackCard]}>
                <View style={st.sophiaHeader}>
                  <Image source={SOPHIA_AVATAR} style={st.sophiaAvatarSmall} />
                  <Text style={[st.sophiaQuote, { flex: 1 }]}>{feedback.sophiaSays}</Text>
                  <TouchableOpacity
                    onPress={() => speakFeedback(feedback)}
                    style={[st.voiceBtn, isSophiaSpeaking && st.voiceBtnActive]}
                  >
                    <Feather name={isSophiaSpeaking ? 'volume-2' : 'volume-1'} size={14} color={isSophiaSpeaking ? '#FFF' : '#7C3AED'} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[st.card, st.feedbackGood]}>
                <View style={st.feedbackRow}>
                  <View style={st.feedbackIconGood}><Feather name="check-circle" size={14} color="#FFF" /></View>
                  <Text style={[st.feedbackHeading, { color: '#059669' }]}>What Went Well</Text>
                </View>
                <Text style={st.feedbackBody}>{feedback.whatWentWell}</Text>
              </View>

              <View style={[st.card, st.feedbackImprove]}>
                <View style={st.feedbackRow}>
                  <View style={st.feedbackIconImprove}><Feather name="arrow-up-circle" size={14} color="#FFF" /></View>
                  <Text style={[st.feedbackHeading, { color: '#D97706' }]}>Room for Improvement</Text>
                </View>
                <Text style={st.feedbackBody}>{feedback.roomForImprovement}</Text>
              </View>

              <View style={[st.card, st.feedbackPro]}>
                <View style={st.feedbackRow}>
                  <View style={st.feedbackIconPro}><Feather name="edit-3" size={14} color="#FFF" /></View>
                  <Text style={[st.feedbackHeading, { color: '#7C3AED' }]}>Pro Version</Text>
                </View>
                <Text style={st.trySayingText}>"{feedback.betterVersion}"</Text>
              </View>

              {((feedback.buzzwordsUsed?.length > 0) || (feedback.buzzwordsMissed?.length > 0)) && (
                <View style={st.card}>
                  <View style={st.feedbackRow}>
                    <View style={st.feedbackIconBuzz}><Feather name="zap" size={14} color="#FFF" /></View>
                    <Text style={st.feedbackHeading}>Industry Buzz Detector</Text>
                  </View>
                  {feedback.buzzwordsUsed?.length > 0 && (
                    <View style={st.buzzRow}>
                      <Text style={st.buzzLabel}>Used ✓</Text>
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

              {/* Save to Notebook */}
              <TouchableOpacity
                onPress={() => saveFeedbackToNotebook(feedback, currentMock?.question || '')}
                style={st.saveFeedbackBtn}
              >
                <Feather name="bookmark" size={14} color="#7C3AED" />
                <Text style={st.saveFeedbackText}>Save to Notebook</Text>
              </TouchableOpacity>

              <View style={st.feedbackActions}>
                <TouchableOpacity
                  style={st.retryBtn}
                  onPress={() => { setFeedback(null); setUserResponse(''); setShowCelebration(false); }}
                >
                  <Feather name="rotate-ccw" size={16} color="#7C3AED" />
                  <Text style={st.retryBtnText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={st.primaryBtn} onPress={goToNextMockQuestion}>
                  <Text style={st.primaryBtnText}>
                    {mockIndex + 1 >= totalMockQ ? 'Finish' : `Q${mockIndex + 2}`}
                  </Text>
                  <Feather name="arrow-right" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ═══ SESSION COMPLETE ═══ */}
      {stage === 4 && mockSessionComplete && (() => {
        const avgScore = mockSessionScores.length > 0
          ? mockSessionScores.reduce((a, b) => a + b, 0) / mockSessionScores.length : 0;
        const avgPercent = avgScore * 10;
        const isHighScore = avgPercent >= 80;
        return (
          <View style={st.stageContainer}>
            <View style={st.sessionCompleteCard}>
              <Image source={isHighScore ? LEO_GRADUATION : LEO_DIZZY} style={st.sessionLeoImg} />
              <Text style={st.sessionCompleteTitle}>
                {isHighScore ? 'Outstanding Performance! 🎓' : 'Mock Interview Complete!'}
              </Text>
              <Text style={st.sessionCompleteSubtitle}>{marketName} • {INTERVIEW_PERSONAS[persona]?.label}</Text>

              <View style={st.sessionScoresGrid}>
                {mockSessionScores.map((s, i) => {
                  const s100 = Math.round(s * 10);
                  return (
                    <View key={i} style={st.sessionScoreItem}>
                      <Text style={st.sessionScoreLabel}>Q{i + 1}</Text>
                      <View style={[st.sessionScoreBadge, {
                        backgroundColor: s >= 8 ? 'rgba(16,185,129,0.12)' : s >= 5 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                      }]}>
                        <Text style={[st.sessionScoreValue, {
                          color: s >= 8 ? '#10B981' : s >= 5 ? '#F59E0B' : '#EF4444',
                        }]}>{s100}/100</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={st.sessionAvgWrap}>
                <Text style={st.sessionAvgLabel}>Average Score</Text>
                <Text style={[st.sessionAvgValue, {
                  color: avgScore >= 8 ? '#10B981' : avgScore >= 5 ? '#F59E0B' : '#EF4444',
                }]}>{Math.round(avgScore * 10)}/100</Text>
              </View>

              {/* Curriculum Progress */}
              <View style={st.curriculumCard}>
                <Text style={st.curriculumTitle}>📈 Your Interview Progress</Text>
                <View style={st.curriculumRow}>
                  <View style={st.curriculumStat}>
                    <Text style={st.curriculumStatNum}>{cyclesCompleted}</Text>
                    <Text style={st.curriculumStatLabel}>Cycles Done</Text>
                  </View>
                  <View style={st.curriculumDivider} />
                  <View style={st.curriculumStat}>
                    <Text style={st.curriculumStatNum}>{totalQuestionsAnswered}</Text>
                    <Text style={st.curriculumStatLabel}>Questions</Text>
                  </View>
                  <View style={st.curriculumDivider} />
                  <View style={st.curriculumStat}>
                    <Text style={[st.curriculumStatNum, { color: '#10B981' }]}>
                      {cyclesCompleted > 0 ? '🔄 New Q\'s' : '—'}
                    </Text>
                    <Text style={st.curriculumStatLabel}>Next Cycle</Text>
                  </View>
                </View>
                {cyclesCompleted > 0 && (
                  <Text style={st.curriculumHint}>
                    Complete another cycle to unlock new industry-specific questions!
                  </Text>
                )}
              </View>

              <View style={st.sessionActions}>
                <TouchableOpacity
                  style={st.retryBtn}
                  onPress={() => {
                    setMockIndex(0); setMockSessionScores([]); setMockSessionComplete(false);
                    setFeedback(null); setUserResponse('');
                  }}
                >
                  <Feather name="rotate-ccw" size={16} color="#7C3AED" />
                  <Text style={st.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={st.primaryBtn} onPress={() => router.back()}>
                  <Text style={st.primaryBtnText}>Done</Text>
                  <Feather name="check" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })()}
    </>
  );

  return (
    <View style={st.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
        {/* Header Bar */}
        <View style={[st.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => {
            if (activeTab !== 'learn') { setActiveTab('learn'); }
            else if (stage === 1 && !feedback) { setPath(null); }
            else { setStage(Math.max(1, stage - 1) as InterviewStage); }
          }} style={st.backBtn2}>
            <Feather name="chevron-left" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={st.headerTitle}>Interview Lab</Text>
            <Text style={st.headerSub}>{marketName} • {path === 'consulting' ? 'Future Pro' : 'Academic Star'}</Text>
          </View>
          {heroProblem && activeTab === 'learn' ? (
            <View style={st.heroProblemBadge}>
              <Text style={st.heroProblemText} numberOfLines={1}>{heroProblem}</Text>
            </View>
          ) : null}
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderTabContent()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Tab Bar */}
      <BottomTabBar active={activeTab} onSelect={setActiveTab} insetBottom={insets.bottom} />

      <LeoGraduationCelebration
        visible={showCelebration}
        score={(feedback?.score ?? 5) * 10}
        onDismiss={() => setShowCelebration(false)}
      />
    </View>
  );
}


// ─── Styles ───
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },

  // Path selection
  pathScreen: { flex: 1, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12, marginTop: 8, width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  pathHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  pathSophiaAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  pathTitle: { ...TYPE.hero, color: '#FFF', fontSize: 28 },
  pathSubtitle: { ...TYPE.body, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  sophiaIntroCard: { flexDirection: 'row', gap: 14, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 20 },
  sophiaIntroImg: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  sophiaIntroName: { ...TYPE.bodyBold, color: '#FFF', fontSize: 15 },
  sophiaIntroRole: { ...TYPE.caption, color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 },
  sophiaIntroText: { ...TYPE.body, color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 19 },

  pathCard: { marginBottom: 14, borderRadius: 18, overflow: 'hidden', ...SHADOWS.lg },
  pathGradient: { padding: 20, borderRadius: 18 },
  pathIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  pathCardTitle: { ...TYPE.h2, color: '#FFF', marginBottom: 2 },
  pathCardSub: { ...TYPE.caption, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  pathCardDesc: { ...TYPE.body, color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  pathTags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pathTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  pathTagText: { ...TYPE.caption, color: '#FFF', fontSize: 10 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10, gap: 12, backgroundColor: COLORS.bg0, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn2: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm, zIndex: 10 },
  headerTitle: { ...TYPE.h2, color: COLORS.textPrimary, fontSize: 18 },
  headerSub: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 11 },
  heroProblemBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(124,58,237,0.1)', maxWidth: 100 },
  heroProblemText: { ...TYPE.caption, color: '#7C3AED', fontSize: 9 },

  // Stage Tracker
  trackerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, marginVertical: 16, gap: 0 },
  trackerDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bg1, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  trackerDotActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED', ...SHADOWS.accent },
  trackerDotDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  trackerLine: { flex: 1, height: 2, backgroundColor: COLORS.border },
  trackerLineActive: { backgroundColor: '#7C3AED' },

  // Stages
  stageContainer: { paddingHorizontal: 20 },

  // Section Header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sectionIconBg: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...TYPE.h3, color: COLORS.textPrimary, fontSize: 17 },
  sectionSubtitle: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 11, marginTop: 1 },

  // Cards
  card: { backgroundColor: COLORS.bg2, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  cardLabel: { ...TYPE.bodyBold, color: COLORS.textPrimary, marginBottom: 8, fontSize: 15 },
  cardBody: { ...TYPE.body, color: COLORS.textSecondary, lineHeight: 22 },

  // Framework
  branchContainer: { marginTop: 14, gap: 10 },
  branchItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  branchDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  branchText: { ...TYPE.body, color: COLORS.textPrimary, flex: 1, lineHeight: 20 },
  tipBox: { flexDirection: 'row', gap: 8, marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.06)' },
  tipText: { ...TYPE.caption, color: '#D97706', flex: 1, lineHeight: 18, fontSize: 12 },

  heroLetterBg: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  heroLetter: { ...TYPE.h1, color: '#FFF', fontSize: 18 },
  exampleBox: { padding: 12, borderRadius: 12, backgroundColor: 'rgba(124,58,237,0.06)', marginTop: 8 },
  exampleText: { ...TYPE.body, color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 20 },

  questionNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  questionNumText: { ...TYPE.bodyBold, color: '#FFF', fontSize: 12 },

  // Progress bar
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: COLORS.bg1, marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: '#10B981' },
  scorePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.12)' },
  scorePillText: { ...TYPE.bodyBold, color: '#10B981', fontSize: 12 },

  // MCQ
  mcqOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 8, gap: 12 },
  mcqOptionCorrect: { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.06)' },
  mcqOptionWrong: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.06)' },
  mcqOptionText: { ...TYPE.body, color: COLORS.textPrimary, flex: 1, lineHeight: 20 },
  mcqRadio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  mcqRadioCorrect: { backgroundColor: '#10B981', borderColor: '#10B981' },
  mcqRadioWrong: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  explanationBox: { flexDirection: 'row', gap: 8, marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.06)' },
  explanationText: { ...TYPE.body, color: COLORS.textSecondary, fontSize: 13, lineHeight: 19, flex: 1 },

  // Mock Progress Dots
  mockProgressPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(124,58,237,0.12)' },
  mockProgressText: { ...TYPE.bodyBold, color: '#7C3AED', fontSize: 12 },
  mockDotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  mockDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.border },
  mockDotDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  mockDotActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  mockDotPending: { backgroundColor: COLORS.bg1 },
  mockDotScore: { ...TYPE.caption, color: '#FFF', fontSize: 10, fontWeight: '700' },

  // Persona
  personaRow: { gap: 8 },
  personaBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, gap: 12 },
  personaIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  personaLabel: { ...TYPE.bodyBold, color: COLORS.textPrimary, fontSize: 14 },
  personaDesc: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 11 },
  personaCheck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Sophia
  sophiaCard: { borderColor: 'rgba(124,58,237,0.2)' },
  sophiaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sophiaAvatarImg: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(124,58,237,0.2)' },
  sophiaAvatarSmall: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.15)' },
  sophiaName: { ...TYPE.bodyBold, color: COLORS.textPrimary, fontSize: 15 },
  sophiaRole: { ...TYPE.caption, color: '#7C3AED', fontSize: 11 },
  sophiaQuote: { ...TYPE.body, color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 20, fontSize: 14 },
  scenarioBox: { padding: 14, borderRadius: 12, backgroundColor: COLORS.bg1, marginBottom: 8 },
  scenarioText: { ...TYPE.body, color: COLORS.textSecondary, lineHeight: 22 },
  scenarioQuestion: { ...TYPE.bodyBold, color: COLORS.textPrimary, marginTop: 4, fontSize: 15, lineHeight: 22 },

  // Voice
  voiceBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(124,58,237,0.08)', alignItems: 'center', justifyContent: 'center' },
  voiceBtnActive: { backgroundColor: '#7C3AED' },
  responseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  voiceToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#7C3AED' },
  voiceToggleActive: { backgroundColor: '#7C3AED' },
  voiceToggleText: { ...TYPE.caption, color: '#7C3AED', fontSize: 11, fontWeight: '600' },
  voiceRecordArea: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  startRecordBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', ...SHADOWS.accent },
  stopRecordBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  recordingPulse: { borderRadius: 40, borderWidth: 3, borderColor: 'rgba(239,68,68,0.3)', padding: 4 },
  recordingLabel: { ...TYPE.caption, color: COLORS.textMuted },
  transcriptPreview: { width: '100%', padding: 12, borderRadius: 12, backgroundColor: COLORS.bg1, marginTop: 8 },
  transcriptLabel: { ...TYPE.caption, color: COLORS.textMuted, marginBottom: 4 },
  transcriptText: { ...TYPE.body, color: COLORS.textPrimary, lineHeight: 20 },

  responseInput: { ...TYPE.body, color: COLORS.textPrimary, minHeight: 120, padding: 14, borderRadius: 12, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, lineHeight: 22, marginBottom: 10 },

  // Buttons
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, backgroundColor: '#7C3AED', ...SHADOWS.accent },
  primaryBtnText: { ...TYPE.bodyBold, color: '#FFF', fontSize: 15 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#7C3AED', backgroundColor: COLORS.bg2 },
  secondaryBtnText: { ...TYPE.bodyBold, color: '#7C3AED', fontSize: 13 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, backgroundColor: '#7C3AED', marginBottom: 8, ...SHADOWS.accent },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { ...TYPE.bodyBold, color: '#FFF', fontSize: 16 },

  // Feedback
  feedbackContainer: { gap: 0 },
  scoreCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12, padding: 18, borderRadius: 16, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  scoreCircle: { alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 36 },
  scoreNum: { fontSize: 28, fontWeight: '900' },
  scoreSlash: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 12 },
  scoreBreakdown: { flex: 1, gap: 6 },

  sophiaFeedbackCard: { borderColor: 'rgba(124,58,237,0.15)', backgroundColor: 'rgba(124,58,237,0.03)' },

  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  feedbackIconGood: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  feedbackIconImprove: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' },
  feedbackIconPro: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  feedbackIconBuzz: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  feedbackGood: { borderLeftColor: '#10B981', borderLeftWidth: 3 },
  feedbackImprove: { borderLeftColor: '#F59E0B', borderLeftWidth: 3 },
  feedbackPro: { borderLeftColor: '#7C3AED', borderLeftWidth: 3 },

  feedbackHeading: { ...TYPE.bodyBold, color: COLORS.textPrimary, fontSize: 14 },
  feedbackBody: { ...TYPE.body, color: COLORS.textSecondary, lineHeight: 22, paddingLeft: 36 },
  trySayingText: { ...TYPE.body, color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 22, paddingLeft: 36 },

  // Buzzwords
  buzzRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8, paddingLeft: 36 },
  buzzLabel: { ...TYPE.caption, color: COLORS.textMuted, width: 50, marginTop: 4, fontSize: 10 },
  buzzTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  buzzTagGood: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(16,185,129,0.12)' },
  buzzTagText: { ...TYPE.caption, color: '#059669', fontSize: 11 },
  buzzTagMiss: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(239,68,68,0.08)' },
  buzzTagTextMiss: { ...TYPE.caption, color: '#DC2626', fontSize: 11 },

  // Actions
  feedbackActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  retryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#7C3AED', backgroundColor: COLORS.bg2 },
  retryBtnText: { ...TYPE.bodyBold, color: '#7C3AED' },

  // Session Complete
  sessionCompleteCard: { alignItems: 'center', padding: 28, borderRadius: 20, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.md },
  sessionLeoImg: { width: 120, height: 120, resizeMode: 'contain', marginBottom: 8 },
  sessionCompleteTitle: { ...TYPE.h1, color: COLORS.textPrimary, fontSize: 20, marginTop: 8, textAlign: 'center' },
  sessionCompleteSubtitle: { ...TYPE.caption, color: COLORS.textMuted, marginBottom: 20 },
  sessionScoresGrid: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' },
  sessionScoreItem: { alignItems: 'center', gap: 4 },
  sessionScoreLabel: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 11 },
  sessionScoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  sessionScoreValue: { ...TYPE.bodyBold, fontSize: 15 },
  sessionAvgWrap: { alignItems: 'center', marginBottom: 24, padding: 16, borderRadius: 14, backgroundColor: COLORS.bg1, width: '100%' },
  sessionAvgLabel: { ...TYPE.caption, color: COLORS.textMuted, marginBottom: 4 },
  sessionAvgValue: { ...TYPE.hero, fontSize: 32 },
  sessionActions: { flexDirection: 'row', gap: 12, width: '100%' },

  // Celebration
  celebrationOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  celebrationContent: { alignItems: 'center', padding: 32 },
  celebrationLeo: { width: 160, height: 160, resizeMode: 'contain' },
  celebrationScore: { fontSize: 52, fontWeight: '900', color: '#FDE68A', marginTop: 12 },
  celebrationTitle: { ...TYPE.h1, color: '#FFF', fontSize: 22, marginTop: 8 },
  celebrationSub: { ...TYPE.body, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  celebrationBtn: { marginTop: 24, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14, backgroundColor: '#7C3AED' },
  celebrationBtnText: { ...TYPE.bodyBold, color: '#FFF' },

  // Bottom Tab Bar
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg0,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    ...SHADOWS.sm,
  },
  bottomTab: { flex: 1, alignItems: 'center', gap: 2 },
  bottomTabIcon: { width: 40, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bottomTabIconActive: { backgroundColor: 'rgba(124,58,237,0.1)' },
  bottomTabLabel: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 10 },
  bottomTabLabelActive: { color: '#7C3AED' },

  // Save feedback to notebook
  saveFeedbackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#7C3AED', borderStyle: 'dashed', marginBottom: 8 },
  saveFeedbackText: { ...TYPE.bodyBold, color: '#7C3AED', fontSize: 13 },

  // Curriculum progress
  curriculumCard: { padding: 16, borderRadius: 16, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  curriculumTitle: { ...TYPE.bodyBold, color: COLORS.textPrimary, fontSize: 15, marginBottom: 12, textAlign: 'center' },
  curriculumRow: { flexDirection: 'row', alignItems: 'center' },
  curriculumStat: { flex: 1, alignItems: 'center' },
  curriculumStatNum: { ...TYPE.h2, color: '#7C3AED', fontSize: 20 },
  curriculumStatLabel: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  curriculumDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  curriculumHint: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 16 },
});
