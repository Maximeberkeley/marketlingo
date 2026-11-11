/**
 * In-app reminders for friend races and rewards: a banner that slides in while
 * the learner is in the app (not a push). One banner at a time, each reminder
 * shown once (per day for the daily ones), at most MAX_PER_DAY a day and never
 * within MIN_GAP_MS of the last one, so it reminds without nagging.
 */
import { FriendSocial, firstName, raceIsOver } from './friendSocial';

export type NudgeIcon = 'gift' | 'flame' | 'race';

export interface SocialNudge {
  /** Stable identity: the same reminder never shows twice under this key. */
  key: string;
  icon: NudgeIcon;
  title: string;
  body: string;
  /** Button text on the banner. */
  action: string;
}

export interface NudgeLog { shown: Record<string, number> }

export const MAX_PER_DAY = 3;
export const MIN_GAP_MS = 10 * 60 * 1000;
const KEEP_MS = 14 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const xp = (n: number) => n.toLocaleString('en-US');

const line = (key: string, icon: NudgeIcon, action: string, text: string): SocialNudge => ({ key, icon, action, title: text, body: text });

/**
 * Every reminder that applies right now, most valuable first. Each is one whole
 * Leo line of about eight words (title and body carry the same line).
 */
export function socialNudges(social: FriendSocial | null, today: string, now = new Date()): SocialNudge[] {
  if (!social) return [];
  const out: SocialNudge[] = [];
  for (const r of social.races) {
    if (raceIsOver(r, now) && !r.claimed) out.push(line(`race-claim:${r.id}`, 'gift', 'Collect',
      r.my_xp > r.friend_xp ? `You beat ${firstName(r)}! Grab your reward.` : `Race with ${firstName(r)} is over. Collect!`));
  }
  for (const s of social.streaks) {
    if (s.claimable_xp > 0) out.push(line(`streak-claim:${s.id}:${s.length}`, 'gift', 'Collect',
      `${s.length}-day streak with ${firstName(s)}! Collect +${xp(s.claimable_xp)} XP.`));
  }
  for (const r of social.races) {
    if (r.status === 'pending' && !r.challenged_by_me) out.push(line(`race-challenge:${r.id}`, 'race', 'Answer', `${firstName(r)} challenged you to a race!`));
  }
  for (const s of social.streaks) {
    if (s.status === 'pending' && !s.invited_by_me) out.push(line(`streak-invite:${s.id}`, 'flame', 'Answer', `${firstName(s)} wants a friend streak with you.`));
  }
  for (const s of social.streaks) {
    if (s.status === 'active' && !s.me_done_today && s.length > 0 && s.friend_done_today) out.push(line(`streak-turn:${s.id}:${today}`, 'flame', 'Open',
      `${firstName(s)} did today. Keep your ${s.length}-day streak!`));
  }
  for (const r of social.races) {
    if (r.status !== 'active' || raceIsOver(r, now)) continue;
    const lastDay = (r.ends_at ? new Date(r.ends_at).getTime() - now.getTime() : Infinity) < DAY_MS;
    const gap = r.friend_xp - r.my_xp;
    if (gap > 0) out.push(line(`race-behind:${r.id}:${today}`, 'race', 'Open', `${firstName(r)} leads by ${xp(gap)} XP. ${lastDay ? 'Last day!' : 'Catch up!'}`));
    else if (lastDay) out.push(line(`race-ending:${r.id}`, 'race', 'Open', gap === 0 ? `Last day racing ${firstName(r)}. It's a tie!` : `Last day racing ${firstName(r)}. Hold your lead!`));
  }
  return out;
}

export function parseNudgeLog(raw: unknown, now = Date.now()): NudgeLog {
  const shown: Record<string, number> = {};
  const src = raw && typeof raw === 'object' ? (raw as NudgeLog).shown : null;
  if (src && typeof src === 'object') for (const [k, t] of Object.entries(src)) if (typeof t === 'number' && t > now - KEEP_MS) shown[k] = t;
  return { shown };
}

/** The reminder to show now, or null when one was shown recently, the day's quota is spent, or nothing new applies. */
export function pickNudge(nudges: SocialNudge[], log: NudgeLog, now = Date.now()): SocialNudge | null {
  const times = Object.values(log.shown);
  if (times.some(t => now - t < MIN_GAP_MS)) return null;
  if (times.filter(t => now - t < DAY_MS).length >= MAX_PER_DAY) return null;
  return nudges.find(n => !(n.key in log.shown)) ?? null;
}

export function markShown(log: NudgeLog, key: string, now = Date.now()): NudgeLog {
  return { shown: { ...log.shown, [key]: now } };
}

export const nudgeStorageKey = (userId: string) => `ml_social_nudges_v1/${userId}`;
