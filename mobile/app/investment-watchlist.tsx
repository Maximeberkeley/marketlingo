import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useInvestmentLab } from '../hooks/useInvestmentLab';
import { Feather } from '@expo/vector-icons';

export default function InvestmentWatchlistScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarket = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('selected_market').eq('id', user.id).single();
      if (profile?.selected_market) setSelectedMarket(profile.selected_market);
      setLoading(false);
    };
    fetchMarket();
  }, [user]);

  const { progress, loading: labLoading, isUnlocked, removeFromWatchlist } = useInvestmentLab(selectedMarket || undefined);

  const handleRemove = async (companyId: string, companyName: string) => {
    Alert.alert('Remove', `Remove ${companyName} from watchlist?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromWatchlist(companyId) },
    ]);
  };

  if (loading || labLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const watchlist = progress?.watchlist_companies || [];

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

        {/* Add Companies CTA */}
        <TouchableOpacity style={styles.addCard} onPress={() => router.push('/(tabs)/home')}>
          <View style={styles.addIcon}>
            <Text style={{ fontSize: 20, color: COLORS.accent }}>+</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addTitle}>Add Companies</Text>
            <Text style={styles.addDesc}>Browse Key Players to add to your watchlist</Text>
          </View>
        </TouchableOpacity>

        {/* Watchlist */}
        {watchlist.length > 0 ? (
          <View style={{ gap: 8, marginTop: 16 }}>
            <Text style={styles.sectionTitle}>TRACKED COMPANIES</Text>
            {watchlist.map((company, index) => (
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
                  <Text style={{ fontSize: 14, color: '#EF4444', fontWeight: '600' }}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Image source={APP_ICONS.passport} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
            </View>
            <Text style={styles.emptyTitle}>No Companies Yet</Text>
            <Text style={styles.emptySubtitle}>Add companies from Key Players section to track them here</Text>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Watchlist Tips</Text>
          <Text style={styles.tipsItem}>• Track companies you're interested in investing in</Text>
          <Text style={styles.tipsItem}>• Add from Key Players when exploring industries</Text>
          <Text style={styles.tipsItem}>• Use for building your investment thesis</Text>
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
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 40, marginTop: 16 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', maxWidth: 260 },
  tipsCard: { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, marginTop: 20, borderWidth: 1, borderColor: COLORS.border },
  tipsTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  tipsItem: { fontSize: 12, color: COLORS.textMuted, lineHeight: 20 },
});
