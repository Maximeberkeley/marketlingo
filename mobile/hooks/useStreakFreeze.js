/**
 * useStreakFreeze — manages streak freeze tokens.
 * All users get streak freezes (app is fully free).
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { nextLocalMidnightISOString } from '../lib/dayMath';
export function useStreakFreeze(marketId, isProUser = false) {
    const { user } = useAuth();
    const [state, setState] = useState({
        canFreeze: false,
        freezesUsedThisWeek: 0,
        maxFreezes: 1,
        loading: true,
    });
    const maxFreezes = isProUser ? 999 : 1;
    const fetchFreezes = useCallback(async () => {
        if (!user || !marketId) {
            setState((s) => ({ ...s, loading: false }));
            return;
        }
        const weekStart = getWeekStart();
        const { data, error } = await supabase
            .from('streak_freezes')
            .select('id')
            .eq('user_id', user.id)
            .eq('market_id', marketId)
            .eq('week_of', weekStart);
        const used = data?.length || 0;
        setState({
            canFreeze: used < maxFreezes,
            freezesUsedThisWeek: used,
            maxFreezes,
            loading: false,
        });
    }, [user, marketId, maxFreezes]);
    useEffect(() => {
        fetchFreezes();
    }, [fetchFreezes]);
    const useFreeze = useCallback(async () => {
        if (!user || !marketId || !state.canFreeze)
            return false;
        const weekStart = getWeekStart();
        const { error } = await supabase.from('streak_freezes').insert({
            user_id: user.id,
            market_id: marketId,
            week_of: weekStart,
        });
        if (error) {
            // Likely duplicate — already used this week
            return false;
        }
        // A rescue owns the current local calendar day. It never starts a rolling
        // 24/48-hour window from the moment the learner tapped the button.
        await supabase
            .from('user_progress')
            .update({
            streak_expires_at: nextLocalMidnightISOString(),
        })
            .eq('user_id', user.id)
            .eq('market_id', marketId);
        await fetchFreezes();
        return true;
    }, [user, marketId, state.canFreeze, fetchFreezes]);
    return {
        ...state,
        useFreeze,
        refetch: fetchFreezes,
    };
}
function getWeekStart() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
}
