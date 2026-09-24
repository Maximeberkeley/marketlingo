/**
 * The learner's chosen corner of their market (one per market, changeable).
 *
 * Never blocks anything: if the row cannot be read the learner simply has no
 * focus and the curriculum behaves exactly as before.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { FOCUS_UNLOCK_DAY, canChooseFocus, focusKeywords, focusOptionsFor, } from '../lib/focusTopics';
export function useFocusTopic(marketId, availableDay = 1) {
    const [focusKey, setFocusKey] = useState(null);
    const [label, setLabel] = useState(null);
    const [loading, setLoading] = useState(true);
    const options = useMemo(() => focusOptionsFor(marketId), [marketId]);
    const load = useCallback(async () => {
        if (!marketId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data: auth } = await supabase.auth.getUser();
            if (!auth?.user) {
                setFocusKey(null);
                setLabel(null);
                return;
            }
            const { data, error } = await supabase
                .from('learner_focus')
                .select('focus_key, focus_label')
                .eq('user_id', auth.user.id)
                .eq('market_id', marketId)
                .maybeSingle();
            if (error) {
                log.warn('[useFocusTopic] Could not read focus:', error.message);
                return;
            }
            setFocusKey(data?.focus_key ?? null);
            setLabel(data?.focus_label ?? null);
        }
        catch (err) {
            log.warn('[useFocusTopic] Focus lookup failed:', err);
        }
        finally {
            setLoading(false);
        }
    }, [marketId]);
    useEffect(() => {
        load();
    }, [load]);
    const choose = useCallback(async (option) => {
        if (!marketId)
            return false;
        try {
            const { data: auth } = await supabase.auth.getUser();
            if (!auth?.user)
                return false;
            const { error } = await supabase.from('learner_focus').upsert({
                user_id: auth.user.id,
                market_id: marketId,
                focus_key: option.key,
                focus_label: option.label,
                chosen_day: availableDay,
            }, { onConflict: 'user_id,market_id' });
            if (error) {
                log.warn('[useFocusTopic] Could not save focus:', error.message);
                return false;
            }
            setFocusKey(option.key);
            setLabel(option.label);
            return true;
        }
        catch (err) {
            log.warn('[useFocusTopic] Save failed:', err);
            return false;
        }
    }, [marketId, availableDay]);
    const clear = useCallback(async () => {
        if (!marketId)
            return false;
        try {
            const { data: auth } = await supabase.auth.getUser();
            if (!auth?.user)
                return false;
            await supabase
                .from('learner_focus')
                .delete()
                .eq('user_id', auth.user.id)
                .eq('market_id', marketId);
            setFocusKey(null);
            setLabel(null);
            return true;
        }
        catch (err) {
            log.warn('[useFocusTopic] Clear failed:', err);
            return false;
        }
    }, [marketId]);
    return {
        focusKey,
        focusLabel: label,
        keywords: label ? focusKeywords(label) : [],
        options,
        loading,
        unlockDay: FOCUS_UNLOCK_DAY,
        unlocked: availableDay >= FOCUS_UNLOCK_DAY,
        shouldOffer: canChooseFocus(availableDay, focusKey),
        choose,
        clear,
        reload: load,
    };
}
