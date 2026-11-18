/**
 * How a lesson scores an answer. A lesson is for learning, not an exam (Max, Nov 18):
 * - multi-step exercises (sort, chain, match) earn credit for the steps right first time, so fixing a slip and
 *   finishing still counts;
 * - single-answer questions get a second try before the answer is shown, worth half;
 * - a magnitude guess (number sense) is never a miss: close guesses earn credit, far ones just learn the number.
 * Only the Arena, Deep Case and drills keep strict right-or-wrong scoring; they do not use this.
 */
import type { ExerciseState } from '../exercises/types';

/** Single-answer kinds that get a second try (the first pick is not revealed). */
export const SECOND_TRY_KINDS = ['multipleChoice', 'spotFake', 'faceOff', 'theCall', 'chartRead', 'mapMarket', 'wordBank'];
/** Kinds where the learner is guessing something they could not know exactly. */
export const GUESS_KINDS = ['numberSense'];
/** Credit for trying a guess, however far off. */
export const GUESS_FLOOR = 0.25;

/** Share of steps done right first time: every step placed once, each slip is one extra try. */
export const stepScore = (steps: number, slips: number): number =>
  steps <= 0 ? 1 : steps / (steps + Math.max(0, slips));

/** Credit for a magnitude guess: full inside the tolerance, partial when close, none when far. */
export function closeness(off: number, tolerance: number): number {
  if (off <= tolerance) return 1;
  if (off <= tolerance * 2) return 0.5;
  return 0;
}

export type OutcomeKind = 'right' | 'partial' | 'retry' | 'learned' | 'missed';
export interface Outcome {
  kind: OutcomeKind;
  /** 0..1 share of this question's XP. */
  credit: number;
  title: string;
  note?: string;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** What one Check press means in a lesson. `attempt` is 0 for the first try, 1 for the second. */
export function lessonOutcome(kind: string, state: ExerciseState, attempt = 0): Outcome {
  const base = Math.max(0, Math.min(1, state.score ?? (state.isCorrect ? 1 : 0)));

  if (attempt > 0) {
    return base >= 1
      ? { kind: 'partial', credit: 0.5, title: 'Got it on the second try', note: 'That still counts.' }
      : { kind: 'missed', credit: 0, title: "Here's the answer", note: 'It comes back tomorrow so it sticks.' };
  }
  if (base >= 1) return { kind: 'right', credit: 1, title: 'Correct' };

  if (GUESS_KINDS.includes(kind)) {
    return base > 0
      ? { kind: 'partial', credit: Math.max(base, GUESS_FLOOR), title: 'Close' }
      : { kind: 'learned', credit: GUESS_FLOOR, title: 'Now you know', note: 'It was a guess, so it does not count against you.' };
  }
  if (base > 0) {
    const note = typeof state.slips === 'number' && state.slips > 0 ? `${plural(state.slips, 'slip')} on the way.` : undefined;
    return { kind: 'partial', credit: base, title: 'Got there', note };
  }
  if (SECOND_TRY_KINDS.includes(kind)) {
    return { kind: 'retry', credit: 0, title: 'Not yet', note: 'Have another go. A second try still earns XP.' };
  }
  return { kind: 'missed', credit: 0, title: "Here's the answer", note: 'It comes back tomorrow so it sticks.' };
}

/** XP for one answer: the per-question XP times its credit, at least 1 when there was any credit. */
export const creditXp = (xpPerCorrect: number, credit: number): number =>
  credit <= 0 ? 0 : Math.max(1, Math.round(xpPerCorrect * credit));
