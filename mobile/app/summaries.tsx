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

const typeColors: Record<string, { bg: string; text: string; label: string }> = {
  weekly: { bg: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA', label: 'Weekly Recap' },
  daily: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', label: 'Daily Insight' },
  market: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', label: 'Market Update' },
};

export default function SummariesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_market')
        .eq('id', user.id)
        .single();

      const market = profile?.selected_market || 'aerospace';

      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('market_id', market)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setSummaries(data.map(s => ({
          ...s,
          key_takeaways: Array.isArray(s.key_takeaways) ? s.key_takeaways as string[] : null,
        })));
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

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

        <Text style={styles.title}>Summaries</Text>
        <Text style={styles.subtitle}>Key takeaways from your learning journey</Text>

        {summaries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
            <Text style={styles.emptyTitle}>No summaries yet</Text>
            <Text style={styles.emptySubtitle}>Complete lessons to unlock weekly summaries</Text>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 16 }}>
            {summaries.map((s) => {
              const tc = typeColors[s.summary_type] || typeColors.daily;
              const isExpanded = expandedId === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.card, isExpanded && { borderColor: tc.text + '40' }]}
                  activeOpacity={0.7}
                  onPress={() => setExpandedId(isExpanded ? null : s.id)}
                >
                  {/* Header row */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: tc.bg }]}>
                      <Text style={[styles.typeBadgeText, { color: tc.text }]}>{tc.label}</Text>
                    </View>
                    <Text style={styles.cardDate}>
                      {new Date(s.for_date || s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={[styles.expandChevron, { color: COLORS.textMuted }]}>{isExpanded ? '▾' : '▸'}</Text>
                  </View>

                  <Text style={styles.cardTitle}>{s.title}</Text>

                  {isExpanded && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.cardContent}>{s.content}</Text>

                      {/* Key Takeaways */}
                      {s.key_takeaways && s.key_takeaways.length > 0 && (
                        <View style={styles.takeawaysCard}>
                          <Text style={styles.takeawaysTitle}>💡 Key Takeaways</Text>
                          {s.key_takeaways.map((takeaway, i) => (
                            <View key={i} style={styles.takeawayRow}>
                              <View style={[styles.takeawayDot, { backgroundColor: tc.text }]} />
                              <Text style={styles.takeawayText}>{takeaway}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16 },
  backText: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardDate: { fontSize: 11, color: COLORS.textMuted, flex: 1 },
  expandChevron: { fontSize: 14 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 21 },
  cardContent: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 10 },
  takeawaysCard: {
    backgroundColor: 'rgba(139,92,246,0.05)', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)',
  },
  takeawaysTitle: { fontSize: 12, fontWeight: '600', color: COLORS.accent, marginBottom: 8 },
  takeawayRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  takeawayDot: { width: 5, height: 5, borderRadius: 3, marginTop: 5, flexShrink: 0 },
  takeawayText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, flex: 1 },
});
