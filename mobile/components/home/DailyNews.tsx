import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Linking,
  Image,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../lib/constants';
import { Feather } from '@expo/vector-icons';
import { MentorChatOverlay } from '../ai/MentorChatOverlay';
import { getMentorForContext } from '../../data/mentors';
import type { Mentor } from '../../data/mentors';

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
  Space: { bg: 'rgba(99,102,241,0.1)', text: '#6366F1' },
  Aviation: { bg: 'rgba(59,130,246,0.1)', text: '#3B82F6' },
  Defense: { bg: 'rgba(239,68,68,0.1)', text: '#EF4444' },
  Deals: { bg: 'rgba(245,158,11,0.1)', text: '#D97706' },
  Industry: { bg: 'rgba(16,185,129,0.1)', text: '#059669' },
  Innovation: { bg: 'rgba(139,92,246,0.1)', text: '#7C3AED' },
  Launch: { bg: 'rgba(139,92,246,0.1)', text: '#7C3AED' },
  Production: { bg: 'rgba(16,185,129,0.1)', text: '#059669' },
  Models: { bg: 'rgba(124,58,237,0.1)', text: '#7C3AED' },
  Hardware: { bg: 'rgba(6,182,212,0.1)', text: '#0891B2' },
  AI: { bg: 'rgba(16,185,129,0.1)', text: '#059669' },
  Finance: { bg: 'rgba(245,158,11,0.1)', text: '#D97706' },
  Health: { bg: 'rgba(236,72,153,0.1)', text: '#DB2777' },
  default: { bg: 'rgba(100,116,139,0.08)', text: '#64748B' },
};

function NewsCardAnimated({ item, index, showAiInsights, onDiscuss }: { item: NewsItem; index: number; showAiInsights: boolean; onDiscuss: (item: NewsItem) => void }) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 60, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const catColor = categoryColors[item.categoryTag] || categoryColors.default;

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: opacityAnim }}>
      <TouchableOpacity
        style={styles.newsCard}
        onPress={() => { if (item.sourceUrl) Linking.openURL(item.sourceUrl).catch(() => {}); }}
        activeOpacity={0.7}
      >
        <View style={styles.accentBar} />
        <View style={{ flex: 1 }}>
          <View style={styles.newsCardHeader}>
            <Text style={styles.sourceName}>{item.sourceName}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
              <Text style={[styles.categoryText, { color: catColor.text }]}>
                {item.categoryTag.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.dateText}>{item.publishedAt}</Text>
          </View>
          <Text style={styles.newsTitle} numberOfLines={3}>{item.title}</Text>
          {showAiInsights && item.summary && (
            <View style={styles.summaryCard}>
              <Feather name="layers" size={14} color={COLORS.accent} style={{ marginTop: 1 }} />
              <Text style={styles.summaryText} numberOfLines={3}>{item.summary}</Text>
            </View>
          )}
          <View style={styles.cardActions}>
            <Text style={styles.readLink}>Read article</Text>
            <TouchableOpacity
              style={styles.discussBtn}
              onPress={(e) => { e.stopPropagation(); onDiscuss(item); }}
              activeOpacity={0.7}
            >
              <Image source={APP_ICONS.trainer} style={{ width: 14, height: 14, resizeMode: 'contain' }} />
              <Text style={styles.discussText}>Discuss with AI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function DailyNews({ marketId }: DailyNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [chatNewsItem, setChatNewsItem] = useState<NewsItem | null>(null);

  const kaiMentor: Mentor = getMentorForContext('news') || {
    id: 'kai', name: 'Kai', title: 'Market Analyst', expertise: ['markets'],
    personality: 'analytical', emoji: '', greeting: 'Hi!', specialties: ['news'],
    voiceId: 'iP95p4xoKVk53GoZ742B',
  };

  const fetchNews = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      if (!forceRefresh) {
        const { data, error: dbError } = await supabase
          .from('news_items').select('*').eq('market_id', marketId)
          .order('published_at', { ascending: false }).limit(10);

        if (!dbError && data && data.length > 0) {
          setNews(data.map((item) => ({
            id: item.id, title: item.title, sourceName: item.source_name,
            sourceUrl: item.source_url,
            publishedAt: new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            categoryTag: item.category_tag || 'Industry',
            summary: item.summary || undefined,
          })));
          setLastFetched(new Date());
          setIsLoading(false); setIsRefreshing(false); return;
        }
      }

      const { data: liveData, error: fnError } = await supabase.functions.invoke('fetch-market-news', { body: { marketId } });

      if (!fnError && liveData?.success && liveData.data?.length > 0) {
        setNews(liveData.data.map((item: any) => ({
          id: item.id, title: item.title, sourceName: item.sourceName,
          sourceUrl: item.sourceUrl, publishedAt: item.publishedAt,
          categoryTag: item.categoryTag || 'Industry', summary: item.summary || undefined,
        })));
        setLastFetched(new Date());
      } else {
        const { data: fallback } = await supabase
          .from('news_items').select('*').eq('market_id', marketId)
          .order('published_at', { ascending: false }).limit(10);

        if (fallback && fallback.length > 0) {
          setNews(fallback.map((item) => ({
            id: item.id, title: item.title, sourceName: item.source_name,
            sourceUrl: item.source_url,
            publishedAt: new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            categoryTag: item.category_tag || 'Industry', summary: item.summary || undefined,
          })));
          setLastFetched(new Date());
        } else { setNews([]); }
      }
    } catch (err) {
      setError('Failed to connect to news service');
    } finally {
      setIsLoading(false); setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchNews(); }, [marketId]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={APP_ICONS.news} style={{ width: 22, height: 22, resizeMode: 'contain' }} />
          <View>
            <Text style={styles.headerTitle}>Industry Intel</Text>
            <Text style={styles.headerSubtitle}>AI-analyzed insights</Text>
          </View>
          <View style={styles.liveDot} />
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowAiInsights(!showAiInsights)}
            style={[styles.aiToggle, showAiInsights && styles.aiToggleActive]}
          >
            <Image source={APP_ICONS.concept} style={{ width: 12, height: 12, resizeMode: 'contain', marginRight: 2 }} />
            <Text style={[styles.aiToggleText, showAiInsights && { color: COLORS.accent }]}>
              AI
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => fetchNews(true)}
            disabled={isRefreshing}
            style={{ opacity: isRefreshing ? 0.5 : 1 }}
          >
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Skeleton */}
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
        <View style={{ gap: 10 }}>
          {news.map((item, index) => (
            <NewsCardAnimated
              key={item.id}
              item={item}
              index={index}
              showAiInsights={showAiInsights}
              onDiscuss={(newsItem) => setChatNewsItem(newsItem)}
            />
          ))}
        </View>
      )}

      {/* Empty State */}
      {!isLoading && !error && news.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No news available right now</Text>
          <TouchableOpacity onPress={() => fetchNews(true)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Fetch News</Text>
          </TouchableOpacity>
        </View>
      )}

      {lastFetched && !isLoading && news.length > 0 && (
        <Text style={styles.lastUpdated}>
          Last updated: {lastFetched.toLocaleTimeString()}
        </Text>
      )}

      {/* AI Chat for specific news article */}
      {chatNewsItem && (
        <MentorChatOverlay
          visible={!!chatNewsItem}
          mentor={kaiMentor}
          onClose={() => setChatNewsItem(null)}
          context={`The user wants to discuss this ${marketId} industry news article:\n\nTitle: "${chatNewsItem.title}"\nSource: ${chatNewsItem.sourceName}\nSummary: ${chatNewsItem.summary ?? 'N/A'}\n\nHelp them understand:\n1. Why this matters for the industry\n2. The investment implications\n3. How it affects key players\n4. What to watch next`}
          marketId={marketId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 0 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  headerSubtitle: { fontSize: 10, color: COLORS.textMuted },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiToggle: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
  },
  aiToggleActive: { backgroundColor: COLORS.accentSoft },
  aiToggleText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  refreshText: { fontSize: 12, color: COLORS.textMuted },
  loadingContainer: { gap: 8 },
  skeletonCard: {
    padding: 14, backgroundColor: COLORS.bg1, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.borderLight, gap: 8,
  },
  skeletonLine: {
    height: 14, backgroundColor: COLORS.surfaceLight, borderRadius: 7, width: '100%',
  },
  newsCard: {
    flexDirection: 'row', backgroundColor: COLORS.bg2, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  accentBar: {
    width: 3, backgroundColor: COLORS.accent, borderRadius: 2, opacity: 0.5, alignSelf: 'stretch',
  },
  newsCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap',
  },
  sourceName: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  categoryBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  categoryText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  dateText: { fontSize: 11, color: COLORS.textMuted, marginLeft: 'auto' },
  newsTitle: {
    fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20, marginBottom: 8,
  },
  summaryCard: {
    flexDirection: 'row', gap: 6, backgroundColor: COLORS.accentSoft,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.12)', borderRadius: 10,
    padding: 8, marginBottom: 8,
  },
  summaryText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  cardActions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  readLink: { fontSize: 11, color: COLORS.accent, fontWeight: '600' },
  discussBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  discussText: { fontSize: 11, color: COLORS.accent, fontWeight: '600' },
  emptyCard: {
    padding: 24, backgroundColor: COLORS.bg1, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center', gap: 12,
  },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.accentSoft,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)',
  },
  retryText: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  lastUpdated: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },
});
