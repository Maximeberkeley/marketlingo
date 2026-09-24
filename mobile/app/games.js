import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useUserXP, XP_REWARDS, getXPAmount } from "../hooks/useUserXP";
import { ProgressBar } from "../components/ui/ProgressBar";
import { triggerHaptic } from "../lib/haptics";
import { playSound } from "../lib/sounds";
import { ComboCounter } from "../components/ui/ComboCounter";
import { createComboState, comboCorrect, comboWrong } from "../lib/combo";
import { useStudiedLessons } from '../hooks/useStudiedLessons';
import { lessonQuestions } from '../lesson-kit/practice/lessonQuestions';
export default function GamesScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [gameComplete, setGameComplete] = useState(false);
    const [selectedMarket, setSelectedMarket] = useState(null);
    const [showIntro, setShowIntro] = useState(true);
    const [lessonGrounded, setLessonGrounded] = useState(false);
    const { addXP } = useUserXP(selectedMarket || undefined);
    const [combo, setCombo] = useState(createComboState());
    const [fetchKey, setFetchKey] = useState(0);
    const studied = useStudiedLessons(selectedMarket || undefined);
    // Games illustrate only lessons this learner actually completed.
    useEffect(() => {
        if (studied.isLoading || !studied.lessons.length)
            return;
        const built = lessonQuestions(studied.lessons, 5);
        if (built.length < 3)
            return;
        const types = ['match', 'timeline', 'predict'];
        setQuestions(built.map((q, i) => ({
            id: q.id,
            type: types[i % 3],
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            pattern: q.pattern,
        })));
        setLessonGrounded(true);
        setLoading(false);
    }, [studied.isLoading, studied.lessons, fetchKey]);
    useEffect(() => {
        const fetchData = async () => {
            if (!user)
                return;
            const { data: profile } = await supabase.from("profiles").select("selected_market").eq("id", user.id).single();
            const market = profile?.selected_market || "aerospace";
            setSelectedMarket(market);
        };
        fetchData();
    }, [user, fetchKey]);
    const question = questions[currentQuestion];
    const isCorrect = selectedAnswer === question?.correctAnswer;
    const handleAnswer = (index) => {
        if (showResult)
            return;
        setSelectedAnswer(index);
        setShowResult(true);
        if (index === question.correctAnswer) {
            const { newState, xpEarned } = comboCorrect(combo, 25);
            setCombo(newState);
            setScore((prev) => prev + 1);
            triggerHaptic("success");
            playSound("correct");
        }
        else {
            const { newState } = comboWrong(combo, 25);
            setCombo(newState);
            triggerHaptic("warning");
            playSound("wrong");
        }
    };
    const handleNext = async () => {
        triggerHaptic("light");
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion((prev) => prev + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        }
        else {
            const finalScore = score + (isCorrect ? 1 : 0);
            if (user && selectedMarket) {
                await supabase.from("games_progress").upsert({
                    user_id: user.id,
                    market_id: selectedMarket,
                    game_type: "pattern_match",
                    score: finalScore,
                    level: 1,
                    completed_at: new Date().toISOString(),
                }, { onConflict: "user_id,market_id,game_type" });
                const xpEarned = getXPAmount(XP_REWARDS.GAME_COMPLETE, false);
                await addXP(xpEarned, "game", undefined, "Completed game session");
            }
            triggerHaptic("success");
            playSound("levelUp");
            setGameComplete(true);
        }
    };
    if (loading || studied.isLoading) {
        return (<View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent}/>
      </View>);
    }
    if (!studied.lessons.length) {
        return (<View style={[styles.container, styles.centered]}>
        <Text style={styles.heroTitle}>Games unlock from your lessons</Text>
        <Text style={styles.heroDesc}>Complete a course lesson first. Every challenge here will illustrate what you studied.</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.ctaText}>GO TO COURSE</Text>
        </TouchableOpacity>
      </View>);
    }
    if (!lessonGrounded)
        return null;
    if (showIntro && questions.length > 0) {
        return (<View style={styles.container}>
        <ScrollView contentContainerStyle={[
                styles.scrollContent,
                { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
            ]} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.introCenter}>
            <Image source={require("../assets/cards/games-hero.jpg")} style={styles.heroImage} resizeMode="contain"/>
            <Text style={styles.introMsg}>Pick the right answers and learn the patterns!</Text>
          </View>
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>FROM YOUR COMPLETED LESSONS</Text>
            <Text style={styles.heroTitle}>Prove What Landed</Text>
            <Text style={styles.heroDesc}>Every challenge uses a claim, definition, or figure you already studied.</Text>
          </View>
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>What to expect</Text>
            {[
                "Multiple choice questions",
                "Instant feedback with explanations",
                "Startup application tips",
                "Track your score",
            ].map((f, i) => (<View key={i} style={styles.featureRow}>
                <View style={[styles.featureDot, { backgroundColor: COLORS.accent }]}/>
                <Text style={styles.featureText}>{f}</Text>
              </View>))}
          </View>
          <TouchableOpacity style={styles.ctaButton} onPress={() => {
                triggerHaptic("medium");
                setShowIntro(false);
            }}>
            <Text style={styles.ctaText}>Start Game →</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>);
    }
    if (questions.length === 0) {
        return (<View style={[styles.container, styles.centered]}>
        <Image source={require("../assets/cards/games-hero.jpg")} style={{ width: 120, height: 120, marginBottom: 16 }} resizeMode="contain"/>
        <Text style={styles.emptyTitle}>No games available</Text>
        <Text style={styles.emptySubtitle}>Complete more lessons to unlock games!</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.back()}>
          <Text style={styles.ctaText}>Back to Home</Text>
        </TouchableOpacity>
      </View>);
    }
    if (gameComplete) {
        const percentage = Math.round((score / questions.length) * 100);
        return (<View style={[styles.container, styles.centered]}>
        <Image source={require("../assets/illustrations/achievements-hero.png")} style={{ width: 100, height: 100, marginBottom: 8 }} resizeMode="contain"/>
        <Text style={styles.completeTitle}>Game Complete!</Text>
        <Text style={styles.completeScore}>
          You scored {score}/{questions.length} ({percentage}%)
        </Text>
        <Text style={styles.completeFeedback}>
          {percentage >= 80
                ? "Excellent! You're a market pro."
                : percentage >= 60
                    ? "Good job! Keep practicing."
                    : "Review the lessons and try again."}
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 20, width: "100%" }}>
          <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={() => router.back()}>
            <Text style={styles.secondaryBtnText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctaButton, { flex: 1 }]} onPress={() => {
                // Re-fetch for new questions
                setLoading(true);
                setCurrentQuestion(0);
                setScore(0);
                setSelectedAnswer(null);
                setShowResult(false);
                setGameComplete(false);
                setShowIntro(true);
                setCombo(createComboState());
                // Trigger data refetch with new random set
                setFetchKey((k) => k + 1);
            }}>
            <Text style={styles.ctaText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      </View>);
    }
    return (<View style={styles.container}>
      <ScrollView contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
        ]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Games</Text>
            <Text style={styles.headerSub}>
              Question {currentQuestion + 1} of {questions.length}
            </Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>{score}</Text>
          </View>
          {/* Combo Counter */}
          <ComboCounter combo={combo} show={combo.streak > 0}/>
        </View>

        <ProgressBar progress={((currentQuestion + 1) / questions.length) * 100} height={4}/>

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{question.type.toUpperCase()}</Text>
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
            return (<TouchableOpacity key={idx} style={[
                    styles.optionCard,
                    showResult && isCorrectOpt && styles.optionCorrect,
                    showResult && isSelected && !isCorrectOpt && styles.optionWrong,
                    isSelected && !showResult && styles.optionSelected,
                ]} onPress={() => handleAnswer(idx)} disabled={showResult}>
                <View style={[
                    styles.optionLetter,
                    showResult && isCorrectOpt && { backgroundColor: "#22C55E" },
                    showResult && isSelected && !isCorrectOpt && { backgroundColor: "#EF4444" },
                ]}>
                  <Text style={styles.optionLetterText}>
                    {showResult && isCorrectOpt ? "✓" : String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>);
        })}
        </View>

        {showResult && (<View style={[styles.feedbackCard, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <Text style={[styles.feedbackTitle, { color: isCorrect ? "#22C55E" : "#F59E0B" }]}>
              {isCorrect ? "Correct!" : "Not quite"}
            </Text>
            <Text style={styles.feedbackBody}>{question.explanation}</Text>
            <TouchableOpacity style={styles.ctaButton} onPress={handleNext}>
              <Text style={styles.ctaText}>
                {currentQuestion < questions.length - 1 ? "Next Question →" : "See Results"}
              </Text>
            </TouchableOpacity>
          </View>)}
      </ScrollView>
    </View>);
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg0 },
    centered: { alignItems: "center", justifyContent: "center", padding: 24 },
    scrollContent: { paddingHorizontal: 16 },
    backBtn: { marginBottom: 12 },
    backText: { fontSize: 15, color: COLORS.textSecondary },
    header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
    headerTitle: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary },
    headerSub: { fontSize: 12, color: COLORS.textMuted },
    scoreBadge: {
        backgroundColor: "rgba(139, 92, 246, 0.15)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    scoreBadgeText: { fontSize: 13, fontWeight: "600", color: COLORS.accent },
    introCenter: { alignItems: "center", marginBottom: 20 },
    heroImage: { width: 160, height: 160, marginBottom: 12, borderRadius: 16 },
    introMsg: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 12, lineHeight: 20 },
    heroCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        backgroundColor: "rgba(139, 92, 246, 0.12)",
        borderWidth: 1,
        borderColor: "rgba(139, 92, 246, 0.3)",
    },
    heroLabel: { fontSize: 12, color: "rgba(139, 92, 246, 0.8)", fontWeight: "500", marginBottom: 4 },
    heroTitle: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 6 },
    heroDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
    featuresCard: {
        backgroundColor: COLORS.bg2,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    featuresTitle: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 12 },
    featureRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
    featureDot: { width: 6, height: 6, borderRadius: 3 },
    featureText: { fontSize: 14, color: COLORS.textSecondary },
    ctaButton: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center" },
    ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
    emptyTitle: { fontSize: 20, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", marginBottom: 20 },
    chipRow: { flexDirection: "row", gap: 8, marginVertical: 16 },
    chip: { backgroundColor: "rgba(139, 92, 246, 0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    chipText: { fontSize: 11, fontWeight: "600", color: COLORS.accent },
    chipSecondary: {
        backgroundColor: COLORS.bg2,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    chipSecondaryText: { fontSize: 11, color: COLORS.textMuted },
    questionText: { fontSize: 18, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 16, lineHeight: 26 },
    optionCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: COLORS.bg2,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    optionSelected: { borderColor: "rgba(139, 92, 246, 0.5)" },
    optionCorrect: { borderColor: "rgba(34, 197, 94, 0.5)", backgroundColor: "rgba(34, 197, 94, 0.08)" },
    optionWrong: { borderColor: "rgba(239, 68, 68, 0.5)", backgroundColor: "rgba(239, 68, 68, 0.08)" },
    optionLetter: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.bg1,
        alignItems: "center",
        justifyContent: "center",
    },
    optionLetterText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
    optionText: { flex: 1, fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
    feedbackCard: { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1 },
    feedbackCorrect: { borderColor: "rgba(34, 197, 94, 0.3)" },
    feedbackWrong: { borderColor: "rgba(245, 158, 11, 0.3)" },
    feedbackTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
    feedbackBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 12 },
    completeIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    completeTitle: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 8 },
    completeScore: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 4 },
    completeFeedback: { fontSize: 13, color: COLORS.textMuted, textAlign: "center" },
    secondaryBtn: {
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: COLORS.bg2,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
    },
    secondaryBtnText: { fontSize: 15, color: COLORS.textSecondary },
});
