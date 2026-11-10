function truncateAtSentence(text, maxLength) {
  if (!text) return text;
  const clean = text.trim();
  if (clean.length <= maxLength) return clean;
  const parts = splitSentences(clean);
  if (!parts.length) return clean;
  let out = "";
  for (const part of parts) {
    const next = out ? `${out} ${part.trim()}` : part.trim();
    if (next.length > maxLength) break;
    out = next;
  }
  return (out || parts[0].trim()).trim();
}
function dropIncompleteTail(text) {
  const clean = (text || "").trim();
  if (!clean) return clean;
  if (/[.!?)"'\]]$/.test(clean)) return clean;
  const parts = splitSentences(clean);
  if (parts.length < 2) return clean;
  const complete = parts.filter((p) => /[.!?)"'\]]$/.test(p.trim()));
  return (complete.length ? complete.join(" ") : parts.slice(0, -1).join(" ")).trim() || clean;
}
function extractSentences(text, count) {
  if (!text) return "";
  const sentences = splitSentences(text);
  if (sentences.length === 0) return text;
  return sentences.slice(0, count).join(" ").trim();
}
function cleanMarkdown(text) {
  return text.replace(/#{1,4}\s*/g, "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/`(.*?)`/g, "$1").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/^[•\-*]\s*/gm, "").trim();
}
function shuffleOptions(options, correctIndex) {
  const indices = options.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const shuffledOptions = indices.map((i) => options[i]);
  const newCorrectIndex = indices.indexOf(correctIndex);
  return { shuffledOptions, newCorrectIndex };
}
const ABBREVIATIONS = [
  "e.g",
  "i.e",
  "etc",
  "vs",
  "approx",
  "est",
  "inc",
  "ltd",
  "co",
  "corp",
  "dr",
  "mr",
  "mrs",
  "ms",
  "prof",
  "st",
  "no",
  "fig",
  "al",
  "u.s",
  "u.k"
];
function splitSentences(text) {
  if (!text) return [];
  const raw = text.match(/[^.!?]*[.!?]+[)"'\]]*\s*|[^.!?]+$/g);
  if (!raw) return [text];
  const out = [];
  let buffer = "";
  for (let i = 0; i < raw.length; i++) {
    buffer += raw[i];
    const trimmed = buffer.trimEnd();
    const lastWord = (trimmed.match(/([A-Za-z.]+)\.$/)?.[1] || "").toLowerCase();
    const endsWithAbbrev = ABBREVIATIONS.includes(lastWord.replace(/\.$/, ""));
    const endsWithInitial = /(^|[\s(])[A-Za-z]\.$/.test(trimmed);
    const endsWithDecimal = /\d\.$/.test(trimmed);
    const endsWithAcronym = /(^|[\s(])(?:[A-Za-z]\.){2,}$/.test(trimmed);
    const isLast = i === raw.length - 1;
    const insideWord = !isLast && !/\s$/.test(raw[i]) && /^[A-Za-z0-9]/.test(raw[i + 1]);
    if ((endsWithAbbrev || endsWithInitial || endsWithDecimal || endsWithAcronym || insideWord) && !isLast) continue;
    if (trimmed) out.push(buffer.trim());
    buffer = "";
  }
  if (buffer.trim()) out.push(buffer.trim());
  return out.length ? out : [text];
}
export {
  cleanMarkdown,
  dropIncompleteTail,
  extractSentences,
  shuffleOptions,
  splitSentences,
  truncateAtSentence
};
