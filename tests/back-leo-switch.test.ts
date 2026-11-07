import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { todaysCredit } from '../mobile/lib/courseSections';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');

describe('switching industry back does not strand today’s lesson', () => {
  const lessons = [{ day: 1, stackId: 'd1' }, { day: 3, stackId: 'd3' }, { day: 9, stackId: 'd9' }];

  it('keeps today’s finished lesson when it is on the course clock', () => {
    expect(todaysCredit(lessons, true, 'd3', 9)).toEqual({ done: true, lesson: lessons[1] });
    expect(todaysCredit(lessons, true, 'd9', 9)).toEqual({ done: true, lesson: lessons[2] });
  });

  it('ignores a lesson finished earlier today that sits past a restarted clock', () => {
    // Day 9 finished this morning, then the learner switched industry and back: the clock is at day 1.
    expect(todaysCredit(lessons, true, 'd9', 1)).toEqual({ done: false });
  });

  it('changes nothing when today is not done or the lesson is not in this course', () => {
    expect(todaysCredit(lessons, false, 'd1', 9)).toEqual({ done: false });
    expect(todaysCredit(lessons, true, 'other', 1)).toEqual({ done: true, lesson: undefined });
    expect(todaysCredit([], true, 'd9', 1)).toEqual({ done: true, lesson: undefined });
  });

  it('uses the rule on Home, and a finished lesson can always be reopened', () => {
    const src = read('mobile/components/course/CourseJourney.tsx');
    expect(src).toContain('const { done: lessonCompletedToday } = todaysCredit(lessons, lessonCreditedToday, completedTodayStackId, currentDay);');
    expect(src).toContain('if (lesson?.stackId && (lesson.day <= currentDay || lesson.completed)) onOpenLesson(lesson.stackId, lesson.day);');
  });
});

describe('Back in lessons', () => {
  it('is a small underlined link under the main button, from the second card on', () => {
    const src = read('mobile/lesson-kit/screens/LessonScreen.tsx');
    const button = src.indexOf('<PrimaryButton label={buttonLabel} onPress={onAction} variant={buttonVariant} />');
    const back = src.indexOf('<Text style={styles.backLinkText}>Back</Text>');
    expect(button).toBeGreaterThan(0);
    expect(back).toBeGreaterThan(button);
    expect(src.slice(button, back)).toContain('{index > 0 && (');
    expect(src).toContain("backLinkText: { fontSize: 13, fontWeight: '500', color: tokens.color.text, textDecorationLine: 'underline' },");
  });

  it('returns to the previous card as it was, so answers are never scored twice', () => {
    const src = read('mobile/lesson-kit/screens/LessonScreen.tsx');
    expect(src).toContain('goToBeat(index - 1);');
    expect(src).toContain('if (index >= maxIndexReached) {');
  });
});

describe('Leo keeps animating', () => {
  it('only treats a backgrounded app as not in the foreground', () => {
    const src = read('mobile/components/mascot/useLeoMotion.ts');
    expect(src).toContain("export const isForegroundState = (state: string | null | undefined) => state !== 'background';");
    expect(src).toContain('useState(isForegroundState(AppState.currentState))');
    expect(src).toContain("setForeground(isForegroundState(state))");
    expect(src).not.toContain("=== 'active'");
  });

  it('retries a clip with iOS’s own decoder before falling back to the still, and reports failures', () => {
    const src = read('mobile/components/mascot/LeoAnimated.tsx');
    expect(src).toContain('useAppleWebpCodec={appleCodec}');
    expect(src).toContain("trackEvent('leo_clip_failed', { clip: layer.clip, codec: appleCodec ? 'apple' : 'webp' });");
    expect(src.indexOf('if (!appleCodec) { setAppleCodec(true); return; }')).toBeLessThan(src.indexOf('setFailed(true);\n          onEnd?.();'));
    expect(src).toContain('// libwebp first');
    expect(read('mobile/lib/analytics.ts')).toContain("| 'leo_clip_failed'");
  });

  it('still respects Reduce Motion', () => {
    expect(read('mobile/components/mascot/useLeoMotion.ts')).toContain('allowed: !paused && foreground && !reduceMotion');
  });
});

describe('JavaScript copies for Back, Leo and the switch fix', () => {
  it('match their source and import React when they use it', () => {
    for (const [path, loader] of [
      ['lib/courseSections', 'ts'], ['components/course/CourseJourney', 'tsx'], ['lesson-kit/screens/LessonScreen', 'tsx'],
      ['components/mascot/useLeoMotion', 'ts'], ['components/mascot/LeoAnimated', 'tsx'], ['lib/analytics', 'ts'],
    ]) {
      const js = read(`mobile/${path}.js`);
      expect(js).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js).toMatch(/import React\b/);
    }
  }, 60000);
});
