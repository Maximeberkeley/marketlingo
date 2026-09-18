import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { UserProgress } from '../lib/types';
import { log } from '../lib/logger';
import { calculateAvailableDay, localDateString } from '../lib/dayMath';


export function useUserProgress(marketId?: string) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableDay, setAvailableDay] = useState(1);

  const fetchProgress = useCallback(async () => {
    if (!user || !marketId) {
      setProgress(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('market_id', marketId)
        .single();

      if (error && error.code === 'PGRST116') {
        const today = localDateString();
        const { data: newProgress, error: createError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            market_id: marketId,
            current_day: 1,
            current_streak: 0,
            longest_streak: 0,
            completed_stacks: [],
            start_date: today,
          })
          .select()
          .single();

        if (!createError && newProgress) {
          setProgress(newProgress as UserProgress);
          setAvailableDay(1);
        } else if (createError) {
          log.warn('[UserProgress] Failed to create progress:', createError.message);
        }
      } else if (error) {
        log.warn('[UserProgress] Failed to load progress:', error.message);
      } else if (data) {
        const progressData = data as UserProgress;
        setProgress(progressData);
        const calcDay = calculateAvailableDay(progressData.start_date);
        setAvailableDay(calcDay);
      }
    } catch (error) {
      log.warn('[UserProgress] Progress request failed:', error);
    } finally {
      setLoading(false);
    }
  }, [user, marketId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  /**
   * Recompute the streak from the learner's LOCAL calendar days.
   * The server counts consecutive `daily_completions` rows (whose dates are
   * already local dates), so a day is only lost after the learner's own
   * midnight passes unfinished — never 24h after the last lesson.
   */
  const syncStreak = useCallback(async () => {
    if (!user || !marketId) return null;
    const { data, error } = await supabase.rpc('sync_local_streak', {
      p_market_id: marketId,
      p_today: localDateString(),
    });
    if (error) {
      log.warn('[UserProgress] Streak sync failed:', error.message);
      return null;
    }
    if (data) setProgress(data as UserProgress);
    return data;
  }, [user, marketId]);

  // Keep the streak honest every time the app reads progress for a market.
  useEffect(() => {
    if (!loading && progress) {
      syncStreak();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, progress?.id]);

  const updateStreak = syncStreak;

  const completeStack = async (stackId: string) => {
    if (!progress) return;
    if (progress.completed_stacks?.includes(stackId)) return progress;

    const completedStacks = [...(progress.completed_stacks || []), stackId];
    const { data, error } = await supabase
      .from('user_progress')
      .update({
        completed_stacks: completedStacks,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', progress.id)
      .select()
      .single();

    if (!error && data) {
      setProgress(data as UserProgress);
    }
    return data;
  };

  const isTodayLessonCompleted = useCallback(
    (todayStackId?: string) => {
      if (!progress || !todayStackId) return false;
      return progress.completed_stacks?.includes(todayStackId) || false;
    },
    [progress]
  );

  const isStreakActive = () => {
    if (!progress?.streak_expires_at) return false;
    return new Date(progress.streak_expires_at) > new Date();
  };

  return {
    progress,
    loading,
    availableDay,
    updateStreak,
    syncStreak,
    completeStack,
    isTodayLessonCompleted,
    isStreakActive,
    refetch: fetchProgress,
  };
}
