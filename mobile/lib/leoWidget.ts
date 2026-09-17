import { Platform } from 'react-native';
import { ExtensionStorage } from '@bacons/apple-targets';
import { log } from './logger';

const APP_GROUP = 'group.app.marketlingo.aerospace.shared';

interface LeoWidgetSnapshot {
  streak: number;
  lessonComplete: boolean;
  expiresAt?: string | null;
  market?: string | null;
}

/**
 * Pushes the learner's live streak state into the shared App Group so the
 * home-screen / lock-screen widget shows real numbers instead of defaults.
 * Values are written twice (native type + string) so the widget can still read
 * them if the bridge coerces numbers unexpectedly.
 */
export function syncLeoWidget(snapshot: LeoWidgetSnapshot): void {
  if (Platform.OS !== 'ios') return;

  try {
    const storage = new ExtensionStorage(APP_GROUP);
    const parsedExpiry = snapshot.expiresAt ? Date.parse(snapshot.expiresAt) : Number.NaN;
    const fallbackExpiry = new Date();
    fallbackExpiry.setHours(23, 59, 59, 999);

    const streak = Math.max(0, Math.round(snapshot.streak || 0));
    const expiresAt = Math.floor(
      (Number.isFinite(parsedExpiry) ? parsedExpiry : fallbackExpiry.getTime()) / 1000,
    );
    const market = snapshot.market || 'Your market';

    storage.set('leo_widget_streak', streak);
    storage.set('leo_widget_streak_text', String(streak));
    storage.set('leo_widget_complete', snapshot.lessonComplete ? 1 : 0);
    storage.set('leo_widget_expires_at', expiresAt);
    storage.set('leo_widget_expires_text', String(expiresAt));
    storage.set('leo_widget_market', market);
    ExtensionStorage.reloadWidget('LeoWidget');

    // The bridge silently no-ops when the native module is missing, so read the
    // value back: if it doesn't come home, the widget will show defaults.
    const readBack = storage.get('leo_widget_streak_text');
    if (readBack == null) {
      log.warn(
        '[LeoWidget] Shared storage returned nothing after writing — the widget will show defaults. Rebuild the native app so the widget bridge is linked.',
      );
    } else {
      log.info(`[LeoWidget] Synced streak=${streak} complete=${snapshot.lessonComplete} market=${market}`);
    }
  } catch (error) {
    log.warn('[LeoWidget] Could not sync widget state:', error);
  }
}
