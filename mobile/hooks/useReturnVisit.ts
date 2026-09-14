import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'ml_last_active_at';
const GAP_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * True once per app open when the learner has been away for 4h+.
 * Used to surface the level / XP recap as a pop-up instead of
 * cluttering the home screen with it permanently.
 */
export function useReturnVisit(ready: boolean) {
  const [isReturningVisit, setIsReturningVisit] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (!ready || checked.current) return;
    checked.current = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        const last = raw ? parseInt(raw, 10) : NaN;
        const now = Date.now();
        // First ever open should not nag; only real returns after a gap.
        if (!isNaN(last) && now - last >= GAP_MS) {
          setIsReturningVisit(true);
        }
        await AsyncStorage.setItem(KEY, String(now));
      } catch {
        // storage unavailable — skip the pop-up
      }
    })();
  }, [ready]);

  return { isReturningVisit, dismiss: () => setIsReturningVisit(false) };
}
