// The 180-day syllabus: one named concept per day, derived deterministically
// from each market's own six themes.
//
// A month covers five topics. Each topic gets six days, and each of those days
// takes a different angle on it, in a fixed arc:
//   what it is → how the money moves → who holds the power → the numbers that
//   decide → the rule or risk that binds it → where it breaks
// Every seventh day of the whole programme is a consolidation day: no new
// concept, the week's most important idea retrieved and connected.
//
// Same day number + same market always resolves to the same concept, so the
// generator, the app and the learner's roadmap never disagree.

import { CURRICULUM_STRUCTURES, type CurriculumStructure } from './curriculum-structures.ts';

export interface SyllabusDay {
  day: number;
  month: number;
  theme: string;
  topic: string;
  /** The angle taken on the topic today. */
  facetKey: FacetKey;
  facetLabel: string;
  /** Written into the lesson prompt: what today must actually deliver. */
  angle: string;
  isConsolidation: boolean;
}

export type FacetKey = 'definition' | 'money' | 'power' | 'numbers' | 'rules' | 'frontier';

interface Facet {
  key: FacetKey;
  label: string;
  angle: string;
}

export const FACET_ARC: Facet[] = [
  {
    key: 'definition',
    label: 'What it is',
    angle: 'Define the thing precisely and separate it from what people confuse it with. The learner should be able to say what it is and what it is not.',
  },
  {
    key: 'money',
    label: 'How the money moves',
    angle: 'Follow the money through this topic: who pays, who gets paid, on what terms, and where the margin sits.',
  },
  {
    key: 'power',
    label: 'Who holds the power',
    angle: 'Name the actors and show where leverage actually sits — who can say no, who depends on whom, and why that ordering holds.',
  },
  {
    key: 'numbers',
    label: 'The numbers that decide',
    angle: 'Teach the one metric or threshold insiders argue about here: how it is computed, what counts as good, and the decision it drives.',
  },
  {
    key: 'rules',
    label: 'The rule or risk that binds it',
    angle: 'Teach the rule, approval, contract clause or risk that constrains this topic, and what happens to a company that gets it wrong.',
  },
  {
    key: 'frontier',
    label: 'Where it breaks',
    angle: 'Show where this topic is currently failing or being rewritten, and the gap that leaves open for a newcomer.',
  },
];

const FACET_BY_KEY = new Map(FACET_ARC.map(f => [f.key, f]));

export const TOTAL_DAYS = 180;

/** Consolidation lands on every seventh day of the programme. */
export const isConsolidationDay = (day: number) => day > 0 && day % 7 === 0;

/**
 * Resolves one day of the programme for a market.
 * Falls back to the aerospace shape only if a market has no structure yet.
 */
export function syllabusDay(marketId: string, day: number): SyllabusDay {
  const curriculum: CurriculumStructure =
    CURRICULUM_STRUCTURES[marketId] ?? CURRICULUM_STRUCTURES.aerospace;

  const safeDay = Math.min(Math.max(Math.round(day) || 1, 1), TOTAL_DAYS);
  const monthIndex = Math.min(Math.ceil(safeDay / 30) - 1, curriculum.months.length - 1);
  const monthInfo = curriculum.months[monthIndex];
  const topics = monthInfo?.topics?.length ? monthInfo.topics : ['Industry fundamentals'];

  const dayInMonth = ((safeDay - 1) % 30) + 1;
  const topicIndex = Math.floor((dayInMonth - 1) / 6) % topics.length;
  const facet = FACET_ARC[(dayInMonth - 1) % FACET_ARC.length];
  const consolidation = isConsolidationDay(safeDay);

  return {
    day: safeDay,
    month: monthIndex + 1,
    theme: monthInfo?.theme ?? 'Industry Foundations',
    topic: topics[topicIndex],
    facetKey: facet.key,
    facetLabel: facet.label,
    angle: consolidation
      ? `This is a CONSOLIDATION day. Introduce NO new concept. Take the single most important idea from this week of "${monthInfo?.theme}" and make the learner retrieve it: restate it precisely, show it working in a second real case, and have them connect it to the week before.`
      : facet.angle,
    isConsolidation: consolidation,
  };
}

/** The whole 180-day plan for a market, in order. */
export function syllabusFor(marketId: string): SyllabusDay[] {
  return Array.from({ length: TOTAL_DAYS }, (_, i) => syllabusDay(marketId, i + 1));
}

export const facetLabel = (key: FacetKey) => FACET_BY_KEY.get(key)?.label ?? 'Concept';
