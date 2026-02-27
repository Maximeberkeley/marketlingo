import React, { useState, useEffect } from 'react';
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
import { triggerHaptic } from '../lib/haptics';

interface GameQuestion {
  id: string;
  type: 'match' | 'timeline' | 'predict';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  pattern: string;
}

export default function GamesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);

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

      // Use trainer_scenarios which have proper correct_option_index
      const { data: scenarios, error } = await supabase
        .from('trainer_scenarios')
        .select('id, scenario, question, options, correct_option_index, feedback_pro_reasoning, tags')
        .eq('market_id', market)
        .limit(5);

      if (error || !scenarios?.length) {
        // Fallback: try game stacks but parse correct answer from content
        const { data: stacks } = await supabase
          .from('stacks')
          .select('id, title, tags, slides (id, slide_number, title, body)')
          .eq('market_id', market)
          .contains('tags', ['DAILY_GAME'])
          .not('published_at', 'is', null)
          .order('created_at', { ascending: true })
          .limit(5);

        if (stacks?.length) {
          const gameQuestions: GameQuestion[] = stacks.map((stack, index) => {
            const slides = ((stack as any).slides as any[]) || [];
            const sorted = slides.sort((a: any, b: any) => a.slide_number - b.slide_number);
            const questionSlide = sorted[0]?.body || stack.title;
            const rawOptions = sorted.slice(1, 5).map((s: any) => (s.body || s.title || '').substring(0, 80));
            const baseOptions = rawOptions.length >= 4 ? rawOptions : [
              rawOptions[0] || 'First key insight',
              rawOptions[1] || 'Second consideration',
              rawOptions[2] || 'Alternative perspective',
              rawOptions[3] || 'Industry best practice',
            ];
            
            // Try to find correct answer tag e.g. "correct:2", default to random
            const correctTag = (stack.tags as string[])?.find((t: string) => t.startsWith('correct:'));
            const correctIdx = correctTag ? parseInt(correctTag.split(':')[1], 10) : Math.floor(Math.random() * baseOptions.length);

            const types: Array<'match' | 'timeline' | 'predict'> = ['match', 'timeline', 'predict'];
            return {
              id: stack.id,
              type: types[index % 3],
              question: `${stack.title}: ${questionSlide}`.substring(0, 150),
              options: baseOptions,
              correctAnswer: Math.min(correctIdx, baseOptions.length - 1),
              explanation: sorted[sorted.length - 1]?.body?.substring(0, 280) || stack.title,
              pattern: (sorted.find((s: any) => s.body?.toLowerCase().includes('pattern:'))?.body || stack.title).substring(0, 60),
            };
          });
          setQuestions(gameQuestions);
        }

        setLoading(false);
        return;
      }

      // Map trainer_scenarios to game questions
      const types: Array<'match' | 'timeline' | 'predict'> = ['match', 'timeline', 'predict'];
      const gameQuestions: GameQuestion[] = scenarios.map((scenario, index) => {
        const opts = Array.isArray(scenario.options)
          ? (scenario.options as string[])
          : typeof scenario.options === 'object'
            ? Object.values(scenario.options as Record<string, string>)
            : ['Option A', 'Option B', 'Option C', 'Option D'];

        return {
          id: scenario.id,
          type: types[index % 3],
          question: scenario.question || scenario.scenario,
          options: opts.map((o: any) => String(o).substring(0, 120)),
          correctAnswer: scenario.correct_option_index,
          explanation: scenario.feedback_pro_reasoning || scenario.scenario,
          pattern: ((scenario.tags as string[]) || [])[0] || 'Industry Pattern',
        };
      });

      setQuestions(gameQuestions);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const question = questions[currentQuestion];
  const isCorrect = selectedAnswer === question?.correctAnswer;

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === question.correctAnswer) {
      setScore((prev) => prev + 1);
      triggerHaptic('success');
    } else {
      triggerHaptic('warning');
    }
  };

  const handleNext = async () => {
    triggerHaptic('light');
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      const finalScore = score + (isCorrect ? 1 : 0);
      if (user && selectedMarket) {
        await supabase.from('games_progress').upsert({
          user_id: user.id,
          market_id: selectedMarket,
          game_type: 'pattern_match',
          score: finalScore,
          level: 1,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,market_id,game_type' });
      }
      triggerHaptic('success');
      setGameComplete(true);
    }
  };

  const typeEmoji: Record<string, string> = { match: '🎯', timeline: '⚡', predict: '🏆' };

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
            <LeoCharacter size="xl" animation="celebrating" />
            <Text style={styles.introMsg}>Game time! Pick the right answers and learn the patterns! 🎮</Text>
          </View>
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Industry Games</Text>
            <Text style={styles.heroTitle}>Test Your Knowledge</Text>
            <Text style={styles.heroDesc}>Quick MCQ challenges based on real industry patterns.</Text>
          </View>
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>What to expect</Text>
            {['Multiple choice questions', 'Instant feedback with explanations', 'Startup application tips', 'Track your score'].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.featureDot, { backgroundColor: COLORS.accent }]} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.ctaButton} onPress={() => { triggerHaptic('medium'); setShowIntro(false); }}>
            <Text style={styles.ctaText}>Start Game →</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🎮</Text>
        <Text style={styles.emptyTitle}>No games available</Text>
        <Text style={styles.emptySubtitle}>Complete more lessons to unlock games!</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.back()}>
          <Text style={styles.ctaText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (gameComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.completeIcon}>
          <Text style={{ fontSize: 32 }}>🏆</Text>
        </View>
        <Text style={styles.completeTitle}>Game Complete!</Text>
        <Text style={styles.completeScore}>You scored {score}/{questions.length} ({percentage}%)</Text>
        <Text style={styles.completeFeedback}>
          {percentage >= 80 ? "🔥 Excellent! You're a market pro." : percentage >= 60 ? '👍 Good job! Keep practicing.' : '📚 Review the lessons and try again.'}
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
              setGameComplete(false);
            }}
          >
            <Text style={styles.ctaText}>Play Again</Text>
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
            <Text style={styles.headerTitle}>Games</Text>
            <Text style={styles.headerSub}>Question {currentQuestion + 1} of {questions.length}</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>🏆 {score}</Text>
          </View>
        </View>

        <ProgressBar progress={((currentQuestion + 1) / questions.length) * 100} height={4} />

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{typeEmoji[question.type] || '🎮'} {question.type.toUpperCase()}</Text>
          </View>
          <View style={styles.chipSecondary}>
            <Text style={styles.chipSecondaryText}>{question.pattern}</Text>
          </View>
        </View>

        <Text style={styles.questionText}>{question.question}</Text>

        <View style={{ gap: 10 }}>
          {question.options.map((opt, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrectOpt = idx === question.correctAnswer;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionCard,
                  showResult && isCorrectOpt && styles.optionCorrect,
                  showResult && isSelected && !isCorrectOpt && styles.optionWrong,
                  isSelected && !showResult && styles.optionSelected,
                ]}
                onPress={() => handleAnswer(idx)}
                disabled={showResult}
              >
                <View style={[
                  styles.optionLetter,
                  showResult && isCorrectOpt && { backgroundColor: '#22C55E' },
                  showResult && isSelected && !isCorrectOpt && { backgroundColor: '#EF4444' },
                ]}>
                  <Text style={styles.optionLetterText}>
                    {showResult && isCorrectOpt ? '✓' : String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {showResult && (
          <View style={[styles.feedbackCard, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <Text style={[styles.feedbackTitle, { color: isCorrect ? '#22C55E' : '#F59E0B' }]}>
              {isCorrect ? '✅ Correct!' : '⚠️ Not quite'}
            </Text>
            <Text style={styles.feedbackBody}>{question.explanation}</Text>
            <TouchableOpacity style={styles.ctaButton} onPress={handleNext}>
              <Text style={styles.ctaText}>
                {currentQuestion < questions.length - 1 ? 'Next Question →' : 'See Results'}
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
  scoreBadge: { backgroundColor: 'rgba(139, 92, 246, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  scoreBadgeText: { fontSize: 13, fontWeight: '600', color: COLORS.accent },
  introCenter: { alignItems: 'center', marginBottom: 20 },
  introMsg: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  heroCard: {
    padding: 20, borderRadius: 16, marginBottom: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.12)', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  heroLabel: { fontSize: 12, color: 'rgba(139, 92, 246, 0.8)', fontWeight: '500', marginBottom: 4 },
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
  chipRow: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  chip: { backgroundColor: 'rgba(139, 92, 246, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  chipText: { fontSize: 11, fontWeight: '600', color: COLORS.accent },
  chipSecondary: { backgroundColor: COLORS.bg2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  chipSecondaryText: { fontSize: 11, color: COLORS.textMuted },
  questionText: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 16, lineHeight: 26 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  optionSelected: { borderColor: 'rgba(139, 92, 246, 0.5)' },
  optionCorrect: { borderColor: 'rgba(34, 197, 94, 0.5)', backgroundColor: 'rgba(34, 197, 94, 0.08)' },
  optionWrong: { borderColor: 'rgba(239, 68, 68, 0.5)', backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  optionLetter: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  optionText: { flex: 1, fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  feedbackCard: { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1 },
  feedbackCorrect: { borderColor: 'rgba(34, 197, 94, 0.3)' },
  feedbackWrong: { borderColor: 'rgba(245, 158, 11, 0.3)' },
  feedbackTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  feedbackBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 12 },
  completeIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(34, 197, 94, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  completeTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  completeScore: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 4 },
  completeFeedback: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
  secondaryBtn: { paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  secondaryBtnText: { fontSize: 15, color: COLORS.textSecondary },
});
