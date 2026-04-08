import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { UserXP, DailyCompletion } from '../lib/types';

export const XP_REWARDS = {
  LESSON_COMPLETE: 50,
  GAME_COMPLETE: 25,
  DRILL_CORRECT: 10,
  DRILL_WRONG: 2,
  TRAINER_COMPLETE: 30,
  STREAK_BONUS: 15,
} as const;

export const PRO_XP_MULTIPLIER = 1.5;

export function getXPAmount(base: number, isPro: boolean): number {
  return isPro ? Math.round(base * PRO_XP_MULTIPLIER) : base;
}

export const STARTUP_STAGES = [
  { stage: 1, name: 'Ideation', description: 'Exploring your market thesis', xpRequired: 0 },
  { stage: 2, name: 'Validation', description: 'Testing your assumptions', xpRequired: 500 },
  { stage: 3, name: 'MVP', description: 'Building your first product', xpRequired: 1500 },
  { stage: 4, name: 'Traction', description: 'Finding product-market fit', xpRequired: 3000 },
  { stage: 5, name: 'Scaling', description: 'Growing your startup', xpRequired: 5000 },
  { stage: 6, name: 'Established', description: 'Market leader', xpRequired: 8000 },
] as const;

export function useUserXP(marketId?: string) {
  const { user } = useAuth();
  const [xpData, setXpData] = useState<UserXP | null>(null);
  const [dailyCompletion, setDailyCompletion] = useState<DailyCompletion | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureXPRecord = useCallback(async () => {
    if (!user || !marketId) return null;

    if (xpData) {
      return xpData;
    }

    const { data: existingXP, error: xpError } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', user.id)
      .eq('market_id', marketId)
      .maybeSingle();

    if (xpError && xpError.code !== 'PGRST116') {
      console.error('Error fetching XP:', xpError);
      return null;
    }

    if (existingXP) {
      setXpData(existingXP);
      return existingXP;
    }

    const { data: newXP, error: createError } = await supabase
      .from('user_xp')
      .insert({
        user_id: user.id,
        market_id: marketId,
        total_xp: 0,
        current_level: 1,
        xp_to_next_level: 100,
        startup_stage: 1,
      })
      .select()
      .single();

    if (createError) {
      const { data: recoveredXP, error: recoverError } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .eq('market_id', marketId)
        .maybeSingle();

      if (recoverError && recoverError.code !== 'PGRST116') {
        console.error('Error recovering XP:', recoverError);
      }

      if (recoveredXP) {
        setXpData(recoveredXP);
        return recoveredXP;
      }

      console.error('Error creating XP:', createError);
      return null;
    }

    if (newXP) {
      setXpData(newXP);
    }

    return newXP;
  }, [user, marketId, xpData]);

  const fetchXPData = useCallback(async () => {
    if (!user || !marketId) {
      setXpData(null);
      setDailyCompletion(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ensuredXP = await ensureXPRecord();
    if (ensuredXP) {
      setXpData(ensuredXP);
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: todayCompletion, error: completionError } = await supabase
      .from('daily_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('market_id', marketId)
      .eq('completion_date', today)
      .maybeSingle();

    if (completionError && completionError.code !== 'PGRST116') {
      console.error('Error fetching daily completion:', completionError);
    }

    setDailyCompletion(todayCompletion || null);

    setLoading(false);
  }, [user, marketId, ensureXPRecord]);

  useEffect(() => {
    fetchXPData();
  }, [fetchXPData]);

  const addXP = async (
    amount: number,
    sourceType: string,
    sourceId?: string,
    description?: string
  ) => {
    if (!user || !marketId) return null;

    const ensuredXP = await ensureXPRecord();
    if (!ensuredXP) return null;

    const { error: transactionError } = await supabase.from('xp_transactions').insert({
      user_id: user.id,
      market_id: marketId,
      xp_amount: amount,
      source_type: sourceType,
      source_id: sourceId,
      description,
    });

    if (transactionError) {
      console.error('Error logging XP transaction:', transactionError);
    }

    // Atomic XP increment to prevent race conditions
    const { data: updatedXP, error } = await supabase
      .rpc('increment_user_xp', {
        p_user_id: user.id,
        p_market_id: marketId,
        p_amount: amount,
      });

    if (error) {
      console.error('Error incrementing XP:', error);
    }

    if (!error && updatedXP) {
      setXpData(updatedXP);
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: existingCompletion, error: completionFetchError } = await supabase
      .from('daily_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('market_id', marketId)
      .eq('completion_date', today)
      .maybeSingle();

    if (completionFetchError && completionFetchError.code !== 'PGRST116') {
      console.error('Error fetching daily completion for XP update:', completionFetchError);
    }

    const baseCompletion = existingCompletion || dailyCompletion;
    const isGameReward = sourceType === 'game';
    const isDrillReward = sourceType.startsWith('drill');

    const { data: updatedCompletion, error: completionUpsertError } = await supabase
      .from('daily_completions')
      .upsert(
        {
          user_id: user.id,
          market_id: marketId,
          completion_date: today,
          lesson_completed: baseCompletion?.lesson_completed || false,
          completed_stack_id: baseCompletion?.completed_stack_id || null,
          games_completed: (baseCompletion?.games_completed || 0) + (isGameReward ? 1 : 0),
          drills_completed: (baseCompletion?.drills_completed || 0) + (isDrillReward ? 1 : 0),
          xp_earned: (baseCompletion?.xp_earned || 0) + amount,
        },
        { onConflict: 'user_id,market_id,completion_date' }
      )
      .select()
      .single();

    if (completionUpsertError) {
      console.error('Error updating daily completion XP:', completionUpsertError);
    } else if (updatedCompletion) {
      setDailyCompletion(updatedCompletion);
    }

    return updatedXP;
  };

  const completeLessonForToday = async (stackId: string) => {
    if (!user || !marketId) return;

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_completions')
      .upsert(
        {
          user_id: user.id,
          market_id: marketId,
          completion_date: today,
          lesson_completed: true,
          completed_stack_id: stackId,
        },
        { onConflict: 'user_id,market_id,completion_date' }
      )
      .select()
      .single();

    if (!error && data) {
      setDailyCompletion(data);
    }

    await addXP(XP_REWARDS.LESSON_COMPLETE, 'lesson', stackId, 'Completed daily lesson');
    return data;
  };

  const getCurrentStage = () => {
    return STARTUP_STAGES.find((s) => s.stage === (xpData?.startup_stage || 1)) || STARTUP_STAGES[0];
  };

  const getNextStage = () => {
    const currentStageIndex = (xpData?.startup_stage || 1) - 1;
    return STARTUP_STAGES[currentStageIndex + 1] || null;
  };

  const getProgressToNextStage = () => {
    const current = getCurrentStage();
    const next = getNextStage();
    if (!next) return 100;
    const currentXP = xpData?.total_xp || 0;
    const progress = ((currentXP - current.xpRequired) / (next.xpRequired - current.xpRequired)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const isLessonCompletedToday = () => {
    return dailyCompletion?.lesson_completed || false;
  };

  return {
    xpData,
    dailyCompletion,
    loading,
    addXP,
    completeLessonForToday,
    getCurrentStage,
    getNextStage,
    getProgressToNextStage,
    isLessonCompletedToday,
    refetch: fetchXPData,
  };
}
