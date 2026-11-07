import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  homeSocialLine, isMissingFunction, milestoneLine, milestoneProgress, parseFriendSocial, raceIsOver, raceLeadLine,
  raceReward, raceShare, streakToday, timeLeft, RACE_REWARD, STREAK_MILESTONES,
  type FriendRace, type FriendSocial, type FriendStreak,
} from '../mobile/lib/friendSocial';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');

const NOW = new Date('2026-11-07T18:00:00Z');
const streak = (over: Partial<FriendStreak> = {}): FriendStreak => ({
  id: 's1', friend_id: 'f1', display_name: 'Sophie Martin', friend_code: 'SOPH12', status: 'active', invited_by_me: true,
  started_on: '2026-11-01', length: 6, best_length: 6, me_done_today: false, friend_done_today: false, nudged_today: false,
  claimable_xp: 0, claimed_milestones: [], ...over,
});
const race = (over: Partial<FriendRace> = {}): FriendRace => ({
  id: 'r1', friend_id: 'f2', display_name: 'Dana', status: 'active', challenged_by_me: true,
  starts_at: '2026-11-04T18:00:00Z', ends_at: '2026-11-11T18:00:00Z', my_xp: 180, friend_xp: 140,
  claimed: false, claimed_xp: 0, nudged_today: false, ...over,
});
const social = (streaks: FriendStreak[], races: FriendRace[]): FriendSocial => ({ streaks, races, today: '2026-11-07', server_now: NOW.toISOString() } as FriendSocial);

describe('friend streaks', () => {
  it('know whose turn it is today', () => {
    expect(streakToday(streak({ me_done_today: true, friend_done_today: true }))).toBe('both_done');
    expect(streakToday(streak({ friend_done_today: true }))).toBe('your_turn');
    expect(streakToday(streak({ me_done_today: true }))).toBe('waiting');
    expect(streakToday(streak())).toBe('neither');
  });

  it('count down to the next milestone and pay both friends', () => {
    expect(STREAK_MILESTONES.map(m => [m.days, m.xp])).toEqual([[7, 25], [14, 50], [30, 100], [50, 200]]);
    expect(milestoneLine(6)).toBe('1 day to Study buddies · +25 XP each');
    expect(milestoneLine(11)).toBe('3 days to Partners · +50 XP each');
    expect(milestoneLine(50)).toBe('Every milestone reached. Legendary.');
    expect(milestoneProgress(7)).toBe(0);
    expect(milestoneProgress(50)).toBe(1);
  });
});

describe('friend races', () => {
  it('pay the winner 100, a tie 60 each, and a runner-up who showed up 25', () => {
    expect(RACE_REWARD).toEqual({ won: 100, tied: 60, lost: 25, lostMinimumXP: 50 });
    expect(raceReward(260, 190)).toBe(100);
    expect(raceReward(120, 120)).toBe(60);
    expect(raceReward(60, 300)).toBe(25);
    expect(raceReward(40, 300)).toBe(0);
  });

  it('draw the tug-of-war from both scores, never fully off the bar', () => {
    expect(raceShare(0, 0)).toBe(0.5);
    expect(raceShare(180, 140)).toBeCloseTo(0.5625);
    expect(raceShare(500, 0)).toBe(0.94);
    expect(raceShare(0, 500)).toBe(0.06);
  });

  it('say who leads and how long is left', () => {
    expect(raceLeadLine(race())).toBe('You lead by 40 XP.');
    expect(raceLeadLine(race({ my_xp: 100, friend_xp: 130 }))).toBe('Dana leads by 30 XP. One lesson flips it.');
    expect(raceLeadLine(race({ status: 'finished', my_xp: 260, friend_xp: 190 }))).toBe('You won by 70 XP.');
    expect(timeLeft('2026-11-11T21:00:00Z', NOW)).toBe('4d 3h left');
    expect(timeLeft('2026-11-07T18:20:00Z', NOW)).toBe('20m left');
    expect(timeLeft('2026-11-07T17:00:00Z', NOW)).toBe('Finished');
    expect(raceIsOver(race({ ends_at: '2026-11-07T17:00:00Z' }), NOW)).toBe(true);
    expect(raceIsOver(race(), NOW)).toBe(false);
  });
});

describe('Home chip line', () => {
  it('puts rewards first, then your turn, invites, challenges and races', () => {
    const over = race({ id: 'r2', display_name: 'Dana', ends_at: '2026-11-06T18:00:00Z' });
    const claim = streak({ id: 's2', display_name: 'Lucas', length: 7, claimable_xp: 25 });
    const turn = streak({ friend_done_today: true });
    const invite = streak({ id: 's3', display_name: 'Analyst', status: 'pending', invited_by_me: false, length: 0 });
    const challenge = race({ id: 'r3', display_name: 'Analyst', status: 'pending', challenged_by_me: false, ends_at: null });
    expect(homeSocialLine(social([claim, turn], [race(), over]), NOW)).toEqual({ text: 'Race with Dana is over. Collect your XP', icon: 'gift' });
    expect(homeSocialLine(social([turn, claim], [race()]), NOW)?.text).toBe('7-day streak with Lucas. Collect +25 XP');
    expect(homeSocialLine(social([turn], [race()]), NOW)).toEqual({ text: '6-day streak with Sophie · your turn', icon: 'flame' });
    expect(homeSocialLine(social([invite], [challenge]), NOW)?.text).toBe('Analyst wants a friend streak with you');
    expect(homeSocialLine(social([], [challenge]), NOW)).toEqual({ text: 'Analyst challenged you to a race', icon: 'race' });
    expect(homeSocialLine(social([], [race()]), NOW)?.text).toBe('Racing Dana · you lead by 40 XP');
    expect(homeSocialLine(social([], []), NOW)).toBeNull();
    expect(homeSocialLine(null, NOW)).toBeNull();
  });
});

describe('before the database update is applied', () => {
  it('treats a missing function as "feature not there yet"', () => {
    expect(isMissingFunction({ code: 'PGRST202' })).toBe(true);
    expect(isMissingFunction({ code: '42883' })).toBe(true);
    expect(isMissingFunction({ message: 'Could not find the function public.get_friend_social' })).toBe(true);
    expect(isMissingFunction({ code: '42501', message: 'permission denied' })).toBe(false);
    expect(isMissingFunction(null)).toBe(false);
  });

  it('reads an empty or odd reply as no streaks and no races', () => {
    expect(parseFriendSocial(null).streaks).toEqual([]);
    expect(parseFriendSocial({ streaks: 'x', races: null }).races).toEqual([]);
  });

  it('keeps the Friends tab as it is today until the functions exist', () => {
    const friends = read('mobile/app/friends.tsx');
    expect(friends).toContain('const showSocial = social.available && (friends.length > 0 || streaks.length > 0 || races.length > 0);');
    expect(friends).toMatch(/\{showSocial && \(/);
  });
});

describe('server rules', () => {
  const sql = read('drizzle/migrations/0025_friend_streaks_and_races.sql');
  const grant = sql.slice(sql.lastIndexOf('GRANT EXECUTE ON FUNCTION'), sql.indexOf('TO authenticated', sql.lastIndexOf('GRANT EXECUTE ON FUNCTION')));
  it('caps streaks and races, only pays once, and keeps the tables behind functions', () => {
    for (const fn of ['get_friend_social', 'start_friend_streak', 'respond_friend_streak', 'end_friend_streak', 'claim_friend_streak_rewards',
      'challenge_friend_race', 'respond_friend_race', 'cancel_friend_race', 'claim_friend_race_reward']) {
      expect(sql, fn).toMatch(new RegExp(`CREATE OR REPLACE FUNCTION public\\.${fn}\\(`));
      expect(grant, fn).toMatch(new RegExp(`public\\.${fn}\\(`));
    }
    expect(grant).not.toContain('public._');
    for (const table of ['friend_streaks', 'friend_streak_rewards', 'friend_races', 'friend_race_rewards']) {
      expect(sql, table).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
    expect(sql).toContain('PRIMARY KEY (streak_id, user_id, milestone)');
    expect(sql).toContain('PRIMARY KEY (race_id, user_id)');
    expect(read('drizzle/migrations/meta/_journal.json')).toContain('"tag": "0025_friend_streaks_and_races"');
  });

  it('can run again safely: creates only what is missing and refuses clashing names or shapes', () => {
    expect(sql).not.toMatch(/CREATE TABLE public\./);
    expect(sql).not.toMatch(/CREATE (UNIQUE )?INDEX (?!IF NOT EXISTS)/);
    expect(sql.match(/CREATE TABLE IF NOT EXISTS public\./g)?.length).toBe(4);
    expect(sql).toContain("RAISE EXCEPTION 'Names this migration needs are already taken (%). Nothing was changed.', clash;");
    expect(sql).toContain("RAISE EXCEPTION 'Friend tables already exist with a different shape (missing columns: %). Nothing was changed.', missing;");
    expect(sql.trimEnd().endsWith("NOTIFY pgrst, 'reload schema';")).toBe(true);
  });
});

describe('the official streak logo', () => {
  const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? (e.name === 'node_modules' ? [] : files(`${dir}/${e.name}`)) : /\.tsx?$/.test(e.name) ? [`${dir}/${e.name}`] : []);

  it('replaces the fire emoji everywhere in the app', () => {
    const withEmoji = files('mobile').filter(f => read(f).includes('\u{1F525}'));
    expect(withEmoji).toEqual([]);
    for (const f of ['lesson-kit/screens/LessonComplete', 'components/slides/ComboBar', 'components/home/StreakCriticalTimer',
      'components/interview/MentalMathTab', 'components/social/FriendStreaksCard', 'components/home/FriendStandingChip']) {
      expect(read(`mobile/${f}.tsx`), f).toContain('<StreakFlame');
    }
    expect(read('mobile/components/ui/StreakFlame.tsx')).toContain('name="fire"');
  });

  it('uses the XP flask, not a lightning bolt, on the race bar and rewards', () => {
    expect(read('mobile/components/ui/XPFlask.tsx')).toContain('name="flask"');
    const raceCard = read('mobile/components/social/RaceCard.tsx');
    expect(raceCard).not.toMatch(/'zap'|'award'/);
    expect(raceCard).toMatch(/<View style=\{\[styles\.knob[^>]*>\s*<XPFlask size=\{16\} \/>/);
    expect(read('mobile/components/social/RewardCelebration.tsx')).toContain('<XPFlask size={30} />');
    expect(read('mobile/components/social/StreakSheet.tsx')).toContain('<XPFlask size={11} />');
  });
});

describe('JavaScript copies for friend streaks and races', () => {
  it('match their source and import React when they use it', () => {
    for (const [path, loader] of [
      ['lib/friendSocial', 'ts'], ['hooks/useFriendSocial', 'ts'], ['lib/analytics', 'ts'], ['app/friends', 'tsx'],
      ['components/ui/StreakFlame', 'tsx'], ['components/ui/XPFlask', 'tsx'], ['components/home/FriendStandingChip', 'tsx'],
      ['components/social/SocialAvatar', 'tsx'], ['components/social/FriendStreaksCard', 'tsx'], ['components/social/StreakSheet', 'tsx'],
      ['components/social/RaceCard', 'tsx'], ['components/social/FriendPicker', 'tsx'], ['components/social/RewardCelebration', 'tsx'],
      ['lesson-kit/screens/LessonComplete', 'tsx'], ['components/slides/ComboBar', 'tsx'], ['components/home/StreakCriticalTimer', 'tsx'],
      ['components/interview/MentalMathTab', 'tsx'],
    ]) {
      const js = read(`mobile/${path}.js`);
      expect(js, path).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js, path).toMatch(/import React\b/);
    }
  }, 60000);
});
