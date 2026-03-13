import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useInvestmentLab } from '../hooks/useInvestmentLab';
import { useWatchlistIntel, WatchlistNewsItem } from '../hooks/useWatchlistIntel';
import { marketCompanies, defaultCompanies, Company } from '../data/keyPlayersData';
import { CompanyDetailModal } from '../components/home/CompanyDetailModal';
import { Feather } from '@expo/vector-icons';

const segmentColors: Record<string, { bg: string; text: string }> = {
  commercial: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
  defense: { bg: 'rgba(239,68,68,0.2)', text: '#F87171' },
  space: { bg: 'rgba(139,92,246,0.2)', text: '#A78BFA' },
  propulsion: { bg: 'rgba(249,115,22,0.2)', text: '#FB923C' },
  suppliers: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  services: { bg: 'rgba(6,182,212,0.2)', text: '#22D3EE' },
  devices: { bg: 'rgba(167,139,250,0.2)', text: '#C4B5FD' },
  therapeutics: { bg: 'rgba(236,72,153,0.2)', text: '#F472B6' },
  pharma: { bg: 'rgba(99,102,241,0.2)', text: '#818CF8' },
  models: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  hardware: { bg: 'rgba(6,182,212,0.2)', text: '#22D3EE' },
  enterprise: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
  payments: { bg: 'rgba(249,115,22,0.2)', text: '#FB923C' },
  investing: { bg: 'rgba(139,92,246,0.2)', text: '#A78BFA' },
  infrastructure: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  lending: { bg: 'rgba(251,191,36,0.2)', text: '#FCD34D' },
  neobank: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
  charging: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  battery: { bg: 'rgba(99,102,241,0.2)', text: '#818CF8' },
};

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export default function InvestmentWatchlistScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBrowse, setShowBrowse] = useState(false);
  const [browseSearch, setBrowseSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState<'companies' | 'news'>('companies');

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
  const watchlistIds = useMemo(() => new Set(watchlist.map((c) => c.id)), [watchlist]);

  // News intelligence
  const { relevantNews, loading: newsLoading, getNewsCountForCompany } = useWatchlistIntel(selectedMarket || undefined, watchlist);

  // All companies from Key Players data
  const allCompanies = useMemo(() => {
    return marketCompanies[selectedMarket || ''] || defaultCompanies;
  }, [selectedMarket]);

  // Browsable companies (not on watchlist, filtered by search)
  const browsableCompanies = useMemo(() => {
    const filtered = allCompanies.filter((c) => !watchlistIds.has(c.id));
    if (!browseSearch) return filtered;
    const q = browseSearch.toLowerCase();
    return filtered.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.ticker && c.ticker.toLowerCase().includes(q)) || c.segment.toLowerCase().includes(q)
    );
  }, [allCompanies, watchlistIds, browseSearch]);

  const handleRemove = (companyId: string, companyName: string) => {
    Alert.alert('Remove', `Remove ${companyName} from watchlist?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromWatchlist(companyId) },
    ]);
  };

  const handleAdd = async (company: { id: string; name: string; ticker?: string; segment?: string }) => {
    await addToWatchlist(company);
  };

  const handleToggle = (company: Company) => {
    if (watchlistIds.has(company.id)) {
      handleRemove(company.id, company.name);
    } else {
      handleAdd({ id: company.id, name: company.name, ticker: company.ticker, segment: company.segment });
    }
  };

  // Find full company data for detail modal
  const findFullCompany = (id: string): Company | undefined =>
    allCompanies.find((c) => c.id === id);

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
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Watchlist</Text>
            <Text style={styles.subtitle}>
              {watchlist.length} {watchlist.length === 1 ? 'company' : 'companies'} tracked
              {relevantNews.length > 0 ? ` · ${relevantNews.length} news matches` : ''}
            </Text>
          </View>
        </View>

        {/* Stats bar */}
        {watchlist.length > 0 && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{watchlist.length}</Text>
              <Text style={styles.statLabel}>Tracked</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{relevantNews.length}</Text>
              <Text style={styles.statLabel}>News Hits</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{new Set(watchlist.map((c) => (c as any).segment).filter(Boolean)).size || '—'}</Text>
              <Text style={styles.statLabel}>Segments</Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        {watchlist.length > 0 && (
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'companies' && styles.tabActive]}
              onPress={() => setActiveTab('companies')}
            >
              <Feather name="globe" size={14} color={activeTab === 'companies' ? COLORS.accent : COLORS.textMuted} />
              <Text style={[styles.tabText, activeTab === 'companies' && styles.tabTextActive]}>Companies</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'news' && styles.tabActive]}
              onPress={() => setActiveTab('news')}
            >
              <Feather name="zap" size={14} color={activeTab === 'news' ? '#F59E0B' : COLORS.textMuted} />
              <Text style={[styles.tabText, activeTab === 'news' && styles.tabTextActive]}>
                News Feed{relevantNews.length > 0 ? ` (${relevantNews.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <>
            {/* Browse / Add */}
            <TouchableOpacity style={styles.browseCard} onPress={() => setShowBrowse(!showBrowse)}>
              <View style={styles.browseIcon}>
                <Feather name="search" size={18} color={COLORS.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.browseTitle}>Browse Companies</Text>
                <Text style={styles.browseDesc}>{browsableCompanies.length} available to add</Text>
              </View>
              <Feather name={showBrowse ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            {showBrowse && (
              <View style={styles.browsePanel}>
                <View style={styles.searchBar}>
                  <Feather name="search" size={14} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, ticker, or segment..."
                    placeholderTextColor={COLORS.textMuted}
                    value={browseSearch}
                    onChangeText={setBrowseSearch}
                  />
                  {browseSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setBrowseSearch('')}>
                      <Feather name="x" size={14} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {browsableCompanies.map((company) => {
                    const segStyle = segmentColors[company.segment] || { bg: 'rgba(139,92,246,0.15)', text: '#A78BFA' };
                    return (
                      <TouchableOpacity
                        key={company.id}
                        style={styles.browseItem}
                        onPress={() => handleAdd({ id: company.id, name: company.name, ticker: company.ticker, segment: company.segment })}
                      >
                        <View style={styles.browseItemLogo}>
                          {company.logoUrl ? (
                            <Image source={{ uri: company.logoUrl }} style={{ width: 24, height: 24 }} resizeMode="contain" />
                          ) : (
                            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted }}>{company.name.charAt(0)}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.browseItemName} numberOfLines={1}>{company.name}</Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                            {company.ticker && <Text style={styles.browseItemTicker}>${company.ticker}</Text>}
                            <View style={[styles.miniSegment, { backgroundColor: segStyle.bg }]}>
                              <Text style={[styles.miniSegmentText, { color: segStyle.text }]}>{company.segment}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.addChip}>
                          <Feather name="plus" size={12} color={COLORS.accent} />
                          <Text style={styles.addChipText}>Add</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {browsableCompanies.length === 0 && (
                    <Text style={styles.emptySearch}>
                      {browseSearch ? 'No matches found' : 'All companies added'}
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}

            {/* Tracked Companies */}
            {watchlist.length > 0 ? (
              <View style={{ gap: 8, marginTop: 16 }}>
                <Text style={styles.sectionTitle}>TRACKED COMPANIES</Text>
                {watchlist.map((company) => {
                  const newsCount = getNewsCountForCompany(company.name);
                  const segStyle = segmentColors[(company as any).segment || ''] || null;
                  const fullCompany = findFullCompany(company.id);
                  return (
                    <TouchableOpacity
                      key={company.id}
                      style={styles.companyCard}
                      onPress={() => fullCompany && setSelectedCompany(fullCompany)}
                      activeOpacity={fullCompany ? 0.7 : 1}
                    >
                      <View style={styles.companyLogo}>
                        {fullCompany?.logoUrl ? (
                          <Image source={{ uri: fullCompany.logoUrl }} style={{ width: 28, height: 28 }} resizeMode="contain" />
                        ) : (
                          <Feather name="globe" size={16} color={COLORS.accent} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.companyName} numberOfLines={1}>{company.name}</Text>
                          {company.ticker && <Text style={styles.companyTicker}>${company.ticker}</Text>}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          {segStyle && (company as any).segment && (
                            <View style={[styles.miniSegment, { backgroundColor: segStyle.bg }]}>
                              <Text style={[styles.miniSegmentText, { color: segStyle.text }]}>{(company as any).segment}</Text>
                            </View>
                          )}
                          {(company as any).addedAt && (
                            <Text style={styles.addedDate}>Added {formatDate((company as any).addedAt)}</Text>
                          )}
                          {newsCount > 0 && (
                            <View style={styles.newsCountBadge}>
                              <Feather name="zap" size={9} color="#F59E0B" />
                              <Text style={styles.newsCountText}>{newsCount}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemove(company.id, company.name)}
                      >
                        <Feather name="x" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Feather name="bookmark" size={24} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>No Companies Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Browse companies above or add from Key Players on the home screen
                </Text>
              </View>
            )}
          </>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <View style={{ gap: 8, marginTop: 8 }}>
            {newsLoading ? (
              <ActivityIndicator size="small" color={COLORS.accent} style={{ marginTop: 40 }} />
            ) : relevantNews.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>NEWS MENTIONING YOUR COMPANIES</Text>
                {relevantNews.map((item) => (
                  <View key={item.id} style={styles.newsCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <View style={styles.newsCompanyBadge}>
                        <Feather name="bookmark" size={9} color={COLORS.accent} />
                        <Text style={styles.newsCompanyText}>{item.matchedCompany}</Text>
                      </View>
                      <Text style={styles.newsTime}>{timeAgo(item.published_at)}</Text>
                    </View>
                    <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                    {item.summary && (
                      <Text style={styles.newsSummary} numberOfLines={2}>{item.summary}</Text>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <Text style={styles.newsSource}>{item.source_name}</Text>
                      {item.category_tag && (
                        <View style={styles.newsCategoryBadge}>
                          <Text style={styles.newsCategoryText}>{item.category_tag}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Feather name="zap" size={24} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>No News Matches Yet</Text>
                <Text style={styles.emptySubtitle}>
                  We'll surface headlines mentioning your tracked companies as they appear
                </Text>
              </View>
            )}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Feather name="info" size={13} color={COLORS.accent} />
            <Text style={styles.tipsTitle}>Watchlist Tips</Text>
          </View>
          <Text style={styles.tipsItem}>• Track companies you're interested in investing in</Text>
          <Text style={styles.tipsItem}>• Aim for 8-15 companies across different segments</Text>
          <Text style={styles.tipsItem}>• News mentioning your companies will appear in News Feed</Text>
          <Text style={styles.tipsItem}>• Add 3+ companies to unlock the Portfolio Builder</Text>
          <Text style={styles.tipsItem}>• Each addition earns +10 Investment XP</Text>
        </View>
      </ScrollView>

      {/* Company Detail Modal */}
      <CompanyDetailModal
        company={selectedCompany}
        onClose={() => setSelectedCompany(null)}
        isOnWatchlist={selectedCompany ? watchlistIds.has(selectedCompany.id) : false}
        onToggleWatchlist={handleToggle}
      />
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

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: COLORS.border },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(139,92,246,0.06)',
  },
  tabText: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.textPrimary, fontWeight: '600' },

  // Browse
  browseCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
  },
  browseIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.2)', alignItems: 'center', justifyContent: 'center' },
  browseTitle: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  browseDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  browsePanel: {
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
    overflow: 'hidden',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    padding: 0,
  },
  browseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  browseItemLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.bg1,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  browseItemName: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  browseItemTicker: { fontSize: 11, color: COLORS.accent },
  miniSegment: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniSegmentText: { fontSize: 9, fontWeight: '600' },
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
  emptySearch: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 20 },

  // Company cards
  sectionTitle: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 6 },
  companyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  companyLogo: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.bg1,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  companyName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  companyTicker: { fontSize: 11, color: COLORS.accent, fontWeight: '500' },
  addedDate: { fontSize: 10, color: COLORS.textMuted },
  newsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  newsCountText: { fontSize: 10, fontWeight: '600', color: '#F59E0B' },
  removeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40, marginTop: 16 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', maxWidth: 280, lineHeight: 20 },

  // News cards
  newsCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  newsCompanyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(139,92,246,0.1)',
  },
  newsCompanyText: { fontSize: 10, fontWeight: '600', color: COLORS.accent },
  newsTime: { fontSize: 10, color: COLORS.textMuted },
  newsTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20 },
  newsSummary: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginTop: 4 },
  newsSource: { fontSize: 10, color: COLORS.textMuted },
  newsCategoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.bg1,
  },
  newsCategoryText: { fontSize: 9, color: COLORS.textMuted, fontWeight: '500' },

  // Portfolio CTA
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

  // Tips
  tipsCard: { backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14, marginTop: 20, borderWidth: 1, borderColor: COLORS.border },
  tipsTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  tipsItem: { fontSize: 12, color: COLORS.textMuted, lineHeight: 20 },
});
