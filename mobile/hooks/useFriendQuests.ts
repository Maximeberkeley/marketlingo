import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { log } from '../lib/logger';
import { currentWeekStart } from '../lib/leagues';

export type QuestKey = 'lessons' | 'drills' | 'games';

export interface QuestTemplate {
  key: QuestKey;
  title: string;
  description: string;
  target: number;
  xpReward: number;
}

/** Co-op quests: both players' progress adds up toward one shared target. */
export const FRIEND_QUEST_TEMPLATES: QuestTemplate[] = [
  { key: 'lessons', title: 'Study Pact', description: 'Complete 6 lessons together this week', target: 6, xpReward: 120 },
  { key: 'drills', title: 'Drill Squad', description: 'Finish 20 drills together this week', target: 20, xpReward: 100 },
  { key: 'games', title: 'Arcade Duo', description: 'Clear 10 games together this week', target: 10, xpReward: 90 },
];

export interface FriendQuest {
  id: string;
  questKey: QuestKey;
  title: string;
  target: number;
  totalProgress: number;
  myProgress: number;
  partnerProgress: number;
  partnerId: string;
  partnerName: string;
  isInitiator: boolean;
  status: 'pending' | 'active' | 'completed' | 'declined' | 'expired';
  xpReward: number;
}

interface QuestRow {
  id: string;
  quest_key: string;
  title: string;
  target: number;
  initiator_id: string;
  partner_id: string;
  initiator_progress: number;
  partner_progress: number;
  status: string;
  xp_reward: number;
}

export function useFriendQuests(marketId?: string | null) {
  const { user } = useAuth();
  const [quests, setQuests] = useState<FriendQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);
  const weekOf = currentWeekStart();

  const load = useCallback(async () => {
    if (!user || !marketId || inFlight.current) return;
    inFlight.current = true;
    try {
      await supabase.rpc('sync_friend_quests', { p_market_id: marketId });

      const { data, error } = await supabase
        .from('friend_quests')
        .select('id, quest_key, title, target, initiator_id, partner_id, initiator_progress, partner_progress, status, xp_reward')
        .eq('market_id', marketId)
        .eq('week_of', weekOf)
        .in('status', ['pending', 'active', 'completed'])
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = (data || []) as QuestRow[];
      const otherIds = Array.from(
        new Set(rows.map((r) => (r.initiator_id === user.id ? r.partner_id : r.initiator_id)))
      );
      let names: Record<string, string> = {};
      if (otherIds.length) {
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, username')
          .in('id', otherIds);
        names = Object.fromEntries(
          (profiles || []).map((p: { id: string; username: string | null }) => [
            p.id,
            (p.username || '').split('@')[0] || 'Friend',
          ])
        );
      }

      setQuests(
        rows.map((r) => {
          const isInitiator = r.initiator_id === user.id;
          const partnerId = isInitiator ? r.partner_id : r.initiator_id;
          return {
            id: r.id,
            questKey: r.quest_key as QuestKey,
            title: r.title,
            target: r.target,
            myProgress: isInitiator ? r.initiator_progress : r.partner_progress,
            partnerProgress: isInitiator ? r.partner_progress : r.initiator_progress,
            totalProgress: r.initiator_progress + r.partner_progress,
            partnerId,
            partnerName: names[partnerId] || 'Friend',
            isInitiator,
            status: r.status as FriendQuest['status'],
            xpReward: r.xp_reward,
          };
        })
      );
    } catch (e) {
      log.error('Friend quest load failed', e);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [user, marketId, weekOf]);

  useEffect(() => {
    load();
  }, [load]);

  const createQuest = useCallback(
    async (partnerId: string, template: QuestTemplate): Promise<{ success: boolean; error?: string }> => {
      if (!user || !marketId) return { success: false, error: 'Not ready' };
      const { error } = await supabase.from('friend_quests').insert({
        market_id: marketId,
        week_of: weekOf,
        initiator_id: user.id,
        partner_id: partnerId,
        quest_key: template.key,
        title: template.title,
        target: template.target,
        xp_reward: template.xpReward,
      });
      if (error) {
        const duplicate = error.code === '23505';
        return { success: false, error: duplicate ? 'You already have a quest with this friend this week.' : error.message };
      }
      await load();
      return { success: true };
    },
    [user, marketId, weekOf, load]
  );

  const respond = useCallback(
    async (questId: string, accept: boolean) => {
      // Status changes go through a server function — progress is never client-writable.
      const { error } = await supabase.rpc('respond_friend_quest', {
        p_quest_id: questId,
        p_accept: accept,
      });
      if (error) return { success: false, error: error.message };
      await load();
      return { success: true };
    },
    [load]
  );

  const pending = quests.filter((q) => q.status === 'pending' && !q.isInitiator);
  const active = quests.filter((q) => q.status === 'active');
  const completed = quests.filter((q) => q.status === 'completed');
  const awaitingPartner = quests.filter((q) => q.status === 'pending' && q.isInitiator);

  return { quests, pending, active, completed, awaitingPartner, loading, createQuest, respond, refresh: load };
}
