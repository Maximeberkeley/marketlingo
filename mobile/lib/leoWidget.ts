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

export interface LeoWidgetSelfTestResult {
  status: LeoWidgetLinkStatus;
  streak: number;
  market: string;
  appReadBack: boolean;
  widgetReadBack: boolean;
  detail: string;
}

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

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
    storage.set('leo_widget_complete_text', snapshot.lessonComplete ? 'true' : 'false');
    storage.set('leo_widget_expires_at', expiresAt);
    storage.set('leo_widget_expires_text', String(expiresAt));
    storage.set('leo_widget_market', market);
    storage.set('leo_widget_written_at', String(Date.now()));
    // Reload every WidgetKit timeline. Passing the display name can miss a
    // generated extension whose internal kind differs after prebuild.
    ExtensionStorage.reloadWidget();

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

export type LeoWidgetLinkStatus = 'ok' | 'unlinked' | 'unsupported';

/**
 * Self-test: write a probe to the shared App Group and read it back.
 * 'unlinked' means the native bridge or App Group isn't live on this build —
 * almost always a signing/team mismatch or a stale install.
 */
export function getLeoWidgetLinkStatus(): LeoWidgetLinkStatus {
  if (Platform.OS !== 'ios') return 'unsupported';
  try {
    const storage = new ExtensionStorage(APP_GROUP);
    storage.set('leo_widget_probe', 'ok');
    return storage.get('leo_widget_probe') === 'ok' ? 'ok' : 'unlinked';
  } catch {
    return 'unlinked';
  }
}

/**
 * End-to-end phone test. It writes the learner's real snapshot, verifies the
 * app can read it from the shared App Group, reloads WidgetKit, then waits for
 * the widget extension to acknowledge the exact probe token in that group.
 */
export async function runLeoWidgetSelfTest(
  snapshot: LeoWidgetSnapshot,
): Promise<LeoWidgetSelfTestResult> {
  const streak = Math.max(0, Math.round(snapshot.streak || 0));
  const market = snapshot.market || 'Your market';

  if (Platform.OS !== 'ios') {
    return {
      status: 'unsupported', streak, market, appReadBack: false, widgetReadBack: false,
      detail: 'Widgets are only available in the iPhone app.',
    };
  }

  try {
    const storage = new ExtensionStorage(APP_GROUP);
    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    syncLeoWidget(snapshot);
    storage.set('leo_widget_sync_token', token);
    storage.set('leo_widget_last_read_token', '');
    ExtensionStorage.reloadWidget();

    const appReadBack =
      String(storage.get('leo_widget_streak_text')) === String(streak)
      && storage.get('leo_widget_market') === market
      && storage.get('leo_widget_sync_token') === token;

    if (!appReadBack) {
      return {
        status: 'unlinked', streak, market, appReadBack: false, widgetReadBack: false,
        detail: 'The app could not read its shared widget data. Rebuild and reinstall both targets with the same Apple team.',
      };
    }

    let widgetReadBack = false;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await wait(500);
      if (storage.get('leo_widget_last_read_token') === token) {
        widgetReadBack = true;
        break;
      }
    }

    return {
      status: widgetReadBack ? 'ok' : 'unlinked',
      streak,
      market,
      appReadBack,
      widgetReadBack,
      detail: widgetReadBack
        ? `Confirmed: Leo read your ${streak}-day streak for ${market}.`
        : 'The app wrote correctly, but WidgetKit did not read it. Remove the old widget, reinstall this build, then add Leo Streak again.',
    };
  } catch (error) {
    log.warn('[LeoWidget] Self-test failed:', error);
    return {
      status: 'unlinked', streak, market, appReadBack: false, widgetReadBack: false,
      detail: 'The native widget link is missing from this installed build. A clean rebuild and reinstall is required.',
    };
  }
}
