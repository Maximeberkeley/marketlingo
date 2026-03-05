import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useInvestmentLab, CERTIFICATION_THRESHOLDS } from '../hooks/useInvestmentLab';
import { useSubscription } from '../hooks/useSubscription';
import { MentorChatOverlay } from '../components/ai/MentorChatOverlay';
import { getMentorForContext } from '../data/mentors';
import type { Mentor } from '../data/mentors';
import { APP_ICONS } from '../lib/icons';


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

const MODULES = [
  { id: 'valuation', title: 'Valuation Mastery', desc: 'Master industry-specific valuation methodologies', icon: APP_ICONS.progress, color: '#10B981', scoreKey: 'valuation_score' as const },
  { id: 'due_diligence', title: 'Due Diligence', desc: 'Systematic investment evaluation', icon: APP_ICONS.lens, color: '#3B82F6', scoreKey: 'due_diligence_score' as const },
  { id: 'risk_assessment', title: 'Risk Assessment', desc: 'Identify and quantify investment risks', icon: APP_ICONS.regulatory, color: '#F59E0B', scoreKey: 'risk_assessment_score' as const },
  { id: 'portfolio', title: 'Portfolio Construction', desc: 'Build balanced investment portfolios', icon: APP_ICONS.concept, color: '#8B5CF6', scoreKey: 'portfolio_construction_score' as const },
];

export default function InvestmentLabScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const [mentorChatVisible, setMentorChatVisible] = useState(false);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);


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

  const handleOpenMentorChat = () => {
    const mentor = getMentorForContext('growth', selectedMarket || 'aerospace');
    setActiveMentor(mentor);
    setMentorChatVisible(true);
  };

  const handleModulePress = (moduleId: string) => {
    if (!isProUser) {
      Alert.alert('Pro Feature', 'Investment Lab requires Pro. Upgrade to access.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => router.push('/subscription') },
      ]);
      return;
    }
    router.push({ pathname: '/investment-module', params: { moduleId } });
  };


  const heroImage = MARKET_HERO_IMAGES[selectedMarket || 'aerospace'];
  const accentColor = MARKET_ACCENT_COLORS[selectedMarket || 'aerospace'] || '#8B5CF6';

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
            <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start' }}>
              <Text style={styles.backTextLight}>← Back</Text>
            </TouchableOpacity>
            <View style={{ gap: 8 }}>
              <View style={[styles.heroBadge, { backgroundColor: accentColor + 'CC' }]}>
                <Text style={styles.heroBadgeText}>INVESTMENT LAB</Text>
              </View>
              <View style={styles.heroBannerTitleRow}>
                <Text style={styles.heroBannerTitle}>Investment Lab</Text>
                {!isProUser && (
                  <View style={styles.proChip}>
                    <Text style={styles.proChipText}>👑 PRO</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroBannerSubtitle}>Master real-world investment decisions</Text>
              <View style={styles.heroBannerStats}>
                <View style={styles.heroBannerStat}>
                  <Text style={styles.heroBannerStatNum}>{completedScenarioIds.length}</Text>
                  <Text style={styles.heroBannerStatLabel}>Done</Text>
                </View>
                <View style={styles.heroBannerDivider} />
                <View style={styles.heroBannerStat}>
                  <Text style={styles.heroBannerStatNum}>{overallProgress}%</Text>
                  <Text style={styles.heroBannerStatLabel}>Progress</Text>
                </View>
                <View style={styles.heroBannerDivider} />
                <View style={styles.heroBannerStat}>
                  <Text style={[styles.heroBannerStatNum, progress?.investment_certified && { color: '#4ADE80' }]}>
                    {progress?.investment_certified ? '✅' : '🔒'}
                  </Text>
                  <Text style={styles.heroBannerStatLabel}>Certified</Text>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>

        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
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

          {/* Day gate removed — Pro users get instant access */}

          {/* Not Pro */}
          {!isProUser && (
            <View style={styles.heroCard}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📈</Text>
              <Text style={styles.heroTitle}>Real-World Investment Scenarios</Text>
              <Text style={styles.heroDesc}>
                Analyze companies, evaluate markets, and make investment decisions based on real industry data.
              </Text>
              <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: accentColor }]} onPress={() => router.push('/subscription')}>
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

          {/* Chat with Mentor */}
          <TouchableOpacity style={styles.mentorChatCard} onPress={handleOpenMentorChat}>
            <Text style={{ fontSize: 24 }}>💬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.watchlistTitle}>Ask Your Investment Mentor</Text>
              <Text style={styles.watchlistDesc}>Get AI-powered investment guidance</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Mentor Chat Overlay */}
      {activeMentor && (
        <MentorChatOverlay
          visible={mentorChatVisible}
          mentor={activeMentor}
          onClose={() => setMentorChatVisible(false)}
          marketId={selectedMarket || undefined}
          context={`Investment Lab for the ${selectedMarket || 'industry'} market. Overall progress: ${overallProgress}%. Modules: Valuation ${progress?.valuation_score || 0}%, Due Diligence ${progress?.due_diligence_score || 0}%, Risk Assessment ${progress?.risk_assessment_score || 0}%, Portfolio ${progress?.portfolio_construction_score || 0}%. Certified: ${progress?.investment_certified ? 'Yes' : 'No'}.`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 0 },
  // Hero banner
  heroBanner: { height: 260, width: '100%' },
  heroBannerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 24,
    justifyContent: 'space-between',
  },
  backTextLight: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  heroBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  heroBannerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroBannerTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  heroBannerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 18 },
  heroBannerStats: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  heroBannerStat: { flex: 1, alignItems: 'center' },
  heroBannerDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.3)' },
  heroBannerStatNum: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  heroBannerStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  proChip: { backgroundColor: 'rgba(139,92,246,0.85)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  proChipText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  // Existing styles
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
    borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 16,
  },
  upgradeBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 10 },
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
  watchlistCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  watchlistTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  watchlistDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  chevron: { fontSize: 22, color: COLORS.textMuted },
  mentorChatCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.08)', borderRadius: 14, padding: 16, marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)',
  },
});
