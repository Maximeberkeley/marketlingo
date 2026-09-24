import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { log } from '../lib/logger';
export function useCollectibles(marketId) {
    const { user } = useAuth();
    const [cards, setCards] = useState([]);
    const [featuredId, setFeaturedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const refresh = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        const [{ data: catalog }, { data: owned }, { data: profile }] = await Promise.all([
            supabase.from('collectible_catalog').select('*').order('market_id').order('sort_order'),
            supabase.from('user_collectibles').select('collectible_id, unlocked_at'),
            supabase.from('profiles').select('featured_collectible_id').eq('id', user.id).maybeSingle(),
        ]);
        const ownedMap = new Map((owned || []).map(row => [row.collectible_id, row.unlocked_at]));
        setCards((catalog || []).filter(card => !marketId || card.market_id === marketId).map(card => ({
            ...card,
            rarity: card.rarity,
            owned: ownedMap.has(card.id),
            unlocked_at: ownedMap.get(card.id),
        })));
        setFeaturedId(profile?.featured_collectible_id || null);
        setLoading(false);
    }, [user, marketId]);
    useEffect(() => { refresh().catch(error => log.error('Collectibles fetch failed', error)); }, [refresh]);
    const featureCard = useCallback(async (id) => {
        const { error } = await supabase.rpc('set_featured_collectible', { p_collectible_id: id });
        if (error)
            throw error;
        setFeaturedId(id);
    }, []);
    const evaluateRewards = useCallback(async (activityType, sourceKey, accuracy) => {
        if (!user || !marketId)
            return null;
        const { data, error } = await supabase.rpc('evaluate_market_rewards', {
            p_market_id: marketId, p_activity_type: activityType,
            p_source_key: sourceKey, p_accuracy: accuracy ?? null,
        });
        if (error) {
            log.error('Reward evaluation failed', error);
            return null;
        }
        await refresh();
        return data;
    }, [user, marketId, refresh]);
    return { cards, featuredId, loading, refresh, featureCard, evaluateRewards };
}
