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
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Summary {
  id: string;
  title: string;
  content: string;
  created_at: string;
  summary_type: string;
  for_date: string;
  key_takeaways: string[] | null;
}

type TabType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

const typeColors: Record<string, { bg: string; text: string; label: string }> = {
  DAILY: { bg: 'rgba(59,130,246,0.15)', text: '#60A5FA', label: 'Daily' },
  WEEKLY: { bg: 'rgba(139,92,246,0.15)', text: '#A78BFA', label: 'Weekly' },
  MONTHLY: { bg: 'rgba(16,185,129,0.15)', text: '#34D399', label: 'Monthly' },
};

export default function SummariesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('DAILY');
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('selected_market').eq('id', user.id).single();
      const market = profile?.selected_market || 'aerospace';
      const { data } = await supabase.from('summaries').select('*').eq('market_id', market).order('for_date', { ascending: false }).limit(20);
      setSummaries((data || []).map((s) => ({ ...s, key_takeaways: Array.isArray(s.key_takeaways) ? s.key_takeaways as string[] : null })));
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const filtered = summaries.filter((s) => s.summary_type === activeTab);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatShort = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const readTime = (c: string) => Math.max(2, Math.ceil(c.length / 1000));

  // Detail view
  if (selectedSummary) {
    const tc = typeColors[selectedSummary.summary_type] || typeColors.DAILY;
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedSummary(null)}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={[styles.typePill, { backgroundColor: tc.bg }]}>
            <Text style={[styles.typePillText, { color: tc.text }]}>{tc.label}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={[styles.detailContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          <Text style={styles.detailTitle}>{selectedSummary.title}</Text>
          <View style={styles.detailMeta}>
          <Text style={styles.detailMetaText}>{formatDate(selectedSummary.for_date)}</Text>
            <Text style={styles.detailMetaText}>{readTime(selectedSummary.content)} min read</Text>
          </View>
          {selectedSummary.key_takeaways && selectedSummary.key_takeaways.length > 0 && (
            <View style={styles.takeawaysCard}>
              <Text style={styles.takeawaysTitle}>Key Takeaways</Text>
              {selectedSummary.key_takeaways.map((t, i) => (
                <View key={i} style={styles.takeawayRow}>
                  <View style={[styles.takeawayNum, { backgroundColor: tc.bg }]}>
                    <Text style={[styles.takeawayNumText, { color: tc.text }]}>{i + 1}</Text>
                  </View>
                  <Text style={styles.takeawayText}>{t}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.detailBody}>{selectedSummary.content}</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Summaries</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['DAILY', 'WEEKLY', 'MONTHLY'] as TabType[]).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={COLORS.accent} size="large" /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>📖</Text>
          <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} summaries yet</Text>
          <Text style={styles.emptySub}>Check back soon!</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>
          {filtered.map((summary) => {
            const tc = typeColors[summary.summary_type] || typeColors.DAILY;
            return (
              <TouchableOpacity key={summary.id} style={styles.summaryCard} onPress={() => setSelectedSummary(summary)} activeOpacity={0.8}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryTitle} numberOfLines={2}>{summary.title}</Text>
                  <View style={styles.summaryMeta}>
                    <Text style={styles.summaryMetaText}>{formatShort(summary.for_date)}</Text>
                    <Text style={styles.summaryMetaDot}>·</Text>
                    <Text style={styles.summaryMetaText}>{readTime(summary.content)} min</Text>
                    {summary.key_takeaways && summary.key_takeaways.length > 0 && (
                      <><Text style={styles.summaryMetaDot}>·</Text><Text style={styles.summaryMetaText}>{summary.key_takeaways.length} takeaways</Text></>
                    )}
                  </View>
                </View>
                <Text style={{ fontSize: 16, color: COLORS.textMuted }}>›</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: COLORS.bg0, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 18, color: COLORS.textPrimary },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  typePill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  typePillText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  tabs: { flexDirection: 'row', margin: 16, padding: 4, backgroundColor: COLORS.bg1, borderRadius: 12 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingTop: 4 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  summaryMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  summaryMetaText: { fontSize: 11, color: COLORS.textMuted },
  summaryMetaDot: { fontSize: 11, color: COLORS.textMuted },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '500', marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textMuted },
  detailContent: { paddingHorizontal: 16, paddingTop: 20 },
  detailTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10, lineHeight: 30 },
  detailMeta: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  detailMetaText: { fontSize: 12, color: COLORS.textMuted },
  takeawaysCard: { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  takeawaysTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  takeawayRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  takeawayNum: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  takeawayNumText: { fontSize: 10, fontWeight: '700' },
  takeawayText: { fontSize: 13, color: COLORS.textPrimary, flex: 1, lineHeight: 18 },
  detailBody: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 22, opacity: 0.85 },
});
