import { shortLabel, shortText } from "./text";
import { splitSentences } from "../lib/textUtils";
function readingCardKind(exercise) {
  const label = ["eyebrow", "title", "detailTitle"].map((key) => {
    const value = exercise[key];
    return typeof value === "string" ? value : "";
  }).join(" ");
  if (/takeaway/i.test(exercise.id) || /\b(lock it in|takeaway|the rule|what to remember)\b/i.test(label)) return "takeaway";
  if (/\b(evidence|proof|quote|case study|in the real world)\b/i.test(label)) return "evidence";
  return "idea";
}
function normalizedCopy(text = "") {
  return text.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
function cardCopy(exercise) {
  switch (exercise.kind) {
    case "coldOpen":
      return [shortText(exercise.headline, 4, 260), shortText(exercise.kicker, 1, 80)];
    case "microInsight":
      return [shortText(exercise.text, 2, 150), shortText(exercise.body, 1e4, 1e6), shortText(exercise.highlight, 1, 100)];
    case "info":
      return [
        shortText(exercise.title, 1, 80),
        shortText(exercise.body, 2, 150),
        ...(exercise.bullets || []).slice(0, 2).map((b) => shortText(b, 1, 90))
      ];
    default:
      return [];
  }
}
function colonList(text) {
  const first = splitSentences(text)[0] || "";
  const at = first.indexOf(":");
  if (at < 1 || first.slice(at + 1).includes(":")) return null;
  if (/["“”‘’]/.test(first.replace(/([\p{L}\p{N}])['’](?=[\p{L}\p{N}])/gu, "$1")) || /'/.test(first.replace(/([\p{L}\p{N}])'(?=[\p{L}\p{N}])/gu, "$1"))) return null;
  const headline = first.slice(0, at).trim();
  const tail = first.slice(at + 1).trim();
  if (/https?$/i.test(headline)) return null;
  const items = tail.replace(/[.!?]$/, "").split(/[,;]\s+|\s+and\s+(?=[^,;]+$)/i).map((item) => item.replace(/^and\s+/i, "").trim()).filter(Boolean);
  return items.length >= 3 ? { headline, items, body: text.trimStart().slice(first.length).trim() } : null;
}
function cardTerms(exercise) {
  if (!("keyTerms" in exercise) && !("keyTerm" in exercise)) return [];
  const terms = ("keyTerms" in exercise ? exercise.keyTerms : void 0) || ("keyTerm" in exercise && exercise.keyTerm ? [exercise.keyTerm] : []);
  const copy = ` ${normalizedCopy(cardCopy(exercise).join(" "))} `;
  return terms.filter((t) => {
    const term = normalizedCopy(t.term);
    return Boolean(term) && copy.includes(` ${term} `);
  });
}
function hasExtraBriefing(exercise) {
  if (!("fullText" in exercise)) return false;
  const full = normalizedCopy(shortText(exercise.fullText, 1e4, 1e6));
  if (!full) return false;
  const visible = [...cardCopy(exercise)];
  if ("title" in exercise) visible.push(shortLabel(exercise.title));
  if ("eyebrow" in exercise) visible.push(shortLabel(exercise.eyebrow));
  const copy = normalizedCopy(visible.join(" "));
  if (copy.includes(full)) return false;
  let remainder = ` ${full} `;
  visible.map(normalizedCopy).filter(Boolean).sort((a, b) => b.length - a.length).forEach((block) => {
    remainder = remainder.split(` ${block} `).join(" ");
  });
  return Boolean(remainder.trim());
}
function briefingMinutes(text = "") {
  const words = shortText(text, 1e4, 1e6).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
function briefingNote(text = "") {
  return `Optional \xB7 about ${briefingMinutes(text)} min`;
}
export {
  briefingMinutes,
  briefingNote,
  cardCopy,
  cardTerms,
  colonList,
  hasExtraBriefing,
  normalizedCopy,
  readingCardKind
};
