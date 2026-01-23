import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Cpu, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { StackCard } from "@/components/ui/StackCard";
import { SlideReader } from "@/components/slides/SlideReader";
import { toast } from "sonner";

// Mock data for demo
const mockDailyBrief = {
  title: "Today's Market Brief",
  subtitle: "5 minutes • 6 slides",
  headline: "OpenAI launches GPT-5, reshaping enterprise AI adoption",
  slides: [
    {
      slideNumber: 1,
      title: "What happened",
      body: "OpenAI announced GPT-5 with significantly improved reasoning capabilities and a 200K context window. Enterprise customers get early access, while consumer rollout follows in 30 days.",
      sources: [{ label: "Reuters", url: "#" }, { label: "OpenAI Blog", url: "#" }],
    },
    {
      slideNumber: 2,
      title: "Why it matters for AI",
      body: "This release intensifies the foundation model race. Microsoft's $10B investment now shows clear ROI. Competing labs must accelerate or specialize to maintain relevance.",
      sources: [{ label: "The Information", url: "#" }],
    },
    {
      slideNumber: 3,
      title: "Historical parallel",
      body: "Mirrors AWS's 2006 EC2 launch—when cloud became inevitable. Companies that hesitated on cloud migration lost 3-5 years. Similar timeline pressure emerges for AI adoption.",
      sources: [{ label: "HBR Archive", url: "#" }],
    },
    {
      slideNumber: 4,
      title: "Pro POV",
      body: "Interpretation: Enterprise AI budgets will consolidate around fewer vendors. The 'best-of-breed' approach yields to platform plays. Watch for acquisition of specialized AI startups.",
      sources: [{ label: "a16z", url: "#" }],
    },
    {
      slideNumber: 5,
      title: "Startup implication",
      body: "Startups building on GPT-4 need migration plans. Those with proprietary data moats gain leverage. Pure wrapper plays face existential pressure within 12 months.",
      sources: [{ label: "Crunchbase", url: "#" }],
    },
    {
      slideNumber: 6,
      title: "Reflection",
      body: "Consider: How would your portfolio companies be affected? Which bets become stronger, which weaker?",
      sources: [],
    },
  ],
};

const savedInsights = [
  "AI chip shortage timeline",
  "NVIDIA moat analysis",
  "Enterprise AI spend",
];

export default function HomePage() {
  const navigate = useNavigate();
  const [marketName, setMarketName] = useState("AI Industry");
  const [streak, setStreak] = useState(7);
  const [showReader, setShowReader] = useState(false);
  const [lessonProgress, setLessonProgress] = useState(40);

  useEffect(() => {
    const stored = localStorage.getItem("selectedMarket");
    if (!stored) {
      navigate("/");
      return;
    }
    // Map market ID to display name
    const marketNames: Record<string, string> = {
      ai: "AI Industry",
      fintech: "Fintech",
      ev: "Electric Vehicles",
      biotech: "Biotech",
      energy: "Clean Energy",
      mobile: "Mobile Tech",
      agtech: "AgTech",
      aerospace: "Aerospace",
      creator: "Creator Economy",
      ecommerce: "E-commerce",
      gaming: "Gaming",
    };
    setMarketName(marketNames[stored] || "AI Industry");
  }, [navigate]);

  const handleStackComplete = () => {
    setShowReader(false);
    setStreak((prev) => prev + 1);
    toast.success("Stack completed! Streak updated 🔥");
  };

  return (
    <AppLayout>
      <div className="screen-padding pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-button bg-primary/20 flex items-center justify-center">
              <Cpu size={20} className="text-primary" />
            </div>
            <span className="text-h3 text-text-primary">{marketName}</span>
          </div>
          <StreakBadge count={streak} />
        </motion.div>

        {/* Daily Brief Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <StackCard
            title={mockDailyBrief.title}
            subtitle={mockDailyBrief.subtitle}
            headline={mockDailyBrief.headline}
            onClick={() => setShowReader(true)}
          />
        </motion.div>

        {/* Lesson of the Week */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-4"
        >
          <StackCard
            title="Lesson of the Week"
            subtitle="7 minutes • 1 stack"
            progress={lessonProgress}
            ctaText="Continue"
            onClick={() => setShowReader(true)}
          />
        </motion.div>

        {/* Trainer Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <StackCard
            title="Trainer"
            subtitle="2 minutes • Reasoning drill"
            ctaText="Test myself"
            onClick={() => navigate("/trainer")}
          />
        </motion.div>

        {/* Saved Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h3 text-text-primary">Saved Insights</h2>
            <button className="flex items-center gap-1 text-caption text-primary">
              View all
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {savedInsights.map((insight, index) => (
              <motion.span
                key={insight}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="chip whitespace-nowrap"
              >
                {insight}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Slide Reader Modal */}
      {showReader && (
        <SlideReader
          stackTitle={mockDailyBrief.headline}
          stackType="NEWS"
          slides={mockDailyBrief.slides}
          onClose={() => setShowReader(false)}
          onComplete={handleStackComplete}
          onSaveInsight={(slideNum) => toast.success(`Insight saved from slide ${slideNum}`)}
          onAddNote={(slideNum) => toast.success(`Note added for slide ${slideNum}`)}
        />
      )}
    </AppLayout>
  );
}
