import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptics';
import { useInterviewNotebook } from '../../hooks/useInterviewNotebook';

interface FrameworksTabProps {
  marketName: string;
  marketId: string;
}

interface Framework {
  id: string;
  name: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  overview: string;
  whenToUse: string;
  components: { label: string; description: string; color: string }[];
  industryExample?: string;
}

const FRAMEWORKS_LIBRARY: Framework[] = [
  {
    id: 'bcg',
    name: 'BCG Matrix',
    icon: 'grid',
    color: '#7C3AED',
    overview: 'The BCG Growth-Share Matrix classifies business units or products based on market growth rate and relative market share. It helps allocate resources across a portfolio.',
    whenToUse: 'Portfolio analysis, investment prioritization, and strategic planning for multi-product companies.',
    components: [
      { label: '⭐ Stars', description: 'High growth, high share — invest heavily to maintain leadership.', color: '#F59E0B' },
      { label: '🐄 Cash Cows', description: 'Low growth, high share — generate cash, minimal investment needed.', color: '#10B981' },
      { label: '❓ Question Marks', description: 'High growth, low share — decide whether to invest or divest.', color: '#3B82F6' },
      { label: '🐕 Dogs', description: 'Low growth, low share — consider divestment or repositioning.', color: '#EF4444' },
    ],
  },
  {
    id: 'porter',
    name: "Porter's Five Forces",
    icon: 'shield',
    color: '#3B82F6',
    overview: "Michael Porter's framework analyzes five competitive forces that shape every industry. It reveals the structural factors that drive profitability.",
    whenToUse: 'Industry analysis, competitive strategy, market entry decisions, and evaluating bargaining power.',
    components: [
      { label: '⚔️ Competitive Rivalry', description: 'Intensity of competition among existing players.', color: '#EF4444' },
      { label: '🚪 Threat of New Entrants', description: 'How easy is it for newcomers to enter the market?', color: '#F59E0B' },
      { label: '🔄 Threat of Substitutes', description: 'Can customers switch to alternative products?', color: '#8B5CF6' },
      { label: '💪 Buyer Power', description: 'How much negotiating leverage do customers have?', color: '#3B82F6' },
      { label: '🏭 Supplier Power', description: 'How much control do suppliers have over pricing?', color: '#10B981' },
    ],
  },
  {
    id: 'swot',
    name: 'SWOT Analysis',
    icon: 'target',
    color: '#10B981',
    overview: 'SWOT identifies internal Strengths and Weaknesses alongside external Opportunities and Threats. It provides a snapshot for strategic decision-making.',
    whenToUse: 'Strategic planning, competitor analysis, self-assessment before a case interview.',
    components: [
      { label: '💪 Strengths', description: 'Internal advantages — what do we do well?', color: '#10B981' },
      { label: '⚠️ Weaknesses', description: 'Internal limitations — where do we fall short?', color: '#EF4444' },
      { label: '🚀 Opportunities', description: 'External factors we can exploit for growth.', color: '#3B82F6' },
      { label: '🌩️ Threats', description: 'External risks that could harm performance.', color: '#F59E0B' },
    ],
  },
  {
    id: 'profit',
    name: 'Profitability Framework',
    icon: 'trending-up',
    color: '#F59E0B',
    overview: 'The fundamental consulting framework: Profit = Revenue − Costs. Break each side into sub-drivers to find the root cause of profit changes.',
    whenToUse: 'Any profitability case — the most common type of consulting interview question.',
    components: [
      { label: '📈 Revenue', description: 'Price × Quantity. Analyze pricing, volume, mix, and segments.', color: '#10B981' },
      { label: '📉 Costs', description: 'Fixed + Variable. Identify COGS, SG&A, and operational costs.', color: '#EF4444' },
      { label: '🔍 Drivers', description: 'What changed? Is it one-time or structural?', color: '#3B82F6' },
      { label: '📊 Benchmarks', description: 'Compare to industry averages and historical performance.', color: '#F59E0B' },
    ],
  },
  {
    id: 'tam',
    name: 'TAM/SAM/SOM',
    icon: 'pie-chart',
    color: '#EC4899',
    overview: 'Market sizing framework that breaks total opportunity into Total Addressable Market, Serviceable Available Market, and Serviceable Obtainable Market.',
    whenToUse: 'Market sizing questions, startup pitch evaluation, new market entry analysis.',
    components: [
      { label: '🌍 TAM', description: 'Total Addressable Market — the full market demand for your product.', color: '#8B5CF6' },
      { label: '🎯 SAM', description: 'Serviceable Available Market — segment you can reach with your model.', color: '#3B82F6' },
      { label: '✅ SOM', description: 'Serviceable Obtainable Market — realistic share you can capture.', color: '#10B981' },
    ],
  },
];

const INDUSTRY_EXAMPLES: Record<string, Record<string, string>> = {
  aerospace: {
    bcg: 'SpaceX (Star — high growth, dominant share), Boeing Commercial (Cash Cow), Virgin Orbit (Dog — shutdown).',
    porter: 'High barriers to entry (capital, regulation), strong supplier power (few engine manufacturers), moderate buyer power.',
    swot: 'Strengths: Engineering talent. Weaknesses: Long dev cycles. Opportunities: Space tourism. Threats: Geopolitical tensions.',
    profit: 'Revenue: Fewer aircraft orders (COVID). Costs: Supply chain disruptions increasing COGS by 15%.',
    tam: 'Global space economy: $469B (TAM), Launch services: $9B (SAM), Rideshare: $500M (SOM).',
  },
  ai: {
    bcg: 'ChatGPT (Star), Google Cloud AI (Cash Cow), smaller NLP startups (Question Marks).',
    porter: 'Low barriers for software, high for compute. Strong substitution threat. Moderate buyer power.',
    swot: 'Strengths: Data moat. Weaknesses: Hallucination issues. Opportunities: Enterprise adoption. Threats: Regulation.',
    profit: 'Revenue: API pricing under pressure. Costs: GPU compute costs are 60%+ of COGS.',
    tam: 'AI market: $500B by 2028 (TAM), Enterprise AI: $100B (SAM), Vertical SaaS AI: $15B (SOM).',
  },
  fintech: {
    bcg: 'Stripe (Star), PayPal (Cash Cow), crypto exchanges (Question Marks), some neobanks (Dogs).',
    porter: 'Low switching costs, high regulation as barrier, strong incumbent rivalry.',
    swot: 'Strengths: UX innovation. Weaknesses: Trust deficit. Opportunities: Underbanked markets. Threats: Rate hikes.',
    profit: 'Revenue: Transaction fees declining due to competition. Costs: Compliance costs rising 20% YoY.',
    tam: 'Digital payments: $15T (TAM), SMB payments: $3T (SAM), Cross-border: $200B (SOM).',
  },
};

export function FrameworksTab({ marketName, marketId }: FrameworksTabProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [readFrameworks, setReadFrameworks] = useState<Set<string>>(new Set());

  const toggleFramework = (id: string) => {
    triggerHaptic('light');
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      setReadFrameworks(prev => new Set(prev).add(id));
    }
  };

  const progress = Math.round((readFrameworks.size / FRAMEWORKS_LIBRARY.length) * 100);
  const examples = INDUSTRY_EXAMPLES[marketId] || INDUSTRY_EXAMPLES.aerospace || {};

  return (
    <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={st.sectionHeader}>
        <View style={[st.sectionIconBg, { backgroundColor: '#3B82F6' }]}>
          <Feather name="book-open" size={18} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.sectionTitle}>Frameworks Library</Text>
          <Text style={st.sectionSubtitle}>{marketName} • Business models & tools</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={st.progressCard}>
        <View style={st.progressRow}>
          <Text style={st.progressLabel}>Frameworks Read</Text>
          <Text style={st.progressValue}>{readFrameworks.size}/{FRAMEWORKS_LIBRARY.length}</Text>
        </View>
        <View style={st.progressTrack}>
          <View style={[st.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Frameworks */}
      {FRAMEWORKS_LIBRARY.map((fw) => {
        const isExpanded = expanded === fw.id;
        const industryExample = examples[fw.id];
        return (
          <View key={fw.id} style={st.fwCard}>
            <TouchableOpacity onPress={() => toggleFramework(fw.id)} style={st.fwHeader}>
              <View style={[st.fwIconWrap, { backgroundColor: fw.color }]}>
                <Feather name={fw.icon} size={18} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.fwName}>{fw.name}</Text>
                <Text style={st.fwUse}>{fw.whenToUse}</Text>
              </View>
              <View style={st.fwChevron}>
                <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
              </View>
              {readFrameworks.has(fw.id) && (
                <View style={st.readBadge}>
                  <Feather name="check" size={10} color="#10B981" />
                </View>
              )}
            </TouchableOpacity>

            {isExpanded && (
              <View style={st.fwBody}>
                <Text style={st.fwOverview}>{fw.overview}</Text>

                {/* Visual Grid */}
                {fw.id === 'bcg' ? (
                  <View style={st.bcgGrid}>
                    {fw.components.map((c, i) => (
                      <View key={i} style={[st.bcgCell, { borderColor: c.color }]}>
                        <Text style={st.bcgCellLabel}>{c.label}</Text>
                        <Text style={st.bcgCellDesc}>{c.description}</Text>
                      </View>
                    ))}
                    <View style={st.bcgAxisY}>
                      <Text style={st.bcgAxisText}>Market Growth →</Text>
                    </View>
                    <View style={st.bcgAxisX}>
                      <Text style={st.bcgAxisText}>Market Share →</Text>
                    </View>
                  </View>
                ) : (
                  <View style={st.componentsList}>
                    {fw.components.map((c, i) => (
                      <View key={i} style={[st.componentItem, { borderLeftColor: c.color }]}>
                        <Text style={st.componentLabel}>{c.label}</Text>
                        <Text style={st.componentDesc}>{c.description}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Industry Example */}
                {industryExample && (
                  <View style={st.industryBox}>
                    <View style={st.industryHeader}>
                      <Feather name="zap" size={14} color="#F59E0B" />
                      <Text style={st.industryLabel}>{marketName} Example</Text>
                    </View>
                    <Text style={st.industryText}>{industryExample}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sectionIconBg: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...TYPE.h2, color: COLORS.textPrimary },
  sectionSubtitle: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 11, marginTop: 1 },

  progressCard: { padding: 14, borderRadius: 14, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, ...SHADOWS.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { ...TYPE.caption, color: COLORS.textMuted },
  progressValue: { ...TYPE.bodyBold, color: '#7C3AED', fontSize: 13 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: COLORS.bg1, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#7C3AED' },

  fwCard: { borderRadius: 16, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, overflow: 'hidden', ...SHADOWS.sm },
  fwHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  fwIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fwName: { ...TYPE.bodyBold, color: COLORS.textPrimary, fontSize: 15 },
  fwUse: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 10, marginTop: 2, lineHeight: 14 },
  fwChevron: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  readBadge: { position: 'absolute', top: 12, right: 12, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center' },

  fwBody: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 14 },
  fwOverview: { ...TYPE.body, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 16 },

  // BCG Matrix Grid
  bcgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, position: 'relative' },
  bcgCell: { width: '48%', padding: 14, borderRadius: 12, backgroundColor: COLORS.bg1, borderLeftWidth: 3 },
  bcgCellLabel: { ...TYPE.bodyBold, color: COLORS.textPrimary, fontSize: 14, marginBottom: 4 },
  bcgCellDesc: { ...TYPE.caption, color: COLORS.textSecondary, fontSize: 11, lineHeight: 16 },
  bcgAxisY: { position: 'absolute', left: -4, top: '50%', transform: [{ rotate: '-90deg' }] },
  bcgAxisX: { position: 'absolute', bottom: -20, left: '50%', transform: [{ translateX: -40 }] },
  bcgAxisText: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 9 },

  // Components List
  componentsList: { gap: 8, marginBottom: 16 },
  componentItem: { padding: 12, borderRadius: 10, backgroundColor: COLORS.bg1, borderLeftWidth: 3 },
  componentLabel: { ...TYPE.bodyBold, color: COLORS.textPrimary, fontSize: 13, marginBottom: 2 },
  componentDesc: { ...TYPE.caption, color: COLORS.textSecondary, fontSize: 11, lineHeight: 16 },

  // Industry Example
  industryBox: { padding: 14, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.06)' },
  industryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  industryLabel: { ...TYPE.bodyBold, color: '#D97706', fontSize: 12 },
  industryText: { ...TYPE.body, color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
});
