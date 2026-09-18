import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated as RNAnimated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ProgressBar } from '../components/ui/ProgressBar';
import { triggerHaptic } from '../lib/haptics';
import { playSound } from '../lib/sounds';
import { Feather } from '@expo/vector-icons';
import { useStudiedLessons } from '../hooks/useStudiedLessons';
import { lessonStatements } from '../lesson-kit/practice/lessonQuestions';

const LEO_HAPPY = require('../assets/mascot/leo-celebrating.png');
const LEO_DIZZY = require('../assets/mascot/leo-dizzy.png');

function ScoreMascot({ isGoodScore }: { isGoodScore: boolean }) {
  const wobble = useRef(new RNAnimated.Value(0)).current;
  const scaleAnim = useRef(new RNAnimated.Value(0.5)).current;

  useEffect(() => {
    RNAnimated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    if (!isGoodScore) {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(wobble, { toValue: 1, duration: 300, useNativeDriver: true }),
          RNAnimated.timing(wobble, { toValue: -1, duration: 300, useNativeDriver: true }),
          RNAnimated.timing(wobble, { toValue: 0.5, duration: 200, useNativeDriver: true }),
          RNAnimated.timing(wobble, { toValue: -0.5, duration: 200, useNativeDriver: true }),
          RNAnimated.timing(wobble, { toValue: 0, duration: 150, useNativeDriver: true }),
          RNAnimated.delay(1500),
        ])
      ).start();
    }
  }, [isGoodScore]);

  const rotate = wobble.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-8deg', '0deg', '8deg'] });

  return (
    <RNAnimated.View style={{ transform: [{ scale: scaleAnim }, { rotate }], marginBottom: 12, alignItems: 'center' }}>
      <Image source={isGoodScore ? LEO_HAPPY : LEO_DIZZY} style={{ width: 180, height: 180 }} resizeMode="contain" />
    </RNAnimated.View>
  );
}

interface DrillQuestion {
  id: string;
  category: string;
  statement: string;
  is_true: boolean;
  explanation: string;
  source_label: string;
  set_number: number;
  question_number: number;
}

export default function DrillsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [allQuestions, setAllQuestions] = useState<DrillQuestion[]>([]);
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
  const [currentSet, setCurrentSet] = useState(1);
  const [totalSets, setTotalSets] = useState(3);
  const [setsCompleted, setSetsCompleted] = useState(0);
  /** True while the questions on screen are not drawn from a studied lesson. */
  const [needsLessonQuestions, setNeedsLessonQuestions] = useState(false);
  const [lessonGrounded, setLessonGrounded] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const studied = useStudiedLessons(selectedMarket || undefined);

  // Drills must test the lessons this learner read. When the day's authored
  // drills are missing, statements are generated from their own studied slides
  // rather than from random market stacks.
  useEffect(() => {
    if (studied.isLoading || !studied.lessons.length) return;
    const built = lessonStatements(studied.lessons, 21);
    if (built.length < 7) return;
    const mapped: DrillQuestion[] = built.map((s, i) => ({
      id: s.id,
      category: s.category,
      statement: s.statement,
      is_true: s.isTrue,
      explanation: s.explanation,
      source_label: s.category,
      set_number: Math.floor(i / 7) + 1,
      question_number: (i % 7) + 1,
    }));
    setAllQuestions(mapped);
    setTotalSets(Math.max(1, Math.ceil(mapped.length / 7)));
    setQuestions(mapped.slice(0, 7));
    setNeedsLessonQuestions(false);
    setLessonGrounded(true);
    setLoading(false);
  }, [needsLessonQuestions, studied.isLoading, studied.lessons]);

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
          triggerHaptic('warning');
          return 0;
        }
        if (prev === 5) triggerHaptic('light');
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive, showResult, currentQuestion, loading, questions.length]);

  const question = questions[currentQuestion];
  const isCorrect = selectedAnswer === question?.is_true;

  const handleAnswer = (answer: boolean) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    setIsTimerActive(false);
    if (answer === question.is_true) {
      setScore((prev) => prev + 1);
      triggerHaptic('success');
      playSound('correct');
    } else {
      triggerHaptic('error');
      playSound('wrong');
    }
  };

  const handleNext = async () => {
    triggerHaptic('light');
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
      triggerHaptic('success');
      setSetsCompleted(prev => prev + 1);
      setDrillComplete(true);
    }
  };

  const handleNextSet = () => {
    // Load next set of questions
    const nextSetNum = currentSet + 1;
    const nextSetQuestions = allQuestions.filter(q => q.set_number === nextSetNum);

    if (nextSetQuestions.length >= 7) {
      setQuestions(nextSetQuestions.slice(0, 7).sort(() => Math.random() - 0.5));
    } else {
      // Pick unused questions
      const usedIds = new Set(questions.map(q => q.id));
      const unused = allQuestions.filter(q => !usedIds.has(q.id));
      if (unused.length >= 7) {
        setQuestions(unused.slice(0, 7).sort(() => Math.random() - 0.5));
      } else {
        // Re-shuffle all
        setQuestions(allQuestions.sort(() => Math.random() - 0.5).slice(0, 7));
      }
    }

    setCurrentSet(nextSetNum);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setDrillComplete(false);
    setTimeLeft(15);
    setShowIntro(false);
    setIsTimerActive(true);
  };

  if (loading || studied.isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!studied.lessons.length) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.heroTitle}>Drills unlock from your lessons</Text>
        <Text style={styles.heroDesc}>Complete a course lesson first. Your speed round will use only material you studied.</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.ctaText}>GO TO COURSE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!lessonGrounded) return null;

  if (showIntro && questions.length > 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <View style={styles.introCenter}>
            <Image source={require('../assets/cards/drills-hero.jpg')} style={styles.heroImage} resizeMode="contain" />
            <Text style={styles.introMsg}>15 seconds per question — trust your instincts!</Text>
          </View>
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>FROM YOUR COMPLETED LESSONS</Text>
            <Text style={styles.heroTitle}>Catch the Altered Claim</Text>
            <Text style={styles.heroDesc}>
              {totalSets >= 3
                ? `${totalSets} sets available today — test your understanding from different angles.`
                : 'Rapid-fire True/False to build pattern recognition.'}
            </Text>
          </View>

          {/* Set selector */}
          {totalSets > 1 && (
            <View style={styles.setSelector}>
              <Text style={styles.setSelectorTitle}>Choose a set</Text>
              <View style={styles.setGrid}>
                {Array.from({ length: Math.min(totalSets, 5) }, (_, i) => {
                  const setNum = i + 1;
                  const isCompleted = setNum < currentSet || (setNum === currentSet && setsCompleted > 0 && drillComplete);
                  const isCurrent = setNum === currentSet && !drillComplete;
                  return (
                    <TouchableOpacity
                      key={setNum}
                      style={[
                        styles.setCard,
                        isCurrent && styles.setCardActive,
                        isCompleted && styles.setCardDone,
                      ]}
                      onPress={() => {
                        if (setNum !== currentSet) {
                          setCurrentSet(setNum);
                          const setQs = allQuestions.filter(q => q.set_number === setNum);
                          if (setQs.length >= 7) {
                            setQuestions(setQs.slice(0, 7).sort(() => Math.random() - 0.5));
                          }
                        }
                      }}
                    >
                      {isCompleted ? (
                        <Feather name="check-circle" size={20} color="#22C55E" />
                      ) : (
                        <Text style={[styles.setNumber, isCurrent && styles.setNumberActive]}>
                          {setNum}
                        </Text>
                      )}
                      <Text style={[styles.setLabel, isCurrent && styles.setLabelActive]}>
                        {setNum === 1 ? 'Core' : setNum === 2 ? 'Applied' : setNum === 3 ? 'Review' : `Set ${setNum}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>How it works</Text>
            {['15 seconds per question', 'True or False answers', 'Based on your lessons', '3 sets for deeper mastery'].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.featureDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => { triggerHaptic('medium'); setShowIntro(false); setIsTimerActive(true); }}
          >
            <Text style={styles.ctaText}>Start Set {currentSet} →</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Image source={require('../assets/cards/drills-hero.jpg')} style={{ width: 180, height: 180, marginBottom: 16 }} resizeMode="contain" />
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
    const hasMoreSets = currentSet < totalSets;
    const isGoodScore = percentage >= 80;
    return (
      <View style={[styles.container, styles.centered]}>
        <ScoreMascot isGoodScore={isGoodScore} />
        <Text style={styles.completeTitle}>Set {currentSet} Complete!</Text>
        <Text style={styles.completeScore}>{score}/{questions.length} correct</Text>
        <Text style={styles.completeFeedback}>
          {percentage >= 80 ? "Excellent! You've mastered this material." : percentage >= 60 ? 'Good progress. Try another set!' : 'Review the lessons and try again.'}
        </Text>

        {/* Sets progress */}
        <View style={styles.setsProgress}>
          {Array.from({ length: Math.min(totalSets, 5) }, (_, i) => (
            <View
              key={i}
              style={[
                styles.setDot,
                i + 1 <= setsCompleted && styles.setDotDone,
                i + 1 === currentSet && styles.setDotCurrent,
              ]}
            />
          ))}
        </View>
        <Text style={styles.setsProgressText}>{setsCompleted}/{Math.min(totalSets, 5)} sets completed today</Text>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' }}>
          <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={() => router.back()}>
            <Text style={styles.secondaryBtnText}>Home</Text>
          </TouchableOpacity>
          {hasMoreSets ? (
            <TouchableOpacity style={[styles.ctaButton, { flex: 1 }]} onPress={handleNextSet}>
              <Text style={styles.ctaText}>Next Set →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.ctaButton, { flex: 1 }]}
              onPress={() => {
                setCurrentSet(1);
                setSetsCompleted(0);
                setCurrentQuestion(0);
                setScore(0);
                setSelectedAnswer(null);
                setShowResult(false);
                setDrillComplete(false);
                setTimeLeft(15);
                setShowIntro(true);
              }}
            >
              <Text style={styles.ctaText}>Restart</Text>
            </TouchableOpacity>
          )}
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
            <Feather name="arrow-left" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Set {currentSet} · True or False</Text>
            <Text style={styles.headerSub}>{currentQuestion + 1} of {questions.length}</Text>
          </View>
          <View style={[styles.timerBadge, timeLeft <= 5 && styles.timerDanger]}>
            <Text style={[styles.timerText, timeLeft <= 5 && { color: '#EF4444' }]}>{timeLeft}s</Text>
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
              <Feather name="x" size={20} color="#EF4444" />
              <Text style={styles.falseBtnText}>False</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.trueBtn} onPress={() => handleAnswer(true)}>
              <Feather name="check" size={20} color="#22C55E" />
              <Text style={styles.trueBtnText}>True</Text>
            </TouchableOpacity>
          </View>
        )}

        {showResult && (
          <View style={[styles.feedbackCard,
            selectedAnswer === null ? styles.feedbackTimeout :
            isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <View style={styles.feedbackHeader}>
              <Feather
                name={selectedAnswer === null ? 'clock' : isCorrect ? 'check-circle' : 'x-circle'}
                size={20}
                color={selectedAnswer === null ? '#F59E0B' : isCorrect ? '#22C55E' : '#EF4444'}
              />
              <Text style={[styles.feedbackTitle, {
                color: selectedAnswer === null ? '#F59E0B' : isCorrect ? '#22C55E' : '#EF4444',
              }]}>
                {selectedAnswer === null ? 'Time\'s up!' : isCorrect ? 'Correct!' : 'Incorrect'}
              </Text>
            </View>
            <Text style={styles.correctAnswer}>
              Answer: {question.is_true ? '✓ True' : '✗ False'}
            </Text>
            <Text style={styles.feedbackExplanation}>{question.explanation}</Text>
            <Text style={styles.feedbackSource}>{question.source_label}</Text>

            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {currentQuestion < questions.length - 1 ? 'Next →' : 'Finish Set'}
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
  centered: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  scrollContent: { padding: 20 },
  backBtn: { marginBottom: 16 },
  heroImage: { width: 200, height: 200, marginBottom: 12 },
  introCenter: { alignItems: 'center', marginBottom: 20 },
  introMsg: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },
  heroCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroLabel: { fontSize: 11, fontWeight: '700', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  heroDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  setSelector: { marginBottom: 16 },
  setSelectorTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  setGrid: { flexDirection: 'row', gap: 10 },
  setCard: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  setCardActive: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  setCardDone: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
  },
  setNumber: { fontSize: 20, fontWeight: '800', color: COLORS.textMuted, marginBottom: 4 },
  setNumberActive: { color: '#F59E0B' },
  setLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  setLabelActive: { color: '#F59E0B' },
  featuresCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featuresTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  featureDot: { width: 6, height: 6, borderRadius: 3 },
  featureText: { fontSize: 13, color: COLORS.textSecondary },
  ctaButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  timerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.bg2,
  },
  timerDanger: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  timerText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 12,
  },
  categoryText: { fontSize: 12, fontWeight: '600', color: '#F59E0B' },
  statementText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 26,
    marginBottom: 28,
  },
  answerRow: { flexDirection: 'row', gap: 12 },
  falseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  falseBtnText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
  trueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  trueBtnText: { fontSize: 16, fontWeight: '700', color: '#22C55E' },
  feedbackCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
  },
  feedbackCorrect: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  feedbackWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  feedbackTimeout: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  feedbackTitle: { fontSize: 16, fontWeight: '700' },
  correctAnswer: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  feedbackExplanation: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20, marginBottom: 6 },
  feedbackSource: { fontSize: 11, color: COLORS.textMuted, marginBottom: 16 },
  nextBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.bg2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nextBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  completeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  completePercent: { fontSize: 24, fontWeight: '800' },
  completeTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  completeScore: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 8 },
  completeFeedback: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  setsProgress: { flexDirection: 'row', gap: 8, marginTop: 12 },
  setDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.border },
  setDotDone: { backgroundColor: '#22C55E' },
  setDotCurrent: { backgroundColor: '#F59E0B' },
  setsProgressText: { fontSize: 12, color: COLORS.textMuted, marginTop: 6 },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.bg2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 20 },
});
