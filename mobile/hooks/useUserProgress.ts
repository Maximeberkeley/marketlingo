import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { storage } from '../lib/storage';

interface UserProgress {
  currentDay: number;
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  completedLessons: string[];
  lastCompletedAt: Date | null;
}

export function useUserProgress() {
  const [progress, setProgress] = useState<UserProgress>({
    currentDay: 1,
    currentStreak: 0,
    longestStreak: 0,
    totalXp: 0,
    completedLessons: [],
    lastCompletedAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    try {
      const userId = await storage.getUserId();
      const industry = await storage.getIndustry();

      if (!userId || !industry) {
        setIsLoading(false);
        return;
      }

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('market_id', industry)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        console.error('Error loading progress:', progressError);
      }

      // Fetch XP from user_xp table
      const { data: xpData, error: xpError } = await supabase
        .from('user_xp')
        .select('total_xp, current_level, startup_stage')
        .eq('user_id', userId)
        .eq('market_id', industry)
        .single();

      if (xpError && xpError.code !== 'PGRST116') {
        console.error('Error loading XP:', xpError);
      }

      setProgress({
        currentDay: progressData?.current_day || 1,
        currentStreak: progressData?.current_streak || 0,
        longestStreak: progressData?.longest_streak || 0,
        totalXp: xpData?.total_xp || 0,
        completedLessons: progressData?.completed_stacks || [],
        lastCompletedAt: progressData?.last_activity_at ? new Date(progressData.last_activity_at) : null,
      });
    } catch (error) {
      console.error('Error in loadProgress:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const addXp = async (amount: number) => {
    setProgress((prev) => ({
      ...prev,
      totalXp: prev.totalXp + amount,
    }));
    // TODO: Sync with Supabase
  };

  const completeLesson = async (lessonId: string) => {
    setProgress((prev) => ({
      ...prev,
      completedLessons: [...prev.completedLessons, lessonId],
      currentStreak: prev.currentStreak + 1,
      longestStreak: Math.max(prev.longestStreak, prev.currentStreak + 1),
    }));
    // TODO: Sync with Supabase
  };

  const refreshProgress = () => {
    setIsLoading(true);
    loadProgress();
  };

  return {
    progress,
    isLoading,
    addXp,
    completeLesson,
    refreshProgress,
  };
}
