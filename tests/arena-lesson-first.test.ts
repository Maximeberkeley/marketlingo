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
const input = { marketId: 'neuroscience', marketName: 'Neuroscience', trainer: [{ id: 'trainer', scenario: 'An unrelated research decision.', question: 'Which approach?', options: [{label:'A',isCorrect:true},{label:'B'}], correct_option_index:0 }], drills: [], stats: [], studied: [lesson] };
const all = (waves: ReturnType<typeof buildArena>) => waves.flatMap(w => w.exercises);

describe('lesson-first Arena', () => {
  it('uses at least 10 of 11 questions about the real Day 1 brain lesson across random runs', () => {
    for (let i = 0; i < 100; i++) {
      const waves = buildArena(input);
      expect(waves.map(w => w.exercises.length)).toEqual([4, 4, 3]);
      const questions = all(waves);
      const grounded = questions.filter(q => q.source?.type === 'lesson');
      expect(grounded.length).toBeGreaterThanOrEqual(10);
      for (const q of grounded) {
        const text = JSON.stringify(q).toLowerCase();
        expect(text).toMatch(/cortex|limbic|hippocampus|brainstem|cerebellum|cerebrum|neurons/);
      }
      expect(questions.filter(q => q.kind === 'multipleChoice' && q.prompt.includes('defined') && q.options[q.correctIndex] === 'hippocampus')).toHaveLength(0);
      const keys = questions.flatMap(quizQuestionKeys);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
  it('limits each kind to two and wider industry to one per round', () => {
    for (const round of buildArena(input)) {
      expect(round.exercises.filter(e => e.source?.type === 'industry').length).toBeLessThanOrEqual(1);
      for (const kind of new Set(round.exercises.map(e => e.kind))) expect(round.exercises.filter(e => e.kind === kind).length).toBeLessThanOrEqual(2);
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
  it('uses earlier authored questions first from Day 2 and newest terms first', () => {
    const newer = { ...lesson, stackId: 'day2', day: 2, title: 'Day two', questions: lesson.questions.map(q => ({ ...q, prompt: 'Day two: ' + q.prompt })) };
    const waves = buildArena({ ...input, studied: [newer, lesson] });
    expect(waves[0].exercises[0].source).toMatchObject({ day: 1 });
    expect(waves[0].exercises.find(q => q.kind === 'multipleChoice' && q.prompt.includes('defined'))?.source).toMatchObject({ day: 2 });
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
  it('does not fill exhausted lesson slots with multiple industry questions', () => {
    const waves = buildArena({ ...input, studied: [{ title: 'Empty', day: 1, slides: [] }] });
    for (const w of waves) expect(w.exercises.length).toBeLessThanOrEqual(1);
  });
  it('keeps Deep Case on the authored lesson even when unrelated trainer scenarios exist', () => {
    const c = buildCase({ ...input, trainer: [{ id: 'unrelated', scenario: 'An unrelated industry decision', question: 'Which strategy?', options: ['A','B'], correct_answer: 0 }] as any });
    expect(c?.stages.map(s => s.exercise.source?.type)).toEqual(['lesson','lesson','lesson','lesson']);
    expect(c?.stages.at(-1)?.exercise).toMatchObject({ kind: 'multipleChoice', prompt: 'Which deep structure sends memories off to be stored and later retrieves them?' });
    expect(c?.proReasoning).toBeNull();
  });
  it('keeps every changed phone source pair identical after transpilation', () => {
    for (const [path, loader] of [['hooks/useStudiedLessons','ts'],['lib/quizHistory','ts'],['lesson-kit/practice/studiedMaterial','ts'],['lesson-kit/arena/buildArena','ts'],['lesson-kit/case/buildCase','ts'],['lesson-kit/arena/ArenaScreen','tsx'],['lesson-kit/case/CaseScreen','tsx']] as const) {
      const src = readFileSync(`mobile/${path}.${loader}`, 'utf8');
      expect(readFileSync(`mobile/${path}.js`, 'utf8')).toBe(transformSync(src, { loader, jsx: 'transform', format: 'esm', target: 'es2020' }).code);
    }
  });
});
