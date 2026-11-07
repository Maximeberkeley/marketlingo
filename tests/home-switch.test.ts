import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { friendStanding, friendStandingLabel } from '../mobile/lib/friendStanding';
import { briefingMinutes, briefingNote } from '../mobile/lesson-kit/cardPresentation';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');

describe('switching industry from Home', () => {
  it('offers Switch industry in the industry sheet, behind the same warning as Profile', () => {
    const course = read('mobile/components/course/CourseJourney.tsx');
    expect(course).toContain('<Text style={styles.industrySecondaryText}>Switch industry</Text>');
    expect(course).toContain('<SwitchIndustryModal');
    const profile = read('mobile/app/(tabs)/profile.tsx');
    expect(profile).toContain('<SwitchIndustryModal');
    expect(profile).not.toContain('completed_stacks: [] })');
  });

  it('warns in one shared place and only leaves once the reset has saved', () => {
    const shared = read('mobile/lib/switchIndustry.ts');
    expect(shared).toContain("title: 'Switch industry?'");
    expect(shared).toContain('Switching resets your ${marketName} course and streak. This can\'t be undone.');
    expect(shared).toContain('.update({ current_streak: 0, current_day: 1, completed_stacks: [] })');
    const modal = read('mobile/components/ui/SwitchIndustryModal.tsx');
    expect(modal).toContain("if (!saved) {");
    expect(modal.indexOf('if (!saved) {')).toBeLessThan(modal.indexOf("router.replace('/onboarding' as any);"));
  });

  it('tells new learners on the first screen that they can switch later', () => {
    expect(read('mobile/app/onboarding/index.tsx')).toContain('Choose one to start. You can switch anytime.');
  });
});

describe('friend standing on Home', () => {
  // The Friends board puts you first, then sorts by this month's XP; a stable sort keeps you ahead on ties.
  const boardRank = (me: string, friends: string[], xp: Record<string, number>) => {
    const rows = [me, ...friends].map(id => ({ id, xp: xp[id] || 0 }));
    return rows.sort((a, b) => b.xp - a.xp).findIndex(r => r.id === me) + 1;
  };

  it('ranks you exactly like the Friends board', () => {
    for (let n = 0; n < 200; n++) {
      const friends = Array.from({ length: 1 + (n % 6) }, (_, i) => `f${i}`);
      const xp: Record<string, number> = { me: (n * 37) % 90 };
      friends.forEach((id, i) => { if ((n + i) % 4) xp[id] = ((n + 1) * (i + 3) * 13) % 90; });
      const standings = Object.entries(xp).map(([user_id, monthly_xp]) => ({ user_id, monthly_xp }));
      expect(friendStanding('me', friends, standings)).toEqual({ rank: boardRank('me', friends, xp), of: friends.length + 1 });
    }
  });

  it('keeps you ahead on a tie, ignores duplicates and yourself, and needs a friend', () => {
    expect(friendStanding('me', ['a', 'a', 'me'], [{ user_id: 'me', monthly_xp: 20 }, { user_id: 'a', monthly_xp: 20 }])).toEqual({ rank: 1, of: 2 });
    expect(friendStanding('me', ['a', 'b'], [{ user_id: 'a', monthly_xp: 5 }])).toEqual({ rank: 2, of: 3 });
    expect(friendStanding('me', [], [])).toBeNull();
  });

  it('reads as a rank or an invitation', () => {
    expect(friendStandingLabel({ rank: 2, of: 4 })).toBe('#2 of 4 among friends this month');
    expect(friendStandingLabel(null)).toBe('Race a friend this month');
  });

  it('loads on its own under today and never names other learners', () => {
    const chip = read('mobile/components/home/FriendStandingChip.tsx');
    expect(chip).toContain("supabase.rpc('get_friends_overview')");
    // Hidden until it knows: either the monthly rank or a friend streak/race line.
    expect(chip).toContain('if (standing === undefined && !socialLine) return null;');
    expect(chip).not.toMatch(/display_name|username/);
    expect(chip).toContain("router.push('/friends' as any)");
    const home = read('mobile/app/(tabs)/home.tsx');
    expect(home).toContain('<FriendStandingChip userId={user?.id} marketId={selectedMarket} focused={courseFocused} />');
    // The loading gate is unchanged: the chip is not part of it.
    expect(home).toContain('completionReady && lessonStack?.id && currentDay > 0');
  });
});

describe('one label for the full briefing', () => {
  it('says it is optional and how long it takes', () => {
    expect(briefingMinutes('')).toBe(1);
    expect(briefingMinutes(Array(200).fill('word').join(' '))).toBe(1);
    expect(briefingMinutes(Array(450).fill('word').join(' '))).toBe(2);
    expect(briefingNote(Array(420).fill('word').join(' '))).toBe('Optional · about 2 min');
  });

  it('is the same button on cold opens, idea cards and info cards', () => {
    expect(read('mobile/lesson-kit/components/BriefingButton.tsx')).toContain("export const BRIEFING_BUTTON_TITLE = 'Read the full briefing';");
    for (const card of ['modules/ColdOpen', 'modules/MicroInsight', 'exercises/InfoCard']) {
      const src = read(`mobile/lesson-kit/${card}.tsx`);
      expect(src).toContain('<BriefingButton text={exercise.fullText} onPress={() => setShowBriefing(true)} />');
      expect(src).not.toMatch(/Go deeper|Read briefing/);
    }
  });
});

describe('JavaScript copies for Home switching, standings and briefing labels', () => {
  it('match their source and import React when they use it', () => {
    for (const [path, loader] of [
      ['lib/switchIndustry', 'ts'], ['components/ui/SwitchIndustryModal', 'tsx'], ['app/(tabs)/profile', 'tsx'],
      ['components/course/CourseJourney', 'tsx'], ['lib/friendStanding', 'ts'], ['components/home/FriendStandingChip', 'tsx'],
      ['app/(tabs)/home', 'tsx'], ['app/onboarding/index', 'tsx'], ['lesson-kit/cardPresentation', 'ts'],
      ['lesson-kit/components/BriefingButton', 'tsx'], ['lesson-kit/modules/ColdOpen', 'tsx'], ['lesson-kit/modules/MicroInsight', 'tsx'],
      ['lesson-kit/exercises/InfoCard', 'tsx'], ['lesson-kit/sequencer/buildBeats', 'ts'],
    ]) {
      const js = read(`mobile/${path}.js`);
      expect(js).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js).toMatch(/import React\b/);
    }
  }, 60000);
});
