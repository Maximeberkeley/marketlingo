import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Lock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ACHIEVEMENTS, Achievement, achievementIcons, tierColors } from "@/data/achievements";
import { useAchievements } from "@/hooks/useAchievements";
import { useUserXP } from "@/hooks/useUserXP";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { LeoMascot } from "@/components/mascot/LeoMascot";

export default function AchievementsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const { progress } = useUserProgress(selectedMarket || undefined);
  const { xpData } = useUserXP(selectedMarket || undefined);
  const { isUnlocked, getUnlockedCount, getTotalCount } = useAchievements();

  useEffect(() => {
    const fetchMarket = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market")
        .eq("id", user.id)
        .single();
      if (profile?.selected_market) {
        setSelectedMarket(profile.selected_market);
      }
    };
    fetchMarket();
  }, [user]);

  const groupedAchievements = ACHIEVEMENTS.reduce((acc, achievement) => {
    if (!acc[achievement.tier]) acc[achievement.tier] = [];
    acc[achievement.tier].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const tierOrder = ["platinum", "gold", "silver", "bronze"] as const;

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-4 py-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ArrowLeft size={24} className="text-text-secondary" />
            </button>
            <div className="flex-1">
              <h1 className="text-h2 text-text-primary">Achievements</h1>
              <p className="text-caption text-text-muted">
                {getUnlockedCount()} / {getTotalCount()} unlocked
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30">
              <Trophy size={14} className="text-accent" />
              <span className="text-caption font-medium text-accent">{getUnlockedCount()}</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 pb-28 space-y-6">
          {/* Leo encouragement for achievements */}
          <LeoMascot 
            size="md" 
            message={getUnlockedCount() > 0 
              ? `${getUnlockedCount()} badges earned! Keep going! 🏆` 
              : "Start unlocking badges! 💪"
            }
            mood={getUnlockedCount() > 5 ? "celebrating" : "encouraging"}
            className="mb-4"
          />
          {tierOrder.map((tier) => {
            const achievements = groupedAchievements[tier] || [];
            if (achievements.length === 0) return null;

            return (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-caption font-medium uppercase tracking-wider text-text-muted mb-3 capitalize">
                  {tier} Tier
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((achievement) => {
                    const unlocked = isUnlocked(achievement.id);
                    const Icon = achievementIcons[achievement.icon];
                    const colors = tierColors[achievement.tier];

                    return (
                      <motion.div
                        key={achievement.id}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "p-4 rounded-xl border transition-all",
                          unlocked
                            ? `${colors.bg} ${colors.border}`
                            : "bg-bg-1/50 border-border opacity-60"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              unlocked ? colors.bg : "bg-bg-2"
                            )}
                          >
                            {unlocked ? (
                              <Icon size={18} className={colors.text} />
                            ) : (
                              <Lock size={16} className="text-text-muted" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-body font-medium truncate",
                              unlocked ? "text-text-primary" : "text-text-muted"
                            )}>
                              {achievement.name}
                            </p>
                            <p className="text-[11px] text-text-muted truncate">
                              {achievement.description}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Zap size={10} className="text-accent" />
                              <span className="text-[10px] text-accent">+{achievement.xpReward} XP</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
