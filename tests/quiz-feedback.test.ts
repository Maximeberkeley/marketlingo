import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { alter, checkClaim, checkFigure, checkTamper } from '../mobile/lesson-kit/sequencer/lessonChecks';
import { feedbackCopy, readingSlides, reviewCardFor, sameCopy } from '../mobile/lesson-kit/components/feedbackCopy';
import { buildArena, shuffleAuthored } from '../mobile/lesson-kit/arena/buildArena';
import { buildCase } from '../mobile/lesson-kit/case/buildCase';
import { studiedMaterial } from '../mobile/lesson-kit/practice/studiedMaterial';
import { quizQuestionKeys } from '../mobile/lib/quizHistory';
import neuro from './fixtures/neuroscience-day1.json';
import aerospace from './fixtures/aerospace-day1.json';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');
const lessonOf = (f: any) => ({ ...f, ...studiedMaterial(f.authored_lesson) });
const neuroLesson = lessonOf(neuro);
const drills = [
  { id: 'd1', statement: 'A verified true market fact.', is_true: true, explanation: 'Checked.' },
  { id: 'd2', statement: 'Another verified true market fact.', is_true: true, explanation: 'Checked.' },
  { id: 'd3', statement: 'A verified false market claim.', is_true: false, explanation: 'Checked.' },
];

describe('altered claims remember what changed', () => {
  it('reports the changed number or word with its following words', () => {
    expect(alter('Your brain holds about 86 billion neurons in total.')).toEqual({
      text: 'Your brain holds about 17 billion neurons in total.', said: '86 billion neurons', changed: '17 billion neurons',
    });
    expect(alter('Demand for batteries is rising fast in Europe.')).toMatchObject({ said: 'rising fast in', changed: 'falling fast in' });
    expect(alter('No numbers or direction words here at all.')).toBeNull();
  });

  it('gives every wrong option a why-wrong line and the right one none', () => {
    for (let i = 0; i < 30; i++) {
      const claim = checkClaim(neuroLesson.slides, 'c');
      if (claim) {
        claim.options.forEach((_, index) => {
          if (index === claim.correctIndex) expect(claim.whyWrong?.[index]).toBeNull();
          else expect(claim.whyWrong?.[index]).toMatch(/^The lesson says “.+”, not “.+”\.$/);
        });
      }
      const tamper = checkTamper(neuroLesson.slides, 't');
      if (tamper) {
        tamper.statements.forEach((_, index) => {
          if (index === tamper.fakeIndex) expect(tamper.whyWrong?.[index]).toBeNull();
          else expect(tamper.whyWrong?.[index]).toMatch(/^That line matches the lesson\. The altered one says “.+”, where the lesson says “.+”\.$/);
        });
      }
      const figure = checkFigure(neuroLesson.slides, 'f');
      if (figure) {
        figure.options.forEach((option, index) => {
          if (index === figure.correctIndex) expect(figure.whyWrong?.[index]).toBeNull();
          else expect(figure.whyWrong?.[index]).toBe(`The lesson’s number is ${figure.options[figure.correctIndex]}, not ${option}.`);
        });
      }
    }
  });
});

describe('feedback never repeats the answer already on screen', () => {
  const truth = 'Your cerebellum holds about 69 billion of your 86 billion neurons.';
  const claim = {
    kind: 'multipleChoice' as const, id: 'c', prompt: 'Only one of these matches what this lesson actually said. Which?',
    options: [truth, 'Your cerebellum holds about 14 billion of your 86 billion neurons.'], correctIndex: 0,
    explanation: `Straight from what you just read: ${truth}`,
    whyWrong: [null, 'The lesson says “69 billion of your”, not “14 billion of your”.'],
  };

  it('drops the quote of the green option and the "Answer:" line, and explains the pick', () => {
    expect(feedbackCopy(claim, false, 1)).toEqual({ answer: undefined, insight: undefined, whyWrong: 'The lesson says “69 billion of your”, not “14 billion of your”.' });
    expect(feedbackCopy(claim, true, 0)).toEqual({ answer: undefined, insight: undefined, whyWrong: undefined });
  });

  it('keeps an explanation that teaches something new', () => {
    const authored = { ...claim, explanation: 'Selling straight to the aircraft maker is what makes a supplier Tier 1.', whyWrong: undefined };
    expect(feedbackCopy(authored, false, 1).insight).toBe('Selling straight to the aircraft maker is what makes a supplier Tier 1.');
  });

  it('still names the answer when the screen does not show it', () => {
    const wordBank = { kind: 'wordBank' as const, id: 'w', prompt: 'Build it', tiles: ['OEM', 'the', 'is', 'Airbus'], answer: ['Airbus', 'is', 'the', 'OEM'] };
    expect(feedbackCopy(wordBank as any, false).answer).toBe('Airbus is the OEM');
  });

  it('treats small lead-ins and punctuation as the same copy', () => {
    expect(sameCopy('“The OEM owns the design.”', 'the OEM owns the design')).toBe(true);
    expect(sameCopy('The OEM owns the design.', 'A Tier 1 supplier builds whole systems.')).toBe(false);
  });
});

describe('Review this in the lesson', () => {
  it('opens the slide that holds the quoted sentence', () => {
    for (let i = 0; i < 20; i++) {
      const claim = checkClaim(neuroLesson.slides, 'c');
      if (!claim) continue;
      const card = reviewCardFor(neuroLesson.slides, claim);
      const quoted = claim.options[claim.correctIndex];
      expect(card?.body.replace(/\s+/g, ' ')).toContain(quoted.replace(/\s+/g, ' ').replace(/[.]$/, ''));
    }
  });

  it('finds the card behind a written question by its words', () => {
    const mc = (neuroLesson.questions as any[]).find(q => q.kind === 'multipleChoice');
    const card = reviewCardFor(neuroLesson.slides, mc);
    expect(card?.title).toMatch(/limbic|Region 2/i);
  });

  it('turns a lesson’s reading cards into reviewable slides', () => {
    const slides = readingSlides((aerospace as any).authored_lesson.exercises);
    expect(slides.length).toBeGreaterThanOrEqual(3);
    expect(slides.every(s => s.body.length > 0 && s.slideNumber > 0)).toBe(true);
    const collins = (aerospace as any).authored_lesson.exercises.find((e: any) => e.id === 'mc-collins-tier');
    expect(reviewCardFor(slides, collins)?.body).toMatch(/Tier 1/);
  });

  it('attaches review cards to lesson questions in the Arena and Cases', () => {
    const waves = buildArena({ marketId: 'neuroscience', marketName: 'Neuroscience', trainer: [], drills, stats: [], studied: [neuroLesson] });
    const lessonQs = waves.flatMap(w => w.exercises).filter(q => q.source?.type === 'lesson');
    expect(lessonQs.filter(q => q.review).length).toBeGreaterThanOrEqual(Math.ceil(lessonQs.length * 0.7));
    const c = buildCase({ marketId: 'neuroscience', marketName: 'Neuroscience', trainer: [], drills, stats: [], studied: [neuroLesson] } as any);
    expect(c?.stages.filter(s => s.exercise.source?.type === 'lesson' && s.exercise.review).length).toBeGreaterThanOrEqual(2);
  });
});

describe('why-wrong lines stay matched to their options', () => {
  it('when the Arena turns a claim into a two-way choice', () => {
    for (let i = 0; i < 30; i++) {
      for (const q of buildArena({ marketId: 'neuroscience', marketName: 'N', trainer: [], drills, stats: [], studied: [neuroLesson] }).flatMap(w => w.exercises)) {
        if (q.kind !== 'faceOff' || !q.whyWrong) continue;
        expect(q.whyWrong[q.correctIndex]).toBeNull();
        expect(q.whyWrong[1 - q.correctIndex]).toMatch(/^The lesson says/);
      }
    }
  });

  it('when written options are shuffled', () => {
    const q = { kind: 'multipleChoice' as const, id: 'q', prompt: 'P', options: ['A', 'B', 'C'], correctIndex: 1, whyWrong: ['not A', null, 'not C'] };
    for (let i = 0; i < 20; i++) {
      const s = shuffleAuthored(q as any) as any;
      s.options.forEach((option: string, index: number) => expect(s.whyWrong[index]).toBe(option === 'B' ? null : `not ${option}`));
    }
  });

  it('quiz history keys ignore review cards and why-wrong lines', () => {
    const sort = (neuroLesson.questions as any[]).find(q => q.kind === 'sortSignal');
    expect(quizQuestionKeys({ ...sort, review: { title: 'x', body: 'y' }, whyWrong: ['a'] })).toEqual(quizQuestionKeys(sort));
  });
});

describe('screens and copies', () => {
  it('shows the why-wrong line and the review sheet in the footer', () => {
    const footer = read('mobile/lesson-kit/components/FeedbackFooter.tsx');
    expect(footer).toContain('Review this in the lesson');
    expect(footer).toContain('Back to the question');
    for (const screen of ['screens/LessonScreen', 'arena/ArenaScreen', 'case/CaseScreen']) {
      expect(read(`mobile/lesson-kit/${screen}.tsx`)).toContain('feedbackCopy(');
    }
  });

  it('JavaScript copies match their source and import React when they use it', () => {
    const pairs: Array<[string, string]> = [
      ['lesson-kit/sequencer/lessonChecks', 'ts'], ['lesson-kit/arena/buildArena', 'ts'], ['lesson-kit/case/buildCase', 'ts'],
      ['lesson-kit/components/FeedbackFooter', 'tsx'], ['lesson-kit/components/feedbackCopy', 'ts'],
      ['lesson-kit/exercises/MultipleChoice', 'tsx'], ['lesson-kit/modules/FaceOff', 'tsx'], ['lesson-kit/modules/MapMarket', 'tsx'],
      ['lesson-kit/modules/SpotTheFake', 'tsx'], ['lesson-kit/modules/TheCall', 'tsx'], ['lesson-kit/screens/LessonScreen', 'tsx'],
      ['lesson-kit/arena/ArenaScreen', 'tsx'], ['lesson-kit/case/CaseScreen', 'tsx'], ['lib/quizHistory', 'ts'],
    ];
    for (const [path, loader] of pairs) {
      const js = read(`mobile/${path}.js`);
      expect(js).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js).toMatch(/import React\b/);
    }
  }, 60000);
});
