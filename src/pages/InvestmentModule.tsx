import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  BarChart3, 
  Eye,
  Shield,
  PieChart,
  Check,
  X,
  ChevronRight,
  Loader2,
  Lightbulb,
  Building2,
  Clock
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useInvestmentLab, InvestmentScenario } from "@/hooks/useInvestmentLab";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MODULE_CONFIG: Record<string, {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  gradient: string;
  scenarioType: "valuation" | "due_diligence" | "risk" | "portfolio" | "thesis";
  scoreKey: "valuation_score" | "due_diligence_score" | "risk_assessment_score" | "portfolio_construction_score";
}> = {
  valuation: {
    title: "Valuation Mastery",
    description: "Master industry-specific valuation methodologies",
    icon: BarChart3,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    gradient: "from-emerald-600 to-teal-700",
    scenarioType: "valuation",
    scoreKey: "valuation_score",
  },
  due_diligence: {
    title: "Due Diligence",
    description: "Systematic investment evaluation",
    icon: Eye,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    gradient: "from-blue-600 to-indigo-700",
    scenarioType: "due_diligence",
    scoreKey: "due_diligence_score",
  },
  risk_assessment: {
    title: "Risk Assessment",
    description: "Identify and quantify investment risks",
    icon: Shield,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    gradient: "from-amber-600 to-orange-700",
    scenarioType: "risk",
    scoreKey: "risk_assessment_score",
  },
  portfolio: {
    title: "Portfolio Construction",
    description: "Build balanced investment portfolios",
    icon: PieChart,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    gradient: "from-purple-600 to-pink-700",
    scenarioType: "portfolio",
    scoreKey: "portfolio_construction_score",
  },
};

export default function InvestmentModule() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    const fetchMarket = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market")
        .eq("id", user.id)
        .single();

      if (profile?.selected_market) {
        setSelectedMarket(profile.selected_market);
      }
      setLoading(false);
    };

    fetchMarket();
  }, [user, authLoading, navigate]);

  const {
    progress,
    scenarios,
    completedScenarioIds,
    loading: labLoading,
    recordAttempt,
    updateModuleScore,
  } = useInvestmentLab(selectedMarket || undefined);

  const moduleConfig = MODULE_CONFIG[moduleId || "valuation"];
  
  const moduleScenarios = scenarios.filter(
    s => s.scenario_type === moduleConfig?.scenarioType
  );

  // Find first uncompleted scenario
  useEffect(() => {
    if (moduleScenarios.length > 0 && completedScenarioIds.length > 0) {
      const firstIncomplete = moduleScenarios.findIndex(
        s => !completedScenarioIds.includes(s.id)
      );
      if (firstIncomplete !== -1) {
        setCurrentScenarioIndex(firstIncomplete);
      }
    }
  }, [moduleScenarios, completedScenarioIds]);

  if (loading || authLoading || labLoading || !moduleConfig) {
    return (
      <AppLayout showNav={false}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  const currentScenario = moduleScenarios[currentScenarioIndex];
  const completedInModule = moduleScenarios.filter(s => completedScenarioIds.includes(s.id)).length;
  const moduleProgress = moduleScenarios.length > 0 
    ? Math.round((completedInModule / moduleScenarios.length) * 100) 
    : 0;

  const handleOptionSelect = async (index: number) => {
    if (selectedOption !== null || !currentScenario) return;

    setSelectedOption(index);
    const isCorrect = currentScenario.options[index]?.isCorrect || index === currentScenario.correct_option_index;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    await recordAttempt(currentScenario.id, index, isCorrect, timeSpent);

    // Update module score
    const newCompletedCount = completedInModule + (isCorrect ? 1 : 0);
    const newScore = Math.round((newCompletedCount / moduleScenarios.length) * 100);
    await updateModuleScore(
      moduleConfig.scoreKey.replace('_score', '') as any,
      newScore
    );

    setShowFeedback(true);

    if (isCorrect) {
      toast.success("+25 Investment XP");
    }
  };

  const handleNext = () => {
    if (currentScenarioIndex < moduleScenarios.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowFeedback(false);
      setStartTime(Date.now());
    } else {
      // Module complete
      toast.success("Module round complete!");
      navigate("/investment-lab");
    }
  };

  if (moduleScenarios.length === 0) {
    return (
      <AppLayout showNav={false}>
        <div className="min-h-screen bg-bg-0">
          <div className="bg-bg-1 border-b border-border px-4 py-4 pt-safe">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/investment-lab")}
                className="w-10 h-10 rounded-xl bg-bg-2 border border-border flex items-center justify-center"
              >
                <ArrowLeft size={20} className="text-text-primary" />
              </button>
              <div>
                <h1 className="text-h2 text-text-primary">{moduleConfig.title}</h1>
                <p className="text-caption text-text-muted">Investment scenarios</p>
              </div>
            </div>
          </div>

          <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4", moduleConfig.bgColor)}>
              <moduleConfig.icon size={28} className={moduleConfig.color} />
            </div>
            <h2 className="text-h3 text-text-primary text-center mb-2">Coming Soon</h2>
            <p className="text-body text-text-muted text-center max-w-xs">
              Investment scenarios for this module are being developed
            </p>
            <button
              onClick={() => navigate("/investment-lab")}
              className="mt-6 px-6 py-3 rounded-xl bg-accent text-bg-0 font-medium"
            >
              Back to Lab
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNav={false}>
      <div className="min-h-screen bg-bg-0 pb-8">
        {/* Header */}
        <div className={cn("bg-gradient-to-b border-b border-border px-4 py-4 pt-safe", `${moduleConfig.gradient}/20`, "to-bg-0")}>
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate("/investment-lab")}
              className="w-10 h-10 rounded-xl bg-bg-2/50 border border-border/50 flex items-center justify-center"
            >
              <ArrowLeft size={20} className="text-text-primary" />
            </button>
            <div className="flex-1">
              <h1 className="text-h2 text-text-primary">{moduleConfig.title}</h1>
              <p className="text-caption text-text-muted">
                Scenario {currentScenarioIndex + 1} of {moduleScenarios.length}
              </p>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", moduleConfig.bgColor)}>
              <moduleConfig.icon size={20} className={moduleConfig.color} />
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <Progress value={moduleProgress} className="h-1.5 flex-1" />
            <span className="text-caption text-text-muted">{moduleProgress}%</span>
          </div>
        </div>

        {/* Scenario Content */}
        {currentScenario && (
          <div className="p-4 space-y-4">
            {/* Difficulty & Tags */}
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase",
                currentScenario.difficulty === "expert" 
                  ? "bg-red-500/20 text-red-400"
                  : currentScenario.difficulty === "advanced"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-blue-500/20 text-blue-400"
              )}>
                {currentScenario.difficulty}
              </span>
              {currentScenario.valuation_model && (
                <span className="px-2 py-0.5 rounded-full bg-bg-2 text-[10px] text-text-muted">
                  {currentScenario.valuation_model}
                </span>
              )}
            </div>

            {/* Scenario */}
            <motion.div
              key={currentScenario.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-bg-2 border border-border"
            >
              <h3 className="text-body font-medium text-text-primary mb-2">
                {currentScenario.title}
              </h3>
              <p className="text-caption text-text-secondary leading-relaxed">
                {currentScenario.scenario}
              </p>
            </motion.div>

            {/* Question */}
            <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
              <p className="text-body font-medium text-text-primary">
                {currentScenario.question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {currentScenario.options.map((option, index) => {
                const isSelected = selectedOption === index;
                const isCorrect = option.isCorrect || index === currentScenario.correct_option_index;
                const showResult = showFeedback;

                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleOptionSelect(index)}
                    disabled={selectedOption !== null}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all",
                      showResult && isCorrect
                        ? "bg-success/10 border-success/30"
                        : showResult && isSelected && !isCorrect
                        ? "bg-destructive/10 border-destructive/30"
                        : isSelected
                        ? "bg-accent/10 border-accent"
                        : "bg-bg-2 border-border hover:border-accent/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0",
                        showResult && isCorrect
                          ? "bg-success border-success text-white"
                          : showResult && isSelected && !isCorrect
                          ? "bg-destructive border-destructive text-white"
                          : isSelected
                          ? "bg-accent border-accent text-white"
                          : "border-border"
                      )}>
                        {showResult && isCorrect && <Check size={14} />}
                        {showResult && isSelected && !isCorrect && <X size={14} />}
                        {!showResult && (
                          <span className="text-[10px] text-text-muted">{String.fromCharCode(65 + index)}</span>
                        )}
                      </div>
                      <p className={cn(
                        "text-caption flex-1",
                        showResult && isCorrect ? "text-success" : "text-text-primary"
                      )}>
                        {option.text}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {showFeedback && currentScenario.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="p-4 rounded-xl bg-bg-2 border border-border">
                    <div className="flex items-start gap-2 mb-2">
                      <Lightbulb size={16} className="text-accent mt-0.5" />
                      <h4 className="text-caption font-medium text-accent">Investment Insight</h4>
                    </div>
                    <p className="text-caption text-text-secondary leading-relaxed">
                      {currentScenario.explanation}
                    </p>
                  </div>

                  {currentScenario.real_world_example && (
                    <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                      <div className="flex items-start gap-2 mb-2">
                        <Building2 size={16} className="text-purple-400 mt-0.5" />
                        <h4 className="text-caption font-medium text-purple-400">Real World Example</h4>
                      </div>
                      <p className="text-caption text-text-secondary leading-relaxed">
                        {currentScenario.real_world_example}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleNext}
                    className="w-full py-3 rounded-xl bg-accent text-bg-0 font-medium flex items-center justify-center gap-2"
                  >
                    {currentScenarioIndex < moduleScenarios.length - 1 ? "Next Scenario" : "Complete Module"}
                    <ChevronRight size={18} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
}