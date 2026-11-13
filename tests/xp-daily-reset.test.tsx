import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserXP } from '../mobile/hooks/useUserXP';

const db = vi.hoisted(() => ({
  user: { id: 'max' },
  day: '2026-11-12',
  completion: null as any,
  error: null as any,
  writes: [] as any[],
}));
vi.mock('../mobile/hooks/useAuth', () => ({ useAuth: () => ({ user: db.user }) }));
vi.mock('../mobile/lib/dayMath', () => ({ localDateString: () => db.day }));
vi.mock('../mobile/lib/logger', () => ({ log: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('../mobile/lib/leoNudges', () => ({ cancelRollingLeoNudges: vi.fn() }));
vi.mock('../mobile/lib/progressEvents', () => ({ emitXP: vi.fn(), onXP: () => () => {} }));
vi.mock('../mobile/lib/xpSource', () => ({ transactionSource: () => ({}) }));
vi.mock('../mobile/lib/boosts', () => ({ boostedAmount: (amount: number) => amount }));
vi.mock('../mobile/hooks/useShop', () => ({ doubleXpUntil: () => null }));
vi.mock('../mobile/lib/supabase', () => ({ supabase: {
  rpc: async () => ({ data: { user_id: 'max', market_id: 'aerospace', total_xp: 11965 }, error: null }),
  from: (table: string) => {
    let write: any;
    const query: any = {
      select: () => query, eq: () => query,
      insert: () => Promise.resolve({ error: null }),
      upsert: (row: any) => { write = row; db.writes.push(row); return query; },
      single: async () => ({ data: write, error: null }),
      maybeSingle: async () => table === 'user_xp'
        ? { data: { user_id: 'max', market_id: 'aerospace', total_xp: 11940 }, error: null }
        : { data: db.completion, error: db.error },
    };
    return query;
  },
} }));

const completed = () => ({ user_id: 'max', market_id: 'aerospace',
  completion_date: '2026-11-12', lesson_completed: true, completed_stack_id: 'day-5',
  games_completed: 2, drills_completed: 1, xp_earned: 240 });
const cleanups: (() => void)[] = [];
function renderHook<T>(hook: () => T) {
  const root = createRoot(document.createElement('div'));
  const result = {} as { current: T };
  function Probe() { result.current = hook(); return null; }
  act(() => root.render(<Probe />));
  cleanups.push(() => act(() => root.unmount()));
  return { result };
}
async function waitFor(assert: () => void) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    try { assert(); return; } catch (error) { if (attempt === 19) throw error; }
  }
}
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  db.day = '2026-11-12'; db.completion = completed(); db.error = null; db.writes = [];
});
afterEach(() => cleanups.splice(0).forEach(cleanup => cleanup()));

describe('XP daily reset', () => {
  it('does not carry yesterday’s lesson, practice counts or XP into a new-day quest reward', async () => {
    const { result } = renderHook(() => useUserXP('aerospace'));
    await waitFor(() => expect(result.current.completionReady).toBe(true));
    expect(result.current.isLessonCompletedToday()).toBe(true);
    db.day = '2026-11-13';
    db.completion = null;
    expect(result.current.isLessonCompletedToday()).toBe(false);
    await act(async () => { await result.current.addXP(25, 'quest'); });
    expect(db.writes).toEqual([{ user_id: 'max', market_id: 'aerospace', completion_date: '2026-11-13',
      lesson_completed: false, completed_stack_id: null, games_completed: 0, drills_completed: 0, xp_earned: 25 }]);
    expect(result.current.isLessonCompletedToday()).toBe(false);
  });

  it('preserves a real same-day lesson and adds only the new reward', async () => {
    const { result } = renderHook(() => useUserXP('aerospace'));
    await waitFor(() => expect(result.current.completionReady).toBe(true));
    await act(async () => { await result.current.addXP(25, 'quest'); });
    expect(db.writes[0]).toMatchObject({ lesson_completed: true, completed_stack_id: 'day-5',
      games_completed: 2, drills_completed: 1, xp_earned: 265 });
  });

  it('never overwrites daily lesson credit when the fresh daily read fails', async () => {
    const { result } = renderHook(() => useUserXP('aerospace'));
    await waitFor(() => expect(result.current.completionReady).toBe(true));
    db.error = { code: 'NETWORK', message: 'Unavailable' };
    await act(async () => { await result.current.addXP(25, 'quest'); });
    expect(db.writes).toEqual([]);
  });
});