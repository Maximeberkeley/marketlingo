import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { useInterviewNotebook } from '../../hooks/useInterviewNotebook';

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
}

const CONSULTING_GLOSSARY: GlossaryTerm[] = [
  { term: 'MECE', definition: 'Mutually Exclusive, Collectively Exhaustive. A framework for organizing ideas without overlap or gaps.', category: 'Framework' },
  { term: 'TAM', definition: 'Total Addressable Market. The full revenue opportunity available for a product or service.', category: 'Market Sizing' },
  { term: 'SAM', definition: 'Serviceable Available Market. The portion of TAM you can reach with your business model.', category: 'Market Sizing' },
  { term: 'SOM', definition: 'Serviceable Obtainable Market. The realistic share of SAM you can capture.', category: 'Market Sizing' },
  { term: 'ROI', definition: 'Return on Investment. Net profit divided by cost of investment, expressed as a percentage.', category: 'Financial' },
  { term: 'CAGR', definition: 'Compound Annual Growth Rate. The smoothed annual rate of growth over a period.', category: 'Financial' },
  { term: 'NPV', definition: 'Net Present Value. The difference between present value of cash inflows and outflows.', category: 'Financial' },
  { term: 'IRR', definition: 'Internal Rate of Return. The discount rate that makes NPV equal to zero.', category: 'Financial' },
  { term: 'EBITDA', definition: 'Earnings Before Interest, Taxes, Depreciation, and Amortization. A measure of operating performance.', category: 'Financial' },
  { term: 'P&L', definition: 'Profit and Loss statement. Shows revenue, costs, and net income over a period.', category: 'Financial' },
  { term: 'SWOT', definition: 'Strengths, Weaknesses, Opportunities, Threats. A strategic analysis framework.', category: 'Framework' },
  { term: 'BCG Matrix', definition: 'Portfolio analysis tool classifying products by market growth and market share.', category: 'Framework' },
  { term: 'Porter\'s Five Forces', definition: 'Framework analyzing five competitive forces: rivalry, new entrants, substitutes, buyer power, supplier power.', category: 'Framework' },
  { term: 'Value Chain', definition: 'The full range of activities a company performs to create a product from design to delivery.', category: 'Framework' },
  { term: 'Market Entry', definition: 'Strategy for entering a new market. Consider organic growth, M&A, or partnerships.', category: 'Strategy' },
  { term: 'Due Diligence', definition: 'Comprehensive investigation of a business before a merger, acquisition, or investment.', category: 'Strategy' },
  { term: 'Synergies', definition: 'Combined value and performance of two companies exceeding the sum of their individual parts.', category: 'Strategy' },
  { term: 'Unit Economics', definition: 'Revenue and cost analysis per unit. Key: Customer Acquisition Cost vs Lifetime Value.', category: 'Financial' },
  { term: 'CAC', definition: 'Customer Acquisition Cost. Total cost of acquiring a new customer.', category: 'Financial' },
  { term: 'LTV', definition: 'Lifetime Value. Total revenue expected from a single customer over their lifetime.', category: 'Financial' },
  { term: 'Breakeven', definition: 'The point where total revenue equals total costs. No profit, no loss.', category: 'Financial' },
  { term: 'Churn Rate', definition: 'Percentage of customers who stop using a product in a given period.', category: 'Metrics' },
  { term: 'Retention Rate', definition: 'Percentage of customers who continue using a product. Retention = 1 - Churn.', category: 'Metrics' },
  { term: 'Gross Margin', definition: 'Revenue minus COGS divided by revenue. Shows production profitability.', category: 'Financial' },
  { term: 'Pivot', definition: 'A fundamental change in business strategy or product direction based on market feedback.', category: 'Strategy' },
];

export function InterviewGlossary({ marketName, marketId }: { marketName: string; marketId?: string }) {
  const [search, setSearch] = useState('');
  const { saveToNotebook, saving } = useInterviewNotebook(marketId || 'default');

  const filtered = useMemo(() => {
    if (!search.trim()) return CONSULTING_GLOSSARY;
    const q = search.toLowerCase();
    return CONSULTING_GLOSSARY.filter(t =>
      t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    );
  }, [search]);

  const grouped = useMemo(() => {
    const groups: Record<string, GlossaryTerm[]> = {};
    filtered.forEach(t => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [filtered]);

  return (
    <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={st.sectionHeader}>
        <View style={[st.sectionIconBg, { backgroundColor: '#8B5CF6' }]}>
          <Feather name="book" size={18} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.sectionTitle}>Glossary</Text>
          <Text style={st.sectionSubtitle}>{CONSULTING_GLOSSARY.length} consulting terms</Text>
        </View>
      </View>

      {/* Search */}
      <View style={st.searchBar}>
        <Feather name="search" size={16} color={COLORS.textMuted} />
        <TextInput
          style={st.searchInput}
          placeholder="Search terms..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Text style={st.resultCount}>{filtered.length} results</Text>
        )}
      </View>

      {/* Terms by category */}
      {Object.entries(grouped).map(([category, terms]) => (
        <View key={category}>
          <Text style={st.categoryLabel}>{category}</Text>
          {terms.map(t => (
            <View key={t.term} style={st.termCard}>
              <Text style={st.termName}>{t.term}</Text>
              <Text style={st.termDef}>{t.definition}</Text>
            </View>
          ))}
        </View>
      ))}

      {filtered.length === 0 && (
        <View style={st.emptyState}>
          <Feather name="search" size={32} color={COLORS.textMuted} />
          <Text style={st.emptyText}>No terms found for "{search}"</Text>
        </View>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sectionIconBg: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...TYPE.h2, color: COLORS.textPrimary },
  sectionSubtitle: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 11, marginTop: 1 },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  searchInput: { ...TYPE.body, color: COLORS.textPrimary, flex: 1 },
  resultCount: { ...TYPE.caption, color: COLORS.textMuted, fontSize: 10 },

  categoryLabel: { ...TYPE.overline, color: '#7C3AED', marginBottom: 8, marginTop: 4 },
  termCard: { padding: 14, borderRadius: 12, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, ...SHADOWS.sm },
  termName: { ...TYPE.bodyBold, color: COLORS.textPrimary, fontSize: 15, marginBottom: 4 },
  termDef: { ...TYPE.body, color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },

  emptyState: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { ...TYPE.body, color: COLORS.textMuted },
});
