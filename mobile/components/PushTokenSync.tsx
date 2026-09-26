import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { syncPushToken } from '../lib/pushToken';
import { scheduleDailyFallbackReminders } from '../lib/leoNudges';

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
      await syncPushToken(user.id);
      await scheduleDailyFallbackReminders();
      lastSyncedFor.current = user.id;
    };

    run();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, [user]);

  return null;
}
