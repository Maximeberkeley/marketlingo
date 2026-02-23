import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Download, Lock, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getMarketName, getMarketEmoji, getMarketById } from "@/data/markets";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";

interface StampData {
  month: number;
  theme: string;
  completed: boolean;
  grade: "A+" | "A" | "B" | "C" | null;
  completedDate: string | null;
  daysCompleted: number;
  totalDays: number;
}

function getGradeFromCompletion(daysCompleted: number, totalDays: number): "A+" | "A" | "B" | "C" | null {
  if (daysCompleted === 0) return null;
  const pct = daysCompleted / totalDays;
  if (pct >= 0.95) return "A+";
  if (pct >= 0.8) return "A";
  if (pct >= 0.6) return "B";
  return "C";
}

const gradeColors: Record<string, string> = {
  "A+": "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  A: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  B: "text-blue-400 border-blue-400/40 bg-blue-400/10",
  C: "text-text-muted border-border bg-bg-2",
};

const stampEmojis = ["🏛️", "🔬", "⚔️", "🌌", "🔮", "👑"];

export default function PassportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [marketId, setMarketId] = useState<string | null>(null);
  const [stamps, setStamps] = useState<StampData[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [totalXP, setTotalXP] = useState(0);
  const [learningGoal, setLearningGoal] = useState<string | null>(null);
  const passportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchPassportData = async () => {
      // Get profile & progress
      const [profileRes, xpRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("selected_market")
          .eq("id", user.id)
          .single(),
        supabase
          .from("user_xp")
          .select("total_xp, market_id")
          .eq("user_id", user.id),
      ]);

      const mId = profileRes.data?.selected_market;
      if (!mId) return;
      setMarketId(mId);

      const marketXP = xpRes.data?.find((x) => x.market_id === mId);
      setTotalXP(marketXP?.total_xp || 0);

      // Get progress
      const { data: progress } = await supabase
        .from("user_progress")
        .select("current_day, learning_goal, completed_stacks")
        .eq("user_id", user.id)
        .eq("market_id", mId)
        .single();

      const day = progress?.current_day || 1;
      setCurrentDay(day);
      setLearningGoal(progress?.learning_goal || null);

      const completedCount = progress?.completed_stacks?.length || 0;

      // Build stamps from market themes
      const market = getMarketById(mId);
      const themes = market?.themes || [
        "Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6",
      ];

      const builtStamps: StampData[] = themes.map((theme, i) => {
        const monthStart = i * 30 + 1;
        const monthEnd = (i + 1) * 30;
        const isCompleted = day > monthEnd;
        const isActive = day >= monthStart && day <= monthEnd;
        const daysInMonth = Math.min(30, Math.max(0, day - monthStart));

        // Rough completion estimate based on completed stacks
        const monthStacks = Math.floor(completedCount / 6); // ~6 months
        const monthCompletion = isCompleted ? 30 : isActive ? daysInMonth : 0;

        return {
          month: i + 1,
          theme,
          completed: isCompleted,
          grade: isCompleted
            ? getGradeFromCompletion(monthCompletion, 30)
            : isActive
            ? getGradeFromCompletion(daysInMonth, 30)
            : null,
          completedDate: isCompleted
            ? new Date(Date.now() - (day - monthEnd) * 86400000).toLocaleDateString()
            : null,
          daysCompleted: monthCompletion,
          totalDays: 30,
        };
      });

      setStamps(builtStamps);
    };

    fetchPassportData();
  }, [user]);

  const goalLabels: Record<string, string> = {
    join_industry: "Career Move",
    invest: "Investor Lens",
    build_startup: "Founder Path",
    curiosity: "Explorer Mode",
  };

  const handleShare = async () => {
    const text = `🛂 My ${getMarketName(marketId || "")} Industry Passport\n\n${stamps
      .filter((s) => s.completed)
      .map((s) => `✅ ${s.theme} — Grade ${s.grade}`)
      .join("\n")}\n\n${totalXP} XP earned • Day ${currentDay}/180\n\nBuilding industry mastery on MarketLingo 📚`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      import("sonner").then(({ toast }) => toast.success("Copied to clipboard!"));
    }
  };

  const completedStamps = stamps.filter((s) => s.completed).length;

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-b from-bg-0 to-bg-1">
        {/* Header */}
        <div className="screen-padding pt-6 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-secondary mb-4 hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-body">Back</span>
          </button>
        </div>

        {/* Passport Cover */}
        <motion.div
          ref={passportRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 rounded-3xl border-2 border-accent/30 bg-gradient-to-br from-bg-2 via-bg-1 to-bg-2 overflow-hidden"
        >
          {/* Cover Header */}
          <div className="p-6 pb-4 text-center border-b border-border">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-3xl">🛂</span>
            </div>
            <h1 className="text-xl font-bold text-text-primary tracking-wide uppercase">
              Industry Passport
            </h1>
            {marketId && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-2xl">{getMarketEmoji(marketId)}</span>
                <span className="text-body text-text-secondary font-medium">
                  {getMarketName(marketId)}
                </span>
              </div>
            )}
            {learningGoal && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-accent/15 text-accent text-caption font-medium">
                {goalLabels[learningGoal] || learningGoal}
              </span>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-around p-4 border-b border-border">
            <div className="text-center">
              <p className="text-h2 text-text-primary font-bold">{currentDay}</p>
              <p className="text-caption text-text-muted">Day</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-h2 text-text-primary font-bold">{totalXP.toLocaleString()}</p>
              <p className="text-caption text-text-muted">XP</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-h2 text-text-primary font-bold">{completedStamps}/6</p>
              <p className="text-caption text-text-muted">Stamps</p>
            </div>
          </div>

          {/* Stamps Grid */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {stamps.map((stamp, index) => (
                <motion.div
                  key={stamp.month}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.08 }}
                  className={cn(
                    "relative p-4 rounded-2xl border-2 text-center transition-all",
                    stamp.completed
                      ? "border-accent/40 bg-accent/5"
                      : stamp.grade !== null
                      ? "border-border bg-bg-1"
                      : "border-border/50 bg-bg-2/50 opacity-50"
                  )}
                >
                  {/* Stamp Visual */}
                  <div className="text-3xl mb-2">
                    {stamp.completed ? stampEmojis[index] || "✅" : stamp.grade !== null ? "📖" : "🔒"}
                  </div>

                  <p className="text-caption font-semibold text-text-primary mb-0.5 line-clamp-1">
                    {stamp.theme}
                  </p>

                  <p className="text-[10px] text-text-muted mb-2">Month {stamp.month}</p>

                  {/* Grade Badge */}
                  {stamp.grade ? (
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 rounded-full border text-xs font-bold",
                        gradeColors[stamp.grade] || gradeColors.C
                      )}
                    >
                      {stamp.grade}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
                      <Lock size={10} /> Locked
                    </span>
                  )}

                  {/* Completed date */}
                  {stamp.completedDate && (
                    <p className="text-[9px] text-text-muted mt-1">{stamp.completedDate}</p>
                  )}

                  {/* Completed checkmark */}
                  {stamp.completed && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 size={16} className="text-accent" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer inside passport */}
          <div className="p-4 pt-0 text-center">
            <p className="text-[10px] text-text-muted">
              {completedStamps === 6
                ? "🎓 Full mastery achieved — Congratulations!"
                : `${6 - completedStamps} stamps remaining to complete your passport`}
            </p>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="screen-padding mt-6 pb-32 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleShare}
          >
            <Share2 size={16} />
            Share Progress
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            disabled
          >
            <Download size={16} />
            Export Card
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
