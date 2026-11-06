import { supabase } from "./supabase";
function switchIndustryCopy(marketName) {
  return {
    title: "Switch industry?",
    body: `Switching resets your ${marketName} course and streak. This can't be undone.`,
    confirm: "Switch industry"
  };
}
async function resetIndustryForSwitch(userId, marketId) {
  const { error } = await supabase.from("user_progress").update({ current_streak: 0, current_day: 1, completed_stacks: [] }).eq("user_id", userId).eq("market_id", marketId);
  return !error;
}
export {
  resetIndustryForSwitch,
  switchIndustryCopy
};
