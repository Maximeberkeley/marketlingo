/**
 * Theme system — light / dark / system.
 *
 * How it works: every neutral color token is an iOS *dynamic* color
 * (DynamicColorIOS) that resolves per appearance at render time. That means
 * existing StyleSheet.create() styles pick up the theme automatically without
 * every screen needing to be rewritten. Switching the app-level appearance
 * with Appearance.setColorScheme() re-renders the whole tree instantly.
 */
import { Appearance, DynamicColorIOS, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'ml_theme_mode';

/** Returns a color that follows the active appearance (iOS), light value elsewhere. */
export function dyn(light: string, dark: string): string {
  if (Platform.OS === 'ios') {
    return DynamicColorIOS({ light, dark }) as unknown as string;
  }
  return light;
}

export function applyThemeMode(mode: ThemeMode) {
  Appearance.setColorScheme(mode === 'system' ? null : mode);
}

export async function loadThemeMode(): Promise<ThemeMode> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // ignore — fall back to system
  }
  return 'system';
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // non-fatal
  }
  applyThemeMode(mode);
}

/** Call once on app start, before the first screen renders. */
export async function initTheme(): Promise<ThemeMode> {
  const mode = await loadThemeMode();
  applyThemeMode(mode);
  return mode;
}
