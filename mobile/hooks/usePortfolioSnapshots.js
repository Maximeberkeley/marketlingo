import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
export function usePortfolioSnapshots(marketId) {
    const { user } = useAuth();
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchSnapshots = useCallback(async () => {
        if (!user || !marketId) {
            setLoading(false);
            return;
        }
        const { data } = await supabase
            .from('portfolio_snapshots')
            .select('*')
            .eq('user_id', user.id)
            .eq('market_id', marketId)
            .order('created_at', { ascending: false });
        if (data) {
            setSnapshots(data.map((s) => ({
                ...s,
                positions: Array.isArray(s.positions) ? s.positions : [],
                category_breakdown: s.category_breakdown && typeof s.category_breakdown === 'object'
                    ? s.category_breakdown
                    : { core: 0, growth: 0, speculative: 0 },
            })));
        }
        setLoading(false);
    }, [user, marketId]);
    useEffect(() => { fetchSnapshots(); }, [fetchSnapshots]);
    const saveSnapshot = async (name, positions, totalAllocation, categoryBreakdown, notes) => {
        if (!user || !marketId)
            return null;
        const { data, error } = await supabase
            .from('portfolio_snapshots')
            .insert({
            user_id: user.id,
            market_id: marketId,
            snapshot_name: name,
            positions,
            total_allocation: totalAllocation,
            category_breakdown: categoryBreakdown,
            strategy_notes: notes || null,
        })
            .select()
            .single();
        if (!error && data) {
            await fetchSnapshots();
            return data;
        }
        return null;
    };
    return { snapshots, loading, saveSnapshot, refetch: fetchSnapshots };
}
