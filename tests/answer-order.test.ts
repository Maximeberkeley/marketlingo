import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { execFileSync } from 'node:child_process';
import { choiceOrder } from '../mobile/lesson-kit/components/choiceOrder';

const read = (p: string) => readFileSync(p, 'utf8');
const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });

// Hand-written lessons put the right answer first in all 768 multiple-choice
// questions (and nearly all The Call / Face-off ones, with the fake third in
// Spot the fake). Shown as written, every question was "pick the same spot".
describe('answer options are shown in a mixed order', () => {
  it('gives a stable permutation per question', () => {
    const a = choiceOrder(3, 'mc-tier|Which tier is Collins?');
    expect([...a].sort()).toEqual([0, 1, 2]);
    expect(choiceOrder(3, 'mc-tier|Which tier is Collins?')).toEqual(a);
    expect(choiceOrder(0, 'x')).toEqual([]);
    expect(choiceOrder(1, 'x')).toEqual([0]);
  });

  it('spreads an always-first answer evenly across positions', () => {
    const counts = [0, 0, 0];
    for (let i = 0; i < 900; i++) counts[choiceOrder(3, `mc|Question number ${i}?`).indexOf(0)]++;
    for (const c of counts) expect(c / 900).toBeGreaterThan(0.27), expect(c / 900).toBeLessThan(0.40);
  });

  it('is used by every choice question, which still grades by the authored index', () => {
    const files: Record<string, string> = {
      'lesson-kit/exercises/MultipleChoice': 'index === exercise.correctIndex',
      'lesson-kit/modules/TheCall': 'i === exercise.correctIndex',
      'lesson-kit/modules/FaceOff': 'i === exercise.correctIndex',
      'lesson-kit/modules/SpotTheFake': 'i === exercise.fakeIndex',
    };
    for (const [path, grade] of Object.entries(files)) {
      const src = read(`mobile/${path}.tsx`);
      expect(src, path).toContain('choiceOrder(');
      expect(src, path).toContain(grade);
    }
    // The Call's consequences follow the options' on-screen order.
    expect(read('mobile/lesson-kit/modules/TheCall.tsx')).toContain('order.map(i => exercise.consequences?.[i])');
  });

  it('keeps the JavaScript twins in sync', () => {
    for (const [path, loader] of [['lesson-kit/components/choiceOrder', 'ts'], ['lesson-kit/exercises/MultipleChoice', 'tsx'],
      ['lesson-kit/modules/TheCall', 'tsx'], ['lesson-kit/modules/FaceOff', 'tsx'], ['lesson-kit/modules/SpotTheFake', 'tsx']] as const) {
      const js = read(`mobile/${path}.js`);
      expect(js, path).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js, path).toMatch(/import React\b/);
    }
  });
});
