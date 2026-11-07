/**
 * Friend streaks and friend races: shapes from get_friend_social(), the reward
 * rules the server applies (shown in the UI, never trusted from it), and the
 * copy each state needs. Pure, so screens and tests share one source.
 */

export interface FriendStreak {
  id: string;
  friend_id: string;
  display_name: string | null;
  friend_code: string | null;
  status: 'pending' | 'active';
  invited_by_me: boolean;
  started_on: string | null;
  length: number;
  best_length: number;
  me_done_today: boolean;
  friend_done_today: boolean;
  nudged_today: boolean;
  claimable_xp: number;
  claimed_milestones: number[];
}

export interface FriendRace {
  id: string;
  friend_id: string;
  display_name: string | null;
  status: 'pending' | 'active' | 'finished';
  challenged_by_me: boolean;
  starts_at: string | null;
  ends_at: string | null;
  my_xp: number;
  friend_xp: number;
  claimed: boolean;
  claimed_xp: number;
  nudged_today: boolean;
}

export interface FriendSocial {
  streaks: FriendStreak[];
  races: FriendRace[];
  today: string | null;
  server_now: string | null;
}

export const MAX_FRIEND_STREAKS = 5;
export const MAX_FRIEND_RACES = 3;
export const RACE_DAYS = 7;
export const RACE_REWARD = { won: 100, tied: 60, lost: 25, lostMinimumXP: 50 } as const;

export const STREAK_MILESTONES = [
  { days: 7, name: 'Study buddies', xp: 25 },
  { days: 14, name: 'Partners', xp: 50 },
  { days: 30, name: 'Co-founders', xp: 100 },
  { days: 50, name: 'Board', xp: 200 },
] as const;

export const friendName = (row: { display_name: string | null }) => row.display_name?.trim() || 'Your friend';
export const firstName = (row: { display_name: string | null }) => friendName(row).split(/\s+/)[0];

export function parseFriendSocial(data: any): FriendSocial {
  const num = (v: any) => Number(v) || 0;
  return {
    streaks: (Array.isArray(data?.streaks) ? data.streaks : []).map((s: any) => ({
      ...s,
      length: num(s.length), best_length: num(s.best_length), claimable_xp: num(s.claimable_xp),
      me_done_today: !!s.me_done_today, friend_done_today: !!s.friend_done_today, nudged_today: !!s.nudged_today,
      invited_by_me: !!s.invited_by_me, claimed_milestones: Array.isArray(s.claimed_milestones) ? s.claimed_milestones.map(num) : [],
    })),
    races: (Array.isArray(data?.races) ? data.races : []).map((r: any) => ({
      ...r,
      my_xp: num(r.my_xp), friend_xp: num(r.friend_xp), claimed_xp: num(r.claimed_xp),
      claimed: !!r.claimed, challenged_by_me: !!r.challenged_by_me, nudged_today: !!r.nudged_today,
    })),
    today: data?.today ?? null,
    server_now: data?.server_now ?? null,
  };
}

/** True when the server functions are not installed yet, so the screens keep today's layout. */
export function isMissingFunction(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return error.code === 'PGRST202' || error.code === '42883' || /could not find the function|does not exist/i.test(error.message || '');
}

export type StreakToday = 'both_done' | 'your_turn' | 'waiting' | 'neither';

export function streakToday(s: Pick<FriendStreak, 'me_done_today' | 'friend_done_today'>): StreakToday {
  if (s.me_done_today && s.friend_done_today) return 'both_done';
  if (!s.me_done_today && s.friend_done_today) return 'your_turn';
  if (s.me_done_today) return 'waiting';
  return 'neither';
}

export function streakTodayLine(s: FriendStreak): string {
  const name = firstName(s);
  switch (streakToday(s)) {
    case 'both_done': return `You both studied today. Day ${s.length} is in.`;
    case 'your_turn': return `${name} is done. Your turn to keep it alive.`;
    case 'waiting': return `You're done. Waiting on ${name}.`;
    default: return s.length > 0 ? `Do a lesson today, both of you, to make it ${s.length + 1}.` : 'Do a lesson today, both of you, to light it.';
  }
}

export function nextMilestone(length: number) {
  return STREAK_MILESTONES.find(m => m.days > length) ?? null;
}

export function currentTier(length: number) {
  return [...STREAK_MILESTONES].reverse().find(m => m.days <= length) ?? null;
}

/** "3 days to Partners · +50 XP each" */
export function milestoneLine(length: number): string {
  const next = nextMilestone(length);
  if (!next) return 'Every milestone reached. Legendary.';
  const days = next.days - length;
  return `${days} day${days === 1 ? '' : 's'} to ${next.name} · +${next.xp} XP each`;
}

export function milestoneProgress(length: number): number {
  const next = nextMilestone(length);
  if (!next) return 1;
  const prev = currentTier(length)?.days ?? 0;
  return Math.max(0, Math.min(1, (length - prev) / (next.days - prev)));
}

/** Share of the tug-of-war bar that is yours (0..1); an empty race sits in the middle. */
export function raceShare(myXP: number, friendXP: number): number {
  const total = Math.max(0, myXP) + Math.max(0, friendXP);
  if (total <= 0) return 0.5;
  return Math.max(0.06, Math.min(0.94, Math.max(0, myXP) / total));
}

export function raceLeadLine(r: Pick<FriendRace, 'my_xp' | 'friend_xp' | 'display_name' | 'status'>): string {
  const name = firstName(r);
  const gap = Math.abs(r.my_xp - r.friend_xp);
  const over = r.status === 'finished';
  if (r.my_xp === r.friend_xp) return over ? 'A dead heat.' : r.my_xp === 0 ? 'Nobody has scored yet. First lesson takes the lead.' : 'Neck and neck.';
  if (r.my_xp > r.friend_xp) return over ? `You won by ${gap} XP.` : `You lead by ${gap} XP.`;
  return over ? `${name} won by ${gap} XP.` : gap <= 40 ? `${name} leads by ${gap} XP. One lesson flips it.` : `${name} leads by ${gap} XP.`;
}

export type RaceOutcome = 'won' | 'tied' | 'lost';

export function raceOutcome(myXP: number, friendXP: number): RaceOutcome {
  return myXP > friendXP ? 'won' : myXP === friendXP ? 'tied' : 'lost';
}

/** What the server will pay this learner when the race ends. */
export function raceReward(myXP: number, friendXP: number): number {
  const outcome = raceOutcome(myXP, friendXP);
  if (outcome === 'won') return RACE_REWARD.won;
  if (outcome === 'tied') return RACE_REWARD.tied;
  return myXP >= RACE_REWARD.lostMinimumXP ? RACE_REWARD.lost : 0;
}

/** "3d 4h left", "5h left", "12m left", "Finished" */
export function timeLeft(endsAt: string | null, now = new Date()): string {
  if (!endsAt) return `${RACE_DAYS} days`;
  const ms = new Date(endsAt).getTime() - now.getTime();
  if (!(ms > 0)) return 'Finished';
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  return `${Math.max(1, mins)}m left`;
}

export function raceIsOver(r: Pick<FriendRace, 'status' | 'ends_at'>, now = new Date()): boolean {
  return r.status === 'finished' || (r.status === 'active' && !!r.ends_at && new Date(r.ends_at).getTime() <= now.getTime());
}

/**
 * The one social line for the Home chip, most urgent first: a reward to
 * collect, a friend streak waiting on you, an invite to answer, a race in
 * progress. Null when there is nothing to say.
 */
export function homeSocialLine(social: FriendSocial | null, now = new Date()): { text: string; icon: 'flame' | 'race' | 'gift' } | null {
  if (!social) return null;
  const claimRace = social.races.find(r => raceIsOver(r, now) && !r.claimed);
  if (claimRace) return { text: `Race with ${firstName(claimRace)} is over. Collect your XP`, icon: 'gift' };
  const claimStreak = social.streaks.find(s => s.claimable_xp > 0);
  if (claimStreak) return { text: `${claimStreak.length}-day streak with ${firstName(claimStreak)}. Collect +${claimStreak.claimable_xp} XP`, icon: 'gift' };
  const yourTurn = social.streaks.find(s => s.status === 'active' && !s.me_done_today && (s.length > 0 || s.friend_done_today));
  if (yourTurn) return { text: `${yourTurn.length > 0 ? `${yourTurn.length}-day streak with ${firstName(yourTurn)}` : `Streak with ${firstName(yourTurn)}`} · your turn`, icon: 'flame' };
  const invite = social.streaks.find(s => s.status === 'pending' && !s.invited_by_me);
  if (invite) return { text: `${firstName(invite)} wants a friend streak with you`, icon: 'flame' };
  const challenge = social.races.find(r => r.status === 'pending' && !r.challenged_by_me);
  if (challenge) return { text: `${firstName(challenge)} challenged you to a race`, icon: 'race' };
  const race = social.races.find(r => r.status === 'active' && !raceIsOver(r, now));
  if (race) {
    const gap = Math.abs(race.my_xp - race.friend_xp);
    const lead = race.my_xp === race.friend_xp ? 'neck and neck' : race.my_xp > race.friend_xp ? `you lead by ${gap} XP` : `${firstName(race)} leads by ${gap} XP`;
    return { text: `Racing ${firstName(race)} · ${lead}`, icon: 'race' };
  }
  const lit = social.streaks.find(s => s.status === 'active' && s.length > 0);
  if (lit) return { text: `${lit.length}-day streak with ${firstName(lit)}`, icon: 'flame' };
  return null;
}
