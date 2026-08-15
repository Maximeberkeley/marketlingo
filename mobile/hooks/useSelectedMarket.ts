import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';
import { log } from '../lib/logger';
import { useAuth } from './useAuth';

const DEFAULT_MARKET = 'aerospace';

/**
 * Resolves the learner's active market.
 * Order of truth: profile row -> locally cached onboarding choice -> default.
 */
export function useSelectedMarket() {
  const { user } = useAuth();
  const [marketId, setMarketId] = useState<string>(DEFAULT_MARKET);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('selected_market')
            .eq('id', user.id)
            .maybeSingle();
          if (!cancelled && data?.selected_market) {
            setMarketId(data.selected_market);
            return;
          }
        }
        const cached = await storage.getIndustry();
        if (!cancelled && cached) setMarketId(cached);
      } catch (error) {
        log.warn('[useSelectedMarket] Falling back to default market:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { marketId, loading };
}
