import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';

/** A real trainer scenario for the learner's market. */
export interface TrainerScenarioRow {
  id: string;
  scenario: string;
  question: string;
  options: { label: string; isCorrect?: boolean }[];
  correct_option_index: number;
  feedback_pro_reasoning: string | null;
  feedback_common_mistake: string | null;
  feedback_mental_model: string | null;
}

/** A real, fact-checked drill statement for the learner's market. */
export interface DrillRow {
  id: string;
  statement: string;
  is_true: boolean;
  explanation: string | null;
}

export interface IndustryContent {
  trainer: TrainerScenarioRow[];
  drills: DrillRow[];
  isLoading: boolean;
}

const EMPTY: IndustryContent = { trainer: [], drills: [], isLoading: false };

function parseOptions(raw: unknown): { label: string; isCorrect?: boolean }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(o => {
      if (typeof o === 'string') return { label: o };
      if (o && typeof o === 'object' && typeof (o as any).label === 'string') {
        return { label: (o as any).label as string, isCorrect: !!(o as any).isCorrect };
      }
      return null;
    })
    .filter((o): o is { label: string; isCorrect?: boolean } => !!o && o.label.trim().length > 0);
}

/**
 * Loads the market's own scenarios and fact-checked statements so a lesson's
 * games are about that industry rather than generic comprehension.
 */
export function useIndustryContent(marketId?: string, dayNumber?: number): IndustryContent {
  const [content, setContent] = useState<IndustryContent>({ ...EMPTY, isLoading: !!marketId });

  const load = useCallback(async (market: string, day?: number) => {
    setContent(c => ({ ...c, isLoading: true }));
    try {
      const dayTag = typeof day === 'number' && day > 0 ? `day-${day}` : null;

      const trainerQuery = supabase
        .from('trainer_scenarios')
        .select('id, scenario, question, options, correct_option_index, feedback_pro_reasoning, feedback_common_mistake, feedback_mental_model')
        .eq('market_id', market)
        .limit(12);

      const [trainerRes, drillRes] = await Promise.all([
        dayTag ? trainerQuery.contains('tags', [dayTag]) : trainerQuery,
        supabase
          .from('drill_questions')
          .select('id, statement, is_true, explanation')
          .eq('market_id', market)
          .limit(40),
      ]);

      let trainerRows = trainerRes.data ?? [];
      // The day may have no tagged scenario — fall back to any scenario in the market.
      if (dayTag && trainerRows.length === 0) {
        const fallback = await supabase
          .from('trainer_scenarios')
          .select('id, scenario, question, options, correct_option_index, feedback_pro_reasoning, feedback_common_mistake, feedback_mental_model')
          .eq('market_id', market)
          .limit(12);
        trainerRows = fallback.data ?? [];
      }

      const trainer: TrainerScenarioRow[] = trainerRows
        .map(r => ({
          id: String(r.id),
          scenario: String(r.scenario ?? ''),
          question: String(r.question ?? ''),
          options: parseOptions(r.options),
          correct_option_index: Number(r.correct_option_index ?? 0),
          feedback_pro_reasoning: r.feedback_pro_reasoning ?? null,
          feedback_common_mistake: r.feedback_common_mistake ?? null,
          feedback_mental_model: r.feedback_mental_model ?? null,
        }))
        .filter(
          r =>
            r.scenario.length > 20 &&
            r.question.length > 5 &&
            r.options.length >= 2 &&
            r.correct_option_index >= 0 &&
            r.correct_option_index < r.options.length,
        );

      const drills: DrillRow[] = (drillRes.data ?? [])
        .map(r => ({
          id: String(r.id),
          statement: String(r.statement ?? ''),
          is_true: !!r.is_true,
          explanation: r.explanation ?? null,
        }))
        .filter(r => r.statement.length > 20);

      setContent({ trainer, drills, isLoading: false });
    } catch (error) {
      log.error('useIndustryContent: failed to load market content', error);
      setContent({ ...EMPTY, isLoading: false });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!marketId) {
      setContent({ ...EMPTY, isLoading: false });
      return;
    }
    load(marketId, dayNumber).catch(() => {
      if (!cancelled) setContent({ ...EMPTY, isLoading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [marketId, dayNumber, load]);

  return content;
}
