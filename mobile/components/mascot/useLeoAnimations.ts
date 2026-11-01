import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { triggerHaptic } from '../../lib/haptics';
import { LeoClip } from './leoClips';
import { leoAnimationDelay } from './leoAnimationRules';
import { useLeoMotion, useLeoMotionState } from './useLeoMotion';

export function useOnboardingLeo(paused: boolean) {
  const [clip, setClip] = useState<LeoClip>('leo-idle-loop');
  const motion = useLeoMotion(paused);
  useEffect(() => {
    if (!motion) { setClip('leo-idle-loop'); return; }
    if (clip !== 'leo-idle-loop') return;
    const timer = setTimeout(() => setClip('leo-play'), leoAnimationDelay('play'));
    return () => clearTimeout(timer);
  }, [motion, clip]);
  return { clip, onEnd: useCallback(() => setClip('leo-idle-loop'), []) };
}

export function useHomeLeo({ done, active, focused, callOpen, doneKey, celebrate, onCelebrated, onLeo }: {
  done: boolean; active: boolean; focused: boolean; callOpen: boolean; doneKey: string;
  celebrate: boolean; onCelebrated: () => void; onLeo: () => void;
}) {
  const [clip, setClip] = useState<LeoClip>(done ? 'leo-reading-loop' : 'leo-sleep-loop');
  const { allowed: motion, ready, foreground } = useLeoMotionState(!active || !focused || callOpen);
  const woken = useRef(false);
  const previousCall = useRef(callOpen);
  const wakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbacks = useRef({ onLeo, onCelebrated });
  callbacks.current = { onLeo, onCelebrated };
  const claimed = useRef(new Set<string>());

  useEffect(() => {
    if (!active || !focused || !foreground) {
      if (wakeTimer.current) clearTimeout(wakeTimer.current);
      wakeTimer.current = null;
      woken.current = false;
    }
    return () => { if (wakeTimer.current) clearTimeout(wakeTimer.current); };
  }, [active, focused, foreground]);

  useEffect(() => {
    setClip(done ? 'leo-reading-loop' : 'leo-sleep-loop');
  }, [done, doneKey]);
  useEffect(() => {
    if (!motion) setClip(done ? 'leo-reading-loop' : 'leo-sleep-loop');
  }, [motion, done]);

  useEffect(() => {
    const closed = previousCall.current && !callOpen;
    previousCall.current = callOpen;
    if (closed && woken.current) {
      woken.current = false;
      setClip(!done && motion ? 'leo-doze' : done ? 'leo-reading-loop' : 'leo-sleep-loop');
    }
  }, [callOpen, done, motion]);

  useEffect(() => {
    if (!done) return;
    if (!active || !focused || callOpen || !ready || !foreground) return;
    if (!celebrate) { setClip('leo-reading-loop'); return; }
    let cancelled = false;
    void (async () => {
      const seen = claimed.current.has(doneKey) || await AsyncStorage.getItem(doneKey).catch(() => null) === 'seen';
      if (cancelled) return;
      if (seen || !motion) {
        setClip('leo-reading-loop');
        callbacks.current.onCelebrated();
        return;
      }
      claimed.current.add(doneKey);
      await AsyncStorage.setItem(doneKey, 'seen').catch(() => {});
      if (!cancelled) setClip('leo-done');
    })();
    return () => { cancelled = true; };
  }, [done, active, focused, callOpen, celebrate, doneKey, motion, ready, foreground]);

  useEffect(() => {
    if (!motion || done || clip !== 'leo-sleep-loop') return;
    const timer = setTimeout(() => setClip('leo-peek'), leoAnimationDelay('peek'));
    return () => clearTimeout(timer);
  }, [motion, done, clip]);

  const onEnd = useCallback(() => {
    setClip(done ? 'leo-reading-loop' : 'leo-sleep-loop');
    if (clip === 'leo-done') callbacks.current.onCelebrated();
  }, [done, clip]);

  const onTap = useCallback(() => {
    void triggerHaptic('light').catch(() => {});
    if (!active || done) { callbacks.current.onLeo(); return; }
    if (wakeTimer.current || callOpen) return;
    woken.current = true;
    setClip('leo-wake');
    wakeTimer.current = setTimeout(() => {
      wakeTimer.current = null;
      callbacks.current.onLeo();
    }, 600);
  }, [active, done, callOpen]);
  return { clip, onEnd, onTap };
}