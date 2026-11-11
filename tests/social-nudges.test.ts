import { describe, it, expect } from 'vitest';
import { socialNudges, pickNudge, markShown, parseNudgeLog, MAX_PER_DAY, MIN_GAP_MS } from '../mobile/lib/socialNudges';
import { fitsBubble } from '../mobile/lib/leoLines';
import type { FriendSocial, FriendRace, FriendStreak } from '../mobile/lib/friendSocial';

const NOW = new Date('2026-11-10T18:00:00Z');
const race = (o: Partial<FriendRace> = {}): FriendRace => ({ id: 'r1', friend_id: 'f', display_name: 'Dana Park', status: 'active', challenged_by_me: true,
  starts_at: '2026-11-08T00:00:00Z', ends_at: '2026-11-15T00:00:00Z', my_xp: 100, friend_xp: 50, claimed: false, claimed_xp: 0, nudged_today: false, ...o });
const streak = (o: Partial<FriendStreak> = {}): FriendStreak => ({ id: 's1', friend_id: 'f', display_name: 'Lucas', friend_code: null, status: 'active', invited_by_me: true,
  started_on: null, length: 6, best_length: 6, me_done_today: false, friend_done_today: true, nudged_today: false, claimable_xp: 0, claimed_milestones: [], ...o });
const social = (streaks: FriendStreak[], races: FriendRace[]): FriendSocial => ({ streaks, races, today: '2026-11-10', server_now: null });

describe('friend reminders', () => {
  it('puts rewards first, then challenges and invites, then your turn and races', () => {
    const list = socialNudges(social([streak(), streak({ id: 's2', claimable_xp: 25, length: 7, me_done_today: true })],
      [race({ id: 'over', status: 'finished', my_xp: 300, friend_xp: 200 }), race({ id: 'p', status: 'pending', challenged_by_me: false }), race({ id: 'b', friend_xp: 2927, my_xp: 0 })]), '2026-11-10', NOW);
    expect(list.map(n => n.key.split(':')[0])).toEqual(['race-claim', 'streak-claim', 'race-challenge', 'streak-turn', 'race-behind']);
    expect(list[0].body).toBe('You beat Dana! Grab your reward.');
    expect(list[4].body).toBe('Dana leads by 2,927 XP. Catch up!');
    // Each is one whole Leo line that fits his bubble.
    for (const n of list) expect(fitsBubble(n.body), n.body).toBe(true);
  });
  it('says nothing about a race you lead with days to go', () => {
    expect(socialNudges(social([], [race()]), '2026-11-10', NOW)).toEqual([]);
    expect(socialNudges(social([], [race({ ends_at: '2026-11-11T06:00:00Z' })]), '2026-11-10', NOW)[0].body).toBe('Last day racing Dana. Hold your lead!');
  });
  it('shows each reminder once, spaces them out, and caps the day', () => {
    const list = socialNudges(social([streak()], [race({ id: 'p', status: 'pending', challenged_by_me: false })]), '2026-11-10', NOW);
    const t = NOW.getTime();
    let log = parseNudgeLog(null, t);
    const first = pickNudge(list, log, t)!;
    log = markShown(log, first.key, t);
    expect(pickNudge(list, log, t + 60_000)).toBeNull();
    const second = pickNudge(list, log, t + MIN_GAP_MS + 1)!;
    expect(second.key).not.toBe(first.key);
    log = markShown(log, second.key, t + MIN_GAP_MS + 1);
    expect(pickNudge(list, log, t + 3 * MIN_GAP_MS)).toBeNull();
    let full = parseNudgeLog(null, t);
    for (let i = 0; i < MAX_PER_DAY; i++) full = markShown(full, `k${i}`, t - (i + 1) * MIN_GAP_MS * 2);
    expect(pickNudge([{ key: 'new', icon: 'gift', title: '', body: '', action: '' }], full, t)).toBeNull();
  });
  it('forgets reminders older than two weeks', () => {
    const t = NOW.getTime();
    expect(parseNudgeLog({ shown: { old: t - 15 * 86400000, fresh: t - 1000, bad: 'x' } }, t)).toEqual({ shown: { fresh: t - 1000 } });
  });
});
