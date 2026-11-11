import { describe, it, expect, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: vi.fn(), setItem: vi.fn() } }));

import { practiceCards, practiceOrder } from '../mobile/lib/practiceCards';
import {
  addDays, applyReview, dueEntries, dueMeta, recordMisses, reviewWave, nextDue, REVIEW_XP, STAGES,
} from '../mobile/lib/reviewLedger';
import type { Exercise } from '../mobile/lesson-kit/types';

const mc = (id: string, prompt: string, day = 12): Exercise => ({
  kind: 'multipleChoice', id, prompt, options: ['A', 'B', 'C'], correctIndex: 1,
  source: { type: 'lesson', day, title: 'Powered-lift rules' },
});

describe('review ledger', () => {
  it('files a miss at stage 1, due tomorrow, and starts a repeat miss over', () => {
    const a = recordMisses([], [mc('x', 'Which rule applies?')], '2026-11-10');
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ stage: 0, due: '2026-11-11', day: 12, title: 'Powered-lift rules' });
    const moved = applyReview(a, { [a[0].key]: true }, '2026-11-11');
    const again = recordMisses(moved, [mc('y', 'Which rule applies?')], '2026-11-12');
    expect(again).toHaveLength(1);
    expect(again[0].stage).toBe(0);
  });

  it('is due only on or after its date, and says so', () => {
    const [e] = recordMisses([], [mc('x', 'Q one')], '2026-11-10');
    expect(dueEntries([e], '2026-11-10')).toHaveLength(0);
    expect(dueEntries([e], '2026-11-11')).toHaveLength(1);
    expect(dueMeta(e, '2026-11-11')).toBe('Day 12 · missed yesterday');
    expect(dueMeta(e, '2026-11-14')).toBe('Day 12 · 3 days late');
    expect(nextDue([e], '2026-11-10')).toBe('2026-11-11');
  });

  it('climbs the ladder on right answers, graduates after the last, resets on a miss', () => {
    let rows = recordMisses([], [mc('x', 'Q two')], '2026-01-01');
    const key = rows[0].key;
    const gaps = [3, 7, 14, 30];
    let today = '2026-01-02';
    gaps.forEach((gap, i) => {
      rows = applyReview(rows, { [key]: true }, today);
      expect(rows[0].stage).toBe(i + 1);
      expect(rows[0].due).toBe(addDays(today, gap));
      today = rows[0].due;
    });
    const missed = applyReview(rows, { [key]: false }, today);
    expect(missed[0]).toMatchObject({ stage: 0, due: addDays(today, 1) });
    expect(applyReview(rows, { [key]: true }, today)).toHaveLength(0);
    expect(STAGES).toBe(5);
  });

  it('cannot be farmed: answered entries are no longer due', () => {
    const rows = recordMisses([], [mc('a', 'Q three'), mc('b', 'Q four')], '2026-11-10');
    const due = dueEntries(rows, '2026-11-11');
    const after = applyReview(rows, Object.fromEntries(due.map(r => [r.key, true])), '2026-11-11');
    expect(dueEntries(after, '2026-11-11')).toHaveLength(0);
    expect(REVIEW_XP).toBe(10);
  });

  it('builds one round of at most five questions and maps ids back', () => {
    const rows = recordMisses([], Array.from({ length: 8 }, (_, i) => mc(`q${i}`, `Question number ${i}`)), '2026-11-10');
    const round = reviewWave(dueEntries(rows, '2026-11-11'))!;
    expect(round.wave.exercises).toHaveLength(5);
    for (const ex of round.wave.exercises) expect(rows.some(r => r.key === round.keys[ex.id])).toBe(true);
    expect(reviewWave([])).toBeNull();
  });
});

describe('practice cards', () => {
  const base = { goal: 'career', lessonsStudied: 3, gamesCompleted: 1, drillsCompleted: 1, mocks: [{ score: 78 }, { score: 60 }] };
  it('leads with the interview for careers and the lab for investors', () => {
    expect(practiceOrder('career')[0]).toBe('interview');
    expect(practiceOrder('invest')[0]).toBe('investment');
    expect(practiceOrder(null)).not.toContain('investment');
  });
  it('shows where the learner stands', () => {
    const [interview, kase, arena] = practiceCards(base);
    expect(interview.state.bold).toBe('78 / 100');
    expect(interview.button).toBe('Start a new mock');
    expect(kase.title).toBe('Case 2 of 3 today');
    expect(kase.button).toBe('Start case 2');
    expect(arena.done).toBe(true);
    expect(arena.button).toBe('Play again');
  });
  it('locks cases and the Arena before the first lesson but never the interview', () => {
    const [interview, kase, arena] = practiceCards({ ...base, lessonsStudied: 0, mocks: [], gamesCompleted: 0, drillsCompleted: 0 });
    expect(interview.locked).toBe(false);
    expect(interview.button).toBe('Start your first mock');
    expect(kase.locked && arena.locked).toBe(true);
    expect(kase.button).toBeNull();
  });
  it('ends the cases at the daily quota', () => {
    const kase = practiceCards({ ...base, gamesCompleted: 3 }).find(c => c.id === 'deep-case')!;
    expect(kase.done).toBe(true);
    expect(kase.button).toBeNull();
  });
});

describe('filing misses from every session', () => {
  it('stamps lesson beats with their lesson so the card reads "Day N"', async () => {
    const { withLessonSource, recordMisses: record } = await import('../mobile/lib/reviewLedger');
    const bare: Exercise = { kind: 'multipleChoice', id: 'b1', prompt: 'Which one is it?', options: ['A', 'B'], correctIndex: 0 };
    const [stamped] = withLessonSource([bare], { day: 5, title: 'Airworthiness basics' });
    const [entry] = record([], [stamped], '2026-11-10');
    expect(entry).toMatchObject({ day: 5, title: 'Airworthiness basics' });
    const [kept] = withLessonSource([mc('k', 'Kept source?', 3)], { day: 9, title: 'Other' });
    expect(kept.source).toMatchObject({ day: 3 });
  });

  it('fileMisses stores them and never throws when storage fails', async () => {
    const { fileMisses, loadLedger } = await import('../mobile/lib/reviewLedger');
    // AsyncStorage's web build reads window.localStorage.
    const store = new Map<string, string>();
    let broken = false;
    (globalThis as any).window = { localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { if (broken) throw new Error('full'); store.set(k, v); },
    } };
    await fileMisses('u1', 'aerospace', [mc('z', 'Filed question?')], '2026-11-10');
    expect(await loadLedger('u1', 'aerospace')).toHaveLength(1);
    broken = true;
    await expect(fileMisses('u1', 'aerospace', [mc('y', 'Another one?')], '2026-11-10')).resolves.toBeUndefined();
    await expect(fileMisses(undefined, 'aerospace', [mc('y', 'x')])).resolves.toBeUndefined();
  });

  it('is wired from the Arena, daily lessons and Deep Cases', async () => {
    const { readFileSync } = await import('node:fs');
    const read = (p: string) => readFileSync(p, 'utf8');
    expect(read('mobile/app/arena.tsx')).toContain('fileMisses(user?.id, marketId, result.missed');
    expect(read('mobile/app/deep-case.tsx')).toContain('fileMisses(user?.id, marketId, result.missed');
    expect(read('mobile/components/slides/LessonKitReader.tsx')).toContain('withLessonSource(missed');
    expect(read('mobile/lesson-kit/screens/LessonScreen.tsx')).toContain('missed: missed.filter');
    expect(read('mobile/lesson-kit/case/CaseScreen.tsx')).toContain('missed: missedStages.current');
  });
});
