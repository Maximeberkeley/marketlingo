import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

// The "N days in a row" / "Level N unlocked" pop-up repeated what the lesson
// completion screen already shows, on every milestone day (3, 7, 14, 30 ...).
describe('no streak or level pop-up after a lesson', () => {
  it('is gone for every milestone day, not just day 3', () => {
    for (const f of ['mobile/components/sharing/MilestoneShareCard.tsx', 'mobile/hooks/useMilestoneSharing.ts']) {
      expect(existsSync(join(root, f)), f).toBe(false);
    }
    for (const f of ['mobile/app/(tabs)/home.tsx', 'mobile/app/(tabs)/home.js', 'mobile/hooks/useSessionFlow.ts', 'mobile/hooks/useSessionFlow.js']) {
      const src = read(f);
      for (const gone of ['MilestoneShareCard', 'useMilestoneSharing', 'checkStreakMilestone', 'checkLevelMilestone', 'days in a row']) {
        expect(src, `${f}: ${gone}`).not.toContain(gone);
      }
    }
  });
});
