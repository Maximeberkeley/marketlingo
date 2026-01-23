import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { SeasonSection } from "@/components/roadmap/SeasonSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { NodeStatus } from "@/components/roadmap/RoadmapNode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface Week {
  weekNumber: number;
  status: NodeStatus;
  title: string;
  objective?: string;
  learnings?: string[];
  dayRange: string;
}

interface Season {
  seasonNumber: number;
  title: string;
  weeks: Week[];
}

// Map day numbers to weeks (5 days per week, 4 weeks per month)
function getDayWeek(day: number): number {
  return Math.ceil(day / 5);
}

// Aerospace Month 1 curriculum patterns organized by day
const aerospacePatterns: Record<number, { title: string; pattern: string }> = {
  1: { title: "Buyer ≠ User", pattern: "Understanding who signs the check" },
  2: { title: "OEM Gatekeeping", pattern: "Risk beats performance" },
  3: { title: "Tiered Supply Chain", pattern: "Tier ladder navigation" },
  4: { title: "Approval Chain", pattern: "Who must approve changes" },
  5: { title: "Authority & Speed", pattern: "Governance unlocks velocity" },
  6: { title: "Type Certification", pattern: "Certification is the product" },
  7: { title: "TC vs STC", pattern: "Change = certification work" },
  8: { title: "Change Friction", pattern: "Minimize certification surface" },
  9: { title: "Why Aerospace is Slow", pattern: "Incentives reward caution" },
  10: { title: "Conservative System", pattern: "Rules encode past failures" },
  11: { title: "Cost-Plus Incentives", pattern: "Contract type matters" },
  12: { title: "Contract Types", pattern: "Contract is the business model" },
  13: { title: "Timeline Mismatch", pattern: "Match customers to runway" },
  14: { title: "Startup Killers", pattern: "Cash timing vs cycles" },
  15: { title: "Requirement Creep", pattern: "Guard scope early" },
  16: { title: "Hardware-First Trap", pattern: "Start with pathway" },
  17: { title: "Trust Economy", pattern: "Design evidence into product" },
  18: { title: "Supply Chain Control", pattern: "Control follows risk" },
  19: { title: "First Customer", pattern: "Sell into the chain" },
  20: { title: "Month Review", pattern: "Fix pathway first" },
};

export default function RoadmapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;

      // Get user's selected market
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market")
        .eq("id", user.id)
        .single();

      const market = profile?.selected_market || "aerospace";

      // Get user progress
      const { data: progress } = await supabase
        .from("user_progress")
        .select("current_day")
        .eq("user_id", user.id)
        .eq("market_id", market)
        .single();

      const day = progress?.current_day || 1;
      setCurrentDay(day);

      // Build seasons based on curriculum
      const currentWeek = getDayWeek(day);
      
      const buildSeasons: Season[] = [
        {
          seasonNumber: 1,
          title: "Foundations",
          weeks: [
            buildWeek(1, currentWeek, "Market Structure", [1, 2, 3, 4, 5]),
            buildWeek(2, currentWeek, "Certification Reality", [6, 7, 8, 9, 10]),
            buildWeek(3, currentWeek, "Business Dynamics", [11, 12, 13, 14, 15]),
            buildWeek(4, currentWeek, "Execution Patterns", [16, 17, 18, 19, 20]),
          ],
        },
        {
          seasonNumber: 2,
          title: "Forces & Cycles",
          weeks: [
            buildWeek(5, currentWeek, "Regulation Deep Dive", [21, 22, 23, 24, 25]),
            buildWeek(6, currentWeek, "Capital Flows", [26, 27, 28, 29, 30]),
            buildWeek(7, currentWeek, "Talent Dynamics", [31, 32, 33, 34, 35]),
            buildWeek(8, currentWeek, "Technology Waves", [36, 37, 38, 39, 40]),
          ],
        },
        {
          seasonNumber: 3,
          title: "Startup Patterns",
          weeks: [
            buildWeek(9, currentWeek, "Moat Building", [41, 42, 43, 44, 45]),
            buildWeek(10, currentWeek, "GTM Strategies", [46, 47, 48, 49, 50]),
            buildWeek(11, currentWeek, "Failure Modes", [51, 52, 53, 54, 55]),
            buildWeek(12, currentWeek, "Success Patterns", [56, 57, 58, 59, 60]),
          ],
        },
        {
          seasonNumber: 4,
          title: "Builder Mode",
          weeks: [
            buildWeek(13, currentWeek, "Thesis Building", [61, 62, 63, 64, 65]),
            buildWeek(14, currentWeek, "Analysis Project", [66, 67, 68, 69, 70]),
            buildWeek(15, currentWeek, "Future Scenarios", [71, 72, 73, 74, 75]),
            buildWeek(16, currentWeek, "Synthesis", [76, 77, 78, 79, 80]),
          ],
        },
      ];

      setSeasons(buildSeasons);
      setLoading(false);
    };

    fetchProgress();
  }, [user]);

  function buildWeek(weekNum: number, currentWeek: number, title: string, days: number[]): Week {
    let status: NodeStatus = "locked";
    if (weekNum < currentWeek) status = "completed";
    else if (weekNum === currentWeek) status = "current";
    else if (weekNum === currentWeek + 1) status = "available";

    // Build learnings from actual curriculum patterns
    const learnings = days
      .filter(d => aerospacePatterns[d])
      .map(d => aerospacePatterns[d].title)
      .slice(0, 3);

    // Build objective from patterns
    const patterns = days
      .filter(d => aerospacePatterns[d])
      .map(d => aerospacePatterns[d].pattern);
    const objective = patterns[0] || `Master ${title.toLowerCase()} concepts`;

    return {
      weekNumber: weekNum,
      status,
      title,
      objective,
      learnings: learnings.length > 0 ? learnings : ["Coming soon"],
      dayRange: `Days ${days[0]}-${days[days.length - 1]}`,
    };
  }

  const handleWeekClick = (weekNumber: number) => {
    for (const season of seasons) {
      const week = season.weeks.find((w) => w.weekNumber === weekNumber);
      if (week && week.status !== "locked") {
        setSelectedWeek(week);
        break;
      }
    }
  };

  const handleStartWeek = () => {
    setSelectedWeek(null);
    navigate("/home");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="screen-padding pt-12 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-h1 text-text-primary mb-1">Your Learning Path</h1>
          <p className="caption text-text-muted">Day {currentDay} of 365 • Week {getDayWeek(currentDay)}</p>
        </motion.div>

        {/* Current Pattern */}
        {aerospacePatterns[currentDay] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-elevated mb-6"
          >
            <p className="text-caption text-primary mb-1">Today's Pattern</p>
            <h3 className="text-h3 text-text-primary">{aerospacePatterns[currentDay].title}</h3>
            <p className="text-body text-text-secondary mt-1">{aerospacePatterns[currentDay].pattern}</p>
          </motion.div>
        )}

        {/* Seasons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {seasons.map((season, index) => (
            <motion.div
              key={season.seasonNumber}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <SeasonSection
                seasonNumber={season.seasonNumber}
                title={season.title}
                weeks={season.weeks}
                onWeekClick={handleWeekClick}
                defaultExpanded={season.seasonNumber === 1}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Week Detail Modal */}
      <Dialog open={!!selectedWeek} onOpenChange={() => setSelectedWeek(null)}>
        <DialogContent className="bg-bg-2 border-border max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-h2 text-text-primary">
              Week {selectedWeek?.weekNumber}: {selectedWeek?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <p className="text-caption text-text-muted mb-1">{selectedWeek?.dayRange}</p>
              <h4 className="text-caption text-primary mb-1">This week's objective</h4>
              <p className="text-body text-text-secondary">{selectedWeek?.objective}</p>
            </div>

            <div>
              <h4 className="text-caption text-primary mb-2">What you'll learn</h4>
              <ul className="space-y-1.5">
                {selectedWeek?.learnings?.map((learning) => (
                  <li key={learning} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-body text-text-secondary">{learning}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button variant="cta" size="full" onClick={handleStartWeek}>
              {selectedWeek?.status === "current" ? "Continue Learning" : "Start Week"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
