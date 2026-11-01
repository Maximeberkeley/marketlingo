import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { execFileSync } from 'node:child_process';
import { leoAnimationDelay, leoCallClip, leoDoneKey } from '../mobile/components/mascot/leoAnimationRules';

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
    setTimeout, clearTimeout, Math, Set, console });
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

describe('Animated Leo rules', () => {
  it('uses the eleven supplied clip lengths and native assets', () => {
    const metadata = JSON.parse(read('mobile/assets/mascot/anim/clips.json'));
    const module = { exports: {} as any };
    runInNewContext(transformSync(read('mobile/components/mascot/leoClips.ts'), { loader: 'ts', format: 'cjs' }).code,
      { module, exports: module.exports, require: (path: string) => path });
    expect(Object.keys(module.exports.leoClips)).toHaveLength(11);
    for (const [clip, spec] of Object.entries(metadata)) {
      expect(module.exports.leoClips[clip]).toMatchObject(spec);
      expect(existsSync(`mobile/assets/mascot/anim/${clip}.webp`)).toBe(true);
    }
  });
  it('keeps peeks between 12–20 seconds', () => {
    expect(leoAnimationDelay('peek', 0)).toBe(12000);
    expect(leoAnimationDelay('peek', 0.9999)).toBe(19999);
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
    expect(leoCallClip(false, true)).toBe('leo-call-talk');
    expect(leoCallClip(false, false)).toBe('leo-call-listen');
  });
  it('wakes on tap, opens the call at 600 ms, and dozes when it closes', async () => {
    const h = homeHarness();
    h.render().onTap();
    expect(h.haptic).toHaveBeenCalledWith('light');
    expect(h.render().clip).toBe('leo-wake');
    await vi.advanceTimersByTimeAsync(599); expect(h.onLeo).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1); expect(h.onLeo).toHaveBeenCalledTimes(1);
    h.props.callOpen = true; h.motion(false); h.render();
    h.props.callOpen = false; h.motion(true); h.render();
    expect(h.render().clip).toBe('leo-doze');
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
    await vi.advanceTimersByTimeAsync(20000);
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
  it('uses static behavior without leaving one-off onboarding play stuck', async () => {
    const h = homeHarness(); h.onboarding(); await vi.advanceTimersByTimeAsync(15000);
    expect(h.onboarding().clip).toBe('leo-play');
    h.motion(false); h.onboarding(); expect(h.onboarding().clip).toBe('leo-idle-loop');
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