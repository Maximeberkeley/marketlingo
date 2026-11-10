import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { caseRingSegments, casesDoneToday, DAILY_CASES, nextHomeStep } from '../mobile/lib/homeSteps';
import { transactionSource } from '../mobile/lib/xpSource';
import { buildCase, caseDebriefLine } from '../mobile/lesson-kit/case/buildCase';
import { studiedMaterial } from '../mobile/lesson-kit/practice/studiedMaterial';
import fixture from './fixtures/neuroscience-day1.json';

const read = (p: string) => readFileSync(p, 'utf8');
const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });

describe('the daily path: lesson, then Arena, then three Deep Cases', () => {
  it('rings one coin at a time in order and stops once all three cases are solved', () => {
    expect(nextHomeStep({ lessonDone: false, arenaDone: true, casesDone: 3 })).toBe('lesson');
    expect(nextHomeStep({ lessonDone: true, arenaDone: false, casesDone: 0 })).toBe('arena');
    expect(nextHomeStep({ lessonDone: true, arenaDone: true, casesDone: 0 })).toBe('case');
    expect(nextHomeStep({ lessonDone: true, arenaDone: true, casesDone: 2 })).toBe('case');
    expect(nextHomeStep({ lessonDone: true, arenaDone: true, casesDone: 3 })).toBeNull();
  });

  it('counts today\'s cases from the daily counter, clamped to three', () => {
    expect(DAILY_CASES).toBe(3);
    expect(casesDoneToday(undefined)).toBe(0);
    expect(casesDoneToday(2)).toBe(2);
    expect(casesDoneToday(7)).toBe(3);
    expect(casesDoneToday(-1)).toBe(0);
  });

  it('splits the case ring into three equal arcs with visible gaps, brightening solved cases in order', () => {
    const segments = caseRingSegments(53.5, 5, 12, 1);
    expect(segments.map(s => s.done)).toEqual([true, false, false]);
    const circumference = 2 * Math.PI * 53.5;
    const arcs = segments.map(s => Number(s.dashArray.split(' ')[0]));
    expect(new Set(arcs.map(a => a.toFixed(6))).size).toBe(1);
    expect(arcs[0] + 5 + 12).toBeCloseTo(circumference / 3);
    expect(segments[1].dashOffset - segments[0].dashOffset).toBeCloseTo(-circumference / 3);
  });
});

describe('Home SectionCluster wiring', () => {
  const source = read('mobile/components/course/CourseJourney.tsx');
  const component = source.slice(source.indexOf('function SectionCluster('), source.indexOf('function CurriculumPreview('));
  const transformed = execFileSync(process.execPath, ['--input-type=module', '-e', `
    import { transformSync } from 'esbuild';
    process.stdout.write(transformSync(${JSON.stringify(component)}, {loader:'tsx', jsx:'transform'}).code);
  `], { encoding: 'utf8' });
  const kinds = ['lesson', 'arena', 'case', 'intel', 'notes'];
  const render = (state: { lesson: boolean; arena: boolean; cases: number }) => {
    const context: any = {
      React: { createElement: (type: any, props: any, ...children: any[]) => ({ type, props, children }) },
      MODULES: kinds.map(kind => ({ kind, label: kind })),
      COLORS: {}, styles: {}, View: 'View', Svg: 'Svg', Circle: 'Circle', Text: 'Text',
      TouchableOpacity: 'TouchableOpacity', Coin: 'Coin', SectionHeader: 'Header',
      MovingLessonTitle: 'Title', LeoCharacter: 'Leo', lessonDayLabel: () => 'Day 1',
      LeoAnimated: 'AnimatedLeo', useHomeLeo: () => ({ clip: 'leo-sleep-loop', onTap: () => {}, onEnd: () => {} }),
      DAILY_CASES, nextHomeStep,
    };
    runInNewContext(transformed, context);
    const tree = context.SectionCluster({ section: { unlocked: true }, activeSection: true,
      lessonCompletedToday: state.lesson, arenaCompletedToday: state.arena, casesCompletedToday: state.cases,
      intelDone: false, notesCompletedToday: false, weekTitle: 'Lesson', activityReveal: [0, 0, 0, 0] });
    const nodes = (t: any): any[] => !t || typeof t !== 'object' ? [] : Array.isArray(t) ? t.flatMap(nodes) : [t, ...(t.children ?? []).flatMap(nodes)];
    const all = nodes(tree);
    const coin = (kind: string) => all.find(n => n.type === 'Coin' && n.props.label === kind || (kind === 'lesson' && n.type === 'Coin' && n.props.label === 'Start here'));
    return { coin, orbit: all.find(n => n.type === 'Circle' && n.props.strokeDasharray) };
  };

  it('moves the ring from the lesson to the Arena to the Deep Case', () => {
    let view = render({ lesson: false, arena: false, cases: 0 });
    expect(view.coin('lesson').props.recommended).toBe(true);
    expect(view.coin('arena').props.recommended).toBe(false);
    view = render({ lesson: true, arena: false, cases: 0 });
    expect(view.coin('lesson').props.recommended).toBe(false);
    expect(view.coin('arena').props.recommended).toBe(true);
    expect(view.coin('case').props.segmentsDone).toBeUndefined();
    view = render({ lesson: true, arena: true, cases: 0 });
    expect(view.coin('case').props.recommended).toBe(true);
    expect(view.coin('case').props.segmentsDone).toBe(0);
  });

  it('brightens one arc per solved case and checks the coin after the third', () => {
    let view = render({ lesson: true, arena: true, cases: 2 });
    expect(view.coin('case').props.segmentsDone).toBe(2);
    expect(view.coin('case').props.completed).toBe(false);
    view = render({ lesson: true, arena: true, cases: 3 });
    expect(view.coin('case').props.recommended).toBe(false);
    expect(view.coin('case').props.segmentsDone).toBeUndefined();
    expect(view.coin('case').props.completed).toBe(true);
  });

  it('keeps a started case ring visible even before the Arena is done', () => {
    const view = render({ lesson: true, arena: false, cases: 1 });
    expect(view.coin('arena').props.recommended).toBe(true);
    expect(view.coin('case').props.recommended).toBe(false);
    expect(view.coin('case').props.segmentsDone).toBe(1);
  });

  it('fills the case share of the orbit a third at a time', () => {
    const circumference = 2 * Math.PI * 132.5;
    const lessonOnly = render({ lesson: true, arena: false, cases: 0 }).orbit.props.strokeDashoffset;
    const oneCase = render({ lesson: true, arena: false, cases: 1 }).orbit.props.strokeDashoffset;
    expect(lessonOnly - oneCase).toBeCloseTo(circumference / 5 / 3);
  });

  it('passes the solved count from the daily completion counter on Home', () => {
    const home = read('mobile/app/(tabs)/home.tsx');
    expect(home).toContain('casesCompletedToday={casesDoneToday(dailyCompletion?.games_completed)}');
    expect(home).not.toContain('caseCompletedToday=');
  });
});

describe('three different Deep Cases a day', () => {
  const day1 = { ...fixture, ...studiedMaterial(fixture.authored_lesson) };
  const day2 = { ...day1, stackId: 'stack-day-2', day: 2, title: 'Day two lesson' };
  const trainers = [1, 2].map(n => ({ id: `trainer-${n}`, scenario: `A real market decision number ${n} with enough detail to brief.`, question: `Which approach fits case ${n}?`, options: [{ label: 'A', isCorrect: true }, { label: 'B' }], correct_option_index: 0 }));
  const base = { marketId: 'neuroscience', marketName: 'Neuroscience', drills: [], stats: [], trainer: trainers as any };

  it('leads each of today\'s cases with a different studied lesson, then a market scenario', () => {
    const cases = [0, 1, 2].map(index => buildCase({ ...base, studied: [day1, day2] as any, daily: { index, total: 3 } })!);
    expect(cases[0].id).toContain('lesson-case-2-stack-day-2');
    expect(cases[1].id).toContain(`lesson-case-1-${day1.stackId}`);
    expect(cases[2].id).not.toContain('lesson-case');
    expect(new Set(cases.map(c => c.id)).size).toBe(3);
    expect(cases.map(c => c.stages[0].exercise.eyebrow)).toEqual([
      'NEUROSCIENCE · CASE 1 OF 3', 'NEUROSCIENCE · CASE 2 OF 3', 'NEUROSCIENCE · CASE 3 OF 3',
    ]);
  });

  it('counts down today\'s cases in the debrief', () => {
    expect(caseDebriefLine({ number: 1, total: 3 })).toBe('Case 1 of 3 solved. 2 more today.');
    expect(caseDebriefLine({ number: 2, total: 3 })).toBe('Case 2 of 3 solved. One more today.');
    expect(caseDebriefLine({ number: 3, total: 3 })).toBe("That's all 3 cases for today. See you tomorrow.");
  });

  it('closes the Deep Case after three solved cases and fixes the case number on open', () => {
    const route = read('mobile/app/deep-case.tsx');
    expect(route).toContain('if (solvedBefore >= DAILY_CASES) {');
    expect(route).toContain('daily: { index: caseIndex, total: DAILY_CASES }');
    expect(route).toContain('if (solvedBefore !== null) return;');
  });
});

describe('Deep Case XP reaches the friend race and the crown', () => {
  it('never sends a non-uuid source id to the uuid column', () => {
    const id = '0b6f6f2e-8a51-4b8e-9f63-6a1c2d3e4f50';
    expect(transactionSource(id, 'Daily lesson')).toEqual({ source_id: id, description: 'Daily lesson' });
    expect(transactionSource(`lesson-case-6-${id}-c1`, 'Deep Case graded A')).toEqual({
      source_id: null, description: `Deep Case graded A · lesson-case-6-${id}-c1`,
    });
    expect(transactionSource(undefined, 'Daily Arena run')).toEqual({ source_id: null, description: 'Daily Arena run' });
  });

  it('uses the sanitizer for every addXP transaction', () => {
    const hook = read('mobile/hooks/useUserXP.ts');
    expect(hook).toContain('...transactionSource(sourceId, description),');
    expect(hook).not.toMatch(/source_id: sourceId,/);
  });
});

describe('JavaScript copies stay in sync', () => {
  it('match their source and import React when they use it', () => {
    for (const [path, loader] of [
      ['components/course/CourseJourney', 'tsx'], ['app/(tabs)/home', 'tsx'], ['app/deep-case', 'tsx'],
      ['hooks/useUserXP', 'ts'], ['lesson-kit/case/buildCase', 'ts'], ['lesson-kit/case/CaseScreen', 'tsx'], ['lib/homeSteps', 'ts'], ['lib/xpSource', 'ts'],
      ['lesson-kit/case/authoredCase', 'ts'], ['hooks/useAuthoredCase', 'ts'],
    ]) {
      const js = read(`mobile/${path}.js`);
      expect(js, path).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js).toMatch(/import React\b/);
    }
  }, 60000);
});
