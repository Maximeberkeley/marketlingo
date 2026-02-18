import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { UserProgress } from '../lib/types';

function calculateAvailableDay(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const availableDay = diffDays + 1;
  return Math.min(180, Math.max(1, availableDay));
}

export function useUserProgress(marketId?: string) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableDay, setAvailableDay] = useState(1);

  const fetchProgress = useCallback(async () => {
    if (!user || !marketId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('market_id', marketId)
      .single();

    if (error && error.code === 'PGRST116') {
      const today = new Date().toISOString().split('T')[0];
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
      }
    } else if (data) {
      const progressData = data as UserProgress;
      setProgress(progressData);
      const calcDay = calculateAvailableDay(progressData.start_date);
      setAvailableDay(calcDay);
    }

    setLoading(false);
  }, [user, marketId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const updateStreak = async () => {
    if (!progress) return;
    const { data, error } = await supabase
      .from('user_progress')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', progress.id)
      .select()
      .single();

    if (!error && data) {
      setProgress(data as UserProgress);
    }
    return data;
  };

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
    completeStack,
    isTodayLessonCompleted,
    isStreakActive,
    refetch: fetchProgress,
  };
}
