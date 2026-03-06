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

// Editorial hero
import achievementsHero from "@/assets/cards/achievements-hero.jpg";

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
  const progressPercent = getTotalCount() > 0 ? Math.round((getUnlockedCount() / getTotalCount()) * 100) : 0;

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
          {/* Editorial Hero Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl"
          >
            <img src={achievementsHero} alt="Achievements" className="w-full h-36 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-amber-900/80 via-amber-900/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-200/80 mb-1">Your Progress</p>
                  <p className="text-2xl font-bold text-white">{progressPercent}% Complete</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                  <Zap size={12} className="text-amber-300" />
                  <span className="text-xs font-semibold text-white">{getUnlockedCount()} badges</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-amber-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>

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
