import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptics';

// ─── Types ───
interface MathProblem {
  question: string;
  answer: number;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  type: 'arithmetic' | 'business';
}

interface MentalMathTabProps {
  marketName: string;
  marketId: string;
}

// ─── Industry-specific business math problems ───
const BUSINESS_MATH_BY_INDUSTRY: Record<string, MathProblem[]> = {
  aerospace: [
    { question: 'A satellite costs $120M to build. If production costs drop 25%, what is the new cost?', answer: 90, options: ['$80M', '$90M', '$95M', '$100M'], correctIndex: 1, explanation: '$120M × 0.75 = $90M', type: 'business' },
    { question: 'An airline fleet of 50 planes each earns $8M/year. Total fleet revenue?', answer: 400, options: ['$300M', '$400M', '$450M', '$500M'], correctIndex: 1, explanation: '50 × $8M = $400M', type: 'business' },
    { question: 'Launch costs dropped from $10,000/kg to $2,700/kg. What is the % decline?', answer: 73, options: ['65%', '70%', '73%', '80%'], correctIndex: 2, explanation: '($10,000 - $2,700) / $10,000 = 73%', type: 'business' },
  ],
  ai: [
    { question: 'An AI model costs $4.6M to train. Cloud costs are 60% of that. What are cloud costs?', answer: 2.76, options: ['$2.3M', '$2.76M', '$3.0M', '$3.2M'], correctIndex: 1, explanation: '$4.6M × 0.60 = $2.76M', type: 'business' },
    { question: 'A SaaS AI product has 12,000 users paying $49/mo. Monthly revenue?', answer: 588000, options: ['$480K', '$540K', '$588K', '$620K'], correctIndex: 2, explanation: '12,000 × $49 = $588,000', type: 'business' },
    { question: 'GPU costs dropped from $15,000 to $9,000. What is the % decrease?', answer: 40, options: ['35%', '38%', '40%', '45%'], correctIndex: 2, explanation: '($15K - $9K) / $15K = 40%', type: 'business' },
  ],
  fintech: [
    { question: 'A neobank has 500K users. Average revenue per user is $24/year. Annual revenue?', answer: 12, options: ['$8M', '$10M', '$12M', '$15M'], correctIndex: 2, explanation: '500K × $24 = $12M', type: 'business' },
    { question: 'A stock price dropped from $50 to $12. Calculate the % decline.', answer: 76, options: ['70%', '74%', '76%', '80%'], correctIndex: 2, explanation: '($50 - $12) / $50 = 76%', type: 'business' },
    { question: 'Processing 2M transactions/day at $0.03 fee each. Daily revenue?', answer: 60000, options: ['$40K', '$50K', '$60K', '$80K'], correctIndex: 2, explanation: '2M × $0.03 = $60,000', type: 'business' },
  ],
  default: [
    { question: 'Revenue grew from $2M to $3.2M. What is the growth rate?', answer: 60, options: ['50%', '55%', '60%', '65%'], correctIndex: 2, explanation: '($3.2M - $2M) / $2M = 60%', type: 'business' },
    { question: 'A company has 40% margins on $5M revenue. What is the profit?', answer: 2, options: ['$1.5M', '$2M', '$2.5M', '$3M'], correctIndex: 1, explanation: '$5M × 0.40 = $2M', type: 'business' },
    { question: 'Market size is $50B. You capture 0.5%. What is your revenue?', answer: 250, options: ['$200M', '$250M', '$300M', '$500M'], correctIndex: 1, explanation: '$50B × 0.005 = $250M', type: 'business' },
  ],
};

// ─── Arithmetic problem generator ───
function generateArithmeticProblem(difficulty: number): MathProblem {
  const ops = ['+', '−', '×', '÷', '%'];
  const op = ops[Math.floor(Math.random() * (difficulty > 2 ? 5 : difficulty > 1 ? 4 : 3))];
  let a: number, b: number, answer: number, question: string;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * (difficulty * 50)) + 10;
      b = Math.floor(Math.random() * (difficulty * 50)) + 10;
      answer = a + b;
      question = `${a} + ${b}`;
      break;
    case '−':
      a = Math.floor(Math.random() * (difficulty * 50)) + 50;
      b = Math.floor(Math.random() * a);
      answer = a - b;
      question = `${a} − ${b}`;
      break;
    case '×':
      a = Math.floor(Math.random() * (difficulty * 8)) + 3;
      b = Math.floor(Math.random() * (difficulty * 8)) + 3;
      answer = a * b;
      question = `${a} × ${b}`;
      break;
    case '÷':
      b = Math.floor(Math.random() * 12) + 2;
      answer = Math.floor(Math.random() * 20) + 2;
      a = b * answer;
      question = `${a} ÷ ${b}`;
      break;
    case '%':
    default:
      const percents = [10, 15, 20, 25, 30, 40, 50];
      b = percents[Math.floor(Math.random() * percents.length)];
      a = Math.floor(Math.random() * 400 + 100);
      a = Math.round(a / 10) * 10;
      answer = (a * b) / 100;
      question = `${b}% of ${a}`;
      break;
  }

  return { question, answer, type: 'arithmetic' };
}

// ─── Custom Keypad ───
function NumericKeypad({ value, onChange, onSubmit, disabled }: {
  value: string; onChange: (v: string) => void; onSubmit: () => void; disabled: boolean;
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  return (
    <View style={kp.container}>
      <View style={kp.display}>
        <Text style={[kp.displayText, !value && kp.displayPlaceholder]}>
          {value || 'Your answer'}
        </Text>
      </View>
      <View style={kp.grid}>
        {keys.map((key) => (
          <TouchableOpacity
            key={key}
            disabled={disabled}
            onPress={() => {
              triggerHaptic('light');
              if (key === '⌫') onChange(value.slice(0, -1));
              else onChange(value + key);
            }}
            style={[kp.key, key === '⌫' && kp.keyDelete]}
          >
            <Text style={[kp.keyText, key === '⌫' && kp.keyDeleteText]}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[kp.submitKey, (!value || disabled) && { opacity: 0.4 }]}
        disabled={!value || disabled}
        onPress={onSubmit}
      >
        <Text style={kp.submitKeyText}>Check Answer</Text>
        <Feather name="check" size={18} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Component ───
export function MentalMathTab({ marketName, marketId }: MentalMathTabProps) {
  const [mode, setMode] = useState<'arithmetic' | 'business'>('arithmetic');
  const [difficulty, setDifficulty] = useState(1);
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [timer, setTimer] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [businessIndex, setBusinessIndex] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const businessProblems = BUSINESS_MATH_BY_INDUSTRY[marketId] || BUSINESS_MATH_BY_INDUSTRY.default;

  const nextArithmetic = useCallback(() => {
    setProblem(generateArithmeticProblem(difficulty));
    setInputValue('');
    setResult(null);
  }, [difficulty]);

  const nextBusiness = useCallback(() => {
    const idx = businessIndex % businessProblems.length;
    setProblem(businessProblems[idx]);
    setBusinessIndex(idx + 1);
    setSelectedOption(null);
    setResult(null);
  }, [businessIndex, businessProblems]);

  useEffect(() => {
    if (mode === 'arithmetic') nextArithmetic();
    else nextBusiness();
  }, [mode]);

  // Timer
  useEffect(() => {
    if (!timerActive || timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timerActive, timer]);

  useEffect(() => {
    if (timer === 0 && timerActive) {
      setTimerActive(false);
      triggerHaptic('error');
    }
  }, [timer, timerActive]);

  const checkArithmeticAnswer = () => {
    if (!problem) return;
    const userAnswer = parseFloat(inputValue);
    const isCorrect = Math.abs(userAnswer - problem.answer) < 0.01;
    setResult(isCorrect ? 'correct' : 'wrong');
    setTotalAttempted(t => t + 1);
    triggerHaptic(isCorrect ? 'success' : 'error');
    if (isCorrect) {
      setTotalCorrect(t => t + 1);
      setStreak(s => s + 1);
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      setStreak(0);
    }
  };

  const checkBusinessAnswer = (optIndex: number) => {
    if (!problem) return;
    setSelectedOption(optIndex);
    const isCorrect = optIndex === problem.correctIndex;
    setResult(isCorrect ? 'correct' : 'wrong');
    setTotalAttempted(t => t + 1);
    triggerHaptic(isCorrect ? 'success' : 'error');
    if (isCorrect) { setTotalCorrect(t => t + 1); setStreak(s => s + 1); }
    else setStreak(0);
  };

  const nextQuestion = () => {
    if (mode === 'arithmetic') nextArithmetic();
    else nextBusiness();
  };

  const startTimedDrill = () => {
    setTimer(60);
    setTimerActive(true);
    setTotalCorrect(0);
    setTotalAttempted(0);
    setStreak(0);
    nextQuestion();
  };

  return (
    <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={st.sectionHeader}>
        <View style={st.sectionIconBg}>
          <Feather name="hash" size={18} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.sectionTitle}>Mental Math</Text>
          <Text style={st.sectionSubtitle}>{marketName} • Quick calculations</Text>
        </View>
        {streak >= 3 && (
          <Animated.View style={[st.streakBadge, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={st.streakText}>🔥 {streak}</Text>
          </Animated.View>
        )}
      </View>

      {/* Mode Toggle */}
      <View style={st.modeToggle}>
        <TouchableOpacity
          onPress={() => { setMode('arithmetic'); triggerHaptic('light'); }}
          style={[st.modeBtn, mode === 'arithmetic' && st.modeBtnActive]}
        >
          <Feather name="zap" size={14} color={mode === 'arithmetic' ? '#FFF' : COLORS.textMuted} />
          <Text style={[st.modeBtnText, mode === 'arithmetic' && st.modeBtnTextActive]}>Quick Drill</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { setMode('business'); triggerHaptic('light'); }}
          style={[st.modeBtn, mode === 'business' && st.modeBtnActive]}
        >
          <Feather name="briefcase" size={14} color={mode === 'business' ? '#FFF' : COLORS.textMuted} />
          <Text style={[st.modeBtnText, mode === 'business' && st.modeBtnTextActive]}>Business Math</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={st.statsRow}>
        <View style={st.statItem}>
          <Text style={st.statValue}>{totalCorrect}</Text>
          <Text style={st.statLabel}>Correct</Text>
        </View>
        <View style={st.statDivider} />
        <View style={st.statItem}>
          <Text style={st.statValue}>{totalAttempted}</Text>
          <Text style={st.statLabel}>Attempted</Text>
        </View>
        <View style={st.statDivider} />
        <View style={st.statItem}>
          <Text style={[st.statValue, { color: '#F97316' }]}>{streak}</Text>
          <Text style={st.statLabel}>Streak</Text>
        </View>
        {timerActive && (
          <>
            <View style={st.statDivider} />
            <View style={st.statItem}>
              <Text style={[st.statValue, timer <= 10 ? { color: '#EF4444' } : {}]}>{timer}s</Text>
              <Text style={st.statLabel}>Timer</Text>
            </View>
          </>
        )}
      </View>

      {/* Difficulty selector (arithmetic only) */}
      {mode === 'arithmetic' && (
        <View style={st.difficultyRow}>
          {[1, 2, 3].map(d => (
            <TouchableOpacity
              key={d}
              onPress={() => { setDifficulty(d); triggerHaptic('light'); nextArithmetic(); }}
              style={[st.diffBtn, difficulty === d && st.diffBtnActive]}
            >
              <Text style={[st.diffBtnText, difficulty === d && st.diffBtnTextActive]}>
                {d === 1 ? 'Easy' : d === 2 ? 'Medium' : 'Hard'}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={startTimedDrill} style={st.timerBtn}>
            <Feather name="clock" size={14} color="#EF4444" />
            <Text style={st.timerBtnText}>60s Drill</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Timer expired */}
      {!timerActive && timer === 0 && (
        <View style={st.timerEndCard}>
          <Text style={st.timerEndTitle}>⏱ Time's Up!</Text>
          <Text style={st.timerEndScore}>{totalCorrect} / {totalAttempted} correct</Text>
          <TouchableOpacity style={st.primaryBtn} onPress={startTimedDrill}>
            <Text style={st.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Problem Card */}
      {problem && (timer > 0 || !timerActive) && (
        <View style={st.problemCard}>
          <View style={st.problemBadge}>
            <Text style={st.problemBadgeText}>{mode === 'arithmetic' ? 'QUICK MATH' : `${marketName.toUpperCase()} SCENARIO`}</Text>
          </View>
          <Text style={st.problemQuestion}>{problem.question}</Text>

          {mode === 'arithmetic' ? (
            <>
              <NumericKeypad
                value={inputValue}
                onChange={setInputValue}
                onSubmit={checkArithmeticAnswer}
                disabled={result !== null}
              />
              {result && (
                <View style={[st.resultBanner, result === 'correct' ? st.resultCorrect : st.resultWrong]}>
                  <Feather name={result === 'correct' ? 'check-circle' : 'x-circle'} size={20} color={result === 'correct' ? '#059669' : '#DC2626'} />
                  <View style={{ flex: 1 }}>
                    <Text style={[st.resultText, { color: result === 'correct' ? '#059669' : '#DC2626' }]}>
                      {result === 'correct' ? 'Correct!' : `Answer: ${problem.answer}`}
                    </Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              {problem.options?.map((opt, i) => {
                const revealed = selectedOption !== null;
                const isCorrect = i === problem.correctIndex;
                const isSelected = selectedOption === i;
                return (
                  <TouchableOpacity
                    key={i}
                    disabled={revealed}
                    onPress={() => checkBusinessAnswer(i)}
                    style={[
                      st.optionBtn,
                      revealed && isCorrect && st.optionCorrect,
                      isSelected && !isCorrect && st.optionWrong,
                    ]}
                  >
                    <View style={[st.optionRadio, revealed && isCorrect && st.optionRadioCorrect, isSelected && !isCorrect && st.optionRadioWrong]}>
                      {revealed && isCorrect && <Feather name="check" size={12} color="#FFF" />}
                      {isSelected && !isCorrect && <Feather name="x" size={12} color="#FFF" />}
                    </View>
                    <Text style={[st.optionText, revealed && isCorrect && { color: '#059669', fontWeight: '600' }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
              {result && problem.explanation && (
                <View style={st.explanationBox}>
                  <Feather name="info" size={14} color="#3B82F6" />
                  <Text style={st.explanationText}>{problem.explanation}</Text>
                </View>
              )}
            </>
          )}

          {result && (
            <TouchableOpacity style={st.nextBtn} onPress={nextQuestion}>
              <Text style={st.nextBtnText}>Next Problem</Text>
              <Feather name="arrow-right" size={16} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const kp = StyleSheet.create({
  container: { marginTop: 12 },
  display: { padding: 16, borderRadius: 12, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, minHeight: 52, justifyContent: 'center' },
  displayText: { ...TYPE.h2, color: COLORS.textPrimary, textAlign: 'center' },
  displayPlaceholder: { color: COLORS.textMuted, fontSize: 15, fontWeight: '400' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  key: { width: '30.5%', paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  keyText: { ...TYPE.h3, color: COLORS.textPrimary },
  keyDelete: { backgroundColor: 'rgba(239,68,68,0.06)' },
  keyDeleteText: { color: '#EF4444' },
  submitKey: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, paddingVertical: 14, borderRadius: 14, backgroundColor: '#7C3AED', ...SHADOWS.accent },
  submitKeyText: { ...TYPE.bodyBold, color: '#FFF', fontSize: 16 },
});

const st = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sectionIconBg: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...TYPE.h2, color: COLORS.textPrimary },
  sectionSubtitle: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 11, marginTop: 1 },

  streakBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.12)' },
  streakText: { ...TYPE.bodyBold, color: '#F97316', fontSize: 14 },

  modeToggle: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.bg1, borderWidth: 1.5, borderColor: COLORS.border },
  modeBtnActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  modeBtnText: { ...TYPE.bodyBold, color: COLORS.textMuted, fontSize: 13 },
  modeBtnTextActive: { color: '#FFF' },

  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 14, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, ...SHADOWS.sm },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { ...TYPE.h2, color: COLORS.textPrimary },
  statLabel: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  difficultyRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  diffBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  diffBtnActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  diffBtnText: { ...TYPE.bodyBold, color: COLORS.textMuted, fontSize: 12 },
  diffBtnTextActive: { color: '#FFF' },
  timerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#EF4444' },
  timerBtnText: { ...TYPE.caption, color: '#EF4444', fontSize: 11 },

  timerEndCard: { alignItems: 'center', padding: 28, borderRadius: 18, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, ...SHADOWS.md },
  timerEndTitle: { ...TYPE.h1, color: COLORS.textPrimary, marginBottom: 8 },
  timerEndScore: { ...TYPE.h3, color: '#7C3AED', marginBottom: 16 },

  problemCard: { padding: 20, borderRadius: 18, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.md },
  problemBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(124,58,237,0.1)', marginBottom: 12 },
  problemBadgeText: { ...TYPE.overline, color: '#7C3AED', fontSize: 9 },
  problemQuestion: { ...TYPE.h2, color: COLORS.textPrimary, marginBottom: 4, lineHeight: 28 },

  optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, marginTop: 8, gap: 12 },
  optionCorrect: { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.06)' },
  optionWrong: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.06)' },
  optionRadio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  optionRadioCorrect: { backgroundColor: '#10B981', borderColor: '#10B981' },
  optionRadioWrong: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  optionText: { ...TYPE.body, color: COLORS.textPrimary, flex: 1 },

  explanationBox: { flexDirection: 'row', gap: 8, marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.06)' },
  explanationText: { ...TYPE.body, color: COLORS.textSecondary, fontSize: 13, lineHeight: 19, flex: 1 },

  resultBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginTop: 12 },
  resultCorrect: { backgroundColor: 'rgba(16,185,129,0.08)' },
  resultWrong: { backgroundColor: 'rgba(239,68,68,0.08)' },
  resultText: { ...TYPE.bodyBold, fontSize: 15 },

  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 14, borderRadius: 14, backgroundColor: '#7C3AED', ...SHADOWS.accent },
  nextBtnText: { ...TYPE.bodyBold, color: '#FFF', fontSize: 15 },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, backgroundColor: '#7C3AED', ...SHADOWS.accent },
  primaryBtnText: { ...TYPE.bodyBold, color: '#FFF', fontSize: 15 },
});
