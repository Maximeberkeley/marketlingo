import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Animated, Easing, Dimensions, Image,
} from 'react-native';
import { COLORS } from '../../lib/constants';
import { saveDemoXP, saveDemoMarket } from '../../lib/demoXPBridge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEMO_SLIDES = [
  {
    id: 1,
    title: "The $1 Trillion AI Infrastructure Race",
    body: "The AI industry isn't just about models — it's an arms race for compute infrastructure. Between 2022 and 2024, the three hyperscalers (AWS, Azure, GCP) collectively spent over $200 billion on data centers, GPUs, and networking equipment.\n\nNVIDIA's H100 GPU — the \"gold standard\" for AI training — commands $30,000–$40,000 per chip, and demand still outpaces supply by 10x.\n\nThe real moat isn't the model. It's whoever owns the inference infrastructure at scale.",
    insight: "Compute is the new oil. The company that owns the pipes often wins more than the company that owns the algorithm.",
  },
  {
    id: 2,
    title: "Why 90% of 'AI Companies' Aren't Really AI Companies",
    body: "Most companies calling themselves \"AI companies\" are actually software companies with an OpenAI API key. The distinction matters enormously for investors and job-seekers.\n\nTrue AI companies (Anthropic, Mistral, xAI) invest $100M+ in model training. \"AI-native\" companies (Cursor, Perplexity) build specialized UX on foundation models. \"AI-integrated\" incumbents (Salesforce, Adobe) add AI features to existing products.\n\nEach category has fundamentally different moats, burn rates, and hiring profiles.",
    insight: "When evaluating an AI opportunity, always ask: where exactly in the stack does their edge come from?",
  },
];

const DEMO_QUIZ = {
  question: "A startup claims it has a proprietary AI model. They fine-tuned GPT-4 on internal data. How should you classify this company?",
  options: [
    { text: "True AI Company — fine-tuning IS model development", correct: false, feedback: "Fine-tuning modifies behavior but doesn't constitute building foundational AI. The core IP still belongs to OpenAI." },
    { text: "AI-Native — specialized UX and data moat on foundation models", correct: true, feedback: "Correct! Their edge comes from domain-specific data and specialized UX — not the model itself. A valid and valuable moat." },
    { text: "AI-Integrated — legacy software with AI bolted on", correct: false, feedback: "Incumbents are established companies adding AI. This is a new company built AI-first — they're AI-native." },
    { text: "Undifferentiated — no moat if anyone can fine-tune", correct: false, feedback: "Their proprietary training data IS the moat. Replicating it takes years." },
  ],
};

type DemoStep = 'intro' | 'slide1' | 'slide2' | 'quiz' | 'quiz-result' | 'gate';

interface DemoLessonProps {
  onSignUp: () => void;
  onClose: () => void;
}

function XPBurst({ amount, visible }: { amount: number; visible: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [visible]);
  if (!visible) return null;
  return (
    <Animated.View style={[xpStyles.burst, {
      opacity: anim.interpolate({ inputRange: [0, 0.3, 0.8, 1], outputRange: [0, 1, 1, 0] }),
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) },
        { scale: anim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0.5, 1.2, 1, 0.8] }) },
      ],
    }]}>
      <Text style={xpStyles.burstText}>⚡ +{amount} XP</Text>
    </Animated.View>
  );
}

export function DemoLesson({ onSignUp, onClose }: DemoLessonProps) {
  const [step, setStep] = useState<DemoStep>('intro');
  const [totalXP, setTotalXP] = useState(0);
  const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);
  const [showXPBurst, setShowXPBurst] = useState(false);
  const [lastXPAmount, setLastXPAmount] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { saveDemoMarket('ai'); }, []);

  const animateTransition = (callback: () => void) => {
    slideAnim.setValue(40);
    callback();
    Animated.spring(slideAnim, { toValue: 0, tension: 300, friction: 26, useNativeDriver: true }).start();
  };

  const awardXP = (amount: number) => {
    setTotalXP((prev) => prev + amount);
    setLastXPAmount(amount);
    setShowXPBurst(true);
    saveDemoXP(amount);
    setTimeout(() => setShowXPBurst(false), 1500);
  };

  const goToStep = (next: DemoStep) => animateTransition(() => setStep(next));

  const handleQuizSelect = (idx: number) => {
    if (selectedQuiz !== null) return;
    setSelectedQuiz(idx);
    if (DEMO_QUIZ.options[idx].correct) awardXP(50);
    setTimeout(() => goToStep('quiz-result'), 1200);
  };

  const steps: DemoStep[] = ['intro', 'slide1', 'slide2', 'quiz', 'gate'];
  const currentStepIdx = steps.indexOf(step === 'quiz-result' ? 'quiz' : step);

  return (
    <View style={styles.container}>
      <View style={styles.xpBar}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <View style={styles.xpChip}>
          <Text style={styles.xpChipText}>⚡ {totalXP} XP</Text>
        </View>
        <View style={styles.progressDots}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.dot, i <= currentStepIdx && styles.dotActive]} />
          ))}
        </View>
      </View>

      <XPBurst amount={lastXPAmount} visible={showXPBurst} />

      <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {step === 'intro' && (
            <View style={styles.stepContainer}>
              <Image source={require('../../assets/mascot/leo-reference.png')} style={styles.introMascot} resizeMode="contain" />
              <Text style={styles.introTitle}>Try a free lesson</Text>
              <Text style={styles.introSubtitle}>2 slides + 1 quiz from the AI market.{'\n'}Earn real XP that carries into your account.</Text>
              <View style={styles.introBadges}>
                <View style={styles.introBadge}><Text style={styles.introBadgeText}>AI Market</Text></View>
                <View style={styles.introBadge}><Text style={styles.introBadgeText}>3 min</Text></View>
                <View style={styles.introBadge}><Text style={styles.introBadgeText}>Up to 100 XP</Text></View>
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => goToStep('slide1')} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>Start Demo Lesson →</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'slide1' && (
            <View style={styles.stepContainer}>
              <View style={styles.slideTag}><Text style={styles.slideTagText}>SLIDE 1 OF 2</Text></View>
              <Text style={styles.slideTitle}>{DEMO_SLIDES[0].title}</Text>
              <View style={styles.slideDivider} />
              <Text style={styles.slideBody}>{DEMO_SLIDES[0].body}</Text>
              <View style={styles.insightBox}>
                <Text style={styles.insightLabel}>KEY INSIGHT</Text>
                <Text style={styles.insightText}>{DEMO_SLIDES[0].insight}</Text>
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => { awardXP(25); goToStep('slide2'); }} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'slide2' && (
            <View style={styles.stepContainer}>
              <View style={styles.slideTag}><Text style={styles.slideTagText}>SLIDE 2 OF 2</Text></View>
              <Text style={styles.slideTitle}>{DEMO_SLIDES[1].title}</Text>
              <View style={styles.slideDivider} />
              <Text style={styles.slideBody}>{DEMO_SLIDES[1].body}</Text>
              <View style={styles.insightBox}>
                <Text style={styles.insightLabel}>KEY INSIGHT</Text>
                <Text style={styles.insightText}>{DEMO_SLIDES[1].insight}</Text>
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => { awardXP(25); goToStep('quiz'); }} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>Take the Quiz →</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'quiz' && (
            <View style={styles.stepContainer}>
              <View style={[styles.slideTag, { backgroundColor: COLORS.goldSoft }]}>
                <Text style={[styles.slideTagText, { color: COLORS.gold }]}>QUIZ</Text>
              </View>
              <Text style={styles.slideTitle}>{DEMO_QUIZ.question}</Text>
              <View style={{ gap: 10, marginTop: 16 }}>
                {DEMO_QUIZ.options.map((opt, idx) => {
                  const isSelected = selectedQuiz === idx;
                  const showResult = selectedQuiz !== null;
                  const isCorrect = opt.correct;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.quizOption,
                        isSelected && !showResult && styles.quizOptionSelected,
                        showResult && isCorrect && styles.quizOptionCorrect,
                        showResult && isSelected && !isCorrect && styles.quizOptionWrong,
                      ]}
                      onPress={() => handleQuizSelect(idx)}
                      disabled={selectedQuiz !== null}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.quizLetter, showResult && isCorrect && { backgroundColor: COLORS.successSoft }]}>
                        <Text style={styles.quizLetterText}>{String.fromCharCode(65 + idx)}</Text>
                      </View>
                      <Text style={styles.quizOptionText}>{opt.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 'quiz-result' && (
            <View style={styles.stepContainer}>
              {DEMO_QUIZ.options[selectedQuiz!]?.correct ? (
                <><Text style={styles.resultTitle}>Correct!</Text></>
              ) : (
                <><Text style={styles.resultTitle}>Not quite</Text></>
              )}
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackText}>{DEMO_QUIZ.options[selectedQuiz!]?.feedback}</Text>
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => goToStep('gate')} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>See Your Results →</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'gate' && (
            <View style={styles.stepContainer}>
              <Image source={require('../../assets/mascot/leo-reference.png')} style={{ width: 64, height: 64, resizeMode: 'contain', alignSelf: 'center' }} />
              <Text style={styles.gateTitle}>Demo Complete!</Text>
              <View style={styles.gateXPBox}>
                <Text style={styles.gateXPAmount}>{totalXP} XP earned</Text>
                <Text style={styles.gateXPLabel}>This XP will be credited to your account</Text>
              </View>
              <Text style={styles.gateBody}>
                You just scratched the surface of the AI market.{'\n\n'}
                Sign up to unlock 180 days of lessons across 15+ industries, trainer scenarios, speed drills, and more.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={onSignUp} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>Create Account — Keep My XP</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn} onPress={onClose}>
                <Text style={styles.ghostBtnText}>I already have an account</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const xpStyles = StyleSheet.create({
  burst: {
    position: 'absolute', top: 60, right: 24, zIndex: 50,
    backgroundColor: COLORS.goldSoft, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  burstText: { fontSize: 14, fontWeight: '700', color: COLORS.gold },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  xpBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
  },
  closeBtn: { fontSize: 18, color: COLORS.textMuted, fontWeight: '600' },
  xpChip: { backgroundColor: COLORS.goldSoft, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  xpChipText: { fontSize: 13, fontWeight: '700', color: COLORS.gold },
  progressDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.surfaceLight },
  dotActive: { backgroundColor: COLORS.accent },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  stepContainer: { paddingTop: 12 },
  introMascot: { width: 120, height: 120, alignSelf: 'center', marginBottom: 16 },
  introTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  introSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  introBadges: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 },
  introBadge: { backgroundColor: COLORS.accentSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  introBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.accent },
  slideTag: { backgroundColor: COLORS.successSoft, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
  slideTagText: { fontSize: 10, fontWeight: '700', color: COLORS.success, letterSpacing: 0.8 },
  slideTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 28, marginBottom: 12 },
  slideDivider: { height: 2, backgroundColor: 'rgba(139, 92, 246, 0.2)', borderRadius: 1, marginBottom: 14 },
  slideBody: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 16 },
  insightBox: {
    backgroundColor: COLORS.accentSoft, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 12, padding: 14, marginBottom: 24,
  },
  insightLabel: { fontSize: 10, fontWeight: '700', color: COLORS.accent, marginBottom: 6, letterSpacing: 0.5 },
  insightText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, fontStyle: 'italic' },
  quizOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bg2,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  quizOptionSelected: { borderColor: 'rgba(139, 92, 246, 0.4)' },
  quizOptionCorrect: { borderColor: 'rgba(34, 197, 94, 0.4)', backgroundColor: COLORS.successSoft },
  quizOptionWrong: { borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: COLORS.errorSoft },
  quizLetter: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  quizLetterText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  quizOptionText: { flex: 1, fontSize: 13, color: COLORS.textPrimary, lineHeight: 18 },
  resultEmoji: { fontSize: 56, textAlign: 'center', marginBottom: 12, marginTop: 20 },
  resultTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 16 },
  feedbackBox: { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  feedbackText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  gateEmoji: { fontSize: 56, textAlign: 'center', marginTop: 20, marginBottom: 12 },
  gateTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 16 },
  gateXPBox: {
    backgroundColor: COLORS.goldSoft, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20,
  },
  gateXPAmount: { fontSize: 22, fontWeight: '800', color: COLORS.gold, marginBottom: 4 },
  gateXPLabel: { fontSize: 12, color: COLORS.textMuted },
  gateBody: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  primaryBtn: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  ghostBtn: { alignItems: 'center', paddingVertical: 12 },
  ghostBtnText: { fontSize: 14, color: COLORS.textMuted },
});
