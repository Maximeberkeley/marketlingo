import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');

describe('Home coins have a slight 3D edge and the next one has a soft ring', () => {
  const src = read('mobile/components/course/CourseJourney.tsx');

  it('draws a darker underside below each coin and presses the face onto it', () => {
    expect(src).toContain('export const COIN_LIP = 5;');
    expect(src).toContain('<Animated.View style={[styles.coinLip, { backgroundColor: lip }]} />');
    expect(src).toContain('pressed && styles.coinFacePressed');
    expect(src).toContain('coinFacePressed: { transform: [{ translateY: COIN_LIP - 1 }] },');
    // Locked and not-yet-unlocked coins get a grey underside, never the purple one.
    expect(src).toContain('muted || locked ? COLORS.courseMutedLip : COLORS.courseCoinLip');
  });

  it('rings the coin to tap next with a still, see-through ring instead of the old pulse', () => {
    expect(src).toContain("recommended={activeSection && module.kind === 'lesson' && !lessonDone}");
    expect(src).toContain('{recommended && <View pointerEvents="none" style={styles.recommendRing} />}');
    expect(src).not.toMatch(/lessonPulse|pulseValue/);
  });

  it('defines the edge and ring colours for light and dark themes', () => {
    const constants = read('mobile/lib/constants.ts');
    for (const key of ['courseCoinLip', 'courseMutedLip', 'courseCoinRing']) expect(constants.match(new RegExp(`  ${key}: `, 'g'))?.length, key).toBe(2);
  });

  it('JavaScript copies match their source', () => {
    for (const [path, loader] of [['components/course/CourseJourney', 'tsx'], ['lib/constants', 'ts']]) {
      const js = read(`mobile/${path}.js`);
      expect(js).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js).toMatch(/import React\b/);
    }
  }, 30000);
});
