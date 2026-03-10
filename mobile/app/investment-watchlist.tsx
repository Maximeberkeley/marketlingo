import React, { useState, useEffect, useMemo } from 'react';
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
import { useInvestmentLab } from '../hooks/useInvestmentLab';
import { marketCompanies, defaultCompanies } from '../data/keyPlayersData';
import { Feather } from '@expo/vector-icons';

export default function InvestmentWatchlistScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchMarket = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('selected_market').eq('id', user.id).single();
      if (profile?.selected_market) setSelectedMarket(profile.selected_market);
      setLoading(false);
    };
    fetchMarket();
  }, [user]);

  const { progress, loading: labLoading, removeFromWatchlist, addToWatchlist } = useInvestmentLab(selectedMarket || undefined);

  const watchlist = progress?.watchlist_companies || [];

  // All companies from Key Players data
  const allCompanies = useMemo(() => {
    return marketCompanies[selectedMarket || ''] || defaultCompanies;
  }, [selectedMarket]);

  // Auto-suggest companies from Key Players data (not already in watchlist)
  const suggestedCompanies = useMemo(() => {
    const watchlistIds = new Set(watchlist.map((c) => c.id));
    return allCompanies
      .filter((c) => !watchlistIds.has(c.id))
      .map((c) => ({ id: c.id, name: c.name, ticker: c.ticker }));
  }, [allCompanies, watchlist]);

  const handleRemove = async (companyId: string, companyName: string) => {
    Alert.alert('Remove', `Remove ${companyName} from watchlist?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromWatchlist(companyId) },
    ]);
  };

  const handleAdd = async (company: { id: string; name: string; ticker?: string }) => {
    await addToWatchlist(company);
  };

  if (loading || labLoading) {
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
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Watchlist</Text>
            <Text style={styles.subtitle}>{watchlist.length} {watchlist.length === 1 ? 'company' : 'companies'} tracked</Text>
          </View>
        </View>

        {/* Quick Add Suggestions */}
        {suggestedCompanies.length > 0 && (
          <View style={styles.suggestionsCard}>
            <TouchableOpacity
              style={styles.suggestionsHeader}
              onPress={() => setShowSuggestions(!showSuggestions)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="star" size={16} color="#F59E0B" />
                <Text style={styles.suggestionsTitle}>Suggested Companies</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.suggestionsCount}>{suggestedCompanies.length}</Text>
                <Feather name={showSuggestions ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>

            {showSuggestions && (
              <View style={styles.suggestionsList}>
                {suggestedCompanies.map((company) => (
                  <TouchableOpacity
                    key={company.id}
                    style={styles.suggestionItem}
                    onPress={() => handleAdd(company)}
                  >
                    <Feather name="globe" size={14} color={COLORS.textMuted} />
                    <Text style={styles.suggestionName} numberOfLines={1}>{company.name}</Text>
                    {company.ticker && <Text style={styles.suggestionTicker}>{company.ticker}</Text>}
                    <View style={styles.addChip}>
                      <Feather name="plus" size={12} color={COLORS.accent} />
                      <Text style={styles.addChipText}>Add</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Browse All Companies */}
        <TouchableOpacity style={styles.addCard} onPress={() => setShowSuggestions(true)}>
          <View style={styles.addIcon}>
            <Feather name="search" size={18} color={COLORS.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addTitle}>Browse All Companies</Text>
            <Text style={styles.addDesc}>{allCompanies.length} companies available to track</Text>
          </View>
          <Text style={{ fontSize: 18, color: COLORS.textMuted }}>›</Text>
        </TouchableOpacity>

        {/* Watchlist */}
        {watchlist.length > 0 ? (
          <View style={{ gap: 8, marginTop: 16 }}>
            <Text style={styles.sectionTitle}>TRACKED COMPANIES</Text>
            {watchlist.map((company) => (
              <View key={company.id} style={styles.companyCard}>
                <View style={styles.companyIcon}>
                  <Feather name="globe" size={16} color={COLORS.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.companyName} numberOfLines={1}>{company.name}</Text>
                  {company.ticker && <Text style={styles.companyTicker}>{company.ticker}</Text>}
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemove(company.id, company.name)}
                >
                  <Feather name="x" size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="bookmark" size={24} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Companies Yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Suggested Companies" above or browse Key Players to start building your watchlist
            </Text>
          </View>
        )}

        {/* Portfolio Builder CTA */}
        {watchlist.length >= 3 && (
          <TouchableOpacity
            style={styles.portfolioBtn}
            onPress={() => router.push('/portfolio-builder')}
          >
            <Feather name="pie-chart" size={18} color="#fff" />
            <Text style={styles.portfolioBtnText}>Build Portfolio →</Text>
          </TouchableOpacity>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Watchlist Tips</Text>
          <Text style={styles.tipsItem}>• Track companies you're interested in investing in</Text>
          <Text style={styles.tipsItem}>• Aim for 8-15 companies across different segments</Text>
          <Text style={styles.tipsItem}>• Add 3+ companies to unlock the Portfolio Builder</Text>
          <Text style={styles.tipsItem}>• Each addition earns +10 Investment XP</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backText: { fontSize: 15, color: COLORS.textSecondary },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textMuted },

  suggestionsCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  suggestionsTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  suggestionsCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  suggestionsList: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 6,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.bg1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionName: { flex: 1, fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  suggestionTicker: { fontSize: 11, color: COLORS.textMuted },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  addChipText: { fontSize: 11, fontWeight: '600', color: COLORS.accent },

  addCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
  },
  addIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.2)', alignItems: 'center', justifyContent: 'center' },
  addTitle: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  addDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 6 },
  companyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  companyIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  companyName: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  companyTicker: { fontSize: 11, color: COLORS.textMuted },
  removeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 40, marginTop: 16 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', maxWidth: 280, lineHeight: 20 },

  portfolioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  portfolioBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  tipsCard: { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, marginTop: 20, borderWidth: 1, borderColor: COLORS.border },
  tipsTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  tipsItem: { fontSize: 12, color: COLORS.textMuted, lineHeight: 20 },
});
