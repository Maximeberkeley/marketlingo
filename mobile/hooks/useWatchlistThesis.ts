import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface WatchlistThesis {
  id: string;
  user_id: string;
  market_id: string;
  company_id: string;
  company_name: string;
  ticker: string | null;
  thesis: string;
  review_due_at: string;
  last_reviewed_at: string | null;
  review_count: number;
  still_valid: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useWatchlistThesis(marketId?: string) {
  const { user } = useAuth();
  const [theses, setTheses] = useState<WatchlistThesis[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTheses = useCallback(async () => {
    if (!user || !marketId) { setLoading(false); return; }
    const { data } = await supabase
      .from('watchlist_theses')
      .select('*')
      .eq('user_id', user.id)
      .eq('market_id', marketId)
      .order('created_at', { ascending: false });

    if (data) setTheses(data as WatchlistThesis[]);
    setLoading(false);
  }, [user, marketId]);

  useEffect(() => { fetchTheses(); }, [fetchTheses]);

  const saveThesis = async (
    companyId: string,
    companyName: string,
    thesis: string,
    ticker?: string,
  ) => {
    if (!user || !marketId) return null;
    const { data, error } = await supabase
      .from('watchlist_theses')
      .upsert({
        user_id: user.id,
        market_id: marketId,
        company_id: companyId,
        company_name: companyName,
        ticker: ticker || null,
        thesis,
        review_due_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,market_id,company_id' })
      .select()
      .single();

    if (!error) await fetchTheses();
    return data;
  };

  const reviewThesis = async (thesisId: string, stillValid: boolean) => {
    if (!user) return;
    await supabase
      .from('watchlist_theses')
      .update({
        still_valid: stillValid,
        last_reviewed_at: new Date().toISOString(),
        review_due_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        review_count: theses.find(t => t.id === thesisId)?.review_count
          ? (theses.find(t => t.id === thesisId)!.review_count + 1)
          : 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', thesisId);
    await fetchTheses();
  };

  const getThesisForCompany = (companyId: string) =>
    theses.find(t => t.company_id === companyId) || null;

  const getDueForReview = () =>
    theses.filter(t => new Date(t.review_due_at) <= new Date());

  return { theses, loading, saveThesis, reviewThesis, getThesisForCompany, getDueForReview, refetch: fetchTheses };
}
