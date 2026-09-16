import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { storage } from '../lib/storage';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Shows a once-a-week prompt inviting the user to place the Leo widget on their
 * home screen / lock screen. Goes quiet forever once they confirm they added it.
 */
export function useWidgetNudge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (Platform.OS !== 'ios') return;
      const [added, lastShown] = await Promise.all([
        storage.hasWidgetAdded(),
        storage.getWidgetNudgeAt(),
      ]);
      if (cancelled || added) return;
      if (Date.now() - lastShown < WEEK_MS) return;
      setVisible(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const snooze = useCallback(async () => {
    setVisible(false);
    await storage.setWidgetNudgeAt(Date.now());
  }, []);

  const markAdded = useCallback(async () => {
    setVisible(false);
    await storage.setWidgetAdded();
  }, []);

  return { visible, snooze, markAdded };
}
