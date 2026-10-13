// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';
import { runInNewContext } from 'node:vm';

const read = (path: string) => readFileSync(path, 'utf8');
const pairs = ['mobile/lib/interviewArtwork', 'mobile/app/(tabs)/practice', 'mobile/app/_layout',
  'mobile/lesson-kit/components/LeoCoach', 'mobile/lesson-kit/case/CaseScreen',
  'mobile/hooks/useIntelHabit', 'mobile/components/home/DailyNews', 'mobile/app/(tabs)/home'];

function intelHarness() {
  const values: any[] = [];
  let cursor = 0;
  const events: any[] = [];
  let failInsert = false;
  const query: any = {};
  for (const method of ['select', 'eq', 'in', 'gte']) query[method] = () => query;
  query.then = (resolve: any) => Promise.resolve({ data: events, error: null }).then(resolve);
  const source = read('mobile/hooks/useIntelHabit.ts').replace(/^import .*;\n/gm, '');
  const compiled = transformSync(source, { loader: 'ts', format: 'cjs' }).code;
  const context: any = { exports: {}, module: { exports: {} }, Date, Set, Math,
    useAuth: () => ({ user: { id: 'learner' } }),
    useState: (initial: any) => { const index = cursor++; if (!(index in values)) values[index] = initial; return [values[index], (v: any) => { values[index] = v; }]; },
    useRef: (initial: any) => { const index = cursor++; if (!(index in values)) values[index] = { current: initial }; return values[index]; },
    useCallback: (fn: any) => fn, useEffect: () => {}, log: { warn: () => {} },
    supabase: { from: () => ({ ...query, insert: async (row: any) => {
      if (failInsert) return { error: { message: 'offline' } };
      events.push(row); return { error: null };
    } }) },
  };
  runInNewContext(compiled, context);
  return { events, fail: () => { failInsert = true; }, render: () => {
    cursor = 0; return context.module.exports.useIntelHabit('aerospace');
  } };
}

describe('Practice clarity', () => {
  it('maps each supplied drawing to its real activity', () => {
    const map = read('mobile/lib/interviewArtwork.ts');
    for (const [key, art] of [['quiz', 'flashcards'], ['case', 'research'], ['practice', 'speaking'], ['investment', 'analysis']]) {
      expect(map).toContain(`${key}: { uri: new URL(${art}.url`);
      expect(read('mobile/app/(tabs)/practice.tsx')).toContain(`hero: INTERVIEW_ARTWORK.${key}`);
    }
    expect(read('mobile/app/(tabs)/practice.tsx')).not.toContain('daily-arena-hero.jpg');
  });
  it('disables both native back gestures on all practice routes', () => {
    const source = read('mobile/app/_layout.tsx');
    for (const route of ['arena', 'deep-case', 'trainer', 'games', 'drills', 'interview-lab', 'investment-lab', 'investment-module']) {
      const screen = source.split('\n').find(line => line.includes(`name="${route}"`));
      expect(screen).toContain('gestureEnabled: false');
      expect(screen).toContain('fullScreenGestureEnabled: false');
    }
  });
  it('reserves a growing bubble row before the animation starts', () => {
    const source = read('mobile/lesson-kit/components/LeoCoach.tsx');
    expect(source).toContain('minHeight: SCENE_H');
    expect(source).toContain('<View style={styles.bubbleSlot}>');
    expect(source).not.toContain('{speaking ? (');
    expect(source).toContain("importantForAccessibility={speaking ? 'auto' : 'no-hide-descendants'}");
  });
  it('credits a completed Intel quiz then reads it back through the daily hook', async () => {
    const h = intelHarness();
    expect(h.render().done).toBe(false);
    await h.render().recordComplete('article-1');
    expect(h.render().done).toBe(true);
    expect(h.events[0]).toMatchObject({ user_id: 'learner', event: 'intel_completed', properties: { market_id: 'aerospace', article_id: 'article-1' } });
    await h.render().refresh();
    expect(h.render().done).toBe(true);
    expect(h.render().readToday).toBe(0);
  });
  it('does not credit a failed completion write or another market', async () => {
    const h = intelHarness();
    h.events.push({ event: 'intel_completed', properties: { market_id: 'fintech', article_id: 'other' } });
    await h.render().refresh();
    expect(h.render().done).toBe(false);
    h.fail(); await h.render().recordComplete('article-1');
    expect(h.render().done).toBe(false);
  });
  it('credits quiz results only after every question, and refreshes Home on return', () => {
    expect(read('mobile/components/home/DailyNews.tsx')).toContain('currentQ < questions.length');
    expect(read('mobile/components/home/DailyNews.tsx')).toContain('onComplete={intel.recordComplete}');
    const home = read('mobile/app/(tabs)/home.tsx');
    expect(home).toContain('[courseFocused, clockDay, refreshIntel]');
    expect(home).toContain('intelReadToday={intelHabit.done ? intelHabit.target : intelHabit.readToday}');
  });
  it('keeps all touched JavaScript copies synchronized and imports React', () => {
    for (const path of pairs) {
      const ext = path.endsWith('interviewArtwork') || path.endsWith('useIntelHabit') ? 'ts' : 'tsx';
      const expected = transformSync(read(path + '.' + ext), { loader: ext, jsx: 'transform', format: 'esm', target: 'es2020' }).code;
      const js = read(path + '.js');
      expect(js).toBe(expected);
      if (js.includes('React.createElement')) expect(js).toContain('import React');
    }
  });
});