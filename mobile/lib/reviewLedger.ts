/**
 * "Worth another look": the questions a learner missed come back on the same
 * spaced ladder the Arena uses for lessons (1, 3, 7, 14 and 30 days).
 *
 * A miss enters the ledger at stage 1, due tomorrow. Answering it right moves it
 * one stage up the ladder; missing it again sends it back to stage 1; after stage 5
 * it graduates and leaves the list. Answered entries are no longer due, so the
 * flat review reward cannot be farmed.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Exercise } from '../lesson-kit/types';
import type { ArenaWave } from '../lesson-kit/arena/buildArena';
import { REVIEW_GAPS } from '../lesson-kit/arena/buildArena';
import { quizQuestionKeys } from './quizHistory';
import { localDateString, parseLocalDate } from './dayMath';

export const REVIEW_XP = 10;
/** Questions one review round asks. */
export const REVIEW_ROUND_LIMIT = 5;
/** Entries kept per learner and market; the oldest due go first when full. */
export const LEDGER_LIMIT = 60;
export const STAGES = REVIEW_GAPS.length;

export interface ReviewEntry {
  key: string;
  exercise: Exercise;
  title: string;
  day: number | null;
  /** 0 to STAGES - 1; the pips lit are stage + 1. */
  stage: number;
  /** 'YYYY-MM-DD' local date the entry is next due. */
  due: string;
  /** 'YYYY-MM-DD' local date it was last missed. */
  missed: string;
}

export const ledgerStorageKey = (userId: string, marketId: string) => `ml_review_v1/${userId}/${marketId}`;

export function addDays(date: string, days: number): string {
  const d = parseLocalDate(date);
  d.setDate(d.getDate() + days);
  return localDateString(d);
}

/** Whole days from one local date to another. */
export function daysBetween(from: string, to: string): number {
  const a = parseLocalDate(from);
  const b = parseLocalDate(to);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

const entryKey = (exercise: Exercise): string => quizQuestionKeys(exercise)[0] || exercise.id;

/** Only questions that can be asked again whole: not the passive kinds, no multi-card games. */
export function isReviewable(exercise: Exercise): boolean {
  return exercise.kind === 'multipleChoice' || exercise.kind === 'theCall' || exercise.kind === 'numberSense'
    || exercise.kind === 'faceOff' || exercise.kind === 'spotFake' || exercise.kind === 'buildChain' || exercise.kind === 'mapMarket';
}

export function parseLedger(raw: unknown): ReviewEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((row): row is ReviewEntry => Boolean(row && typeof row.key === 'string' && row.exercise
    && typeof row.due === 'string' && typeof row.stage === 'number' && typeof row.missed === 'string'));
}

/** Files misses: a new one starts at stage 1 due tomorrow, a repeat miss starts over. */
export function recordMisses(entries: ReviewEntry[], missed: Exercise[], today: string): ReviewEntry[] {
  let next = [...entries];
  for (const exercise of missed) {
    if (!isReviewable(exercise)) continue;
    const key = entryKey(exercise);
    const source = exercise.source?.type === 'lesson' ? exercise.source : null;
    const entry: ReviewEntry = {
      key,
      exercise: { ...exercise, id: `rv-${key.slice(0, 40)}` },
      title: source?.title || 'From the industry',
      day: typeof source?.day === 'number' ? source.day : null,
      stage: 0,
      due: addDays(today, REVIEW_GAPS[0]),
      missed: today,
    };
    next = [...next.filter(row => row.key !== key), entry];
  }
  if (next.length > LEDGER_LIMIT) next = next.sort((a, b) => b.due.localeCompare(a.due)).slice(0, LEDGER_LIMIT);
  return next;
}

/** Entries due on or before today, oldest due first, then the earliest stage. */
export function dueEntries(entries: ReviewEntry[], today: string): ReviewEntry[] {
  return entries.filter(row => row.due <= today)
    .sort((a, b) => a.due.localeCompare(b.due) || a.stage - b.stage);
}

/** The next date anything is due after today, or null when nothing is waiting. */
export function nextDue(entries: ReviewEntry[], today: string): string | null {
  const later = entries.filter(row => row.due > today).map(row => row.due).sort();
  return later[0] ?? null;
}

/** Moves each reviewed entry along the ladder by what the learner answered. */
export function applyReview(entries: ReviewEntry[], results: Record<string, boolean>, today: string): ReviewEntry[] {
  const out: ReviewEntry[] = [];
  for (const row of entries) {
    if (!(row.key in results)) { out.push(row); continue; }
    if (!results[row.key]) {
      out.push({ ...row, stage: 0, due: addDays(today, REVIEW_GAPS[0]), missed: today });
    } else if (row.stage + 1 < STAGES) {
      const stage = row.stage + 1;
      out.push({ ...row, stage, due: addDays(today, REVIEW_GAPS[stage]) });
    }
    // Right at the last stage: graduated, so it leaves the ledger.
  }
  return out;
}

/** "Day 12 · missed yesterday", "Day 4 · due today", "Day 7 · 2 days late". */
export function dueMeta(entry: ReviewEntry, today: string): string {
  const late = daysBetween(entry.due, today);
  const since = daysBetween(entry.missed, today);
  const day = entry.day !== null ? `Day ${entry.day}` : 'Industry';
  const when = entry.stage === 0 && since === 1 ? 'missed yesterday'
    : late > 1 ? `${late} days late`
    : 'due today';
  return `${day} · ${when}`;
}

/** One review round from the due entries; ids map back to ledger keys. */
export function reviewWave(due: ExerciseSource[], limit = REVIEW_ROUND_LIMIT): { wave: ArenaWave; keys: Record<string, string> } | null {
  const picked = due.slice(0, limit);
  if (!picked.length) return null;
  const keys: Record<string, string> = {};
  const exercises = picked.map((entry, i) => {
    const id = `review-${i}`;
    keys[id] = entry.key;
    return { ...entry.exercise, id } as Exercise;
  });
  return {
    wave: {
      key: 'review',
      name: 'Worth another look',
      tagline: 'Questions that got away. Answer them now and they come back less often.',
      seconds: 30,
      multiplier: 1,
      exercises,
      covers: 'From lessons you studied.',
    },
    keys,
  };
}
type ExerciseSource = ReviewEntry;

export async function loadLedger(userId: string, marketId: string): Promise<ReviewEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(ledgerStorageKey(userId, marketId));
    return parseLedger(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

export async function saveLedger(userId: string, marketId: string, entries: ReviewEntry[]): Promise<void> {
  await AsyncStorage.setItem(ledgerStorageKey(userId, marketId), JSON.stringify(entries));
}
