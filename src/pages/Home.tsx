import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Cpu, ChevronRight, Gamepad2, Target, FileText, Sparkles, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { StackCard } from "@/components/ui/StackCard";
import { SlideReader } from "@/components/slides/SlideReader";
import { KeyPlayers } from "@/components/home/KeyPlayers";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgress } from "@/hooks/useUserProgress";
import { supabase } from "@/integrations/supabase/client";

interface StackWithSlides {
  id: string;
  title: string;
  stack_type: string;
  tags: string[];
  duration_minutes: number;
  slides: {
    slide_number: number;
    title: string;
    body: string;
    sources: { label: string; url: string }[];
  }[];
}

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
  const [loading, setLoading] = useState(true);
  const [todayStack, setTodayStack] = useState<StackWithSlides | null>(null);
  const [lessonStack, setLessonStack] = useState<StackWithSlides | null>(null);
  const [savedInsights, setSavedInsights] = useState<string[]>([]);
  const [activeStack, setActiveStack] = useState<StackWithSlides | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
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
        const stored = localStorage.getItem("selectedMarket");
        if (stored) {
          setSelectedMarket(stored);
          await supabase
            .from("profiles")
            .update({ selected_market: stored })
            .eq("id", user.id);
        } else {
          navigate("/select-market");
          return;
        }
      }

      const market = profile?.selected_market || localStorage.getItem("selectedMarket") || "aerospace";

      // Fetch today's daily stack (DAILY_GAME type)
      const { data: dailyStacks } = await supabase
        .from("stacks")
        .select(`
          id,
          title,
          stack_type,
          tags,
          duration_minutes,
          slides (
            slide_number,
            title,
            body,
            sources
          )
        `)
        .eq("market_id", market)
        .contains("tags", ["DAILY_GAME"])
        .not("published_at", "is", null)
        .order("created_at", { ascending: true })
        .limit(1);

      if (dailyStacks && dailyStacks.length > 0) {
        const stack = dailyStacks[0];
        setTodayStack({
          ...stack,
          tags: stack.tags || [],
          slides: ((stack.slides as any[]) || [])
            .sort((a, b) => a.slide_number - b.slide_number)
            .map(s => ({
              ...s,
              sources: Array.isArray(s.sources) ? s.sources : [],
            })),
        });
      }

      // Fetch lesson stack (MICRO_LESSON type)
      const { data: lessonStacks } = await supabase
        .from("stacks")
        .select(`
          id,
          title,
          stack_type,
          tags,
          duration_minutes,
          slides (
            slide_number,
            title,
            body,
            sources
          )
        `)
        .eq("market_id", market)
        .contains("tags", ["MICRO_LESSON"])
        .not("published_at", "is", null)
        .order("created_at", { ascending: true })
        .limit(1);

      if (lessonStacks && lessonStacks.length > 0) {
        const stack = lessonStacks[0];
        setLessonStack({
          ...stack,
          tags: stack.tags || [],
          slides: ((stack.slides as any[]) || [])
            .sort((a, b) => a.slide_number - b.slide_number)
            .map(s => ({
              ...s,
              sources: Array.isArray(s.sources) ? s.sources : [],
            })),
        });
      }

      // Fetch saved insights
      const { data: insights } = await supabase
        .from("saved_insights")
        .select("title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (insights) {
        setSavedInsights(insights.map(i => i.title));
      }

      setLoading(false);
    };

    fetchData();
  }, [user, authLoading, navigate]);

  const handleStackComplete = async () => {
    setShowReader(false);
    if (progress && activeStack) {
      await completeStack(activeStack.id);
    }
    toast.success("Stack completed! Streak updated 🔥");
  };

  const handleOpenStack = (stack: StackWithSlides) => {
    setActiveStack(stack);
    setShowReader(true);
  };

  const handleSaveInsight = async (slideNum: number) => {
    if (!user || !activeStack) return;

    const slide = activeStack.slides[slideNum - 1];
    await supabase.from("saved_insights").insert({
      user_id: user.id,
      title: slide?.title || `Insight from ${activeStack.title}`,
      content: slide?.body,
      stack_id: activeStack.id,
    });

    toast.success(`Insight saved from slide ${slideNum}`);
  };

  const handleAddNote = async (slideNum: number) => {
    if (!user || !activeStack) return;

    const slide = activeStack.slides[slideNum - 1];
    await supabase.from("notes").insert({
      user_id: user.id,
      content: slide?.body || "",
      linked_label: `${activeStack.stack_type} · Day · Slide ${slideNum}`,
      stack_id: activeStack.id,
    });

    toast.success(`Note added for slide ${slideNum}`);
  };

  const streak = progress?.current_streak || 0;
  const marketName = selectedMarket ? marketNames[selectedMarket] || "AI Industry" : "AI Industry";
  const marketIcon = selectedMarket ? marketIcons[selectedMarket] : marketIcons.ai;

  if (loading || authLoading) {
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
          {todayStack ? (
            <StackCard
              title="Today's Pattern"
              subtitle={`${todayStack.duration_minutes || 5} minutes • ${todayStack.slides.length} slides`}
              headline={todayStack.title}
              onClick={() => handleOpenStack(todayStack)}
            />
          ) : (
            <StackCard
              title="Today's Pattern"
              subtitle="Loading..."
              headline="Fetching your daily content"
              onClick={() => {}}
            />
          )}
        </motion.div>

        {/* Lesson of the Week */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-4"
        >
          {lessonStack ? (
            <StackCard
              title="Micro Lesson"
              subtitle={`${lessonStack.duration_minutes || 7} minutes • ${lessonStack.slides.length} slides`}
              headline={lessonStack.title}
              ctaText="Start"
              onClick={() => handleOpenStack(lessonStack)}
            />
          ) : (
            <StackCard
              title="Micro Lesson"
              subtitle="Coming soon"
              ctaText="Locked"
              onClick={() => {}}
            />
          )}
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
            {savedInsights.length > 0 ? (
              savedInsights.map((insight, index) => (
                <motion.span
                  key={insight}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="chip whitespace-nowrap"
                >
                  {insight}
                </motion.span>
              ))
            ) : (
              <span className="text-caption text-text-muted">
                Complete stacks to save insights
              </span>
            )}
          </div>
        </motion.div>

        {/* Key Players Section */}
        {selectedMarket && <KeyPlayers marketId={selectedMarket} />}
      </div>

      {/* Slide Reader Modal */}
      {showReader && activeStack && (
        <SlideReader
          stackTitle={activeStack.title}
          stackType={activeStack.stack_type as "NEWS" | "HISTORY" | "LESSON"}
          slides={activeStack.slides.map(s => ({
            slideNumber: s.slide_number,
            title: s.title,
            body: s.body,
            sources: s.sources,
          }))}
          onClose={() => setShowReader(false)}
          onComplete={handleStackComplete}
          onSaveInsight={handleSaveInsight}
          onAddNote={handleAddNote}
        />
      )}
    </AppLayout>
  );
}
