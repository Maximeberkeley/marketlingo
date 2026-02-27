/**
 * useOfflineCache — caches today's + tomorrow's lesson to AsyncStorage
 * for offline reading. Auto-syncs when online.
 */
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { StackWithSlides } from '../lib/types';

const CACHE_KEY = 'ml_offline_lessons';
const CACHE_EXPIRY_HOURS = 24;

interface CachedLesson {
  stack: StackWithSlides;
  dayNumber: number;
  cachedAt: string;
}

interface OfflineCache {
  lessons: CachedLesson[];
  lastSyncAt: string;
}

export function useOfflineCache(marketId?: string) {
  const [cachedLessons, setCachedLessons] = useState<CachedLesson[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load cache from storage
  const loadCache = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cache: OfflineCache = JSON.parse(raw);
        // Filter out expired entries
        const now = new Date();
        const valid = cache.lessons.filter((l) => {
          const cachedTime = new Date(l.cachedAt);
          const hoursSince = (now.getTime() - cachedTime.getTime()) / (1000 * 60 * 60);
          return hoursSince < CACHE_EXPIRY_HOURS;
        });
        setCachedLessons(valid);
      }
    } catch {
      // Corrupt cache, ignore
    }
  }, []);

  useEffect(() => {
    loadCache();
  }, [loadCache]);

  /**
   * Cache a lesson stack for offline access
   */
  const cacheLesson = useCallback(async (stack: StackWithSlides, dayNumber: number) => {
    try {
      const entry: CachedLesson = {
        stack,
        dayNumber,
        cachedAt: new Date().toISOString(),
      };

      const raw = await AsyncStorage.getItem(CACHE_KEY);
      const cache: OfflineCache = raw ? JSON.parse(raw) : { lessons: [], lastSyncAt: '' };

      // Replace if same day exists, otherwise add
      const existing = cache.lessons.findIndex((l) => l.dayNumber === dayNumber);
      if (existing >= 0) {
        cache.lessons[existing] = entry;
      } else {
        cache.lessons.push(entry);
      }

      // Keep only last 3 cached lessons
      cache.lessons = cache.lessons.slice(-3);
      cache.lastSyncAt = new Date().toISOString();

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      setCachedLessons(cache.lessons);
    } catch {
      // Storage full or error
    }
  }, []);

  /**
   * Pre-fetch today + tomorrow's lessons for offline access
   */
  const syncLessons = useCallback(async (currentDay: number) => {
    if (!marketId || syncing) return;
    setSyncing(true);

    try {
      const daysToCache = [currentDay, currentDay + 1].filter((d) => d <= 180);

      for (const day of daysToCache) {
        // Check if already cached
        const alreadyCached = cachedLessons.find((l) => l.dayNumber === day);
        if (alreadyCached) continue;

        const dayTag = `day-${day}`;
        const { data: stacks } = await supabase
          .from('stacks')
          .select('id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)')
          .eq('market_id', marketId)
          .contains('tags', ['MICRO_LESSON', dayTag])
          .not('published_at', 'is', null)
          .limit(1);

        if (stacks?.[0]) {
          const stack = stacks[0] as any;
          const fullStack: StackWithSlides = {
            ...stack,
            tags: stack.tags || [],
            slides: ((stack.slides as any[]) || [])
              .sort((a: any, b: any) => a.slide_number - b.slide_number)
              .map((s: any) => ({
                ...s,
                sources: Array.isArray(s.sources) ? s.sources : [],
              })),
          };
          await cacheLesson(fullStack, day);
        }
      }
    } catch {
      // Offline or error — that's fine
    } finally {
      setSyncing(false);
    }
  }, [marketId, syncing, cachedLessons, cacheLesson]);

  /**
   * Get a cached lesson by day number (for offline use)
   */
  const getCachedLesson = useCallback((dayNumber: number): StackWithSlides | null => {
    const cached = cachedLessons.find((l) => l.dayNumber === dayNumber);
    return cached?.stack || null;
  }, [cachedLessons]);

  /**
   * Clear all cached lessons
   */
  const clearCache = useCallback(async () => {
    await AsyncStorage.removeItem(CACHE_KEY);
    setCachedLessons([]);
  }, []);

  return {
    cachedLessons,
    isOffline,
    syncing,
    cacheLesson,
    syncLessons,
    getCachedLesson,
    clearCache,
    cachedCount: cachedLessons.length,
  };
}
