import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { LeoCharacter } from '../components/mascot/LeoCharacter';
import { ProgressBar } from '../components/ui/ProgressBar';

interface DrillQuestion {
  id: string;
  category: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  source: string;
}

export default function DrillsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<DrillQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [drillComplete, setDrillComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_market')
        .eq('id', user.id)
        .single();

      const market = profile?.selected_market || 'aerospace';
      setSelectedMarket(market);

      const { data: stacks, error } = await supabase
        .from('stacks')
        .select('id, title, tags, slides (id, slide_number, title, body, sources)')
        .eq('market_id', market)
        .not('published_at', 'is', null)
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching drills:', error);
        setLoading(false);
        return;
      }

      const drillQuestions: DrillQuestion[] = [];
      (stacks || []).forEach((stack) => {
        const slides = ((stack as any).slides as any[]) || [];
        const tags = (stack.tags as string[]) || [];
        const category = tags[0] || 'Market Insight';

        slides.forEach((slide: any, index: number) => {
          if (slide.body && slide.body.length > 20 && drillQuestions.length < 10) {
            const isTrue = index % 2 === 0;
            let statement = slide.body;
            if (!isTrue) {
              statement = statement
                .replace(/always/gi, 'never')
                .replace(/important/gi, 'irrelevant')
                .replace(/key/gi, 'minor');
            }
            const sources = (slide.sources as any[]) || [];
            drillQuestions.push({
              id: slide.id,
              category,
              statement: statement.substring(0, 280),
              isTrue,
              explanation: slide.body.substring(0, 280),
              source: sources[0]?.label || 'Industry Analysis',
            });
          }
        });
      });

      setQuestions(drillQuestions.slice(0, 5));
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Timer
  useEffect(() => {
    if (!isTimerActive || showResult || loading || questions.length === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowResult(true);
          setIsTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive, showResult, currentQuestion, loading, questions.length]);

  const question = questions[currentQuestion];
  const isCorrect = selectedAnswer === question?.isTrue;

  const handleAnswer = (answer: boolean) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    setIsTimerActive(false);
    if (answer === question.isTrue) setScore((prev) => prev + 1);
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(15);
      setIsTimerActive(true);
    } else {
      const finalScore = score + (isCorrect ? 1 : 0);
      if (user && selectedMarket) {
        await supabase.from('drills_progress').upsert({
          user_id: user.id,
          market_id: selectedMarket,
          drill_type: 'true_false',
          completed_count: 1,
          correct_count: finalScore,
          last_completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,market_id,drill_type' });
      }
      setDrillComplete(true);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (showIntro && questions.length > 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.introCenter}>
            <LeoCharacter size="xl" animation="success" />
            <Text style={styles.introMsg}>Let's test your instincts! 15 seconds per question — trust your gut! 🎯</Text>
          </View>
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Industry Drills</Text>
            <Text style={styles.heroTitle}>15-Second Challenges</Text>
            <Text style={styles.heroDesc}>Rapid-fire True/False to build pattern recognition.</Text>
          </View>
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>How it works</Text>
            {['15 seconds per question', 'True or False answers', 'Based on real industry facts', 'Build intuition fast'].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.featureDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => { setShowIntro(false); setIsTimerActive(true); }}
          >
            <Text style={styles.ctaText}>Start Drill →</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🎯</Text>
        <Text style={styles.emptyTitle}>No drills available</Text>
        <Text style={styles.emptySubtitle}>Complete more lessons to unlock drills!</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.back()}>
          <Text style={styles.ctaText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (drillComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={[styles.completeIcon, {
          backgroundColor: percentage >= 80 ? 'rgba(34, 197, 94, 0.2)' : percentage >= 60 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
        }]}>
          <Text style={[styles.completePercent, {
            color: percentage >= 80 ? '#22C55E' : percentage >= 60 ? '#F59E0B' : '#EF4444',
          }]}>{percentage}%</Text>
        </View>
        <Text style={styles.completeTitle}>Drill Complete!</Text>
        <Text style={styles.completeScore}>{score}/{questions.length} correct</Text>
        <Text style={styles.completeFeedback}>
          {percentage >= 80 ? "Excellent! You're market-fluent." : percentage >= 60 ? 'Good progress. Keep practicing!' : 'Review and try again.'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' }}>
          <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={() => router.back()}>
            <Text style={styles.secondaryBtnText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ctaButton, { flex: 1 }]}
            onPress={() => {
              setCurrentQuestion(0);
              setScore(0);
              setSelectedAnswer(null);
              setShowResult(false);
              setDrillComplete(false);
              setTimeLeft(15);
              setIsTimerActive(true);
            }}
          >
            <Text style={styles.ctaText}>🔄 Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>True or False</Text>
            <Text style={styles.headerSub}>{currentQuestion + 1} of {questions.length}</Text>
          </View>
          <View style={[styles.timerBadge, timeLeft <= 5 && styles.timerDanger]}>
            <Text style={[styles.timerText, timeLeft <= 5 && { color: '#EF4444' }]}>⏱ {timeLeft}s</Text>
          </View>
        </View>

        <ProgressBar progress={((currentQuestion + 1) / questions.length) * 100} height={4} />

        <View style={styles.categoryChip}>
          <Text style={styles.categoryText}>{question.category}</Text>
        </View>

        <Text style={styles.statementText}>{question.statement}</Text>

        {!showResult && (
          <View style={styles.answerRow}>
            <TouchableOpacity style={styles.falseBtn} onPress={() => handleAnswer(false)}>
              <Text style={styles.falseBtnText}>✗ False</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.trueBtn} onPress={() => handleAnswer(true)}>
              <Text style={styles.trueBtnText}>✓ True</Text>
            </TouchableOpacity>
          </View>
        )}

        {showResult && (
          <View style={[styles.feedbackCard,
            selectedAnswer === null ? styles.feedbackTimeout :
            isCorrect ? styles.feedbackCorrect : styles.feedbackWrong
          ]}>
            <Text style={[styles.feedbackTitle, {
              color: selectedAnswer === null ? '#F59E0B' : isCorrect ? '#22C55E' : '#EF4444',
            }]}>
              {selectedAnswer === null ? "⏱ Time's up!" : isCorrect ? '✅ Correct!' : '❌ Incorrect'}
            </Text>
            <Text style={styles.feedbackBody}>{question.explanation}</Text>
            <Text style={styles.feedbackSource}>Source: {question.source}</Text>
            <TouchableOpacity style={styles.ctaButton} onPress={handleNext}>
              <Text style={styles.ctaText}>
                {currentQuestion < questions.length - 1 ? 'Next →' : 'See Results'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  scrollContent: { paddingHorizontal: 16 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 15, color: COLORS.textSecondary },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 12, color: COLORS.textMuted },
  timerBadge: { backgroundColor: COLORS.bg2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  timerDanger: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  timerText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  introCenter: { alignItems: 'center', marginBottom: 20 },
  introMsg: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  heroCard: {
    padding: 20, borderRadius: 16, marginBottom: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.12)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  heroLabel: { fontSize: 12, color: 'rgba(245, 158, 11, 0.8)', fontWeight: '500', marginBottom: 4 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  heroDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  featuresCard: {
    backgroundColor: COLORS.bg2, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  featuresTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  featureDot: { width: 6, height: 6, borderRadius: 3 },
  featureText: { fontSize: 14, color: COLORS.textSecondary },
  ctaButton: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 20 },
  categoryChip: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginVertical: 16,
  },
  categoryText: { fontSize: 11, fontWeight: '600', color: COLORS.accent },
  statementText: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 28, marginBottom: 24 },
  answerRow: { flexDirection: 'row', gap: 12 },
  falseBtn: {
    flex: 1, height: 56, borderRadius: 14, backgroundColor: COLORS.bg2,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  falseBtnText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  trueBtn: {
    flex: 1, height: 56, borderRadius: 14, backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  trueBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  feedbackCard: { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1 },
  feedbackCorrect: { borderColor: 'rgba(34, 197, 94, 0.3)' },
  feedbackWrong: { borderColor: 'rgba(239, 68, 68, 0.3)' },
  feedbackTimeout: { borderColor: 'rgba(245, 158, 11, 0.3)' },
  feedbackTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  feedbackBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 6 },
  feedbackSource: { fontSize: 11, color: COLORS.textMuted, marginBottom: 12 },
  completeIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  completePercent: { fontSize: 24, fontWeight: '700' },
  completeTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  completeScore: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 4 },
  completeFeedback: { fontSize: 13, color: COLORS.textMuted },
  secondaryBtn: { paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  secondaryBtnText: { fontSize: 15, color: COLORS.textSecondary },
});
