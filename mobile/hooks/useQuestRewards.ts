import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { DailyQuest } from './useDailyQuests';
import { localDateString } from '../lib/dayMath';
import { log } from '../lib/logger';

/**
 * Banks the bonus XP for a daily quest the moment it flips to complete.
 * Claims are recorded in xp_transactions so a quest can only pay out once a day.
 */
export function useQuestRewards(
  quests: DailyQuest[],
  marketId: string | null | undefined,
  addXP: (amount: number, sourceType: string, sourceId?: string, description?: string) => Promise<any>,
) {
  const { user } = useAuth();
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [lastReward, setLastReward] = useState<{ title: string; xp: number } | null>(null);
  const loadedFor = useRef<string | null>(null);
  const inFlight = useRef<Set<string>>(new Set());

  const today = localDateString();

  // Load today's already-paid quests
  useEffect(() => {
    if (!user || !marketId) return;
    const key = `${user.id}:${marketId}:${today}`;
    if (loadedFor.current === key) return;
    loadedFor.current = key;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('xp_transactions')
          .select('description')
          .eq('user_id', user.id)
          .eq('market_id', marketId)
          .eq('source_type', 'quest')
          .gte('created_at', `${today}T00:00:00.000Z`);

        if (error) {
          log.warn('[QuestRewards] Could not load claimed quests:', error);
          return;
        }

        const keys = (data || [])
          .map((row: { description: string | null }) => row.description || '')
          .filter((d) => d.startsWith('quest:'));
        setClaimed(new Set(keys));
      } catch (error) {
        log.warn('[QuestRewards] Claim lookup failed:', error);
      }
    })();
  }, [user, marketId, today]);

  const claim = useCallback(
    async (quest: DailyQuest) => {
      if (!user || !marketId) return;
      const key = `quest:${quest.id}:${today}`;
      if (claimed.has(key) || inFlight.current.has(key)) return;
      inFlight.current.add(key);

      try {
        await addXP(quest.xpBonus, 'quest', undefined, key);
        setClaimed((prev) => new Set(prev).add(key));
        setLastReward({ title: quest.title, xp: quest.xpBonus });
      } catch (error) {
        log.warn('[QuestRewards] Could not bank quest XP:', error);
      } finally {
        inFlight.current.delete(key);
      }
    },
    [user, marketId, today, claimed, addXP],
  );

  // Pay out any completed-but-unpaid quest
  useEffect(() => {
    if (!user || !marketId || loadedFor.current === null) return;
    const pending = quests.filter(
      (q) => q.isCompleted && !claimed.has(`quest:${q.id}:${today}`),
    );
    pending.forEach((q) => {
      void claim(q);
    });
  }, [quests, claimed, claim, user, marketId, today]);

  const isClaimed = useCallback(
    (questId: string) => claimed.has(`quest:${questId}:${today}`),
    [claimed, today],
  );

  return { isClaimed, lastReward, clearLastReward: () => setLastReward(null) };
}
