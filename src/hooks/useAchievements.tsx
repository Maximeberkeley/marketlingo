import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { ACHIEVEMENTS, Achievement } from "@/data/achievements";

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

// Send milestone notification via Edge Function
async function sendMilestoneNotification(
  userId: string,
  milestoneType: 'streak' | 'level' | 'achievement' | 'certificate' | 'week_complete',
  milestoneData?: Record<string, any>
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    await supabase.functions.invoke('send-milestone-notification', {
      body: { userId, milestoneType, milestoneData },
    });
  } catch (error) {
    console.error('Failed to send milestone notification:', error);
  }
}

interface AchievementProgress {
  streak: number;
  xp: number;
  lessons: number;
  drills: number;
  games: number;
  days: number;
  level: number;
}

export function useAchievements(progress?: AchievementProgress) {
  const { user } = useAuth();
  const [unlockedAchievements, setUnlockedAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([]);

  const fetchAchievements = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", user.id);

    if (!error && data) {
      setUnlockedAchievements(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const checkAndUnlockAchievements = useCallback(async (currentProgress: AchievementProgress) => {
    if (!user) return;

    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      // Skip if already unlocked
      if (unlockedAchievements.some(ua => ua.achievement_id === achievement.id)) {
        continue;
      }

      // Check if requirement is met
      let met = false;
      switch (achievement.requirement.type) {
        case "streak":
          met = currentProgress.streak >= achievement.requirement.value;
          break;
        case "xp":
          met = currentProgress.xp >= achievement.requirement.value;
          break;
        case "lessons":
          met = currentProgress.lessons >= achievement.requirement.value;
          break;
        case "drills":
          met = currentProgress.drills >= achievement.requirement.value;
          break;
        case "games":
          met = currentProgress.games >= achievement.requirement.value;
          break;
        case "days":
          met = currentProgress.days >= achievement.requirement.value;
          break;
        case "level":
          met = currentProgress.level >= achievement.requirement.value;
          break;
      }

      if (met) {
        // Unlock the achievement
        const { error } = await supabase.from("user_achievements").insert({
          user_id: user.id,
          achievement_id: achievement.id,
        });

        if (!error) {
          newlyUnlocked.push(achievement);

          // Actually add the XP reward to user's total
          try {
            const { data: xpData } = await supabase
              .from('user_xp')
              .select('id, total_xp, market_id')
              .eq('user_id', user.id)
              .maybeSingle();

            if (xpData) {
              await supabase.from('user_xp')
                .update({ total_xp: xpData.total_xp + achievement.xpReward })
                .eq('id', xpData.id);

              await supabase.from('xp_transactions').insert({
                user_id: user.id,
                market_id: xpData.market_id,
                xp_amount: achievement.xpReward,
                source_type: 'achievement',
                source_id: achievement.id,
                description: `Achievement: ${achievement.name}`,
              });
            }
          } catch (xpErr) {
            console.error('Failed to add achievement XP:', xpErr);
          }

          // Send push notification for the achievement
          sendMilestoneNotification(user.id, 'achievement', {
            achievementName: achievement.name,
          });
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      setNewUnlocks(prev => [...prev, ...newlyUnlocked]);
      await fetchAchievements();
    }

    return newlyUnlocked;
  }, [user, unlockedAchievements, fetchAchievements]);

  const clearNewUnlocks = () => setNewUnlocks([]);

  const isUnlocked = (achievementId: string) => {
    return unlockedAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getUnlockedCount = () => unlockedAchievements.length;
  const getTotalCount = () => ACHIEVEMENTS.length;

  return {
    unlockedAchievements,
    loading,
    newUnlocks,
    clearNewUnlocks,
    checkAndUnlockAchievements,
    isUnlocked,
    getUnlockedCount,
    getTotalCount,
    refetch: fetchAchievements,
  };
}
