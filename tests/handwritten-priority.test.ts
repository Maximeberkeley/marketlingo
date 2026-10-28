import { describe, it, expect } from 'vitest';
import { lessonPriority } from '../mobile/lib/handwritten';
const g = 'goal:invest';
describe('hand-written lesson priority', () => {
  it('hand-written beats a goal-matched legacy stack on Days 1-30', () => {
    expect(lessonPriority(['handwritten-v1'], g, 3)).toBeGreaterThan(lessonPriority([g], g, 3));
    expect(lessonPriority(['handwritten-v1'], g, 12)).toBeGreaterThan(lessonPriority([g], g, 12));
    expect(lessonPriority(['handwritten-v1'], g, 30)).toBeGreaterThan(lessonPriority([g], g, 30));
  });
  it('goal-matched hand-written beats other-goal hand-written', () => {
    expect(lessonPriority(['handwritten-v1', g], g, 5)).toBeGreaterThan(lessonPriority(['handwritten-v1', 'goal:career'], g, 5));
  });
  it('the tag gives no priority after Day 30', () => {
    expect(lessonPriority(['handwritten-v1'], g, 31)).toBe(0);
  });
});
