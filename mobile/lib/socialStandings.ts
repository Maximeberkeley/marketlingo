import { supabase } from './supabase';

export interface MonthlyStanding {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  monthly_xp: number;
  current_level: number;
  current_streak: number;
  last_activity_at: string | null;
  tier: string;
}

export function currentSeasonStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export async function getMonthlyStandings(marketId: string): Promise<MonthlyStanding[]> {
  const { data, error } = await supabase.rpc('get_monthly_standings', {
    p_market_id: marketId,
    p_season_start: currentSeasonStart(),
  });
  if (error) throw error;
  return ((data ?? []) as MonthlyStanding[]).map(row => ({
    ...row,
    monthly_xp: Number(row.monthly_xp) || 0,
    current_level: Number(row.current_level) || 1,
    current_streak: Number(row.current_streak) || 0,
  }));
}

export function standingName(row: Pick<MonthlyStanding, 'display_name' | 'username'>): string {
  return row.display_name?.trim() || row.username?.split('@')[0] || 'Analyst';
}