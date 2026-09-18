/**
 * The learner-facing view of the 180-day programme.
 *
 * Mirrors supabase/functions/_shared/syllabus.ts so the roadmap promises
 * exactly what the lesson writer delivers:
 *   - 6 seasons of 30 days, one per theme of the chosen market
 *   - each season covers 5 territories, 6 days each
 *   - those 6 days take a fixed arc of angles on the territory
 *   - every 7th day of the programme consolidates instead of adding an idea
 */

import { MARKETS } from './markets';

export const TOTAL_DAYS = 180;
export const DAYS_PER_SEASON = 30;
export const DAYS_PER_BLOCK = 6;

export type FacetKey = 'definition' | 'money' | 'power' | 'numbers' | 'rules' | 'frontier';

export interface Facet {
  key: FacetKey;
  label: string;
  /** What the learner walks away able to do. */
  promise: string;
}

export const FACET_ARC: Facet[] = [
  { key: 'definition', label: 'What it is', promise: 'Say what it is, and what people confuse it with.' },
  { key: 'money', label: 'How the money moves', promise: 'Follow who pays, who gets paid, and where the margin sits.' },
  { key: 'power', label: 'Who holds the power', promise: 'Name who can say no, and why.' },
  { key: 'numbers', label: 'The numbers that decide', promise: 'Use the metric insiders argue about.' },
  { key: 'rules', label: 'The rule that binds it', promise: 'Know the rule, and what breaks without it.' },
  { key: 'frontier', label: 'Where it breaks', promise: 'Spot the gap this leaves open.' },
];

export interface SyllabusDay {
  day: number;
  season: number;
  seasonTheme: string;
  /** 1-5 within the season: which territory this day belongs to. */
  block: number;
  facet: Facet;
  isConsolidation: boolean;
}

export const isConsolidationDay = (day: number) => day > 0 && day % 7 === 0;

export function seasonThemes(marketId: string): string[] {
  const market = MARKETS.find(m => m.id === marketId);
  const themes = market?.themes ?? [];
  if (themes.length >= 6) return themes.slice(0, 6);
  return [...themes, ...Array(6 - themes.length).fill('Advanced Topics')];
}

export function syllabusDay(marketId: string, day: number): SyllabusDay {
  const safeDay = Math.min(Math.max(Math.round(day) || 1, 1), TOTAL_DAYS);
  const themes = seasonThemes(marketId);
  const seasonIndex = Math.min(Math.ceil(safeDay / DAYS_PER_SEASON) - 1, themes.length - 1);
  const dayInSeason = ((safeDay - 1) % DAYS_PER_SEASON) + 1;

  return {
    day: safeDay,
    season: seasonIndex + 1,
    seasonTheme: themes[seasonIndex],
    block: Math.floor((dayInSeason - 1) / DAYS_PER_BLOCK) + 1,
    facet: FACET_ARC[(dayInSeason - 1) % FACET_ARC.length],
    isConsolidation: isConsolidationDay(safeDay),
  };
}

/** The short label shown next to a day in the roadmap. */
export function dayPromise(marketId: string, day: number): string {
  const plan = syllabusDay(marketId, day);
  return plan.isConsolidation ? 'Consolidation — no new idea' : plan.facet.label;
}
