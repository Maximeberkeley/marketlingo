"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var useLeoAnimations_exports = {};
__export(useLeoAnimations_exports, {
  useHomeLeo: () => useHomeLeo,
  useLessonCompleteLeo: () => useLessonCompleteLeo,
  useOnboardingLeo: () => useOnboardingLeo
});
module.exports = __toCommonJS(useLeoAnimations_exports);
var import_react = require("react");
var import_async_storage = __toESM(require("@react-native-async-storage/async-storage"));
var import_haptics = require("../../lib/haptics");
var import_leoAnimationRules = require("./leoAnimationRules");
var import_dayMath = require("../../lib/dayMath");
var import_useLeoMotion = require("./useLeoMotion");
let onboardingTreatPlayed = false;
function useOnboardingLeo(paused, start = "leo-idle-loop") {
  const [clip, setClip] = (0, import_react.useState)(start);
  const { allowed: motion } = (0, import_useLeoMotion.useLeoMotionState)(paused);
  (0, import_react.useEffect)(() => {
    if (!motion || onboardingTreatPlayed || clip !== "leo-idle-loop") return;
    const timer = setTimeout(() => {
      onboardingTreatPlayed = true;
      setClip("leo-play");
    }, 1e4);
    return () => clearTimeout(timer);
  }, [motion, clip]);
  const onEnd = (0, import_react.useCallback)(() => setClip("leo-idle-loop"), []);
  return { clip, onEnd };
}
function useLessonCompleteLeo(userId, streak) {
  const [clip, setClip] = (0, import_react.useState)(null);
  const { allowed: motion, ready } = (0, import_useLeoMotion.useLeoMotionState)(false);
  const decided = (0, import_react.useRef)(false);
  (0, import_react.useEffect)(() => {
    if (!ready || decided.current) return;
    decided.current = true;
    if (!motion) {
      setClip("leo-success");
      return;
    }
    let cancelled = false;
    void (async () => {
      const key = (0, import_leoAnimationRules.leoTreatKey)(userId);
      const today = (0, import_dayMath.localDateString)();
      const last = await import_async_storage.default.getItem(key).catch(() => null);
      const treat = (0, import_leoAnimationRules.shouldPlayLeoTreat)(streak, last, today);
      if (treat) await import_async_storage.default.setItem(key, today).catch(() => {
      });
      if (!cancelled) setClip(treat ? "leo-play" : "leo-success");
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, motion, userId, streak]);
  const onEnd = (0, import_react.useCallback)(() => {
    setClip((c) => c === "leo-play" ? "leo-success" : c);
  }, []);
  return { clip, onEnd };
}
function useHomeLeo({ done, active, focused, callOpen, doneKey, morningKey, celebrate, onCelebrated, onLeo }) {
  const [clip, setClip] = (0, import_react.useState)(done ? "leo-reading-loop" : "leo-sleep-loop");
  const { allowed: motion, ready, foreground } = (0, import_useLeoMotion.useLeoMotionState)(!active || !focused || callOpen);
  const woken = (0, import_react.useRef)(false);
  const previousCall = (0, import_react.useRef)(callOpen);
  const wakeTimer = (0, import_react.useRef)(null);
  const callbacks = (0, import_react.useRef)({ onLeo, onCelebrated });
  callbacks.current = { onLeo, onCelebrated };
  const claimed = (0, import_react.useRef)(/* @__PURE__ */ new Set());
  const morning = (0, import_react.useRef)(null);
  const lookTimer = (0, import_react.useRef)(null);
  const wokeFromMorning = (0, import_react.useRef)(false);
  const stopMorning = () => {
    if (lookTimer.current) clearTimeout(lookTimer.current);
    lookTimer.current = null;
    morning.current = null;
  };
  (0, import_react.useEffect)(() => () => {
    if (lookTimer.current) clearTimeout(lookTimer.current);
  }, []);
  (0, import_react.useEffect)(() => {
    if (!active || !focused || !foreground) {
      if (wakeTimer.current) clearTimeout(wakeTimer.current);
      wakeTimer.current = null;
      woken.current = false;
    }
    return () => {
      if (wakeTimer.current) clearTimeout(wakeTimer.current);
    };
  }, [active, focused, foreground]);
  (0, import_react.useEffect)(() => {
    setClip(done ? "leo-reading-loop" : "leo-sleep-loop");
  }, [done, doneKey]);
  (0, import_react.useEffect)(() => {
    if (!motion) setClip(done ? "leo-reading-loop" : "leo-sleep-loop");
  }, [motion, done]);
  (0, import_react.useEffect)(() => {
    if (morning.current && (done || !focused || !active || !foreground || !motion && !callOpen)) {
      stopMorning();
      setClip(done ? "leo-reading-loop" : "leo-sleep-loop");
    }
  }, [done, focused, active, foreground, motion, callOpen]);
  (0, import_react.useEffect)(() => {
    if (!morningKey || done || !active || !focused || callOpen || !ready || !foreground || !motion) return;
    if (morning.current || claimed.current.has(morningKey)) return;
    let cancelled = false;
    void (async () => {
      const seen = await import_async_storage.default.getItem(morningKey).catch(() => null) === "seen";
      if (cancelled || seen) {
        claimed.current.add(morningKey);
        return;
      }
      claimed.current.add(morningKey);
      await import_async_storage.default.setItem(morningKey, "seen").catch(() => {
      });
      if (cancelled) return;
      morning.current = "wake";
      setClip("leo-wake");
    })();
    return () => {
      cancelled = true;
    };
  }, [morningKey, done, active, focused, callOpen, ready, foreground, motion]);
  (0, import_react.useEffect)(() => {
    const closed = previousCall.current && !callOpen;
    previousCall.current = callOpen;
    if (closed && wokeFromMorning.current) {
      wokeFromMorning.current = false;
      woken.current = false;
      setClip(!done && motion ? "leo-doze" : done ? "leo-reading-loop" : "leo-sleep-loop");
    } else if (closed && woken.current) {
      woken.current = false;
      setClip(!done && motion ? "leo-eyes-close" : done ? "leo-reading-loop" : "leo-sleep-loop");
    }
  }, [callOpen, done, motion]);
  (0, import_react.useEffect)(() => {
    if (!done) return;
    if (!active || !focused || callOpen || !ready || !foreground) return;
    if (!celebrate) {
      setClip("leo-reading-loop");
      return;
    }
    let cancelled = false;
    void (async () => {
      const seen = claimed.current.has(doneKey) || await import_async_storage.default.getItem(doneKey).catch(() => null) === "seen";
      if (cancelled) return;
      if (seen || !motion) {
        setClip("leo-reading-loop");
        callbacks.current.onCelebrated();
        return;
      }
      claimed.current.add(doneKey);
      await import_async_storage.default.setItem(doneKey, "seen").catch(() => {
      });
      if (!cancelled) setClip("leo-done");
    })();
    return () => {
      cancelled = true;
    };
  }, [done, active, focused, callOpen, celebrate, doneKey, motion, ready, foreground]);
  (0, import_react.useEffect)(() => {
    if (!motion || done || clip !== "leo-sleep-loop") return;
    const timer = setTimeout(() => setClip("leo-peek"), (0, import_leoAnimationRules.leoAnimationDelay)("peek"));
    return () => clearTimeout(timer);
  }, [motion, done, clip]);
  const onEnd = (0, import_react.useCallback)(() => {
    if (clip === "leo-wake" && morning.current === "wake") {
      morning.current = "look";
      setClip("leo-idle-loop");
      lookTimer.current = setTimeout(() => {
        lookTimer.current = null;
        if (morning.current !== "look") return;
        morning.current = "doze";
        setClip("leo-doze");
      }, import_leoAnimationRules.LEO_MORNING_LOOK_MS);
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
  const onTap = (0, import_react.useCallback)(() => {
    void (0, import_haptics.triggerHaptic)("light").catch(() => {
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
