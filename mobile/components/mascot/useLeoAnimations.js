import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { triggerHaptic } from "../../lib/haptics";
import { leoAnimationDelay, leoTreatKey, shouldPlayLeoTreat, LEO_MORNING_LOOK_MS } from "./leoAnimationRules";
import { localDateString } from "../../lib/dayMath";
import { useLeoMotionState } from "./useLeoMotion";
let onboardingTreatPlayed = false;
function useOnboardingLeo(paused, start = "leo-idle-loop") {
  const [clip, setClip] = useState(start);
  const { allowed: motion } = useLeoMotionState(paused);
  useEffect(() => {
    if (!motion || onboardingTreatPlayed || clip !== "leo-idle-loop") return;
    const timer = setTimeout(() => {
      onboardingTreatPlayed = true;
      setClip("leo-play");
    }, 1e4);
    return () => clearTimeout(timer);
  }, [motion, clip]);
  const onEnd = useCallback(() => setClip("leo-idle-loop"), []);
  return { clip, onEnd };
}
function useLessonCompleteLeo(userId, streak) {
  const [clip, setClip] = useState(null);
  const { allowed: motion, ready } = useLeoMotionState(false);
  const decided = useRef(false);
  useEffect(() => {
    if (!ready || decided.current) return;
    decided.current = true;
    if (!motion) {
      setClip("leo-success");
      return;
    }
    let cancelled = false;
    void (async () => {
      const key = leoTreatKey(userId);
      const today = localDateString();
      const last = await AsyncStorage.getItem(key).catch(() => null);
      const treat = shouldPlayLeoTreat(streak, last, today);
      if (treat) await AsyncStorage.setItem(key, today).catch(() => {
      });
      if (!cancelled) setClip(treat ? "leo-play" : "leo-success");
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, motion, userId, streak]);
  const onEnd = useCallback(() => {
    setClip((c) => c === "leo-play" ? "leo-success" : c);
  }, []);
  return { clip, onEnd };
}
const LEO_SIT_BEHIND_CALL_MS = 450;
function useHomeLeo({ done, active, focused, callOpen, doneKey, morningKey, celebrate, onCelebrated, onLeo }) {
  const [clip, setClip] = useState(done ? "leo-reading-loop" : "leo-sleep-loop");
  const { allowed: motion, ready, foreground } = useLeoMotionState(!active || !focused || callOpen);
  const woken = useRef(false);
  const previousCall = useRef(callOpen);
  const wakeTimer = useRef(null);
  const sitTimer = useRef(null);
  const callbacks = useRef({ onLeo, onCelebrated });
  callbacks.current = { onLeo, onCelebrated };
  const claimed = useRef(/* @__PURE__ */ new Set());
  const morning = useRef(null);
  const lookTimer = useRef(null);
  const wokeFromMorning = useRef(false);
  const stopMorning = () => {
    if (lookTimer.current) clearTimeout(lookTimer.current);
    lookTimer.current = null;
    morning.current = null;
  };
  useEffect(() => () => {
    if (lookTimer.current) clearTimeout(lookTimer.current);
  }, []);
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
    if (sitTimer.current) clearTimeout(sitTimer.current);
    sitTimer.current = null;
    if (motion) return;
    if (callOpen && woken.current && !done) {
      sitTimer.current = setTimeout(() => {
        sitTimer.current = null;
        setClip("leo-doze");
      }, LEO_SIT_BEHIND_CALL_MS);
      return;
    }
    setClip(done ? "leo-reading-loop" : "leo-sleep-loop");
  }, [motion, done, callOpen]);
  useEffect(() => () => {
    if (sitTimer.current) clearTimeout(sitTimer.current);
  }, []);
  useEffect(() => {
    if (morning.current && (done || !focused || !active || !foreground || !motion && !callOpen)) {
      stopMorning();
      setClip(done ? "leo-reading-loop" : "leo-sleep-loop");
    }
  }, [done, focused, active, foreground, motion, callOpen]);
  useEffect(() => {
    if (!morningKey || done || !active || !focused || callOpen || !ready || !foreground || !motion) return;
    if (morning.current || claimed.current.has(morningKey)) return;
    let cancelled = false;
    void (async () => {
      const seen = await AsyncStorage.getItem(morningKey).catch(() => null) === "seen";
      if (cancelled || seen) {
        claimed.current.add(morningKey);
        return;
      }
      claimed.current.add(morningKey);
      await AsyncStorage.setItem(morningKey, "seen").catch(() => {
      });
      if (cancelled) return;
      morning.current = "wake";
      setClip("leo-wake");
    })();
    return () => {
      cancelled = true;
    };
  }, [morningKey, done, active, focused, callOpen, ready, foreground, motion]);
  useEffect(() => {
    const closed = previousCall.current && !callOpen;
    previousCall.current = callOpen;
    if (closed && wokeFromMorning.current) {
      wokeFromMorning.current = false;
      woken.current = false;
      setClip(!done && motion ? "leo-doze" : done ? "leo-reading-loop" : "leo-sleep-loop");
    } else if (closed && woken.current) {
      woken.current = false;
      setClip(!done && motion ? "leo-doze" : done ? "leo-reading-loop" : "leo-sleep-loop");
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
    if (clip === "leo-wake" && morning.current === "wake") {
      morning.current = "look";
      setClip("leo-idle-loop");
      lookTimer.current = setTimeout(() => {
        lookTimer.current = null;
        if (morning.current !== "look") return;
        morning.current = "doze";
        setClip("leo-doze");
      }, LEO_MORNING_LOOK_MS);
      return;
    }
    if (clip === "leo-doze") morning.current = null;
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
    if (morning.current === "wake" || morning.current === "look") {
      stopMorning();
      woken.current = true;
      wokeFromMorning.current = true;
      callbacks.current.onLeo();
      return;
    }
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
  useLessonCompleteLeo,
  useOnboardingLeo
};
