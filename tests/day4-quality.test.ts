import { describe, expect, it } from 'vitest';
import { buildBeats, filterForGoal, lessonForGoal } from '../mobile/lesson-kit/sequencer/buildBeats';
import { buildArena } from '../mobile/lesson-kit/arena/buildArena';
import { quizQuestionKeys, recentQuizHistory, recordQuizQuestion, QUIZ_WINDOW_MS } from '../mobile/lib/quizHistory';
import { realLessonTitle, lessonDayLabel } from '../mobile/lib/lessonIdentity';

const rule = 'The buyer signs the contract, while the user works with the product.';
const slides = [{ slideNumber: 1, title: 'Buyer ≠ User', body: `${rule} Ask the buyer about budgets and the user about daily work.` }];

describe('Day-4 lesson quality', () => {
  it('keeps lessons without written questions reading-only, preserving the takeaway', () => {
    const { lesson } = buildBeats('Buyer ≠ User', slides, { key_takeaway: rule }, { learningGoal: 'join_industry' });
    expect(lesson.exercises.some(e => e.kind === 'multipleChoice')).toBe(false);
    expect(lesson.exercises.some(e => e.kind === 'microInsight' && e.text === rule)).toBe(true);
    expect(buildBeats('Buyer ≠ User', slides).lesson.exercises.some(e => e.kind === 'multipleChoice')).toBe(false);
    const numeric = Array.from({ length: 5 }, (_, i) => ({ slideNumber: i + 1, title: 'Orders', body: `There are ${100 + i} aircraft on order. Deliveries take ${20 + i} months.` }));
    expect(buildBeats('Orders', numeric).lesson.exercises.every(e => ['microInsight', 'coldOpen'].includes(e.kind))).toBe(true);
  });

  it('keeps startup copy for builders and rewrites it in generated and authored lessons for other goals', () => {
    const text = "For your startup: This is your startup superpower. Build your network from day one. Startups don’t own the supply chain.";
    expect(filterForGoal(text, 'build_startup')).toBe(text);
    for (const goal of ['curiosity', 'join_industry', 'invest']) {
      expect(filterForGoal(text, goal)).not.toMatch(/startup superpower|build your|from day one|startups don['’]t/i);
      const lesson = lessonForGoal({ id: 'startup-id', title: 'Demo', exercises: [{ kind: 'multipleChoice', id: 'check', prompt: text, options: [text, 'Other', 'Third'], correctIndex: 0 }] }, goal);
      expect(lesson.id).toBe('startup-id');
      const check = lesson.exercises[0];
      if (check.kind !== 'multipleChoice') throw new Error('Wrong kind');
      expect(check.correctIndex).toBe(0);
      expect(check.prompt).not.toContain('superpower');
    }
  });

  it('uses authored or generated titles and labels only unfinished catch-up days', () => {
    expect(realLessonTitle({ title: 'Section name', authored_lesson: { title: 'Buyer ≠ User', exercises: [{}] } })).toBe('Buyer ≠ User');
    expect(realLessonTitle({ title: 'Generated title' })).toBe('Generated title');
    expect(lessonDayLabel(4, 8, false)).toBe('Catch up: Day 4');
    expect(lessonDayLabel(4, 8, true)).toBe('DAY 4');
    expect(lessonDayLabel(4, 4, false)).toBe('DAY 4');
  });

  it('ignores shuffled options, positional IDs and randomized slider ranges', () => {
    expect(quizQuestionKeys({ kind: 'multipleChoice', id: 'one', prompt: 'A question?', options: ['A', 'B', 'C'], correctIndex: 0 }))
      .toEqual(quizQuestionKeys({ kind: 'multipleChoice', id: 'two', prompt: 'A question?', options: ['C', 'B', 'A'], correctIndex: 2 }));
    expect(quizQuestionKeys({ kind: 'numberSense', id: 'one', prompt: 'Revenue', min: 0, max: 500, value: 100 }))
      .toEqual(quizQuestionKeys({ kind: 'numberSense', id: 'two', prompt: 'Revenue', min: 20, max: 800, value: 100 }));
  });

  it('expires history after seven days and never bypasses it when a quiz pool is exhausted', () => {
    const question = { kind: 'multipleChoice' as const, id: 'q', prompt: 'A question?', options: ['A', 'B', 'C'], correctIndex: 0 };
    const history = recordQuizQuestion([], question, 1000000000);
    expect(recentQuizHistory(history, 1000000000 + QUIZ_WINDOW_MS - 1)).toHaveLength(1);
    expect(recentQuizHistory(history, 1000000000 + QUIZ_WINDOW_MS)).toHaveLength(0);
    const seen = new Set<string>();
    const input = { marketId: 'aerospace', trainer: [], drills: [], stats: [], studied: [{ title: 'Buyer ≠ User', slides }] };
    for (let run = 0; run < 30; run += 1) {
      for (const wave of buildArena({ ...input, seenQuestionKeys: seen })) {
        for (const exercise of wave.exercises) for (const key of quizQuestionKeys(exercise)) {
          expect(seen.has(key)).toBe(false);
          seen.add(key);
        }
      }
    }
    expect(seen.size).toBeGreaterThan(0);
    expect(buildArena({ ...input, seenQuestionKeys: seen })).toHaveLength(0);
  });
});