import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';

const file = 'mobile/components/course/CourseJourney.tsx';
const source = readFileSync(file, 'utf8');
const component = source.slice(source.indexOf('function SectionCluster('), source.indexOf('function CurriculumPreview('));
const transformed = execFileSync(process.execPath, ['--input-type=module', '-e', `
  import { transformSync } from 'esbuild';
  process.stdout.write(transformSync(${JSON.stringify(component)}, {loader:'tsx', jsx:'transform'}).code);
`], { encoding: 'utf8' });
const kinds = ['lesson', 'arena', 'case', 'intel', 'notes'];
function render(notes: boolean, otherDone = false) {
  const context: any = {
    React: { createElement: (type: any, props: any, ...children: any[]) => ({ type, props, children }) },
    MODULES: kinds.map(kind => ({ kind, label: kind })),
    COLORS: {}, styles: {}, View: 'View', Svg: 'Svg', Circle: 'Circle', Text: 'Text',
    TouchableOpacity: 'TouchableOpacity', Coin: 'Coin', SectionHeader: 'Header',
    MovingLessonTitle: 'Title', LeoCharacter: 'Leo', lessonDayLabel: () => 'Day 1',
  };
  runInNewContext(transformed, context);
  return context.SectionCluster({ section: { unlocked: true }, activeSection: true,
    lessonCompletedToday: otherDone, arenaCompletedToday: otherDone,
    caseCompletedToday: otherDone, intelDone: otherDone, notesCompletedToday: notes,
    weekTitle: 'Lesson', activityReveal: [0, 0, 0, 0] });
}
function nodes(tree: any): any[] {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...(tree.children ?? []).flatMap(nodes)];
}
describe('Notes Home orbit', () => {
  it('fills one fifth and checks Notes after a saved note', () => {
    const tree = nodes(render(true));
    const circle = tree.find(n => n.type === 'Circle' && n.props.strokeDasharray);
    expect(circle.props.strokeDashoffset).toBeCloseTo(2 * Math.PI * 132.5 * 0.8);
    const coin = tree.find(n => n.type === 'Coin' && n.props.label === 'notes');
    expect(coin.props.completed).toBe(true);
    expect(coin.props.muted).toBe(false);
    expect(coin.props.reveal).toBeUndefined();
  });
  it('requires all five activities for a full circle', () => {
    expect(nodes(render(true, true)).find(n => n.type === 'Circle' && n.props.strokeDasharray).props.strokeDashoffset).toBe(0);
    expect(nodes(render(false, true)).find(n => n.type === 'Circle' && n.props.strokeDasharray).props.strokeDashoffset).toBeGreaterThan(0);
  });
  it('queries current learner and industry within local midnight boundaries on focus', () => {
    const home = readFileSync('mobile/app/(tabs)/home.tsx', 'utf8');
    expect(home).toContain("supabase.from('notes').select('id')");
    expect(home).toContain(".eq('user_id', user.id).eq('market_id', selectedMarketLocal)");
    expect(home).toContain('start.setHours(0, 0, 0, 0)');
    expect(home).toContain(".gte('created_at', start.toISOString()).lt('created_at', end.toISOString())");
    expect(home).toContain('[courseFocused, user?.id, selectedMarketLocal, clockDay]');
  });
  it('keeps JavaScript copies synchronized with React imported', () => {
    for (const path of ['mobile/app/(tabs)/home', 'mobile/components/course/CourseJourney']) {
      const js = readFileSync(path + '.js', 'utf8');
      expect(js).toContain('import React');
      expect(js).toContain('notesCompletedToday');
    }
  });
});