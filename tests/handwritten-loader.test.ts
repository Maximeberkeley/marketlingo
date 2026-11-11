import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { batches, dayProblems, stackRecord, stacksToWrite, type LessonStack } from '../supabase/functions/_shared/handwritten-plan';

const FNS = readdirSync('supabase/functions').filter(f => /^load-handwritten-lessons(-\d+)?$/.test(f)).map(f => `supabase/functions/${f}`);
const fnOf = (market: string) => FNS.find(fn => readdirSync(`${fn}/data`).includes(`${market}.ts`))!;
const MIGRATIONS = readdirSync('drizzle/migrations').filter(f => /^\d{4}_[a-z0-9]+_handwritten_days_6_30\.sql$/.test(f));
const marketOf = (file: string) => file.split('_')[1];
const MARKETS = MIGRATIONS.map(marketOf);

const dataRows = (market: string): LessonStack[] => {
  const text = readFileSync(`${fnOf(market)}/data/${market}.ts`, 'utf8');
  return JSON.parse(text.slice(text.indexOf('= [') + 2, text.lastIndexOf(']') + 1));
};

/** Stack ids and slide counts per stack, read back from a migration file. */
const fromMigration = (file: string) => {
  const sql = readFileSync(`drizzle/migrations/${file}`, 'utf8');
  const [stacksPart, slidesPart] = sql.split('INSERT INTO slides');
  const stackIds = [...stacksPart.matchAll(/^\(\$ml\$([0-9a-f-]{36})\$ml\$::uuid, \$ml\$[a-z0-9]+\$ml\$, /gm)].map(m => m[1]);
  const slides = new Map<string, number>();
  for (const m of slidesPart.matchAll(/^\(\$ml\$[0-9a-f-]{36}\$ml\$::uuid, \$ml\$([0-9a-f-]{36})\$ml\$::uuid, \d+, /gm)) {
    slides.set(m[1], (slides.get(m[1]) ?? 0) + 1);
  }
  return { sql, stackIds, slides };
};

describe('load-handwritten-lessons ships the same lessons as the migrations', () => {
  it('has generated data that is up to date with the lesson sources', () => {
    expect(execFileSync('python3', ['scripts/lessons/export_loader.py', '--check'], { encoding: 'utf8' })).toContain('up to date');
  }, 120000);

  it('covers all ten markets, row for row: same stack ids, titles, tags and slide counts', () => {
    expect(MARKETS.length).toBe(10);
    for (const file of MIGRATIONS) {
      const market = marketOf(file);
      expect(fnOf(market), market).toBeTruthy();
      const rows = dataRows(market);
      const { sql, stackIds, slides } = fromMigration(file);
      expect(rows.map(r => r.id), market).toEqual(stackIds);
      expect(rows.length, market).toBe(100);
      for (const row of rows) {
        expect(row.market_id).toBe(market);
        expect(row.tags).toContain('handwritten-v1');
        expect(row.tags).toContain('MICRO_LESSON');
        expect(row.fingerprint).toMatch(/^[0-9a-f]{12}$/);
        expect(sql, `${market} ${row.id}`).toContain(`$ml$${row.title}$ml$`);
        expect(row.slides.length, `${market} ${row.id} slides`).toBe(slides.get(row.id));
      }
    }
  });

  it('writes stack_type LESSON, the only lesson type the stacks table accepts', () => {
    for (const file of MIGRATIONS) {
      const { sql } = fromMigration(file);
      expect(sql, file).not.toContain("'MICRO_LESSON', ARRAY[");
      expect(sql, file).toContain("'LESSON', ARRAY[");
      for (const row of dataRows(marketOf(file))) expect(row.stack_type).toBe('LESSON');
    }
  });

  it('opens every loader without sign-in and keeps each under the deploy size limit', () => {
    const config = readFileSync('supabase/config.toml', 'utf8');
    expect(FNS.length).toBeGreaterThan(1);
    for (const fn of FNS) {
      expect(config).toContain(`[functions.${fn.split('/').pop()}]\nverify_jwt = false`);
      const bytes = readdirSync(`${fn}/data`).reduce((n, f) => n + readFileSync(`${fn}/data/${f}`).length, 0);
      expect(bytes, fn).toBeLessThan(4_000_000);
    }
  });
});

describe('planning a lesson load', () => {
  const stack = (id: string, fingerprint: string): LessonStack => ({
    id, market_id: 'ev', title: id, stack_type: 'LESSON', tags: ['MICRO_LESSON', 'day-6', 'handwritten-v1', 'goal:career'],
    duration_minutes: 5, authored_lesson: {}, fingerprint, slides: [],
  });

  it('writes missing and changed stacks only', () => {
    const bundled = [stack('a', 'aaa'), stack('b', 'bbb'), stack('c', 'ccc')];
    const stored = [
      { id: 'a', metadata: { handwritten_src: 'aaa' }, published_at: '2026-01-01' },
      { id: 'b', metadata: {}, published_at: '2026-01-01' },
    ];
    expect(stacksToWrite(bundled, stored).map(r => r.id)).toEqual(['b', 'c']);
  });

  it('keeps existing metadata and the first publish date', () => {
    const rec = stackRecord(stack('a', 'new'), { id: 'a', metadata: { learning_objectives: ['x'], handwritten_src: 'old' }, published_at: '2026-01-01' }, 'NOW');
    expect(rec.metadata).toEqual({ learning_objectives: ['x'], handwritten_src: 'new' });
    expect(rec.published_at).toBe('2026-01-01');
    expect(stackRecord(stack('b', 'f'), undefined, 'NOW').published_at).toBe('NOW');
  });

  it('flags days without four stacks and batches writes', () => {
    const t = (day: number) => ({ market_id: 'ev', tags: ['handwritten-v1', `day-${day}`] });
    expect(dayProblems([t(6), t(6), t(6), t(6), t(7)])).toEqual(['ev day 7 (1 stacks)']);
    expect(batches([1, 2, 3], 2)).toEqual([[1, 2], [3]]);
  });
});

describe('the function, run against in-memory tables', () => {
  const handlers: ((req: Request) => Promise<Response>)[] = [];
  const handler = async (req: Request) => {
    const all = await Promise.all(handlers.map(h => h(req.clone())));
    const bad = all.find(r => r.status !== 200);
    if (bad) return bad;
    const bodies = await Promise.all(all.map(r => r.json()));
    return new Response(JSON.stringify({ mode: bodies[0].mode, report: Object.assign({}, ...bodies.map(b => b.report)),
      totals: Object.assign({}, ...bodies.map(b => b.handwrittenStacksInDatabase)), problems: bodies.flatMap(b => b.daysWithoutFourStacks) }));
  };
  const stacks = new Map<string, any>();
  const slides = new Map<string, any>();
  let writes = 0;

  beforeAll(async () => {
    const out = join(mkdtempSync(join(tmpdir(), 'hw-loader-')), 'fn.cjs');
    execFileSync(process.execPath, ['--input-type=module', '-e', `
      import { build } from 'esbuild';
      await build({ stdin: { contents: ${JSON.stringify(FNS.map(fn => `import './${fn}/index.ts';`).join('\n'))}, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, format: 'cjs', platform: 'neutral', outfile: ${JSON.stringify(out)}, logLevel: 'error',
        plugins: [{ name: 'mock', setup(b) { b.onResolve({ filter: /^https:\\/\\/esm\\.sh\\// }, () => ({ path: 'supabase', namespace: 'mock' }));
          b.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: 'export const createClient = (...a) => globalThis.__createClient(...a);', loader: 'js' })); } }] });
    `], { encoding: 'utf8' });

    (globalThis as any).__createClient = () => ({
      from: (table: string) => {
        const f: { in?: [string, string[]]; eq?: [string, string]; contains?: string[] } = {};
        let del = false;
        const query: any = {
          select: () => query,
          in: (k: string, v: string[]) => { f.in = [k, v]; return del ? run() : query; },
          eq: (k: string, v: string) => { f.eq = [k, v]; return query; },
          contains: (_k: string, v: string[]) => { f.contains = v; return query; },
          limit: () => query,
          delete: () => { del = true; return query; },
          upsert: async (batch: any[]) => { writes += 1; for (const r of batch) stacks.set(r.id, r); return { error: null }; },
          insert: async (batch: any[]) => { writes += 1; for (const r of batch) slides.set(r.id, r); return { error: null }; },
          then: (resolve: any) => resolve(run()),
        };
        const run = () => {
          if (del) {
            for (const [id, s] of slides) if (f.in![1].includes(s.stack_id)) slides.delete(id);
            return { error: null };
          }
          let rows = [...(table === 'stacks' ? stacks : slides).values()];
          if (f.in) rows = rows.filter(r => f.in![1].includes(r[f.in![0]]));
          if (f.eq) rows = rows.filter(r => r[f.eq![0]] === f.eq![1]);
          if (f.contains) rows = rows.filter(r => f.contains!.every(t => (r.tags ?? []).includes(t)));
          return { data: rows, error: null };
        };
        return query;
      },
    });
    (globalThis as any).Deno = { env: { get: () => 'x' }, serve: (h: any) => { handlers.push(h); } };
    createRequire(import.meta.url)(out);
  }, 120000);

  it('previews on GET, loads every stack and its slides on POST, then writes nothing the second time', async () => {
    const preview = await (await handler(new Request('http://x'))).json();
    expect(preview.mode).toMatch(/preview/);
    expect(stacks.size).toBe(0);
    for (const m of MARKETS) expect(preview.report[m]).toEqual({ bundled: 100, written: 0, alreadyCurrent: 0 });

    const first = await (await handler(new Request('http://x', { method: 'POST' }))).json();
    expect(Object.keys(first.report).sort()).toEqual([...MARKETS].sort());
    for (const m of MARKETS) {
      expect(first.report[m].written).toBe(100);
      expect(first.totals[m]).toBe(100);
    }
    expect(first.problems).toEqual([]);
    expect(stacks.size).toBe(1000);
    const expectedSlides = MARKETS.reduce((n, m) => n + dataRows(m).reduce((k, r) => k + r.slides.length, 0), 0);
    expect(slides.size).toBe(expectedSlides);
    const one = [...stacks.values()][0];
    expect(one.stack_type).toBe('LESSON');
    expect(one.metadata.handwritten_src).toMatch(/^[0-9a-f]{12}$/);

    const before = writes;
    const second = await (await handler(new Request('http://x', { method: 'POST' }))).json();
    expect(writes).toBe(before);
    for (const m of MARKETS) expect(second.report[m]).toMatchObject({ written: 0, alreadyCurrent: 100 });
  }, 60000);
});
