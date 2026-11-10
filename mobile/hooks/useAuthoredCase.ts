/**
 * Loads today's hand-written Deep Case for one course day and slot (1 to 3).
 * A missing row, a missing table or a network error all resolve to null, so
 * the Deep Case falls back to a case built from the learner's lessons.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import type { AuthoredCaseRow } from '../lesson-kit/case/authoredCase';

export function useAuthoredCase(marketId?: string | null, day?: number | null, slot?: number | null) {
  const [row, setRow] = useState<AuthoredCaseRow | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const key = marketId && day && slot ? `${marketId}:${day}:${slot}` : null;

  useEffect(() => {
    let active = true;
    if (!key || !marketId || !day || !slot) return;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('deep_cases')
          .select('day, slot, content')
          .eq('market_id', marketId)
          .eq('day', day)
          .eq('slot', slot)
          .maybeSingle();
        if (!active) return;
        if (error) log.warn('[DeepCase] No hand-written case:', error.message);
        setRow(!error && data ? (data as AuthoredCaseRow) : null);
      } catch (err) {
        if (active) {
          log.warn('[DeepCase] Hand-written case lookup failed:', err);
          setRow(null);
        }
      } finally {
        if (active) setLoadedKey(key);
      }
    })();
    return () => { active = false; };
  }, [key, marketId, day, slot]);

  // Nothing to look up counts as loaded, so the generated case is never held back.
  return { row: key && loadedKey === key ? row : null, loading: key !== null && loadedKey !== key };
}
