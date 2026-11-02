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
  checkDefinition,
  checkFigure,
  checkMechanism,
  checkTamper,
  termsFromSlides,
} from '../sequencer/lessonChecks';
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
  const factKeys = (lesson: StudiedLessonInput, exercise: Exercise): string[] => {
    const scope = lesson.stackId ?? lesson.title;
    const prefix = (key: string) => `${scope}/${key}`;
    if (exercise.kind === 'multipleChoice' && exercise.prompt.startsWith('This lesson defined')) {
      return [prefix(`term/${norm(exercise.options[exercise.correctIndex])}`)];
    }
    if (exercise.kind === 'multipleChoice') {
      const answer = exercise.options[exercise.correctIndex];
      const term = terms(lesson).find(t => norm(answer).replace(/^the /, '') === norm(t.term));
      if (term) return [prefix(`term/${norm(term.term)}`)];
    }
    const lineKeys = (line: string): string[] => {
      const text = norm(line.replace(/^Straight from what you just read:\s*/i, ''));
      const keys = [prefix(`line/${text}`)];
      if (/cortex/.test(text) && /gray|outer layer/.test(text) && !/billion/.test(text)) keys.push(prefix('term/cerebral cortex'));
      if (/hippocampus/.test(text) && /memor|stor|retriev/.test(text)) keys.push(prefix('term/hippocampus'));
      const quantity = line.match(/(\d+(?:[.,]\d+)?)\s*(%|percent|billion|million|thousand)/i);
      if (quantity) {
        const region = /cortex/.test(text) ? 'cortex' : /cerebell/.test(text) || /it holds/.test(text) ? 'cerebellum' : 'brain';
        keys.push(prefix(`quantity/${region}/${quantity[1]}/${quantity[2].toLowerCase()}`));
      }
      return keys;
    };
    if (exercise.kind === 'numberSense') {
      const context = norm(exercise.prompt);
      const region = /cortex/.test(context) ? 'cortex' : /cerebell/.test(context) ? 'cerebellum' : 'brain';
      return [prefix(`quantity/${region}/${exercise.value}/${exercise.unit === '%' ? '%' : exercise.unit ?? ''}`)];
    }
    if (exercise.kind === 'multipleChoice' && exercise.prompt.startsWith('Fill the gap:')) {
      return lineKeys(exercise.explanation ?? '');
    }
    if (exercise.kind === 'buildChain') return exercise.steps.flatMap(lineKeys);
    if (exercise.kind === 'sortSignal') return exercise.items.map(item => prefix(`job/${norm(item.text)}`));
    const explanation = 'explanation' in exercise ? exercise.explanation ?? '' : '';
    return lineKeys(explanation);
  };
  const tag = (lesson: StudiedLessonInput, exercise: Exercise | null): Candidate[] => exercise
    ? [{ exercise: { ...exercise, source: lessonSource(lesson) }, facts: factKeys(lesson, exercise) }] : [];
  const own = (kind: AuthoredQuestion['kind']) => review.flatMap(lesson =>
    (lesson.questions ?? []).filter(q => q.kind === kind).flatMap(q => tag(lesson, shuffleAuthored(q))));
  const definitions = () => lessons.flatMap(lesson => {
    const pool = terms(lesson);
    return pool.flatMap(target => {
      // Keep authored decoys, but choose each target deterministically.
      const check = checkDefinition(pool, nextId());
      if (!check) return [];
      const options = shuffle([target.term, ...pool.filter(t => norm(t.term) !== norm(target.term)).slice(0, 2).map(t => t.term)]);
      return tag(lesson, { ...check, prompt: `This lesson defined it as: "${target.definition}". Which term is that?`,
        options, correctIndex: options.indexOf(target.term), explanation: `${target.term}: ${target.definition}` });
    });
  });
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
    // Never expand market filler to compensate for exhausted lesson history.
    if (selected.length < limit) {
      for (const exercise of fallback) {
        if (exercise && accept({ exercise: { ...exercise, source: { type: 'industry' } }, facts: [] })) break;
      }
    }
    return selected;
  };
  const tampers = generated(checkTamper);
  reserved = tampers.find(c => 'explanation' in c.exercise && !/\d/.test(c.exercise.explanation ?? ''));
  const claims = generated(checkClaim, true).sort((a, b) => {
    const text = (c: Candidate) => 'explanation' in c.exercise ? c.exercise.explanation ?? '' : '';
    const priority = (text: string) => /cerebrum.*largest|brainstem.*links|limbic.*emotion/.test(text.toLowerCase()) ? 0 : /\d/.test(text) ? 2 : 1;
    return priority(text(a)) - priority(text(b));
  });
  const defs = definitions();
  const authoredMC = own('multipleChoice');
  const wave1 = fill([...authoredMC.slice(0, 1), ...defs.slice(0, 1), ...claims, ...defs.slice(1), ...authoredMC.slice(1)], [
    pack ? packFaceOff(pack, nextId()) : null, statFaceOff(input.stats, nextId()),
    drillTrueFalse(input.drills, nextId()), statTrend(input.stats, nextId()),
  ], 4);
  const figures = generated(checkFigure);
  const authoredNumbers = own('numberSense');
  const wave2 = fill([...authoredNumbers.slice(0, 1), ...figures.slice(0, 1), ...generated(checkMechanism), ...own('sortSignal'), ...figures, ...authoredNumbers.slice(1)], [
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
