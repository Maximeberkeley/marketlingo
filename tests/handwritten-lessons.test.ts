import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, mkdtempSync } from 'fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'os';
import { join } from 'path';

// Hand-written lessons for days 6-30, built from scripts/lessons/<market>/ into one migration each.
const MARKETS = [
  { market: 'spacetech', migration: 'drizzle/migrations/0028_spacetech_handwritten_days_6_30.sql' },
  { market: 'cybersecurity', migration: 'drizzle/migrations/0029_cybersecurity_handwritten_days_6_30.sql' },
];
const GOALS = ['career', 'invest', 'build_startup', 'curiosity'];
let python = true;
try { execFileSync('python3', ['--version']); } catch { python = false; }

for (const { market, migration } of MARKETS) {
  const sql = readFileSync(migration, 'utf8');
  const lessons = [...sql.matchAll(new RegExp(`\\$ml\\$(\\{"id": "${market}-d\\d+-[a-z_]+".*?)\\$ml\\$::jsonb\\)`, 'g'))].map(m => JSON.parse(m[1]));

  describe(`${market} hand-written lessons, days 6-30`, () => {
    it('covers every day from 6 to 30 for all four goals', () => {
      expect(lessons).toHaveLength(100);
      for (let d = 6; d <= 30; d++) for (const g of GOALS) expect(lessons.some(l => l.id === `${market}-d${d}-${g}`), `d${d} ${g}`).toBe(true);
      expect(sql).toContain('$ml$handwritten-v1$ml$');
    });

    it('opens with a sourced cold open, checks understanding, and ends with the goal card, rule and Say it', () => {
      for (const l of lessons) {
        const kinds = l.exercises.map((e: any) => e.kind);
        expect(kinds[0], l.id).toBe('coldOpen');
        expect(kinds.slice(-3), l.id).toEqual(['info', 'microInsight', 'sayIt']);
        expect(kinds.filter((k: string) => !['coldOpen', 'microInsight', 'info', 'sayIt'].includes(k)).length, l.id).toBeGreaterThanOrEqual(2);
        for (const e of l.exercises) if (['coldOpen', 'microInsight', 'info'].includes(e.kind)) expect(e.sources?.length, `${l.id} ${e.id}`).toBeGreaterThan(0);
      }
    });

    it('can be run twice: stacks upsert and slides are replaced', () => {
      expect(sql).toContain('ON CONFLICT (id) DO UPDATE SET');
      expect(sql).toMatch(/DELETE FROM slides WHERE stack_id IN \(/);
    });

    it('matches its source files', () => {
      if (!python) return;
      const dir = `scripts/lessons/${market}`;
      const files = readdirSync(dir).filter(f => /^days_.*\.py$/.test(f)).sort().map(f => join(dir, f));
      const out = join(mkdtempSync(join(tmpdir(), 'lessons-')), 'out.sql');
      execFileSync('python3', ['scripts/lessons/build.py', market, ...files, '--out', out], { encoding: 'utf8' });
      expect(readFileSync(out, 'utf8')).toBe(sql);
    });
  });
}
