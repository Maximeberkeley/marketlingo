import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  arenaXp, buildArena, DEFINITION_PROMPT, LESSON_CAP_PER_RUN, RECOVERY_XP, roundCovers, SECOND_CHANCE_LIMIT,
  secondChanceWave, spacedReview,
} from '../mobile/lesson-kit/arena/buildArena';
import { fillBlankFrom, matchPairsFrom } from '../mobile/lesson-kit/arena/arenaGames';
import { reviewAnswer, reviewQuestion, formatAmount } from '../mobile/lesson-kit/arena/arenaReview';
import { checkDefinition, withoutExpansion } from '../mobile/lesson-kit/sequencer/lessonChecks';
import { studiedMaterial } from '../mobile/lesson-kit/practice/studiedMaterial';
import { quizQuestionKeys } from '../mobile/lib/quizHistory';
import { shortText } from '../mobile/lesson-kit/text';
import type { Exercise } from '../mobile/lesson-kit/types';
import aerospace from './fixtures/aerospace-day1.json';

const read = (p: string) => readFileSync(p, 'utf8');
const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });

const mc = (id: string, prompt: string): Exercise => ({ kind: 'multipleChoice', id, prompt, options: ['A', 'B', 'C'], correctIndex: 1 });

describe('a question is never cut off', () => {
  it('names the term from a definition shown whole, without its spelled-out acronym', () => {
    const lesson = { ...aerospace, ...studiedMaterial(aerospace.authored_lesson) };
    for (let run = 0; run < 20; run++) {
      const questions = buildArena({ marketId: 'aerospace', marketName: 'Aerospace', trainer: [], drills: [], stats: [], studied: [lesson] })
        .flatMap(w => w.exercises);
      for (const q of questions) {
        // The phone shows two sentences and 120 characters of a prompt: every Arena prompt fits.
        if (q.kind === 'multipleChoice') expect(shortText(q.prompt, 2, 120), q.prompt).toBe(q.prompt.replace(/\s+/g, ' ').trim());
        if (q.kind === 'multipleChoice' && q.prompt === DEFINITION_PROMPT) {
          expect(q.context).toBeTruthy();
          expect(q.context).not.toMatch(/^Original equipment manufacturer/);
        }
      }
    }
  });

  it('drops only a leading clause whose initials spell the acronym', () => {
    expect(withoutExpansion('OEM', 'Original equipment manufacturer. In aerospace, the company that designs, builds and certifies the whole aircraft.'))
      .toBe('In aerospace, the company that designs, builds and certifies the whole aircraft.');
    expect(withoutExpansion('MRO', 'Maintenance, repair and overhaul: the work that keeps an aircraft fit to fly.'))
      .toBe('The work that keeps an aircraft fit to fly.');
    expect(withoutExpansion('CPFF', 'Cost-plus-fixed-fee: costs are repaid and the fee is set at the start.'))
      .toBe('Costs are repaid and the fee is set at the start.');
    // Not an acronym, initials that do not match, or nothing left: unchanged.
    expect(withoutExpansion('Backlog', 'Orders taken. Planes not yet delivered to customers.')).toBe('Orders taken. Planes not yet delivered to customers.');
    expect(withoutExpansion('FAA', 'The US regulator. It certifies every airliner design.')).toBe('The US regulator. It certifies every airliner design.');
    expect(withoutExpansion('PMA', 'Parts Manufacturer Approval. Short.')).toBe('Parts Manufacturer Approval. Short.');
  });

  it('applies the same to Practice definitions and to match the pairs', () => {
    const terms = [
      { term: 'OEM', definition: 'Original equipment manufacturer. In aerospace, the company that designs and certifies the aircraft.' },
      { term: 'Backlog', definition: 'Aircraft ordered by customers but not yet delivered.' },
      { term: 'Book-to-bill', definition: 'New orders divided by deliveries in the same period.' },
    ];
    for (let i = 0; i < 10; i++) {
      const q = checkDefinition(terms, 'd')!;
      expect(q.prompt).toBe(DEFINITION_PROMPT);
      expect(q.context).not.toMatch(/^Original equipment/);
    }
    expect(matchPairsFrom(terms, 'm')!.pairs[0].right).toBe('In aerospace, the company that designs and certifies the aircraft.');
  });

  it('keeps the definition when Practice flattens a question into one line of text', () => {
    const src = read('mobile/lesson-kit/practice/lessonQuestions.ts');
    expect(src).toContain('question: item.context ? `${item.prompt} "${item.context}"` : item.prompt,');
  });

  it('puts a long rule in the context card and prefers decoys from the same lesson', () => {
    const own = [{ term: 'DO-178C', definition: 'The standard for proving airborne software is safe.' },
      { term: 'STC', definition: 'An approval to change an already certified aircraft design.' }];
    const other = [{ term: 'Lessor', definition: 'A company that buys planes and rents them to airlines.' },
      { term: 'Backlog', definition: 'Aircraft ordered but not yet delivered.' }];
    const line = 'The design, the factory and each plane are approved separately. DO-178C, DO-160 and AS9100 are how companies prove software, equipment and quality.';
    const game = fillBlankFrom(line, own, other, 'b', 'takeaway')!;
    expect(game.prompt).toBe("Fill the gap in the lesson's takeaway.");
    expect(game.context).toContain('_____, DO-160 and AS9100');
    expect(game.options).toContain('STC');
  });

  it('keys two definition questions apart by their definitions', () => {
    const a = { ...mc('a', DEFINITION_PROMPT), context: 'One definition.' };
    const b = { ...mc('b', DEFINITION_PROMPT), context: 'Another definition.' };
    expect(quizQuestionKeys(a)).not.toEqual(quizQuestionKeys(b));
    // A question without context keeps its old key, so this week's history still applies.
    expect(quizQuestionKeys(mc('c', 'Which layer?'))).toEqual(['which layer b']);
  });
});

describe('earlier lessons come back on a spaced schedule', () => {
  it('reviews yesterday, then about 3 and 7 days back, and today last', () => {
    const days = Array.from({ length: 12 }, (_, i) => ({ day: 12 - i }));
    const order = spacedReview(days).map(l => l.day);
    expect(order.slice(0, 3)).toEqual([11, 9, 5]);
    expect(order[order.length - 1]).toBe(12);
    expect(new Set(order).size).toBe(12);
    expect(spacedReview([{ day: 1 }])).toEqual([{ day: 1 }]);
  });

  it('lets one lesson fill at most two questions of a run when others have material', () => {
    const lesson = (day: number) => ({
      stackId: `s${day}`, title: `Lesson ${day}`, day, slides: [],
      questions: [0, 1, 2].flatMap(i => [
        { kind: 'multipleChoice' as const, id: `m${day}${i}`, prompt: `Day ${day} question ${i}: which one?`, options: [`right ${day}${i}`, `wrong ${day}${i}`, `other ${day}${i}`], correctIndex: 0 },
        { kind: 'theCall' as const, id: `c${day}${i}`, situation: `Day ${day} scene ${i}.`, prompt: 'What do you do?', options: [`act ${day}${i}`, `wait ${day}${i}`, `quit ${day}${i}`], correctIndex: 0, consequences: ['a.', 'b.', 'c.'] },
      ]),
    });
    const studied = [6, 5, 4, 3, 2, 1].map(lesson);
    for (let run = 0; run < 10; run++) {
      const questions = buildArena({ marketId: 'aerospace', trainer: [], drills: [], stats: [], studied }).flatMap(w => w.exercises);
      const perLesson = new Map<string, number>();
      for (const q of questions) {
        if (q.source?.type !== 'lesson') continue;
        perLesson.set(q.source.title, (perLesson.get(q.source.title) ?? 0) + 1);
      }
      expect(Math.max(...perLesson.values())).toBeLessThanOrEqual(LESSON_CAP_PER_RUN);
      expect(perLesson.size).toBeGreaterThanOrEqual(3);
    }
  });

  it('says what each round draws on', () => {
    const from = (day: number | null, title: string) => ({ ...mc(`x${day}${title}`, 'Q?'), source: { type: 'lesson' as const, day, title } });
    expect(roundCovers([from(12, 'When the rulebook has no category')])).toBe('From Day 12 · When the rulebook has no category');
    expect(roundCovers([from(11, 'A'), from(9, 'B'), from(5, 'C')])).toBe('From days 5, 9 and 11');
    expect(roundCovers([from(null, 'Days 4 and 5'), from(7, 'Approvals')])).toBe('From days 4, 5 and 7');
    expect(roundCovers([from(3, 'A'), { ...mc('i', 'Q?'), source: { type: 'industry' as const } }])).toBe('From Day 3 · A and the wider industry');
  });
});

describe('the second chance and the summary', () => {
  it('brings back up to three misses with fresh ids, at half points', () => {
    expect(secondChanceWave([])).toBeNull();
    const misses = ['a', 'b', 'c', 'd'].map(id => mc(id, `Question ${id}?`));
    const wave = secondChanceWave(misses)!;
    expect(wave.key).toBe('again');
    expect(wave.multiplier).toBe(0.5);
    expect(wave.exercises).toHaveLength(SECOND_CHANCE_LIMIT);
    expect(wave.exercises.map(e => e.id)).toEqual(['b-again', 'c-again', 'd-again']);
    expect(secondChanceWave([misses[0]])!.tagline).toBe('The one that got away, one more time.');
  });

  it('pays a little for a miss put right, never the perfect bonus, and a quarter on replays', () => {
    expect(arenaXp(7, 9, false, 2)).toBe(66 + 2 * RECOVERY_XP);
    expect(arenaXp(9, 9, false, 0)).toBe(102);
    expect(arenaXp(7, 9, true, 2)).toBe(Math.round((66 + 2 * RECOVERY_XP) * 0.25));
  });

  it('writes a review line and the right answer for every kind of game', () => {
    expect(reviewQuestion({ ...mc('d', DEFINITION_PROMPT), context: 'The company that certifies the aircraft.' }))
      .toBe(`${DEFINITION_PROMPT} "The company that certifies the aircraft."`);
    expect(reviewAnswer(mc('m', 'Which?'))).toBe('B');
    expect(reviewAnswer({ kind: 'numberSense', id: 'n', prompt: 'How many?', min: 0, max: 100, value: 71, unit: '' })).toBe('71');
    expect(formatAmount(2.4, 'B')).toBe('2.4B');
    expect(formatAmount(11, 'years')).toBe('11 years');
    expect(reviewAnswer({ kind: 'buildChain', id: 'c', prompt: 'Order', steps: ['Order', 'Build', 'Deliver'] })).toBe('Order → Build → Deliver');
    expect(reviewAnswer({ kind: 'spotFake', id: 's', prompt: 'Which?', statements: ['A is true.', 'B is false.'], fakeIndex: 1 })).toBe('False: B is false.');
    expect(reviewAnswer({ kind: 'sortSignal', id: 'o', prompt: 'Sort', buckets: ['Sole', 'Single'], items: [{ text: 'No backup', bucket: 0 }, { text: 'Chosen', bucket: 1 }] }))
      .toBe('Sole: No backup. Single: Chosen');
    expect(reviewAnswer({ kind: 'quickFire', id: 'q', prompt: 'T or F', cards: [{ text: 'Right.', isTrue: true }, { text: 'Wrong line.', isTrue: false }] }))
      .toBe('False: Wrong line.');
    expect(reviewQuestion({ kind: 'theCall', id: 't', situation: 'You run an OEM.', prompt: 'What do you do?', options: ['a', 'b'], correctIndex: 0 })).toBe('You run an OEM.');
  });

  it('wires the second chance, a real personal best, and a summary that always banks', () => {
    const screen = read('mobile/lesson-kit/arena/ArenaScreen.tsx');
    expect(screen).toContain('const retry = again || fixedXp !== undefined ? null : secondChanceWave(missed.current);');
    expect(screen).toContain('const newBest = bestScore > 0 && score > bestScore;');
    expect(screen).toContain('const xp = fixedXp ?? arenaXp(correct, graded, replay, recovered);');
    expect(screen).toContain('DAILY ARENA');
    expect(screen).not.toContain('DAILY QUIZ');
    // Leaving the summary without banking used to throw the run away.
    expect(screen).not.toContain('Back to {marketName} practice');
    // The second chance never changes the first-time tally.
    expect(screen).toContain('if (!inAgain) setCorrect(c => c + 1);');
  });

  it('keeps the JavaScript copies in sync', () => {
    for (const [path, loader] of [
      ['lesson-kit/arena/arenaReview', 'ts'], ['lesson-kit/arena/buildArena', 'ts'], ['lesson-kit/arena/arenaGames', 'ts'],
      ['lesson-kit/arena/ArenaScreen', 'tsx'], ['lesson-kit/exercises/MultipleChoice', 'tsx'], ['lesson-kit/sequencer/lessonChecks', 'ts'],
      ['lesson-kit/types', 'ts'], ['lib/quizHistory', 'ts'], ['lesson-kit/practice/lessonQuestions', 'ts'],
    ]) {
      const js = read(`mobile/${path}.js`);
      expect(js, path).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js, path).toMatch(/import React\b/);
    }
  }, 60000);
});

describe('visual cleanup', () => {
  const src = (p: string) => readFileSync(p, 'utf8');
  it('keeps names like DO-160 and AS9100 whole and bolds only standalone figures', () => {
    const text = src('mobile/lesson-kit/components/ColorText.tsx');
    expect(text).toContain('never part of a name like DO-160');
    expect(text).not.toContain('const SIGNAL');
  });
  it('keeps the round-intro button white in dark mode and the practice screens compact', () => {
    const arena = src('mobile/lesson-kit/arena/ArenaScreen.tsx');
    expect(arena).toContain("backgroundColor: '#FFFFFF',");
    expect(arena).toMatch(/<LeoCoach\s+compact/);
    expect(src('mobile/lesson-kit/case/CaseScreen.tsx')).toMatch(/<LeoCoach\s+compact/);
  });
});
