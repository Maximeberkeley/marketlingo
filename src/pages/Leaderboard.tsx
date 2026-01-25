import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Zap, Flame, Medal, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  isCurrentUser: boolean;
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!user) return;

      // Get user's market
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market")
        .eq("id", user.id)
        .single();

      const market = profile?.selected_market || "aerospace";
      setSelectedMarket(market);

      // Fetch XP data for all users in this market
      const { data: xpData } = await supabase
        .from("user_xp")
        .select("user_id, total_xp, current_level")
        .eq("market_id", market)
        .order("total_xp", { ascending: false })
        .limit(50);

      if (!xpData) {
        setLoading(false);
        return;
      }

      // Get usernames and streaks
      const userIds = xpData.map(x => x.user_id);
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const { data: progressData } = await supabase
        .from("user_progress")
        .select("user_id, current_streak")
        .eq("market_id", market)
        .in("user_id", userIds);

      const entries: LeaderboardEntry[] = xpData.map((xp, index) => {
        const profileData = profiles?.find(p => p.id === xp.user_id);
        const streakData = progressData?.find(p => p.user_id === xp.user_id);
        
        return {
          rank: index + 1,
          user_id: xp.user_id,
          username: profileData?.username?.split("@")[0] || `User ${index + 1}`,
          total_xp: xp.total_xp,
          current_level: xp.current_level,
          current_streak: streakData?.current_streak || 0,
          isCurrentUser: xp.user_id === user.id,
        };
      });

      setLeaderboard(entries);
      
      const userEntry = entries.find(e => e.isCurrentUser);
      if (userEntry) {
        setCurrentUserRank(userEntry.rank);
      }

      setLoading(false);
    };

    fetchLeaderboard();
  }, [user]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={18} className="text-amber-400" />;
    if (rank === 2) return <Medal size={18} className="text-slate-300" />;
    if (rank === 3) return <Medal size={18} className="text-orange-400" />;
    return <span className="text-caption font-medium text-text-muted">#{rank}</span>;
  };

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
              <h1 className="text-h2 text-text-primary">Leaderboard</h1>
              <p className="text-caption text-text-muted">
                {selectedMarket ? `${selectedMarket.charAt(0).toUpperCase() + selectedMarket.slice(1)} Market` : "Loading..."}
              </p>
            </div>
            {currentUserRank && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30">
                <Trophy size={14} className="text-accent" />
                <span className="text-caption font-medium text-accent">#{currentUserRank}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-4 pb-28">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy size={48} className="text-text-muted mx-auto mb-4" />
              <p className="text-body text-text-secondary">No one on the leaderboard yet!</p>
              <p className="text-caption text-text-muted">Complete lessons to earn XP</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    entry.isCurrentUser
                      ? "bg-accent/10 border-accent/30"
                      : "bg-bg-2/50 border-border"
                  )}
                >
                  {/* Rank */}
                  <div className="w-8 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-body font-medium truncate",
                      entry.isCurrentUser ? "text-accent" : "text-text-primary"
                    )}>
                      {entry.username}
                      {entry.isCurrentUser && " (You)"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-muted">
                        Lv. {entry.current_level}
                      </span>
                      {entry.current_streak > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] text-orange-400">
                          <Flame size={10} />
                          {entry.current_streak}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* XP */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-1">
                    <Zap size={12} className="text-accent" />
                    <span className="text-caption font-medium text-text-primary">
                      {entry.total_xp.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
