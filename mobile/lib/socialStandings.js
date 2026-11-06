import { supabase } from './supabase';
export function currentSeasonStart() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}
export async function getMonthlyStandings(marketId) {
    const { data, error } = await supabase.rpc('get_monthly_standings', {
        p_market_id: marketId,
        p_season_start: currentSeasonStart(),
    });
    if (error)
        throw error;
    return (data ?? []).map(row => ({
        ...row,
        monthly_xp: Number(row.monthly_xp) || 0,
        current_level: Number(row.current_level) || 1,
        current_streak: Number(row.current_streak) || 0,
    }));
}
export function standingName(row) {
    return row.display_name?.trim() || row.username?.split('@')[0] || 'Analyst';
}
