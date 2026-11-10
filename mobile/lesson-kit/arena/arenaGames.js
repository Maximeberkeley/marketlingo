import { isRealTerm } from "../sequencer/lessonChecks";
import { norm } from "../sequencer/extract";
const clean = (s) => s.replace(/\s+/g, " ").trim();
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function playableTerm(term) {
  const definition = clean(term.definition || "");
  return isRealTerm(term.term) && definition.length >= 15 && definition.length <= 110;
}
function distinctTerms(terms) {
  const seenTerms = /* @__PURE__ */ new Set();
  const seenDefs = /* @__PURE__ */ new Set();
  return terms.filter((term) => {
    if (!playableTerm(term)) return false;
    const t = norm(term.term);
    const d = norm(term.definition);
    if (!t || seenTerms.has(t) || seenDefs.has(d)) return false;
    seenTerms.add(t);
    seenDefs.add(d);
    return true;
  });
}
function matchPairsFrom(terms, id) {
  const usable = distinctTerms(terms).slice(0, 4);
  if (usable.length < 3) return null;
  return {
    kind: "matchPairs",
    id,
    prompt: "Match each term to what it means.",
    pairs: usable.map((term) => ({ left: clean(term.term), right: clean(term.definition) }))
  };
}
function quickFireFrom(input, id) {
  const cards = [];
  for (const fake of input.spotFakes ?? []) {
    fake.statements.forEach((statement, index) => {
      const text = clean(statement);
      if (text.length > 150) return;
      cards.push(index === fake.fakeIndex ? { text, isTrue: false, ...fake.explanation ? { why: clean(fake.explanation) } : {} } : { text, isTrue: true });
    });
  }
  const terms = distinctTerms(input.terms ?? []);
  const decoys = distinctTerms([...input.decoyTerms ?? [], ...terms]);
  terms.forEach((term, index) => {
    const makeFalse = index % 2 === 1;
    const other = makeFalse ? decoys.find((d) => norm(d.term) !== norm(term.term) && norm(d.definition) !== norm(term.definition)) : void 0;
    if (makeFalse && other) {
      cards.push({ text: `${clean(term.term)}: ${clean(other.definition)}`, isTrue: false, why: `That describes ${clean(other.term)}. ${clean(term.term)}: ${clean(term.definition)}` });
    } else {
      cards.push({ text: `${clean(term.term)}: ${clean(term.definition)}`, isTrue: true });
    }
  });
  for (const line of input.truths ?? []) {
    const text = clean(line || "");
    if (cards.length >= 4 || !text || text.length > 150 || cards.some((card) => norm(card.text) === norm(text))) continue;
    cards.push({ text, isTrue: true });
  }
  const chosen = cards.slice(0, 5);
  if (chosen.length < 3 || !chosen.some((card) => !card.isTrue) || !chosen.some((card) => card.isTrue)) return null;
  return {
    kind: "quickFire",
    id,
    prompt: "True or false? Go with your gut.",
    cards: shuffle(chosen)
  };
}
function fillBlankFrom(line, terms, decoyTerms, id, label = "rule") {
  const sentence = clean(line || "");
  if (sentence.length < 30 || sentence.length > 180) return null;
  for (const term of distinctTerms(terms)) {
    const name = clean(term.term);
    const pattern = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    const hit = pattern.exec(sentence);
    if (!hit) continue;
    const decoys = shuffle(distinctTerms(decoyTerms).filter((d) => norm(d.term) !== norm(name) && !pattern.test(d.term) && !new RegExp(`\\b${clean(d.term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(sentence))).slice(0, 2);
    if (decoys.length < 2) continue;
    const answer = hit[0];
    const options = shuffle([answer, ...decoys.map((d) => clean(d.term))]);
    return {
      kind: "multipleChoice",
      id,
      prompt: `Complete the ${label}: ${sentence.slice(0, hit.index)}_____${sentence.slice(hit.index + answer.length)}`,
      options,
      correctIndex: options.indexOf(answer),
      explanation: `${name}: ${clean(term.definition)}`
    };
  }
  return null;
}
function oddOneOutFrom(sort, id) {
  for (const bucket of shuffle(sort.buckets.map((_, index) => index))) {
    const members = sort.items.filter((item) => item.bucket === bucket);
    const outsiders = sort.items.filter((item) => item.bucket !== bucket);
    if (members.length < 2 || outsiders.length < 1) continue;
    const odd = shuffle(outsiders)[0];
    const pair = shuffle(members).slice(0, 2);
    const options = shuffle([...pair.map((item) => clean(item.text)), clean(odd.text)]);
    if (new Set(options.map(norm)).size !== options.length || options.some((option) => option.length > 72)) continue;
    return {
      kind: "multipleChoice",
      id,
      prompt: `Two of these go under "${clean(sort.buckets[bucket])}". Which one doesn't?`,
      options,
      correctIndex: options.indexOf(clean(odd.text)),
      explanation: `${clean(odd.text)} goes under "${clean(sort.buckets[odd.bucket])}".`
    };
  }
  return null;
}
export {
  distinctTerms,
  fillBlankFrom,
  matchPairsFrom,
  oddOneOutFrom,
  playableTerm,
  quickFireFrom
};
