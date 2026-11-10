import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from "node:child_process";
const transformSync = (source: string, options: any) => ({code: execFileSync(process.execPath, ["--input-type=module", "-e", `import {transformSync} from "esbuild"; process.stdout.write(transformSync(${JSON.stringify(source)}, ${JSON.stringify(options)}).code);`], {encoding: "utf8"})});
import { buildArena, shuffleAuthored } from '../mobile/lesson-kit/arena/buildArena';
import { buildCase } from '../mobile/lesson-kit/case/buildCase';
import { studiedMaterial } from '../mobile/lesson-kit/practice/studiedMaterial';
import { quizQuestionKeys, recordQuizQuestion, recentQuizHistory, QUIZ_WINDOW_MS } from '../mobile/lib/quizHistory';
import fixture from './fixtures/neuroscience-day1.json';
const lesson = { ...fixture, ...studiedMaterial(fixture.authored_lesson) };
const trainers = [1, 2, 3].map(n => ({ id: `trainer-${n}`, scenario: `An unrelated research decision ${n}.`, question: `Which approach fits case ${n}?`, options: [{label:'A',isCorrect:true},{label:'B'}], correct_option_index: 0 }));
const drills = [
  { id: 'd1', statement: 'A verified true market fact.', is_true: true, explanation: 'Checked.' },
  { id: 'd2', statement: 'Another verified true market fact.', is_true: true, explanation: 'Checked.' },
  { id: 'd3', statement: 'A verified false market claim.', is_true: false, explanation: 'Checked.' },
];
const stats = [
  { id: 's1', label: 'Market size', value: 120, min_value: 0, max_value: 500, unit: 'billion dollars', trend: 'up', trend_note: 'Growing.', source_name: 'Test source', period_label: '2025', is_approximate: true, insight: null },
  { id: 's2', label: 'New projects', value: 40, min_value: 0, max_value: 100, unit: 'projects', trend: 'down', trend_note: null, source_name: 'Test source', period_label: '2025', is_approximate: false, insight: null },
];
const input = { marketId: 'neuroscience', marketName: 'Neuroscience', trainer: trainers, drills, stats, studied: [lesson] };
const all = (waves: ReturnType<typeof buildArena>) => waves.flatMap(w => w.exercises);

describe('lesson-first Arena', () => {
  it('plays only the written lesson: its checks and terms, never edited sentences or a prose chain', () => {
    for (let i = 0; i < 100; i++) {
      const waves = buildArena(input);
      expect(waves.map(w => w.exercises.length).every(n => n <= 3)).toBe(true);
      const questions = all(waves);
      const grounded = questions.filter(q => q.source?.type === 'lesson');
      expect(grounded).toHaveLength(questions.length);
      // Three written checks plus definitions of the terms they do not already test.
      expect(grounded.length).toBeGreaterThanOrEqual(4);
      expect(grounded.some(q => q.kind === 'buildChain')).toBe(false);
      expect(grounded.some(q => q.kind === 'multipleChoice' && q.prompt.startsWith('Only one of these matches'))).toBe(false);
      for (const q of grounded) {
        const text = JSON.stringify(q).toLowerCase();
        expect(text).toMatch(/cortex|limbic|hippocampus|brainstem|cerebellum|cerebrum|neurons/);
      }
      // The written hippocampus question asks that fact; no game repeats it.
      expect(questions.filter(q => q.kind === 'multipleChoice' && q.prompt.includes('defined') && q.options[q.correctIndex] === 'hippocampus')).toHaveLength(0);
      const keys = questions.flatMap(quizQuestionKeys);
      expect(new Set(keys).size).toBe(keys.length);
    }
  }, 20000);
  it('limits each kind to two per round and keeps lesson questions ahead of industry ones', () => {
    for (const round of buildArena(input)) {
      for (const kind of new Set(round.exercises.map(e => e.kind))) expect(round.exercises.filter(e => e.kind === kind).length).toBeLessThanOrEqual(2);
      const lastLesson = round.exercises.map(e => e.source?.type).lastIndexOf('lesson');
      const firstIndustry = round.exercises.map(e => e.source?.type).indexOf('industry');
      expect(firstIndustry === -1 || lastLesson < firstIndustry).toBe(true);
    }
  });
  it('preserves authored answers while shuffling options', () => {
    const question = lesson.questions.find(q => q.kind === 'multipleChoice');
    if (!question || question.kind !== 'multipleChoice') throw new Error('Missing authored question');
    for (let i = 0; i < 20; i++) {
      const q = shuffleAuthored(question);
      if (q.kind !== 'multipleChoice') throw new Error('Wrong kind');
      expect(q.options[q.correctIndex]).toBe('The hippocampus');
      expect(q.prompt).toBe(question.prompt);
    }
  });
  it('reviews earlier written checks first from Day 2 and plays the newest terms first', () => {
    const newer = { ...lesson, stackId: 'day2', day: 2, title: 'Day two', questions: lesson.questions.map(q => ({ ...q, prompt: 'Day two: ' + q.prompt })) };
    const waves = buildArena({ ...input, studied: [newer, lesson] });
    const written = all(waves).filter(q => q.source?.type === 'lesson' && 'prompt' in q && !q.prompt.startsWith('This lesson defined') && /Which|What share/.test(q.prompt));
    expect(written[0].source).toMatchObject({ day: 1 });
    const termGame = all(waves).find(q => q.kind === 'matchPairs' || q.kind === 'quickFire' || (q.kind === 'multipleChoice' && q.prompt.includes('defined')));
    expect(termGame?.source).toMatchObject({ title: expect.stringMatching(/Day two|Days 1 and 2/) });
  });
  it('never re-asks displayed Arena questions inside seven days, including authored questions', () => {
    const now = 1000000000;
    const seen = all(buildArena(input)).reduce((h, q) => recordQuizQuestion(h, q, now), [] as { key: string; seenAt: number }[]);
    const keys = new Set(recentQuizHistory(seen, now + QUIZ_WINDOW_MS - 1).map(row => row.key));
    const next = all(buildArena({ ...input, seenQuestionKeys: keys }));
    expect(next.flatMap(quizQuestionKeys).some(key => keys.has(key))).toBe(false);
    expect(recentQuizHistory(seen, now + QUIZ_WINDOW_MS)).toHaveLength(0);
  });
  it('deduplicates terms across authored exercises', () => {
    const result = studiedMaterial({ exercises: [...fixture.authored_lesson.exercises, fixture.authored_lesson.exercises[0]] });
    expect(result.questions.map(q => q.kind)).toEqual(['sortSignal', 'multipleChoice', 'numberSense']);
    expect(result.keyTerms.map(t => t.term)).toEqual(['cerebral cortex', 'hippocampus', 'brainstem']);
  });
  it('keeps the run at full length from the wider industry when lesson material runs out (from the 3rd lesson)', () => {
    // A starter learner (1–2 lessons) never gets industry fill, so an empty lesson gives no run.
    expect(buildArena({ ...input, studied: [{ title: 'Empty', day: 1, slides: [] }] })).toHaveLength(0);
    const waves = buildArena({ ...input, studied: [1, 2, 3].map(day => ({ title: `Empty ${day}`, day, slides: [] })) });
    expect(all(waves).length).toBeGreaterThanOrEqual(8);
    expect(all(waves).every(q => q.source?.type === 'industry')).toBe(true);
    const keys = all(waves).flatMap(quizQuestionKeys);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('keeps Deep Case on the authored lesson even when unrelated trainer scenarios exist', () => {
    const c = buildCase({ ...input, trainer: [{ id: 'unrelated', scenario: 'An unrelated industry decision', question: 'Which strategy?', options: ['A','B'], correct_answer: 0 }] as any });
    expect(c?.stages.map(s => s.exercise.source?.type)).toEqual(['lesson','lesson','lesson','lesson']);
    expect(c?.stages.at(-1)?.exercise).toMatchObject({ kind: 'multipleChoice', prompt: 'Which deep structure sends memories off to be stored and later retrieves them?' });
    expect(c?.proReasoning).toBeNull();
    expect(buildCase({ ...input, studied: [], trainer: [{ id: 'invalid', scenario: 'Empty options', question: 'No answer', options: [], correct_option_index: 0 }] as any })).toBeNull();
  });
  it('keeps every changed phone source pair identical after transpilation', () => {
    for (const [path, loader] of [['hooks/useStudiedLessons','ts'],['lib/quizHistory','ts'],['lesson-kit/practice/studiedMaterial','ts'],['lesson-kit/arena/buildArena','ts'],['lesson-kit/case/buildCase','ts'],['lesson-kit/glossary','ts'],['lesson-kit/arena/ArenaScreen','tsx'],['lesson-kit/case/CaseScreen','tsx']] as const) {
      const src = readFileSync(`mobile/${path}.${loader}`, 'utf8');
      expect(readFileSync(`mobile/${path}.js`, 'utf8')).toBe(transformSync(src, { loader, jsx: 'transform', format: 'esm', target: 'es2020' }).code);
    }
  });
});
