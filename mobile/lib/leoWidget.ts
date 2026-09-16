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

export function syncLeoWidget(snapshot: LeoWidgetSnapshot): void {
  if (Platform.OS !== 'ios') return;

  try {
    const storage = new ExtensionStorage(APP_GROUP);
    const parsedExpiry = snapshot.expiresAt ? Date.parse(snapshot.expiresAt) : Number.NaN;
    const fallbackExpiry = new Date();
    fallbackExpiry.setHours(23, 59, 59, 999);

    storage.set('leo_widget_streak', Math.max(0, snapshot.streak));
    storage.set('leo_widget_complete', snapshot.lessonComplete ? 1 : 0);
    storage.set(
      'leo_widget_expires_at',
      Math.floor((Number.isFinite(parsedExpiry) ? parsedExpiry : fallbackExpiry.getTime()) / 1000),
    );
    storage.set('leo_widget_market', snapshot.market || 'Your market');
    ExtensionStorage.reloadWidget();
  } catch (error) {
    log.warn('[LeoWidget] Could not sync widget state:', error);
  }
}