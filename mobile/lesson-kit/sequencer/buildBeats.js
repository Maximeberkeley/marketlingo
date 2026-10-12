import { getIndustryPack } from "../industry/packs";
import { makeColdOpen, makeMicroInsight, norm, sentences, shuffle } from "./extract";
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
function checkApplyIt(takeaway, id) {
  const rule = splitSentences(clean(takeaway))[0];
  if (!rule) return null;
  let prompt = `Apply it: your team must choose between two plans. One follows this rule and the more popular one ignores it: \u201C${rule}\u201D What should you recommend?`;
  let correct = "Choose the plan that follows the rule, and explain why it fits.";
  let decoys = ["Choose the popular plan without checking the rule.", "Treat both plans as equal despite their different fit with the rule."];
  if (/\bbuyer\b/i.test(rule) && /\buser\b/i.test(rule) && /\b(signs?|pays?|budget|contract)\b/i.test(rule)) {
    prompt = "Apply it: the person using a product likes it, but someone else must approve the purchase. Who should you ask about the buying decision?";
    correct = "Ask the buyer who approves the purchase.";
    decoys = ["Ask only the user and assume approval will follow.", "Treat the user and buyer as the same person."];
  } else if (/fixed.price/i.test(rule) && /\b(contractor|supplier)\b/i.test(rule) && /\b(overrun|risk|extra cost)\b/i.test(rule)) {
    prompt = "Apply it: a supplier accepts a fixed-price contract and the work costs more than planned. What should the supplier prepare for?";
    correct = "The supplier may have to absorb the extra cost.";
    decoys = ["The agreed price automatically rises with every extra cost.", "The extra cost disappears because the price is fixed."];
  }
  const options = shuffle([correct, ...decoys]);
  return {
    kind: "multipleChoice",
    id,
    prompt,
    options,
    correctIndex: options.indexOf(correct),
    explanation: `The plan should follow the rule you just read: ${rule}`
  };
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
const isYear = (n) => Number.isInteger(n) && n >= 1900 && n <= 2099;
function alterNumber(sentence) {
  for (const match of sentence.matchAll(/\d{1,4}(?:[.,]\d{1,2})?/g)) {
    const token = match[0];
    const at = match.index ?? 0;
    if (/[A-Za-z-]$/.test(sentence.slice(Math.max(0, at - 1), at))) continue;
    const raw = parseFloat(token.replace(",", "."));
    if (!isFinite(raw) || raw <= 0 || isYear(raw)) continue;
    const next = raw > 10 ? Math.max(1, Math.round(raw * 0.2)) : Math.round(raw * 7);
    if (next === raw || isYear(next)) continue;
    return sentence.slice(0, at) + String(next) + sentence.slice(at + token.length);
  }
  return null;
}
function checkShown(seen, used, id) {
  for (const truth of shuffle(seen)) {
    if (used.has(norm(truth))) continue;
    const lies = [truth, ...seen.filter((s) => norm(s) !== norm(truth))].map(alterNumber).filter((s) => typeof s === "string" && norm(s) !== norm(truth)).filter((s) => !used.has(`lie:${norm(s)}`));
    const uniqueLies = lies.filter((s, i) => lies.findIndex((o) => norm(o) === norm(s)) === i).slice(0, 2);
    if (uniqueLies.length < 2) continue;
    const options = shuffle([truth, ...uniqueLies]);
    if (new Set(options.map(norm)).size !== options.length) continue;
    used.add(norm(truth));
    uniqueLies.forEach((l) => used.add(`lie:${norm(l)}`));
    return {
      kind: "multipleChoice",
      id,
      prompt: "Which of these matches what you just read?",
      options,
      correctIndex: options.indexOf(truth),
      explanation: `Straight from what you just read: ${truth}`
    };
  }
  return null;
}
function buildBeats(stackTitle, rawSlides, metadata, industry) {
  const goal = industry?.learningGoal;
  const slides = rawSlides.map((s) => ({ ...s, title: filterForGoal(s.title || "", goal), body: filterForGoal(s.body, goal) })).filter((s) => s.body.trim().length > 0);
  const pack = getIndustryPack(industry?.marketId);
  const exercises = [];
  const slideNumbers = [];
  const seen = [];
  const usedTruths = /* @__PURE__ */ new Set();
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
  let checkCount = 0;
  slides.forEach((slide, slideIdx) => {
    push(makeMicroInsight(slide, `beat-insight-${slide.slideNumber}`, slide.title), slide.slideNumber);
    const isLast = slideIdx === slides.length - 1;
    if (!isLast && slideIdx % 2 === 1) {
      const added = push(checkShown(seen, usedTruths, `beat-check-${checkCount + 1}`), slide.slideNumber);
      if (added) checkCount += 1;
    }
  });
  if (push(checkShown(seen, usedTruths, "beat-check-final"), lastSlide)) checkCount += 1;
  const takeaway = filterForGoal((metadata?.key_takeaway || "").trim(), goal) || (checkCount === 0 ? seen[seen.length - 1] || splitSentences(slides[slides.length - 1]?.body || "")[0] || "" : "");
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
  if (checkCount === 0 && takeaway) {
    if (!exercises.some((ex) => ex.id === "beat-takeaway")) {
      push({ kind: "microInsight", id: "beat-takeaway", eyebrow: "The rule", text: takeaway }, lastSlide);
    }
    push(checkApplyIt(cardCopy(exercises.find((ex) => ex.id === "beat-takeaway") || exercises[exercises.length - 1]).filter(Boolean).join(" "), "beat-apply-it"), lastSlide);
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
  checkApplyIt,
  filterForGoal,
  lessonForGoal,
  mergeThinReadingCards,
  sentences
};
