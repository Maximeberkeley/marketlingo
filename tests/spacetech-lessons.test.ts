import { describe, it, expect } from 'vitest';
import { readFileSync, mkdtempSync } from 'fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const MIGRATION = 'drizzle/migrations/0028_spacetech_handwritten_days_6_30.sql';
const sql = readFileSync(MIGRATION, 'utf8');
const lessons = [...sql.matchAll(/\$ml\$(\{"id": "spacetech-d\d+-[a-z_]+".*?)\$ml\$::jsonb\)/g)].map(m => JSON.parse(m[1]));

describe('Space tech hand-written lessons, days 6-30', () => {
  it('covers every day from 6 to 30 for all four goals', () => {
    expect(lessons).toHaveLength(100);
    for (let d = 6; d <= 30; d++) {
      for (const g of ['career', 'invest', 'build_startup', 'curiosity']) {
        expect(lessons.some(l => l.id === `spacetech-d${d}-${g}`), `d${d} ${g}`).toBe(true);
      }
    }
    expect(sql).toContain("ARRAY[$ml$MICRO_LESSON$ml$, $ml$day-6$ml$, $ml$month-1$ml$, $ml$handwritten-v1$ml$");
  });

  it('opens with a sourced cold open, checks understanding, and ends with the goal card, rule and Say it', () => {
    for (const l of lessons) {
      const kinds = l.exercises.map((e: any) => e.kind);
      expect(kinds[0], l.id).toBe('coldOpen');
      expect(kinds.slice(-3), l.id).toEqual(['info', 'microInsight', 'sayIt']);
      const checks = kinds.filter((k: string) => !['coldOpen', 'microInsight', 'info', 'sayIt'].includes(k));
      expect(checks.length, l.id).toBeGreaterThanOrEqual(2);
      for (const e of l.exercises) {
        if (['coldOpen', 'microInsight', 'info'].includes(e.kind)) expect(e.sources?.length, `${l.id} ${e.id}`).toBeGreaterThan(0);
      }
    }
  });

  it('can be run twice: stacks upsert and slides are replaced', () => {
    expect(sql).toContain('ON CONFLICT (id) DO UPDATE SET');
    expect(sql).toMatch(/DELETE FROM slides WHERE stack_id IN \(/);
  });

  it('matches its source files', () => {
    let python = true;
    try { execFileSync('python3', ['--version']); } catch { python = false; }
    if (!python) return;
    const out = join(mkdtempSync(join(tmpdir(), 'lessons-')), 'out.sql');
    execFileSync('python3', ['scripts/lessons/build.py', 'spacetech',
      ...['days_06_12', 'days_13_18', 'days_19_24', 'days_25_30'].map(f => `scripts/lessons/spacetech/${f}.py`), '--out', out], { encoding: 'utf8' });
    expect(readFileSync(out, 'utf8')).toBe(sql);
  });
});
