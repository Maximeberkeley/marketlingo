import { supabase } from "@/integrations/supabase/client";

/**
 * Upserts the user's weekly leaderboard entry after a mock interview completion.
 */
export async function updateLeaderboard(
  userId: string,
  marketId: string,
  newScore: number
) {
  const weekOf = getWeekStart();

  // Check existing entry for this week
  const { data: existing } = await supabase
    .from('interview_leaderboard')
    .select('*')
    .eq('user_id', userId)
    .eq('market_id', marketId)
    .eq('week_of', weekOf)
    .maybeSingle();

  if (existing) {
    const totalMocks = (existing.mocks_completed || 0) + 1;
    const totalScore = (existing.total_score || 0) + newScore;
    const avgScore = totalScore / totalMocks;
    const bestScore = Math.max(existing.best_score || 0, newScore);

    await supabase.from('interview_leaderboard').update({
      mocks_completed: totalMocks,
      total_score: totalScore,
      avg_score: avgScore,
      best_score: bestScore,
    }).eq('id', existing.id);
  } else {
    await supabase.from('interview_leaderboard').insert({
      user_id: userId,
      market_id: marketId,
      week_of: weekOf,
      mocks_completed: 1,
      total_score: newScore,
      avg_score: newScore,
      best_score: newScore,
    });
  }
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}
