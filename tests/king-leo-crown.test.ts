import { describe, it, expect } from 'vitest';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { crownCopy, crownStatus } from '../mobile/lib/crown';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');
const friends = read('mobile/app/friends.tsx');

describe("this month's crown", () => {
  const board = (rows: [string, number, boolean?][]) => rows.map(([name, xp, isMe]) => ({ name, xp, isMe: !!isMe }));

  it('says who wears it and how far you are from it', () => {
    const theirs = crownStatus(board([['Sophillita Ruiz', 1240], ['Lucas', 610], ['You', 370, true]]));
    expect(theirs).toEqual({ kind: 'theirs', leader: 'Sophillita', gap: 870 });
    expect(crownCopy(theirs!)).toEqual({ title: 'Sophillita wears the crown', line: '870 XP ahead of you', action: 'Take the crown' });
  });

  it('switches to defending it when you lead', () => {
    const mine = crownStatus(board([['You', 730, true], ['Lucas', 610], ['Dana', 190]]));
    expect(mine).toEqual({ kind: 'mine', chaser: 'Lucas', gap: 120 });
    expect(crownCopy(mine!)).toEqual({ title: 'You wear the crown', line: 'Lucas is 120 XP behind you', action: 'Defend it' });
  });

  it('handles ties, an empty month and a board of one', () => {
    expect(crownCopy(crownStatus(board([['You', 300, true], ['Lucas', 300]]))!).line).toBe('Lucas is tied with you');
    expect(crownCopy(crownStatus(board([['Lucas', 300], ['You', 300, true]]))!).line).toBe("You're tied. One lesson takes it.");
    expect(crownStatus(board([['You', 0, true], ['Lucas', 0]]))).toEqual({ kind: 'open' });
    expect(crownStatus(board([['You', 50, true]]))).toBeNull();
  });

  it('shows King Leo in a crown card on the Friends tab, and a crown on the leader only there', () => {
    expect(friends).toContain("{crown && <CrownCard crown={crown} onAction={() => { triggerHaptic('light'); router.push('/(tabs)/home' as any); }} />}");
    expect(friends).toContain('crowned={idx === 0 && row.xp > 0}');
    expect(friends.match(/crowned=/g)?.length).toBe(1);
    // With a Leo look the leader wears the crown on Leo; the badge stays for letter avatars.
    expect(friends).toContain('<LeoAvatar look={look} crown={crowned} size={42}');
    expect(friends).toContain('{crowned && !look && <View style={styles.crown} pointerEvents="none"><CrownBadge size={26} /></View>}');
    expect(read('mobile/components/social/CrownCard.tsx')).toContain('<LeoAnimated clip="leo-king" size={138} fallback={LEO_KING} />');
    expect(statSync('mobile/assets/mascot/anim/leo-king.webp').size).toBeGreaterThan(100_000);
    expect(existsSync('mobile/assets/mascot/leo-king.png')).toBe(true);
  });

  it('keeps Leo off the leaderboard card and the Global standings', () => {
    for (const gone of ['SOCIAL_HERO', 'LEO_SASSY', 'friends-rivals-hero', '<Image']) expect(friends, gone).not.toContain(gone);
  });
});

describe('the League page is gone', () => {
  it('has no entry in Profile and sends old links and notifications to Standings', () => {
    expect(read('mobile/app/(tabs)/profile.tsx')).not.toContain('>League<');
    expect(read('mobile/app/(tabs)/profile.tsx')).not.toContain("'/leaderboard'");
    for (const route of ['mobile/app/leaderboard.tsx', 'mobile/app/league.tsx']) expect(read(route), route).toContain('<Redirect href="/friends" />');
    expect(read('mobile/app/_layout.tsx')).toContain("case 'leaderboard':\n      return '/friends';");
    expect(read('mobile/app/settings.tsx')).toContain("leaderboard: '/friends',");
    const home = read('mobile/app/(tabs)/home.tsx');
    expect(home).not.toContain('useLeague');
    expect(home).not.toContain('LeagueCeremonyModal');
  });
});

describe('JavaScript copies', () => {
  it('match their source and import React when they use it', () => {
    for (const [path, loader] of [
      ['app/friends', 'tsx'], ['components/social/CrownCard', 'tsx'], ['components/social/CrownBadge', 'tsx'], ['lib/crown', 'ts'],
      ['components/mascot/leoClips', 'ts'], ['app/(tabs)/profile', 'tsx'], ['app/(tabs)/home', 'tsx'], ['app/_layout', 'tsx'],
      ['app/settings', 'tsx'], ['app/leaderboard', 'tsx'], ['app/league', 'tsx'],
    ]) {
      const js = read(`mobile/${path}.js`);
      expect(js, path).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js, path).toMatch(/import React\b/);
    }
  }, 60000);
});
