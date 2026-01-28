import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Brain, Sparkles, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TrainerCard } from "@/components/trainer/TrainerCard";
import { Button } from "@/components/ui/button";
import { MentorAvatar } from "@/components/ai/MentorAvatar";
import { MentorChatOverlay } from "@/components/ai/MentorChatOverlay";
import { mentors, Mentor } from "@/data/mentors";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import strategyBrain from "@/assets/trainer/strategy-brain.jpg";
import { useAuth } from "@/hooks/useAuth";

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
  const [scenarios, setScenarios] = useState<TrainerScenario[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const fetchScenarios = async () => {
      if (!user) return;

      // Get user's selected market
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market")
        .eq("id", user.id)
        .single();

      const market = profile?.selected_market || "aerospace";
      setSelectedMarket(market);

      // Fetch trainer scenarios for this market
      const { data, error } = await supabase
        .from("trainer_scenarios")
        .select("*")
        .eq("market_id", market)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching scenarios:", error);
      } else {
        const formattedScenarios = (data || []).map((s) => ({
          ...s,
          options: Array.isArray(s.options) 
            ? (s.options as { label: string; isCorrect: boolean }[])
            : [],
        }));
        setScenarios(formattedScenarios);
      }
      setLoading(false);
    };

    fetchScenarios();
  }, [user]);

  const currentScenario = scenarios[currentIndex];

  const handleSaveToNotebook = async () => {
    if (!user || !currentScenario) return;

    await supabase.from("notes").insert({
      user_id: user.id,
      content: `Trainer insight: ${currentScenario.feedback_mental_model || currentScenario.scenario}`,
      linked_label: `Trainer · ${currentScenario.question.substring(0, 30)}...`,
    });

    toast.success("Saved to notebook!");
  };

  const handleNext = () => {
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      toast.success("All scenarios completed! 🎉");
      setCurrentIndex(0);
    }
  };

  const handleAttemptComplete = async (isCorrect: boolean, selectedOption: number) => {
    if (!user || !currentScenario) return;

    await supabase.from("trainer_attempts").insert({
      user_id: user.id,
      scenario_id: currentScenario.id,
      selected_option: selectedOption,
      is_correct: isCorrect,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Intro screen
  if (showIntro && scenarios.length > 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="screen-padding pt-4 pb-4 flex items-center gap-4 border-b border-border"
        >
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text-secondary" />
          </button>
          <h1 className="text-h2 text-text-primary">Trainer</h1>
        </motion.div>

        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md"
          >
            {/* Hero Image Card */}
            <div className="relative overflow-hidden rounded-2xl mb-6">
              <img 
                src={strategyBrain} 
                alt="Strategic Thinking" 
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-white/80 text-caption font-medium mb-1">Pro Reasoning</p>
                <h2 className="text-2xl font-bold text-white mb-2">Think Like an Expert</h2>
                <p className="text-white/90 text-body">
                  Complex scenarios with deep professional feedback.
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="card-elevated mb-6">
              <h3 className="text-h3 text-text-primary mb-3">What you'll learn</h3>
              <ul className="space-y-2">
                {[
                  "Real-world decision scenarios",
                  "Pro reasoning breakdowns",
                  "Common mistake analysis",
                  "Mental models for founders"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-body text-text-secondary">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
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
      <div className="min-h-screen bg-background flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="screen-padding pt-4 pb-4 flex items-center gap-4 border-b border-border"
        >
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text-secondary" />
          </button>
          <h1 className="text-h2 text-text-primary">Trainer</h1>
        </motion.div>
        <div className="flex-1 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="screen-padding pt-4 pb-4 flex items-center gap-4 border-b border-border"
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
        
        {/* Mentor Helper - Use Sophia for Trainer */}
        <MentorAvatar
          mentor={mentors.find(m => m.id === "sophia") || mentors[0]}
          size="sm"
          showPulse={false}
          onClick={() => setActiveMentor(mentors.find(m => m.id === "sophia") || mentors[0])}
        />
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 screen-padding py-6 overflow-auto"
      >
        <TrainerCard
          scenario={cardScenario}
          onSaveToNotebook={handleSaveToNotebook}
          onNext={handleNext}
          onAskMentor={(question) => {
            setActiveMentor(mentors.find(m => m.id === "sophia") || mentors[0]);
          }}
        />
      </motion.div>

      {/* Mentor Chat Overlay */}
      <MentorChatOverlay
        mentor={activeMentor}
        onClose={() => setActiveMentor(null)}
        context={`Trainer scenario: ${currentScenario.scenario} - Question: ${currentScenario.question}`}
        marketId={selectedMarket || undefined}
      />
    </div>
  );
}
