import { supabase } from "./supabase";
import { friendRaceMonthStart } from "./friendStanding";
function currentSeasonStart() {
  const now = /* @__PURE__ */ new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}
async function getMonthlyStandings(marketId) {
  const { data, error } = await supabase.rpc("get_monthly_standings", {
    p_market_id: marketId,
    p_season_start: currentSeasonStart()
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    monthly_xp: Number(row.monthly_xp) || 0,
    current_level: Number(row.current_level) || 1,
    current_streak: Number(row.current_streak) || 0
  }));
}
function standingName(row) {
  return row.display_name?.trim() || "Analyst";
}
async function myFriendRaceXP(userId, now = /* @__PURE__ */ new Date()) {
  const since = friendRaceMonthStart(now);
  const page = 1e3;
  let total = 0;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase.from("xp_transactions").select("xp_amount").eq("user_id", userId).gte("created_at", since).order("created_at", { ascending: true }).range(from, from + page - 1);
    if (error) throw error;
    const rows = data ?? [];
    total += rows.reduce((sum, row) => sum + (Number(row.xp_amount) || 0), 0);
    if (rows.length < page) return total;
  }
}
export {
  currentSeasonStart,
  getMonthlyStandings,
  myFriendRaceXP,
  standingName
};
