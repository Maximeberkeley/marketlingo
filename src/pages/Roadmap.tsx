import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { SeasonSection } from "@/components/roadmap/SeasonSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { NodeStatus } from "@/components/roadmap/RoadmapNode";

interface Week {
  weekNumber: number;
  status: NodeStatus;
  title: string;
  objective?: string;
  learnings?: string[];
}

interface Season {
  seasonNumber: number;
  title: string;
  weeks: Week[];
}

// Mock data
const seasons: Season[] = [
  {
    seasonNumber: 1,
    title: "Foundations",
    weeks: [
      { weekNumber: 1, status: "completed", title: "Market Overview", objective: "Understand the AI market landscape", learnings: ["Key players", "Market size", "Growth drivers"] },
      { weekNumber: 2, status: "completed", title: "Key Players", objective: "Identify major companies and their strategies", learnings: ["OpenAI", "Google DeepMind", "Anthropic"] },
      { weekNumber: 3, status: "current", title: "Value Chain", objective: "Map the AI value chain from chips to applications", learnings: ["Hardware layer", "Foundation models", "Application layer"] },
      { weekNumber: 4, status: "available", title: "Business Models", objective: "Analyze AI business models and revenue streams", learnings: ["SaaS", "API pricing", "Enterprise contracts"] },
    ],
  },
  {
    seasonNumber: 2,
    title: "Forces & Cycles",
    weeks: [
      { weekNumber: 5, status: "locked", title: "Hype Cycles", objective: "Understand technology adoption patterns", learnings: ["Gartner curve", "Crossing the chasm", "Market timing"] },
      { weekNumber: 6, status: "locked", title: "Regulation", objective: "Navigate AI regulation landscape", learnings: ["EU AI Act", "US policy", "China approach"] },
      { weekNumber: 7, status: "locked", title: "Talent Wars", objective: "Understand the AI talent market", learnings: ["Key researchers", "Talent flows", "Compensation trends"] },
      { weekNumber: 8, status: "locked", title: "Capital Flows", objective: "Track AI investment patterns", learnings: ["VC trends", "Corporate M&A", "Valuation dynamics"] },
    ],
  },
  {
    seasonNumber: 3,
    title: "Startup Patterns",
    weeks: [
      { weekNumber: 9, status: "locked", title: "Moat Building", objective: "Identify sustainable competitive advantages", learnings: ["Data moats", "Network effects", "Distribution advantages"] },
      { weekNumber: 10, status: "locked", title: "GTM Strategies", objective: "Analyze go-to-market approaches", learnings: ["PLG vs sales-led", "Vertical vs horizontal", "Pricing strategies"] },
      { weekNumber: 11, status: "locked", title: "Failure Modes", objective: "Learn from AI startup failures", learnings: ["Common pitfalls", "Pivoting strategies", "Timing issues"] },
      { weekNumber: 12, status: "locked", title: "Success Patterns", objective: "Study what winning looks like", learnings: ["Case studies", "Growth patterns", "Exit strategies"] },
    ],
  },
  {
    seasonNumber: 4,
    title: "Builder Mode",
    weeks: [
      { weekNumber: 13, status: "locked", title: "Thesis Building", objective: "Develop your market thesis", learnings: ["Framework building", "Contrarian views", "Conviction building"] },
      { weekNumber: 14, status: "locked", title: "Analysis Project", objective: "Deep-dive analysis exercise", learnings: ["Company analysis", "Market mapping", "Investment memo"] },
      { weekNumber: 15, status: "locked", title: "Future Scenarios", objective: "Scenario planning for AI futures", learnings: ["Bull case", "Bear case", "Black swans"] },
      { weekNumber: 16, status: "locked", title: "Synthesis", objective: "Complete your market mastery", learnings: ["Framework review", "Knowledge test", "Next steps"] },
    ],
  },
];

export default function RoadmapPage() {
  const navigate = useNavigate();
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const currentDay = 21; // Mock current day

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

  return (
    <AppLayout>
      <div className="screen-padding pt-12 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-h1 text-text-primary mb-1">Your 1-year path</h1>
          <p className="caption text-text-muted">Day {currentDay} of 365</p>
        </motion.div>

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
              Start Week
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
