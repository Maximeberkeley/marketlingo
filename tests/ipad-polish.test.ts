import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { answerTag, choiceStateFor } from '../mobile/lesson-kit/components/answerState';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');

describe('Market Map writing bar shows the whole section title', () => {
  it('wraps to two lines and shrinks instead of cutting the title off', () => {
    const src = read('mobile/app/deliverable.tsx');
    expect(src).toContain('<Text style={styles.accessoryTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>');
    expect(src).not.toContain('accessoryTitle} numberOfLines={1}');
  });
});

describe('Intel stories follow the live window on iPad', () => {
  it('sizes the story overlay from the current window and safe area, not launch size', () => {
    const overlay = read('mobile/components/home/ImmersiveNewsOverlay.tsx');
    expect(overlay).not.toMatch(/Dimensions\.get|SCREEN_W|SCREEN_H|TOP_PADDING|BOTTOM_PADDING/);
    expect(overlay).toContain('useWindowDimensions()');
    expect(overlay).toContain('paddingTop: Math.max(insets.top, 20) + 12');
    expect(overlay).toContain('export const STORY_COLUMN_MAX = 720;');
    expect(overlay).toContain('<View style={[st.column, st.titleContainer]}>');
  });

  it('sizes the featured carousel and sheets from the current window', () => {
    const news = read('mobile/components/home/DailyNews.tsx');
    expect(news).not.toMatch(/SCREEN_WIDTH|SCREEN_HEIGHT/);
    expect(news).toContain('const FEATURED_CARD_WIDTH = featuredCardWidth(useWindowDimensions().width);');
    expect(news).toContain('return Math.max(240, Math.min(windowWidth - 32, 720));');
    expect(news).toContain("maxHeight: '85%',");
    expect(news.match(/maxWidth: SHEET_MAX_WIDTH/g)?.length).toBe(2);
  });
});

describe('picked, right and wrong answers look different, not only by colour', () => {
  it('gives each row one state', () => {
    expect([0, 1, 2].map(i => choiceStateFor(i, 1, 0, false))).toEqual(['idle', 'selected', 'idle']);
    expect([0, 1, 2].map(i => choiceStateFor(i, 1, 0, true))).toEqual(['correct', 'incorrect', 'idle']);
    expect([0, 1, 2].map(i => choiceStateFor(i, 0, 0, true))).toEqual(['correct', 'idle', 'idle']);
    expect([0, 1].map(i => choiceStateFor(i, null, 1, true))).toEqual(['idle', 'correct']);
  });

  it('says whose answer each graded row is', () => {
    expect([0, 1, 2].map(i => answerTag(i, 1, 0, true))).toEqual(['Right answer', 'Your answer', null]);
    expect([0, 1].map(i => answerTag(i, 0, 0, true))).toEqual(['Your answer', null]);
    expect(answerTag(0, 0, 0, false)).toBeNull();
    expect([0, 1].map(i => answerTag(i, 1, 0, true, 'The fake'))).toEqual(['The fake', 'Your answer']);
    expect(answerTag(0, 0, 0, true, 'The fake')).toBe('The fake · your answer');
  });

  it('marks each state with its own icon and tag, full width, in every choice module', () => {
    const mark = read('mobile/lesson-kit/components/AnswerMark.tsx');
    expect(mark).toContain('name="check-circle"');
    expect(mark).toContain('name="x-circle"');
    expect(mark).toContain("state === 'selected' && <View style={styles.dot} />");
    for (const file of ['components/ChoiceCard', 'modules/TheCall', 'modules/FaceOff', 'modules/MapMarket', 'modules/SpotTheFake']) {
      const src = read(`mobile/lesson-kit/${file}.tsx`);
      expect(src, file).toContain('<AnswerMark state={state} revealed={');
      expect(src, file).toMatch(/AnswerTag text=\{/);
    }
    const map = read('mobile/lesson-kit/modules/MapMarket.tsx');
    expect(map).not.toContain("width: '78%'");
    expect(map).not.toMatch(/nodeLeft|nodeRight:/);
    expect(read('mobile/lesson-kit/exercises/MultipleChoice.tsx')).toContain('tag={answerTag(i, selected, exercise.correctIndex, revealed)}');
  });
});

describe('JavaScript copies for the iPad and answer-state pass', () => {
  it('match their source and import React when they use it', () => {
    for (const [path, loader] of [
      ['lesson-kit/components/answerState', 'ts'], ['lesson-kit/components/AnswerMark', 'tsx'], ['lesson-kit/components/ChoiceCard', 'tsx'],
      ['lesson-kit/exercises/MultipleChoice', 'tsx'], ['lesson-kit/modules/TheCall', 'tsx'], ['lesson-kit/modules/FaceOff', 'tsx'],
      ['lesson-kit/modules/MapMarket', 'tsx'], ['lesson-kit/modules/SpotTheFake', 'tsx'], ['components/home/DailyNews', 'tsx'],
      ['components/home/ImmersiveNewsOverlay', 'tsx'], ['app/deliverable', 'tsx'],
    ]) {
      const js = read(`mobile/${path}.js`);
      expect(js).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js).toMatch(/import React\b/);
    }
  }, 60000);
});
