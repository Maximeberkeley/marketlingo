import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { triggerHaptic } from "../../lib/haptics";
import { leoAnimationDelay } from "./leoAnimationRules";
import { useLeoMotionState } from "./useLeoMotion";
function useOnboardingLeo(_paused) {
  return { clip: "leo-idle-loop", onEnd: useCallback(() => {
  }, []) };
}
function useHomeLeo({ done, active, focused, callOpen, doneKey, celebrate, onCelebrated, onLeo }) {
  const [clip, setClip] = useState(done ? "leo-reading-loop" : "leo-sleep-loop");
  const { allowed: motion, ready, foreground } = useLeoMotionState(!active || !focused || callOpen);
  const woken = useRef(false);
  const previousCall = useRef(callOpen);
  const wakeTimer = useRef(null);
  const callbacks = useRef({ onLeo, onCelebrated });
  callbacks.current = { onLeo, onCelebrated };
  const claimed = useRef(/* @__PURE__ */ new Set());
  useEffect(() => {
    if (!active || !focused || !foreground) {
      if (wakeTimer.current) clearTimeout(wakeTimer.current);
      wakeTimer.current = null;
      woken.current = false;
    }
    return () => {
      if (wakeTimer.current) clearTimeout(wakeTimer.current);
    };
  }, [active, focused, foreground]);
  useEffect(() => {
    setClip(done ? "leo-reading-loop" : "leo-sleep-loop");
  }, [done, doneKey]);
  useEffect(() => {
    if (!motion) setClip(done ? "leo-reading-loop" : "leo-sleep-loop");
  }, [motion, done]);
  useEffect(() => {
    const closed = previousCall.current && !callOpen;
    previousCall.current = callOpen;
    if (closed && woken.current) {
      woken.current = false;
      setClip(!done && motion ? "leo-eyes-close" : done ? "leo-reading-loop" : "leo-sleep-loop");
    }
  }, [callOpen, done, motion]);
  useEffect(() => {
    if (!done) return;
    if (!active || !focused || callOpen || !ready || !foreground) return;
    if (!celebrate) {
      setClip("leo-reading-loop");
      return;
    }
    let cancelled = false;
    void (async () => {
      const seen = claimed.current.has(doneKey) || await AsyncStorage.getItem(doneKey).catch(() => null) === "seen";
      if (cancelled) return;
      if (seen || !motion) {
        setClip("leo-reading-loop");
        callbacks.current.onCelebrated();
        return;
      }
      claimed.current.add(doneKey);
      await AsyncStorage.setItem(doneKey, "seen").catch(() => {
      });
      if (!cancelled) setClip("leo-done");
    })();
    return () => {
      cancelled = true;
    };
  }, [done, active, focused, callOpen, celebrate, doneKey, motion, ready, foreground]);
  useEffect(() => {
    if (!motion || done || clip !== "leo-sleep-loop") return;
    const timer = setTimeout(() => setClip("leo-peek"), leoAnimationDelay("peek"));
    return () => clearTimeout(timer);
  }, [motion, done, clip]);
  const onEnd = useCallback(() => {
    if (clip === "leo-eyes-open") {
      if (wakeTimer.current) clearTimeout(wakeTimer.current);
      wakeTimer.current = null;
      callbacks.current.onLeo();
      return;
    }
    setClip(done ? "leo-reading-loop" : "leo-sleep-loop");
    if (clip === "leo-done") callbacks.current.onCelebrated();
  }, [done, clip]);
  const onTap = useCallback(() => {
    void triggerHaptic("light").catch(() => {
    });
    if (!active || done) {
      callbacks.current.onLeo();
      return;
    }
    if (wakeTimer.current || callOpen || clip === "leo-eyes-open") return;
    woken.current = true;
    if (!motion) {
      callbacks.current.onLeo();
      return;
    }
    setClip("leo-eyes-open");
    wakeTimer.current = setTimeout(() => {
      wakeTimer.current = null;
      callbacks.current.onLeo();
    }, 2500);
  }, [active, done, callOpen, clip, motion]);
  return { clip, onEnd, onTap };
}
export {
  useHomeLeo,
  useOnboardingLeo
};
