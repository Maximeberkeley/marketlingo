import { norm, sentences, shuffle } from "./extract";
const UP = ["grow", "growing", "growth", "rise", "rising", "increase", "increasing", "surge", "expand", "expanding"];
const DOWN = ["fall", "falling", "decline", "declining", "drop", "dropping", "shrink", "shrinking", "slow", "slowing"];
const OPPOSITES = [
  ["grow", "shrink"],
  ["grows", "shrinks"],
  ["growing", "shrinking"],
  ["growth", "decline"],
  ["rise", "fall"],
  ["rises", "falls"],
  ["rising", "falling"],
  ["increase", "decrease"],
  ["increases", "decreases"],
  ["increasing", "decreasing"],
  ["surge", "collapse"],
  ["surges", "collapses"],
  // No expand/contract: "contract" is far more often the legal noun, and
  // "unless the expand assigns those costs" is not English.
  ["accelerate", "slow"],
  ["accelerating", "slowing"],
  ["cheaper", "more expensive"],
  ["higher", "lower"],
  ["more", "less"],
  ["most", "least"],
  ["largest", "smallest"],
  ["fastest", "slowest"],
  ["always", "never"]
];
const clean = (s) => s.replace(/\s+/g, " ").trim();
const cite = (sentence) => `Straight from what you just read: ${clean(sentence)}`;
const NOT_TERMS = /^(unanimous|for your|the (rule|takeaway|catch|bottom line|lesson|point|short version)|why it|what it|here'?s|in short|bottom line|key (idea|point)|note|example|takeaway|remember|tip|warning|result|so what)\b/i;
function isRealTerm(raw) {
  const term = (raw || "").trim();
  if (!term || /["'“”‘’«»]/.test(term)) return false;
  const words = term.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 4) return false;
  if (NOT_TERMS.test(term)) return false;
  if (/[.!?]$/.test(term)) return false;
  return true;
}
const SMALL_WORDS = /* @__PURE__ */ new Set(["and", "of", "the", "for", "to", "in", "on", "&"]);
function withoutExpansion(term, definition) {
  const name = (term || "").replace(/\s+/g, " ").trim();
  const text = (definition || "").replace(/\s+/g, " ").trim();
  if (!/^[A-Z][A-Z0-9&]{1,6}s?$/.test(name)) return text;
  const match = /^([^.:;]+)[.:;]\s+(.+)$/.exec(text);
  if (!match) return text;
  const initials = match[1].split(/[\s,\-/]+/).filter((word) => word && !SMALL_WORDS.has(word.toLowerCase())).map((word) => word[0].toUpperCase()).join("");
  const letters = name.replace(/s$/, "").replace(/[^A-Z0-9]/g, "");
  const rest = match[2].trim();
  if (initials !== letters || rest.length < 15) return text;
  return rest[0].toUpperCase() + rest.slice(1);
}
function checkDefinition(terms, id) {
  const usable = terms.filter((t) => isRealTerm(t.term) && (t.definition || "").trim().length > 14);
  const unique = usable.filter(
    (t, i) => usable.findIndex((o) => norm(o.term) === norm(t.term)) === i
  );
  if (unique.length < 3) return null;
  const target = shuffle(unique)[0];
  const decoys = shuffle(unique.filter((t) => norm(t.term) !== norm(target.term))).slice(0, 2);
  const options = shuffle([target.term, ...decoys.map((d) => d.term)]);
  return {
    kind: "multipleChoice",
    id,
    // The definition goes in the context card, shown whole; a long one never cuts off the question.
    prompt: "Which term did the lesson define this way?",
    context: withoutExpansion(target.term, target.definition),
    options,
    correctIndex: options.indexOf(target.term),
    explanation: `${target.term}: ${clean(target.definition)}`
  };
}
function formatLike(sample, value) {
  const fraction = sample.split(/[.,]/)[1] || "";
  const decimals = Math.min(3, fraction.length);
  const shown = value.toFixed(decimals);
  return sample.includes(",") && decimals ? shown.replace(".", ",") : shown;
}
const FIGURE = /(?:(\$|US\$|€)\s?(\d{1,4}(?:[.,]\d{1,3})?)\s?(thousand|million|billion|trillion)?|(\d{1,4}(?:[.,]\d{1,3})?)\s?(%|percent|thousand|million|billion|trillion))/i;
function checkFigure(slides, id) {
  for (const slide of shuffle(slides)) {
    const body = clean(slide.body || "");
    const match = body.match(FIGURE);
    if (!match) continue;
    const numberText = match[2] || match[4];
    if (!numberText) continue;
    const at = match.index ?? 0;
    if (/[A-Za-z-]$/.test(body.slice(Math.max(0, at - 1), at))) continue;
    const raw = parseFloat(numberText.replace(",", "."));
    if (!isFinite(raw) || raw <= 0) continue;
    const sentence = sentences(body, 25, 300).find((s) => s.includes(match[0].trim()));
    if (!sentence) continue;
    const unit = (match[3] || match[5] || "").trim();
    const prefix = (match[1] || "").trim();
    const isPct = /^(%|percent)$/i.test(unit);
    const label = (n) => {
      const shown = `${prefix}${formatLike(numberText, n)}`;
      return isPct ? `${shown}${unit === "%" ? "%" : " percent"}` : `${shown}${unit ? ` ${unit}` : ""}`;
    };
    const candidates = [raw * 0.25, raw * 3, raw * 10].map((n) => isPct ? Math.min(99, n) : n);
    const decoys = candidates.map((n) => n >= 10 ? Math.round(n) : Math.round(n * 10) / 10).filter((n) => n > 0 && Math.abs(n - raw) > raw * 0.2).map(label).filter((v, i, arr) => arr.indexOf(v) === i && v !== label(raw)).slice(0, 3);
    if (decoys.length < 2) continue;
    const options = shuffle([label(raw), ...decoys]);
    return {
      kind: "multipleChoice",
      id,
      prompt: `Fill the gap: ${sentence.replace(match[0].trim(), "_____")}`,
      options,
      correctIndex: options.indexOf(label(raw)),
      explanation: cite(sentence),
      whyWrong: options.map((option) => option === label(raw) ? null : `The lesson\u2019s number is ${label(raw)}, not ${option}.`)
    };
  }
  return null;
}
function sequenceSteps(body) {
  const numbered = [...body.matchAll(/^\s*(\d+)\.\s+(.+)$/gm)];
  if (numbered.length >= 2 && numbered.every((line, i) => Number(line[1]) === i + 1)) {
    const steps2 = numbered.map((line) => clean(line[2]));
    return steps2.length <= 4 && new Set(steps2.map(norm)).size === steps2.length ? steps2 : null;
  }
  for (const line of body.split("\n")) {
    if (!line.includes("\u2192")) continue;
    const steps2 = line.split("\u2192").map(clean);
    if (steps2.length >= 2 && steps2.length <= 4 && steps2.every(Boolean) && new Set(steps2.map(norm)).size === steps2.length) return steps2;
  }
  const markers = [...body.matchAll(/(?:^|[.!?;]\s*|\n\s*|,\s*|\s+and\s+)(first|then|finally)(?:[,:]\s*|\s+)/gi)];
  if (markers.length < 2 || markers.length > 4 || markers[0][1].toLowerCase() !== "first" || !["then", "finally"].includes(markers[markers.length - 1][1].toLowerCase()) || !markers.some((marker) => marker[1].toLowerCase() === "then") || !markers.slice(1, -1).every((marker) => marker[1].toLowerCase() === "then")) return null;
  const steps = markers.map((marker, i) => clean(body.slice(
    (marker.index ?? 0) + marker[0].length,
    markers[i + 1] ? (markers[i + 1].index ?? 0) + markers[i + 1][0].toLowerCase().indexOf(markers[i + 1][1].toLowerCase()) : body.length
  )).replace(/[,;]\s*$/, ""));
  return steps.every(Boolean) && new Set(steps.map(norm)).size === steps.length ? steps : null;
}
function checkMechanism(slides, id) {
  const best = slides.map((slide) => ({ slide, steps: sequenceSteps(slide.body || "") })).find((entry) => entry.steps !== null);
  if (!best) return null;
  const steps = best.steps;
  if (!steps) return null;
  return {
    kind: "buildChain",
    id,
    prompt: `Put these steps in order: ${clean(best.slide.title || "today\u2019s concept")}`,
    steps,
    explanation: steps.map((step, i) => `${i + 1}. ${step}`).join("\n")
  };
}
const isYear = (value) => Number.isInteger(value) && value >= 1900 && value <= 2099;
const MONTH = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const LABEL_BEFORE = /\b(?:tier|phase|stage|level|day|gen|generation|class|round|no\.?|number|part|article|section|title|chapter|step|type|grade|series|model|version|block|unit|flight|mission|week|cat|category|rule|annex|act|rev|revision|option|team|lot|line|gate|zone|pillar)\s*$/i;
function isFixedNumber(sentence, at, token) {
  const before = sentence.slice(0, at);
  const after = sentence.slice(at + token.length);
  if (LABEL_BEFORE.test(before)) return true;
  if (new RegExp(`\\b${MONTH}\\s*$`, "i").test(before) || new RegExp(`^\\s*${MONTH}\\b`, "i").test(after)) return true;
  if (/^\s*(?:to|-|–|or|and)\s*\$?\d/i.test(after) || /\d\s*(?:to|-|–)\s*\$?$/i.test(before)) return true;
  if (/^(?:st|nd|rd|th)\b/i.test(after) || /^[:/]\d/.test(after) || /\d[:/]$/.test(before)) return true;
  return false;
}
const NOT_A_CLAIM_OPENER = /^(?:it|its|this|that|these|those|they|their|them|he|she|his|her|we|our|you|your|here|there|so|but|and|or|then|now|today|tomorrow|yesterday|imagine|consider|picture|suppose|say|think|ask|offer|try|pick|use|start|remember|note|compare|let|if|when|once|after|before)\b/i;
const CLAIM_SIGNAL = /\d|\b(?:because|so that|which means|means|leads? to|drives?|causes?|when|as|since|while|whereas|than)\b/i;
function isStandaloneClaim(sentence) {
  const text = clean(sentence);
  if (!text || /\?$/.test(text) || NOT_A_CLAIM_OPENER.test(text)) return false;
  const named = text.split(" ").slice(1).some((word) => /^[A-Z][a-z]/.test(word) || /^[A-Z]{2,}/.test(word));
  return named || CLAIM_SIGNAL.test(text);
}
function phraseAt(text, at, length) {
  const after = text.slice(at + length).match(/^\S*(?:\s+\S+){0,2}/)?.[0] ?? "";
  return (text.slice(at, at + length) + after).replace(/[.,;:!?)"'”’]+$/, "").trim();
}
function alter(sentence) {
  for (const match of sentence.matchAll(/\d{1,4}(?:[.,]\d{1,2})?/g)) {
    const token = match[0];
    const at = match.index ?? 0;
    if (/[A-Za-z-]$/.test(sentence.slice(Math.max(0, at - 1), at))) continue;
    const raw = parseFloat(token.replace(",", "."));
    if (!isFinite(raw) || raw <= 0 || isYear(raw) || isFixedNumber(sentence, at, token)) continue;
    const next = raw > 10 ? Math.max(1, Math.round(raw * 0.2)) : Math.round(raw * 7);
    if (next === raw || isYear(next)) continue;
    const text = sentence.slice(0, at) + String(next) + sentence.slice(at + token.length);
    return { text, said: phraseAt(sentence, at, token.length), changed: phraseAt(text, at, String(next).length) };
  }
  for (const [a, b] of OPPOSITES) {
    for (const [from, to] of [[a, b], [b, a]]) {
      const re = new RegExp(`\\b${from.replace(/ /g, "\\s+")}\\b`, "i");
      const found = re.exec(sentence);
      if (!found) continue;
      const at = found.index;
      const text = sentence.slice(0, at) + to + sentence.slice(at + found[0].length);
      return { text, said: phraseAt(sentence, at, found[0].length), changed: phraseAt(text, at, to.length) };
    }
  }
  return null;
}
function falsify(sentence) {
  return alter(sentence)?.text ?? null;
}
const saysNot = (change) => `The lesson says \u201C${change.said}\u201D, not \u201C${change.changed}\u201D.`;
function checkClaim(slides, id) {
  const pool = shuffle(slides.flatMap((s) => sentences(s.body || "", 40, 170)).filter(isStandaloneClaim));
  for (const truth of pool) {
    const others = pool.filter((s) => norm(s) !== norm(truth));
    const lies = others.map(alter).filter((change) => Boolean(change) && norm(change.text) !== norm(truth)).slice(0, 2);
    if (lies.length < 2) continue;
    const options = shuffle([clean(truth), ...lies.map((change) => clean(change.text))]);
    if (new Set(options.map(norm)).size !== options.length) continue;
    return {
      kind: "multipleChoice",
      id,
      prompt: "Only one of these matches what this lesson actually said. Which?",
      options,
      correctIndex: options.indexOf(clean(truth)),
      explanation: cite(truth),
      whyWrong: options.map((option) => {
        const change = lies.find((l) => clean(l.text) === option);
        return change ? saysNot(change) : null;
      })
    };
  }
  return null;
}
function checkTamper(slides, id) {
  const pool = shuffle(slides.flatMap((s) => sentences(s.body || "", 45, 160)).filter(isStandaloneClaim));
  if (pool.length < 3) return null;
  for (const candidate of pool) {
    const change = alter(candidate);
    if (!change || norm(change.text) === norm(candidate)) continue;
    const fake = clean(change.text);
    const truths = pool.filter((s) => norm(s) !== norm(candidate)).slice(0, 2).map(clean);
    if (truths.length < 2) continue;
    const statements = shuffle([fake, ...truths]);
    return {
      kind: "spotFake",
      id,
      prompt: "One of these has been altered. Which one contradicts the lesson?",
      statements,
      fakeIndex: statements.indexOf(fake),
      explanation: cite(candidate),
      whyWrong: statements.map((statement) => statement === fake ? null : `That line matches the lesson. The altered one says \u201C${change.changed}\u201D, where the lesson says \u201C${change.said}\u201D.`)
    };
  }
  return null;
}
const NOT_A_TERM = /* @__PURE__ */ new Set([
  "that",
  "this",
  "those",
  "these",
  "there",
  "here",
  "it",
  "they",
  "we",
  "you",
  "one",
  "two",
  "three",
  "first",
  "second",
  "third",
  "when",
  "under",
  "every",
  "same",
  "so",
  "and",
  "but",
  "note",
  "compare",
  "example",
  "result",
  "say",
  "pick",
  "find",
  "remember",
  "today",
  "tomorrow",
  "now",
  "then"
]);
function termsFromSlides(slides) {
  const found = [];
  for (const slide of slides) {
    for (const sentence of sentences(slide.body || "", 20, 320)) {
      const hit = sentence.match(/^([A-Z][A-Za-z0-9'’\-/ ]{2,42})\s*(?::|—|–)\s*(.{18,})$/);
      if (!hit) continue;
      const term = clean(hit[1]);
      const definition = clean(hit[2]);
      const words = term.split(" ");
      if (words.length > 4) continue;
      if (words.some((w) => NOT_A_TERM.has(norm(w)))) continue;
      if (norm(term).length < 4) continue;
      if (found.some((f) => norm(f.term) === norm(term))) continue;
      found.push({ term, definition });
    }
  }
  return found;
}
function lessonCheckFactories(slides, terms, nextId) {
  const lessonTerms = termsFromSlides(slides);
  const body = norm(slides.map((s) => s.body || "").join(" "));
  const mentioned = terms.filter((t) => t.term && body.includes(norm(t.term)));
  const termPool = lessonTerms.length >= 3 ? lessonTerms : [...lessonTerms, ...mentioned];
  return [
    () => checkFigure(slides, nextId()),
    () => checkDefinition(termPool, nextId()),
    () => checkMechanism(slides, nextId()),
    () => checkClaim(slides, nextId()),
    () => checkTamper(slides, nextId())
  ];
}
export {
  alter,
  checkClaim,
  checkDefinition,
  checkFigure,
  checkMechanism,
  checkTamper,
  isRealTerm,
  isStandaloneClaim,
  lessonCheckFactories,
  termsFromSlides,
  withoutExpansion
};
