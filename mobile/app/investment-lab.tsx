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
import { MentorChatOverlay } from '../components/ai/MentorChatOverlay';
import { getMentorForContext } from '../data/mentors';
import type { Mentor } from '../data/mentors';
import { Feather } from '@expo/vector-icons';
import { Image } from 'react-native';

const SOPHIA_AVATAR = require('../assets/mentors/mentor-sophia.png');

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
  { id: 'valuation', title: 'Valuation', desc: 'Price it like an insider.', featherIcon: 'bar-chart-2' as const, color: '#10B981', scoreKey: 'valuation_score' as const },
  { id: 'due_diligence', title: 'Due Diligence', desc: 'Find what the deck hides.', featherIcon: 'search' as const, color: '#3B82F6', scoreKey: 'due_diligence_score' as const },
  { id: 'risk_assessment', title: 'Risk', desc: 'Name the way this breaks.', featherIcon: 'shield' as const, color: '#F59E0B', scoreKey: 'risk_assessment_score' as const },
  { id: 'portfolio', title: 'Portfolio', desc: 'Spread the bets that pay.', featherIcon: 'layers' as const, color: '#8B5CF6', scoreKey: 'portfolio_construction_score' as const },
];

const EXTRAS = [
  { path: '/portfolio-guide', icon: 'map' as const, color: '#10B981', title: 'Portfolio Guide', desc: '5 steps to your first portfolio' },
  { path: '/investment-watchlist', icon: 'bookmark' as const, color: '#0EA5E9', title: 'Watchlist', desc: 'Companies you track' },
  { path: '/portfolio-builder', icon: 'pie-chart' as const, color: '#F59E0B', title: 'Portfolio Builder', desc: 'Allocate and balance positions' },
];

export default function InvestmentLabScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
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

  const { progress, completedScenarioIds, loading: labLoading, isUnlocked, getOverallProgress, refetch } = useInvestmentLab(selectedMarket || undefined);

  // Refetch when returning to this screen (e.g. after completing a module)
  useEffect(() => {
    if (selectedMarket && !labLoading) refetch();
  }, [selectedMarket]);

  const loading = marketLoading || labLoading;
  const overallProgress = getOverallProgress();

  const handleOpenMentorChat = () => {
    const mentor = getMentorForContext('growth', selectedMarket || 'aerospace');
    setActiveMentor(mentor);
    setMentorChatVisible(true);
  };

  const handleModulePress = (moduleId: string) => {
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

  const nextModule = MODULES.find((mod) => {
    const score = progress ? (progress as any)[mod.scoreKey] || 0 : 0;
    return score < CERTIFICATION_THRESHOLDS[mod.scoreKey.replace('_score', '') as keyof typeof CERTIFICATION_THRESHOLDS];
  }) || MODULES[0];
  const passedCount = MODULES.filter((mod) => {
    const score = progress ? (progress as any)[mod.scoreKey] || 0 : 0;
    return score >= CERTIFICATION_THRESHOLDS[mod.scoreKey.replace('_score', '') as keyof typeof CERTIFICATION_THRESHOLDS];
  }).length;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 0, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <ImageBackground
          source={heroImage}
          style={[styles.heroBanner, { paddingTop: insets.top + 12 }]}
          imageStyle={{ borderBottomLeftRadius: 26, borderBottomRightRadius: 26 }}
        >
          <View style={styles.heroBannerOverlay}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
              <Feather name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ gap: 10 }}>
              <View style={[styles.heroBadge, { backgroundColor: accentColor }]}>
                <Text style={styles.heroBadgeText}>INVESTMENT LAB</Text>
              </View>
              <Text style={styles.heroBannerTitle}>Read the deal{'\n'}before the room does.</Text>
              <View style={styles.heroChips}>
                <View style={styles.heroChip}>
                  <Feather name="check-circle" size={13} color="#4ADE80" />
                  <Text style={styles.heroChipText}>{passedCount}/4 modules</Text>
                </View>
                <View style={styles.heroChip}>
                  <Feather name="zap" size={13} color="#FBBF24" />
                  <Text style={styles.heroChipText}>{progress?.investment_xp || 0} XP</Text>
                </View>
                <View style={styles.heroChip}>
                  <Feather name="award" size={13} color={progress?.investment_certified ? '#4ADE80' : 'rgba(255,255,255,0.6)'} />
                  <Text style={styles.heroChipText}>{progress?.investment_certified ? 'Certified' : 'Not yet'}</Text>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>

        <View style={{ paddingHorizontal: 16, paddingTop: 18 }}>
          {/* Continue */}
          <TouchableOpacity
            style={[styles.continueCard, { backgroundColor: nextModule.color }]}
            onPress={() => handleModulePress(nextModule.id)}
            activeOpacity={0.88}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.continueKicker}>NEXT CASE</Text>
              <Text style={styles.continueTitle}>{nextModule.title}</Text>
              <Text style={styles.continueDesc}>{nextModule.desc}</Text>
            </View>
            <View style={styles.continueArrow}>
              <Feather name="arrow-right" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Run progress */}
          {progress && (
            <View style={styles.progressCard}>
              <View style={styles.progressHeadRow}>
                <Text style={styles.progressHeadText}>Certification run</Text>
                <Text style={[styles.progressHeadValue, { color: accentColor }]}>{overallProgress}%</Text>
              </View>
              <ProgressBar progress={overallProgress} height={8} />
              <Text style={styles.progressHint}>Score 80% in all four to get certified.</Text>
            </View>
          )}

          {/* Modules */}
          <Text style={styles.sectionTitle}>MODULES</Text>
          <View style={{ gap: 10 }}>
            {MODULES.map((mod) => {
              const score = progress ? (progress as any)[mod.scoreKey] || 0 : 0;
              const passed = score >= CERTIFICATION_THRESHOLDS[mod.scoreKey.replace('_score', '') as keyof typeof CERTIFICATION_THRESHOLDS];
              return (
                <TouchableOpacity
                  key={mod.id}
                  style={[styles.scenarioCard, passed && { borderColor: 'rgba(34,197,94,0.35)' }]}
                  onPress={() => handleModulePress(mod.id)}
                  activeOpacity={0.9}
                >
                  <View style={[styles.moduleIcon, { backgroundColor: mod.color + '22' }]}>
                    <Feather name={mod.featherIcon} size={20} color={mod.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scenarioTitle}>{mod.title}</Text>
                    <Text style={styles.scenarioDesc} numberOfLines={1}>{mod.desc}</Text>
                    <View style={styles.miniTrack}>
                      <View style={[styles.miniFill, { width: `${Math.min(100, score)}%`, backgroundColor: passed ? '#22C55E' : mod.color }]} />
                    </View>
                  </View>
                  {passed ? (
                    <Feather name="check-circle" size={20} color="#22C55E" />
                  ) : (
                    <Text style={styles.scorePill}>{score > 0 ? `${score}%` : 'Start'}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Certificate */}
          <TouchableOpacity
            style={[styles.certCard, progress?.investment_certified && { borderColor: 'rgba(34,197,94,0.35)', backgroundColor: 'rgba(34,197,94,0.06)' }]}
            onPress={() => router.push('/investment-certificate')}
            activeOpacity={0.9}
          >
            <Feather name="award" size={22} color={progress?.investment_certified ? '#22C55E' : COLORS.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.watchlistTitle}>{progress?.investment_certified ? 'View your certificate' : 'Certificate locked'}</Text>
              <Text style={styles.watchlistDesc}>{progress?.investment_certified ? 'Share it anywhere.' : 'Clear all four modules to unlock.'}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Tools */}
          <Text style={[styles.sectionTitle, { marginTop: 22 }]}>TOOLS</Text>
          <View style={{ gap: 10 }}>
            {EXTRAS.map((item) => (
              <TouchableOpacity key={item.path} style={styles.toolCard} onPress={() => router.push(item.path as any)} activeOpacity={0.9}>
                <View style={[styles.toolIcon, { backgroundColor: item.color + '22' }]}>
                  <Feather name={item.icon} size={18} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.watchlistTitle}>{item.title}</Text>
                  <Text style={styles.watchlistDesc}>
                    {item.path === '/investment-watchlist'
                      ? `${progress?.watchlist_companies?.length || 0} companies tracked`
                      : item.desc}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Sophia */}
          <TouchableOpacity style={styles.mentorChatCard} onPress={handleOpenMentorChat} activeOpacity={0.9}>
            <Image source={SOPHIA_AVATAR} style={styles.mentorAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.watchlistTitle}>Ask Sophia</Text>
              <Text style={styles.watchlistDesc}>Stuck on a call? She talks it through.</Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
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
