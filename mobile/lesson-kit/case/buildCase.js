import { getIndustryPack } from "../industry/packs";
import { checkClaim, checkFigure, checkMechanism } from "../sequencer/lessonChecks";
import { lessonSource } from "../practice/studiedMaterial";
import {
  drillSpotFake,
  packChain,
  packMap,
  packNumber,
  statNumberSense,
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
function caseLead(text, fallback) {
  const first = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/)[0]?.trim();
  if (first && first.length <= 190) return first;
  const clause = first?.slice(0, 190).split(/[,;:]/)[0]?.trim();
  return clause && clause.length >= 55 ? `${clause}.` : fallback;
}
function buildCase(input) {
  const pack = getIndustryPack(input.marketId);
  const scenario = shuffle(input.trainer)[0];
  const studied = [...input.studied ?? []].sort((a, b) => (b.day ?? 0) - (a.day ?? 0));
  const firstLesson = (make) => {
    for (const lesson of studied) {
      const exercise = make(lesson);
      if (exercise) return { ...exercise, source: lessonSource(lesson) };
    }
    return null;
  };
  const lessonCall = firstLesson((lesson) => lesson.questions?.find((q) => q.kind === "multipleChoice") || checkClaim(lesson.slides, "case-call-claim"));
  const trainerExercise = !lessonCall && scenario ? trainerCall(scenario, "case-call") : null;
  const scenarioCall = trainerExercise ? { ...trainerExercise, source: { type: "industry" } } : null;
  const call = lessonCall || scenarioCall;
  if (!call) return null;
  const callSource = lessonCall?.source;
  const lead = callSource?.type === "lesson" ? studied.find((lesson) => lesson.stackId === callSource.stackId) ?? studied[0] : void 0;
  const stages = [];
  const briefHeadline = lead ? caseLead(
    lead.slides?.[0]?.body || lead.title,
    `You are back on ${lead.title}. Time to use it.`
  ) : scenario ? caseLead(scenario.scenario, scenario.question) : `You are back on ${input.marketName} fundamentals. Time to use it.`;
  const briefDetail = lead?.title || scenario?.question || `${input.marketName} case`;
  stages.push({
    key: "brief",
    label: "Brief",
    hint: "",
    exercise: {
      kind: "coldOpen",
      id: "case-brief",
      eyebrow: `${input.marketName.toUpperCase()} CASE`,
      headline: briefHeadline,
      kicker: lead?.day ? `From your day ${lead.day} lesson. A real situation. What would you do?` : "A real situation. What would you do?",
      fullText: lead?.slides?.[1]?.body || lead?.slides?.[0]?.body || scenario?.scenario,
      detailTitle: briefDetail,
      source: lead ? lessonSource(lead) : { type: "industry" },
      leo: { line: "Read the first sentence carefully.", mood: "thinking" }
    }
  });
  const evidence = firstLesson((lesson) => lesson.questions?.find((q) => q.kind === "sortSignal") || checkMechanism(lesson.slides, "case-evidence-lesson")) || drillSpotFake(input.drills, "case-evidence", "One of these claims does not hold. Which one?") || (pack ? packMap(pack, "case-evidence-map") : null) || (pack ? packChain(pack, "case-evidence-chain") : null);
  if (evidence) {
    stages.push({
      key: "evidence",
      label: "Evidence",
      hint: "",
      exercise: { ...evidence, source: evidence.source ?? { type: "industry" }, leo: { line: "Check the facts first.", mood: "idle" } }
    });
  }
  const numbers = firstLesson((lesson) => lesson.questions?.find((q) => q.kind === "numberSense") || checkFigure(lesson.slides, "case-numbers-lesson")) || statNumberSense(input.stats, "case-numbers") || (pack ? packNumber(pack, "case-numbers-pack") : null);
  if (numbers) {
    stages.push({
      key: "numbers",
      label: "Numbers",
      hint: "",
      exercise: { ...numbers, source: numbers.source ?? { type: "industry" }, leo: { line: "Get roughly the right size.", mood: "idle" } }
    });
  }
  stages.push({
    key: "call",
    label: "Your choice",
    hint: "",
    exercise: { ...call, leo: { line: "Pick the answer you could explain.", mood: "thinking" } }
  });
  return {
    id: lead ? `lesson-case-${lead.day ?? 1}-${lead.stackId ?? "x"}` : scenario?.id || "market-case",
    title: briefDetail,
    situation: lead?.slides?.[0]?.body || scenario?.scenario || briefHeadline,
    stages,
    // The debrief belongs to the scenario behind the call, never a different one.
    proReasoning: scenarioCall ? scenario?.feedback_pro_reasoning ?? null : null,
    commonMistake: scenarioCall ? scenario?.feedback_common_mistake ?? null : null,
    mentalModel: scenarioCall ? scenario?.feedback_mental_model ?? null : null
  };
}
function gradeCase(correct, total, callCorrect, confidence) {
  const accuracy = total > 0 ? correct / total : 0;
  const boldRight = callCorrect && confidence === "high";
  const boldWrong = !callCorrect && confidence === "high";
  if (callCorrect && accuracy >= 0.85) {
    return {
      grade: "A",
      note: boldRight ? "Right answer, and you were sure. Well done." : "Right answer. You can trust yourself more next time."
    };
  }
  if (callCorrect) {
    return { grade: "B", note: "Right answer. Check the facts more closely next time." };
  }
  if (accuracy >= 0.6) {
    return {
      grade: "C",
      note: boldWrong ? "Good work on the facts. Wrong final answer, and you were too sure." : "Good work on the facts. Wrong final answer. Re-read the situation."
    };
  }
  return { grade: "D", note: "A few early answers were off. Try this case again." };
}
export {
  buildCase,
  gradeCase
};
