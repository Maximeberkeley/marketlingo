import { lessonSource } from "../practice/studiedMaterial";
import { sentences, norm } from "../sequencer/extract";
import { quizQuestionKeys } from "../../lib/quizHistory";
import { getIndustryPack } from "../industry/packs";
import {
  checkClaim,
  checkFigure,
  checkMechanism,
  checkTamper,
  isRealTerm,
  termsFromSlides
} from "../sequencer/lessonChecks";
import { glossaryEntriesFor } from "../glossary";
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
  trainerCall
} from "../industry/build";
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function shuffleAuthored(question) {
  if (question.kind !== "multipleChoice") return { ...question };
  const indices = shuffle(question.options.map((_, index) => index));
  return { ...question, options: indices.map((index) => question.options[index]), correctIndex: indices.indexOf(question.correctIndex) };
}
function buildArena(input) {
  const pack = getIndustryPack(input.marketId);
  const lessons = [...input.studied ?? []].sort((a, b) => (b.day ?? 0) - (a.day ?? 0));
  const review = lessons.length > 1 ? [...lessons.slice(1), lessons[0]] : lessons;
  const used = new Set(input.seenQuestionKeys ?? []);
  const facts = /* @__PURE__ */ new Set();
  let serial = 0;
  const nextId = () => `arena-${serial++}`;
  const terms = (lesson) => lesson.keyTerms?.length ? lesson.keyTerms : termsFromSlides(lesson.slides);
  const lessonKeyParts = (lesson) => {
    const termParts = terms(lesson).flatMap((t) => [norm(t.term), ...norm(t.term).split(/[^a-z0-9]+/)]);
    const titleWords = norm(lesson.title).split(/[^a-z0-9]+/);
    return [.../* @__PURE__ */ new Set([...termParts, ...titleWords])].filter((part) => part.length > 3);
  };
  const factKeys = (lesson, exercise) => {
    const scope = lesson.stackId ?? lesson.title;
    const prefix = (key) => `${scope}/${key}`;
    const lessonTerms = terms(lesson);
    const termsIn = (text) => lessonTerms.filter((t) => text.includes(norm(t.term)));
    if (exercise.kind === "multipleChoice" && exercise.prompt.startsWith("This lesson defined")) {
      return [prefix(`term/${norm(exercise.options[exercise.correctIndex])}`)];
    }
    if (exercise.kind === "multipleChoice") {
      const answer = exercise.options[exercise.correctIndex];
      const term = lessonTerms.find((t) => norm(answer).replace(/^the /, "") === norm(t.term));
      if (term) return [prefix(`term/${norm(term.term)}`)];
    }
    const lineKeys = (line) => {
      const text = norm(line.replace(/^Straight from what you just read:\s*/i, ""));
      const keys = [prefix(`line/${text}`)];
      const quantities = [...line.matchAll(/(\d+(?:[.,]\d+)?)\s*(%|percent|billion|million|thousand)/gi)];
      if (!quantities.length) {
        for (const term of termsIn(text)) {
          const defWords = norm(term.definition).split(/[^a-z0-9]+/).filter((word) => word.length > 4);
          if (defWords.some((word) => text.includes(word))) keys.push(prefix(`term/${norm(term.term)}`));
        }
      }
      for (const quantity of quantities) {
        const owner = termsIn(text)[0];
        keys.push(prefix(`quantity/${owner ? norm(owner.term) : "lesson"}/${quantity[1]}/${quantity[2].toLowerCase()}`));
      }
      return keys;
    };
    if (exercise.kind === "numberSense") {
      const context = norm(exercise.prompt);
      const owner = lessonTerms.find((t) => context.includes(norm(t.term)));
      return [prefix(`quantity/${owner ? norm(owner.term) : "lesson"}/${exercise.value}/${exercise.unit === "%" ? "%" : exercise.unit ?? ""}`)];
    }
    if (exercise.kind === "multipleChoice" && exercise.prompt.startsWith("Fill the gap:")) {
      return lineKeys(exercise.explanation ?? "");
    }
    if (exercise.kind === "buildChain") return exercise.steps.flatMap(lineKeys);
    if (exercise.kind === "sortSignal") return exercise.items.map((item) => prefix(`job/${norm(item.text)}`));
    const explanation = "explanation" in exercise ? exercise.explanation ?? "" : "";
    return lineKeys(explanation);
  };
  const tag = (lesson, exercise) => exercise ? [{ exercise: { ...exercise, source: lessonSource(lesson) }, facts: factKeys(lesson, exercise) }] : [];
  const own = (kind) => review.flatMap((lesson) => (lesson.questions ?? []).filter((q) => q.kind === kind).flatMap((q) => tag(lesson, shuffleAuthored(q))));
  const definitions = () => {
    const glossaryPool = glossaryEntriesFor(input.marketId);
    return lessons.flatMap((lesson) => {
      const pool = terms(lesson).filter((t) => isRealTerm(t.term) && (t.definition || "").trim().length > 14);
      const others = lessons.filter((l) => l !== lesson).flatMap((l) => terms(l));
      return pool.flatMap((target) => {
        const targetTerm = norm(target.term);
        const targetDef = norm(target.definition);
        const usable = (entry) => {
          const term = norm(entry.term);
          return Boolean(term) && term !== targetTerm && norm(entry.definition) !== targetDef;
        };
        const decoys = [
          ...shuffle(others.filter(usable)),
          ...shuffle(glossaryPool.filter(usable)),
          ...shuffle(pool.filter((t) => norm(t.term) !== targetTerm && usable(t)))
        ].filter((entry, index, list) => list.findIndex((o) => norm(o.term) === norm(entry.term)) === index).slice(0, 2);
        if (decoys.length < 2) return [];
        const options = shuffle([target.term, ...decoys.map((d) => d.term)]);
        return tag(lesson, {
          kind: "multipleChoice",
          id: nextId(),
          prompt: `This lesson defined it as: "${target.definition}". Which term is that?`,
          options,
          correctIndex: options.indexOf(target.term),
          explanation: `${target.term}: ${target.definition}`
        });
      });
    });
  };
  const generated = (build, faceOff = false) => lessons.flatMap((lesson) => {
    const candidates = [];
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const slides = build === checkFigure ? lesson.slides.flatMap((s) => sentences(s.body ?? "", 15, 500).map((body) => ({ ...s, body }))) : lesson.slides;
      let exercise = build(slides, nextId());
      if (build === checkClaim && exercise && "explanation" in exercise) {
        const truth = norm(exercise.explanation);
        const lessonTerms = terms(lesson);
        const titleWords = lesson.title.toLowerCase().split(/\W+/).filter((word) => word.length > 4);
        if (lessonTerms.length && !lessonTerms.some((t) => truth.includes(norm(t.term))) && !titleWords.some((word) => truth.includes(word))) continue;
      }
      if (faceOff && exercise?.kind === "multipleChoice") {
        const truth = exercise.options[exercise.correctIndex];
        const lie = exercise.options.find((_, index) => index !== exercise.correctIndex);
        if (lie) {
          const choices = shuffle([truth, lie]);
          exercise = {
            kind: "faceOff",
            id: exercise.id,
            prompt: exercise.prompt,
            left: { name: choices[0] },
            right: { name: choices[1] },
            correctIndex: choices.indexOf(truth),
            explanation: exercise.explanation
          };
        }
      }
      candidates.push(...tag(lesson, exercise));
    }
    return candidates;
  });
  let reserved;
  const fill = (pool, fallback, limit) => {
    const selected = [];
    const kinds = /* @__PURE__ */ new Map();
    const accept = ({ exercise, facts: keys }) => {
      const questionKeys = quizQuestionKeys(exercise);
      if ((kinds.get(exercise.kind) ?? 0) >= 2 || questionKeys.some((key) => used.has(key)) || keys.some((key) => facts.has(key))) return false;
      questionKeys.forEach((key) => used.add(key));
      keys.forEach((key) => facts.add(key));
      kinds.set(exercise.kind, (kinds.get(exercise.kind) ?? 0) + 1);
      selected.push({ ...exercise, id: nextId() });
      return true;
    };
    for (const candidate of pool) {
      if (selected.length === limit) break;
      if (reserved && candidate !== reserved && candidate.facts.some((key) => reserved?.facts.includes(key))) continue;
      accept(candidate);
    }
    if (selected.length < limit) {
      const parts = [...new Set(lessons.flatMap(lessonKeyParts))];
      const relevance = (exercise) => {
        const text = norm(JSON.stringify(exercise));
        return parts.filter((part) => text.includes(part)).length;
      };
      const candidates = shuffle(fallback.filter((e) => Boolean(e))).sort((a, b) => relevance(b) - relevance(a)).map((exercise) => ({
        exercise: { ...exercise, source: { type: "industry" } },
        facts: lessons.flatMap((lesson) => factKeys(lesson, exercise))
      }));
      for (const candidate of candidates) {
        if (selected.length === limit) break;
        accept(candidate);
      }
    }
    return selected;
  };
  const tampers = generated(checkTamper);
  reserved = tampers.find((c) => "explanation" in c.exercise && !/\d/.test(c.exercise.explanation ?? ""));
  const claims = generated(checkClaim, true);
  const defs = definitions();
  const authoredMC = own("multipleChoice");
  const wave1 = fill([...authoredMC.slice(0, 1), ...defs.slice(0, 1), ...claims, ...defs.slice(1), ...authoredMC.slice(1)], [
    pack ? packFaceOff(pack, nextId()) : null,
    statFaceOff(input.stats, nextId()),
    drillTrueFalse(input.drills, nextId()),
    statTrend(input.stats, nextId())
  ], 4);
  const figures = generated(checkFigure);
  const authoredNumbers = own("numberSense");
  const wave2 = fill([...authoredNumbers.slice(0, 1), ...figures.slice(0, 1), ...generated(checkMechanism), ...own("sortSignal"), ...own("buildChain"), ...figures, ...authoredNumbers.slice(1)], [
    pack ? packChain(pack, nextId()) : null,
    statNumberSense(input.stats, nextId()),
    drillSpotFake(input.drills, nextId()),
    pack ? packMap(pack, nextId()) : null,
    pack ? packNumber(pack, nextId()) : null
  ], 4);
  const finalPool = [...reserved ? [reserved] : [], ...definitions(), ...tampers];
  reserved = void 0;
  const wave3 = fill(finalPool, [
    ...shuffle(input.trainer).map((scenario) => trainerCall(scenario, nextId()))
  ], 3);
  const waves = [
    {
      key: "warmup",
      name: "Round 1",
      tagline: "Round 1 \xB7 20 seconds per question",
      seconds: 20,
      multiplier: 1,
      exercises: wave1
    },
    {
      key: "pressure",
      name: "Round 2",
      tagline: "Round 2 \xB7 15 seconds per question",
      seconds: 15,
      multiplier: 2,
      exercises: wave2
    },
    {
      key: "sudden",
      name: "Round 3",
      tagline: "Round 3 \xB7 25 seconds per question",
      seconds: 25,
      multiplier: 3,
      exercises: wave3
    }
  ];
  return waves.filter((w) => w.exercises.length > 0);
}
const ARENA_RANKS = [
  { key: "diamond", label: "Excellent", color: "#38BDF8", min: 900 },
  { key: "gold", label: "Strong", color: "#F59E0B", min: 600 },
  { key: "silver", label: "Good", color: "#94A3B8", min: 350 },
  { key: "bronze", label: "Keep going", color: "#FB923C", min: 0 }
];
function rankForScore(score) {
  return ARENA_RANKS.find((r) => score >= r.min) || ARENA_RANKS[ARENA_RANKS.length - 1];
}
export {
  ARENA_RANKS,
  buildArena,
  rankForScore,
  shuffleAuthored
};
