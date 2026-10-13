import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { cardGlossaryMatches, glossaryFor, interviewQA } from '../mobile/lesson-kit/glossary';
import { colonList } from '../mobile/lesson-kit/cardPresentation';
import { tokens } from '../mobile/lesson-kit/theme/tokens';

const read = (path: string) => readFileSync(path, 'utf8');
const transform = (source: string, loader = 'tsx', format = 'cjs') => execFileSync(process.execPath,
  ['--input-type=module', '-e', `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:${JSON.stringify(format)},target:'es2020'}).code);`], { encoding: 'utf8' });

describe('Focused phone lessons', () => {
  it('renders at most three first-occurrence definitions across Q&A blocks and opens their real definitions', () => {
    const tapped: string[] = [];
    const shown: any[] = [];
    const glossary = glossaryFor('aerospace');
    const ColorText = (props: any) => {
      const matches = props.glossary ? cardGlossaryMatches(props.text, glossary, props.precedingText, props.excludedText) : [];
      shown.push({ text: props.text, matches });
      return { tap: () => matches.forEach(match => tapped.push(match.entry.definition)) };
    };
    const context: any = { module: { exports: {} }, exports: {}, ColorText, colonList, interviewQA, tokens,
      View: 'View', Text: 'Text', Feather: 'Feather', StyleSheet: { create: (s: any) => s },
      React: { createElement: (type: any, props: any, ...children: any[]) => typeof type === 'function' ? type(props) : { type, props, children } } };
    const source = read('mobile/lesson-kit/components/ReadingCopy.tsx').replace(/^import .*;\n/gm, '');
    runInNewContext(transform(source), context);
    context.module.exports.ReadingCopy({ text: 'INTERVIEW Q: Tier 1 and OEMs affect backlog. MODEL ANSWER: Tier 1s affect certification and EASA.' });
    expect(shown.flatMap(block => block.matches.map((m: any) => m.text))).toEqual(['Tier 1', 'OEMs', 'backlog']);
    shown.length = 0;
    const tree = context.module.exports.ReadingCopy({ text: 'DERs are FAA-delegated specialists.', body: 'DERs review certification, EASA and airworthiness.' });
    expect(shown[0].matches).toHaveLength(0);
    expect(shown[1].matches.map((m: any) => m.text)).toEqual(['certification', 'EASA', 'airworthiness']);
    // Definition callbacks stay attached to the eligible body, not the headline.
    tree.children[2].tap();
    expect(tapped[0]).toContain('Formal evidence');
    const previous = context.module.exports.readingTermCopy('Suppliers: Tier 1, OEMs, backlog', 'Certification matters.');
    expect(cardGlossaryMatches('EASA and Tier 1', glossary, previous.precedingText, previous.excludedText)).toEqual([]);
  });

  it('hides tabs for the full run and restores them after completion, blur or unmount', () => {
    const hidden: boolean[] = [];
    let cleanup: (() => void) | undefined;
    const context: any = { module: { exports: {} }, exports: {},
      React: { createElement: () => null }, createContext: (v: any) => v,
      useContext: () => ({ setHidden: (value: boolean) => hidden.push(value) }),
      useLayoutEffect: (effect: () => () => void) => { cleanup = effect(); }, useState: () => [] };
    runInNewContext(transform(read('mobile/lib/lessonNavigation.tsx').replace(/^import .*;\n/gm, '')), context);
    for (const active of [false, true, true, true, false]) {
      context.module.exports.useLessonTabsHidden(active);
      expect(hidden.at(-1)).toBe(active);
    }
    context.module.exports.useLessonTabsHidden(true);
    cleanup?.();
    expect(hidden.at(-1)).toBe(false);
    expect(read('mobile/app/(tabs)/home.tsx')).toContain('useLessonTabsHidden(courseFocused && activeLessonScreen)');
    expect(read('mobile/app/(tabs)/_layout.tsx')).toContain("display: hidden ? 'none' : 'flex'");
  });

  it('bundles all four drawings at small sizes and synchronizes every touched source', () => {
    for (const name of ['flashcards', 'research', 'speaking', 'analysis']) {
      const size = statSync(`mobile/assets/illustrations/interview-${name}.jpg`).size;
      expect(size).toBeGreaterThan(50000);
      expect(size).toBeLessThan(150000);
    }
    const paths = ['mobile/lib/interviewArtwork.ts', 'mobile/lib/lessonNavigation.tsx', 'mobile/lesson-kit/glossary.ts',
      'mobile/lesson-kit/components/ColorText.tsx', 'mobile/lesson-kit/components/ReadingCopy.tsx',
      'mobile/lesson-kit/components/BriefingReader.tsx', 'mobile/lesson-kit/modules/ColdOpen.tsx',
      'mobile/lesson-kit/modules/MicroInsight.tsx', 'mobile/lesson-kit/exercises/InfoCard.tsx',
      'mobile/lesson-kit/sequencer/buildBeats.ts', 'mobile/app/(tabs)/_layout.tsx', 'mobile/app/(tabs)/home.tsx'];
    for (const path of paths) {
      const js = read(path.replace(/\.tsx?$/, '.js'));
      expect(js, path).toBe(transform(read(path), path.endsWith('tsx') ? 'tsx' : 'ts', 'esm'));
      if (js.includes('React.createElement')) expect(js).toContain('import React');
    }
  });
});