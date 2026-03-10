import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Brain, ChevronRight, Crown } from "lucide-react";
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

      // Fetch trainer scenarios using direct table query
      // Note: The view trainer_scenarios_public would be used in production
      // but since types aren't generated for views, we query the table directly
      // The RLS policy restricts access appropriately
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

      // Transform scenarios - we don't have correct_option_index on client side anymore
      // The isCorrect will be determined by the server when submitting
      const formattedScenarios = (scenarioData || []).map((s) => {
        // Handle both formats: objects with {label, isCorrect} or plain strings
        let options: { label: string; isCorrect: boolean }[] = [];
        
        if (Array.isArray(s.options)) {
          options = (s.options as unknown[]).map((opt, idx) => {
            if (typeof opt === 'string') {
              // Plain string format - isCorrect is unknown on client, will be verified by server
              return { label: opt, isCorrect: false };
            } else if (typeof opt === 'object' && opt !== null && 'label' in opt) {
              // Object format with label - strip isCorrect as server validates
              const optObj = opt as { label: string; isCorrect?: boolean };
              return { 
                label: optObj.label, 
                isCorrect: false // Client doesn't know correct answer
              };
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
          correct_option_index: -1 // Unknown on client side
        } as TrainerScenario;
      });
      setScenarios(formattedScenarios);

      // Fetch user's completed attempts to restore progress
      const { data: attemptData } = await supabase
        .from("trainer_attempts")
        .select("scenario_id")
        .eq("user_id", user.id);

      if (attemptData && attemptData.length > 0 && formattedScenarios.length > 0) {
        // Get set of completed scenario IDs
        const completedIds = new Set(attemptData.map(a => a.scenario_id));
        
        // Find the first uncompleted scenario
        const firstUncompletedIndex = formattedScenarios.findIndex(
          s => !completedIds.has(s.id)
        );
        
        if (firstUncompletedIndex !== -1) {
          // Resume from first uncompleted
          setCurrentIndex(firstUncompletedIndex);
        } else {
          // All completed - start from beginning (user can review)
          setCurrentIndex(0);
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
    const xpEarned = isCorrect ? 35 : 8;
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

    // Award adaptive XP based on correctness
    if (result) {
      await awardTrainerXP(result.isCorrect);
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

        <div className="flex-1 flex items-center justify-center screen-padding py-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full"
          >
            {/* Full-body Mascot Welcome */}
            <MascotBreak
              type="intro"
              marketId={selectedMarket || undefined}
              message="Time to level up! These scenarios will teach you to think like a pro 🧠"
              className="mb-6"
            />

            {/* Hero Card with Market-Specific Gradient */}
            <div className={`relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br ${marketConfig?.heroGradient || 'from-red-600 via-rose-700 to-pink-900'}`}>
              <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
              <div className="relative p-6 pt-6 pb-5 flex flex-col justify-end">
                <p className="text-white/80 text-caption font-medium mb-1">{marketConfig?.name || 'Industry'} Trainer</p>
                <h2 className="text-xl font-bold text-white mb-2">Think Like an Expert</h2>
                <p className="text-white/80 text-body leading-relaxed">
                  {marketConfig?.trainerDescription || 'Complex scenarios with deep professional feedback.'}
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="card-elevated mb-6 p-5">
              <h3 className="text-h3 text-text-primary mb-4">What you'll learn</h3>
              <ul className="space-y-3">
                {[
                  "Real-world decision scenarios",
                  "Pro reasoning breakdowns",
                  "Common mistake analysis",
                  "Mental models for founders"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-body text-text-secondary">
                    <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <Button 
              className="w-full bg-gradient-to-r from-red-500 to-rose-400 hover:opacity-90" 
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
        className="flex-1 screen-padding py-6 overflow-auto modal-bottom-safe"
      >
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
