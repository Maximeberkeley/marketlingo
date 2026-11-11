import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { batches, dayProblems, rowsToWrite, type CaseRow } from '../supabase/functions/_shared/deep-cases-plan';

const FNS = readdirSync('supabase/functions').filter(f => /^load-deep-cases(-\d+)?$/.test(f)).map(f => `supabase/functions/${f}`);
const fnOf = (market: string) => FNS.find(fn => readdirSync(`${fn}/data`).includes(`${market}.ts`))!;
const MARKETS = readdirSync('drizzle/migrations')
  .map(f => f.match(/^\d{4}_([a-z0-9]+)_deep_cases\.sql$/)?.[1])
  .filter((m): m is string => !!m);

/** A data module is generated JSON behind a one-line header; read it back as rows. */
const dataRows = (market: string): CaseRow[] => {
  const text = readFileSync(`${fnOf(market)}/data/${market}.ts`, 'utf8');
  return JSON.parse(text.slice(text.indexOf('= [') + 2, text.lastIndexOf(']') + 1));
};

describe('load-deep-cases ships the same cases as the migrations', () => {
  it('has generated data that is up to date with the case sources', () => {
    expect(execFileSync('python3', ['scripts/cases/export_loader.py', '--check'], { encoding: 'utf8' })).toContain('up to date');
  }, 120000);

  it('bundles every market that has a migration, with the same rows and fingerprints', () => {
    for (const market of MARKETS) {
      expect(fnOf(market), market).toBeTruthy();
      expect(readFileSync(`${fnOf(market)}/data/index.ts`, 'utf8'), market).toContain(`import ${market} from './${market}.ts';`);
      const rows = dataRows(market);
      const sql = readFileSync(readdirSync('drizzle/migrations').map(f => `drizzle/migrations/${f}`).find(f => f.endsWith(`_${market}_deep_cases.sql`))!, 'utf8');
      expect(rows.length, market).toBe((sql.match(/\$ml\$src:[0-9a-f]{12}\$ml\$/g) ?? []).length);
      for (const row of rows) {
        expect(row.market_id).toBe(market);
        expect(row.tags[0]).toBe('handwritten-v1');
        expect(sql, `${market} d${row.day} s${row.slot}`).toContain(`$ml$${row.tags[1]}$ml$`);
        expect(sql).toContain(`$ml$${row.id}$ml$::uuid`);
      }
    }
  });

  it('gives Lovable a schema-only migration and opens the function without sign-in', () => {
    const schema = readFileSync('scripts/cases/supabase/deep_cases_schema.sql', 'utf8');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS public.deep_cases');
    expect(schema).toContain('ENABLE ROW LEVEL SECURITY');
    expect(schema).not.toMatch(/INSERT INTO/i);
    const config = readFileSync('supabase/config.toml', 'utf8');
    for (const fn of FNS) expect(config).toContain(`[functions.${fn.split('/').pop()}]\nverify_jwt = false`);
  });

  it('keeps every loader under the deploy size limit', () => {
    expect(FNS.length).toBeGreaterThan(1);
    for (const fn of FNS) {
      const bytes = readdirSync(`${fn}/data`).reduce((n, f) => n + readFileSync(`${fn}/data/${f}`).length, 0);
      expect(bytes, fn).toBeLessThan(4_000_000);
    }
  });
});

describe('planning a load', () => {
  const row = (day: number, slot: number, src: string): CaseRow => ({ id: `${day}-${slot}`, market_id: 'ai', day, slot, content: {}, tags: ['handwritten-v1', src] });

  it('writes missing and changed rows only', () => {
    const bundled = [row(1, 1, 'src:aaa'), row(1, 2, 'src:bbb'), row(1, 3, 'src:ccc')];
    const stored = [
      { market_id: 'ai', day: 1, slot: 1, tags: ['handwritten-v1', 'src:aaa'] },
      { market_id: 'ai', day: 1, slot: 2, tags: ['handwritten-v1'] },
    ];
    expect(rowsToWrite(bundled, stored).map(r => r.id)).toEqual(['1-2', '1-3']);
    expect(rowsToWrite(bundled, bundled)).toEqual([]);
  });

  it('flags days without three cases and batches writes', () => {
    expect(dayProblems([{ market_id: 'ai', day: 1 }, { market_id: 'ai', day: 1 }, { market_id: 'ai', day: 1 }, { market_id: 'ai', day: 2 }]))
      .toEqual(['ai day 2 (1 cases)']);
    expect(batches([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});

describe('the function, run against an in-memory table', () => {
  const handlers: ((req: Request) => Promise<Response>)[] = [];
  // Calls every loader and merges their reports, as running each function once does.
  const handler = async (req: Request) => {
    const all = await Promise.all(handlers.map(h => h(req.clone())));
    const bad = all.find(r => r.status !== 200);
    if (bad) return bad;
    const bodies = await Promise.all(all.map(r => r.json()));
    return new Response(JSON.stringify({ mode: bodies[0].mode, report: Object.assign({}, ...bodies.map(b => b.report)),
      totalsInDatabase: Object.assign({}, ...bodies.map(b => b.totalsInDatabase)), daysWithoutThreeCases: bodies.flatMap(b => b.daysWithoutThreeCases) }));
  };
  const table = new Map<string, any>();
  let upserts = 0;
  let missingTable = false;

  beforeAll(async () => {
    // Bundle the Deno function with its supabase-js import swapped for an in-memory client.
    const out = join(mkdtempSync(join(tmpdir(), 'loader-')), 'fn.mjs');
    execFileSync(process.execPath, ['--input-type=module', '-e', `
      import { build } from 'esbuild';
      await build({ stdin: { contents: ${JSON.stringify(FNS.map(fn => `import './${fn}/index.ts';`).join('\n'))}, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, format: 'esm', platform: 'neutral', outfile: ${JSON.stringify(out)}, logLevel: 'error',
        plugins: [{ name: 'mock', setup(b) { b.onResolve({ filter: /^https:\\/\\/esm\\.sh\\// }, () => ({ path: 'supabase', namespace: 'mock' }));
          b.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: 'export const createClient = (...a) => globalThis.__createClient(...a);', loader: 'js' })); } }] });
    `], { encoding: 'utf8' });

    (globalThis as any).__createClient = () => ({
      from: () => {
        const filters: Record<string, string> = {};
        let range: [number, number] = [0, 999];
        const query: any = {
          select: () => query,
          eq: (k: string, v: string) => { filters[k] = v; return query; },
          order: () => query,
          range: (a: number, b: number) => { range = [a, b]; return query; },
          then: (resolve: any) => {
            if (missingTable) return resolve({ data: null, error: { message: 'relation "public.deep_cases" does not exist' } });
            const rows = [...table.values()].filter(r => !filters.market_id || r.market_id === filters.market_id)
              .sort((a, b) => a.day - b.day || a.slot - b.slot).slice(range[0], range[1] + 1)
              .map(r => ({ market_id: r.market_id, day: r.day, slot: r.slot, tags: r.tags }));
            return resolve({ data: rows, error: null });
          },
          upsert: async (batch: any[]) => {
            upserts += 1;
            for (const r of batch) table.set(`${r.market_id}/${r.day}/${r.slot}`, r);
            return { error: null };
          },
        };
        return query;
      },
    });
    (globalThis as any).Deno = { env: { get: () => 'x' }, serve: (h: any) => { handlers.push(h); } };
    console.log("DBG", require("node:fs").existsSync(out), out);
    await import(pathToFileURL(out).href);
  }, 120000);

  it('explains a missing table instead of failing silently', async () => {
    missingTable = true;
    const res = await handler(new Request('http://x', { method: 'POST' }));
    missingTable = false;
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('deep_cases_schema.sql');
  });

  it('previews on GET, loads every case on POST, then writes nothing the second time', async () => {
    const preview = await (await handler(new Request('http://x'))).json();
    expect(preview.mode).toMatch(/preview/);
    expect(table.size).toBe(0);

    const first = await (await handler(new Request('http://x', { method: 'POST' }))).json();
    expect(Object.keys(first.report).sort()).toEqual([...MARKETS].sort());
    for (const market of MARKETS) {
      expect(first.report[market].written).toBe(dataRows(market).length);
      expect(first.totalsInDatabase[market]).toBe(dataRows(market).length);
    }
    expect(first.daysWithoutThreeCases).toEqual([]);
    expect(table.get('ai/1/1').updated_at).toBeTruthy();

    const before = upserts;
    const second = await (await handler(new Request('http://x', { method: 'POST' }))).json();
    expect(upserts).toBe(before);
    for (const market of MARKETS) expect(second.report[market]).toMatchObject({ written: 0, alreadyCurrent: dataRows(market).length });
  });
});
