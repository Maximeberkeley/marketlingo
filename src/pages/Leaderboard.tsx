import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Zap, Flame, Medal, Crown, Sparkles, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { markets } from "@/data/markets";

type TimeFilter = "weekly" | "monthly" | "all-time";

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
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all-time");

  const marketData = markets.find(m => m.id === selectedMarket);
  const marketName = marketData?.name || selectedMarket?.charAt(0).toUpperCase() + selectedMarket?.slice(1) || "Loading";

  useEffect(() => {
    fetchLeaderboard();
  }, [user, timeFilter]);

  const fetchLeaderboard = async () => {
    if (!user) return;
    setLoading(true);

    // Get user's market
    const { data: profile } = await supabase
      .from("profiles")
      .select("selected_market")
      .eq("id", user.id)
      .single();

    const market = profile?.selected_market || "aerospace";
    setSelectedMarket(market);

    if (timeFilter === "all-time") {
      // All-time: use user_xp table
      const { data: xpData } = await supabase
        .from("user_xp")
        .select("user_id, total_xp, current_level")
        .eq("market_id", market)
        .order("total_xp", { ascending: false })
        .limit(50);

      if (xpData) {
        await buildEntries(xpData, market);
      }
    } else {
      // Weekly/Monthly: aggregate xp_transactions
      const now = new Date();
      let since: Date;
      if (timeFilter === "weekly") {
        since = new Date(now);
        since.setDate(since.getDate() - 7);
      } else {
        since = new Date(now);
        since.setDate(since.getDate() - 30);
      }

      const { data: txns } = await supabase
        .from("xp_transactions")
        .select("user_id, xp_amount")
        .eq("market_id", market)
        .gte("created_at", since.toISOString());

      if (txns) {
        // Aggregate XP per user
        const userXPMap = new Map<string, number>();
        txns.forEach(t => {
          userXPMap.set(t.user_id, (userXPMap.get(t.user_id) || 0) + t.xp_amount);
        });

        const sorted = Array.from(userXPMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 50)
          .map(([user_id, total_xp]) => ({ user_id, total_xp, current_level: 1 }));

        await buildEntries(sorted, market);
      }
    }
    setLoading(false);
  };

  const buildEntries = async (xpData: { user_id: string; total_xp: number; current_level: number }[], market: string) => {
    const userIds = xpData.map(x => x.user_id);
    
    const [{ data: profiles }, { data: progressData }] = await Promise.all([
      supabase.from("profiles").select("id, username").in("id", userIds),
      supabase.from("user_progress").select("user_id, current_streak").eq("market_id", market).in("user_id", userIds),
    ]);

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
        isCurrentUser: xp.user_id === user!.id,
      };
    });

    setLeaderboard(entries);
    const userEntry = entries.find(e => e.isCurrentUser);
    if (userEntry) setCurrentUserRank(userEntry.rank);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={20} className="text-amber-400" />;
    if (rank === 2) return <Medal size={20} className="text-slate-300" />;
    if (rank === 3) return <Medal size={20} className="text-orange-400" />;
    return <span className="text-body font-semibold text-text-muted">#{rank}</span>;
  };

  const TIME_TABS: { key: TimeFilter; label: string }[] = [
    { key: "weekly", label: "This Week" },
    { key: "monthly", label: "This Month" },
    { key: "all-time", label: "All Time" },
  ];

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen bg-background overflow-x-hidden max-w-full">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-4 py-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <ArrowLeft size={24} className="text-text-secondary" />
            </button>
            <div className="flex-1">
              <h1 className="text-h2 text-text-primary flex items-center gap-2">
                <Trophy size={22} className="text-amber-400" />
                Leaderboard
              </h1>
              <p className="text-caption text-text-muted">
                {marketName} Industry
              </p>
            </div>
            {currentUserRank && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30">
                <Trophy size={14} className="text-accent" />
                <span className="text-caption font-medium text-accent">#{currentUserRank}</span>
              </div>
            )}
          </div>

          {/* Time filter tabs */}
          <div className="flex gap-1 px-4 pb-3">
            {TIME_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setTimeFilter(tab.key)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-caption font-semibold transition-all",
                  timeFilter === tab.key
                    ? "bg-accent text-white"
                    : "bg-bg-2 text-text-muted"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prize Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-orange-500/20 border border-amber-500/30"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-body font-semibold text-text-primary mb-1">
                Become the Industry Master
              </h3>
              <p className="text-caption text-text-secondary leading-relaxed">
                The <span className="text-amber-400 font-medium">#1 ranked user</span> in each industry every 6 months wins{" "}
                <span className="text-amber-400 font-semibold">1 Full Year of MarketLingo Premium!</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Industry indicator */}
        <div className="px-4 pt-4 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-2 border border-border">
            {marketData?.emoji && <span className="text-sm">{marketData.emoji}</span>}
            <span className="text-caption font-medium text-text-primary">{marketName} Rankings</span>
            <span className="text-[10px] text-text-muted">·</span>
            <span className="text-[10px] text-accent font-medium capitalize">{timeFilter.replace("-", " ")}</span>
          </div>
        </div>

        <div className="px-4 py-2 pb-28">
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
                      : entry.rank <= 3
                        ? "bg-gradient-to-r from-amber-500/5 to-transparent border-amber-500/20"
                        : "bg-bg-2/50 border-border"
                  )}
                >
                  {/* Rank */}
                  <div className="w-10 flex items-center justify-center">
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
                  <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-bg-1">
                    <Zap size={14} className="text-accent" />
                    <span className="text-caption font-semibold text-text-primary">
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
