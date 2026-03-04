import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../lib/constants';

interface NewsItem {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  categoryTag: string;
  summary?: string;
}

interface DailyNewsProps {
  marketId: string;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  Space: { bg: 'rgba(139,92,246,0.2)', text: '#A78BFA' },
  Aviation: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
  Defense: { bg: 'rgba(239,68,68,0.2)', text: '#F87171' },
  Deals: { bg: 'rgba(251,191,36,0.2)', text: '#FCD34D' },
  Industry: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  Innovation: { bg: 'rgba(139,92,246,0.15)', text: '#A78BFA' },
  Launch: { bg: 'rgba(139,92,246,0.15)', text: '#A78BFA' },
  Production: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  Models: { bg: 'rgba(167,139,250,0.2)', text: '#C4B5FD' },
  Hardware: { bg: 'rgba(6,182,212,0.2)', text: '#22D3EE' },
  AI: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  Finance: { bg: 'rgba(251,191,36,0.2)', text: '#FCD34D' },
  Health: { bg: 'rgba(236,72,153,0.2)', text: '#F472B6' },
  default: { bg: 'rgba(100,116,139,0.2)', text: '#94A3B8' },
};

export function DailyNews({ marketId }: DailyNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchNews = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      // Try DB cache first
      if (!forceRefresh) {
        const { data, error: dbError } = await supabase
          .from('news_items')
          .select('*')
          .eq('market_id', marketId)
          .order('published_at', { ascending: false })
          .limit(10);

        if (!dbError && data && data.length > 0) {
          setNews(data.map((item) => ({
            id: item.id,
            title: item.title,
            sourceName: item.source_name,
            sourceUrl: item.source_url,
            publishedAt: new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            categoryTag: item.category_tag || 'Industry',
            summary: item.summary || undefined,
          })));
          setLastFetched(new Date());
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
      }

      // Live fetch via edge function
      const { data: liveData, error: fnError } = await supabase.functions.invoke('fetch-market-news', {
        body: { marketId },
      });

      if (!fnError && liveData?.success && liveData.data?.length > 0) {
        setNews(liveData.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          sourceName: item.sourceName,
          sourceUrl: item.sourceUrl,
          publishedAt: item.publishedAt,
          categoryTag: item.categoryTag || 'Industry',
          summary: item.summary || undefined,
        })));
        setLastFetched(new Date());
      } else {
        // Fallback to DB
        const { data: fallback } = await supabase
          .from('news_items')
          .select('*')
          .eq('market_id', marketId)
          .order('published_at', { ascending: false })
          .limit(10);

        if (fallback && fallback.length > 0) {
          setNews(fallback.map((item) => ({
            id: item.id,
            title: item.title,
            sourceName: item.source_name,
            sourceUrl: item.source_url,
            publishedAt: new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            categoryTag: item.category_tag || 'Industry',
            summary: item.summary || undefined,
          })));
          setLastFetched(new Date());
        } else {
          setNews([]);
        }
      }
    } catch (err) {
      setError('Failed to connect to news service');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [marketId]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Text style={{ fontSize: 14 }}>⚡</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Industry Intel</Text>
            <Text style={styles.headerSubtitle}>✨ AI-analyzed insights</Text>
          </View>
          {/* Live dot */}
          <View style={styles.liveDot} />
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowAiInsights(!showAiInsights)}
            style={[styles.aiToggle, showAiInsights && styles.aiToggleActive]}
          >
            <Text style={[styles.aiToggleText, showAiInsights && { color: COLORS.accent }]}>
              ✨ AI
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => fetchNews(true)}
            disabled={isRefreshing}
            style={{ opacity: isRefreshing ? 0.5 : 1 }}
          >
            <Text style={styles.refreshText}>{isRefreshing ? '⏳' : '↺'} Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, { width: '80%' }]} />
              <View style={[styles.skeletonLine, { width: '40%', height: 10 }]} />
            </View>
          ))}
        </View>
      )}

      {/* Error */}
      {!isLoading && error && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchNews(true)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* News Cards */}
      {!isLoading && !error && news.length > 0 && (
        <View style={{ gap: 8 }}>
          {news.map((item) => {
            const catColor = categoryColors[item.categoryTag] || categoryColors.default;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.newsCard}
                onPress={() => {
                  if (item.sourceUrl) Linking.openURL(item.sourceUrl).catch(() => {});
                }}
                activeOpacity={0.8}
              >
                {/* Left accent bar */}
                <View style={styles.accentBar} />

                <View style={{ flex: 1 }}>
                  {/* Source & Category */}
                  <View style={styles.newsCardHeader}>
                    <Text style={styles.sourceName}>{item.sourceName}</Text>
                    <View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
                      <Text style={[styles.categoryText, { color: catColor.text }]}>
                        {item.categoryTag.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>{item.publishedAt}</Text>
                  </View>

                  {/* Title */}
                  <Text style={styles.newsTitle} numberOfLines={3}>{item.title}</Text>

                  {/* AI Summary */}
                  {showAiInsights && item.summary && (
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryIcon}>✨</Text>
                      <Text style={styles.summaryText} numberOfLines={3}>{item.summary}</Text>
                    </View>
                  )}

                  {/* Read link */}
                  <Text style={styles.readLink}>Read article →</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Empty State */}
      {!isLoading && !error && news.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No news available right now</Text>
          <TouchableOpacity onPress={() => fetchNews(true)} style={styles.retryBtn}>
            <Text style={styles.retryText}>⚡ Fetch News</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Last Updated */}
      {lastFetched && !isLoading && news.length > 0 && (
        <Text style={styles.lastUpdated}>
          Last updated: {lastFetched.toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(139,92,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  aiToggleActive: {
    backgroundColor: 'rgba(139,92,246,0.2)',
  },
  aiToggleText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  refreshText: {
    fontSize: 12,
    color: '#64748B',
  },
  loadingContainer: {
    gap: 8,
  },
  skeletonCard: {
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 8,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 7,
    width: '100%',
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 14,
    gap: 10,
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
    opacity: 0.6,
    alignSelf: 'stretch',
  },
  newsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  sourceName: {
    fontSize: 11,
    color: '#64748B',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 11,
    color: '#475569',
    marginLeft: 'auto',
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    lineHeight: 20,
    marginBottom: 8,
  },
  summaryCard: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(139,92,246,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.12)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  summaryIcon: { fontSize: 12, marginTop: 1 },
  summaryText: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  readLink: {
    fontSize: 11,
    color: COLORS.accent,
  },
  emptyCard: {
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  retryText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
  },
  lastUpdated: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
  },
});
