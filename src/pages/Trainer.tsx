import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Brain, ChevronRight, Crown, BookOpen, Flame, Trophy, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TrainerCard } from "@/components/trainer/TrainerCard";
import { Button } from "@/components/ui/button";
import { MentorAvatar } from "@/components/ai/MentorAvatar";
import { MentorChatOverlay } from "@/components/ai/MentorChatOverlay";
import { LeoCelebration } from "@/components/mascot/LeoCelebration";
import { MascotBreak, InlineMascot } from "@/components/mascot";
import { ProUpsellModal } from "@/components/subscription/ProUpsellModal";
import { mentors, Mentor } from "@/data/mentors";
import { getMarketConfig, getPrimaryMentorForMarket } from "@/data/marketConfig";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { FloatingXP } from "@/components/ui/FloatingXP";
import { getXPAmount } from "@/hooks/useUserXP";

interface TrainerScenarioPublic {
  id: string;
  market_id: string;
  scenario: string;
  question: string;
  options: unknown[];
  tags: string[] | null;
  sources: unknown[] | null;
  created_at: string;
}

interface TrainerScenario {
  id: string;
  scenario: string;
  question: string;
  options: { label: string; isCorrect: boolean }[];
  feedback_pro_reasoning: string | null;
  feedback_common_mistake: string | null;
  feedback_mental_model: string | null;
  follow_up_question: string | null;
  correct_option_index: number;
}

export default function TrainerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const [scenarios, setScenarios] = useState<TrainerScenario[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [floatingXP, setFloatingXP] = useState<{ amount: number; show: boolean }>({ amount: 0, show: false });
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [currentLessonTitle, setCurrentLessonTitle] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState<number>(0);
  
  // Get market config for theming
  const marketConfig = selectedMarket ? getMarketConfig(selectedMarket) : null;
  const primaryMentorId = selectedMarket ? getPrimaryMentorForMarket(selectedMarket) : "kai";
  const primaryMentor = mentors.find(m => m.id === primaryMentorId) || mentors[2];

  useEffect(() => {
    const fetchScenariosAndProgress = async () => {
      if (!user) return;

      // Get user's selected market
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market")
        .eq("id", user.id)
        .single();

      const market = profile?.selected_market || "aerospace";
      setSelectedMarket(market);

      // Get user progress
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("current_day")
        .eq("user_id", user.id)
        .eq("market_id", market)
        .maybeSingle();
      const day = progressData?.current_day || 1;
      setCurrentDay(day);

      // Get current lesson title
      const { data: currentStack } = await supabase
        .from("stacks")
        .select("title")
        .eq("market_id", market)
        .contains("tags", [`day:${day}`])
        .eq("stack_type", "lesson")
        .not("published_at", "is", null)
        .limit(1)
        .maybeSingle();
      if (currentStack) setCurrentLessonTitle(currentStack.title);

      // Fetch trainer scenarios
      const { data: scenarioData, error: scenarioError } = await supabase
        .from("trainer_scenarios")
        .select("id, market_id, scenario, question, options, tags, sources, created_at")
        .eq("market_id", market)
        .order("created_at", { ascending: true });

      if (scenarioError) {
        console.error("Error fetching scenarios:", scenarioError);
        setLoading(false);
        return;
      }

      const formattedScenarios = (scenarioData || []).map((s) => {
        let options: { label: string; isCorrect: boolean }[] = [];
        
        if (Array.isArray(s.options)) {
          options = (s.options as unknown[]).map((opt, idx) => {
            if (typeof opt === 'string') {
              return { label: opt, isCorrect: false };
            } else if (typeof opt === 'object' && opt !== null && 'label' in opt) {
              const optObj = opt as { label: string; isCorrect?: boolean };
              return { label: optObj.label, isCorrect: false };
            }
            return { label: String(opt), isCorrect: false };
          });
        }
        
        return { 
          id: s.id,
          scenario: s.scenario,
          question: s.question,
          options,
          feedback_pro_reasoning: null,
          feedback_common_mistake: null,
          feedback_mental_model: null,
          follow_up_question: null,
          correct_option_index: -1
        } as TrainerScenario;
      });
      setScenarios(formattedScenarios);

      // Fetch user's completed attempts
      const { data: attemptData } = await supabase
        .from("trainer_attempts")
        .select("scenario_id")
        .eq("user_id", user.id);

      if (attemptData) {
        setCompletedCount(attemptData.length);
        if (attemptData.length > 0 && formattedScenarios.length > 0) {
          const completedIds = new Set(attemptData.map(a => a.scenario_id));
          const firstUncompletedIndex = formattedScenarios.findIndex(
            s => !completedIds.has(s.id)
          );
          if (firstUncompletedIndex !== -1) {
            setCurrentIndex(firstUncompletedIndex);
          } else {
            setCurrentIndex(0);
          }
        }
      }

      setLoading(false);
    };

    fetchScenariosAndProgress();
  }, [user]);

  const currentScenario = scenarios[currentIndex];

  const handleSaveToNotebook = async () => {
    if (!user || !currentScenario || !selectedMarket) return;

    await supabase.from("notes").insert({
      user_id: user.id,
      content: `Trainer insight: ${currentScenario.feedback_mental_model || currentScenario.scenario}`,
      linked_label: `Trainer · ${currentScenario.question.substring(0, 30)}...`,
      market_id: selectedMarket,
    });

    toast.success("Saved to notebook!");
  };

  const handleNext = () => {
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Always show Leo celebration
      setShowCelebration(true);
    }
  };

  // Award adaptive XP after a trainer answer is submitted
  const awardTrainerXP = async (isCorrect: boolean) => {
    if (!user || !selectedMarket) return;
    const baseXP = isCorrect ? 35 : 8;
    const xpEarned = getXPAmount(baseXP, isProUser);
    await supabase.from("xp_transactions").insert({
      user_id: user.id,
      market_id: selectedMarket,
      xp_amount: xpEarned,
      source_type: "trainer",
      description: `Trainer scenario ${isCorrect ? "correct" : "attempted"} → ${xpEarned} XP`,
    });
  };

  const handleAttemptComplete = async (_isCorrect: boolean, selectedOption: number) => {
    if (!user || !currentScenario) return undefined;

    // Use secure RPC function to submit answer (prevents cheating)
    const { data, error } = await supabase.rpc("submit_trainer_answer", {
      p_scenario_id: currentScenario.id,
      p_selected_option: selectedOption,
      p_time_spent: null,
    });

    if (error) {
      console.error("Error submitting answer:", error);
      return undefined;
    }

    // Cast the JSON response to the expected format
    const result = data as {
      isCorrect: boolean;
      correctIndex: number;
      feedback_pro_reasoning: string | null;
      feedback_common_mistake: string | null;
      feedback_mental_model: string | null;
      follow_up_question: string | null;
    } | null;

    // Award adaptive XP based on correctness and show FloatingXP
    if (result) {
      await awardTrainerXP(result.isCorrect);
      const xpGain = getXPAmount(result.isCorrect ? 35 : 8, isProUser);
      setFloatingXP({ amount: xpGain, show: false });
      setTimeout(() => setFloatingXP({ amount: xpGain, show: true }), 50);
    }

    return result || undefined;
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Intro screen
  if (showIntro && scenarios.length > 0) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="screen-padding pt-safe pb-4 flex items-center gap-4 border-b border-border"
        >
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text-secondary" />
          </button>
          <h1 className="text-h2 text-text-primary">Trainer</h1>
        </motion.div>

        <div className="flex-1 screen-padding py-6 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            {/* Hero Card */}
            <div className={`relative overflow-hidden rounded-3xl mb-5 bg-gradient-to-br ${marketConfig?.heroGradient || 'from-red-600 via-rose-700 to-pink-900'}`}>
              <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 50% 80%, white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
              <div className="relative p-6 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Brain size={16} className="text-white" />
                  </div>
                  <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">{marketConfig?.name || 'Industry'} Trainer</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1.5">Think Like an Expert</h2>
                <p className="text-white/75 text-sm leading-relaxed">
                  {marketConfig?.trainerDescription || 'Complex scenarios with deep professional feedback.'}
                </p>
              </div>
            </div>

            {/* Current Lesson Context */}
            {currentLessonTitle && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary/5 border border-primary/15 mb-5"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">Today's Lesson · Day {currentDay}</p>
                  <p className="text-sm text-text-primary font-medium truncate">{currentLessonTitle}</p>
                </div>
              </motion.div>
            )}

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-3 mb-5"
            >
              <div className="rounded-2xl bg-bg-2 border border-border p-3 text-center">
                <p className="text-lg font-bold text-text-primary">{scenarios.length}</p>
                <p className="text-[11px] text-text-muted">Scenarios</p>
              </div>
              <div className="rounded-2xl bg-bg-2 border border-border p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Trophy size={14} className="text-accent" />
                  <p className="text-lg font-bold text-text-primary">{completedCount}</p>
                </div>
                <p className="text-[11px] text-text-muted">Completed</p>
              </div>
              <div className="rounded-2xl bg-bg-2 border border-border p-3 text-center">
                <p className="text-lg font-bold text-text-primary">{Math.round((completedCount / Math.max(scenarios.length, 1)) * 100)}%</p>
                <p className="text-[11px] text-text-muted">Progress</p>
              </div>
            </motion.div>

            {/* Mascot */}
            <MascotBreak
              type="intro"
              marketId={selectedMarket || undefined}
              message="Time to level up! These scenarios will teach you to think like a pro 🧠"
              className="mb-5"
            />

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-elevated mb-6 p-5"
            >
              <h3 className="text-h3 text-text-primary mb-3">What you'll learn</h3>
              <ul className="space-y-2.5">
                {[
                  { icon: <Brain size={14} />, text: "Real-world decision scenarios" },
                  { icon: <Lightbulb size={14} />, text: "Pro reasoning breakdowns" },
                  { icon: <Trophy size={14} />, text: "Common mistake analysis" },
                  { icon: <Flame size={14} />, text: "Mental models for professionals" },
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                      {feature.icon}
                    </div>
                    {feature.text}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* CTA */}
            <Button 
              className="w-full h-14 text-base font-semibold rounded-2xl" 
              size="lg"
              onClick={() => setShowIntro(false)}
            >
              Start Training
              <ChevronRight size={18} className="ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="screen-padding pt-safe pb-4 flex items-center gap-4 border-b border-border"
        >
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text-secondary" />
          </button>
          <h1 className="text-h2 text-text-primary">Trainer</h1>
        </motion.div>
        <div className="flex-1 flex items-center justify-center screen-padding py-6">
          <div className="text-center">
            <Brain size={48} className="mx-auto mb-4 text-text-muted" />
            <h2 className="text-h2 text-text-primary mb-2">No scenarios available</h2>
            <p className="text-body text-text-secondary">Complete more lessons to unlock trainer scenarios!</p>
            <Button className="mt-4" onClick={() => navigate("/home")}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Transform to TrainerCard expected format
  const cardScenario = {
    scenario: currentScenario.scenario,
    question: currentScenario.question,
    options: currentScenario.options,
    feedbackProReasoning: currentScenario.feedback_pro_reasoning || "",
    feedbackCommonMistake: currentScenario.feedback_common_mistake || "",
    feedbackMentalModel: currentScenario.feedback_mental_model || "",
    followUpQuestion: currentScenario.follow_up_question || "",
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="screen-padding pt-safe pb-4 flex items-center gap-4 border-b border-border"
      >
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-text-secondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-h2 text-text-primary">Trainer</h1>
          <p className="text-caption text-text-muted">
            Scenario {currentIndex + 1} of {scenarios.length}
          </p>
        </div>
        
        {/* Mentor Helper - Pro badge for non-pro users */}
        <div className="relative">
          <MentorAvatar
            mentor={mentors.find(m => m.id === "sophia") || mentors[0]}
            size="sm"
            showPulse={false}
            onClick={() => {
              if (isProUser) {
                setActiveMentor(mentors.find(m => m.id === "sophia") || mentors[0]);
              } else {
                setShowProModal(true);
              }
            }}
          />
          {!isProUser && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-accent to-purple-600 flex items-center justify-center">
              <Crown size={8} className="text-white" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Content - scrollable with safe bottom area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 screen-padding py-6 overflow-auto modal-bottom-safe relative"
      >
        <FloatingXP amount={floatingXP.amount} show={floatingXP.show} isPro={isProUser} />
        <TrainerCard
          scenario={cardScenario}
          onSaveToNotebook={handleSaveToNotebook}
          onNext={handleNext}
          onAskMentor={(question) => {
            if (isProUser) {
              setActiveMentor(mentors.find(m => m.id === "sophia") || mentors[0]);
            } else {
              setShowProModal(true);
            }
          }}
          onAttemptComplete={handleAttemptComplete}
          marketId={selectedMarket || undefined}
        />
      </motion.div>

      {/* Mentor Chat Overlay - Only available for Pro users */}
      {isProUser && (
        <MentorChatOverlay
          mentor={activeMentor}
          onClose={() => setActiveMentor(null)}
          context={`Trainer scenario: ${currentScenario.scenario} - Question: ${currentScenario.question}`}
          marketId={selectedMarket || undefined}
        />
      )}

      {/* Pro Upsell Modal */}
      <ProUpsellModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        trigger="feature_gate"
        featureName="AI Mentor"
      />

      {/* Leo Celebration on completion */}
      <LeoCelebration
        isVisible={showCelebration}
        type="lesson"
        onComplete={() => {
          setShowCelebration(false);
          setCurrentIndex(0);
          toast.success("All scenarios completed! 🎉");
        }}
      />
    </div>
  );
}
