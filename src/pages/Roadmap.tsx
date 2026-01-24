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

// Aerospace Month 1 curriculum patterns organized by day (upgraded with startup-ready depth)
const aerospacePatterns: Record<number, { title: string; pattern: string }> = {
  // Week 1: Market Structure
  1: { title: "Buyer ≠ User", pattern: "Map the buying committee—user love ≠ purchase authority" },
  2: { title: "OEM Gatekeeping", pattern: "Risk beats performance; partner with Tier-1s first" },
  3: { title: "Supply Chain Architecture", pattern: "Enter at Tier-2/3, become indispensable upstream" },
  4: { title: "The Approval Maze", pattern: "Change = approval chain; build DER relationships" },
  5: { title: "Governance = Velocity", pattern: "Regulatory strategy is product strategy" },
  // Week 2: Certification Reality
  6: { title: "Type Certification Deep Dive", pattern: "TC is the product; Part 23 vs Part 25 defines viability" },
  7: { title: "STC: The Modification Path", pattern: "Modify existing aircraft—realistic startup entry" },
  8: { title: "Change Friction Economics", pattern: "Minimize certification surface area in design" },
  9: { title: "Why Aerospace Moves Slowly", pattern: "Incentives reward caution; adapt or fail" },
  10: { title: "Conservative by Design", pattern: "Heritage wins; dual-source everything critical" },
  // Week 3: Business Dynamics
  11: { title: "Cost-Plus: The Defense Model", pattern: "Contract type = risk profile and profitability" },
  12: { title: "Contract Types Decoded", pattern: "Power by the Hour, risk-sharing, data ownership" },
  13: { title: "Timeline Mismatch Trap", pattern: "VC timelines don't match aerospace; find patient capital" },
  14: { title: "Startup Killers", pattern: "Cash timing, cert pivots, key person risk" },
  15: { title: "Cash Flow Cycles", pattern: "9-month working capital cycles; structure advances" },
  // Week 4: Execution Patterns
  16: { title: "Requirement Creep Danger", pattern: "Formal change control from day one" },
  17: { title: "Hardware-First Trap", pattern: "Paper airplane phase before metal" },
  18: { title: "The Trust Economy", pattern: "AS9100, track record, evidence culture" },
  19: { title: "Supply Chain Control", pattern: "Vertical integration vs. supplier management" },
  20: { title: "First Customer Strategy", pattern: "Tier-1 partners, defense R&D, MRO channels" },
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

      // Build seasons based on 6-month curriculum (180 days = 36 weeks = 6 seasons)
      const currentWeek = getDayWeek(day);
      
      const buildSeasons: Season[] = [
        {
          seasonNumber: 1,
          title: "Month 1: Foundations",
          weeks: [
            buildWeek(1, currentWeek, "Market Structure", [1, 2, 3, 4, 5]),
            buildWeek(2, currentWeek, "Certification Reality", [6, 7, 8, 9, 10]),
            buildWeek(3, currentWeek, "Business Dynamics", [11, 12, 13, 14, 15]),
            buildWeek(4, currentWeek, "Execution Patterns", [16, 17, 18, 19, 20]),
          ],
        },
        {
          seasonNumber: 2,
          title: "Month 2: Forces & Cycles",
          weeks: [
            buildWeek(5, currentWeek, "Regulation Deep Dive", [21, 22, 23, 24, 25]),
            buildWeek(6, currentWeek, "Capital Flows", [26, 27, 28, 29, 30]),
            buildWeek(7, currentWeek, "Talent Dynamics", [31, 32, 33, 34, 35]),
            buildWeek(8, currentWeek, "Technology Waves", [36, 37, 38, 39, 40]),
          ],
        },
        {
          seasonNumber: 3,
          title: "Month 3: Startup Patterns",
          weeks: [
            buildWeek(9, currentWeek, "Moat Building", [41, 42, 43, 44, 45]),
            buildWeek(10, currentWeek, "GTM Strategies", [46, 47, 48, 49, 50]),
            buildWeek(11, currentWeek, "Failure Modes", [51, 52, 53, 54, 55]),
            buildWeek(12, currentWeek, "Success Stories", [56, 57, 58, 59, 60]),
          ],
        },
        {
          seasonNumber: 4,
          title: "Month 4: Key Players",
          weeks: [
            buildWeek(13, currentWeek, "Commercial Giants", [61, 62, 63, 64, 65]),
            buildWeek(14, currentWeek, "Defense Primes", [66, 67, 68, 69, 70]),
            buildWeek(15, currentWeek, "Space Innovators", [71, 72, 73, 74, 75]),
            buildWeek(16, currentWeek, "Supply Chain", [76, 77, 78, 79, 80]),
          ],
        },
        {
          seasonNumber: 5,
          title: "Month 5: Investment Lens",
          weeks: [
            buildWeek(17, currentWeek, "Public Markets", [81, 82, 83, 84, 85]),
            buildWeek(18, currentWeek, "Private Markets", [86, 87, 88, 89, 90]),
            buildWeek(19, currentWeek, "Due Diligence", [91, 92, 93, 94, 95]),
            buildWeek(20, currentWeek, "Portfolio Strategy", [96, 97, 98, 99, 100]),
            buildWeek(21, currentWeek, "Valuation Models", [101, 102, 103, 104, 105]),
            buildWeek(22, currentWeek, "Risk Assessment", [106, 107, 108, 109, 110]),
          ],
        },
        {
          seasonNumber: 6,
          title: "Month 6: Builder Mode",
          weeks: [
            buildWeek(23, currentWeek, "Thesis Building", [111, 112, 113, 114, 115]),
            buildWeek(24, currentWeek, "Analysis Project", [116, 117, 118, 119, 120]),
            buildWeek(25, currentWeek, "Future Scenarios", [121, 122, 123, 124, 125]),
            buildWeek(26, currentWeek, "Company Deep Dive", [126, 127, 128, 129, 130]),
            buildWeek(27, currentWeek, "Trend Analysis", [131, 132, 133, 134, 135]),
            buildWeek(28, currentWeek, "Final Synthesis", [136, 137, 138, 139, 140]),
            buildWeek(29, currentWeek, "Capstone Week 1", [141, 142, 143, 144, 145]),
            buildWeek(30, currentWeek, "Capstone Week 2", [146, 147, 148, 149, 150]),
            buildWeek(31, currentWeek, "Advanced Topics", [151, 152, 153, 154, 155]),
            buildWeek(32, currentWeek, "Industry Connections", [156, 157, 158, 159, 160]),
            buildWeek(33, currentWeek, "Career Pathways", [161, 162, 163, 164, 165]),
            buildWeek(34, currentWeek, "Expert Insights", [166, 167, 168, 169, 170]),
            buildWeek(35, currentWeek, "Final Review", [171, 172, 173, 174, 175]),
            buildWeek(36, currentWeek, "Graduation", [176, 177, 178, 179, 180]),
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
          <p className="caption text-text-muted">Day {currentDay} of 180 • Week {getDayWeek(currentDay)}</p>
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
