import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { alter, checkClaim, isStandaloneClaim } from '../mobile/lesson-kit/sequencer/lessonChecks';
import { arenaXp, ARENA_REPLAY_SHARE, buildArena, beatSeconds } from '../mobile/lesson-kit/arena/buildArena';
import { fillBlankFrom, matchPairsFrom, oddOneOutFrom, quickFireFrom } from '../mobile/lesson-kit/arena/arenaGames';
import { studiedMaterial } from '../mobile/lesson-kit/practice/studiedMaterial';
import { quizQuestionKeys } from '../mobile/lib/quizHistory';
import { lessonRewards, LESSON_BASE_XP } from '../mobile/lesson-kit/screens/lessonRewards';
import { CASE_XP } from '../mobile/lesson-kit/case/buildCase';
import aerospace from './fixtures/aerospace-day1.json';

const read = (p: string) => readFileSync(p, 'utf8');
const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });

const terms = [
  { term: 'Actuator', definition: 'A device that turns energy into motion, like a motor that moves a robot joint.' },
  { term: 'Lidar', definition: 'A sensor that measures distance with pulsed laser light.' },
  { term: 'Unit cost', definition: 'What it costs to make one item; it falls as volume rises.' },
  { term: 'Choke point', definition: 'A supply chain step so concentrated that one player can halt it.' },
];
const spotFake = { kind: 'spotFake' as const, id: 'f', prompt: 'One is false.', statements: ['The R1 launched at about $5,900.', 'The R1 costs more than the H1.', 'The R1 has 26 joints.'], fakeIndex: 1, explanation: 'The H1 sold for over $90,000.' };

describe('the sentence editor no longer makes nonsense fakes', () => {
  it('never alters a label, a date or a range (Tier 7, 42 December, 21 to 5 years)', () => {
    expect(alter('A Tier 1 supplier may deliver an assembly and buy your parts further down the chain.')).toBeNull();
    expect(alter("On 6 December 2023, the United Kingdom's Serious Fraud Office announced an investigation.")).toBeNull();
    expect(alter('The FAA says an amended type certificate typically takes 3 to 5 years.')).toBeNull();
    expect(alter('Phase 2 trials enrolled the 3rd cohort at 10:30.')).toBeNull();
    // A real amount still changes, clearly.
    expect(alter('In July 2025, Hadrian announced a $260 million Series C.')?.text).toBe('In July 2025, Hadrian announced a $52 million Series C.');
  });

  it('never swaps the noun "contract" for "expand"', () => {
    expect(alter('Your startup funds equipment unless the contract assigns those costs to the buyer.')).toBeNull();
  });

  it('only treats standalone claims as "what the lesson said"', () => {
    for (const scene of ['Consider a startup selling flight-critical machined parts.', 'It then makes the initial parts and records the results.',
      'Tomorrow, costing a production contract becomes necessary because cash runs out.', 'Your startup funds equipment and preparation.', 'What would you do next?']) {
      expect(isStandaloneClaim(scene), scene).toBe(false);
    }
    for (const claim of ["Boeing's CEO, Kelly Ortberg, blamed slower FAA authorizations for flight testing.", 'Supplier revenue grows when more aircraft are delivered.']) {
      expect(isStandaloneClaim(claim), claim).toBe(true);
    }
    const slides = [{ slideNumber: 1, title: 'Scene', body: 'Consider a startup selling machined parts. It then makes the first parts. Tomorrow, the contract becomes necessary.' }];
    expect(checkClaim(slides, 'c')).toBeNull();
  });
});

describe('new Arena games come straight from what the lesson wrote', () => {
  it('match the pairs uses three or four real term and definition pairs', () => {
    const game = matchPairsFrom(terms, 'm');
    expect(game?.pairs).toHaveLength(4);
    expect(game?.pairs[0]).toEqual({ left: 'Actuator', right: terms[0].definition });
    expect(matchPairsFrom(terms.slice(0, 2), 'm')).toBeNull();
  });

  it('quick fire mixes the lesson\'s own true lines with its marked-false line and wrong-term definitions', () => {
    for (let i = 0; i < 30; i++) {
      const game = quickFireFrom({ spotFakes: [spotFake], terms: terms.slice(0, 2), decoyTerms: terms.slice(2) }, 'q')!;
      expect(game.cards.length).toBeGreaterThanOrEqual(3);
      expect(game.cards.length).toBeLessThanOrEqual(5);
      expect(game.cards.some(c => c.isTrue) && game.cards.some(c => !c.isTrue)).toBe(true);
      const fake = game.cards.find(c => c.text === 'The R1 costs more than the H1.');
      if (fake) expect(fake).toMatchObject({ isTrue: false, why: 'The H1 sold for over $90,000.' });
      for (const card of game.cards.filter(c => c.text.startsWith('Lidar:') && !c.isTrue)) {
        expect(card.text).not.toContain(terms[1].definition);
        expect(card.why).toMatch(/^That describes /);
      }
    }
    // No false card means no game: a deck of only true lines tests nothing.
    expect(quickFireFrom({ terms: [terms[0]], truths: ['The rule line that is long enough to read as a card.'] }, 'q')).toBeNull();
  });

  it('fill the gap blanks a real key term in the rule and offers real terms as decoys', () => {
    const game = fillBlankFrom('In robot design, the actuator decides what the body can do.', [terms[0]], terms.slice(1), 'b')!;
    expect(game.prompt).toBe('Complete the rule: In robot design, the _____ decides what the body can do.');
    expect(game.options[game.correctIndex]).toBe('actuator');
    expect(game.options.filter(o => o !== 'actuator').every(o => terms.slice(1).some(t => t.term === o))).toBe(true);
  });

  it('odd one out comes from a sort the lesson wrote', () => {
    const sort = { kind: 'sortSignal' as const, id: 's', prompt: 'Sense, think or move?', buckets: ['Sense', 'Think', 'Move'],
      items: [{ text: 'Lidar sensor', bucket: 0 }, { text: 'Jetson Thor computer', bucket: 1 }, { text: 'Electric joint motor', bucket: 2 }, { text: 'Camera', bucket: 0 }] };
    const game = oddOneOutFrom(sort, 'o')!;
    expect(game.prompt).toBe('Two of these go under "Sense". Which one doesn\'t?');
    expect(['Jetson Thor computer', 'Electric joint motor']).toContain(game.options[game.correctIndex]);
    expect(game.options).toEqual(expect.arrayContaining(['Lidar sensor', 'Camera']));
  });

  it('gives multi-part games time per card or pair', () => {
    expect(beatSeconds({ seconds: 20 }, { kind: 'quickFire', id: 'q', prompt: 'p', cards: Array(5).fill({ text: 't', isTrue: true }) })).toBe(39);
    expect(beatSeconds({ seconds: 20 }, { kind: 'matchPairs', id: 'm', prompt: 'p', pairs: Array(4).fill({ left: 'a', right: 'b' }) })).toBe(62);
  });

  it('keys every pair and card in the seven-day history', () => {
    expect(quizQuestionKeys(matchPairsFrom(terms, 'm')!)).toHaveLength(4);
    expect(quizQuestionKeys({ kind: 'quickFire', id: 'q', prompt: 'p', cards: [{ text: 'a', isTrue: true }, { text: 'b', isTrue: false }] })).toHaveLength(2);
  });
});

describe('the run: three named rounds of different games', () => {
  const lesson = { ...(aerospace as any), ...studiedMaterial((aerospace as any).authored_lesson) };
  const written = (day: number, extra: any = {}) => ({ ...lesson, stackId: `d${day}`, day, title: `Day ${day}`,
    keyTerms: lesson.keyTerms.map((t: any) => ({ ...t, term: `${t.term} ${day}` })), ...extra });

  it('names the rounds Quick fire, Connect the dots and Your call', () => {
    const waves = buildArena({ marketId: 'aerospace', marketName: 'Aerospace', trainer: [], drills: [], stats: [], studied: [written(3), written(2), written(1)] });
    expect(waves.map(w => w.name)).toEqual(['Quick fire', 'Connect the dots', 'Your call']);
    expect(waves.map(w => w.key)).toEqual(['quick', 'connect', 'call']);
  });

  it('plays each big game at most once per run and never edits a written lesson\'s sentences', () => {
    for (let i = 0; i < 40; i++) {
      const waves = buildArena({ marketId: 'aerospace', marketName: 'Aerospace', trainer: [], drills: [], stats: [],
        studied: [written(3, { questions: [...lesson.questions, spotFake] }), written(2), written(1)] });
      const questions = waves.flatMap(w => w.exercises);
      expect(questions.filter(q => q.kind === 'matchPairs').length).toBeLessThanOrEqual(1);
      expect(questions.filter(q => q.kind === 'quickFire').length).toBeLessThanOrEqual(1);
      expect(questions.some(q => q.kind === 'multipleChoice' && q.prompt.startsWith('Only one of these matches'))).toBe(false);
      expect(questions.some(q => q.kind === 'spotFake' && q.prompt.startsWith('One of these has been altered'))).toBe(false);
      expect(new Set(questions.map(q => q.kind)).size).toBeGreaterThanOrEqual(3);
    }
  });

  it('never ends a run on a miss', () => {
    const screen = read('mobile/lesson-kit/arena/ArenaScreen.tsx');
    expect(screen).not.toMatch(/suddenDeath|setShields|endRun\(false\)/);
    expect(screen).toContain("{phase === 'feedback' ? (timedOut ? \"Time's up\" : '\\u00a0') : `${timeLeft}s left`}");
    expect(screen).toContain('{!!wave.name && <Text style={styles.waveName}>{wave.name}</Text>}');
  });
});

describe('XP balance', () => {
  it('pays Arena XP for right answers, with a perfect-run bonus, and a quarter on replays', () => {
    expect(arenaXp(9, 9)).toBe(10 + 72 + 20);
    expect(arenaXp(7, 9)).toBe(66);
    expect(arenaXp(0, 9)).toBe(10);
    expect(ARENA_REPLAY_SHARE).toBe(0.25);
    expect(arenaXp(9, 9, true)).toBe(Math.round(102 * 0.25));
    expect(arenaXp(0, 9, true)).toBe(5);
  });

  it('makes the daily lesson worth at least twice a top Deep Case and banks what the screen itemized', () => {
    expect(CASE_XP).toEqual({ A: 40, B: 30, C: 20, D: 10 });
    expect(LESSON_BASE_XP).toBeGreaterThanOrEqual(2 * CASE_XP.A);
    const lines = lessonRewards(30, 100, 3, 3, undefined, 120);
    expect(lines[0]).toEqual({ label: 'Daily lesson', xp: LESSON_BASE_XP });
    expect(lines.filter(l => l.label === 'Daily lesson')).toHaveLength(1);
    const flow = read('mobile/hooks/useSessionFlow.ts');
    expect(flow).toContain('Math.max(xpRewardLessonComplete, Math.round(lessonXp ?? 0))');
    expect(flow).toContain('await completeLessonForToday(activeStack.id, earnedXP);');
    expect(read('mobile/components/slides/LessonKitReader.tsx')).toContain('onFinish={({ timeSpentSeconds, correct, total, xp }) => onComplete(');
    expect(read('mobile/app/arena.tsx')).toContain("await addXP(result.xp, 'arena', undefined, replay ? 'Daily Arena replay' : 'Daily Arena run');");
  });
});

describe('JavaScript copies stay in sync', () => {
  it('match their source and import React when they use it', () => {
    for (const [path, loader] of [
      ['lesson-kit/types', 'ts'], ['lesson-kit/modules/MatchPairs', 'tsx'], ['lesson-kit/modules/QuickFire', 'tsx'],
      ['lesson-kit/components/ExerciseRenderer', 'tsx'], ['lib/quizHistory', 'ts'], ['lesson-kit/arena/buildArena', 'ts'],
      ['lesson-kit/arena/arenaGames', 'ts'], ['lesson-kit/arena/ArenaScreen', 'tsx'], ['app/arena', 'tsx'],
      ['lesson-kit/practice/studiedMaterial', 'ts'], ['hooks/useStudiedLessons', 'ts'], ['lesson-kit/sequencer/lessonChecks', 'ts'],
      ['lesson-kit/case/buildCase', 'ts'], ['lesson-kit/case/CaseScreen', 'tsx'], ['components/achievements/AchievementPopup', 'tsx'],
      ['lesson-kit/screens/lessonRewards', 'ts'], ['components/slides/LessonKitReader', 'tsx'], ['app/(tabs)/home', 'tsx'],
      ['hooks/useSessionFlow', 'ts'], ['hooks/useUserXP', 'ts'],
    ]) {
      const js = read(`mobile/${path}.js`);
      expect(js, path).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js, path).toMatch(/import React\b/);
    }
  }, 90000);
});
