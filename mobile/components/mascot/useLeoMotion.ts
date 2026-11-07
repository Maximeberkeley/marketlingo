import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';

/**
 * Only an app in the background stops Leo. While iOS launches the app it can
 * report "inactive" or "unknown", and the switch to "active" may arrive before
 * Leo starts listening; treating those as background left Leo still for the
 * whole session.
 */
export const isForegroundState = (state: string | null | undefined) => state !== 'background';

/** Start still until the accessibility preference has resolved. */
export function useLeoMotionState(paused = false) {
  const [reduceMotion, setReduceMotion] = useState(true);
  const [ready, setReady] = useState(false);
  const [foreground, setForeground] = useState(isForegroundState(AppState.currentState));
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) { setReduceMotion(value); setReady(true); }
    }).catch(() => { if (mounted) setReady(true); });
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const app = AppState.addEventListener('change', state => setForeground(isForegroundState(state)));
    return () => { mounted = false; motion.remove(); app.remove(); };
  }, []);
  return { allowed: !paused && foreground && !reduceMotion, ready, foreground, reduceMotion };
}

export function useLeoMotion(paused = false) { return useLeoMotionState(paused).allowed; }