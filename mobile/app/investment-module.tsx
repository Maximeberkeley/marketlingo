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
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useInvestmentLab, InvestmentScenario } from '../hooks/useInvestmentLab';
import { ProgressBar } from '../components/ui/ProgressBar';
import { APP_ICONS } from '../lib/icons';

const MODULE_CONFIG: Record<string, {
  title: string;
  description: string;
  icon: any;
  color: string;
  scenarioType: InvestmentScenario['scenario_type'];
  scoreKey: 'valuation_score' | 'due_diligence_score' | 'risk_assessment_score' | 'portfolio_construction_score';
}> = {
  valuation: {
    title: 'Valuation Mastery', description: 'Master industry-specific valuation methodologies',
    icon: APP_ICONS.progress, color: '#10B981', scenarioType: 'valuation', scoreKey: 'valuation_score',
  },
  due_diligence: {
    title: 'Due Diligence', description: 'Systematic investment evaluation',
    icon: APP_ICONS.lens, color: '#3B82F6', scenarioType: 'due_diligence', scoreKey: 'due_diligence_score',
  },
  risk_assessment: {
    title: 'Risk Assessment', description: 'Identify and quantify investment risks',
    icon: APP_ICONS.regulatory, color: '#F59E0B', scenarioType: 'risk', scoreKey: 'risk_assessment_score',
  },
  portfolio: {
    title: 'Portfolio Construction', description: 'Build balanced investment portfolios',
    icon: APP_ICONS.concept, color: '#8B5CF6', scenarioType: 'portfolio', scoreKey: 'portfolio_construction_score',
  },
};

export default function InvestmentModuleScreen() {
  const insets = useSafeAreaInsets();
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const fetchMarket = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('selected_market').eq('id', user.id).single();
      if (profile?.selected_market) setSelectedMarket(profile.selected_market);
      setLoading(false);
    };
    fetchMarket();
  }, [user]);

  const { progress, scenarios, completedScenarioIds, loading: labLoading, recordAttempt, updateModuleScore } = useInvestmentLab(selectedMarket || undefined);

  const moduleConfig = MODULE_CONFIG[moduleId || 'valuation'];
  const moduleScenarios = scenarios.filter((s) => s.scenario_type === moduleConfig?.scenarioType);
  const currentScenario = moduleScenarios[currentScenarioIndex];
  const completedInModule = moduleScenarios.filter((s) => completedScenarioIds.includes(s.id)).length;
  const moduleProgress = moduleScenarios.length > 0 ? Math.round((completedInModule / moduleScenarios.length) * 100) : 0;

  const handleOptionSelect = async (index: number) => {
    if (selectedOption !== null || !currentScenario) return;
    setSelectedOption(index);
    const isCorrect = currentScenario.options[index]?.isCorrect || index === currentScenario.correct_option_index;
    await recordAttempt(currentScenario.id, index, isCorrect);
    const newCount = completedInModule + (isCorrect ? 1 : 0);
    const newScore = Math.round((newCount / moduleScenarios.length) * 100);
    await updateModuleScore(moduleConfig.scoreKey.replace('_score', '') as any, newScore);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentScenarioIndex < moduleScenarios.length - 1) {
      setCurrentScenarioIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      router.back();
    }
  };

  if (loading || labLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!moduleConfig) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyTitle}>Module not found</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.back()}>
          <Text style={styles.ctaText}>Back to Lab</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (moduleScenarios.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={[styles.emptyIcon, { backgroundColor: moduleConfig.color + '20' }]}>
          <Image source={moduleConfig.icon} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
        </View>
        <Text style={styles.emptyTitle}>Coming Soon</Text>
        <Text style={styles.emptySubtitle}>Scenarios for this module are being developed</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.back()}>
          <Text style={styles.ctaText}>Back to Lab</Text>
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
            <Text style={styles.headerTitle}>{moduleConfig.title}</Text>
            <Text style={styles.headerSub}>Scenario {currentScenarioIndex + 1} of {moduleScenarios.length}</Text>
          </View>
          <View style={[styles.moduleIcon, { backgroundColor: moduleConfig.color + '20' }]}>
            <Image source={moduleConfig.icon} style={{ width: 18, height: 18, resizeMode: 'contain' }} />
          </View>
        </View>

        <ProgressBar progress={moduleProgress} height={4} />

        {currentScenario && (
          <View style={{ gap: 12, marginTop: 16 }}>
            {/* Difficulty badge */}
            <View style={styles.diffBadge}>
              <Text style={[styles.diffText, {
                color: currentScenario.difficulty === 'expert' ? '#EF4444' : currentScenario.difficulty === 'advanced' ? '#F59E0B' : '#3B82F6',
              }]}>{currentScenario.difficulty.toUpperCase()}</Text>
              {currentScenario.valuation_model && (
                <View style={styles.modelBadge}><Text style={styles.modelText}>{currentScenario.valuation_model}</Text></View>
              )}
            </View>

            {/* Scenario */}
            <View style={styles.scenarioCard}>
              <Text style={styles.scenarioTitle}>{currentScenario.title}</Text>
              <Text style={styles.scenarioBody}>{currentScenario.scenario}</Text>
            </View>

            {/* Question */}
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{currentScenario.question}</Text>
            </View>

            {/* Options */}
            {currentScenario.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrect = option.isCorrect || index === currentScenario.correct_option_index;
              const showResult = showFeedback;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.optionCard,
                    showResult && isCorrect && styles.optionCorrect,
                    showResult && isSelected && !isCorrect && styles.optionWrong,
                    isSelected && !showResult && styles.optionSelected,
                  ]}
                  onPress={() => handleOptionSelect(index)}
                  disabled={selectedOption !== null}
                >
                  <View style={[styles.optionCircle,
                    showResult && isCorrect && { backgroundColor: '#22C55E', borderColor: '#22C55E' },
                    showResult && isSelected && !isCorrect && { backgroundColor: '#EF4444', borderColor: '#EF4444' },
                    isSelected && !showResult && { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
                  ]}>
                    <Text style={[styles.optionLetter,
                      (isSelected || (showResult && isCorrect)) && { color: '#FFFFFF' },
                    ]}>
                      {showResult && isCorrect ? '✓' : showResult && isSelected ? '✗' : String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText,
                    showResult && isCorrect && { color: '#22C55E' },
                  ]}>{option.text}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Feedback */}
            {showFeedback && currentScenario.explanation && (
              <View style={{ gap: 10 }}>
                <View style={styles.insightCard}>
                  <Text style={styles.insightLabel}>Investment Insight</Text>
                  <Text style={styles.insightBody}>{currentScenario.explanation}</Text>
                </View>
                {currentScenario.real_world_example && (
                  <View style={styles.exampleCard}>
                    <Text style={styles.exampleLabel}>Real World Example</Text>
                    <Text style={styles.insightBody}>{currentScenario.real_world_example}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.ctaButton} onPress={handleNext}>
                  <Text style={styles.ctaText}>
                    {currentScenarioIndex < moduleScenarios.length - 1 ? 'Next Scenario →' : 'Complete Module'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  backText: { fontSize: 15, color: COLORS.textSecondary },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 11, color: COLORS.textMuted },
  moduleIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginBottom: 20 },
  ctaButton: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', width: '100%' },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  diffBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diffText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  modelBadge: { backgroundColor: COLORS.bg2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  modelText: { fontSize: 10, color: COLORS.textMuted },
  scenarioCard: { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  scenarioTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  scenarioBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  questionCard: { backgroundColor: 'rgba(139,92,246,0.06)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  questionText: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary, lineHeight: 22 },
  optionCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  optionCorrect: { backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.3)' },
  optionWrong: { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' },
  optionSelected: { backgroundColor: 'rgba(139,92,246,0.08)', borderColor: COLORS.accent },
  optionCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  optionLetter: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
  optionText: { flex: 1, fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },
  insightCard: { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  insightLabel: { fontSize: 12, fontWeight: '600', color: COLORS.accent, marginBottom: 6 },
  insightBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  exampleCard: { backgroundColor: 'rgba(139,92,246,0.05)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  exampleLabel: { fontSize: 12, fontWeight: '600', color: '#A78BFA', marginBottom: 6 },
});
