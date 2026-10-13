import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';

// Run the transformer in Node so native text encoders never mix with jsdom's realm.
function transformed(file: string, format: string) {
  return execFileSync(process.execPath, ['--input-type=module', '-e', `
    import { transformSync } from 'esbuild';
    import { readFileSync } from 'node:fs';
    process.stdout.write(transformSync(readFileSync(${JSON.stringify(file)}, 'utf8'), {
      loader: ${JSON.stringify(file.endsWith('tsx') ? 'tsx' : 'ts')},
      format: ${JSON.stringify(format)}, jsx: 'transform'
    }).code);
  `], { encoding: 'utf8' });
}

// Exercise the actual phone modules without loading native bridges in jsdom.
function phoneModule(file: string) {
  const exports = {};
  const code = transformed(file, 'cjs');
  const module = { exports };
  runInNewContext(code, { module, exports, require: (id: string) => {
    if (id.includes('dayMath')) return { localDateString: () => '2026-10-13' };
    return {};
  } });
  return module.exports as any;
}
const prep = phoneModule('mobile/lib/interviewPrep.ts');
const data = phoneModule('mobile/lib/interviewLabData.ts');

describe('Interview Lab final polish', () => {
  it.each(['Intern', 'Engineering co-op', 'Student', 'New grad', 'Strategy intern'])('prioritizes foundations for %s', role => {
    expect(prep.isEarlyCareerRole(role)).toBe(true);
    expect(prep.roleTrack(role)).toBe('technical');
    const pool = prep.orderInterviewMocks([...data.trackMocks('aerospace', 'technical'), ...data.trackMocks('aerospace', 'behavioral')], role);
    expect(pool.slice(0, 10).map((q: any) => q.id)).toEqual([
      'aero-beh-1', 'aero-beh-2', 'aero-beh-3', 'aero-beh-4', 'aero-beh-5', 'aero-beh-6',
      'aero-tech-2', 'aero-tech-3', 'aero-tech-7', 'aero-tech-10',
    ]);
    const used = new Set<number>();
    const sequence = Array.from({ length: pool.length }, () => pool[prep.pickInterviewIndex(pool.length, used, true)].id);
    expect(sequence).toEqual(pool.map((q: any) => q.id));
    expect(new Set(sequence).size).toBe(pool.length);
  });

  it('does not change experienced-role pool order', () => {
    const pool = data.trackMocks('aerospace', 'technical');
    expect(prep.orderInterviewMocks(pool, 'Flight test engineer')).toBe(pool);
    expect(prep.roleTrack('Strategy consultant')).toBe('case');
  });

  it('uses behavioral and basic technical questions first in dated plans', () => {
    const technical = prep.orderInterviewMocks(data.trackMocks('aerospace', 'technical'), 'Intern');
    for (const today of ['2026-10-12', '2026-10-13', '2026-10-14']) {
      const plan = prep.buildSprintPlan({ target: { company: 'Space X', role: 'Intern' }, today, daysLeft: 13,
        concepts: ['Buyer ≠ User'], news: ['Launch delayed'], bank: {
          technical: technical.map((q: any) => q.question),
          behavioral: data.trackMocks('aerospace', 'behavioral').map((q: any) => q.question),
        } });
      expect(plan[0].kind).toBe('behavioral');
      expect(plan[0].mock).toBe(data.trackMocks('aerospace', 'behavioral')[0].question);
      expect(plan.filter((d: any) => d.kind === 'technical').map((d: any) => d.mock))
        .toEqual(technical.slice(0, 3).map((q: any) => q.question));
      for (let i = 1; i < plan.length; i++) expect(plan[i].label).not.toBe(plan[i - 1].label);
      for (const d of plan) expect(prep.planConceptSubtitle(d)).toBeNull();
    }
  });

  it('discloses only nonduplicated concept-task subtitles', () => {
    const day = { concept: 'Buyer ≠ User', kind: 'concept', label: 'Concept question' };
    expect(prep.planConceptSubtitle(day)).toBe('Buyer ≠ User');
    expect(prep.planConceptSubtitle({ ...day, kind: 'brief', label: 'Brief line: Buyer ≠ User' })).toBeNull();
    expect(prep.planConceptSubtitle({ ...day, kind: 'brief', label: 'Brief line' })).toBe('Buyer ≠ User');
    for (const kind of ['behavioral', 'technical', 'news', 'full']) expect(prep.planConceptSubtitle({ ...day, kind })).toBeNull();
  });

  it('matches generated JavaScript twins and retains required React imports', () => {
    for (const source of ['mobile/lib/interviewPrep.ts', 'mobile/components/interview/InterviewHome.tsx', 'mobile/app/interview-lab.tsx']) {
      const expected = transformed(source, 'esm');
      expect(readFileSync(source.replace(/\.tsx?$/, '.js'), 'utf8')).toBe(expected);
      if (expected.includes('React.createElement')) expect(expected).toMatch(/import React\b/);
    }
  });
});