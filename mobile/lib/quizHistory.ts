import type { Exercise } from '../lesson-kit/types';

export type QuizSeen = { key: string; seenAt: number };
export const QUIZ_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const normalize = (text: string) => text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** Content identity ignores shuffled options and positional exercise IDs. */
export function quizQuestionKeys(exercise: Exercise): string[] {
  if (exercise.kind === 'speedRound') return exercise.rounds.map(round =>
    normalize(`${round.question} ${round.options[round.correctIndex] || ''}`));
  if (exercise.kind === 'multipleChoice') return [normalize(`${exercise.prompt} ${exercise.options[exercise.correctIndex] || ''}`)];
  if (exercise.kind === 'spotFake') return [normalize(exercise.explanation || [...exercise.statements].sort().join(' '))];
  if (exercise.kind === 'buildChain') return [normalize(exercise.steps.join(' '))];
  const e = exercise as unknown as Record<string, unknown>;
  return [normalize(JSON.stringify(Object.fromEntries(Object.entries(e)
    .filter(([key]) => !['id', 'leo', 'explanation'].includes(key)).sort(([a], [b]) => a.localeCompare(b)))))];
}

export function recentQuizHistory(value: unknown, now = Date.now()): QuizSeen[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is QuizSeen => Boolean(row && typeof row.key === 'string' &&
    typeof row.seenAt === 'number' && row.seenAt > now - QUIZ_WINDOW_MS));
}

export function recordQuizQuestion(history: QuizSeen[], exercise: Exercise, now = Date.now()): QuizSeen[] {
  const keys = new Set(quizQuestionKeys(exercise));
  return [...recentQuizHistory(history, now).filter(row => !keys.has(row.key)),
    ...Array.from(keys, key => ({ key, seenAt: now }))];
}