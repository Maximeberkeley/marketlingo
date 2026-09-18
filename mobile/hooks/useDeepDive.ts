/**
 * Deep layer on demand.
 *
 * One tap fetches a substantive, sourced explanation of the single concept a
 * lesson teaches. Cached server-side per (lesson, goal), so the second reader
 * pays nothing. Any failure leaves the authored lesson untouched — the deep
 * layer is opt-in extra, never a blocker.
 */
import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';

export interface MechanismStep {
  step: string;
  detail: string;
}

export interface DeepDiveCase {
  company?: string;
  situation?: string;
  figures?: string[];
  outcome?: string;
}

export interface DeepDive {
  concept: string;
  summary: string;
  mechanism: MechanismStep[];
  case_study: DeepDiveCase;
  key_terms: { term: string; definition: string }[];
  sources: { label: string; url: string }[];
}

const GOAL_KEY: Record<string, string> = {
  join_industry: 'career',
  career: 'career',
  invest: 'invest',
  build_startup: 'found',
  found: 'found',
  curiosity: 'explore',
};

export function deepDiveGoalKey(goal?: string | null): string {
  return GOAL_KEY[goal || 'curiosity'] || 'explore';
}

export function useDeepDive(stackId?: string, goal?: string | null) {
  const [deepDive, setDeepDive] = useState<DeepDive | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goalKey = deepDiveGoalKey(goal);

  const load = useCallback(async () => {
    if (!stackId || loading || deepDive) return;
    setLoading(true);
    setError(null);
    try {
      const { data: cached } = await supabase
        .from('lesson_deep_dives')
        .select('concept, summary, mechanism, case_study, key_terms, sources')
        .eq('stack_id', stackId)
        .eq('goal_key', goalKey)
        .maybeSingle();

      if (cached?.summary) {
        setDeepDive(cached as unknown as DeepDive);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('generate-deep-dive', {
        body: { stack_id: stackId, goal_key: goalKey },
      });

      if (fnError || !data?.deep_dive?.summary) {
        throw fnError || new Error('empty deep dive');
      }
      setDeepDive(data.deep_dive as DeepDive);
    } catch (err) {
      log.warn('[deepDive] unavailable', err);
      setError('The deep layer is not available right now.');
    } finally {
      setLoading(false);
    }
  }, [stackId, goalKey, loading, deepDive]);

  return { deepDive, loading, error, load };
}
