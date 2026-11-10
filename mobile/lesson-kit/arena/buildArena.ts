/**
 * Arena builder — three rounds, each a different kind of game, built on the
 * lessons this learner has already studied, in EVERY market.
 *
 * Round 1 "Quick fire": match the pairs, true-or-false cards, fill the gap.
 * Round 2 "Connect the dots": numbers, groups, order and the odd one out.
 * Round 3 "Your call": the judgment calls the lessons wrote.
 *
 * Hand-written lessons play only their own material: their checks, terms,
 * rule and takeaway. Sentence-editing games (spot the changed word) run only
 * for older lessons that have no written checks. Authored packs, trainer
 * scenarios, fact-checked drills and sourced statistics fill any gap.
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
  checkTamper,
  isRealTerm,
  termsFromSlides,
} from '../sequencer/lessonChecks';
import { reviewCardFor } from '../components/feedbackCopy';
import { glossaryEntriesFor } from '../glossary';
import { distinctTerms, fillBlankFrom, matchPairsFrom, oddOneOutFrom, quickFireFrom } from './arenaGames';
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
  /** What the round draws on, shown before it starts ("Starter round · from …"). */
  covers?: string;
}

/** Learners with this many lessons or fewer get a starter run: only what they studied, no industry fill. */
export const STARTER_LESSON_LIMIT = 2;

/** Words a learner has to read before answering. */
export function readingWords(exercise: Exercise): number {
  const e = exercise as unknown as Record<string, unknown>;
  const parts: string[] = [];
  const add = (value: unknown) => {
    if (typeof value === 'string') parts.push(value);
    else if (Array.isArray(value)) value.forEach(add);
    else if (value && typeof value === 'object') {
      const o = value as Record<string, unknown>;
      add(o.text ?? o.name ?? o.label ?? o.question);
    }
  };
  for (const key of ['prompt', 'situation', 'options', 'statements', 'steps', 'items', 'left', 'right', 'nodes', 'buckets']) add(e[key]);
  if (exercise.kind === 'matchPairs') exercise.pairs.forEach(pair => { add(pair.left); add(pair.right); });
  if (exercise.kind === 'quickFire') exercise.cards.forEach(card => add(card.text));
  return parts.join(' ').split(/\s+/).filter(Boolean).length;
}

/**
 * Seconds for one question: the round's clock, stretched for long questions
 * (about 3 words a second plus 5 to think), never past 45. Chains keep 25.
 */
export function beatSeconds(wave: { seconds: number } | undefined, exercise: Exercise | undefined | null): number {
  const base = wave?.seconds ?? 20;
  if (!exercise) return base;
  // Multi-part games get time per part: a card is a few seconds, a pair a little longer.
  if (exercise.kind === 'quickFire') return Math.min(60, exercise.cards.length * 7 + 4);
  if (exercise.kind === 'matchPairs') return Math.min(75, exercise.pairs.length * 14 + 6);
  const reading = Math.min(45, Math.ceil(readingWords(exercise) / 3) + 5);
  return Math.max(base, reading, exercise.kind === 'buildChain' ? 25 : 0);
}

/** Share of Arena XP a second or later run on the same local day pays. */
export const ARENA_REPLAY_SHARE = 0.25;

/**
 * Arena XP comes from right answers, plus a bonus for a perfect run, so full
 * credit means getting every question right, not racing a clock. Later runs
 * the same day pay a quarter.
 */
export function arenaXp(correct: number, total: number, replay = false): number {
  const full = 10 + Math.max(0, correct) * 8 + (total > 0 && correct === total ? 20 : 0);
  return replay ? Math.max(5, Math.round(full * ARENA_REPLAY_SHARE)) : full;
}

/** A lesson the learner has already read, used as practice material. */
export interface StudiedLessonInput {
  stackId?: string;
  title: string;
  day?: number | null;
  slides: SlideLike[];
  questions?: AuthoredQuestion[];
  keyTerms?: KeyTerm[];
  /** The lesson's rule line, takeaway and opening headline, from the hand-written lesson. */
  rule?: string;
  takeaway?: string;
  headline?: string;
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
  return {
    ...question,
    options: indices.map(index => question.options[index]),
    correctIndex: indices.indexOf(question.correctIndex),
    ...(question.whyWrong ? { whyWrong: indices.map(index => question.whyWrong?.[index] ?? null) } : {}),
  };
}

/** Attach the lesson card a wrong answer can reopen, when one clearly matches. */
function withReview(exercise: Exercise, slides: SlideLike[]): Exercise {
  const review = reviewCardFor(slides, exercise);
  return review ? { ...exercise, review } : exercise;
}

export function buildArena(input: ArenaInput): ArenaWave[] {
  const pack = getIndustryPack(input.marketId);
  // Retain row provenance and reject other industries even if a caller hands
  // us a stale or mixed fallback pool. Unscoped legacy inputs remain supported.
  const inMarket = <T extends { market_id?: string }>(rows: T[]) =>
    rows.filter(row => !row.market_id || row.market_id === input.marketId);
  const stats = inMarket(input.stats);
  const drills = inMarket(input.drills);
  const trainer = inMarket(input.trainer);
  const lessons = [...(input.studied ?? [])].sort((a, b) => (b.day ?? 0) - (a.day ?? 0));
  const review = lessons.length > 1 ? [...lessons.slice(1), lessons[0]] : lessons;
  // A brand-new learner only gets questions about what they studied.
  const starter = lessons.length > 0 && lessons.length <= STARTER_LESSON_LIMIT;
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
        return text ? [prefix(`chain/${text}`)] : [];
      });
    }
    if (exercise.kind === 'sortSignal') return exercise.items.map(item => prefix(`job/${norm(item.text)}`));
    const explanation = 'explanation' in exercise ? exercise.explanation ?? '' : '';
    return lineKeys(explanation);
  };
  // Facts the written checks test. Term games leave these terms to the checks,
  // which ask about them more precisely.
  const authoredFacts = new Set<string>();
  const tag = (lesson: StudiedLessonInput, exercise: Exercise | null): Candidate[] => exercise
    ? [{ exercise: withReview({ ...exercise, source: lessonSource(lesson) }, lesson.slides), facts: factKeys(lesson, exercise) }] : [];
  const own = (kind: AuthoredQuestion['kind']) => review.flatMap(lesson =>
    (lesson.questions ?? []).filter(q => q.kind === kind).flatMap(q => tag(lesson, shuffleAuthored(q))));
  // One definition question per key term of each studied lesson. Decoys come
  // from the learner's OTHER studied lessons first, then the market glossary,
  // then the same lesson — and a decoy never matches the right definition.
  const definitions = () => {
    const glossaryPool = glossaryEntriesFor(input.marketId);
    return lessons.flatMap(lesson => {
      const pool = terms(lesson).filter(t => isRealTerm(t.term) && (t.definition || '').trim().length > 14 &&
        !authoredFacts.has(`${lesson.stackId ?? lesson.title}/term/${norm(t.term)}`));
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
  // Only lessons without written checks fall back to games made by editing their sentences.
  const legacyLessons = lessons.filter(lesson => !(lesson.questions?.length));
  const generated = (build: (slides: SlideLike[], id: string) => Exercise | null, faceOff = false) => legacyLessons.flatMap(lesson => {
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
        const mc = exercise;
        const truth = mc.options[mc.correctIndex];
        const lie = mc.options.find((_, index) => index !== mc.correctIndex);
        if (lie) {
          const choices = shuffle([truth, lie]);
          exercise = { kind: 'faceOff', id: mc.id, prompt: mc.prompt,
            left: { name: choices[0] }, right: { name: choices[1] }, correctIndex: choices.indexOf(truth), explanation: mc.explanation,
            ...(mc.whyWrong ? { whyWrong: choices.map(choice => mc.whyWrong?.[mc.options.indexOf(choice)] ?? null) } : {}) };
        }
      }
      candidates.push(...tag(lesson, exercise));
    }
    return candidates;
  });
  let reserved: Candidate | undefined;
  // The big games appear once per run, so every run mixes formats.
  const ONCE_PER_RUN = new Set<string>(['quickFire', 'matchPairs']);
  const runKinds = new Set<string>();
  const fill = (pool: Candidate[], fallback: (Exercise | null)[], limit: number) => {
    const selected: Exercise[] = [];
    const kinds = new Map<string, number>();
    const accept = ({ exercise, facts: keys }: Candidate) => {
      const questionKeys = quizQuestionKeys(exercise);
      if ((kinds.get(exercise.kind) ?? 0) >= 2 || (ONCE_PER_RUN.has(exercise.kind) && runKinds.has(exercise.kind)) ||
        questionKeys.some(key => used.has(key)) || keys.some(key => facts.has(key))) return false;
      runKinds.add(exercise.kind);
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
    if (selected.length < limit && !starter) {
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
  for (const lesson of lessons) for (const q of lesson.questions ?? []) factKeys(lesson, q).forEach(key => authoredFacts.add(key));
  const defs = definitions();
  const authoredMC = own('multipleChoice');

  // ── Games from the hand-written lessons ──
  const scopeOf = (lesson: StudiedLessonInput) => lesson.stackId ?? lesson.title;
  const playable = (lesson: StudiedLessonInput) => distinctTerms(terms(lesson)).filter(term => !authoredFacts.has(`${scopeOf(lesson)}/term/${norm(term.term)}`));
  const termFact = (lesson: StudiedLessonInput, term: string) => `${scopeOf(lesson)}/term/${norm(term)}`;
  const glossary = glossaryEntriesFor(input.marketId);
  const decoysFor = (lesson: StudiedLessonInput): KeyTerm[] => [
    ...lessons.filter(other => other !== lesson).flatMap(terms),
    ...shuffle(glossary),
  ];
  const sourceFor = (owners: StudiedLessonInput[]) => {
    const unique = [...new Set(owners)];
    if (unique.length === 1) return lessonSource(unique[0]);
    const days = unique.map(l => l.day).filter((d): d is number => typeof d === 'number').sort((a, b) => a - b);
    return { type: 'lesson' as const, title: days.length ? `Days ${days.slice(0, -1).join(', ')} and ${days[days.length - 1]}` : 'Your recent lessons' };
  };
  // Match the pairs: newest terms first, up to four, from one or two lessons.
  const matchCandidates: Candidate[] = [];
  {
    const owned = lessons.flatMap(lesson => playable(lesson).map(term => ({ lesson, term })));
    const unique = owned.filter((entry, index) => owned.findIndex(o => norm(o.term.term) === norm(entry.term.term)) === index);
    for (let start = 0; start < unique.length; start += 4) {
      const chunk = unique.slice(start, start + 4);
      const exercise = matchPairsFrom(chunk.map(entry => entry.term), nextId());
      if (!exercise) continue;
      const owners = chunk.slice(0, exercise.pairs.length);
      matchCandidates.push({
        exercise: { ...exercise, source: sourceFor(owners.map(o => o.lesson)) },
        facts: owners.map(o => termFact(o.lesson, o.term.term)),
      });
    }
  }
  // Quick fire: each lesson's spot-the-fake lines plus its terms, or its lines alone.
  const quickCandidates: Candidate[] = lessons.flatMap(lesson => {
    const fakes = (lesson.questions ?? []).filter((q): q is Extract<AuthoredQuestion, { kind: 'spotFake' }> => q.kind === 'spotFake');
    const fakeFacts = fakes.flatMap(f => factKeys(lesson, f));
    const lessonTerms = playable(lesson);
    const truths = [lesson.rule, lesson.takeaway].filter((line): line is string => Boolean(line));
    const variants = [
      { spotFakes: fakes, terms: lessonTerms, truths },
      { spotFakes: fakes, terms: [] as KeyTerm[], truths },
      { spotFakes: [] as typeof fakes, terms: lessonTerms, truths },
    ];
    return variants.flatMap(variant => {
      const exercise = quickFireFrom({ ...variant, decoyTerms: decoysFor(lesson) }, nextId());
      if (!exercise) return [];
      const usedTerms = variant.terms.filter(t => exercise.cards.some(card => card.text.startsWith(`${t.term.trim()}:`)));
      const usedLines = truths.filter(line => exercise.cards.some(card => norm(card.text) === norm(line)));
      return [{
        exercise: withReview({ ...exercise, source: lessonSource(lesson) }, lesson.slides),
        facts: [
          ...(variant.spotFakes.length ? fakeFacts : []),
          ...usedTerms.map(t => termFact(lesson, t.term)),
          ...usedLines.map(line => `${scopeOf(lesson)}/line/${norm(line)}`),
        ],
      }];
    });
  });
  // Fill the gap in the lesson's own rule or takeaway.
  const blankCandidates: Candidate[] = lessons.flatMap(lesson => (
    [['rule', lesson.rule], ['takeaway', lesson.takeaway]] as const
  ).flatMap(([label, line]) => {
    const exercise = fillBlankFrom(line, playable(lesson), decoysFor(lesson), nextId(), label);
    if (!exercise) return [];
    const answer = exercise.options[exercise.correctIndex];
    return [{
      exercise: withReview({ ...exercise, source: lessonSource(lesson) }, lesson.slides),
      facts: [termFact(lesson, answer), `${scopeOf(lesson)}/line/${norm(line ?? '')}`],
    }];
  }));
  // The headline's and takeaway's own figures, with decoys a clear size apart.
  const takeawayFigures: Candidate[] = lessons.flatMap(lesson => lesson.questions?.length
    ? [lesson.headline, lesson.takeaway].flatMap(line => line
      ? tag(lesson, checkFigure([{ slideNumber: 0, title: lesson.title, body: line }], nextId())) : [])
    : []);
  // Odd one out, from the sorts the lessons wrote.
  const oddCandidates: Candidate[] = review.flatMap(lesson => (lesson.questions ?? [])
    .filter((q): q is Extract<AuthoredQuestion, { kind: 'sortSignal' }> => q.kind === 'sortSignal')
    .flatMap(sort => {
      const exercise = oddOneOutFrom(sort, nextId());
      return exercise ? [{ exercise: withReview({ ...exercise, source: lessonSource(lesson) }, lesson.slides), facts: factKeys(lesson, sort) }] : [];
    }));

  const wave1 = fill([
    ...quickCandidates, ...matchCandidates, ...blankCandidates,
    ...defs.slice(0, 1), ...claims, ...defs.slice(1), ...authoredMC.slice(0, 1),
  ], [
    pack ? packFaceOff(pack, nextId()) : null, statFaceOff(stats, nextId()),
    drillTrueFalse(drills, nextId()), statTrend(stats, nextId()),
  ], 3);
  const figures = generated(checkFigure);
  const authoredNumbers = own('numberSense');
  const wave2 = fill([
    ...authoredNumbers.slice(0, 1), ...own('sortSignal'), ...own('buildChain'), ...oddCandidates,
    ...takeawayFigures, ...own('spotFake'), ...figures.slice(0, 1), ...generated(checkClaim), ...figures, ...authoredNumbers.slice(1),
  ], [
    pack ? packChain(pack, nextId()) : null, statNumberSense(stats, nextId()),
    drillSpotFake(drills, nextId()), pack ? packMap(pack, nextId()) : null, pack ? packNumber(pack, nextId()) : null,
  ], 3);
  const finalPool = [...own('theCall'), ...own('faceOff'), ...authoredMC, ...(reserved ? [reserved] : []), ...definitions(), ...tampers];
  reserved = undefined;
  const wave3 = fill(finalPool, [
    ...shuffle(trainer).map(scenario => trainerCall(scenario, nextId())),
  ], 3);

  const waves: ArenaWave[] = [
    {
      key: 'quick',
      name: 'Quick fire',
      tagline: 'Warm up on what you learned.',
      seconds: 20,
      multiplier: 1,
      exercises: wave1,
    },
    {
      key: 'connect',
      name: 'Connect the dots',
      tagline: 'Numbers, groups and the odd one out.',
      seconds: 20,
      multiplier: 2,
      exercises: wave2,
    },
    {
      key: 'call',
      name: 'Your call',
      tagline: 'The judgment calls from your lessons.',
      seconds: 30,
      multiplier: 3,
      exercises: wave3,
    },
  ];

  const titles = [...new Set(lessons.map(lesson => lesson.title).filter(Boolean))];
  const covers = titles.length
    ? starter ? `Starter round · from ${titles.join(' and ')}` : `Today's round: ${titles.slice(0, 3).join(', ')}${titles.length > 3 ? ' and more' : ''}`
    : undefined;
  return waves.filter(w => w.exercises.length > 0).map(w => (covers ? { ...w, covers } : w));
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
