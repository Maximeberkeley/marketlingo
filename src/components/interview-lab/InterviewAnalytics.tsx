import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart2, Trophy, Lock, Crown, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "./ScoreBar";
import type { InterviewPath } from "@/data/interviewLabData";

interface InterviewAnalyticsProps {
  userId?: string;
  marketId: string | null;
  path: InterviewPath | null;
}

export function InterviewAnalytics({ userId, marketId, path }: InterviewAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isProUser } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || !marketId) return;

    Promise.all([
      supabase.from('interview_lab_attempts')
        .select('score, structure_score, content_score, persona_score, created_at, attempt_type')
        .eq('user_id', userId).eq('market_id', marketId)
        .order('created_at', { ascending: false }).limit(20),
      // Query leaderboard without the broken profiles join
      supabase.from('interview_leaderboard')
        .select('*')
        .eq('market_id', marketId)
        .order('avg_score', { ascending: false }).limit(10),
    ]).then(async ([attemptsRes, leaderboardRes]) => {
      setAnalytics(attemptsRes.data || []);

      // Manually hydrate usernames from profiles
      const entries = leaderboardRes.data || [];
      if (entries.length > 0) {
        const userIds = [...new Set(entries.map((e: any) => e.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        const hydrated = entries.map((e: any) => ({
          ...e,
          profile: profileMap.get(e.user_id) || { username: 'Anonymous', avatar_url: null },
        }));
        setLeaderboard(hydrated);
      }

      setLoading(false);
    });
  }, [userId, marketId]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const mockAttempts = analytics.filter(a => a.attempt_type === 'mock');
  const avgScore = mockAttempts.length > 0 ? Math.round(mockAttempts.reduce((s, a) => s + (a.score || 0), 0) / mockAttempts.length) : 0;
  const bestScore = mockAttempts.length > 0 ? Math.max(...mockAttempts.map(a => a.score || 0)) : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={18} className="text-violet-500" />
        <h3 className="text-base font-bold text-text-primary">Performance Analytics</h3>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-bg-2 rounded-2xl p-4 border border-border text-center">
          <p className="text-2xl font-black text-violet-500">{mockAttempts.length}</p>
          <p className="text-[10px] text-text-muted">Mocks Done</p>
        </div>
        <div className="bg-bg-2 rounded-2xl p-4 border border-border text-center">
          <p className="text-2xl font-black text-emerald-500">{avgScore}</p>
          <p className="text-[10px] text-text-muted">Avg Score</p>
        </div>
        <div className="bg-bg-2 rounded-2xl p-4 border border-border text-center">
          <p className="text-2xl font-black text-amber-500">{bestScore}</p>
          <p className="text-[10px] text-text-muted">Best Score</p>
        </div>
      </div>

      {/* Score breakdown averages */}
      {mockAttempts.length > 0 && (
        <div className="bg-bg-2 rounded-2xl p-4 border border-border mb-4">
          <p className="text-sm font-bold text-text-primary mb-3">Score Breakdown</p>
          <div className="space-y-2">
            <ScoreBar label="Structure" value={Math.round(mockAttempts.reduce((s, a) => s + (a.structure_score || 0), 0) / mockAttempts.length)} color="#7C3AED" />
            <ScoreBar label="Content" value={Math.round(mockAttempts.reduce((s, a) => s + (a.content_score || 0), 0) / mockAttempts.length)} color="#3B82F6" />
            <ScoreBar label="Persona" value={Math.round(mockAttempts.reduce((s, a) => s + (a.persona_score || 0), 0) / mockAttempts.length)} color="#F59E0B" />
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={18} className="text-amber-500" />
        <h3 className="text-base font-bold text-text-primary">Weekly Leaderboard</h3>
      </div>

      {!isProUser ? (
        <div className="bg-bg-2 rounded-2xl p-6 border border-border text-center">
          <Lock size={24} className="text-violet-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-text-primary mb-1">Leaderboard is Pro-only</p>
          <p className="text-xs text-text-muted mb-3">See how you rank against other candidates.</p>
          <Button onClick={() => navigate('/subscription')} size="sm" className="bg-violet-600 text-white">
            <Crown size={12} /> Upgrade
          </Button>
        </div>
      ) : leaderboard.length > 0 ? (
        <div className="space-y-2">
          {leaderboard.map((entry, i) => (
            <div key={entry.id} className={cn(
              "bg-bg-2 rounded-xl p-3 border border-border flex items-center gap-3",
              i < 3 && "border-amber-500/30"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black",
                i === 0 ? "bg-amber-400 text-white" :
                i === 1 ? "bg-gray-300 text-white" :
                i === 2 ? "bg-amber-700 text-white" :
                "bg-bg-1 text-text-muted"
              )}>
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{entry.profile?.username || 'Anonymous'}</p>
                <p className="text-[10px] text-text-muted">{entry.mocks_completed} mocks</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-violet-500">{Math.round(entry.avg_score)}</p>
                <p className="text-[10px] text-text-muted">avg</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-bg-2 rounded-2xl p-6 border border-border text-center">
          <Star size={24} className="text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">No leaderboard data yet. Complete mock interviews to rank!</p>
        </div>
      )}

      {/* Recent attempts */}
      {analytics.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-bold text-text-primary mb-3">Recent Attempts</p>
          <div className="space-y-2">
            {analytics.slice(0, 5).map((a, i) => (
              <div key={i} className="bg-bg-2 rounded-xl p-3 border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-text-primary capitalize">{a.attempt_type}</p>
                  <p className="text-[10px] text-text-muted">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  (a.score || 0) >= 80 ? "text-emerald-500" : (a.score || 0) >= 50 ? "text-amber-500" : "text-red-500"
                )}>
                  {a.score ?? 0}/100
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
