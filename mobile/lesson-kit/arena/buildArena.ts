/**
 * Arena builder — three escalating waves built on the lessons this learner has
 * already studied, in EVERY market.
 *
 * Wave 1 "Warm-up": recognition of what the lessons defined and claimed.
 * Wave 2 "Pressure": the mechanisms and figures those lessons taught.
 * Wave 3 "Sudden death": tampered claims and a real call from the market.
 *
 * Studied-lesson material always comes first; authored packs, trainer
 * scenarios, fact-checked drills and sourced statistics fill any gap so a
 * market with thin lesson text still plays.
 */
import { Exercise, KeyTerm } from '../types';
import { AuthoredQuestion, lessonSource } from '../practice/studiedMaterial';
import { sentences, norm } from '../sequencer/extract';
import { quizQuestionKeys } from '../../lib/quizHistory';
import { getIndustryPack } from '../industry/packs';
import type { DrillRow, IndustryStatRow, TrainerScenarioRow } from '../../hooks/useIndustryContent';
import type { SlideLike } from '../sequencer/extract';
import {
  checkClaim,
  checkFigure,
  checkMechanism,
  checkTamper,
  isRealTerm,
  termsFromSlides,
} from '../sequencer/lessonChecks';
import { glossaryEntriesFor } from '../glossary';
import {
  drillSpotFake,
  drillTrueFalse,
  packChain,
  packFaceOff,
  packMap,
  packNumber,
  statFaceOff,
  statNumberSense,
  statTrend,
  trainerCall,
} from '../industry/build';

export interface ArenaWave {
  key: string;
  name: string;
  tagline: string;
  /** Seconds allowed per beat in this wave. */
  seconds: number;
  /** Points multiplier for the wave. */
  multiplier: number;
  exercises: Exercise[];
}

/** A lesson the learner has already read, used as practice material. */
export interface StudiedLessonInput {
  stackId?: string;
  title: string;
  day?: number | null;
  slides: SlideLike[];
  questions?: AuthoredQuestion[];
  keyTerms?: KeyTerm[];
}

export interface ArenaInput {
  marketId?: string;
  marketName?: string;
  trainer: TrainerScenarioRow[];
  drills: DrillRow[];
  stats: IndustryStatRow[];
  /** Lessons behind the learner, newest first. */
  studied?: StudiedLessonInput[];
  seenQuestionKeys?: Set<string>;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Candidate = { exercise: Exercise; facts: string[] };

/** Shuffle choices, never their answer mapping or authored wording. */
export function shuffleAuthored(question: AuthoredQuestion): Exercise {
  if (question.kind !== 'multipleChoice') return { ...question };
  const indices = shuffle(question.options.map((_, index) => index));
  return { ...question, options: indices.map(index => question.options[index]), correctIndex: indices.indexOf(question.correctIndex) };
}

export function buildArena(input: ArenaInput): ArenaWave[] {
  const pack = getIndustryPack(input.marketId);
  const lessons = [...(input.studied ?? [])].sort((a, b) => (b.day ?? 0) - (a.day ?? 0));
  const review = lessons.length > 1 ? [...lessons.slice(1), lessons[0]] : lessons;
  const used = new Set(input.seenQuestionKeys ?? []);
  const facts = new Set<string>();
  let serial = 0;
  const nextId = () => `arena-${serial++}`;
  const terms = (lesson: StudiedLessonInput) => lesson.keyTerms?.length ? lesson.keyTerms : termsFromSlides(lesson.slides);
  /** Words that tie a question to this lesson: its key terms and title words. */
  const lessonKeyParts = (lesson: StudiedLessonInput): string[] => {
    const termParts = terms(lesson).flatMap(t => [norm(t.term), ...norm(t.term).split(/[^a-z0-9]+/)]);
    const titleWords = norm(lesson.title).split(/[^a-z0-9]+/);
    return [...new Set([...termParts, ...titleWords])].filter(part => part.length > 3);
  };
  const factKeys = (lesson: StudiedLessonInput, exercise: Exercise): string[] => {
    const scope = lesson.stackId ?? lesson.title;
    const prefix = (key: string) => `${scope}/${key}`;
    const lessonTerms = terms(lesson);
    const termsIn = (text: string) => lessonTerms.filter(t => text.includes(norm(t.term)));
    if (exercise.kind === 'multipleChoice' && exercise.prompt.startsWith('This lesson defined')) {
      return [prefix(`term/${norm(exercise.options[exercise.correctIndex])}`)];
    }
    if (exercise.kind === 'multipleChoice') {
      const answer = exercise.options[exercise.correctIndex];
      const term = lessonTerms.find(t => norm(answer).replace(/^the /, '') === norm(t.term));
      // The answer being a key term only duplicates the definition question
      // when the prompt itself tests the term's meaning.
      if (term) {
        const defWords = norm(term.definition).split(/[^a-z0-9]+/).filter(word => word.length > 4);
        const prompt = norm(exercise.prompt);
        if (defWords.filter(word => prompt.includes(word)).length >= 3) return [prefix(`term/${norm(term.term)}`)];
      }
    }
    const lineKeys = (line: string, withTerms = true): string[] => {
      const text = norm(line.replace(/^Straight from what you just read:\s*/i, ''));
      if (!text) return [];
      const keys = [prefix(`line/${text}`)];
      const quantities = [...line.matchAll(/(\d+(?:[.,]\d+)?)\s*(%|percent|billion|million|thousand)/gi)];
      // A line that defines a lesson term shares that term's fact, so the
      // definition question and a claim about the same line never both ask it.
      // Lines carrying a quantity are figure facts, not definitions.
      if (withTerms && !quantities.length) {
        for (const term of termsIn(text)) {
          const defWords = norm(term.definition).split(/[^a-z0-9]+/).filter(word => word.length > 4);
          if (defWords.filter(word => text.includes(word)).length >= 3) keys.push(prefix(`term/${norm(term.term)}`));
        }
      }
      for (const quantity of quantities) {
        const owner = termsIn(text)[0];
        keys.push(prefix(`quantity/${owner ? norm(owner.term) : 'lesson'}/${quantity[1]}/${quantity[2].toLowerCase()}`));
      }
      return keys;
    };
    if (exercise.kind === 'numberSense') {
      const context = norm(exercise.prompt);
      const owner = lessonTerms.find(t => context.includes(norm(t.term)));
      return [prefix(`quantity/${owner ? norm(owner.term) : 'lesson'}/${exercise.value}/${exercise.unit === '%' ? '%' : exercise.unit ?? ''}`)];
    }
    if (exercise.kind === 'multipleChoice' && exercise.prompt.startsWith('Fill the gap:')) {
      return lineKeys(exercise.explanation ?? '');
    }
    // Chain steps are short process labels, not definitions or figures: dedupe
    // them by their own words only, so a chain never loses to a definition or
    // a number question drawn from the same slide.
    if (exercise.kind === 'buildChain') {
      return exercise.steps.flatMap(step => {
        const text = norm(step.replace(/^Straight from what you just read:\s*/i, ''));
        return text ? [prefix(`line/${text}`)] : [];
      });
    }
    if (exercise.kind === 'sortSignal') return exercise.items.map(item => prefix(`job/${norm(item.text)}`));
    const explanation = 'explanation' in exercise ? exercise.explanation ?? '' : '';
    return lineKeys(explanation);
  };
  const tag = (lesson: StudiedLessonInput, exercise: Exercise | null): Candidate[] => exercise
    ? [{ exercise: { ...exercise, source: lessonSource(lesson) }, facts: factKeys(lesson, exercise) }] : [];
  const own = (kind: AuthoredQuestion['kind']) => review.flatMap(lesson =>
    (lesson.questions ?? []).filter(q => q.kind === kind).flatMap(q => tag(lesson, shuffleAuthored(q))));
  // One definition question per key term of each studied lesson. Decoys come
  // from the learner's OTHER studied lessons first, then the market glossary,
  // then the same lesson — and a decoy never matches the right definition.
  const definitions = () => {
    const glossaryPool = glossaryEntriesFor(input.marketId);
    return lessons.flatMap(lesson => {
      const pool = terms(lesson).filter(t => isRealTerm(t.term) && (t.definition || '').trim().length > 14);
      const others = lessons.filter(l => l !== lesson).flatMap(l => terms(l));
      return pool.flatMap(target => {
        const targetTerm = norm(target.term);
        const targetDef = norm(target.definition);
        const usable = (entry: KeyTerm) => {
          const term = norm(entry.term);
          return Boolean(term) && term !== targetTerm && norm(entry.definition) !== targetDef;
        };
        const decoys = [
          ...shuffle(others.filter(usable)),
          ...shuffle(glossaryPool.filter(usable)),
          ...shuffle(pool.filter(t => norm(t.term) !== targetTerm && usable(t))),
        ].filter((entry, index, list) => list.findIndex(o => norm(o.term) === norm(entry.term)) === index)
          .slice(0, 2);
        if (decoys.length < 2) return [];
        const options = shuffle([target.term, ...decoys.map(d => d.term)]);
        return tag(lesson, {
          kind: 'multipleChoice', id: nextId(),
          prompt: `This lesson defined it as: "${target.definition}". Which term is that?`,
          options, correctIndex: options.indexOf(target.term),
          explanation: `${target.term}: ${target.definition}`,
        });
      });
    });
  };
  const generated = (build: (slides: SlideLike[], id: string) => Exercise | null, faceOff = false) => lessons.flatMap(lesson => {
    const candidates: Candidate[] = [];
    for (let attempt = 0; attempt < 80; attempt += 1) {
      // Include sentence-sized figure candidates, not just the first number in a long card.
      const slides = build === checkFigure
        ? lesson.slides.flatMap(s => sentences(s.body ?? '', 15, 500).map(body => ({ ...s, body })))
        : lesson.slides;
      let exercise = build(slides, nextId());
      if (build === checkClaim && exercise && 'explanation' in exercise) {
        const truth = norm(exercise.explanation);
        const lessonTerms = terms(lesson);
        const titleWords = lesson.title.toLowerCase().split(/\W+/).filter(word => word.length > 4);
        if (lessonTerms.length && !lessonTerms.some(t => truth.includes(norm(t.term))) && !titleWords.some(word => truth.includes(word))) continue;
        // Claims test claims, not glossary lines: leave lines that define a
        // key term to that term's definition question.
        if (factKeys(lesson, exercise).some(key => key.includes('/term/'))) continue;
      }
      if (faceOff && exercise?.kind === 'multipleChoice') {
        const truth = exercise.options[exercise.correctIndex];
        const lie = exercise.options.find((_, index) => index !== exercise.correctIndex);
        if (lie) {
          const choices = shuffle([truth, lie]);
          exercise = { kind: 'faceOff', id: exercise.id, prompt: exercise.prompt,
            left: { name: choices[0] }, right: { name: choices[1] }, correctIndex: choices.indexOf(truth), explanation: exercise.explanation };
        }
      }
      candidates.push(...tag(lesson, exercise));
    }
    return candidates;
  });
  let reserved: Candidate | undefined;
  const fill = (pool: Candidate[], fallback: (Exercise | null)[], limit: number) => {
    const selected: Exercise[] = [];
    const kinds = new Map<string, number>();
    const accept = ({ exercise, facts: keys }: Candidate) => {
      const questionKeys = quizQuestionKeys(exercise);
      if ((kinds.get(exercise.kind) ?? 0) >= 2 || questionKeys.some(key => used.has(key)) || keys.some(key => facts.has(key))) return false;
      questionKeys.forEach(key => used.add(key));
      keys.forEach(key => facts.add(key));
      kinds.set(exercise.kind, (kinds.get(exercise.kind) ?? 0) + 1);
      selected.push({ ...exercise, id: nextId() });
      return true;
    };
    for (const candidate of pool) {
      if (selected.length === limit) break;
      if (reserved && candidate !== reserved && candidate.facts.some(key => reserved?.facts.includes(key))) continue;
      accept(candidate);
    }
    // Fill any gap from the wider industry so a run never shrinks: prefer
    // questions that touch the lessons' own terms and title words, and never
    // repeat a fact a lesson question already asked.
    if (selected.length < limit) {
      const parts = [...new Set(lessons.flatMap(lessonKeyParts))];
      const relevance = (exercise: Exercise) => {
        const text = norm(JSON.stringify(exercise));
        return parts.filter(part => text.includes(part)).length;
      };
      const candidates = shuffle(fallback.filter((e): e is Exercise => Boolean(e)))
        .sort((a, b) => relevance(b) - relevance(a))
        .map(exercise => ({
          exercise: { ...exercise, source: { type: 'industry' as const } },
          facts: lessons.flatMap(lesson => factKeys(lesson, exercise)),
        }));
      for (const candidate of candidates) {
        if (selected.length === limit) break;
        accept(candidate);
      }
    }
    return selected;
  };
  const tampers = generated(checkTamper);
  reserved = tampers.find(c => 'explanation' in c.exercise && !/\d/.test(c.exercise.explanation ?? ''));
  // Prefer claims without quantities, so number facts stay available for the
  // figure and number-sense questions in Round 2.
  const claims = generated(checkClaim, true).sort((a, b) => {
    const text = (c: Candidate) => 'explanation' in c.exercise ? c.exercise.explanation ?? '' : '';
    return (/\d/.test(text(a)) ? 1 : 0) - (/\d/.test(text(b)) ? 1 : 0);
  });
  const defs = definitions();
  const authoredMC = own('multipleChoice');
  const wave1 = fill([...authoredMC.slice(0, 1), ...defs.slice(0, 1), ...claims, ...defs.slice(1), ...authoredMC.slice(1)], [
    pack ? packFaceOff(pack, nextId()) : null, statFaceOff(input.stats, nextId()),
    drillTrueFalse(input.drills, nextId()), statTrend(input.stats, nextId()),
  ], 4);
  const figures = generated(checkFigure);
  const authoredNumbers = own('numberSense');
  const wave2 = fill([...authoredNumbers.slice(0, 1), ...figures.slice(0, 1), ...generated(checkMechanism), ...own('sortSignal'), ...own('buildChain'), ...figures, ...authoredNumbers.slice(1)], [
    pack ? packChain(pack, nextId()) : null, statNumberSense(input.stats, nextId()),
    drillSpotFake(input.drills, nextId()), pack ? packMap(pack, nextId()) : null, pack ? packNumber(pack, nextId()) : null,
  ], 4);
  const finalPool = [...(reserved ? [reserved] : []), ...definitions(), ...tampers];
  reserved = undefined;
  const wave3 = fill(finalPool, [
    ...shuffle(input.trainer).map(scenario => trainerCall(scenario, nextId())),
  ], 3);

  const waves: ArenaWave[] = [
    {
      key: 'warmup',
      name: 'Round 1',
      tagline: 'Round 1 · 20 seconds per question',
      seconds: 20,
      multiplier: 1,
      exercises: wave1,
    },
    {
      key: 'pressure',
      name: 'Round 2',
      tagline: 'Round 2 · 15 seconds per question',
      seconds: 15,
      multiplier: 2,
      exercises: wave2,
    },
    {
      key: 'sudden',
      name: 'Round 3',
      tagline: 'Round 3 · 25 seconds per question',
      seconds: 25,
      multiplier: 3,
      exercises: wave3,
    },
  ];

  return waves.filter(w => w.exercises.length > 0);
}

export interface ArenaRank {
  key: string;
  label: string;
  color: string;
  min: number;
}

export const ARENA_RANKS: ArenaRank[] = [
  { key: 'diamond', label: 'Excellent', color: '#38BDF8', min: 900 },
  { key: 'gold', label: 'Strong', color: '#F59E0B', min: 600 },
  { key: 'silver', label: 'Good', color: '#94A3B8', min: 350 },
  { key: 'bronze', label: 'Keep going', color: '#FB923C', min: 0 },
];

export function rankForScore(score: number): ArenaRank {
  return ARENA_RANKS.find(r => score >= r.min) || ARENA_RANKS[ARENA_RANKS.length - 1];
}
