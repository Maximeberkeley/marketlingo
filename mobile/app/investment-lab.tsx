import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useInvestmentLab, CERTIFICATION_THRESHOLDS } from '../hooks/useInvestmentLab';
import { useSubscription } from '../hooks/useSubscription';

const MODULES = [
  { id: 'valuation', title: 'Valuation Mastery', desc: 'Master industry-specific valuation methodologies', emoji: '📊', color: '#10B981', scoreKey: 'valuation_score' as const },
  { id: 'due_diligence', title: 'Due Diligence', desc: 'Systematic investment evaluation', emoji: '👁️', color: '#3B82F6', scoreKey: 'due_diligence_score' as const },
  { id: 'risk_assessment', title: 'Risk Assessment', desc: 'Identify and quantify investment risks', emoji: '🛡️', color: '#F59E0B', scoreKey: 'risk_assessment_score' as const },
  { id: 'portfolio', title: 'Portfolio Construction', desc: 'Build balanced investment portfolios', emoji: '🧩', color: '#8B5CF6', scoreKey: 'portfolio_construction_score' as const },
];

export default function InvestmentLabScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);

  useEffect(() => {
    const fetchMarket = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('selected_market').eq('id', user.id).single();
      if (profile?.selected_market) setSelectedMarket(profile.selected_market);
      setMarketLoading(false);
    };
    fetchMarket();
  }, [user]);

  const { progress, completedScenarioIds, loading: labLoading, isUnlocked, getOverallProgress } = useInvestmentLab(selectedMarket || undefined);

  const loading = marketLoading || labLoading;
  const overallProgress = getOverallProgress();

  const handleModulePress = (moduleId: string) => {
    if (!isProUser) {
      Alert.alert('Pro Feature', 'Investment Lab requires Pro. Upgrade to access.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => router.push('/subscription') },
      ]);
      return;
    }
    if (!isUnlocked) {
      Alert.alert('Locked', 'Complete Day 30 of the curriculum to unlock the Investment Lab.');
      return;
    }
    router.push({ pathname: '/investment-module', params: { moduleId } });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Investment Lab</Text>
            <Text style={styles.subtitle}>Master real-world investment decisions</Text>
          </View>
          {!isProUser && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>👑 PRO</Text>
            </View>
          )}
        </View>

        {/* Overall Progress */}
        {progress && (
          <View style={styles.progressCard}>
            <View style={styles.progressStatsRow}>
              <View style={styles.progressStat}>
                <Text style={styles.progressValue}>{overallProgress}%</Text>
                <Text style={styles.progressLabel}>Overall</Text>
              </View>
              <View style={styles.progressDivider} />
              <View style={styles.progressStat}>
                <Text style={styles.progressValue}>{completedScenarioIds.length}</Text>
                <Text style={styles.progressLabel}>Scenarios</Text>
              </View>
              <View style={styles.progressDivider} />
              <View style={styles.progressStat}>
                <Text style={styles.progressValue}>⚡ {progress.investment_xp}</Text>
                <Text style={styles.progressLabel}>XP</Text>
              </View>
              <View style={styles.progressDivider} />
              <View style={styles.progressStat}>
                <Text style={[styles.progressValue, progress.investment_certified && { color: '#22C55E' }]}>
                  {progress.investment_certified ? '✅' : '🔒'}
                </Text>
                <Text style={styles.progressLabel}>Certified</Text>
              </View>
            </View>
            <ProgressBar progress={overallProgress} height={6} />
          </View>
        )}

        {/* Not unlocked */}
        {!isUnlocked && isProUser && (
          <View style={styles.heroCard}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🔒</Text>
            <Text style={styles.heroTitle}>Unlock at Day 30</Text>
            <Text style={styles.heroDesc}>
              Complete 30 days of the curriculum to unlock the Investment Lab and start practicing real investment scenarios.
            </Text>
          </View>
        )}

        {/* Not Pro */}
        {!isProUser && (
          <View style={styles.heroCard}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📈</Text>
            <Text style={styles.heroTitle}>Real-World Investment Scenarios</Text>
            <Text style={styles.heroDesc}>
              Analyze companies, evaluate markets, and make investment decisions based on real industry data.
            </Text>
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/subscription')}>
              <Text style={styles.upgradeBtnText}>👑 Unlock with Pro</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modules */}
        <Text style={styles.sectionTitle}>INVESTMENT MODULES</Text>
        <View style={{ gap: 10 }}>
          {MODULES.map((mod) => {
            const score = progress ? (progress as any)[mod.scoreKey] || 0 : 0;
            const passed = score >= CERTIFICATION_THRESHOLDS[mod.scoreKey.replace('_score', '') as keyof typeof CERTIFICATION_THRESHOLDS];
            return (
              <TouchableOpacity
                key={mod.id}
                style={styles.scenarioCard}
                onPress={() => handleModulePress(mod.id)}
              >
                <View style={[styles.moduleIcon, { backgroundColor: mod.color + '20' }]}>
                  <Text style={{ fontSize: 22 }}>{mod.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scenarioTitle}>{mod.title}</Text>
                  <Text style={styles.scenarioDesc} numberOfLines={1}>{mod.desc}</Text>
                  <View style={styles.scenarioMeta}>
                    {score > 0 && (
                      <View style={[styles.difficultyBadge, { backgroundColor: passed ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                        <Text style={[styles.difficultyText, { color: passed ? '#22C55E' : '#FBBF24' }]}>{score}%</Text>
                      </View>
                    )}
                    {passed && <Text style={{ fontSize: 12 }}>✅</Text>}
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Certificate */}
        <TouchableOpacity
          style={[styles.watchlistCard, progress?.investment_certified && { borderColor: 'rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.05)' }]}
          onPress={() => router.push('/investment-certificate')}
        >
          <Text style={{ fontSize: 24 }}>{progress?.investment_certified ? '🎓' : '🏆'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.watchlistTitle}>
              {progress?.investment_certified ? 'View Certificate' : 'Investment Certification'}
            </Text>
            <Text style={styles.watchlistDesc}>
              {progress?.investment_certified ? 'Share your achievement' : 'Score 80%+ in all modules to earn certification'}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Watchlist */}
        <TouchableOpacity
          style={styles.watchlistCard}
          onPress={() => router.push('/investment-watchlist')}
        >
          <Text style={{ fontSize: 24 }}>👁️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.watchlistTitle}>Your Watchlist</Text>
            <Text style={styles.watchlistDesc}>
              {progress?.watchlist_companies?.length || 0} companies tracked
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16 },
  backText: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textMuted },
  proBadge: { backgroundColor: 'rgba(139, 92, 246, 0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  proBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.accent },
  progressCard: {
    backgroundColor: COLORS.bg2, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  progressStatsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressStat: { flex: 1, alignItems: 'center' },
  progressDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  progressValue: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  progressLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  heroCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)', borderRadius: 16, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)', alignItems: 'center',
  },
  heroTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 8 },
  heroDesc: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  upgradeBtn: {
    backgroundColor: COLORS.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12,
    marginTop: 16,
  },
  upgradeBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  emptySubtitle: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
  moduleIcon: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  scenarioCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  scenarioTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  scenarioDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 8 },
  scenarioMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  difficultyText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  xpReward: { fontSize: 11, fontWeight: '600', color: '#EAB308' },
  watchlistCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 16, marginTop: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  watchlistTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  watchlistDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  chevron: { fontSize: 22, color: COLORS.textMuted },
});
