import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { log } from '../lib/logger';
/** How many industry intel stories we ask a learner to read each day. */
export const INTEL_DAILY_TARGET = 3;
/** XP banked once the daily intel target is met. */
export const INTEL_HABIT_XP = 20;
const EVENT = 'intel_read';
/** Start of the learner's LOCAL calendar day, as an ISO timestamp. */
function localDayStartISO() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return start.toISOString();
}
/**
 * Tracks how many industry intel stories the learner opened today (local day),
 * and banks a small XP reward the first time they hit the daily target.
 */
export function useIntelHabit(marketId) {
    const { user } = useAuth();
    const [readToday, setReadToday] = useState(0);
    const [loading, setLoading] = useState(true);
    const seen = useRef(new Set());
    const rewarded = useRef(false);
    const refresh = useCallback(async () => {
        if (!user) {
            setReadToday(0);
            setLoading(false);
            return;
        }
        try {
            const { data } = await supabase
                .from('analytics_events')
                .select('properties')
                .eq('user_id', user.id)
                .eq('event', EVENT)
                .gte('occurred_at', localDayStartISO());
            const ids = new Set();
            (data || []).forEach((row) => {
                const props = (row?.properties || {});
                if (marketId && props.market_id && props.market_id !== marketId)
                    return;
                const id = typeof props.article_id === 'string' ? props.article_id : '';
                if (id)
                    ids.add(id);
            });
            seen.current = ids;
            setReadToday(ids.size);
        }
        catch (e) {
            log.warn('useIntelHabit refresh failed', e);
        }
        finally {
            setLoading(false);
        }
    }, [user, marketId]);
    useEffect(() => { refresh(); }, [refresh]);
    const bankReward = useCallback(async () => {
        if (!user || !marketId || rewarded.current)
            return;
        rewarded.current = true;
        try {
            const { data: existing } = await supabase
                .from('xp_transactions')
                .select('id')
                .eq('user_id', user.id)
                .eq('market_id', marketId)
                .eq('source_type', 'intel_habit')
                .gte('created_at', localDayStartISO())
                .limit(1);
            if (existing && existing.length > 0)
                return;
            await supabase.rpc('increment_user_xp', {
                p_user_id: user.id,
                p_market_id: marketId,
                p_amount: INTEL_HABIT_XP,
            });
            await supabase.from('xp_transactions').insert({
                user_id: user.id,
                market_id: marketId,
                xp_amount: INTEL_HABIT_XP,
                source_type: 'intel_habit',
                description: `Read ${INTEL_DAILY_TARGET} industry intel stories`,
            });
        }
        catch (e) {
            log.warn('intel habit reward failed', e);
        }
    }, [user, marketId]);
    /** Record that the learner opened one intel story. Safe to call repeatedly. */
    const recordRead = useCallback(async (articleId) => {
        if (!user || !articleId || seen.current.has(articleId))
            return;
        seen.current.add(articleId);
        const next = seen.current.size;
        setReadToday(next);
        try {
            await supabase.from('analytics_events').insert({
                user_id: user.id,
                event: EVENT,
                properties: { article_id: articleId, market_id: marketId ?? null },
            });
        }
        catch (e) {
            log.warn('intel read not recorded', e);
        }
        if (next >= INTEL_DAILY_TARGET)
            bankReward();
    }, [user, marketId, bankReward]);
    const remaining = Math.max(0, INTEL_DAILY_TARGET - readToday);
    return {
        readToday,
        target: INTEL_DAILY_TARGET,
        remaining,
        done: remaining === 0,
        loading,
        recordRead,
        refresh,
    };
}
