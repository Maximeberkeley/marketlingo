import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/** The learner's goal for this market (e.g. 'invest', 'join_industry'), or null while unknown. */
export function useLearningGoal(marketId?: string | null): string | null {
  const { user } = useAuth();
  const [goal, setGoal] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!user || !marketId) return;
    supabase
      .from('user_progress')
      .select('learning_goal')
      .eq('user_id', user.id)
      .eq('market_id', marketId)
      .maybeSingle()
      .then(({ data }) => { if (alive) setGoal((data as { learning_goal?: string | null } | null)?.learning_goal ?? null); });
    return () => { alive = false; };
  }, [user?.id, marketId]);
  return goal;
}
