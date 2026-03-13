import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

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
  scenario_type: 'valuation' | 'due_diligence' | 'risk' | 'portfolio' | 'thesis';
  title: string;
  scenario: string;
  question: string;
  options: { text: string; isCorrect: boolean }[];
  correct_option_index: number;
  explanation: string | null;
  real_world_example: string | null;
  valuation_model: string | null;
  difficulty: 'intermediate' | 'advanced' | 'expert';
  tags: string[];
}

export const INVESTMENT_XP_REWARDS = {
  SCENARIO_CORRECT: 25,
  SCENARIO_WRONG: 5,
  WATCHLIST_ADD: 10,
  THESIS_SUBMIT: 100,
  MODULE_COMPLETE: 250,
  CERTIFICATION: 1000,
};

export const CERTIFICATION_THRESHOLDS = {
  valuation: 80,
  due_diligence: 80,
  risk_assessment: 80,
  portfolio_construction: 80,
  total_scenarios: 20,
};

type ModuleKey = 'valuation' | 'due_diligence' | 'risk_assessment' | 'portfolio_construction';

/**
 * Shuffle options array and return new correct_option_index.
 * Prevents the "Always B" predictable answer pattern.
 */
function shuffleOptions(
  options: { text: string; isCorrect: boolean }[],
  correctIndex: number,
): { shuffledOptions: { text: string; isCorrect: boolean }[]; newCorrectIndex: number } {
  // Mark correct option explicitly
  const tagged = options.map((opt, i) => ({
    ...opt,
    isCorrect: opt.isCorrect || i === correctIndex,
  }));
  // Fisher-Yates shuffle
  const shuffled = [...tagged];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const newCorrectIndex = shuffled.findIndex((o) => o.isCorrect);
  return { shuffledOptions: shuffled, newCorrectIndex };
}

export function useInvestmentLab(marketId?: string) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<InvestmentProgress | null>(null);
  const [scenarios, setScenarios] = useState<InvestmentScenario[]>([]);
  const [completedScenarioIds, setCompletedScenarioIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Ref to always have fresh progress without stale closures
  const progressRef = useRef<InvestmentProgress | null>(null);
  const completedRef = useRef<string[]>([]);
  const initLock = useRef(false);

  const updateProgress = useCallback((updater: InvestmentProgress | ((prev: InvestmentProgress | null) => InvestmentProgress | null)) => {
    setProgress((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      progressRef.current = next;
      return next;
    });
  }, []);

  const updateCompleted = useCallback((updater: string[] | ((prev: string[]) => string[])) => {
    setCompletedScenarioIds((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      completedRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!user || !marketId) { setLoading(false); return; }
    fetchData();
  }, [user, marketId]);

  const fetchData = async () => {
    if (!user || !marketId) return;
    try {
      setIsUnlocked(true);

      const { data: investmentData } = await supabase
        .from('investment_lab_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('market_id', marketId)
        .maybeSingle();

      if (investmentData) {
        const parsed: InvestmentProgress = {
          ...investmentData,
          watchlist_companies: Array.isArray(investmentData.watchlist_companies)
            ? investmentData.watchlist_companies as { id: string; name: string; ticker?: string }[]
            : [],
        };
        updateProgress(parsed);
      }

      const { data: scenarioData } = await supabase
        .from('investment_scenarios')
        .select('*')
        .eq('market_id', marketId)
        .order('difficulty', { ascending: true });

      if (scenarioData) {
        setScenarios(scenarioData.map((s) => {
          const rawOptions = Array.isArray(s.options) ? s.options as { text: string; isCorrect: boolean }[] : [];
          const { shuffledOptions, newCorrectIndex } = shuffleOptions(rawOptions, s.correct_option_index);
          return {
            ...s,
            scenario_type: s.scenario_type as InvestmentScenario['scenario_type'],
            difficulty: s.difficulty as InvestmentScenario['difficulty'],
            options: shuffledOptions,
            correct_option_index: newCorrectIndex,
            tags: s.tags || [],
          };
        }));
      }

      const { data: attempts } = await supabase
        .from('investment_attempts')
        .select('scenario_id, is_correct')
        .eq('user_id', user.id);

      if (attempts) {
        const completed = attempts.filter((a) => a.is_correct).map((a) => a.scenario_id);
        updateCompleted(completed);
      }
    } catch (error) {
      console.error('Error fetching investment lab data:', error);
    } finally {
      setLoading(false);
    }
  };

  const ensureProgress = async (): Promise<InvestmentProgress | null> => {
    if (progressRef.current) return progressRef.current;
    if (!user || !marketId) return null;

    // Prevent parallel initialization
    if (initLock.current) {
      // Wait for init to complete
      await new Promise((r) => setTimeout(r, 500));
      return progressRef.current;
    }

    initLock.current = true;
    try {
      // Use upsert to prevent duplicate row errors
      const { data, error } = await supabase
        .from('investment_lab_progress')
        .upsert(
          { user_id: user.id, market_id: marketId },
          { onConflict: 'user_id,market_id' }
        )
        .select()
        .single();

      if (error) {
        console.error('Error initializing investment progress:', error);
        // Fallback: try to fetch existing
        const { data: existing } = await supabase
          .from('investment_lab_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('market_id', marketId)
          .single();
        if (existing) {
          const parsed: InvestmentProgress = { ...existing, watchlist_companies: Array.isArray(existing.watchlist_companies) ? existing.watchlist_companies as any : [] };
          updateProgress(parsed);
          return parsed;
        }
        return null;
      }
      const newProgress: InvestmentProgress = { ...data, watchlist_companies: [] };
      updateProgress(newProgress);
      return newProgress;
    } finally {
      initLock.current = false;
    }
  };

  const addInvestmentXP = async (amount: number) => {
    if (!user || !marketId) return;
    const currentProgress = await ensureProgress();
    if (!currentProgress) return;
    const newXP = currentProgress.investment_xp + amount;
    await supabase.from('investment_lab_progress').update({ investment_xp: newXP }).eq('user_id', user.id).eq('market_id', marketId);
    updateProgress((prev) => prev ? { ...prev, investment_xp: newXP } : prev);
  };

  const recordAttempt = async (scenarioId: string, selectedOption: number, isCorrect: boolean, timeSpent?: number) => {
    if (!user || !marketId) return;
    // Ensure progress row exists before recording
    await ensureProgress();
    await supabase.from('investment_attempts').insert({
      user_id: user.id, scenario_id: scenarioId, selected_option: selectedOption, is_correct: isCorrect, time_spent_seconds: timeSpent,
    });
    if (isCorrect) {
      updateCompleted((prev) => [...prev, scenarioId]);
    }
    await addInvestmentXP(isCorrect ? INVESTMENT_XP_REWARDS.SCENARIO_CORRECT : INVESTMENT_XP_REWARDS.SCENARIO_WRONG);
  };

  const updateModuleScore = async (module: ModuleKey, score: number) => {
    if (!user || !marketId) return;
    // Ensure progress row exists
    await ensureProgress();
    const field = `${module}_score` as keyof InvestmentProgress;
    await supabase.from('investment_lab_progress').update({ [field]: score }).eq('user_id', user.id).eq('market_id', marketId);
    updateProgress((prev) => prev ? { ...prev, [field]: score } : prev);

    // Wait a tick for state to settle, then check certification with fresh values
    setTimeout(() => checkCertificationEligibility(), 100);
  };

  const addToWatchlist = async (company: { id: string; name: string; ticker?: string; segment?: string }) => {
    if (!user || !marketId) return;
    const currentProgress = await ensureProgress();
    if (!currentProgress) return;
    const currentList = currentProgress.watchlist_companies || [];
    if (currentList.some((c) => c.id === company.id)) return;
    const enriched = {
      id: company.id,
      name: company.name,
      ticker: company.ticker,
      segment: company.segment,
      addedAt: new Date().toISOString(),
    };
    const newList = [...currentList, enriched];
    await supabase.from('investment_lab_progress').update({ watchlist_companies: newList }).eq('user_id', user.id).eq('market_id', marketId);
    updateProgress((prev) => prev ? { ...prev, watchlist_companies: newList } : prev);
    await addInvestmentXP(INVESTMENT_XP_REWARDS.WATCHLIST_ADD);
  };

  const removeFromWatchlist = async (companyId: string) => {
    if (!user || !marketId || !progressRef.current) return;
    const newList = progressRef.current.watchlist_companies.filter((c) => c.id !== companyId);
    await supabase.from('investment_lab_progress').update({ watchlist_companies: newList }).eq('user_id', user.id).eq('market_id', marketId);
    updateProgress((prev) => prev ? { ...prev, watchlist_companies: newList } : prev);
  };

  const checkCertificationEligibility = async () => {
    if (!user || !marketId) return false;
    // Read from refs for fresh values
    const current = progressRef.current;
    if (!current) return false;

    const { valuation_score, due_diligence_score, risk_assessment_score, portfolio_construction_score } = current;
    const meetsThresholds =
      valuation_score >= CERTIFICATION_THRESHOLDS.valuation &&
      due_diligence_score >= CERTIFICATION_THRESHOLDS.due_diligence &&
      risk_assessment_score >= CERTIFICATION_THRESHOLDS.risk_assessment &&
      portfolio_construction_score >= CERTIFICATION_THRESHOLDS.portfolio_construction;
    const hasEnoughScenarios = completedRef.current.length >= CERTIFICATION_THRESHOLDS.total_scenarios;

    if (meetsThresholds && hasEnoughScenarios && !current.investment_certified) {
      const certifiedAt = new Date().toISOString();
      await supabase.from('investment_lab_progress').update({
        investment_certified: true,
        certified_at: certifiedAt,
      }).eq('user_id', user.id).eq('market_id', marketId);
      await addInvestmentXP(INVESTMENT_XP_REWARDS.CERTIFICATION);
      updateProgress((prev) => prev ? { ...prev, investment_certified: true, certified_at: certifiedAt } : prev);
      return true;
    }
    return false;
  };

  const getOverallProgress = () => {
    const p = progressRef.current || progress;
    if (!p) return 0;
    return Math.round((p.valuation_score + p.due_diligence_score + p.risk_assessment_score + p.portfolio_construction_score) / 4);
  };

  const getScenariosByType = (type: InvestmentScenario['scenario_type']) => scenarios.filter((s) => s.scenario_type === type);

  /**
   * Returns the index of the first scenario not yet completed in a given list.
   * Used to resume from where the user left off.
   */
  const getResumeIndex = (scenarioList: InvestmentScenario[]): number => {
    const completed = completedRef.current;
    const idx = scenarioList.findIndex((s) => !completed.includes(s.id));
    return idx >= 0 ? idx : 0;
  };

  return {
    progress, scenarios, completedScenarioIds, loading, isUnlocked,
    ensureProgress, recordAttempt, addInvestmentXP, updateModuleScore,
    addToWatchlist, removeFromWatchlist, checkCertificationEligibility,
    getOverallProgress, getScenariosByType, getResumeIndex, refetch: fetchData,
    // Keep backward compat
    initializeProgress: ensureProgress,
  };
}
