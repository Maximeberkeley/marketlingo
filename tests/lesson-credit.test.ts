import { describe, it, expect } from 'vitest';
import { closeness, creditXp, lessonOutcome, stepScore } from '../mobile/lesson-kit/screens/lessonCredit';
import { lessonRewards, scoreHeadline } from '../mobile/lesson-kit/screens/lessonRewards';

describe('lesson credit: learning, not an exam', () => {
  it('gives multi-step exercises credit for the steps right first time', () => {
    expect(stepScore(4, 0)).toBe(1);
    expect(stepScore(4, 1)).toBeCloseTo(0.8);
    const o = lessonOutcome('sortSignal', { canCheck: true, isCorrect: false, score: stepScore(4, 2), slips: 2 });
    expect(o.kind).toBe('partial');
    expect(o.title).toBe('Got there');
    expect(o.note).toBe('2 slips on the way.');
    expect(o.credit).toBeCloseTo(2 / 3);
  });
  it('gives single-answer questions a hidden second try worth half', () => {
    const first = lessonOutcome('multipleChoice', { canCheck: true, isCorrect: false });
    expect(first.kind).toBe('retry');
    expect(lessonOutcome('multipleChoice', { canCheck: true, isCorrect: true }, 1)).toMatchObject({ kind: 'partial', credit: 0.5 });
    expect(lessonOutcome('multipleChoice', { canCheck: true, isCorrect: false }, 1)).toMatchObject({ kind: 'missed', credit: 0, title: "Here's the answer" });
    expect(lessonOutcome('theCall', { canCheck: true, isCorrect: true })).toMatchObject({ kind: 'right', credit: 1 });
  });
  it('never counts a magnitude guess as a miss', () => {
    expect(closeness(0.1, 0.12)).toBe(1);
    expect(closeness(0.2, 0.12)).toBe(0.5);
    expect(closeness(0.9, 0.12)).toBe(0);
    expect(lessonOutcome('numberSense', { canCheck: true, isCorrect: false, score: 0.5 })).toMatchObject({ kind: 'partial', title: 'Close' });
    const far = lessonOutcome('numberSense', { canCheck: true, isCorrect: false, score: 0 });
    expect(far.kind).toBe('learned');
    expect(far.credit).toBeGreaterThan(0);
  });
  it('pays XP in proportion, never zero for any credit', () => {
    expect(creditXp(10, 1)).toBe(10);
    expect(creditXp(10, 0.5)).toBe(5);
    expect(creditXp(10, 0.01)).toBe(1);
    expect(creditXp(10, 0)).toBe(0);
  });
  it('keeps the end screen kind', () => {
    expect(scoreHeadline(33, 3)).toBe('Lesson complete');
    expect(scoreHeadline(70, 3)).toBe('Nicely done');
    expect(scoreHeadline(100, 3)).toBe('Nailed it');
    expect(lessonRewards(20, 100, 3, 0, undefined, 400)[1]).toEqual({ label: 'Answers', xp: 20 });
  });
});
