/**
 * useFeatureFlags — remote kill switch for AI-dependent features.
 *
 * Flags live in the `feature_flags` table and are cached locally so the app
 * behaves predictably offline. Defaults are safe: AI stays on unless the
 * backend says otherwise, experimental surfaces stay off.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export type FeatureFlagKey =
  | 'ai_leo'
  | 'ai_voice'
  | 'ai_mentor_chat'
  | 'decision_engine'
  | 'market_of_the_day';

const DEFAULTS: Record<FeatureFlagKey, boolean> = {
  ai_leo: true,
  ai_voice: true,
  ai_mentor_chat: true,
  decision_engine: true,
  market_of_the_day: false,
};

const CACHE_KEY = 'feature_flags_v1';

let memoryCache: Record<string, boolean> | null = null;

export async function fetchFeatureFlags(): Promise<Record<string, boolean>> {
  try {
    const { data, error } = await supabase.from('feature_flags').select('key, enabled');
    if (error) throw error;
    const map: Record<string, boolean> = { ...DEFAULTS };
    (data || []).forEach((row: { key: string; enabled: boolean }) => {
      map[row.key] = row.enabled;
    });
    memoryCache = map;
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(map)).catch(() => {});
    return map;
  } catch {
    if (memoryCache) return memoryCache;
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return { ...DEFAULTS };
  }
}

/** Non-hook check for use inside async handlers. */
export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  const flags = memoryCache || (await fetchFeatureFlags());
  return flags[key] ?? DEFAULTS[key];
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>(memoryCache || DEFAULTS);
  const [loaded, setLoaded] = useState(!!memoryCache);

  const refresh = useCallback(async () => {
    const next = await fetchFeatureFlags();
    setFlags(next);
    setLoaded(true);
    return next;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isEnabled = useCallback(
    (key: FeatureFlagKey) => flags[key] ?? DEFAULTS[key],
    [flags],
  );

  return { flags, loaded, isEnabled, refresh };
}
