import { getIndustryPack } from "../industry/packs";
import { makeColdOpen, makeMicroInsight, sentences } from "./extract";
import { splitSentences } from "../../lib/textUtils";
import { cardCopy, readingCardKind } from "../cardPresentation";
const clean = (s) => s.replace(/\s+/g, " ").trim();
const STARTUP_PREFIX = /^\s*for your startup\s*[:,\u2014\u2013-]?\s*/i;
const stripStartup = (s) => {
  const rest = s.replace(STARTUP_PREFIX, "");
  return rest === s ? s : rest.charAt(0).toUpperCase() + rest.slice(1);
};
function filterForGoal(text, learningGoal) {
  if (learningGoal === "build_startup") return text;
  return (text || "").split(/\n/).map(
    (line) => splitSentences(line).map(stripStartup).map((s) => s.replace(/\b(?:your\s+)?startup superpower\b/gi, "key advantage").replace(/\bbuild your\b(?=[^.!?]*\bfrom day one\b)/gi, "Develop the").replace(/\bfrom day one\b/gi, "from the start").replace(/\bstartups don['’]t\b/gi, "New companies do not")).filter((s) => s.trim()).join(" ")
  ).filter((line, i, all) => line.trim() || i > 0 && all[i - 1].trim()).join("\n").trim();
}
function lessonForGoal(lesson, goal) {
  const copyFields = /* @__PURE__ */ new Set([
    "title",
    "subtitle",
    "headline",
    "kicker",
    "eyebrow",
    "text",
    "body",
    "highlight",
    "fullText",
    "detailTitle",
    "prompt",
    "situation",
    "explanation",
    "takeaway",
    "line",
    "term",
    "definition",
    "name",
    "note",
    "why"
  ]);
  const copyArrays = /* @__PURE__ */ new Set(["options", "bullets", "consequences", "steps", "answer", "distractors", "statements"]);
  const sanitize = (value, field = "") => {
    if (typeof value === "string") return copyFields.has(field) || copyArrays.has(field) ? filterForGoal(value, goal) : value;
    if (Array.isArray(value)) return value.map((item) => sanitize(item, field));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitize(item, key)]));
    return value;
  };
  return sanitize(lesson);
}
function visibleLines(ex) {
  const e = ex;
  const out = [];
  if (ex.kind === "coldOpen") {
    if (e.headline && e.headline.length <= 260) out.push(e.headline);
  } else if (ex.kind === "microInsight") {
    if (e.text && e.text.length <= 150) out.push(e.text);
    if (e.highlight && e.highlight.length <= 100) out.push(e.highlight);
    if (ex.body) out.push(...cardCopy(ex).slice(1, 2));
  }
  return out.flatMap((t) => splitSentences(clean(t))).map(clean).filter((s) => s.length >= 30);
}
function mergeThinReadingCards(exercises, slideNumbers) {
  const merged = [];
  const numbers = [];
  for (let index = 0; index < exercises.length; index += 1) {
    const first = exercises[index];
    const next = exercises[index + 1];
    const words = cardCopy(first).join(" ").trim().split(/\s+/).filter(Boolean).length;
    if (first.kind === "microInsight" && next?.kind === "microInsight" && words < 25 && readingCardKind(first) !== "takeaway" && readingCardKind(next) !== "takeaway") {
      const firstCopy = cardCopy(first);
      const nextCopy = cardCopy(next);
      merged.push({
        ...first,
        text: firstCopy[0],
        mergedCards: [{ ...first, sourceSlideNumber: slideNumbers[index] }, { ...next, sourceSlideNumber: slideNumbers[index + 1] }],
        sourceSlideNumber: slideNumbers[index],
        body: [...firstCopy.slice(1), ...nextCopy].filter(Boolean).join("\n\n"),
        highlight: void 0,
        fullText: [first.fullText, next.fullText].filter(Boolean).join("\n\n"),
        keyTerms: [...first.keyTerms || (first.keyTerm ? [first.keyTerm] : []), ...next.keyTerms || (next.keyTerm ? [next.keyTerm] : [])],
        sources: [...first.sources || [], ...next.sources || []]
      });
      numbers.push(slideNumbers[index]);
      index += 1;
    } else {
      merged.push(first);
      numbers.push(slideNumbers[index]);
    }
  }
  return { lesson: { id: "", title: "", exercises: merged }, slideNumbers: numbers };
}
function buildBeats(stackTitle, rawSlides, metadata, industry) {
  const goal = industry?.learningGoal;
  const slides = rawSlides.map((s) => ({ ...s, title: filterForGoal(s.title || "", goal), body: filterForGoal(s.body, goal) })).filter((s) => s.body.trim().length > 0);
  const pack = getIndustryPack(industry?.marketId);
  const exercises = [];
  const slideNumbers = [];
  const seen = [];
  const push = (ex, slideNumber, leo) => {
    if (!ex) return false;
    exercises.push(leo ? { ...ex, leo } : ex);
    slideNumbers.push(slideNumber);
    if (ex.kind === "coldOpen" || ex.kind === "microInsight") seen.push(...visibleLines(ex));
    return true;
  };
  const firstSlide = slides[0]?.slideNumber ?? 1;
  const lastSlide = slides[slides.length - 1]?.slideNumber ?? firstSlide;
  push(makeColdOpen(slides, "beat-open", pack ? pack.eyebrow : void 0), firstSlide);
  slides.forEach((slide) => {
    push(makeMicroInsight(slide, `beat-insight-${slide.slideNumber}`, slide.title), slide.slideNumber);
  });
  const takeaway = filterForGoal((metadata?.key_takeaway || "").trim(), goal) || seen[seen.length - 1] || splitSentences(slides[slides.length - 1]?.body || "")[0] || "";
  if (takeaway.length >= 12) {
    push(
      {
        kind: "microInsight",
        id: "beat-takeaway",
        eyebrow: "Lock it in",
        text: takeaway,
        highlight: metadata?.next_preview?.trim() ? `Tomorrow: ${filterForGoal(metadata.next_preview.trim(), goal)}` : void 0,
        fullText: [metadata?.recap_bridge, takeaway, metadata?.next_preview].map((value) => filterForGoal(value || "", goal)).filter((value) => Boolean(value.trim())).join("\n\n"),
        detailTitle: "What to remember"
      },
      lastSlide
    );
  }
  const merged = mergeThinReadingCards(exercises, slideNumbers);
  return {
    lesson: {
      id: stackTitle,
      title: stackTitle,
      exercises: merged.lesson.exercises
    },
    slideNumbers: merged.slideNumbers
  };
}
export {
  buildBeats,
  filterForGoal,
  lessonForGoal,
  mergeThinReadingCards,
  sentences
};
