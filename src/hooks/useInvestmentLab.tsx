import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface InvestmentProgress {
  id: string;
  user_id: string;
  market_id: string;
  valuation_score: number;
  due_diligence_score: number;
  risk_assessment_score: number;
  portfolio_construction_score: number;
  paper_trades_completed: number;
  simulation_accuracy: number;
  watchlist_companies: { id: string; name: string; ticker?: string }[];
  thesis_submissions: number;
  investment_certified: boolean;
  certified_at: string | null;
  investment_xp: number;
}

export interface InvestmentScenario {
  id: string;
  market_id: string;
  scenario_type: "valuation" | "due_diligence" | "risk" | "portfolio" | "thesis";
  title: string;
  scenario: string;
  question: string;
  options: { text: string; isCorrect: boolean }[];
  correct_option_index: number;
  explanation: string | null;
  real_world_example: string | null;
  valuation_model: string | null;
  difficulty: "intermediate" | "advanced" | "expert";
  tags: string[];
}

// Investment XP rewards
export const INVESTMENT_XP_REWARDS = {
  SCENARIO_CORRECT: 25,
  SCENARIO_WRONG: 5,
  WATCHLIST_ADD: 10,
  THESIS_SUBMIT: 100,
  MODULE_COMPLETE: 250,
  CERTIFICATION: 1000,
};

// Certification thresholds
export const CERTIFICATION_THRESHOLDS = {
  valuation: 80, // 80% score needed
  due_diligence: 80,
  risk_assessment: 80,
  portfolio_construction: 80,
  total_scenarios: 20, // At least 20 scenarios completed
};

export function useInvestmentLab(marketId?: string) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<InvestmentProgress | null>(null);
  const [scenarios, setScenarios] = useState<InvestmentScenario[]>([]);
  const [completedScenarioIds, setCompletedScenarioIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (!user || !marketId) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [user, marketId]);

  const fetchData = async () => {
    if (!user || !marketId) return;

    try {
      // Check if user has completed enough of the course to unlock Investment Lab
      const { data: userProgress } = await supabase
        .from("user_progress")
        .select("current_day")
        .eq("user_id", user.id)
        .eq("market_id", marketId)
        .maybeSingle();

      // Unlock Investment Lab after Day 30 of curriculum
      const unlocked = (userProgress?.current_day || 0) >= 30;
      setIsUnlocked(unlocked);

      if (!unlocked) {
        setLoading(false);
        return;
      }

      // Fetch investment progress
      const { data: investmentData } = await supabase
        .from("investment_lab_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("market_id", marketId)
        .maybeSingle();

      if (investmentData) {
        setProgress({
          ...investmentData,
          watchlist_companies: Array.isArray(investmentData.watchlist_companies) 
            ? investmentData.watchlist_companies as { id: string; name: string; ticker?: string }[]
            : [],
        });
      }

      // Fetch investment scenarios for this market
      const { data: scenarioData } = await supabase
        .from("investment_scenarios")
        .select("*")
        .eq("market_id", marketId)
        .order("difficulty", { ascending: true });

      if (scenarioData) {
        setScenarios(scenarioData.map(s => ({
          ...s,
          scenario_type: s.scenario_type as InvestmentScenario["scenario_type"],
          difficulty: s.difficulty as InvestmentScenario["difficulty"],
          options: Array.isArray(s.options) ? s.options as { text: string; isCorrect: boolean }[] : [],
          tags: s.tags || [],
        })));
      }

      // Fetch completed scenario IDs
      const { data: attempts } = await supabase
        .from("investment_attempts")
        .select("scenario_id, is_correct")
        .eq("user_id", user.id);

      if (attempts) {
        const correctIds = attempts
          .filter(a => a.is_correct)
          .map(a => a.scenario_id);
        setCompletedScenarioIds(correctIds);
      }
    } catch (error) {
      console.error("Error fetching investment lab data:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeProgress = async () => {
    if (!user || !marketId) return null;

    const { data, error } = await supabase
      .from("investment_lab_progress")
      .insert({
        user_id: user.id,
        market_id: marketId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error initializing investment progress:", error);
      return null;
    }

    const newProgress: InvestmentProgress = {
      ...data,
      watchlist_companies: [],
    };
    setProgress(newProgress);
    return newProgress;
  };

  const recordAttempt = async (
    scenarioId: string,
    selectedOption: number,
    isCorrect: boolean,
    timeSpent?: number
  ) => {
    if (!user || !marketId) return;

    // Record the attempt
    await supabase.from("investment_attempts").insert({
      user_id: user.id,
      scenario_id: scenarioId,
      selected_option: selectedOption,
      is_correct: isCorrect,
      time_spent_seconds: timeSpent,
    });

    if (isCorrect) {
      setCompletedScenarioIds(prev => [...prev, scenarioId]);
    }

    // Add XP
    const xpEarned = isCorrect 
      ? INVESTMENT_XP_REWARDS.SCENARIO_CORRECT 
      : INVESTMENT_XP_REWARDS.SCENARIO_WRONG;

    await addInvestmentXP(xpEarned);
  };

  const addInvestmentXP = async (amount: number) => {
    if (!user || !marketId || !progress) {
      // Initialize if needed
      const newProgress = await initializeProgress();
      if (!newProgress) return;
    }

    const currentProgress = progress || await initializeProgress();
    if (!currentProgress) return;

    const newXP = currentProgress.investment_xp + amount;

    await supabase
      .from("investment_lab_progress")
      .update({ investment_xp: newXP })
      .eq("user_id", user.id)
      .eq("market_id", marketId);

    setProgress(prev => prev ? { ...prev, investment_xp: newXP } : prev);
  };

  const updateModuleScore = async (
    module: "valuation" | "due_diligence" | "risk_assessment" | "portfolio_construction",
    score: number
  ) => {
    if (!user || !marketId) return;

    const field = `${module}_score`;
    
    await supabase
      .from("investment_lab_progress")
      .update({ [field]: score })
      .eq("user_id", user.id)
      .eq("market_id", marketId);

    setProgress(prev => prev ? { ...prev, [field]: score } : prev);

    // Check for certification eligibility
    await checkCertificationEligibility();
  };

  const addToWatchlist = async (company: { id: string; name: string; ticker?: string }) => {
    if (!user || !marketId) return;

    let currentProgress = progress;
    if (!currentProgress) {
      currentProgress = await initializeProgress();
      if (!currentProgress) return;
    }

    const currentList = currentProgress.watchlist_companies || [];
    if (currentList.some(c => c.id === company.id)) return; // Already in list

    const newList = [...currentList, company];

    await supabase
      .from("investment_lab_progress")
      .update({ watchlist_companies: newList })
      .eq("user_id", user.id)
      .eq("market_id", marketId);

    setProgress(prev => prev ? { ...prev, watchlist_companies: newList } : prev);
    await addInvestmentXP(INVESTMENT_XP_REWARDS.WATCHLIST_ADD);
  };

  const removeFromWatchlist = async (companyId: string) => {
    if (!user || !marketId || !progress) return;

    const newList = progress.watchlist_companies.filter(c => c.id !== companyId);

    await supabase
      .from("investment_lab_progress")
      .update({ watchlist_companies: newList })
      .eq("user_id", user.id)
      .eq("market_id", marketId);

    setProgress(prev => prev ? { ...prev, watchlist_companies: newList } : prev);
  };

  const checkCertificationEligibility = async () => {
    if (!user || !marketId || !progress) return false;

    const { valuation_score, due_diligence_score, risk_assessment_score, portfolio_construction_score } = progress;
    
    const meetsThresholds = 
      valuation_score >= CERTIFICATION_THRESHOLDS.valuation &&
      due_diligence_score >= CERTIFICATION_THRESHOLDS.due_diligence &&
      risk_assessment_score >= CERTIFICATION_THRESHOLDS.risk_assessment &&
      portfolio_construction_score >= CERTIFICATION_THRESHOLDS.portfolio_construction;

    const hasEnoughScenarios = completedScenarioIds.length >= CERTIFICATION_THRESHOLDS.total_scenarios;

    if (meetsThresholds && hasEnoughScenarios && !progress.investment_certified) {
      await supabase
        .from("investment_lab_progress")
        .update({ 
          investment_certified: true,
          certified_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("market_id", marketId);

      await addInvestmentXP(INVESTMENT_XP_REWARDS.CERTIFICATION);
      
      setProgress(prev => prev ? { 
        ...prev, 
        investment_certified: true,
        certified_at: new Date().toISOString(),
      } : prev);

      return true;
    }

    return false;
  };

  const getOverallProgress = () => {
    if (!progress) return 0;

    const scores = [
      progress.valuation_score,
      progress.due_diligence_score,
      progress.risk_assessment_score,
      progress.portfolio_construction_score,
    ];

    return Math.round(scores.reduce((a, b) => a + b, 0) / 4);
  };

  const getScenariosByType = (type: InvestmentScenario["scenario_type"]) => {
    return scenarios.filter(s => s.scenario_type === type);
  };

  return {
    progress,
    scenarios,
    completedScenarioIds,
    loading,
    isUnlocked,
    initializeProgress,
    recordAttempt,
    addInvestmentXP,
    updateModuleScore,
    addToWatchlist,
    removeFromWatchlist,
    checkCertificationEligibility,
    getOverallProgress,
    getScenariosByType,
    refetch: fetchData,
  };
}