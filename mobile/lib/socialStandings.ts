import { supabase } from './supabase';
import { friendRaceMonthStart } from './friendStanding';

export interface MonthlyStanding {
  user_id: string;
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

export function standingName(row: Pick<MonthlyStanding, 'display_name'>): string {
  return row.display_name?.trim() || 'Analyst';
}
/**
 * The learner's own XP this month across every industry, from their XP log.
 * Friends are ranked on the same all-industry number (get_friends_overview's
 * month_xp), because friends often study different industries.
 */
export async function myFriendRaceXP(userId: string, now = new Date()): Promise<number> {
  const since = friendRaceMonthStart(now);
  const page = 1000;
  let total = 0;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from('xp_transactions')
      .select('xp_amount')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .range(from, from + page - 1);
    if (error) throw error;
    const rows = (data ?? []) as { xp_amount: number | null }[];
    total += rows.reduce((sum, row) => sum + (Number(row.xp_amount) || 0), 0);
    if (rows.length < page) return total;
  }
}
