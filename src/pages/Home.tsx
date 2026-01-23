import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Cpu, ChevronRight, Gamepad2, Target, FileText, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { StackCard } from "@/components/ui/StackCard";
import { SlideReader } from "@/components/slides/SlideReader";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgress } from "@/hooks/useUserProgress";
import { supabase } from "@/integrations/supabase/client";

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

const marketIcons: Record<string, React.ReactNode> = {
  ai: <Cpu size={20} className="text-primary" />,
  fintech: <span className="text-primary">💳</span>,
  ev: <span className="text-primary">⚡</span>,
  biotech: <span className="text-primary">🧬</span>,
  energy: <span className="text-primary">☀️</span>,
  mobile: <span className="text-primary">📱</span>,
  agtech: <span className="text-primary">🌱</span>,
  aerospace: <span className="text-primary">🚀</span>,
  creator: <span className="text-primary">🎨</span>,
  ecommerce: <span className="text-primary">🛒</span>,
  gaming: <span className="text-primary">🎮</span>,
};

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

export default function HomePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const { progress, completeStack } = useUserProgress(selectedMarket || undefined);
  const [showReader, setShowReader] = useState(false);
  const [lessonProgress, setLessonProgress] = useState(40);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    const fetchMarket = async () => {
      if (!user) return;

      // Check profile for selected market
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market")
        .eq("id", user.id)
        .single();

      if (profile?.selected_market) {
        setSelectedMarket(profile.selected_market);
      } else {
        // Check localStorage as fallback
        const stored = localStorage.getItem("selectedMarket");
        if (stored) {
          setSelectedMarket(stored);
          // Sync to profile
          await supabase
            .from("profiles")
            .update({ selected_market: stored })
            .eq("id", user.id);
        } else {
          navigate("/select-market");
        }
      }
    };

    fetchMarket();
  }, [user, authLoading, navigate]);

  const handleStackComplete = async () => {
    setShowReader(false);
    if (progress) {
      await completeStack("mock-stack-id");
    }
    toast.success("Stack completed! Streak updated 🔥");
  };

  const streak = progress?.current_streak || 0;
  const marketName = selectedMarket ? marketNames[selectedMarket] || "AI Industry" : "AI Industry";
  const marketIcon = selectedMarket ? marketIcons[selectedMarket] : marketIcons.ai;

  return (
    <AppLayout>
      <div className="screen-padding pt-12 safe-bottom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-button bg-primary/20 flex items-center justify-center">
              {marketIcon}
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

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          {/* Games */}
          <button
            onClick={() => navigate("/games")}
            className="card-interactive flex flex-col items-start"
          >
            <div className="w-10 h-10 rounded-button bg-amber-500/20 flex items-center justify-center mb-3">
              <Gamepad2 size={20} className="text-amber-400" />
            </div>
            <h3 className="text-h3 text-text-primary mb-1">Games</h3>
            <p className="text-caption text-text-muted">Test your knowledge</p>
          </button>

          {/* Drills */}
          <button
            onClick={() => navigate("/drills")}
            className="card-interactive flex flex-col items-start"
          >
            <div className="w-10 h-10 rounded-button bg-emerald-500/20 flex items-center justify-center mb-3">
              <Target size={20} className="text-emerald-400" />
            </div>
            <h3 className="text-h3 text-text-primary mb-1">Drills</h3>
            <p className="text-caption text-text-muted">Quick fact checks</p>
          </button>

          {/* Summaries */}
          <button
            onClick={() => navigate("/summaries")}
            className="card-interactive flex flex-col items-start"
          >
            <div className="w-10 h-10 rounded-button bg-blue-500/20 flex items-center justify-center mb-3">
              <FileText size={20} className="text-blue-400" />
            </div>
            <h3 className="text-h3 text-text-primary mb-1">Summaries</h3>
            <p className="text-caption text-text-muted">Daily/Weekly recaps</p>
          </button>

          {/* Trainer */}
          <button
            onClick={() => navigate("/trainer")}
            className="card-interactive flex flex-col items-start"
          >
            <div className="w-10 h-10 rounded-button bg-purple-500/20 flex items-center justify-center mb-3">
              <Sparkles size={20} className="text-purple-400" />
            </div>
            <h3 className="text-h3 text-text-primary mb-1">Trainer</h3>
            <p className="text-caption text-text-muted">Reasoning drills</p>
          </button>
        </motion.div>

        {/* Saved Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h3 text-text-primary">Saved Insights</h2>
            <button 
              className="flex items-center gap-1 text-caption text-primary"
              onClick={() => navigate("/notebook")}
            >
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
