import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { execFileSync } from 'node:child_process';
import { leoAnimationDelay, leoCallClip, leoDoneKey, leoCoachClip } from '../mobile/components/mascot/leoAnimationRules';

const read = (path: string) => readFileSync(path, 'utf8');
const transformSync = (source: string, options: any) => ({ code: execFileSync(process.execPath,
  ['--input-type=module', '-e', `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, ${JSON.stringify(options)}).code);`], { encoding: 'utf8' }) });
function harness(path: string, imports: Record<string, any>, extra = '') {
  const slots: any[] = []; let cursor = 0;
  let pending: Array<() => void> = [];
  const react: any = {
    createElement: (type: any, props: any, ...children: any[]) => ({ type, props: { ...props, children } }),
    useRef: (initial: any) => { const i = cursor++; return slots[i] ?? (slots[i] = { current: initial }); },
    useState: (initial: any) => {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], (value: any) => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useCallback: (fn: any) => { cursor++; return fn; },
    useMemo: (fn: any) => { cursor++; return fn(); },
    useEffect: (fn: any, deps: any[]) => {
      const i = cursor++; const previous = slots[i];
      if (!previous || deps.some((v, index) => !Object.is(v, previous.deps[index]))) {
        slots[i] = { deps, cleanup: previous?.cleanup };
        pending.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); });
      }
    },
  };
  const module = { exports: {} as any };
  const code = transformSync(read(path) + extra, { loader: path.endsWith('tsx') ? 'tsx' : 'ts', jsx: 'transform', format: 'cjs' }).code;
  runInNewContext(code, { module, exports: module.exports, require: (name: string) => name === 'react' ? react : imports[name],
    setTimeout, clearTimeout, setInterval, clearInterval, Math, Set, console });
  return {
    render: (name: string, props: any) => { cursor = 0; const result = module.exports[name](props); const effects = pending; pending = []; effects.forEach(fn => fn()); return result; },
    unmount: () => { slots.forEach(slot => slot?.cleanup?.()); },
  };
}

function homeHarness() {
  vi.useFakeTimers();
  let motion = true;
  const saved = new Map<string, string>();
  const onLeo = vi.fn(); const onCelebrated = vi.fn(); const haptic = vi.fn(async () => {});
  const h = harness('mobile/components/mascot/useLeoAnimations.ts', {
    '@react-native-async-storage/async-storage': { getItem: async (key: string) => saved.get(key), setItem: async (key: string, value: string) => { saved.set(key, value); } },
    '../../lib/haptics': { triggerHaptic: haptic },
    './leoAnimationRules': { leoAnimationDelay },
    './useLeoMotion': { useLeoMotion: () => motion, useLeoMotionState: () => ({ allowed: motion, ready: true, foreground: true }) },
  });
  const props = { done: false, active: true, focused: true, callOpen: false, doneKey: 'learner/aerospace/day1', celebrate: false, onLeo, onCelebrated };
  return { props, saved, onLeo, onCelebrated, haptic, motion: (value: boolean) => { motion = value; },
    render: () => h.render('useHomeLeo', props), onboarding: (paused = false) => h.render('useOnboardingLeo', paused), unmount: h.unmount };
}
afterEach(() => vi.useRealTimers());

function practiceHarness(screen: 'Arena' | 'Case') {
  const motion = { start: () => {}, stop: () => {} };
  const animated = { Value: class { setValue() {} interpolate() { return 0; } },
    timing: () => motion, spring: () => motion, sequence: () => motion, View: 'view', Text: 'text' };
  const exercise = { kind: 'multipleChoice', options: ['A', 'B'], correctIndex: 0,
    leo: { line: 'Read the evidence before you choose a side.', mood: 'idle' } };
  const h = harness(`mobile/lesson-kit/${screen === 'Arena' ? 'arena/ArenaScreen' : 'case/CaseScreen'}.tsx`, {
    'react-native': { View: 'view', Text: 'text', ScrollView: 'scroll', TouchableOpacity: 'touch', Modal: 'modal',
      StyleSheet: { create: (s: any) => s }, Animated: animated, Easing: { linear: 0, quad: 0, out: () => 0 } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    '@expo/vector-icons': { Feather: 'icon' }, 'expo-linear-gradient': { LinearGradient: 'gradient' },
    'expo-haptics': { notificationAsync: async () => {}, impactAsync: async () => {},
      NotificationFeedbackType: {}, ImpactFeedbackStyle: {} },
    '../theme/tokens': { tokens: { color: {}, space: {}, font: {}, radius: {} } },
    '../components/PrimaryButton': { PrimaryButton: 'button' }, '../components/FeedbackFooter': { FeedbackFooter: 'feedback' },
    '../components/LeoCoach': { LeoCoach: 'coach' },
    '../practice/studiedMaterial': { practiceSourceLabel: () => '' },
    '../components/ExerciseRenderer': { isPassiveKind: () => false,
      renderExerciseByKind: (_ex: any, _phase: any, setState: any) => ({ type: 'answer', props: { setState } }) },
    './buildArena': {}, './buildCase': {}, '../../lib/sounds': { playSound: async () => {} },
    '../../lib/analytics': { trackEvent: () => {} },
    '../../data/marketWorlds': { getMarketWorld: () => ({ colors: [] }) }, '../components/BriefingReader': {},
  });
  const props = screen === 'Arena' ? { waves: [{ key: 'core', seconds: 20, multiplier: 1, exercises: [exercise] }], bestScore: 0 }
    : { deepCase: { id: 'case', stages: [{ key: 'evidence', exercise }] } };
  const nodes = (node: any): any[] => !node || typeof node !== 'object' ? [] : Array.isArray(node)
    ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
  const render = () => nodes(h.render(`${screen}Screen`, props));
  const find = (type: string) => render().find(n => n.type === type);
  return { render, find, unmount: h.unmount };
}

describe('Graded practice reactions', () => {
  for (const screen of ['Arena', 'Case'] as const) {
    for (const isCorrect of [true, false]) {
      it(`${screen} reacts to a ${isCorrect ? 'right' : 'wrong'} answer without changing the verdict`, () => {
        vi.useFakeTimers(); const h = practiceHarness(screen);
        if (screen === 'Arena') h.render().find(n => n.type === 'touch' && n.props.activeOpacity === 0.9).props.onPress();
        expect(h.find('coach').props.intro).toBe(true);
        expect(h.find('coach').props.mood).toBe('idle');
        h.find('answer').props.setState({ canCheck: true, isCorrect });
        h.find('button').props.onPress();
        expect(h.find('coach').props.mood).toBe(isCorrect ? 'correct' : 'incorrect');
        expect(h.find('feedback').props.isCorrect).toBe(isCorrect);
        h.unmount();
      });
    }
  }
  it('Arena timeout encourages even with a correct selection not submitted', async () => {
    vi.useFakeTimers(); const h = practiceHarness('Arena');
    h.render().find(n => n.type === 'touch' && n.props.activeOpacity === 0.9).props.onPress();
    h.find('answer').props.setState({ canCheck: true, isCorrect: true });
    await vi.advanceTimersByTimeAsync(20000);
    expect(h.find('coach').props.mood).toBe('incorrect');
    h.unmount();
  });
});

describe('Animated Leo rules', () => {
  for (const extension of ['tsx', 'js']) {
    function tourHarness() {
      const h = harness(`mobile/components/onboarding/FeatureTour.${extension}`, {
        'react-native': { View: 'view', Text: 'text', Modal: 'modal', TouchableOpacity: 'touch',
          StyleSheet: { create: (value: any) => value }, useWindowDimensions: () => ({ height: 667 }) },
        'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 20, bottom: 0 }) },
        '@expo/vector-icons': { Feather: 'icon' }, '../../lib/constants': { COLORS: {} },
        '../../lib/markets': { getMarketName: () => 'Aerospace' },
        '../mascot/LeoAnimated': { LeoAnimated: 'animated-leo' },
      });
      const props = { visible: true, onComplete: vi.fn() };
      const flatten = (node: any): any[] => !node || typeof node !== 'object' ? [] : Array.isArray(node)
        ? node.flatMap(flatten) : [node, ...flatten(node.props?.children)];
      const render = () => flatten(h.render('FeatureTour', props));
      const leo = () => render().find(node => node.type === 'animated-leo').props;
      const next = () => render().filter(node => node.type === 'touch')[1].props.onPress();
      return { props, render, leo, next, unmount: h.unmount };
    }
    it(`tour ${extension} greets once and keeps idle across intermediate pages`, () => {
      const h = tourHarness();
      expect(h.leo().clip).toBe('leo-greet');
      h.leo().onEnd();
      expect(h.leo().clip).toBe('leo-idle-loop');
      h.next(); expect(h.leo().clip).toBe('leo-idle-loop');
      h.next(); expect(h.leo().clip).toBe('leo-play');
      h.leo().onEnd(); expect(h.leo().clip).toBe('leo-idle-loop');
      for (let i = 0; i < 2; i++) { h.next(); expect(h.leo().clip).toBe('leo-idle-loop'); }
      expect(h.props.onComplete).not.toHaveBeenCalled(); h.unmount();
    });
    it(`tour ${extension} plays the tail-chase treat once on the Practice page only`, () => {
      const h = tourHarness(); h.leo().onEnd();
      h.next(); h.next();
      expect(h.leo().clip).toBe('leo-play');
      h.leo().onEnd(); expect(h.leo().clip).toBe('leo-idle-loop');
      h.next(); h.next(); h.next();
      expect(h.leo().clip).toBe('leo-ready');
      h.leo().onEnd(); expect(h.leo().clip).toBe('leo-idle-loop');
      expect(h.props.onComplete).not.toHaveBeenCalled(); h.unmount();
    });
    it(`tour ${extension} plays ready once on page six and completes only on Start learning`, () => {
      const h = tourHarness(); h.leo().onEnd();
      for (let i = 0; i < 5; i++) h.next();
      h.render(); expect(h.leo().clip).toBe('leo-ready');
      h.leo().onEnd(); expect(h.leo().clip).toBe('leo-idle-loop');
      expect(h.props.onComplete).not.toHaveBeenCalled();
      h.next(); expect(h.props.onComplete).toHaveBeenCalledTimes(1); h.unmount();
    });
    it(`tour ${extension} pauses hidden playback and greets again on reopen`, () => {
      const h = tourHarness(); h.leo().onEnd();
      h.props.visible = false; expect(h.leo().paused).toBe(true);
      h.leo().onEnd(); expect(h.leo().clip).toBe('leo-idle-loop');
      h.props.visible = true; h.render();
      expect(h.leo().paused).toBe(false); expect(h.leo().clip).toBe('leo-greet'); h.unmount();
    });
    it(`tour ${extension} preserves Skip and modal-close completion`, () => {
      const h = tourHarness();
      h.render().find(node => node.type === 'touch').props.onPress();
      expect(h.props.onComplete).toHaveBeenCalledTimes(1);
      h.render().find(node => node.type === 'modal').props.onRequestClose();
      expect(h.props.onComplete).toHaveBeenCalledTimes(2); h.unmount();
    });
  }
  it('uses all eighteen supplied clip lengths and native assets', () => {
    const metadata = JSON.parse(read('mobile/assets/mascot/anim/clips.json'));
    const module = { exports: {} as any };
    runInNewContext(transformSync(read('mobile/components/mascot/leoClips.ts'), { loader: 'ts', format: 'cjs' }).code,
      { module, exports: module.exports, require: (path: string) => path });
    expect(Object.keys(module.exports.leoClips)).toHaveLength(18);
    for (const [clip, spec] of Object.entries(metadata)) {
      expect(module.exports.leoClips[clip]).toMatchObject(spec);
      expect(existsSync(`mobile/assets/mascot/anim/${clip}.webp`)).toBe(true);
    }
  });
  it('uses ready only for idle intros, encouragement for mistakes and success for right answers', () => {
    expect(leoCoachClip('idle', true)).toBe('leo-ready');
    expect(leoCoachClip('idle', false)).toBe(null);
    expect(leoCoachClip('thinking', true)).toBe(null);
    expect(leoCoachClip('incorrect', true)).toBe('leo-encourage');
    expect(leoCoachClip('correct', true)).toBe('leo-success');
    expect(leoCoachClip('celebrate', false)).toBe('leo-success');
  });
  it('greets on welcome then settles into idle without recurring play', () => {
    const h = harness('mobile/app/onboarding/welcome.tsx', {
      'react-native': { StyleSheet: { create: (v: any) => v } },
      'expo-router': {}, 'react-native-safe-area-context': {},
      '../../lib/constants': { COLORS: {}, SHADOWS: {} }, '../../hooks/useAuth': {},
      '../../lib/displayName': {}, '../../lib/storage': {}, '../../lib/supabase': {},
      '@react-navigation/native': { useIsFocused: () => true },
      '../../components/mascot/LeoAnimated': { LeoAnimated: 'animated-leo' },
      '../../lib/haptics': {}, '../../lib/sounds': {},
    }, '\nexport { WelcomeLeo };');
    expect(h.render('WelcomeLeo', {}).props.clip).toBe('leo-greet');
    h.render('WelcomeLeo', {}).props.onEnd();
    expect(h.render('WelcomeLeo', {}).props.clip).toBe('leo-idle-loop');
    h.unmount();
  });
  it('holds success after 2000 ms instead of swapping back to a still image', async () => {
    vi.useFakeTimers(); const stop = vi.fn(async () => {}); const end = vi.fn();
    const h = harness('mobile/components/mascot/LeoAnimated.tsx', {
      'react-native': { StyleSheet: { absoluteFill: {} }, View: 'view', Image: 'static' },
      'expo-image': { Image: 'image' }, './LeoCharacter': { LeoCharacter: 'leo' },
      './leoClips': { leoClips: { 'leo-success': { source: 1, ms: 2000, loop: false } } },
      './useLeoMotion': { useLeoMotion: () => true },
    }, '\nexport { ClipLayer };');
    const props = { clip: 'leo-success', onEnd: end, onLoad: vi.fn(), onError: vi.fn() };
    const layer = h.render('ClipLayer', props);
    layer.props.ref.current = { stopAnimating: stop };
    layer.props.onLoad();
    await vi.advanceTimersByTimeAsync(1999); expect(stop).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1); expect(stop).toHaveBeenCalledTimes(1);
    expect(h.render('ClipLayer', props).props.source).toBe(1);
    await vi.advanceTimersByTimeAsync(6000); expect(end).toHaveBeenCalledTimes(1);
    h.unmount();
  });
  it('keeps peeks between 12–20 seconds', () => {
    expect(leoAnimationDelay('peek', 0)).toBe(25000);
    expect(leoAnimationDelay('peek', 0.9999)).toBe(39998);
  });
  it('keeps onboarding play between 10–15 seconds', () => {
    expect(leoAnimationDelay('play', 0)).toBe(10000);
    expect(leoAnimationDelay('play', 0.9999)).toBe(14999);
  });
  it('scopes the daily celebration by learner, market and local day', () => {
    expect(leoDoneKey('learner', 'aerospace', '2026-11-1')).toBe('@marketlingo/leo-done-anim/learner/aerospace/2026-11-1');
    expect(leoDoneKey(undefined, 'ai', '2026-11-2')).toBe('@marketlingo/leo-done-anim/guest/ai/2026-11-2');
  });
  it('uses existing generating/speaking state in priority order', () => {
    expect(leoCallClip(true, true)).toBe('leo-call-think');
    expect(leoCallClip(false, true)).toBe('leo-teach-loop');
    expect(leoCallClip(false, true, true)).toBe('leo-call-talk');
    expect(leoCallClip(true, true, true)).toBe('leo-call-think');
    expect(leoCallClip(false, false)).toBe('leo-call-listen');
  });
  it('opens eyes on tap, opens the call when that clip ends, and closes eyes after', async () => {
    const h = homeHarness();
    h.render().onTap();
    expect(h.haptic).toHaveBeenCalledWith('light');
    expect(h.render().clip).toBe('leo-eyes-open');
    await vi.advanceTimersByTimeAsync(800); expect(h.onLeo).not.toHaveBeenCalled();
    h.render().onEnd(); expect(h.onLeo).toHaveBeenCalledTimes(1);
    h.props.callOpen = true; h.motion(false); h.render();
    h.props.callOpen = false; h.motion(true); h.render();
    expect(h.render().clip).toBe('leo-eyes-close');
    h.render().onEnd(); expect(h.render().clip).toBe('leo-sleep-loop');
    h.unmount();
  });
  it('opens immediately when today is done', () => {
    const h = homeHarness(); h.props.done = true;
    h.render().onTap(); expect(h.onLeo).toHaveBeenCalledTimes(1);
    h.unmount();
  });
  it('cancels a pending wake when Home loses focus', async () => {
    const h = homeHarness(); h.render().onTap();
    h.props.focused = false; h.motion(false); h.render();
    await vi.advanceTimersByTimeAsync(1000); expect(h.onLeo).not.toHaveBeenCalled();
    h.unmount();
  });
  it('peeks while sleeping and returns to the sleeping loop', async () => {
    const h = homeHarness(); h.render();
    await vi.advanceTimersByTimeAsync(40000);
    expect(h.render().clip).toBe('leo-peek');
    h.render().onEnd(); expect(h.render().clip).toBe('leo-sleep-loop');
    h.unmount();
  });
  it('waits for focused Home and celebrates at most once per local day', async () => {
    const h = homeHarness(); h.render();
    h.props.done = true; h.props.celebrate = true; h.props.focused = false; h.render();
    await Promise.resolve(); expect(h.saved.size).toBe(0);
    h.props.focused = true; h.render(); await vi.advanceTimersByTimeAsync(0);
    expect(h.render().clip).toBe('leo-done');
    expect(h.saved.get(h.props.doneKey)).toBe('seen');
    h.render().onEnd(); expect(h.render().clip).toBe('leo-reading-loop');
    expect(h.onCelebrated).toHaveBeenCalledTimes(1);
    h.props.focused = false; h.render(); h.props.focused = true; h.render();
    await Promise.resolve(); expect(h.render().clip).toBe('leo-reading-loop');
    h.unmount();
  });
  it('plays the tail-chase once after 30 s on an onboarding screen, then never again', async () => {
    const h = homeHarness(); h.onboarding();
    await vi.advanceTimersByTimeAsync(29999); expect(h.onboarding().clip).toBe('leo-idle-loop');
    await vi.advanceTimersByTimeAsync(1); expect(h.onboarding().clip).toBe('leo-play');
    h.onboarding().onEnd(); expect(h.onboarding().clip).toBe('leo-idle-loop');
    await vi.advanceTimersByTimeAsync(60000); expect(h.onboarding().clip).toBe('leo-idle-loop');
    h.unmount();
  });
  it('starts one-off end timing only after load and stops playback at the duration', async () => {
    vi.useFakeTimers(); const stop = vi.fn(async () => {}); const end = vi.fn(); const load = vi.fn();
    const h = harness('mobile/components/mascot/LeoAnimated.tsx', {
      'react-native': { StyleSheet: { absoluteFill: {} }, View: 'view', Image: 'static' },
      'expo-image': { Image: 'image' }, './LeoCharacter': { LeoCharacter: 'leo' },
      './leoClips': { leoClips: { 'leo-peek': { source: 1, ms: 2667, loop: false } } },
      './useLeoMotion': { useLeoMotion: () => true },
    }, '\nexport { ClipLayer };');
    const image = h.render('ClipLayer', { clip: 'leo-peek', onEnd: end, onLoad: load, onError: vi.fn() });
    image.props.ref.current = { stopAnimating: stop };
    await vi.advanceTimersByTimeAsync(5000); expect(end).not.toHaveBeenCalled();
    image.props.onLoad(); expect(load).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2666); expect(end).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1); expect(end).toHaveBeenCalledTimes(1); expect(stop).toHaveBeenCalledTimes(1);
    h.unmount();
  });
  it('cancels one-off completion timers on unmount', async () => {
    vi.useFakeTimers(); const end = vi.fn();
    const h = harness('mobile/components/mascot/LeoAnimated.tsx', {
      'react-native': { StyleSheet: { absoluteFill: {} }, View: 'view', Image: 'static' },
      'expo-image': { Image: 'image' }, './LeoCharacter': { LeoCharacter: 'leo' },
      './leoClips': { leoClips: { 'leo-wake': { source: 1, ms: 2000, loop: false } } },
      './useLeoMotion': { useLeoMotion: () => true },
    }, '\nexport { ClipLayer };');
    const layer = h.render('ClipLayer', { clip: 'leo-wake', onEnd: end, onLoad: vi.fn(), onError: vi.fn() });
    layer.props.onLoad(); h.unmount();
    await vi.advanceTimersByTimeAsync(3000); expect(end).not.toHaveBeenCalled();
  });
  it('disables motion for reduced motion, pause or background and restores on return', async () => {
    let reduce = false; const listeners: Record<string, any> = {};
    const h = harness('mobile/components/mascot/useLeoMotion.ts', {
      'react-native': {
        AccessibilityInfo: { isReduceMotionEnabled: async () => reduce, addEventListener: (name: string, fn: any) => { listeners[name] = fn; return { remove: vi.fn() }; } },
        AppState: { currentState: 'active', addEventListener: (name: string, fn: any) => { listeners[name] = fn; return { remove: vi.fn() }; } },
      },
    });
    expect(h.render('useLeoMotion', false)).toBe(false);
    await Promise.resolve(); await Promise.resolve(); expect(h.render('useLeoMotion', false)).toBe(true);
    expect(h.render('useLeoMotion', true)).toBe(false);
    listeners.change('background'); expect(h.render('useLeoMotion', false)).toBe(false);
    listeners.change('active'); expect(h.render('useLeoMotion', false)).toBe(true);
    listeners.reduceMotionChanged(true); expect(h.render('useLeoMotion', false)).toBe(false);
    h.unmount();
  });
  it('keeps the displayed clip until its replacement loads and falls back after errors', () => {
    const h = harness('mobile/components/mascot/LeoAnimated.tsx', {
      'react-native': { StyleSheet: { absoluteFill: {} }, View: 'view', Image: 'static' },
      'expo-image': { Image: 'image' }, './LeoCharacter': { LeoCharacter: 'leo' },
      './leoClips': { leoClips: {} }, './useLeoMotion': { useLeoMotion: () => true },
    }, '\nexport { ClipPlayer };');
    const props = { clip: 'leo-sleep-loop', size: 144, fallback: 'sleeping', onEnd: vi.fn() };
    const flatten = (node: any): any[] => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(flatten) : [node, ...flatten(node.props?.children)];
    const layers = () => flatten(h.render('ClipPlayer', props)).filter(node => node.props?.clip);
    layers()[0].props.onLoad();
    props.clip = 'leo-peek'; h.render('ClipPlayer', props);
    expect(layers().map(layer => layer.props.clip)).toEqual(['leo-sleep-loop', 'leo-peek']);
    layers()[1].props.onLoad(); expect(layers().map(layer => layer.props.clip)).toEqual(['leo-peek']);
    layers()[0].props.onError(); expect(layers()).toHaveLength(0);
    expect(props.onEnd).toHaveBeenCalledTimes(1);
    h.unmount();
  });
});
import { leoFeedbackLine } from '../mobile/components/mascot/leoAnimationRules';
describe('practice feedback lines', () => {
  it('uses short lines of about eight words for right and wrong answers', () => {
    for (let i = 0; i < 4; i++) for (const c of [true, false]) {
      const words = leoFeedbackLine(c, i).split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(6); expect(words).toBeLessThanOrEqual(10);
    }
    expect(leoFeedbackLine(true, 0)).not.toBe(leoFeedbackLine(false, 0));
  });
});

import { shouldPlayLeoTreat, leoMorningKey } from '../mobile/components/mascot/leoAnimationRules';
describe('leo-play treat', () => {
  it('plays on a streak milestone, once that day', () => {
    expect(shouldPlayLeoTreat(7, '2026-10-30', '2026-11-01', 0.99)).toBe(true);
    expect(shouldPlayLeoTreat(7, '2026-11-01', '2026-11-01', 0)).toBe(false);
  });
  it('otherwise plays 1 in 10 with at most one per 7 days', () => {
    expect(shouldPlayLeoTreat(5, null, '2026-11-01', 0.05)).toBe(true);
    expect(shouldPlayLeoTreat(5, null, '2026-11-01', 0.1)).toBe(false);
    expect(shouldPlayLeoTreat(5, '2026-10-27', '2026-11-01', 0)).toBe(false);
    expect(shouldPlayLeoTreat(5, '2026-10-25', '2026-11-01', 0)).toBe(true);
  });
  it('scopes the morning wake-up to learner, market and local day', () => {
    expect(leoMorningKey('u1', 'aerospace', '2026-11-1')).toBe('@marketlingo/leo-morning/u1/aerospace/2026-11-1');
    expect(leoMorningKey(undefined, 'ai', 'd')).toBe('@marketlingo/leo-morning/guest/ai/d');
  });
});
