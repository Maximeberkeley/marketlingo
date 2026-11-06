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
  ["expand", "contract"],
  ["expands", "contracts"],
  ["expanding", "contracting"],
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
function checkDefinition(terms, id) {
  const usable2 = terms.filter((t) => isRealTerm(t.term) && (t.definition || "").trim().length > 14);
  const unique = usable2.filter(
    (t, i) => usable2.findIndex((o) => norm(o.term) === norm(t.term)) === i
  );
  if (unique.length < 3) return null;
  const target = shuffle(unique)[0];
  const decoys = shuffle(unique.filter((t) => norm(t.term) !== norm(target.term))).slice(0, 2);
  const options = shuffle([target.term, ...decoys.map((d) => d.term)]);
  return {
    kind: "multipleChoice",
    id,
    prompt: `This lesson defined it as: "${clean(target.definition)}". Which term is that?`,
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
      explanation: cite(sentence)
    };
  }
  return null;
}
const STEP_MIN = 3;
const STEP_MAX_LEN = 110;
const ORDINAL_START = /^(first(ly)?|to start|to begin|then|next|after that|afterwards|second(ly)?|third(ly)?|finally|lastly|last)\b[,:]?\s*/i;
const OPENS_SEQUENCE = /^(first(ly)?|to start|to begin)\b/i;
const CLOSES_SEQUENCE = /^(finally|lastly|last)\b/i;
const asStep = (raw) => {
  const s = clean(raw).replace(/[.;,]+$/, "").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
};
const usable = (steps) => steps.length >= STEP_MIN && steps.every((s) => s.length >= 3 && s.length <= STEP_MAX_LEN) && new Set(steps.map(norm)).size === steps.length;
function explicitSteps(body) {
  const text = (body || "").trim();
  if (!text) return null;
  const flat = text.replace(/\s+/g, " ");
  const itemRe = /(?:^|\s)(\d{1,2})[.)]\s+(.+?)(?=\s\d{1,2}[.)]\s|$)/g;
  const numbered = [];
  for (let m = itemRe.exec(flat); m; m = itemRe.exec(flat)) numbered.push({ n: Number(m[1]), body: m[2] });
  if (numbered.length >= STEP_MIN && numbered.every((m, i) => m.n === i + 1)) {
    const steps = numbered.map((m) => asStep(m.body));
    if (usable(steps)) return steps.slice(0, 4);
  }
  const arrowLine = text.split("\n").flatMap((line) => sentences(line, 1, 2e3)).find((line) => (line.match(/→|->/g) || []).length >= STEP_MIN - 1);
  if (arrowLine) {
    const steps = arrowLine.split(/\s*(?:→|->)\s*/).map(asStep);
    if (usable(steps)) return steps.slice(0, 4);
  }
  const lines = sentences(text, 12, 200);
  const start = lines.findIndex((l) => OPENS_SEQUENCE.test(l));
  if (start >= 0) {
    const run = [];
    for (let i = start; i < lines.length && ORDINAL_START.test(lines[i]); i++) {
      run.push(lines[i]);
      if (CLOSES_SEQUENCE.test(lines[i])) break;
    }
    if (run.length >= STEP_MIN && CLOSES_SEQUENCE.test(run[run.length - 1])) {
      const steps = run.map((l) => asStep(l.replace(ORDINAL_START, "")));
      if (usable(steps)) return steps.slice(0, 4);
    }
  }
  return null;
}
function checkMechanism(slides, id) {
  for (const slide of slides) {
    const steps = explicitSteps(slide.body || "");
    if (!steps) continue;
    return {
      kind: "buildChain",
      id,
      prompt: `Put these steps in order: ${clean(slide.title || "today\u2019s process")}`,
      steps,
      explanation: `In order: ${steps.map((s, i) => `${i + 1}. ${s}`).join("  ")}`
    };
  }
  return null;
}
const isYear = (value) => Number.isInteger(value) && value >= 1900 && value <= 2099;
function falsify(sentence) {
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
  for (const [a, b] of OPPOSITES) {
    for (const [from, to] of [[a, b], [b, a]]) {
      const re = new RegExp(`\\b${from.replace(/ /g, "\\s+")}\\b`, "i");
      if (re.test(sentence)) return sentence.replace(re, to);
    }
  }
  return null;
}
function checkClaim(slides, id) {
  const pool = shuffle(slides.flatMap((s) => sentences(s.body || "", 40, 170)));
  for (const truth of pool) {
    const others = pool.filter((s) => norm(s) !== norm(truth));
    const lies = others.map(falsify).filter((s) => Boolean(s) && norm(s) !== norm(truth)).slice(0, 2);
    if (lies.length < 2) continue;
    const options = shuffle([clean(truth), ...lies.map(clean)]);
    if (new Set(options.map(norm)).size !== options.length) continue;
    return {
      kind: "multipleChoice",
      id,
      prompt: "Only one of these matches what this lesson actually said. Which?",
      options,
      correctIndex: options.indexOf(clean(truth)),
      explanation: cite(truth)
    };
  }
  return null;
}
function checkTamper(slides, id) {
  const pool = shuffle(slides.flatMap((s) => sentences(s.body || "", 45, 160)));
  if (pool.length < 3) return null;
  for (const candidate of pool) {
    const fake = falsify(candidate);
    if (!fake || norm(fake) === norm(candidate)) continue;
    const truths = pool.filter((s) => norm(s) !== norm(candidate)).slice(0, 2).map(clean);
    if (truths.length < 2) continue;
    const statements = shuffle([clean(fake), ...truths]);
    return {
      kind: "spotFake",
      id,
      prompt: "One of these has been altered. Which one contradicts the lesson?",
      statements,
      fakeIndex: statements.indexOf(clean(fake)),
      explanation: cite(candidate)
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
  checkClaim,
  checkDefinition,
  checkFigure,
  checkMechanism,
  checkTamper,
  explicitSteps,
  isRealTerm,
  lessonCheckFactories,
  termsFromSlides
};
