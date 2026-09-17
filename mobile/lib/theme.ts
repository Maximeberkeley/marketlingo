/**
 * Theme mode — resolved synchronously at app boot.
 *
 * Why a file and not AsyncStorage: every screen builds its StyleSheet at module
 * import time, which happens before any async read can finish. The new
 * expo-file-system API is synchronous, so the palette is already correct on the
 * very first render. Changing the mode writes the file and reloads the app.
 */
import { File, Paths } from 'expo-file-system';

export type ThemeMode = 'light' | 'dark';

const FILE_NAME = 'marketlingo-theme.json';

function themeFile(): File {
  return new File(Paths.document, FILE_NAME);
}

function readModeSync(): ThemeMode {
  try {
    const f = themeFile();
    if (!f.exists) return 'light';
    const raw = f.textSync();
    const parsed = JSON.parse(raw);
    return parsed?.mode === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** Mode chosen by the user, resolved once at boot. */
export const themeMode: ThemeMode = readModeSync();

/** True when the dark palette is active for this app session. */
export const isDark = themeMode === 'dark';

/** Persist a new mode. Returns true when it was written. */
export function writeThemeMode(mode: ThemeMode): boolean {
  try {
    const f = themeFile();
    if (!f.exists) f.create({ intermediates: true });
    f.write(JSON.stringify({ mode }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Persist the mode and restart the JS bundle so every StyleSheet is rebuilt
 * with the new palette. Resolves false when a restart was not possible — the
 * mode is still saved and applies on next launch.
 */
export async function applyThemeMode(mode: ThemeMode): Promise<boolean> {
  const saved = writeThemeMode(mode);
  if (!saved) return false;
  try {
    const expo = require('expo');
    if (typeof expo?.reloadAppAsync === 'function') {
      await expo.reloadAppAsync('Theme change');
      return true;
    }
  } catch {
    // fall through
  }
  try {
    const { DevSettings } = require('react-native');
    if (typeof DevSettings?.reload === 'function') {
      DevSettings.reload();
      return true;
    }
  } catch {
    // fall through
  }
  return false;
}
