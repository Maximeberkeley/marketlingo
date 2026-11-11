/**
 * Over-the-air updates (expo-updates). The app checks on every cold start by itself (app.json
 * "checkAutomatically": "ON_LOAD", "fallbackToCacheTimeout": 0: launch never waits, a found update applies on
 * the next launch). iOS rarely cold-starts an app, so this also checks when the app returns to the foreground,
 * at most every CHECK_EVERY_MS, and downloads in the background. It never reloads a running app, so nothing
 * changes under a learner mid-lesson.
 *
 * Updates only reach builds with the same runtime version (policy "appVersion"): bump expo.version in app.json
 * for every store build that changes native code (a new native package, an Expo SDK upgrade, a config plugin,
 * permissions or the icon), or an update made for the new build could reach the old one.
 */
import { Platform } from 'react-native';
import { log } from './logger';

export const CHECK_EVERY_MS = 4 * 60 * 60 * 1000;

let lastCheck = 0;
let running = false;

/** Whether a foreground check is due. */
export function checkDue(last: number, now: number, every = CHECK_EVERY_MS): boolean {
  return now - last >= every;
}

/** Checks for a newer update and downloads it for the next launch. Safe to call often; never throws. */
export async function fetchUpdateInBackground(now = Date.now()): Promise<'skipped' | 'none' | 'downloaded' | 'failed'> {
  if (Platform.OS === 'web' || __DEV__ || running || !checkDue(lastCheck, now)) return 'skipped';
  running = true;
  lastCheck = now;
  try {
    const Updates = await import('expo-updates');
    if (!Updates.isEnabled) return 'skipped';
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return 'none';
    await Updates.fetchUpdateAsync();
    return 'downloaded';
  } catch (e) {
    // A missing native module (an older build) or no network: the next launch or foreground tries again.
    log.warn('[Updates] Background check failed:', e);
    return 'failed';
  } finally {
    running = false;
  }
}
