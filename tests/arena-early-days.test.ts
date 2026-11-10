import { describe, it, expect } from 'vitest';
import { buildArena, DEFINITION_PROMPT } from '../mobile/lesson-kit/arena/buildArena';
import { studiedMaterial } from '../mobile/lesson-kit/practice/studiedMaterial';
import { glossaryEntriesFor } from '../mobile/lesson-kit/glossary';
import { quizQuestionKeys } from '../mobile/lib/quizHistory';
import { norm } from '../mobile/lesson-kit/sequencer/extract';
import cleanenergy from './fixtures/cleanenergy-day1.json';
import cybersecurity from './fixtures/cybersecurity-day1.json';
import fintech from './fixtures/fintech-day1.json';
import web3 from './fixtures/web3-day1.json';

const fixtures = { cleanenergy, cybersecurity, fintech, web3 } as const;

const trainers = [1, 2, 3].map(n => ({ id: `trainer-${n}`, scenario: `An unrelated industry decision ${n}.`, question: `Which approach fits case ${n}?`, options: [{ label: 'A', isCorrect: true }, { label: 'B' }], correct_option_index: 0 }));
const drills = [
  { id: 'd1', statement: 'A verified true market fact.', is_true: true, explanation: 'Checked.' },
  { id: 'd2', statement: 'Another verified true market fact.', is_true: true, explanation: 'Checked.' },
  { id: 'd3', statement: 'A verified false market claim.', is_true: false, explanation: 'Checked.' },
];
const stats = [
  { id: 's1', label: 'Market size', value: 120, min_value: 0, max_value: 500, unit: 'billion dollars', trend: 'up', trend_note: 'Growing.', source_name: 'Test source', period_label: '2025', is_approximate: true, insight: null },
  { id: 's2', label: 'New projects', value: 40, min_value: 0, max_value: 100, unit: 'projects', trend: 'down', trend_note: null, source_name: 'Test source', period_label: '2025', is_approximate: false, insight: null },
];

const lessonOf = (fixture: typeof cleanenergy) => ({ ...fixture, ...studiedMaterial(fixture.authored_lesson) });
const arenaFor = (marketId: keyof typeof fixtures) =>
  buildArena({ marketId, marketName: marketId, trainer: trainers, drills, stats, studied: [lessonOf(fixtures[marketId])] });
const all = (waves: ReturnType<typeof buildArena>) => waves.flatMap(w => w.exercises);
const isDefinition = (q: any) => q.kind === 'multipleChoice' && q.prompt === DEFINITION_PROMPT;

describe('early-days Arena across industries', () => {
  // A first lesson with two written checks and two terms is a short starter round:
  // only its own material, never sentences edited into fakes to pad the run.
  it.each(Object.keys(fixtures) as (keyof typeof fixtures)[])('%s day 1 starter round: only lesson questions, at least 3, no fact twice', (marketId) => {
    for (let run = 0; run < 25; run++) {
      const waves = arenaFor(marketId);
      const questions = all(waves);
      expect(questions.length).toBeGreaterThanOrEqual(3);
      expect(questions.some(q => q.kind === 'multipleChoice' && q.prompt.startsWith('Only one of these matches'))).toBe(false);
      expect(questions.some(q => q.kind === 'spotFake' && q.prompt.startsWith('One of these has been altered'))).toBe(false);
      expect(questions.every(q => q.source?.type === 'lesson')).toBe(true);
      expect(waves.every(w => w.covers?.startsWith('Starter round · from '))).toBe(true);
      for (const wave of waves) {
        const types = wave.exercises.map(e => e.source?.type);
        const lastLesson = types.lastIndexOf('lesson');
        const firstIndustry = types.indexOf('industry');
        expect(firstIndustry === -1 || lastLesson < firstIndustry).toBe(true);
      }
      const keys = questions.flatMap(quizQuestionKeys);
      expect(new Set(keys).size).toBe(keys.length);
    }
  }, 30000);
  it.each(Object.keys(fixtures) as (keyof typeof fixtures)[])('%s from the 3rd lesson: at least 8 questions, lesson first, no fact twice', (marketId) => {
    const earlier = [2, 3].map(day => ({ title: `Earlier ${day}`, day, slides: [] }));
    for (let run = 0; run < 25; run++) {
      const waves = buildArena({ marketId, marketName: marketId, trainer: trainers, drills, stats, studied: [lessonOf(fixtures[marketId]), ...earlier] });
      const questions = all(waves);
      expect(questions.length).toBeGreaterThanOrEqual(8);
      // Each round names what it draws on.
      expect(waves.every(w => w.covers?.startsWith('From '))).toBe(true);
      for (const wave of waves) {
        const types = wave.exercises.map(e => e.source?.type);
        expect(types.indexOf('industry') === -1 || types.lastIndexOf('lesson') < types.indexOf('industry')).toBe(true);
      }
      const keys = questions.flatMap(quizQuestionKeys);
      expect(new Set(keys).size).toBe(keys.length);
    }
  }, 30000);

  it('cleanenergy day 1 uses its multiple-choice, its put-in-order and both key terms', () => {
    // A term counts once it is asked anywhere: a definition, a filled gap, a pair or a true-or-false card.
    const asks = (q: any, term: string) =>
      (q.kind === 'multipleChoice' && q.options[q.correctIndex]?.toLowerCase() === term.toLowerCase()) ||
      (q.kind === 'matchPairs' && q.pairs.some((p: any) => p.left === term)) ||
      (q.kind === 'quickFire' && q.cards.some((c: any) => c.text.startsWith(`${term}:`)));
    for (let run = 0; run < 25; run++) {
      const lessonQuestions = all(arenaFor('cleanenergy')).filter(q => q.source?.type === 'lesson');
      expect(lessonQuestions.length).toBeGreaterThanOrEqual(3);
      expect(lessonQuestions.some(q => q.kind === 'multipleChoice' && !isDefinition(q) && !q.prompt.startsWith('Complete the'))).toBe(true);
      expect(lessonQuestions.some(q => q.kind === 'buildChain')).toBe(true);
      for (const term of ['distribution', 'RTOs']) expect(lessonQuestions.some(q => asks(q, term)), term).toBe(true);
    }
  }, 30000);

  it('definition decoys never match the right definition', () => {
    for (const marketId of Object.keys(fixtures) as (keyof typeof fixtures)[]) {
      const lesson = lessonOf(fixtures[marketId]);
      const definitions = new Map<string, string>();
      for (const t of [...lesson.keyTerms, ...glossaryEntriesFor(marketId)]) definitions.set(norm(t.term), norm(t.definition));
      for (let run = 0; run < 10; run++) {
        for (const q of all(arenaFor(marketId))) {
          if (!isDefinition(q) || q.kind !== 'multipleChoice') continue;
          expect(new Set(q.options).size).toBe(q.options.length);
          const targetDef = norm(q.options[q.correctIndex] ? definitions.get(norm(q.options[q.correctIndex])) ?? '' : '');
          for (const option of q.options) {
            if (option === q.options[q.correctIndex]) continue;
            const decoyDef = definitions.get(norm(option));
            if (decoyDef) expect(decoyDef).not.toBe(targetDef);
          }
        }
      }
    }
  }, 30000);

  it('definition decoys come from other studied lessons before the glossary', () => {
    // Three lessons: the newest terms go to the pairs game, the rest to definitions.
    const a = lessonOf(fintech);
    const b = { ...lessonOf(web3), stackId: 'web3-day1', day: 2 };
    const c = { ...lessonOf(cleanenergy), stackId: 'cleanenergy-day1', day: 3 };
    const waves = buildArena({ marketId: 'fintech', marketName: 'Fintech', trainer: trainers, drills, stats, studied: [c, b, a] });
    const studiedTerms = [a, b, c];
    const otherTerms = (title: string) => new Set(studiedTerms.filter(l => l.title !== title).flatMap(l => l.keyTerms.map(t => t.term)));
    const defs = all(waves).filter(q => isDefinition(q) && q.source?.type === 'lesson');
    expect(defs.length).toBeGreaterThanOrEqual(1);
    for (const q of defs) {
      if (q.kind !== 'multipleChoice' || q.source?.type !== 'lesson') continue;
      const decoys = q.options.filter(o => o !== q.options[q.correctIndex]);
      expect(decoys.every(d => otherTerms(q.source!.type === 'lesson' ? q.source!.title : '').has(d))).toBe(true);
    }
  });
});
