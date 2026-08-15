/**
 * decisionEngine.ts — shared predict → decide → consequence → explanation loop.
 *
 * Grading and mastery are deterministic and server-side: the client only sends
 * the choice + confidence and renders what `submit_decision_answer` returns.
 * Leo never writes mastery.
 */
import { supabase } from './supabase';
import { trackEvent } from './analytics';

export type Confidence = 'guessing' | 'fairly_sure' | 'certain';

export const CONFIDENCE_OPTIONS: { value: Confidence; label: string }[] = [
  { value: 'guessing', label: 'Guessing' },
  { value: 'fairly_sure', label: 'Fairly sure' },
  { value: 'certain', label: 'Certain' },
];

export interface DecisionScenario {
  id: string;
  market_id: string;
  stack_id: string | null;
  day_number: number | null;
  concept_key: string;
  concept_label: string | null;
  surface: string;
  prompt: string;
  situation: string | null;
  options: string[];
  difficulty: string;
  era_tag: string | null;
}

export interface DecisionResult {
  isCorrect: boolean;
  correctIndex: number;
  consequence: string;
  mechanism: string;
  confidence: Confidence;
  misconception: string | null;
  conceptKey: string;
  masteryState: string;
  evidenceScore: number;
}

export async function fetchScenarios(params: {
  marketId: string;
  stackId?: string | null;
  dayNumber?: number | null;
  surface?: string;
  limit?: number;
}): Promise<DecisionScenario[]> {
  let query = supabase
    .from('decision_scenarios')
    .select(
      'id, market_id, stack_id, day_number, concept_key, concept_label, surface, prompt, situation, options, difficulty, era_tag',
    )
    .eq('market_id', params.marketId)
    .eq('is_active', true)
    .limit(params.limit ?? 3);

  if (params.stackId) query = query.eq('stack_id', params.stackId);
  if (params.dayNumber) query = query.eq('day_number', params.dayNumber);
  if (params.surface) query = query.eq('surface', params.surface);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row: any) => ({
    ...row,
    options: Array.isArray(row.options) ? row.options : [],
  })) as DecisionScenario[];
}

export async function submitDecision(args: {
  scenarioId: string;
  selectedOption: number;
  confidence: Confidence;
  timeSpentSeconds?: number;
}): Promise<DecisionResult | null> {
  const { data, error } = await supabase.rpc('submit_decision_answer', {
    p_scenario_id: args.scenarioId,
    p_selected_option: args.selectedOption,
    p_confidence: args.confidence,
    p_time_spent: args.timeSpentSeconds ?? null,
  });

  if (error || !data || (data as any).error) {
    console.warn('[DecisionEngine] submit failed', error || (data as any)?.error);
    return null;
  }

  const result = data as unknown as DecisionResult;

  trackEvent('decision_submitted', {
    scenario_id: args.scenarioId,
    confidence: args.confidence,
    correct: result.isCorrect,
    concept: result.conceptKey,
    confidently_wrong: !result.isCorrect && args.confidence === 'certain',
  });

  return result;
}

export interface MasteryRow {
  concept_key: string;
  concept_label: string | null;
  state: string;
  evidence_score: number;
  attempts: number;
  correct_attempts: number;
  confident_wrong_count: number;
  last_misconception: string | null;
  last_seen_at: string | null;
}

/** Read-only mastery view. Not surfaced as a progress replacement in 1.0. */
export async function fetchMastery(marketId: string): Promise<MasteryRow[]> {
  const { data, error } = await supabase
    .from('concept_mastery')
    .select(
      'concept_key, concept_label, state, evidence_score, attempts, correct_attempts, confident_wrong_count, last_misconception, last_seen_at',
    )
    .eq('market_id', marketId)
    .order('evidence_score', { ascending: false });

  if (error || !data) return [];
  return data as MasteryRow[];
}

/**
 * SM-2 grade derived from correctness + confidence.
 * Wrong + certain grades 0 so the misconception jumps the review queue.
 */
export function gradeFromAnswer(isCorrect: boolean, confidence: Confidence): number {
  if (!isCorrect) return confidence === 'certain' ? 0 : 1;
  if (confidence === 'certain') return 5;
  if (confidence === 'fairly_sure') return 4;
  return 3;
}
