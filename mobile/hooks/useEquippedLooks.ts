/**
 * Friends' Leo looks, for avatars in friend rows, the crown card, races and standings. The server only returns
 * looks for the learner and their accepted friends, plus whether each wears this month's crown right now.
 * A person with no answer (shop not live yet, or not a friend) keeps the letter avatar.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Look, lookFromJson } from '../lib/shopEconomy';

export interface FriendLook { look: Look; wearsCrown: boolean }

const cache = new Map<string, FriendLook>();

export function useEquippedLooks(userIds: (string | null | undefined)[]): Record<string, FriendLook> {
  const ids = Array.from(new Set(userIds.filter((id): id is string => !!id))).sort();
  const key = ids.join(',');
  const [looks, setLooks] = useState<Record<string, FriendLook>>(() => Object.fromEntries(ids.filter(id => cache.has(id)).map(id => [id, cache.get(id)!])));
  useEffect(() => {
    if (!ids.length) return;
    let live = true;
    supabase.rpc('get_equipped_looks', { p_user_ids: ids }).then(({ data, error }) => {
      if (!live || error || !Array.isArray(data)) return;
      const next: Record<string, FriendLook> = {};
      for (const r of data as { user_id: string; look: Record<string, string | null>; wears_crown: boolean }[]) {
        const entry = { look: lookFromJson(r.look), wearsCrown: !!r.wears_crown };
        cache.set(r.user_id, entry);
        next[r.user_id] = entry;
      }
      setLooks(next);
    }, () => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return looks;
}

const publicCache = new Map<string, FriendLook>();

/**
 * Looks for anyone shown on a market's standings (Global tab), friends or not. The server answers only with the
 * equipped item ids per slot and whether the crown is worn (no names, no other personal data), and only for
 * people who are on that market's standings. Someone with no answer shows the default Leo, never a letter.
 */
export function usePublicLooks(marketId: string | null | undefined, userIds: (string | null | undefined)[]): Record<string, FriendLook> {
  const ids = Array.from(new Set(userIds.filter((id): id is string => !!id))).sort().slice(0, 100);
  const key = `${marketId}|${ids.join(',')}`;
  const [looks, setLooks] = useState<Record<string, FriendLook>>(() => Object.fromEntries(ids.filter(id => publicCache.has(id)).map(id => [id, publicCache.get(id)!])));
  useEffect(() => {
    if (!marketId || !ids.length) return;
    let live = true;
    supabase.rpc('get_public_looks', { p_market_id: marketId, p_user_ids: ids }).then(({ data, error }) => {
      if (!live || error || !Array.isArray(data)) return;
      const next: Record<string, FriendLook> = {};
      for (const r of data as { user_id: string; look: Record<string, string | null>; wears_crown: boolean }[]) {
        const entry = { look: lookFromJson(r.look), wearsCrown: !!r.wears_crown };
        publicCache.set(r.user_id, entry);
        next[r.user_id] = entry;
      }
      setLooks(next);
    }, () => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return looks;
}
