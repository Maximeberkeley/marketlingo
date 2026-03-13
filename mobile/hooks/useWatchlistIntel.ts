import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface WatchlistCompany {
  id: string;
  name: string;
  ticker?: string;
  segment?: string;
  addedAt?: string;
  notes?: string;
}

export interface WatchlistNewsItem {
  id: string;
  title: string;
  source_name: string;
  published_at: string;
  summary: string | null;
  category_tag: string | null;
  matchedCompany: string;
}

/**
 * Hook that provides watchlist-specific intelligence:
 * - Cross-references news_items with watched company names
 * - Provides per-company news counts
 * - Surfaces relevant news for the watchlist
 */
export function useWatchlistIntel(marketId?: string, watchlist?: WatchlistCompany[]) {
  const { user } = useAuth();
  const [relevantNews, setRelevantNews] = useState<WatchlistNewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRelevantNews = useCallback(async () => {
    if (!user || !marketId || !watchlist || watchlist.length === 0) {
      setRelevantNews([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch recent news for the market
      const { data: news } = await supabase
        .from('news_items')
        .select('id, title, source_name, published_at, summary, category_tag')
        .eq('market_id', marketId)
        .order('published_at', { ascending: false })
        .limit(100);

      if (!news) { setRelevantNews([]); return; }

      // Cross-reference news with watchlist company names
      const matched: WatchlistNewsItem[] = [];
      for (const item of news) {
        const titleLower = (item.title || '').toLowerCase();
        const summaryLower = (item.summary || '').toLowerCase();
        for (const company of watchlist) {
          const nameLower = company.name.toLowerCase();
          // Match by company name or ticker
          const nameWords = nameLower.split(' ');
          const primaryName = nameWords[0]; // e.g. "Boeing" from "Boeing Company"
          if (
            titleLower.includes(nameLower) ||
            titleLower.includes(primaryName) ||
            summaryLower.includes(nameLower) ||
            (company.ticker && titleLower.includes(company.ticker.toLowerCase()))
          ) {
            matched.push({ ...item, matchedCompany: company.name });
            break; // One match per news item
          }
        }
      }

      setRelevantNews(matched.slice(0, 20)); // Cap at 20
    } catch (error) {
      console.error('Error fetching watchlist news:', error);
    } finally {
      setLoading(false);
    }
  }, [user, marketId, watchlist?.length]);

  useEffect(() => {
    fetchRelevantNews();
  }, [fetchRelevantNews]);

  // Per-company news count
  const getNewsCountForCompany = (companyName: string) =>
    relevantNews.filter((n) => n.matchedCompany === companyName).length;

  return {
    relevantNews,
    loading,
    getNewsCountForCompany,
    refetchNews: fetchRelevantNews,
  };
}
