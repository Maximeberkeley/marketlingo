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
const clean = (list, limit) => shuffle(list.filter((e) => !!e)).slice(0, limit);
function fromStudied(studied, build, prefix) {
  if (!studied?.length) return [];
  return studied.map((lesson, i) => build(lesson.slides, `${prefix}-${i}`));
}
function buildArena(input) {
  const pack = getIndustryPack(input.marketId);
  const { trainer, drills, stats, studied } = input;
  const trainerPool = shuffle(trainer);
  const used = new Set(input.seenQuestionKeys || []);
  const fresh = (make, limit) => {
    const selected = [];
    for (let attempt = 0; attempt < 12 && selected.length < limit; attempt += 1) {
      for (const exercise of clean(make(), 1e3)) {
        const keys = quizQuestionKeys(exercise);
        if (keys.some((key) => used.has(key))) continue;
        keys.forEach((key) => used.add(key));
        selected.push({ ...exercise, id: `${exercise.id}-${attempt}-${selected.length}` });
        if (selected.length === limit) break;
      }
    }
    return selected;
  };
  const wave1 = fresh(
    () => [
      ...fromStudied(studied, (slides, id) => checkDefinition(termsFromSlides(slides), id), "a1-def"),
      ...fromStudied(studied, checkClaim, "a1-claim"),
      pack ? packFaceOff(pack, "a1-faceoff") : null,
      statFaceOff(stats, "a1-statface"),
      drillTrueFalse(drills, "a1-tf1"),
      statTrend(stats, "a1-trend")
    ],
    4
  );
  const wave2 = fresh(
    () => [
      ...fromStudied(studied, checkMechanism, "a2-mech"),
      ...fromStudied(studied, checkFigure, "a2-fig"),
      pack ? packChain(pack, "a2-chain") : null,
      statNumberSense(stats, "a2-number"),
      drillSpotFake(drills, "a2-fake", "One of these is not true. Find it."),
      pack ? packMap(pack, "a2-map") : null,
      pack ? packNumber(pack, "a2-packnumber") : null
    ],
    4
  );
  const wave3 = fresh(
    () => [
      ...fromStudied(studied, checkTamper, "a3-tamper"),
      ...trainerPool.map((scenario, index) => trainerCall(scenario, `a3-call-${index}`)),
      drillSpotFake(drills, "a3-fake", "One of these is false. Which one?"),
      pack ? packSpeedRound(pack, "a3-speed") : null
    ],
    3
  );
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
  rankForScore
};
