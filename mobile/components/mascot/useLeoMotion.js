import { useEffect, useState } from "react";
import { AccessibilityInfo, AppState } from "react-native";
function useLeoMotionState(paused = false) {
  const [reduceMotion, setReduceMotion] = useState(true);
  const [ready, setReady] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) {
        setReduceMotion(value);
        setReady(true);
      }
    }).catch(() => {
      if (mounted) setReady(true);
    });
    const motion = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    const app = AppState.addEventListener("change", (state) => setForeground(state === "active"));
    return () => {
      mounted = false;
      motion.remove();
      app.remove();
    };
  }, []);
  return { allowed: !paused && foreground && !reduceMotion, ready, foreground, reduceMotion };
}
function useLeoMotion(paused = false) {
  return useLeoMotionState(paused).allowed;
}
export {
  useLeoMotion,
  useLeoMotionState
};
