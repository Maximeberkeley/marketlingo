import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// XP rewards for different actions
export const XP_REWARDS = {
  LESSON_COMPLETE: 50,
  GAME_COMPLETE: 25,
  DRILL_CORRECT: 10,
  DRILL_WRONG: 2,
  TRAINER_COMPLETE: 30,
  STREAK_BONUS: 15, // per day of streak
} as const;

// Send milestone notification for level ups and streaks
async function sendMilestoneNotification(
  userId: string,
  milestoneType: 'streak' | 'level' | 'achievement' | 'certificate' | 'week_complete',
  milestoneData?: Record<string, any>
) {
  try {
    await supabase.functions.invoke('send-milestone-notification', {
      body: { userId, milestoneType, milestoneData },
    });
  } catch (error) {
    console.error('Failed to send milestone notification:', error);
  }
}

// Startup stage names
export const STARTUP_STAGES = [
  { stage: 1, name: "Ideation", description: "Exploring your market thesis", xpRequired: 0 },
  { stage: 2, name: "Validation", description: "Testing your assumptions", xpRequired: 500 },
  { stage: 3, name: "MVP", description: "Building your first product", xpRequired: 1500 },
  { stage: 4, name: "Traction", description: "Finding product-market fit", xpRequired: 3000 },
  { stage: 5, name: "Scaling", description: "Growing your startup", xpRequired: 5000 },
  { stage: 6, name: "Established", description: "Market leader", xpRequired: 8000 },
] as const;

interface UserXP {
  id: string;
  user_id: string;
  market_id: string;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  startup_stage: number;
}

interface DailyCompletion {
  id: string;
  user_id: string;
  market_id: string;
  completion_date: string;
  lesson_completed: boolean;
  completed_stack_id: string | null;
  games_completed: number;
  drills_completed: number;
  xp_earned: number;
}

export function useUserXP(marketId?: string) {
  const { user } = useAuth();
  const [xpData, setXpData] = useState<UserXP | null>(null);
  const [dailyCompletion, setDailyCompletion] = useState<DailyCompletion | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchXPData = useCallback(async () => {
    if (!user || !marketId) {
      setLoading(false);
      return;
    }

    // Fetch or create user XP record
    const { data: existingXP, error: xpError } = await supabase
      .from("user_xp")
      .select("*")
      .eq("user_id", user.id)
      .eq("market_id", marketId)
      .maybeSingle();

    if (xpError && xpError.code !== "PGRST116") {
      console.error("Error fetching XP:", xpError);
    }

    if (!existingXP) {
      // Create new XP record
      const { data: newXP, error: createError } = await supabase
        .from("user_xp")
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

      if (!createError && newXP) {
        setXpData(newXP);
      }
    } else {
      setXpData(existingXP);
    }

    // Fetch today's completion record
    const today = new Date().toISOString().split("T")[0];
    const { data: todayCompletion } = await supabase
      .from("daily_completions")
      .select("*")
      .eq("user_id", user.id)
      .eq("market_id", marketId)
      .eq("completion_date", today)
      .maybeSingle();

    if (todayCompletion) {
      setDailyCompletion(todayCompletion);
    }

    setLoading(false);
  }, [user, marketId]);

  useEffect(() => {
    fetchXPData();
  }, [fetchXPData]);

  const addXP = async (
    amount: number,
    sourceType: string,
    sourceId?: string,
    description?: string
  ) => {
    if (!user || !marketId || !xpData) return null;

    // Log the transaction
    await supabase.from("xp_transactions").insert({
      user_id: user.id,
      market_id: marketId,
      xp_amount: amount,
      source_type: sourceType,
      source_id: sourceId,
      description,
    });

    // Update total XP
    const newTotalXP = xpData.total_xp + amount;
    const { data: updatedXP, error } = await supabase
      .from("user_xp")
      .update({ total_xp: newTotalXP })
      .eq("id", xpData.id)
      .select()
      .single();

    if (!error && updatedXP) {
      setXpData(updatedXP);
    }

    // Update daily completion XP
    const today = new Date().toISOString().split("T")[0];
    if (dailyCompletion) {
      await supabase
        .from("daily_completions")
        .update({ xp_earned: dailyCompletion.xp_earned + amount })
        .eq("id", dailyCompletion.id);
    } else {
      const { data: newCompletion } = await supabase
        .from("daily_completions")
        .insert({
          user_id: user.id,
          market_id: marketId,
          completion_date: today,
          xp_earned: amount,
        })
        .select()
        .single();
      if (newCompletion) {
        setDailyCompletion(newCompletion);
      }
    }

    return updatedXP;
  };

  const completeLessonForToday = async (stackId: string) => {
    if (!user || !marketId) return;

    const today = new Date().toISOString().split("T")[0];
    
    // Upsert daily completion
    const { data, error } = await supabase
      .from("daily_completions")
      .upsert({
        user_id: user.id,
        market_id: marketId,
        completion_date: today,
        lesson_completed: true,
        completed_stack_id: stackId,
        xp_earned: (dailyCompletion?.xp_earned || 0) + XP_REWARDS.LESSON_COMPLETE,
      }, {
        onConflict: 'user_id,market_id,completion_date'
      })
      .select()
      .single();

    if (!error && data) {
      setDailyCompletion(data);
    }

    // Add XP for lesson
    await addXP(XP_REWARDS.LESSON_COMPLETE, "lesson", stackId, "Completed daily lesson");

    return data;
  };

  const getCurrentStage = () => {
    return STARTUP_STAGES.find(s => s.stage === (xpData?.startup_stage || 1)) || STARTUP_STAGES[0];
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
