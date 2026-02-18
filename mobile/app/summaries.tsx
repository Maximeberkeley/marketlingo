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
  tags: string[];
}

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

      if (!error) setSummaries(data || []);
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
            {summaries.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => setExpandedId(expandedId === s.id ? null : s.id)}
              >
                <Text style={styles.cardTitle}>{s.title}</Text>
                <Text style={styles.cardDate}>
                  {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                {expandedId === s.id && (
                  <Text style={styles.cardContent}>{s.content}</Text>
                )}
                {s.tags && s.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {s.tags.slice(0, 3).map((tag, i) => (
                      <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
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
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  cardDate: { fontSize: 11, color: COLORS.textMuted, marginBottom: 8 },
  cardContent: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 8 },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '500', color: COLORS.accent },
});
