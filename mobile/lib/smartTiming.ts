/**
 * Smart push timing.
 *
 * Every app open records the learner's LOCAL hour so the backend can learn
 * when they usually study. Reminders are then scheduled shortly before that
 * habitual hour instead of a fixed clock time.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { log } from './logger';

const LAST_RECORDED_KEY = 'ml_last_open_recorded';
const PREFERRED_HOUR_KEY = 'ml_preferred_hour';
const MIN_GAP_MS = 30 * 60 * 1000; // don't spam on every foreground

/** Record an app open (throttled). Returns the learned preferred hour, if any. */
export async function recordAppOpen(): Promise<number | null> {
  try {
    const last = await AsyncStorage.getItem(LAST_RECORDED_KEY);
    if (last && Date.now() - Number(last) < MIN_GAP_MS) {
      return await getCachedPreferredHour();
    }

    const now = new Date();
    const { data, error } = await supabase.rpc('record_app_open', {
      p_local_hour: now.getHours(),
      p_utc_offset_minutes: -now.getTimezoneOffset(),
    });
    if (error) throw error;

    await AsyncStorage.setItem(LAST_RECORDED_KEY, String(Date.now()));
    if (typeof data === 'number') {
      await AsyncStorage.setItem(PREFERRED_HOUR_KEY, String(data));
      return data;
    }
    return null;
  } catch (e) {
    log.error('recordAppOpen failed', e);
    return null;
  }
}

export async function getCachedPreferredHour(): Promise<number | null> {
  try {
    const v = await AsyncStorage.getItem(PREFERRED_HOUR_KEY);
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= 23 ? n : null;
  } catch {
    return null;
  }
}

/**
 * Best reminder time for this learner.
 * Falls back to their manual preference when we don't have enough signal.
 */
export async function resolveReminderTime(fallback: string): Promise<{ time: string; smart: boolean }> {
  try {
    const { data, error } = await supabase
      .from('user_activity_patterns')
      .select('preferred_hour, sample_count')
      .maybeSingle();
    if (error) throw error;

    const samples = data?.sample_count ?? 0;
    const hour = data?.preferred_hour;
    if (samples >= 6 && typeof hour === 'number') {
      await AsyncStorage.setItem(PREFERRED_HOUR_KEY, String(hour));
      return { time: `${String(hour).padStart(2, '0')}:00`, smart: true };
    }
  } catch (e) {
    log.error('resolveReminderTime failed', e);
  }
  return { time: fallback, smart: false };
}
