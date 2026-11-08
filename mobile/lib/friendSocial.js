const MAX_FRIEND_STREAKS = 5;
const MAX_FRIEND_RACES = 3;
const RACE_DAYS = 7;
const RACE_REWARD = { won: 100, tied: 60, lost: 25, lostMinimumXP: 50 };
const STREAK_MILESTONES = [
  { days: 7, name: "Study buddies", xp: 25 },
  { days: 14, name: "Partners", xp: 50 },
  { days: 30, name: "Co-founders", xp: 100 },
  { days: 50, name: "Board", xp: 200 }
];
const friendName = (row) => row.display_name?.trim() || "Your friend";
const firstName = (row) => friendName(row).split(/\s+/)[0];
function parseFriendSocial(data) {
  const num = (v) => Number(v) || 0;
  return {
    streaks: (Array.isArray(data?.streaks) ? data.streaks : []).map((s) => ({
      ...s,
      length: num(s.length),
      best_length: num(s.best_length),
      claimable_xp: num(s.claimable_xp),
      me_done_today: !!s.me_done_today,
      friend_done_today: !!s.friend_done_today,
      nudged_today: !!s.nudged_today,
      invited_by_me: !!s.invited_by_me,
      claimed_milestones: Array.isArray(s.claimed_milestones) ? s.claimed_milestones.map(num) : []
    })),
    races: (Array.isArray(data?.races) ? data.races : []).map((r) => ({
      ...r,
      my_xp: num(r.my_xp),
      friend_xp: num(r.friend_xp),
      claimed_xp: num(r.claimed_xp),
      claimed: !!r.claimed,
      challenged_by_me: !!r.challenged_by_me,
      nudged_today: !!r.nudged_today
    })),
    today: data?.today ?? null,
    server_now: data?.server_now ?? null
  };
}
function isMissingFunction(error) {
  if (!error) return false;
  return error.code === "PGRST202" || error.code === "42883" || /could not find the function|does not exist/i.test(error.message || "");
}
function streakToday(s) {
  if (s.me_done_today && s.friend_done_today) return "both_done";
  if (!s.me_done_today && s.friend_done_today) return "your_turn";
  if (s.me_done_today) return "waiting";
  return "neither";
}
function streakTodayLine(s) {
  const name = firstName(s);
  switch (streakToday(s)) {
    case "both_done":
      return `You both studied today. Day ${s.length} is in.`;
    case "your_turn":
      return `${name} is done. Your turn to keep it alive.`;
    case "waiting":
      return `You're done. Waiting on ${name}.`;
    default:
      return s.length > 0 ? `Do a lesson today, both of you, to make it ${s.length + 1}.` : "Do a lesson today, both of you, to light it.";
  }
}
function nextMilestone(length) {
  return STREAK_MILESTONES.find((m) => m.days > length) ?? null;
}
function currentTier(length) {
  return [...STREAK_MILESTONES].reverse().find((m) => m.days <= length) ?? null;
}
function milestoneLine(length) {
  const next = nextMilestone(length);
  if (!next) return "Every milestone reached. Legendary.";
  const days = next.days - length;
  return `${days} day${days === 1 ? "" : "s"} to ${next.name} \xB7 +${next.xp} XP each`;
}
function milestoneProgress(length) {
  const next = nextMilestone(length);
  if (!next) return 1;
  const prev = currentTier(length)?.days ?? 0;
  return Math.max(0, Math.min(1, (length - prev) / (next.days - prev)));
}
function raceShare(myXP, friendXP) {
  const total = Math.max(0, myXP) + Math.max(0, friendXP);
  if (total <= 0) return 0.5;
  return Math.max(0.06, Math.min(0.94, Math.max(0, myXP) / total));
}
function raceOmbre(share, blend = 0.4) {
  const s = Math.max(0, Math.min(1, Number.isFinite(share) ? share : 0.5));
  const center = 0.25 + s * 0.5;
  const start = Math.max(0, center - blend / 2);
  const end = Math.min(1, center + blend / 2);
  return [0, round3(start), round3(end), 1];
}
const round3 = (n) => Math.round(n * 1e3) / 1e3;
function raceLeadLine(r) {
  const name = firstName(r);
  const gap = Math.abs(r.my_xp - r.friend_xp);
  const over = r.status === "finished";
  if (r.my_xp === r.friend_xp) return over ? "A dead heat." : r.my_xp === 0 ? "Nobody has scored yet. First lesson takes the lead." : "Neck and neck.";
  if (r.my_xp > r.friend_xp) return over ? `You won by ${gap} XP.` : `You lead by ${gap} XP.`;
  return over ? `${name} won by ${gap} XP.` : gap <= 40 ? `${name} leads by ${gap} XP. One lesson flips it.` : `${name} leads by ${gap} XP.`;
}
function raceOutcome(myXP, friendXP) {
  return myXP > friendXP ? "won" : myXP === friendXP ? "tied" : "lost";
}
function raceReward(myXP, friendXP) {
  const outcome = raceOutcome(myXP, friendXP);
  if (outcome === "won") return RACE_REWARD.won;
  if (outcome === "tied") return RACE_REWARD.tied;
  return myXP >= RACE_REWARD.lostMinimumXP ? RACE_REWARD.lost : 0;
}
function timeLeft(endsAt, now = /* @__PURE__ */ new Date()) {
  if (!endsAt) return `${RACE_DAYS} days`;
  const ms = new Date(endsAt).getTime() - now.getTime();
  if (!(ms > 0)) return "Finished";
  const mins = Math.floor(ms / 6e4);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor(mins % 1440 / 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  return `${Math.max(1, mins)}m left`;
}
function raceIsOver(r, now = /* @__PURE__ */ new Date()) {
  return r.status === "finished" || r.status === "active" && !!r.ends_at && new Date(r.ends_at).getTime() <= now.getTime();
}
function homeSocialLine(social, now = /* @__PURE__ */ new Date()) {
  if (!social) return null;
  const claimRace = social.races.find((r) => raceIsOver(r, now) && !r.claimed);
  if (claimRace) return { text: `Race with ${firstName(claimRace)} is over. Collect your XP`, icon: "gift" };
  const claimStreak = social.streaks.find((s) => s.claimable_xp > 0);
  if (claimStreak) return { text: `${claimStreak.length}-day streak with ${firstName(claimStreak)}. Collect +${claimStreak.claimable_xp} XP`, icon: "gift" };
  const yourTurn = social.streaks.find((s) => s.status === "active" && !s.me_done_today && (s.length > 0 || s.friend_done_today));
  if (yourTurn) return { text: `${yourTurn.length > 0 ? `${yourTurn.length}-day streak with ${firstName(yourTurn)}` : `Streak with ${firstName(yourTurn)}`} \xB7 your turn`, icon: "flame" };
  const invite = social.streaks.find((s) => s.status === "pending" && !s.invited_by_me);
  if (invite) return { text: `${firstName(invite)} wants a friend streak with you`, icon: "flame" };
  const challenge = social.races.find((r) => r.status === "pending" && !r.challenged_by_me);
  if (challenge) return { text: `${firstName(challenge)} challenged you to a race`, icon: "race" };
  const race = social.races.find((r) => r.status === "active" && !raceIsOver(r, now));
  if (race) {
    const gap = Math.abs(race.my_xp - race.friend_xp);
    const lead = race.my_xp === race.friend_xp ? "neck and neck" : race.my_xp > race.friend_xp ? `you lead by ${gap} XP` : `${firstName(race)} leads by ${gap} XP`;
    return { text: `Racing ${firstName(race)} \xB7 ${lead}`, icon: "race" };
  }
  const lit = social.streaks.find((s) => s.status === "active" && s.length > 0);
  if (lit) return { text: `${lit.length}-day streak with ${firstName(lit)}`, icon: "flame" };
  return null;
}
export {
  MAX_FRIEND_RACES,
  MAX_FRIEND_STREAKS,
  RACE_DAYS,
  RACE_REWARD,
  STREAK_MILESTONES,
  currentTier,
  firstName,
  friendName,
  homeSocialLine,
  isMissingFunction,
  milestoneLine,
  milestoneProgress,
  nextMilestone,
  parseFriendSocial,
  raceIsOver,
  raceLeadLine,
  raceOmbre,
  raceOutcome,
  raceReward,
  raceShare,
  streakToday,
  streakTodayLine,
  timeLeft
};
