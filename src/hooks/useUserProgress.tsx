import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UserProgress {
  id: string;
  user_id: string;
  market_id: string;
  current_day: number;
  current_streak: number;
  longest_streak: number;
  last_activity_at: string | null;
  streak_expires_at: string | null;
  completed_stacks: string[];
}

export function useUserProgress(marketId?: string) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !marketId) {
      setLoading(false);
      return;
    }

    fetchProgress();
  }, [user, marketId]);

  const fetchProgress = async () => {
    if (!user || !marketId) return;

    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("market_id", marketId)
      .single();

    if (error && error.code === "PGRST116") {
      // No row found, create one
      const { data: newProgress, error: createError } = await supabase
        .from("user_progress")
        .insert({
          user_id: user.id,
          market_id: marketId,
          current_day: 1,
          current_streak: 0,
          longest_streak: 0,
          completed_stacks: [],
        })
        .select()
        .single();

      if (!createError && newProgress) {
        setProgress(newProgress);
      }
    } else if (data) {
      setProgress(data);
    }

    setLoading(false);
  };

  const updateStreak = async () => {
    if (!progress) return;

    // Simply update to trigger the streak calculation trigger
    const { data, error } = await supabase
      .from("user_progress")
      .update({ current_day: progress.current_day })
      .eq("id", progress.id)
      .select()
      .single();

    if (!error && data) {
      setProgress(data);
    }

    return data;
  };

  const completeStack = async (stackId: string) => {
    if (!progress) return;

    const completedStacks = [...(progress.completed_stacks || []), stackId];

    const { data, error } = await supabase
      .from("user_progress")
      .update({
        completed_stacks: completedStacks,
        current_day: progress.current_day + 1,
      })
      .eq("id", progress.id)
      .select()
      .single();

    if (!error && data) {
      setProgress(data);
    }

    return data;
  };

  const isStreakActive = () => {
    if (!progress?.streak_expires_at) return false;
    return new Date(progress.streak_expires_at) > new Date();
  };

  return {
    progress,
    loading,
    updateStreak,
    completeStack,
    isStreakActive,
    refetch: fetchProgress,
  };
}
