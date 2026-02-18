import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { LeoCharacter } from '../components/mascot/LeoCharacter';
import { ProgressBar } from '../components/ui/ProgressBar';
import { MentorChatOverlay } from '../components/ai/MentorChatOverlay';
import { getMentorForContext } from '../data/mentors';
import type { Mentor } from '../data/mentors';


// Market-specific hero images
const MARKET_HERO_IMAGES: Record<string, any> = {
  aerospace: require('../assets/markets/aerospace-hero.jpg'),
  neuroscience: require('../assets/markets/neuroscience-hero.jpg'),
  ai: require('../assets/markets/ai-hero.jpg'),
  fintech: require('../assets/markets/fintech-hero.jpg'),
  ev: require('../assets/markets/ev-hero.jpg'),
  biotech: require('../assets/markets/biotech-hero.jpg'),
  cleanenergy: require('../assets/markets/cleanenergy-hero.jpg'),
  agtech: require('../assets/markets/agtech-hero.jpg'),
  climatetech: require('../assets/markets/climatetech-hero.jpg'),
  cybersecurity: require('../assets/markets/cybersecurity-hero.jpg'),
  spacetech: require('../assets/markets/spacetech-hero.jpg'),
  robotics: require('../assets/markets/robotics-hero.jpg'),
  healthtech: require('../assets/markets/healthtech-hero.jpg'),
  logistics: require('../assets/markets/logistics-hero.jpg'),
  web3: require('../assets/markets/web3-hero.jpg'),
};

const MARKET_ACCENT_COLORS: Record<string, string> = {
  aerospace: '#8B5CF6',
  neuroscience: '#F43F5E',
  ai: '#3B82F6',
  fintech: '#10B981',
  ev: '#06B6D4',
  biotech: '#EC4899',
  cleanenergy: '#F59E0B',
  agtech: '#22C55E',
  climatetech: '#14B8A6',
  cybersecurity: '#EF4444',
  spacetech: '#6366F1',
  robotics: '#64748B',
  healthtech: '#0EA5E9',
  logistics: '#F97316',
  web3: '#7C3AED',
};

interface TrainerScenario {
  id: string;
  scenario: string;
  question: string;
  options: { label: string; isCorrect: boolean }[];
}

export default function TrainerScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<TrainerScenario[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctIndex: number;
    feedback_pro_reasoning: string | null;
    feedback_common_mistake: string | null;
    feedback_mental_model: string | null;
  } | null>(null);
  const [mentorChatVisible, setMentorChatVisible] = useState(false);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);


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

      const { data: scenarioData, error } = await supabase
        .from('trainer_scenarios')
        .select('id, market_id, scenario, question, options, tags, sources, created_at')
        .eq('market_id', market)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching scenarios:', error);
        setLoading(false);
        return;
      }

      const formatted = (scenarioData || []).map((s) => {
        let options: { label: string; isCorrect: boolean }[] = [];
        if (Array.isArray(s.options)) {
          options = (s.options as unknown[]).map((opt) => {
            if (typeof opt === 'string') return { label: opt, isCorrect: false };
            if (typeof opt === 'object' && opt !== null && 'label' in opt) {
              return { label: (opt as any).label, isCorrect: false };
            }
            return { label: String(opt), isCorrect: false };
          });
        }
        return { id: s.id, scenario: s.scenario, question: s.question, options };
      });

      // Resume from first uncompleted
      const { data: attempts } = await supabase
        .from('trainer_attempts')
        .select('scenario_id')
        .eq('user_id', user.id);

      if (attempts && attempts.length > 0 && formatted.length > 0) {
        const completedIds = new Set(attempts.map((a) => a.scenario_id));
        const idx = formatted.findIndex((s) => !completedIds.has(s.id));
        if (idx !== -1) setCurrentIndex(idx);
      }

      setScenarios(formatted);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const current = scenarios[currentIndex];

  const handleOpenMentorChat = () => {
    const mentor = getMentorForContext('strategy', selectedMarket || 'aerospace');
    setActiveMentor(mentor);
    setMentorChatVisible(true);
  };

  const handleSelectOption = async (optionIdx: number) => {
    if (feedback || !user || !current) return;
    setSelectedOption(optionIdx);

    const { data, error } = await supabase.rpc('submit_trainer_answer', {
      p_scenario_id: current.id,
      p_selected_option: optionIdx,
      p_time_spent: null,
    });

    if (error) {
      console.error('Error submitting answer:', error);
      return;
    }

    const result = data as any;
    setFeedback(result || { isCorrect: false, correctIndex: 0, feedback_pro_reasoning: null, feedback_common_mistake: null, feedback_mental_model: null });
  };

  const handleSaveToNotebook = async () => {
    if (!user || !current || !selectedMarket) return;
    await supabase.from('notes').insert({
      user_id: user.id,
      content: `Trainer insight: ${feedback?.feedback_mental_model || current.scenario}`,
      linked_label: `Trainer · ${current.question.substring(0, 30)}...`,
      market_id: selectedMarket,
    });
    Alert.alert('Saved', 'Insight saved to notebook!');
  };

  const handleNext = () => {
    setSelectedOption(null);
    setFeedback(null);
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      Alert.alert('Complete!', 'All scenarios completed! 🎉');
      setCurrentIndex(0);
    }
  };


  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const accentColor = MARKET_ACCENT_COLORS[selectedMarket || 'aerospace'] || '#8B5CF6';
  const heroImage = MARKET_HERO_IMAGES[selectedMarket || 'aerospace'];

  // Intro screen
  if (showIntro && scenarios.length > 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: 0, paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Image Banner */}
          <ImageBackground
            source={heroImage}
            style={[styles.heroBanner, { paddingTop: insets.top + 16 }]}
            imageStyle={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
          >
            <View style={styles.heroBannerOverlay}>
              <TouchableOpacity style={styles.backBtnOverlay} onPress={() => router.back()}>
                <Text style={styles.backTextLight}>← Back</Text>
              </TouchableOpacity>
              <View style={styles.heroBannerContent}>
                <View style={[styles.heroBadge, { backgroundColor: accentColor + 'CC' }]}>
                  <Text style={styles.heroBadgeText}>🧠 INDUSTRY TRAINER</Text>
                </View>
                <Text style={styles.heroBannerTitle}>Think Like an Expert</Text>
                <Text style={styles.heroBannerSubtitle}>Complex scenarios with deep professional feedback</Text>
                <View style={styles.heroBannerStats}>
                  <View style={styles.heroBannerStat}>
                    <Text style={styles.heroBannerStatNum}>{scenarios.length}</Text>
                    <Text style={styles.heroBannerStatLabel}>Scenarios</Text>
                  </View>
                  <View style={styles.heroBannerDivider} />
                  <View style={styles.heroBannerStat}>
                    <Text style={styles.heroBannerStatNum}>+50</Text>
                    <Text style={styles.heroBannerStatLabel}>XP each</Text>
                  </View>
                  <View style={styles.heroBannerDivider} />
                  <View style={styles.heroBannerStat}>
                    <Text style={styles.heroBannerStatNum}>PRO</Text>
                    <Text style={styles.heroBannerStatLabel}>Feedback</Text>
                  </View>
                </View>
              </View>
            </View>
          </ImageBackground>

          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <View style={styles.introCenter}>
              <LeoCharacter size="lg" animation="waving" />
              <Text style={styles.introMsg}>Time to level up! These scenarios will teach you to think like a pro 🧠</Text>
            </View>

            <View style={styles.featuresCard}>
              <Text style={styles.featuresTitle}>What you'll master</Text>
              {[
                { icon: '🎯', text: 'Real-world decision scenarios' },
                { icon: '💡', text: 'Pro reasoning breakdowns' },
                { icon: '⚠️', text: 'Common mistake analysis' },
                { icon: '🧩', text: 'Mental models for founders' },
              ].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[styles.ctaButton, { backgroundColor: accentColor }]} onPress={() => setShowIntro(false)}>
              <Text style={styles.ctaText}>Start Training →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (scenarios.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🧠</Text>
        <Text style={styles.emptyTitle}>No scenarios available</Text>
        <Text style={styles.emptySubtitle}>Complete more lessons to unlock trainer scenarios!</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.back()}>
          <Text style={styles.ctaText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Trainer</Text>
            <Text style={styles.headerSub}>Scenario {currentIndex + 1} of {scenarios.length}</Text>
          </View>
        </View>

        <ProgressBar progress={((currentIndex + 1) / scenarios.length) * 100} height={4} />

        {/* Scenario */}
        <View style={styles.scenarioCard}>
          <Text style={styles.scenarioText}>{current.scenario}</Text>
        </View>

        {/* Question */}
        <Text style={styles.questionText}>{current.question}</Text>

        {/* Options */}
        <View style={{ gap: 10 }}>
          {current.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrectOption = feedback && feedback.correctIndex === idx;
            const isWrong = feedback && isSelected && !feedback.isCorrect;

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionCard,
                  isCorrectOption && styles.optionCorrect,
                  isWrong && styles.optionWrong,
                  isSelected && !feedback && styles.optionSelected,
                ]}
                onPress={() => handleSelectOption(idx)}
                disabled={!!feedback}
              >
                <View style={[styles.optionLetter, isCorrectOption && { backgroundColor: '#22C55E' }, isWrong && { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.optionLetterText}>{String.fromCharCode(65 + idx)}</Text>
                </View>
                <Text style={styles.optionText}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback */}
        {feedback && (
          <View style={[styles.feedbackCard, feedback.isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <Text style={[styles.feedbackTitle, { color: feedback.isCorrect ? '#22C55E' : '#F59E0B' }]}>
              {feedback.isCorrect ? '✅ Correct!' : '⚠️ Not quite'}
            </Text>
            {feedback.feedback_pro_reasoning && (
              <Text style={styles.feedbackBody}>{feedback.feedback_pro_reasoning}</Text>
            )}
            {feedback.feedback_mental_model && (
              <View style={styles.mentalModelBox}>
                <Text style={styles.mentalModelLabel}>💡 Mental Model</Text>
                <Text style={styles.mentalModelText}>{feedback.feedback_mental_model}</Text>
              </View>
            )}

            {/* Chat with Mentor CTA */}
            <TouchableOpacity style={styles.mentorChatCTA} onPress={handleOpenMentorChat}>
              <Text style={styles.mentorChatCTAText}>💬 Discuss with AI Mentor</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveToNotebook}>
                <Text style={styles.saveBtnText}>📝 Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ctaButton, { flex: 1 }]} onPress={handleNext}>
                <Text style={styles.ctaText}>
                  {currentIndex < scenarios.length - 1 ? 'Next Scenario →' : 'See Results'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Mentor Chat Overlay */}
      {activeMentor && (
        <MentorChatOverlay
          visible={mentorChatVisible}
          mentor={activeMentor}
          onClose={() => setMentorChatVisible(false)}
          marketId={selectedMarket || undefined}
          context={current
            ? `Trainer scenario: "${current.scenario}" — Question: "${current.question}". ${feedback ? `The user answered ${feedback.isCorrect ? 'correctly' : 'incorrectly'}. Pro reasoning: ${feedback.feedback_pro_reasoning || ''}` : 'The user is thinking through their answer.'}`
            : `${selectedMarket} industry trainer scenarios`}
        />
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  scrollContent: { paddingHorizontal: 16 },
  // Hero banner styles
  heroBanner: { height: 280, width: '100%' },
  heroBannerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 24,
    justifyContent: 'space-between',
  },
  backBtnOverlay: { alignSelf: 'flex-start', marginBottom: 12 },
  backTextLight: { fontSize: 15, color: 'rgba(255,255,255,0.85)' },
  heroBannerContent: { gap: 10 },
  heroBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  heroBannerTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', lineHeight: 32 },
  heroBannerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 18 },
  heroBannerStats: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  heroBannerStat: { flex: 1, alignItems: 'center' },
  heroBannerDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.3)' },
  heroBannerStatNum: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  heroBannerStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  // Legacy / active
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 15, color: COLORS.textSecondary },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 12, color: COLORS.textMuted },
  introCenter: { alignItems: 'center', marginBottom: 20 },
  introMsg: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  featuresCard: {
    backgroundColor: COLORS.bg2, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  featuresTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  featureIcon: { fontSize: 18, width: 28 },
  featureDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  featureText: { fontSize: 14, color: COLORS.textSecondary, flex: 1 },
  ctaButton: {
    backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 20 },
  scenarioCard: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 16, marginVertical: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  scenarioText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 21 },
  questionText: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 16, lineHeight: 26 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  optionSelected: { borderColor: 'rgba(139, 92, 246, 0.5)' },
  optionCorrect: { borderColor: 'rgba(34, 197, 94, 0.5)', backgroundColor: 'rgba(34, 197, 94, 0.08)' },
  optionWrong: { borderColor: 'rgba(239, 68, 68, 0.5)', backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  optionLetter: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.bg1,
    alignItems: 'center', justifyContent: 'center',
  },
  optionLetterText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  optionText: { flex: 1, fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  feedbackCard: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 16, marginTop: 16,
    borderWidth: 1,
  },
  feedbackCorrect: { borderColor: 'rgba(34, 197, 94, 0.3)' },
  feedbackWrong: { borderColor: 'rgba(245, 158, 11, 0.3)' },
  feedbackTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  feedbackBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 8 },
  mentalModelBox: {
    padding: 10, borderRadius: 10, backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  mentalModelLabel: { fontSize: 11, fontWeight: '600', color: COLORS.accent, marginBottom: 4 },
  mentalModelText: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  saveBtn: {
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14,
    backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, color: COLORS.textSecondary },
  mentorChatCTA: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)', borderRadius: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.25)', marginTop: 12,
  },
  mentorChatCTAText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
});
