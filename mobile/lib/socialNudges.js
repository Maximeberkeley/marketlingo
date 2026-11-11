import { firstName, raceIsOver } from "./friendSocial";
const MAX_PER_DAY = 3;
const MIN_GAP_MS = 10 * 60 * 1e3;
const KEEP_MS = 14 * 24 * 60 * 60 * 1e3;
const DAY_MS = 24 * 60 * 60 * 1e3;
const xp = (n) => n.toLocaleString("en-US");
const line = (key, icon, action, text) => ({ key, icon, action, title: text, body: text });
function socialNudges(social, today, now = /* @__PURE__ */ new Date()) {
  if (!social) return [];
  const out = [];
  for (const r of social.races) {
    if (raceIsOver(r, now) && !r.claimed) out.push(line(
      `race-claim:${r.id}`,
      "gift",
      "Collect",
      r.my_xp > r.friend_xp ? `You beat ${firstName(r)}! Grab your reward.` : `Race with ${firstName(r)} is over. Collect!`
    ));
  }
  for (const s of social.streaks) {
    if (s.claimable_xp > 0) out.push(line(
      `streak-claim:${s.id}:${s.length}`,
      "gift",
      "Collect",
      `${s.length}-day streak with ${firstName(s)}! Collect +${xp(s.claimable_xp)} XP.`
    ));
  }
  for (const r of social.races) {
    if (r.status === "pending" && !r.challenged_by_me) out.push(line(`race-challenge:${r.id}`, "race", "Answer", `${firstName(r)} challenged you to a race!`));
  }
  for (const s of social.streaks) {
    if (s.status === "pending" && !s.invited_by_me) out.push(line(`streak-invite:${s.id}`, "flame", "Answer", `${firstName(s)} wants a friend streak with you.`));
  }
  for (const s of social.streaks) {
    if (s.status === "active" && !s.me_done_today && s.length > 0 && s.friend_done_today) out.push(line(
      `streak-turn:${s.id}:${today}`,
      "flame",
      "Open",
      `${firstName(s)} did today. Keep your ${s.length}-day streak!`
    ));
  }
  for (const r of social.races) {
    if (r.status !== "active" || raceIsOver(r, now)) continue;
    const lastDay = (r.ends_at ? new Date(r.ends_at).getTime() - now.getTime() : Infinity) < DAY_MS;
    const gap = r.friend_xp - r.my_xp;
    if (gap > 0) out.push(line(`race-behind:${r.id}:${today}`, "race", "Open", `${firstName(r)} leads by ${xp(gap)} XP. ${lastDay ? "Last day!" : "Catch up!"}`));
    else if (lastDay) out.push(line(`race-ending:${r.id}`, "race", "Open", gap === 0 ? `Last day racing ${firstName(r)}. It's a tie!` : `Last day racing ${firstName(r)}. Hold your lead!`));
  }
  return out;
}
function parseNudgeLog(raw, now = Date.now()) {
  const shown = {};
  const src = raw && typeof raw === "object" ? raw.shown : null;
  if (src && typeof src === "object") {
    for (const [k, t] of Object.entries(src)) if (typeof t === "number" && t > now - KEEP_MS) shown[k] = t;
  }
  return { shown };
}
function pickNudge(nudges, log, now = Date.now()) {
  const times = Object.values(log.shown);
  if (times.some((t) => now - t < MIN_GAP_MS)) return null;
  if (times.filter((t) => now - t < DAY_MS).length >= MAX_PER_DAY) return null;
  return nudges.find((n) => !(n.key in log.shown)) ?? null;
}
function markShown(log, key, now = Date.now()) {
  return { shown: { ...log.shown, [key]: now } };
}
const nudgeStorageKey = (userId) => `ml_social_nudges_v1/${userId}`;
export {
  MAX_PER_DAY,
  MIN_GAP_MS,
  markShown,
  nudgeStorageKey,
  parseNudgeLog,
  pickNudge,
  socialNudges
};
