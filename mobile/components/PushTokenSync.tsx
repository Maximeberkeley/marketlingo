import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../hooks/useAuth';

/**
 * Keeps the learner's push token stored on their profile so server-side
 * reminders have somewhere to land, and keeps the recurring local reminders
 * armed. Renders nothing.
 */
export function PushTokenSync() {
  const { user } = useAuth();
  const lastSyncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      lastSyncedFor.current = null;
      return;
    }

    const run = async () => {
      try {
        // Keep native notification modules outside the startup import graph.
        const [{ syncPushToken }, { scheduleDailyFallbackReminders }] = await Promise.all([
          import('../lib/pushToken'),
          import('../lib/leoNudges'),
        ]);
        await syncPushToken(user.id);
        await scheduleDailyFallbackReminders();
        lastSyncedFor.current = user.id;
      } catch {
        // Push registration is optional and must never interrupt app launch.
      }
    };

    const timer = setTimeout(() => void run(), 2500);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [user]);

  return null;
}
