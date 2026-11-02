import { lessonSource } from "../practice/studiedMaterial";
import { sentences, norm } from "../sequencer/extract";
import { quizQuestionKeys } from "../../lib/quizHistory";
import { getIndustryPack } from "../industry/packs";
import {
  checkClaim,
  checkDefinition,
  checkFigure,
  checkMechanism,
  checkTamper,
  termsFromSlides
} from "../sequencer/lessonChecks";
import {
  drillSpotFake,
  drillTrueFalse,
  packChain,
  packFaceOff,
  packMap,
  packNumber,
  packSpeedRound,
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
  const factKeys = (lesson, exercise) => {
    const scope = lesson.stackId ?? lesson.title;
    const prefix = (key) => `${scope}/${key}`;
    if (exercise.kind === "multipleChoice" && exercise.prompt.startsWith("This lesson defined")) {
      return [prefix(`term/${norm(exercise.options[exercise.correctIndex])}`)];
    }
    if (exercise.kind === "multipleChoice") {
      const answer = exercise.options[exercise.correctIndex];
      const term = terms(lesson).find((t) => norm(answer).replace(/^the /, "") === norm(t.term));
      if (term) return [prefix(`term/${norm(term.term)}`)];
    }
    if (exercise.kind === "numberSense" || exercise.kind === "multipleChoice" && exercise.prompt.startsWith("Fill the gap:")) {
      const answer = exercise.kind === "numberSense" ? `${exercise.value}` : exercise.options[exercise.correctIndex];
      const number = answer.match(/\d+(?:[.,]\d+)?/)?.[0];
      const context = exercise.prompt + " " + (exercise.explanation ?? "");
      const topic = norm(context).split(" ").filter((word) => word.length > 5 && !["lesson", "straight", "percent", "billion", "million", "roughly"].includes(word));
      const taught = lesson.slides.flatMap((s) => sentences(s.body ?? "", 15, 500)).filter((line) => number && new RegExp(`\\b${number}\\b`).test(line)).sort((a, b) => topic.filter((w) => norm(b).includes(w)).length - topic.filter((w) => norm(a).includes(w)).length)[0];
      return [prefix(`quantity/${number}/${norm(taught ?? context)}`)];
    }
    if (exercise.kind === "buildChain") return exercise.steps.map((step) => prefix(`line/${norm(step)}`));
    if (exercise.kind === "sortSignal") return exercise.items.map((item) => prefix(`job/${norm(item.text)}`));
    const explanation = "explanation" in exercise ? exercise.explanation ?? "" : "";
    return [prefix(`line/${norm(explanation.replace(/^Straight from what you just read:\s*/i, ""))}`)];
  };
  const tag = (lesson, exercise) => exercise ? [{ exercise: { ...exercise, source: lessonSource(lesson) }, facts: factKeys(lesson, exercise) }] : [];
  const own = (kind) => review.flatMap((lesson) => (lesson.questions ?? []).filter((q) => q.kind === kind).flatMap((q) => tag(lesson, shuffleAuthored(q))));
  const definitions = () => lessons.flatMap((lesson) => {
    const pool = terms(lesson);
    return pool.flatMap((target) => {
      const check = checkDefinition(pool, nextId());
      if (!check) return [];
      const options = shuffle([target.term, ...pool.filter((t) => norm(t.term) !== norm(target.term)).slice(0, 2).map((t) => t.term)]);
      return tag(lesson, {
        ...check,
        prompt: `This lesson defined it as: "${target.definition}". Which term is that?`,
        options,
        correctIndex: options.indexOf(target.term),
        explanation: `${target.term}: ${target.definition}`
      });
    });
  });
  const generated = (build, faceOff = false) => lessons.flatMap((lesson) => {
    const candidates = [];
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const slides = build === checkFigure ? lesson.slides.flatMap((s) => sentences(s.body ?? "", 15, 500).map((body) => ({ ...s, body }))) : lesson.slides;
      let exercise = build(slides, nextId());
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
      accept(candidate);
    }
    if (selected.length < limit) {
      for (const exercise of fallback) {
        if (exercise && accept({ exercise: { ...exercise, source: { type: "industry" } }, facts: [] })) break;
      }
    }
    return selected;
  };
  const wave1 = fill([...own("multipleChoice"), ...definitions(), ...generated(checkClaim, true)], [
    pack ? packFaceOff(pack, nextId()) : null,
    statFaceOff(input.stats, nextId()),
    drillTrueFalse(input.drills, nextId()),
    statTrend(input.stats, nextId())
  ], 4);
  const wave2 = fill([...own("numberSense"), ...generated(checkFigure), ...generated(checkMechanism), ...own("sortSignal")], [
    pack ? packChain(pack, nextId()) : null,
    statNumberSense(input.stats, nextId()),
    drillSpotFake(input.drills, nextId()),
    pack ? packMap(pack, nextId()) : null,
    pack ? packNumber(pack, nextId()) : null
  ], 4);
  const wave3 = fill([...generated(checkTamper), ...definitions()], [
    ...shuffle(input.trainer).map((scenario) => trainerCall(scenario, nextId())),
    drillSpotFake(input.drills, nextId()),
    pack ? packSpeedRound(pack, nextId()) : null
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
