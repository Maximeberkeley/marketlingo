import { describe, it, expect } from 'vitest';
import { lessonPriority } from '../mobile/lib/handwritten';
const g = 'goal:invest';
describe('hand-written lesson priority', () => {
  it('hand-written beats a goal-matched legacy stack on Days 1-5', () => {
    expect(lessonPriority(['handwritten-v1'], g, 3)).toBeGreaterThan(lessonPriority([g], g, 3));
  });
  it('goal-matched hand-written beats other-goal hand-written', () => {
    expect(lessonPriority(['handwritten-v1', g], g, 5)).toBeGreaterThan(lessonPriority(['handwritten-v1', 'goal:career'], g, 5));
  });
  it('the tag gives no priority after Day 5', () => {
    expect(lessonPriority(['handwritten-v1'], g, 6)).toBe(0);
  });
});
