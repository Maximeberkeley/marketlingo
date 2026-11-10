import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, mkdtempSync } from 'fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { callForGoal, caseDay, caseFromAuthored, type AuthoredCaseContent } from '../mobile/lesson-kit/case/authoredCase';

// Hand-written Deep Cases: three per course day, built from scripts/cases/<market>/ into one migration each.
const MARKETS = [
  { market: 'aerospace', migration: 'drizzle/migrations/0038_aerospace_deep_cases.sql' },
];
const GOALS = ['career', 'invest', 'build_startup', 'curiosity'];
let python = true;
try { execFileSync('python3', ['--version']); } catch { python = false; }

const read = (p: string) => readFileSync(p, 'utf8');
const call = (situation: string) => ({
  call: { kind: 'theCall', situation, prompt: 'What do you do?', options: ['A', 'B', 'C'], correctIndex: 1, consequences: ['a', 'b', 'c'], explanation: 'Because.' },
  proReasoning: `pro ${situation}`, commonMistake: `mistake ${situation}`, mentalModel: `model ${situation}`,
});
const content = (calls: Record<string, unknown>): AuthoredCaseContent => ({
  id: 'aerospace-d4-c2', title: 'Where the cash lands', lessonTitle: 'Three numbers that tell the story',
  brief: { headline: 'Airbus delivered 793 jets in 2025.', kicker: 'Connect day 2 and day 4.', fullText: 'Long text.', sources: [{ url: 'https://example.com', label: 'Example' }] },
  evidence: { kind: 'spotFake', id: 'x', prompt: 'Tap the fake.', statements: ['a', 'b', 'c'], fakeIndex: 1, explanation: 'Why.' } as any,
  numbers: { kind: 'numberSense', id: 'y', prompt: 'How much?', min: 0, max: 100, value: 70, unit: '%', explanation: 'Why.' } as any,
  calls: calls as any,
});

describe('hand-written Deep Cases in the app', () => {
  it('plays brief, evidence, numbers and the call written for the learner\'s goal', () => {
    const c = caseFromAuthored({ day: 4, slot: 2, content: content({ invest: call('invest'), curiosity: call('curiosity') }) }, 'invest', 'Aerospace', 3)!;
    expect(c.id).toBe('authored-aerospace-d4-c2');
    expect(c.stages.map(s => s.key)).toEqual(['brief', 'evidence', 'numbers', 'call']);
    const brief = c.stages[0].exercise as any;
    expect(brief.kind).toBe('coldOpen');
    expect(brief.eyebrow).toBe('AEROSPACE · CASE 2 OF 3');
    expect(brief.sources).toHaveLength(1);
    expect((c.stages[3].exercise as any).situation).toBe('invest');
    expect(c.proReasoning).toBe('pro invest');
    expect(c.mentalModel).toBe('model invest');
    for (const s of c.stages) expect((s.exercise as any).source).toEqual({ type: 'lesson', day: 4, title: 'Three numbers that tell the story' });
    expect(new Set(c.stages.map(s => (s.exercise as any).id)).size).toBe(4);
  });

  it('reads the career call for join_industry and falls back to the curiosity call', () => {
    const full = content({ career: call('career'), curiosity: call('curiosity') });
    expect((callForGoal(full, 'join_industry')!.call as any).situation).toBe('career');
    expect((callForGoal(full, 'build_startup')!.call as any).situation).toBe('curiosity');
    expect((callForGoal(full, null)!.call as any).situation).toBe('curiosity');
    expect((callForGoal(content({ invest: call('invest') }), 'career')!.call as any).situation).toBe('invest');
  });

  it('refuses broken rows so the generated case takes over', () => {
    expect(caseFromAuthored({ day: 1, slot: 1, content: null }, 'invest', 'Aerospace', 3)).toBeNull();
    expect(caseFromAuthored({ day: 1, slot: 1, content: { ...content({ invest: call('invest') }), evidence: { kind: 'wordBank' } } }, 'invest', 'Aerospace', 3)).toBeNull();
    expect(caseFromAuthored({ day: 1, slot: 1, content: content({}) }, 'invest', 'Aerospace', 3)).toBeNull();
    const noNumbers = caseFromAuthored({ day: 1, slot: 1, content: { ...content({ invest: call('invest') }), numbers: undefined } }, 'invest', 'Aerospace', 3)!;
    expect(noNumbers.stages.map(s => s.key)).toEqual(['brief', 'evidence', 'call']);
  });

  it('takes the case from the newest studied day at or before the requested one', () => {
    expect(caseDay([1, 2, 5, 3], 4)).toBe(3);
    expect(caseDay([1, 2, 5, 3], 9)).toBe(5);
    expect(caseDay([6, 7], 2)).toBe(6);
    expect(caseDay([2, null, undefined, 4])).toBe(4);
    expect(caseDay([], 3)).toBeNull();
  });

  it('loads the authored case for today\'s slot before building one from lessons', () => {
    const route = read('mobile/app/deep-case.tsx');
    expect(route).toContain("import { useAuthoredCase } from '../hooks/useAuthoredCase'");
    expect(route).toMatch(/authored\.row \? caseFromAuthored\(authored\.row, learningGoal, marketName, DAILY_CASES\) : null\) \?\?\s*buildCase\(/);
    expect(route).toContain('caseIndex + 1');
    const hook = read('mobile/hooks/useAuthoredCase.ts');
    expect(hook).toContain(".from('deep_cases')");
    for (const f of ["'market_id'", "'day'", "'slot'"]) expect(hook).toContain(`.eq(${f}`);
    expect(hook).toContain('.maybeSingle()');
  });
});

for (const { market, migration } of MARKETS) {
  const sql = read(migration);
  const cases = [...sql.matchAll(/\$ml\$(\{"id": ".*?)\$ml\$::jsonb/g)].map(m => JSON.parse(m[1]));
  const days = [...new Set(cases.map(c => Number(String(c.id).match(/-d(\d+)-/)![1])))].sort((a, b) => a - b);

  describe(`${market} hand-written Deep Cases`, () => {
    it('has three cases for every day it covers, each with a call for all four goals', () => {
      expect(cases.length).toBe(days.length * 3);
      for (const d of days) for (const s of [1, 2, 3]) expect(cases.some(c => c.id === `${market}-d${d}-c${s}`), `d${d} c${s}`).toBe(true);
      for (const c of cases) {
        expect(Object.keys(c.calls).sort(), c.id).toEqual([...GOALS].sort());
        for (const g of GOALS) {
          expect(['theCall', 'multipleChoice'], `${c.id} ${g}`).toContain(c.calls[g].call.kind);
          expect(c.calls[g].proReasoning && c.calls[g].commonMistake && c.calls[g].mentalModel, `${c.id} ${g}`).toBeTruthy();
        }
        expect(c.brief.sources.length, c.id).toBeGreaterThan(0);
        expect(c.numbers.kind, c.id).toBe('numberSense');
        expect(c.lessonTitle, c.id).toBeTruthy();
      }
    });

    it('plays in the app for every goal', () => {
      for (const c of cases) for (const g of [...GOALS, 'join_industry']) {
        const played = caseFromAuthored({ day: 1, slot: c.slot, content: c }, g, 'Aerospace', 3);
        expect(played?.stages.map(s => s.key), `${c.id} ${g}`).toEqual(['brief', 'evidence', 'numbers', 'call']);
      }
    });

    it('creates its table safely and can be run twice', () => {
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.deep_cases');
      expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('ON CONFLICT (market_id, day, slot) DO UPDATE SET');
    });

    it('matches its source files', () => {
      if (!python) return;
      const dir = `scripts/cases/${market}`;
      const files = readdirSync(dir).filter(f => /^days_.*\.py$/.test(f)).sort().map(f => join(dir, f));
      const out = join(mkdtempSync(join(tmpdir(), 'cases-')), 'out.sql');
      execFileSync('python3', ['scripts/cases/build.py', market, ...files, '--out', out], { encoding: 'utf8' });
      expect(read(out)).toBe(sql);
    });
  });
}
