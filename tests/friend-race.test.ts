import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { friendRaceMonthStart, friendStanding } from '../mobile/lib/friendStanding';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');

describe('the friend race counts XP from every industry', () => {
  it('starts the month at 00:00 UTC on the 1st, like the friends list', () => {
    expect(friendRaceMonthStart(new Date('2026-11-07T19:32:00Z'))).toBe('2026-11-01T00:00:00.000Z');
    expect(friendRaceMonthStart(new Date('2026-12-01T00:00:00Z'))).toBe('2026-12-01T00:00:00.000Z');
    expect(friendRaceMonthStart(new Date('2026-11-30T23:59:59Z'))).toBe('2026-11-01T00:00:00.000Z');
  });

  it('ranks a friend who studies another industry on her real XP', () => {
    // You: 370 this month in Aerospace. Friend: 1,240 this month, all in another industry.
    const board = [{ user_id: 'me', monthly_xp: 370 }, { user_id: 'sophie', monthly_xp: 1240 }, { user_id: 'analyst', monthly_xp: 0 }];
    expect(friendStanding('me', ['sophie', 'analyst'], board)).toEqual({ rank: 2, of: 3 });
  });

  it('uses each friend’s all-industry month XP on the Friends board, and yours from your XP log', () => {
    const src = read('mobile/app/friends.tsx');
    expect(src).toContain('xp: f.totalXP, monthXP: f.totalXP');
    expect(src).toContain('myFriendRaceXP(user.id)');
    expect(src).not.toContain('friendMonthXP');
    expect(src).toContain('XP from all industries · resets in {daysLeftInMonth()} days');
    const log = read('mobile/lib/socialStandings.ts');
    expect(log).toContain(".from('xp_transactions')");
    expect(log).toContain(".gte('created_at', since)");
    expect(log).toContain('if (rows.length < page) return total;');
  });

  it('gives the Home chip the same numbers as the board', () => {
    const chip = read('mobile/components/home/FriendStandingChip.tsx');
    expect(chip).toContain('const mine = await myFriendRaceXP(userId);');
    expect(chip).toContain('monthly_xp: Number(row.month_xp) || 0');
    expect(chip).not.toContain('getMonthlyStandings');
  });
});

describe('the ring around the coin to tap next breathes slowly', () => {
  const src = read('mobile/components/course/CourseJourney.tsx');
  it('swells a touch and fades a little, then comes back, on a steady loop', () => {
    expect(src).toContain('export const RING_BREATH_MS = 1600;');
    expect(src).toContain("outputRange: [1, 0.45]");
    expect(src).toContain("outputRange: [1, 1.07]");
    expect(src).toMatch(/Animated\.loop\(Animated\.sequence\(\[\s*Animated\.timing\(breath, \{ toValue: 1, duration: RING_BREATH_MS[^\n]*\n\s*Animated\.timing\(breath, \{ toValue: 0, duration: RING_BREATH_MS/);
  });
  it('stays still with Reduce Motion and pauses when Home is not showing', () => {
    expect(src).toContain('ringMotion={isFocused && !reduceMotion}');
    expect(src).toContain('if (!recommended || !ringMotion) return;');
  });
});

describe('JavaScript copies for the friend race and the ring', () => {
  it('match their source and import React when they use it', () => {
    for (const [path, loader] of [
      ['app/friends', 'tsx'], ['lib/socialStandings', 'ts'], ['components/home/FriendStandingChip', 'tsx'],
      ['lib/friendStanding', 'ts'], ['components/course/CourseJourney', 'tsx'],
    ]) {
      const js = read(`mobile/${path}.js`);
      expect(js).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js).toMatch(/import React\b/);
    }
  }, 60000);
});
