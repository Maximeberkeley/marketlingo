import { standaloneQuantities } from "../lesson-kit/sequencer/extract";
const BLANK = "___";
const NOT_NAMES = /* @__PURE__ */ new Set([
  "a",
  "an",
  "the",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "they",
  "we",
  "you",
  "your",
  "our",
  "their",
  "in",
  "on",
  "at",
  "for",
  "from",
  "with",
  "and",
  "but",
  "or",
  "if",
  "when",
  "each",
  "every",
  "most",
  "some",
  "day",
  "layer",
  "layers",
  "tier",
  "tiers",
  "region",
  "step",
  "first",
  "then",
  "finally",
  "today",
  "why",
  "what",
  "how",
  "who",
  "one",
  "two",
  "three",
  "call",
  "say",
  "pick",
  "oem",
  "oems",
  "mro",
  "ceo",
  "cfo",
  "ai",
  "us",
  "u.s",
  "eu",
  "uk",
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "engines",
  "maintenance",
  "source",
  "sources",
  "note",
  "example",
  "rule",
  "takeaway"
]);
const isName = (word) => /^[A-Z][A-Za-z0-9&'’.-]*[A-Za-z0-9]$/.test(word) && !NOT_NAMES.has(word.toLowerCase());
function lessonCompany(slides) {
  const counts = /* @__PURE__ */ new Map();
  let order = 0;
  for (const slide of slides) {
    const sentences = (slide.body || "").replace(/\s+/g, " ").split(/(?<=[.!?:])\s+/);
    for (const sentence of sentences) {
      const words2 = sentence.split(" ").map((w) => w.replace(/^[("“‘']+|[)"”’',;:.!?]+$/g, ""));
      for (let i = 1; i < words2.length; i++) {
        if (!isName(words2[i])) continue;
        const name = i + 1 < words2.length && isName(words2[i + 1]) ? `${words2[i]} ${words2[i + 1]}` : words2[i];
        if (name.includes(" ")) i += 1;
        const seen = counts.get(name);
        counts.set(name, { n: (seen?.n ?? 0) + 1, order: seen?.order ?? order++ });
      }
    }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1].n - a[1].n || a[1].order - b[1].order);
  return ranked[0]?.[0];
}
function lessonNumber(slides) {
  for (const slide of slides) {
    const found = standaloneQuantities(`${slide.body || ""}`).find((n) => !/^(19|20)\d\d$/.test(n));
    if (found) {
      const at = slide.body.indexOf(found);
      const tail = slide.body.slice(at + found.length).match(/^\s?(%|percent\b|billion\b|million\b|trillion\b)/i)?.[0] ?? "";
      return `${found}${tail}`.trim();
    }
  }
  return void 0;
}
function sayItContext(slides, industry) {
  return { company: lessonCompany(slides), number: lessonNumber(slides), industry: industry?.trim() || void 0 };
}
function sayItPrompt(sectionKey, context) {
  const company = context.company;
  const industry = context.industry || "this industry";
  const number = context.number;
  switch (sectionKey) {
    case "how_money_moves":
    case "money":
      return { question: `Who pays whom in ${industry}, and for what?`, starter: `In ${industry}, ${BLANK} pays ${BLANK} for ${BLANK}.` };
    case "players":
    case "watchlist":
      return company ? { question: `Why does ${company} matter?`, starter: `${company} matters because ${BLANK}.` } : { question: "Which company from today holds power, and why?", starter: `${BLANK} holds power because ${BLANK}.` };
    case "numbers":
      return number ? { question: `What does ${number} tell you?`, starter: `${number} matters because it shows ${BLANK}.` } : { question: "Which number from today would you quote?", starter: `${BLANK} matters because it shows ${BLANK}.` };
    case "risk":
    case "rules":
      return { question: "What rule or risk decides who wins here?", starter: `The rule that decides who wins is ${BLANK}, because ${BLANK}.` };
    case "my_view":
    case "thesis":
      return { question: "What do most people miss about this?", starter: `Most people think ${BLANK}, but ${BLANK}.` };
    case "questions":
      return company ? { question: `What would you ask someone at ${company}?`, starter: `I'd ask them: how do you ${BLANK} when ${BLANK}?` } : { question: "What would you ask someone who works there?", starter: `I'd ask them: how do you ${BLANK} when ${BLANK}?` };
    case "basics":
      return { question: `What does ${industry} actually do, in plain words?`, starter: `${industry} is about ${BLANK}.` };
    case "chain":
      return { question: "How does value get from start to finish?", starter: `It starts with ${BLANK}, then ${BLANK}, and ends with ${BLANK}.` };
    case "frontier":
    case "why_now":
      return { question: "What is changing here right now?", starter: `What's changing is ${BLANK}, which means ${BLANK}.` };
    case "drivers":
      return { question: "What mechanism would make you right?", starter: `This works because ${BLANK} leads to ${BLANK}.` };
    case "gap":
      return { question: "What is broken or missing here?", starter: `What's missing is ${BLANK}.` };
    case "who_hurts":
      return { question: "Who loses money or time because of it?", starter: `${BLANK} loses ${BLANK} because ${BLANK}.` };
    case "incumbents":
      return { question: "Why haven\u2019t the big players fixed it?", starter: `The big players haven't fixed it because ${BLANK}.` };
    case "first_test":
      return { question: "What is the cheapest way to test it?", starter: `I'd test it by ${BLANK}.` };
    case "review":
      return { question: "What must be true, and by when?", starter: `By ${BLANK}, ${BLANK} must be true.` };
    default:
      return { question: "What is the one thing from today you would say out loud?", starter: `The key idea is ${BLANK}.` };
  }
}
const words = (text) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
function ownWordCount(text, starter) {
  if (text.includes(BLANK)) return 0;
  const left = /* @__PURE__ */ new Map();
  for (const w of words(starter.split(BLANK).join(" "))) left.set(w, (left.get(w) ?? 0) + 1);
  let own = 0;
  for (const w of words(text)) {
    const n = left.get(w) ?? 0;
    if (n > 0) left.set(w, n - 1);
    else own += 1;
  }
  return own;
}
function firstBlank(text) {
  const at = text.indexOf(BLANK);
  return at < 0 ? null : { start: at, end: at + BLANK.length };
}
export {
  BLANK,
  firstBlank,
  lessonCompany,
  lessonNumber,
  ownWordCount,
  sayItContext,
  sayItPrompt
};
