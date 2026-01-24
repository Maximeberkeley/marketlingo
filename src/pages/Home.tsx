import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Cpu, ChevronRight, Gamepad2, Target, FileText, Sparkles, Loader2, TrendingUp, Calendar, Settings } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { StackCard } from "@/components/ui/StackCard";
import { SlideReader } from "@/components/slides/SlideReader";
import { KeyPlayers } from "@/components/home/KeyPlayers";
import { DailyNews } from "@/components/home/DailyNews";
import { NotificationOnboarding } from "@/components/onboarding/NotificationOnboarding";
import { MentorAvatar } from "@/components/ai/MentorAvatar";
import { MentorChatOverlay } from "@/components/ai/MentorChatOverlay";
import { mentors, Mentor } from "@/data/mentors";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  ai: <Cpu size={20} className="text-accent" />,
  fintech: <span className="text-xl">💳</span>,
  ev: <span className="text-xl">⚡</span>,
  biotech: <span className="text-xl">🧬</span>,
  energy: <span className="text-xl">☀️</span>,
  mobile: <span className="text-xl">📱</span>,
  agtech: <span className="text-xl">🌱</span>,
  aerospace: <span className="text-xl">🚀</span>,
  creator: <span className="text-xl">🎨</span>,
  ecommerce: <span className="text-xl">🛒</span>,
  gaming: <span className="text-xl">🎮</span>,
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
  const [showNotificationOnboarding, setShowNotificationOnboarding] = useState(false);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  
  const { isSupported, isRegistered } = useNotifications();

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
      
      // Check if we should show notification onboarding (only on native, not registered, not dismissed)
      const notifOnboardingDismissed = localStorage.getItem('notification_onboarding_dismissed');
      if (isSupported && !isRegistered && !notifOnboardingDismissed) {
        // Show after a brief delay so the user can see the home screen first
        setTimeout(() => setShowNotificationOnboarding(true), 1500);
      }
    };

    fetchData();
  }, [user, authLoading, navigate, isSupported, isRegistered]);

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

    // Find slide by slide_number, not array index
    const slide = activeStack.slides.find(s => s.slide_number === slideNum) || activeStack.slides[slideNum - 1];
    const noteContent = slide?.body || `Note from ${activeStack.title}`;
    
    const { error } = await supabase.from("notes").insert({
      user_id: user.id,
      content: noteContent,
      linked_label: `${activeStack.stack_type} · Slide ${slideNum}`,
      stack_id: activeStack.id,
    });

    if (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
      return;
    }

    toast.success(`Note added for slide ${slideNum}`);
  };

  const streak = progress?.current_streak || 0;
  const currentDay = progress?.current_day || 1;
  const marketName = selectedMarket ? marketNames[selectedMarket] || "AI Industry" : "AI Industry";
  const marketIcon = selectedMarket ? marketIcons[selectedMarket] : marketIcons.ai;

  if (loading || authLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="screen-padding pt-12 pb-28">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center">
                {marketIcon}
              </div>
              <div>
                <h1 className="text-h2 text-text-primary">{marketName}</h1>
                <p className="text-caption text-text-muted">Day {currentDay} of your journey</p>
              </div>
            </div>
            <StreakBadge count={streak} />
          </div>

          {/* Quick Stats Row */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-2/50 border border-border">
              <Calendar size={14} className="text-text-muted" />
              <span className="text-caption text-text-secondary whitespace-nowrap">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-2/50 border border-border">
              <TrendingUp size={14} className="text-accent" />
              <span className="text-caption text-text-secondary whitespace-nowrap">
                {progress?.completed_stacks?.length || 0} stacks completed
              </span>
            </div>
            <button 
              onClick={() => navigate("/select-market")}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-2/50 border border-border hover:border-accent/50 transition-colors"
            >
              <Settings size={14} className="text-text-muted" />
              <span className="text-caption text-text-secondary whitespace-nowrap">Switch Market</span>
            </button>
          </div>
        </motion.div>

        {/* Today's Learning Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Today's Learning
            </h2>
            <MentorAvatar
              mentor={mentors.find(m => m.id === "alex")!}
              onClick={() => setActiveMentor(mentors.find(m => m.id === "alex")!)}
              size="sm"
              showPulse
            />
          </div>
          <div className="space-y-3">
            {todayStack ? (
              <StackCard
                title="Daily Pattern"
                subtitle={`${todayStack.duration_minutes || 5} min • ${todayStack.slides.length} slides`}
                headline={todayStack.title}
                onClick={() => handleOpenStack(todayStack)}
              />
            ) : (
              <StackCard
                title="Daily Pattern"
                subtitle="Loading..."
                headline="Fetching your daily content"
                onClick={() => {}}
              />
            )}

            {lessonStack ? (
              <StackCard
                title="Micro Lesson"
                subtitle={`${lessonStack.duration_minutes || 7} min • ${lessonStack.slides.length} slides`}
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
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-3">
            Practice & Review
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Games */}
            <button
              onClick={() => navigate("/games")}
              className={cn(
                "group relative overflow-hidden",
                "p-4 rounded-card bg-bg-2 border border-border",
                "hover:border-amber-500/50 transition-all duration-200",
                "flex flex-col items-start text-left"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                <Gamepad2 size={18} className="text-amber-400" />
              </div>
              <h3 className="text-body font-medium text-text-primary mb-0.5">Games</h3>
              <p className="text-caption text-text-muted">Test your knowledge</p>
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Drills */}
            <button
              onClick={() => navigate("/drills")}
              className={cn(
                "group relative overflow-hidden",
                "p-4 rounded-card bg-bg-2 border border-border",
                "hover:border-emerald-500/50 transition-all duration-200",
                "flex flex-col items-start text-left"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                <Target size={18} className="text-emerald-400" />
              </div>
              <h3 className="text-body font-medium text-text-primary mb-0.5">Drills</h3>
              <p className="text-caption text-text-muted">Quick fact checks</p>
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Summaries */}
            <button
              onClick={() => navigate("/summaries")}
              className={cn(
                "group relative overflow-hidden",
                "p-4 rounded-card bg-bg-2 border border-border",
                "hover:border-blue-500/50 transition-all duration-200",
                "flex flex-col items-start text-left"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
                <FileText size={18} className="text-blue-400" />
              </div>
              <h3 className="text-body font-medium text-text-primary mb-0.5">Summaries</h3>
              <p className="text-caption text-text-muted">Daily/Weekly recaps</p>
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Trainer */}
            <button
              onClick={() => navigate("/trainer")}
              className={cn(
                "group relative overflow-hidden",
                "p-4 rounded-card bg-bg-2 border border-border",
                "hover:border-accent/50 transition-all duration-200",
                "flex flex-col items-start text-left"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
                <Sparkles size={18} className="text-accent" />
              </div>
              <h3 className="text-body font-medium text-text-primary mb-0.5">Trainer</h3>
              <p className="text-caption text-text-muted">Reasoning drills</p>
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-accent to-accent/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </motion.div>

        {/* Saved Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-2"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Saved Insights
            </h2>
            <button 
              className="flex items-center gap-1 text-caption text-accent hover:text-accent/80 transition-colors"
              onClick={() => navigate("/notebook")}
            >
              View all
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {savedInsights.length > 0 ? (
              savedInsights.map((insight, index) => (
                <motion.span
                  key={insight}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
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

        {/* Daily News Section */}
        {selectedMarket && <DailyNews marketId={selectedMarket} />}
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

      {/* Notification Onboarding */}
      <NotificationOnboarding
        open={showNotificationOnboarding}
        onComplete={(enabled) => {
          setShowNotificationOnboarding(false);
          localStorage.setItem('notification_onboarding_dismissed', 'true');
          if (enabled) {
            toast.success("Notifications enabled! 🔔");
          }
        }}
      />

      {/* Mentor Chat Overlay */}
      <MentorChatOverlay
        mentor={activeMentor}
        onClose={() => setActiveMentor(null)}
        context={activeStack?.title || selectedMarket || "aerospace"}
      />
    </AppLayout>
  );
}
