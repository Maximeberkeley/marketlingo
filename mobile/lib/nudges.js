const NUDGE_MESSAGES = {
  leo_pacing: "Leo is pacing by the door. Five minutes and he calms down.",
  friendly_warning: "This is a friendly reminder. Leo's next one won't be.",
  coffee: "One lesson takes less time than your coffee order. Go.",
  market_moved: "The market moved today. Did you?",
  future_you: "Future you, mid-interview, says thanks in advance.",
  streak_shivering: "Our flame is shivering. Do your lesson before it goes out.",
  streak_my_part: "I did my part of our streak. Your turn, partner.",
  race_ahead: "I'm ahead in our race. Just thought you should know.",
  race_behind: "You're ahead in our race. Enjoy it while it lasts.",
  race_tied: "Our race is tied. One lesson breaks it."
};
const GENERAL = ["leo_pacing", "friendly_warning", "coffee", "market_moved", "future_you"];
function nudgeOptions(ctx = {}) {
  const picks = [];
  if (ctx.streakLength != null) picks.push(ctx.meDoneToday ? "streak_my_part" : "streak_shivering");
  if (ctx.raceLead != null) picks.push(ctx.raceLead > 0 ? "race_ahead" : ctx.raceLead < 0 ? "race_behind" : "race_tied");
  for (const id of GENERAL) {
    if (picks.length >= 4) break;
    picks.push(id);
  }
  return picks;
}
export {
  NUDGE_MESSAGES,
  nudgeOptions
};
