import { describe, expect, it } from 'vitest';
import * as ts from '../mobile/lib/lessonGoals';
// @ts-ignore -- the parallel JavaScript entry has no type declarations.
import * as js from '../mobile/lib/lessonGoals.js';

for (const [name, mod] of [['lessonGoals.ts', ts], ['lessonGoals.js', js]] as const) {
  describe(name, () => {
    it('falls back to beat titles and skips slides without a title', () => {
      const slides = [
        { title: 'Recap: Where yesterday left off' },
        { title: 'Concept: How launch pricing works' },
        { body: 'A slide with no title at all.' },
        { title: 'Case: The reusable booster bet' },
        {},
        { title: 'Takeaway: Short' },
      ];
      expect(mod.lessonGoalLabels(['too short'], slides)).toEqual([
        'How launch pricing works',
        'The reusable booster bet',
        'Where yesterday left off',
      ]);
    });
  });
}
