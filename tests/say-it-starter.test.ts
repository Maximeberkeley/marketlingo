import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { BLANK, firstBlank, lessonCompany, lessonNumber, ownWordCount, sayItContext, sayItPrompt } from '../mobile/lib/sayItStarter';
import { deliverableFor } from '../mobile/lib/deliverables';
import { readingSlides } from '../mobile/lesson-kit/components/feedbackCopy';
import aerospace from './fixtures/aerospace-day1.json';
import neuro from './fixtures/neuroscience-day1.json';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');
const aeroSlides = [...(aerospace as any).slides, ...readingSlides((aerospace as any).authored_lesson.exercises)];

describe('Say it asks about today’s lesson', () => {
  it('finds the company and number the aerospace lesson named', () => {
    const company = lessonCompany(aeroSlides);
    expect(['Boeing', 'Airbus', 'Collins Aerospace', 'Collins']).toContain(company);
    expect(lessonCompany([{ body: 'The OEM is the company. Tier 1 suppliers build systems. Each layer matters.' }])).toBeUndefined();
    expect(lessonNumber([{ body: 'It rides a train for about four days. Your cerebellum holds about 80% of your neurons.' }])).toBe('80%');
    expect(lessonNumber([{ body: 'Founded in 1916, it now employs people.' }])).toBeUndefined();
  });

  it('builds a specific question and starter for the players section', () => {
    const p = sayItPrompt('players', sayItContext(aeroSlides, 'Aerospace'));
    expect(p.question).toMatch(/^Why does .+ matter\?$/);
    expect(p.starter).toMatch(new RegExp(` matters because ${BLANK}\\.$`));
  });

  it('uses the lesson’s own number and the industry name', () => {
    const ctx = sayItContext((neuro as any).slides, 'Neuroscience');
    expect(sayItPrompt('numbers', ctx).question).toMatch(/^What does .+ tell you\?$/);
    expect(sayItPrompt('how_money_moves', ctx).starter).toBe(`In Neuroscience, ${BLANK} pays ${BLANK} for ${BLANK}.`);
  });

  it('has a question and a starter with a blank for every Brief and Map section', () => {
    const keys = new Set(['career', 'build_startup', 'invest', 'curiosity'].flatMap(goal => deliverableFor(goal).sections.map(s => s.key)));
    expect(keys.size).toBeGreaterThanOrEqual(18);
    for (const key of keys) {
      const p = sayItPrompt(key, {});
      expect(p.question.length).toBeGreaterThan(10);
      expect(p.starter).toContain(BLANK);
    }
  });
});

describe('a starter line only saves with the learner’s own words', () => {
  const starter = `Collins matters because ${BLANK}.`;
  it('counts only words beyond the starter, and none while a blank is left', () => {
    expect(ownWordCount(starter, starter)).toBe(0);
    expect(ownWordCount('Collins matters because it sells avionics.', starter)).toBe(3);
    expect(ownWordCount('Collins matters because yes.', starter)).toBe(1);
    expect(ownWordCount(`Collins matters because ${BLANK} and more words here.`, starter)).toBe(0);
  });
  it('selects the first blank so typing replaces it', () => {
    expect(firstBlank(starter)).toEqual({ start: 24, end: 27 });
    expect(firstBlank('no blanks')).toBeNull();
  });
  it('wires the chip, the own-words rule and the hint into Say it', () => {
    const src = read('mobile/lesson-kit/modules/SayIt.tsx');
    expect(src).toContain('Use a starter');
    expect(src).toContain('ownWordCount(text, starterUsed');
    expect(src).toContain('Fill the blanks with your own words.');
    expect(src).toContain("dossier.addLine(section.key, text, exercise.dayNumber, 'learner')");
    expect(read('mobile/components/slides/LessonKitReader.tsx')).toContain('context: sayItContext(');
  });
});

describe('JavaScript copies for Say it', () => {
  it('match their source and import React when they use it', () => {
    for (const [path, loader] of [['lib/sayItStarter', 'ts'], ['lesson-kit/modules/SayIt', 'tsx'], ['components/slides/LessonKitReader', 'tsx']]) {
      const js = read(`mobile/${path}.js`);
      expect(js).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js).toMatch(/import React\b/);
    }
  }, 30000);
});
