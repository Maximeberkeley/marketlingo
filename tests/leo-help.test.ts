import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { leoCallStarters } from '../mobile/lib/leoCallStarters';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');

// LeoHintBubble imports react-native, so its pure rule is checked through the source here.
const hintRule = read('mobile/lesson-kit/components/LeoHintBubble.tsx');

describe('Leo call starters', () => {
  it('lead with the saved interview, then today’s lesson', () => {
    expect(leoCallStarters({ company: 'SpaceX', lessonTitle: 'Who really builds an airliner' })).toEqual([
      'Help me practice for my SpaceX interview',
      "Explain today's lesson more simply",
      'Quiz me on Who really builds an airliner',
    ]);
    expect(leoCallStarters({})).toEqual([
      'Help me prepare for an interview',
      "Explain today's lesson more simply",
      "Quiz me on today's lesson",
    ]);
  });

  it('show until the learner says something, send on tap, and lift the subtitle above them', () => {
    const call = read('mobile/components/ai/LeoVoiceChatOverlay.tsx');
    expect(call).toContain('const showStarters = messages.length === 0 && !isGenerating && !isRecording && !isTranscribing && !showTextInput;');
    expect(call).toContain("onPress={() => { triggerHaptic('light'); sendToLeo(starter); }}");
    expect(call).toContain('insets.bottom + 154 + (showStarters ? STARTER_ROW_HEIGHT : 0)');
    expect(call).toContain('loadInterviewTarget(user?.id, marketId)');
    expect(read('mobile/app/(tabs)/home.tsx')).toContain('lessonTitle={lessonStack?.title}');
  });
});

describe('one-time hint pointing at Leo in quizzes', () => {
  it('only shows on an unanswered graded question, once', () => {
    expect(hintRule).toContain("return !seen && !passive && phase === 'answering' && !leoOpen;");
    expect(hintRule).toContain("export const LEO_HINT_KEY = '@marketlingo/leo_quiz_hint_seen';");
    expect(hintRule).toContain('Stuck? Tap me for a simpler explanation.');
    const lesson = read('mobile/lesson-kit/screens/LessonScreen.tsx');
    expect(lesson).toContain('const showLeoHint = shouldShowLeoHint(leoHintSeen, isInfo || !exercise, phase, showAskLeo);');
    expect(lesson).toContain("if (!leoHintSeen && phase === 'feedback' && !isInfo) markLeoHintSeen();");
    expect(lesson).toContain('onAskLeo={() => { markLeoHintSeen(); openLeo(); }}');
  });
});

describe('Leo’s help panel fits iPads and Split View', () => {
  it('wraps the shortcut cards into a grid and centres a capped-width panel', () => {
    const panel = read('mobile/components/ai/AskLeoOverlay.tsx');
    expect(panel).toContain('const modeColumns = panelW >= 560 ? 4 : 2;');
    expect(panel).toContain('<View style={styles.modeGrid}>');
    expect(panel).toContain('const PANEL_MAX_WIDTH = 680;');
    expect(panel).toContain("containerLarge: { maxHeight: '92%' }");
  });
});

describe('JavaScript copies for Leo help', () => {
  it('match their source and import React when they use it', () => {
    for (const [path, loader] of [
      ['lib/leoCallStarters', 'ts'], ['lesson-kit/components/LeoHintBubble', 'tsx'], ['lesson-kit/screens/LessonScreen', 'tsx'],
      ['components/ai/AskLeoOverlay', 'tsx'], ['components/ai/LeoVoiceChatOverlay', 'tsx'], ['app/(tabs)/home', 'tsx'],
    ]) {
      const js = read(`mobile/${path}.js`);
      expect(js).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js).toMatch(/import React\b/);
    }
  }, 30000);
});
