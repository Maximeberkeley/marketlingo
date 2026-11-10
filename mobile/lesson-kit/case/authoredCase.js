const GOALS = ["career", "invest", "build_startup", "curiosity"];
const text = (v) => typeof v === "string" && v.trim().length > 0;
const EVIDENCE_KINDS = /* @__PURE__ */ new Set(["sortSignal", "spotFake", "buildChain", "multipleChoice", "faceOff"]);
const CALL_KINDS = /* @__PURE__ */ new Set(["theCall", "multipleChoice"]);
function playable(e, kinds) {
  if (!e || typeof e !== "object") return false;
  const x = e;
  return typeof x.kind === "string" && kinds.has(x.kind) && (text(x.prompt) || text(x.situation));
}
function callForGoal(content, goal) {
  const pick = (g) => g && GOALS.includes(g) ? content.calls?.[g] : void 0;
  const call = pick(goal === "join_industry" ? "career" : goal) ?? pick("curiosity") ?? GOALS.map((g) => content.calls?.[g]).find(Boolean);
  return call && playable(call.call, CALL_KINDS) ? call : null;
}
function caseFromAuthored(row, goal, marketName, total) {
  const content = row.content;
  if (!content || typeof content !== "object" || !text(content.id) || !content.brief || !text(content.brief.headline)) return null;
  if (!playable(content.evidence, EVIDENCE_KINDS)) return null;
  const chosen = callForGoal(content, goal);
  if (!chosen) return null;
  const source = { type: "lesson", day: row.day, title: content.lessonTitle || content.title };
  const stages = [
    {
      key: "brief",
      label: "Brief",
      hint: "",
      exercise: {
        kind: "coldOpen",
        id: `${content.id}-brief`,
        eyebrow: `${marketName.toUpperCase()} \xB7 CASE ${row.slot} OF ${total}`,
        headline: content.brief.headline,
        kicker: content.brief.kicker || `Built on your day ${row.day} lesson.`,
        fullText: content.brief.fullText,
        detailTitle: content.title,
        sources: content.brief.sources,
        source,
        leo: { line: "Read the first sentence carefully.", mood: "thinking" }
      }
    },
    {
      key: "evidence",
      label: "Evidence",
      hint: "",
      exercise: { ...content.evidence, id: `${content.id}-evidence`, source, leo: { line: "Check the facts first.", mood: "idle" } }
    }
  ];
  if (playable(content.numbers, /* @__PURE__ */ new Set(["numberSense"]))) {
    stages.push({
      key: "numbers",
      label: "Numbers",
      hint: "",
      exercise: { ...content.numbers, id: `${content.id}-numbers`, source, leo: { line: "Get roughly the right size.", mood: "idle" } }
    });
  }
  stages.push({
    key: "call",
    label: "Your choice",
    hint: "",
    exercise: { ...chosen.call, id: `${content.id}-call`, source, leo: { line: "Pick the answer you could explain.", mood: "thinking" } }
  });
  return {
    id: `authored-${content.id}`,
    title: content.title,
    situation: content.brief.headline,
    stages,
    proReasoning: chosen.proReasoning ?? null,
    commonMistake: chosen.commonMistake ?? null,
    mentalModel: chosen.mentalModel ?? null
  };
}
function caseDay(studiedDays, requested) {
  const days = studiedDays.filter((d) => typeof d === "number" && d > 0).sort((a, b) => b - a);
  if (!days.length) return null;
  if (requested && requested > 0) return days.find((d) => d <= requested) ?? days[days.length - 1];
  return days[0];
}
export {
  callForGoal,
  caseDay,
  caseFromAuthored
};
