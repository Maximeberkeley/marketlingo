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

interface MarketStatus {
  market_id: string;
  total_lessons: number;
  max_day: number;
}

const MARKETS = [
  { id: 'aerospace', name: 'Aerospace', icon: '✈️' },
  { id: 'neuroscience', name: 'Neuroscience', icon: '🧠' },
  { id: 'ai', name: 'AI', icon: '🤖' },
  { id: 'fintech', name: 'Fintech', icon: '💳' },
  { id: 'biotech', name: 'Biotech', icon: '🧬' },
  { id: 'ev', name: 'EV', icon: '🔋' },
  { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔒' },
  { id: 'cleanenergy', name: 'Clean Energy', icon: '☀️' },
  { id: 'spacetech', name: 'Space Tech', icon: '🚀' },
  { id: 'healthtech', name: 'HealthTech', icon: '🏥' },
  { id: 'robotics', name: 'Robotics', icon: '🦾' },
  { id: 'agtech', name: 'AgTech', icon: '🌾' },
  { id: 'climatetech', name: 'ClimateTech', icon: '🌍' },
  { id: 'logistics', name: 'Logistics', icon: '📦' },
  { id: 'web3', name: 'Web3', icon: '⛓️' },
];

const MONTHS = [
  { month: 1, theme: 'Foundations', color: '#3B82F6' },
  { month: 2, theme: 'Forces & Cycles', color: '#10B981' },
  { month: 3, theme: 'Startup Patterns', color: '#EF4444' },
  { month: 4, theme: 'Key Players', color: '#8B5CF6' },
  { month: 5, theme: 'Investment Lens', color: '#F59E0B' },
  { month: 6, theme: 'Builder Mode', color: '#EC4899' },
];

export default function AdminContentScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [marketStatuses, setMarketStatuses] = useState<MarketStatus[]>([]);
  const [selectedMarket, setSelectedMarket] = useState('aerospace');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string>('all');
  const [planInfo, setPlanInfo] = useState<{ existingDays: number[]; daysToGenerate: number[]; goalStats?: Record<string, { existing: number; toGenerate: number }> } | null>(null);

  const GOALS = [
    { id: 'all', label: 'All Goals', icon: '🎯' },
    { id: 'career', label: 'Career', icon: '💼' },
    { id: 'invest', label: 'Invest', icon: '📊' },
    { id: 'build_startup', label: 'Startup', icon: '🚀' },
    { id: 'curiosity', label: 'Curiosity', icon: '🔍' },
  ];

  useEffect(() => { loadMarketStatuses(); }, []);

  const loadMarketStatuses = async () => {
    const { data } = await supabase.from('stacks').select('market_id, tags').contains('tags', ['MICRO_LESSON']);
    const statusMap = new Map<string, { count: number; maxDay: number }>();
    data?.forEach((stack) => {
      const tags = stack.tags as string[];
      const dayTag = tags?.find((t) => t.startsWith('day-'));
      const day = dayTag ? parseInt(dayTag.replace('day-', '')) : 0;
      if (!statusMap.has(stack.market_id)) statusMap.set(stack.market_id, { count: 0, maxDay: 0 });
      const s = statusMap.get(stack.market_id)!;
      s.count++;
      s.maxDay = Math.max(s.maxDay, day);
    });
    setMarketStatuses(Array.from(statusMap.entries()).map(([market_id, { count, maxDay }]) => ({ market_id, total_lessons: count, max_day: maxDay })));
  };

  const getMarketStatus = (id: string) => marketStatuses.find((s) => s.market_id === id) || { total_lessons: 0, max_day: 0 };

  const fetchPlan = async (marketId: string, month?: number) => {
    setLoading(true);
    try {
      const body: any = { marketId, month, dryRun: true };
      if (selectedGoal !== 'all') body.goal = selectedGoal;
      const { data, error } = await supabase.functions.invoke('generate-curriculum', { body });
      if (error) throw error;
      setPlanInfo(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch curriculum plan');
    }
    setLoading(false);
  };

  const generateContent = async () => {
    if (!selectedMonth) return;
    Alert.alert(
      'Generate Content',
      `Generate ${MARKETS.find((m) => m.id === selectedMarket)?.name} Month ${selectedMonth}? This may take several minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const body: any = { marketId: selectedMarket, month: selectedMonth, batchSize: 3 };
              if (selectedGoal !== 'all') body.goal = selectedGoal;
              const { data, error } = await supabase.functions.invoke('generate-curriculum', { body });
              if (error) throw error;
              Alert.alert('Done', `Generated ${data.generated?.length || 0} days, skipped ${data.skipped?.length || 0}`);
              loadMarketStatuses();
            } catch {
              Alert.alert('Error', 'Failed to generate content');
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const generateSummaries = async () => {
    if (!selectedMonth) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-curriculum', { body: { marketId: selectedMarket, month: selectedMonth, generateSummaries: true } });
      if (error) throw error;
      Alert.alert('Done', `Generated ${data.weekly?.length || 0} weekly + 1 monthly summary!`);
    } catch {
      Alert.alert('Error', 'Failed to generate summaries');
    }
    setLoading(false);
  };

  const getMonthProgress = (monthNum: number) => {
    if (!planInfo) return 0;
    const start = (monthNum - 1) * 30 + 1;
    const end = monthNum * 30;
    const existing = planInfo.existingDays?.filter((d) => d >= start && d <= end).length || 0;
    return Math.round((existing / 30) * 100);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Content Manager</Text>
          <Text style={styles.headerSub}>Generate 180-day curriculum</Text>
        </View>
        {loading && <ActivityIndicator color={COLORS.accent} style={{ marginLeft: 'auto' }} />}
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        {/* Market selector */}
        <Text style={styles.sectionTitle}>🌍 Select Industry</Text>
        <View style={styles.marketsGrid}>
          {MARKETS.map((market) => {
            const status = getMarketStatus(market.id);
            const pct = Math.round((status.max_day / 180) * 100);
            const isSelected = selectedMarket === market.id;
            return (
              <TouchableOpacity
                key={market.id}
                style={[styles.marketCard, isSelected && styles.marketCardSelected]}
                onPress={() => { setSelectedMarket(market.id); setSelectedMonth(null); fetchPlan(market.id); }}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>{market.icon}</Text>
                <Text style={styles.marketName} numberOfLines={1}>{market.name}</Text>
                <View style={styles.marketProgressBg}>
                  <View style={[styles.marketProgressFill, { width: `${pct}%` as any }]} />
                </View>
                <Text style={styles.marketPct}>{pct}%</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Goal Selector */}
        <Text style={styles.sectionTitle}>🎯 Learning Goal</Text>
        <View style={styles.goalsRow}>
          {GOALS.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[styles.goalChip, selectedGoal === g.id && styles.goalChipSelected]}
              onPress={() => { setSelectedGoal(g.id); fetchPlan(selectedMarket, selectedMonth ?? undefined); }}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: 12 }}>{g.icon}</Text>
              <Text style={[styles.goalChipText, selectedGoal === g.id && styles.goalChipTextSelected]}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Per-goal stats */}
        {planInfo?.goalStats && (
          <View style={styles.goalStatsRow}>
            {Object.entries(planInfo.goalStats).map(([goalKey, stats]) => (
              <View key={goalKey} style={styles.goalStatItem}>
                <Text style={styles.goalStatLabel}>{goalKey.replace('_', ' ')}</Text>
                <Text style={styles.goalStatValue}>{stats.existing}/180</Text>
              </View>
            ))}
          </View>
        )}

        {/* Overview */}
        {planInfo && (
          <View style={styles.overviewCard}>
            <Text style={styles.sectionTitle}>
              {MARKETS.find((m) => m.id === selectedMarket)?.icon}{' '}
              {MARKETS.find((m) => m.id === selectedMarket)?.name} Overview
            </Text>
            <View style={styles.overviewRow}>
              <View style={styles.overviewStat}>
                <View style={[styles.overviewDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.overviewStatText}>Existing: {planInfo.existingDays?.length || 0}</Text>
              </View>
              <View style={styles.overviewStat}>
                <View style={[styles.overviewDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.overviewStatText}>To generate: {planInfo.daysToGenerate?.length || 0}</Text>
              </View>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${((planInfo.existingDays?.length || 0) / 180) * 100}%` as any }]} />
            </View>
            <Text style={styles.progressLabel}>{planInfo.existingDays?.length || 0}/180 days complete</Text>
          </View>
        )}

        {/* Month picker */}
        <Text style={styles.sectionTitle}>📅 Select Month</Text>
        <View style={styles.monthsGrid}>
          {MONTHS.map((m) => {
            const pct = getMonthProgress(m.month);
            const isSelected = selectedMonth === m.month;
            return (
              <TouchableOpacity
                key={m.month}
                style={[styles.monthCard, isSelected && { borderColor: m.color + '80' }]}
                onPress={() => { setSelectedMonth(m.month); fetchPlan(selectedMarket, m.month); }}
                activeOpacity={0.8}
              >
                <View style={[styles.monthIcon, { backgroundColor: m.color + '25' }]}>
                  <Text style={[styles.monthNum, { color: m.color }]}>{m.month}</Text>
                </View>
                <Text style={styles.monthTheme} numberOfLines={1}>{m.theme}</Text>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: m.color }]} />
                </View>
                <Text style={styles.monthPct}>{pct}%</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Actions for selected month */}
        {selectedMonth && (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>
              Month {selectedMonth}: {MONTHS.find((m) => m.month === selectedMonth)?.theme}
            </Text>
            <Text style={styles.actionsSub}>
              {planInfo?.daysToGenerate?.length || 0} days to generate
            </Text>
            <View style={styles.actionsBtns}>
              <TouchableOpacity style={styles.summariesBtn} onPress={generateSummaries} disabled={loading} activeOpacity={0.8}>
                <Text style={styles.summariesBtnText}>📖 Summaries</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.generateBtn, (!planInfo || planInfo.daysToGenerate?.length === 0) && styles.btnDisabled]}
                onPress={generateContent}
                disabled={loading || !planInfo || planInfo.daysToGenerate?.length === 0}
                activeOpacity={0.85}
              >
                <Text style={styles.generateBtnText}>▶ Generate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: COLORS.bg1, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 18, color: COLORS.textPrimary },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 11, color: COLORS.textMuted },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 10, marginTop: 8 },
  marketsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  marketCard: {
    width: '30%', padding: 10, borderRadius: 12,
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  marketCardSelected: { borderColor: COLORS.accent, backgroundColor: 'rgba(139,92,246,0.08)' },
  marketName: { fontSize: 10, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 6, textAlign: 'center' },
  marketProgressBg: { width: '100%', height: 3, borderRadius: 2, backgroundColor: COLORS.border, overflow: 'hidden' },
  marketProgressFill: { height: 3, backgroundColor: COLORS.accent, borderRadius: 2 },
  marketPct: { fontSize: 9, color: COLORS.textMuted, marginTop: 3 },
  overviewCard: { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  overviewRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  overviewStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  overviewDot: { width: 8, height: 8, borderRadius: 4 },
  overviewStatText: { fontSize: 12, color: COLORS.textPrimary },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: COLORS.border, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: 6, backgroundColor: COLORS.accent, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: COLORS.textMuted },
  monthsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  monthCard: {
    width: '47%', padding: 14, borderRadius: 14,
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border,
  },
  monthIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  monthNum: { fontSize: 16, fontWeight: '700' },
  monthTheme: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 6 },
  monthPct: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  actionsCard: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', marginBottom: 16,
  },
  actionsTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  actionsSub: { fontSize: 12, color: COLORS.textMuted, marginBottom: 14 },
  actionsBtns: { flexDirection: 'row', gap: 10 },
  summariesBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  summariesBtnText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
  generateBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: COLORS.accent, alignItems: 'center',
  },
  generateBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  btnDisabled: { opacity: 0.4 },
  goalsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  goalChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border,
  },
  goalChipSelected: { borderColor: COLORS.accent, backgroundColor: 'rgba(139,92,246,0.08)' },
  goalChipText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  goalChipTextSelected: { color: COLORS.accent },
  goalStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  goalStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  goalStatLabel: { fontSize: 10, color: COLORS.textMuted, textTransform: 'capitalize' },
  goalStatValue: { fontSize: 10, color: COLORS.textPrimary, fontWeight: '600' },
});
