import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, TYPE, SHADOWS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useInvestmentLab } from '../hooks/useInvestmentLab';
import { Feather } from '@expo/vector-icons';

const SOPHIA_AVATAR = require('../assets/mentors/mentor-sophia.png');

interface GuideStep {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  description: string;
  tips: string[];
  action?: { label: string; route: string; params?: any };
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'thesis',
    number: 1,
    title: 'Define Your Thesis',
    subtitle: 'What do you believe about this market?',
    icon: 'edit-3',
    color: '#8B5CF6',
    description:
      'Every great portfolio starts with a thesis — a clear belief about where an industry is heading. Your thesis guides every investment decision.',
    tips: [
      'Identify 2-3 mega-trends driving the industry (e.g., electrification, AI adoption)',
      'Define your time horizon: 1 year, 5 years, or 10+ years?',
      'Ask yourself: "What would have to be true for this market to 3x?"',
      'Write a one-sentence thesis you can explain to anyone',
    ],
  },
  {
    id: 'research',
    number: 2,
    title: 'Research Key Players',
    subtitle: 'Understand who moves the market',
    icon: 'search',
    color: '#3B82F6',
    description:
      'Deep research separates conviction from speculation. Study the companies that define your chosen market — their moats, financials, and competitive dynamics.',
    tips: [
      'Study the top 5-10 companies in the sector using Key Players',
      'Compare business models: asset-light vs. capital-intensive',
      'Look for competitive moats: patents, network effects, switching costs',
      'Read the investment slides for each company to understand their thesis',
    ],
    action: { label: 'Browse Key Players', route: '/(tabs)/home' },
  },
  {
    id: 'watchlist',
    number: 3,
    title: 'Build Your Watchlist',
    subtitle: 'Curate your potential investments',
    icon: 'bookmark',
    color: '#10B981',
    description:
      'Your watchlist is your shortlist of companies that align with your thesis. Track 8-15 companies you believe in, then narrow down to your top picks.',
    tips: [
      'Start with 10-15 companies, then narrow to 5-8 conviction picks',
      'Mix established leaders with high-growth challengers',
      'Include different segments of the value chain for diversification',
      'Track companies before investing — patience is an edge',
    ],
    action: { label: 'Open Watchlist', route: '/investment-watchlist' },
  },
  {
    id: 'allocation',
    number: 4,
    title: 'Allocate Your Portfolio',
    subtitle: 'Decide how much goes where',
    icon: 'pie-chart',
    color: '#F59E0B',
    description:
      'Position sizing is where most investors fail. Allocate based on conviction, risk tolerance, and correlation between holdings.',
    tips: [
      'Core holdings (60-70%): High-conviction, established companies',
      'Growth positions (20-30%): Higher risk, higher potential',
      'Speculative bets (5-10%): Moonshot ideas with asymmetric upside',
      'No single position should exceed 25% of your portfolio',
    ],
    action: { label: 'Build Portfolio', route: '/portfolio-builder' },
  },
  {
    id: 'review',
    number: 5,
    title: 'Review & Rebalance',
    subtitle: 'Continuous improvement',
    icon: 'refresh-cw',
    color: '#EF4444',
    description:
      'A portfolio is never "done." Set a regular review cadence — quarterly at minimum — to assess performance, rebalance positions, and update your thesis.',
    tips: [
      'Review quarterly: has your thesis changed? Have company fundamentals shifted?',
      'Rebalance when any position drifts >5% from target allocation',
      'Add to winners cautiously, cut losers without emotion',
      'Track your rationale for every buy/sell decision for learning',
    ],
  },
];

export default function PortfolioGuideScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState<string | null>('thesis');

  useEffect(() => {
    const fetchMarket = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_market')
        .eq('id', user.id)
        .single();
      if (profile?.selected_market) setSelectedMarket(profile.selected_market);
      setLoading(false);
    };
    fetchMarket();
  }, [user]);

  const { progress } = useInvestmentLab(selectedMarket || undefined);
  const watchlistCount = progress?.watchlist_companies?.length || 0;

  const getStepStatus = (stepId: string): 'locked' | 'active' | 'done' => {
    // Simple progression based on watchlist & module scores
    if (stepId === 'thesis') return 'done'; // Always accessible
    if (stepId === 'research') return 'active';
    if (stepId === 'watchlist') return watchlistCount > 0 ? 'done' : 'active';
    if (stepId === 'allocation') return watchlistCount >= 3 ? 'active' : 'locked';
    if (stepId === 'review') return watchlistCount >= 5 ? 'active' : 'locked';
    return 'locked';
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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <Image source={SOPHIA_AVATAR} style={styles.heroAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Portfolio Building Guide</Text>
            <Text style={styles.heroSubtitle}>
              5 steps to your first investment portfolio
            </Text>
          </View>
        </View>

        <Text style={styles.heroDesc}>
          Follow this structured guide to go from market curiosity to a well-constructed investment portfolio. Each step builds on the last.
        </Text>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {GUIDE_STEPS.map((step, index) => {
            const isExpanded = expandedStep === step.id;
            const status = getStepStatus(step.id);
            const isLast = index === GUIDE_STEPS.length - 1;

            return (
              <View key={step.id}>
                {/* Timeline connector */}
                <View style={styles.timelineRow}>
                  {/* Timeline dot + line */}
                  <View style={styles.timelineCol}>
                    <View
                      style={[
                        styles.timelineDot,
                        {
                          backgroundColor:
                            status === 'done'
                              ? '#22C55E'
                              : status === 'active'
                              ? step.color
                              : COLORS.border,
                        },
                      ]}
                    >
                      {status === 'done' ? (
                        <Text style={styles.dotCheck}>✓</Text>
                      ) : (
                        <Text style={styles.dotNumber}>{step.number}</Text>
                      )}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.timelineLine,
                          {
                            backgroundColor:
                              status === 'done' ? '#22C55E40' : COLORS.border,
                          },
                        ]}
                      />
                    )}
                  </View>

                  {/* Card */}
                  <TouchableOpacity
                    style={[
                      styles.stepCard,
                      isExpanded && { borderColor: step.color + '40' },
                      status === 'locked' && { opacity: 0.5 },
                    ]}
                    onPress={() =>
                      setExpandedStep(isExpanded ? null : step.id)
                    }
                    disabled={status === 'locked'}
                    activeOpacity={0.7}
                  >
                    <View style={styles.stepHeader}>
                      <View
                        style={[
                          styles.stepIconWrap,
                          { backgroundColor: step.color + '15' },
                        ]}
                      >
                        <Feather name={step.icon} size={18} color={step.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepSubtitle}>
                          {step.subtitle}
                        </Text>
                      </View>
                      <Feather
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={COLORS.textMuted}
                      />
                    </View>

                    {isExpanded && (
                      <View style={styles.stepBody}>
                        <Text style={styles.stepDesc}>{step.description}</Text>

                        <View style={styles.tipsBox}>
                          <Text style={styles.tipsLabel}>Key Actions</Text>
                          {step.tips.map((tip, i) => (
                            <View key={i} style={styles.tipRow}>
                              <View
                                style={[
                                  styles.tipBullet,
                                  { backgroundColor: step.color },
                                ]}
                              />
                              <Text style={styles.tipText}>{tip}</Text>
                            </View>
                          ))}
                        </View>

                        {step.action && (
                          <TouchableOpacity
                            style={[
                              styles.actionBtn,
                              { backgroundColor: step.color },
                            ]}
                            onPress={() =>
                              router.push(step.action!.route as any)
                            }
                          >
                            <Text style={styles.actionBtnText}>
                              {step.action.label}
                            </Text>
                            <Feather
                              name="arrow-right"
                              size={16}
                              color="#fff"
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Bottom CTA */}
        <View style={styles.bottomCard}>
          <Feather name="award" size={22} color={COLORS.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bottomTitle}>Ready for Certification?</Text>
            <Text style={styles.bottomDesc}>
              Complete the Investment Lab modules to earn your certification
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/investment-lab')}>
            <Text style={styles.bottomLink}>Go →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16 },
  header: { marginBottom: 16 },
  backText: { fontSize: 15, color: COLORS.textSecondary },

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(139,92,246,0.4)',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  heroDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },

  stepsContainer: { gap: 0 },

  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineCol: {
    width: 32,
    alignItems: 'center',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCheck: { fontSize: 14, fontWeight: '700', color: '#fff' },
  dotNumber: { fontSize: 13, fontWeight: '700', color: '#fff' },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
  },

  stepCard: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stepSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  stepBody: { marginTop: 16 },
  stepDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 21,
    marginBottom: 16,
  },

  tipsBox: {
    backgroundColor: COLORS.bg1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  tipsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  bottomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  bottomTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  bottomDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  bottomLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
