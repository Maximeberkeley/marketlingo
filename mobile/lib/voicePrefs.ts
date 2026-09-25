/**
 * voicePrefs.ts — Leo's voice preference.
 *
 * Mute is a deliberate choice, so it survives closing the chat, changing
 * screens and restarting the app. It only changes when the learner taps
 * Unmute.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const MUTE_KEY = '@marketlingo/leo_voice_muted';

/** In-memory mirror so callers can read the preference synchronously. */
let cachedMuted = false;
let loaded = false;

export async function loadLeoMuted(): Promise<boolean> {
  if (loaded) return cachedMuted;
  try {
    cachedMuted = (await AsyncStorage.getItem(MUTE_KEY)) === 'true';
  } catch {
    cachedMuted = false;
  }
  loaded = true;
  return cachedMuted;
}

export function isLeoMutedSync(): boolean {
  return cachedMuted;
}

export async function setLeoMuted(muted: boolean): Promise<void> {
  cachedMuted = muted;
  loaded = true;
  try {
    await AsyncStorage.setItem(MUTE_KEY, muted ? 'true' : 'false');
  } catch {
    /* preference stays for this session even if the write fails */
  }
}
