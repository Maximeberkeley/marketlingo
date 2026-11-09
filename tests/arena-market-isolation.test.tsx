import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildArena } from '../mobile/lesson-kit/arena/buildArena';
import { useIndustryContent } from '../mobile/hooks/useIndustryContent';

const db = vi.hoisted(() => ({ pending: [] as { table: string; market: string; resolve: (value: any) => void }[] }));
vi.mock('../mobile/lib/supabase', () => ({ supabase: {
  from: (table: string) => {
    let market = '';
    const query: any = {
      select: () => query, contains: () => query, limit: () => query,
      eq: (key: string, value: string) => { if (key === 'market_id') market = value; return query; },
      then: (resolve: (value: any) => void) => new Promise(done => {
        db.pending.push({ table, market, resolve: value => done(value) });
      }).then(resolve),
    };
    return query;
  },
} }));
vi.mock('../mobile/lib/logger', () => ({ log: { error: vi.fn() } }));

const drill = (market: string) => ({ id: market, market_id: market,
  statement: market === 'aerospace'
    ? 'Spirit AeroSystems is classified as a Tier 3 supplier, providing components to Tier 2 companies.'
    : 'The hippocampus helps form new memories in the human brain.',
  is_true: false, explanation: 'Verified source.' });
const stat = (market: string) => ({ id: market, market_id: market, metric_key: 'fuel',
  label: 'Share of airline operating cost that is fuel', value: 30, unit: '%',
  min_value: 0, max_value: 100, period_label: '2024', trend: 'up' as const,
  trend_note: null, insight: null, source_name: 'Source', is_approximate: true });
function finish(market: string, mixed = false) {
  const requests = db.pending.filter(q => q.market === market);
  db.pending = db.pending.filter(q => q.market !== market);
  for (const q of requests) q.resolve({ data: q.table === 'drill_questions'
    ? [drill(market), ...(mixed ? [drill('aerospace')] : [])] : [], error: null });
}
const cleanups: (() => void)[] = [];
function renderHook<P, T>(hook: (props: P) => T, options: { initialProps: P }) {
  const host = document.createElement('div');
  const root = createRoot(host);
  const result = {} as { current: T };
  function Probe({ props }: { props: P }) { result.current = hook(props); return null; }
  const rerender = (props: P) => act(() => root.render(<Probe props={props} />));
  rerender(options.initialProps);
  cleanups.push(() => act(() => root.unmount()));
  return { result, rerender };
}
async function waitFor(assert: () => void) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    try { assert(); return; } catch (error) { if (attempt === 19) throw error; }
  }
}
beforeEach(() => { db.pending = []; (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; });
afterEach(() => { cleanups.splice(0).forEach(cleanup => cleanup()); });

describe('Arena industry isolation', () => {
  it('hides Aerospace immediately when Neuroscience is selected', async () => {
    const { result, rerender } = renderHook(({ market }) => useIndustryContent(market), { initialProps: { market: 'aerospace' } });
    await waitFor(() => expect(db.pending).toHaveLength(3));
    await act(async () => finish('aerospace'));
    expect(result.current.drills[0]?.market_id).toBe('aerospace');
    rerender({ market: 'neuroscience' });
    expect(result.current.drills).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(db.pending).toHaveLength(3));
    await act(async () => finish('neuroscience', true));
    expect(result.current.drills.map(q => q.market_id)).toEqual(['neuroscience']);
    expect(result.current.isLoading).toBe(false);
  });

  it('ignores an Aerospace response arriving after Neuroscience finished loading', async () => {
    const { result, rerender } = renderHook(({ market }) => useIndustryContent(market), { initialProps: { market: 'aerospace' } });
    await waitFor(() => expect(db.pending).toHaveLength(3));
    rerender({ market: 'neuroscience' });
    await waitFor(() => expect(db.pending).toHaveLength(6));
    await act(async () => finish('neuroscience'));
    await act(async () => finish('aerospace'));
    expect(result.current.drills.map(q => q.market_id)).toEqual(['neuroscience']);
    expect(result.current.isLoading).toBe(false);
  });

  it('rejects Aerospace drills, figures and decisions in every Neuroscience round', () => {
    const trainer = [{ id: 'plane', market_id: 'aerospace', scenario: 'An airline must select its next aircraft supplier.',
      question: 'Which airline supplier should it choose?', options: [{ label: 'Boeing' }, { label: 'Airbus' }],
      correct_option_index: 0, feedback_pro_reasoning: null, feedback_common_mistake: null, feedback_mental_model: null }];
    for (let run = 0; run < 50; run += 1) {
      const exercises = buildArena({ marketId: 'neuroscience', trainer, drills: [drill('aerospace')], stats: [stat('aerospace')],
        studied: [1, 2, 3].map(day => ({ day, title: `Brain lesson ${day}`, slides: [] })) }).flatMap(w => w.exercises);
      expect(exercises.length).toBeGreaterThan(0);
      expect(JSON.stringify(exercises)).not.toMatch(/Spirit AeroSystems|airline|Boeing|Airbus|fuel/i);
    }
  });

  it('retains valid Neuroscience fallback questions', () => {
    const exercises = buildArena({ marketId: 'neuroscience', trainer: [], stats: [], drills: [drill('neuroscience')],
      studied: [1, 2, 3].map(day => ({ day, title: `Brain lesson ${day}`, slides: [] })) }).flatMap(w => w.exercises);
    expect(JSON.stringify(exercises)).toContain('hippocampus helps form');
  });
});