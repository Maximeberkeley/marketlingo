import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { beatSeconds, buildArena, readingWords, STARTER_LESSON_LIMIT } from '../mobile/lesson-kit/arena/buildArena';
import { studiedMaterial } from '../mobile/lesson-kit/practice/studiedMaterial';
import aerospace from './fixtures/aerospace-day1.json';

const lesson = { ...(aerospace as any), ...studiedMaterial((aerospace as any).authored_lesson) };
const drills = [
  { id: 'd1', statement: 'A verified true market fact.', is_true: true, explanation: 'Checked.' },
  { id: 'd2', statement: 'Another verified true market fact.', is_true: true, explanation: 'Checked.' },
  { id: 'd3', statement: 'A verified false market claim.', is_true: false, explanation: 'Checked.' },
];
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

describe('first-day Arena is a starter round', () => {
  it('uses only the lessons a new learner studied, and says so', () => {
    expect(STARTER_LESSON_LIMIT).toBe(2);
    for (let i = 0; i < 20; i++) {
      const waves = buildArena({ marketId: 'aerospace', marketName: 'Aerospace', trainer: [], drills, stats: [], studied: [lesson] });
      const questions = waves.flatMap(w => w.exercises);
      expect(questions.length).toBeGreaterThanOrEqual(4);
      expect(questions.every(q => q.source?.type === 'lesson')).toBe(true);
      expect(waves[0].covers).toBe(`Starter round · from ${lesson.title}`);
    }
  });

  it('shows the round summary before each round starts', () => {
    const screen = readFileSync('mobile/lesson-kit/arena/ArenaScreen.tsx', 'utf8');
    expect(screen).toContain('{!!wave.covers && <Text style={styles.waveCovers}>{wave.covers}</Text>}');
    expect(screen).toContain('return beatSeconds(wave, exercise);');
  });
});

describe('the clock gives long questions time to be read', () => {
  const mc = (n: number) => ({ kind: 'multipleChoice' as const, id: 'q', prompt: words(n), options: [], correctIndex: 0 });
  it('counts what the learner has to read', () => {
    expect(readingWords({ kind: 'multipleChoice', id: 'q', prompt: 'One two three', options: ['four five', 'six'], correctIndex: 0 })).toBe(6);
    expect(readingWords({ kind: 'spotFake', id: 's', prompt: 'Spot it', statements: ['a b c', 'd e'], fakeIndex: 0 })).toBe(7);
  });
  it('keeps the round clock for short questions and stretches long ones, up to 45 seconds', () => {
    expect(beatSeconds({ seconds: 15 }, mc(12))).toBe(15);
    expect(beatSeconds({ seconds: 15 }, mc(40))).toBe(19);
    expect(beatSeconds({ seconds: 20 }, mc(400))).toBe(45);
    expect(beatSeconds({ seconds: 15 }, { kind: 'buildChain', id: 'c', prompt: 'Order', steps: ['a', 'b', 'c'] })).toBe(25);
    expect(beatSeconds(undefined, null)).toBe(20);
  });
});
