import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { revealDelta } from '../mobile/lesson-kit/components/answerState';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');

describe('Home on iPad reads as one centred column', () => {
  it('keeps the activity ring at phone size and caps the page width', () => {
    const src = read('mobile/components/course/CourseJourney.tsx');
    expect(src).toContain('export const HOME_COLUMN_MAX = 680;');
    expect(src).toContain('export const ACTIVITY_CLUSTER_MAX = 394;');
    expect(src).toContain("cluster: { height: 374, position: 'relative', marginTop: 6, width: '100%', maxWidth: ACTIVITY_CLUSTER_MAX, alignSelf: 'center' },");
    expect(src).toContain('<View style={styles.column}>');
    expect(src).toMatch(/topHeader: \{[^}]*maxWidth: HOME_COLUMN_MAX, alignSelf: 'center' \}/);
    expect(src).toMatch(/industrySheet: \{ width: '100%', maxWidth: HOME_COLUMN_MAX, alignSelf: 'center'/);
  });

  it('shows Leo’s popup as a card rather than a full-width banner', () => {
    expect(read('mobile/components/mascot/LeoPopup.tsx')).toMatch(/touchable: \{[\s\S]*?width: '100%',\s*maxWidth: 560,\s*alignSelf: 'center',/);
  });
});

describe('the right answer stays in view after grading', () => {
  const visible = { top: 100, height: 500 }; // the question area above the feedback panel

  it('leaves the screen alone when the answer already shows', () => {
    expect(revealDelta({ top: 300, height: 22 }, visible)).toBe(0);
  });

  it('scrolls down just enough to show an answer hidden under the panel', () => {
    // Answer mark at 560: its row needs room down to 560 + 22 + 90 = 672; the area ends at 600.
    expect(revealDelta({ top: 560, height: 22 }, visible)).toBe(72);
    expect(revealDelta({ top: 900, height: 22 }, visible)).toBe(412);
  });

  it('never scrolls the top of the answer out of view to show its bottom', () => {
    expect(revealDelta({ top: 140, height: 600 }, visible)).toBe(0);
    expect(revealDelta({ top: 300, height: 600 }, visible)).toBe(140);
  });

  it('scrolls back up to an answer above the visible area, and ignores an unmeasured area', () => {
    expect(revealDelta({ top: 50, height: 22 }, visible)).toBe(-110);
    expect(revealDelta({ top: 900, height: 22 }, { top: 0, height: 0 })).toBe(0);
  });

  it('is asked for by the right-answer mark and handled by every question screen', () => {
    const mark = read('mobile/lesson-kit/components/AnswerMark.tsx');
    expect(mark).toContain("if (state !== 'correct' || !reveal) return;");
    expect(mark).toContain('setTimeout(() => reveal(slot.current), 320)');
    expect(read('mobile/lesson-kit/components/RevealCorrect.tsx')).toContain('revealDelta({ top: y, height: h }, { top: sy, height: sh })');
    for (const screen of ['arena/ArenaScreen', 'case/CaseScreen', 'screens/LessonScreen']) {
      const src = read(`mobile/lesson-kit/${screen}.tsx`);
      expect(src, screen).toContain('const revealCorrect = useRevealCorrect(scrollRef);');
      expect(src, screen).toContain('<RevealCorrectProvider value={revealCorrect.reveal}>');
      expect(src, screen).toMatch(/onScroll=\{revealCorrect\.onScroll\}\s+scrollEventThrottle=\{16\}/);
    }
  });
});

describe('JavaScript copies for the Home and Arena pass', () => {
  it('match their source and import React when they use it', () => {
    for (const [path, loader] of [
      ['components/course/CourseJourney', 'tsx'], ['components/mascot/LeoPopup', 'tsx'], ['lesson-kit/arena/ArenaScreen', 'tsx'],
      ['lesson-kit/case/CaseScreen', 'tsx'], ['lesson-kit/screens/LessonScreen', 'tsx'], ['lesson-kit/components/AnswerMark', 'tsx'],
      ['lesson-kit/components/answerState', 'ts'], ['lesson-kit/components/RevealCorrect', 'tsx'],
    ]) {
      const js = read(`mobile/${path}.js`);
      expect(js).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js).toMatch(/import React\b/);
    }
  }, 60000);
});
