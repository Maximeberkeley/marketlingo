/**
 * Arena games built straight from what a hand-written lesson already says:
 * its key terms, its rule and takeaway, and its own checks. Nothing here edits
 * a sentence to make a fake; every false card is a line the lesson itself
 * marked false, or a real definition paired with the wrong term.
 */
import type { KeyTerm, MatchPairsExercise, MultipleChoiceExercise, QuickFireExercise, SortSignalExercise, SpotFakeExercise } from '../types';
import { isRealTerm, withoutExpansion } from '../sequencer/lessonChecks';
import { norm } from '../sequencer/extract';

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A term short enough to tap and a definition short enough to read in a card. */
export function playableTerm(term: KeyTerm): boolean {
  const definition = clean(term.definition || '');
  return isRealTerm(term.term) && definition.length >= 15 && definition.length <= 110;
}

/** Terms with distinct names and distinct definitions. */
export function distinctTerms(terms: KeyTerm[]): KeyTerm[] {
  const seenTerms = new Set<string>();
  const seenDefs = new Set<string>();
  return terms.filter(term => {
    if (!playableTerm(term)) return false;
    const t = norm(term.term);
    const d = norm(term.definition);
    if (!t || seenTerms.has(t) || seenDefs.has(d)) return false;
    seenTerms.add(t);
    seenDefs.add(d);
    return true;
  });
}

/** Match the pairs: three or four terms with the definitions the lessons gave them. */
export function matchPairsFrom(terms: KeyTerm[], id: string): MatchPairsExercise | null {
  const usable = distinctTerms(terms).slice(0, 4);
  if (usable.length < 3) return null;
  return {
    kind: 'matchPairs',
    id,
    prompt: 'Match each term to what it means.',
    pairs: usable.map(term => ({ left: clean(term.term), right: withoutExpansion(term.term, term.definition) })),
  };
}

/**
 * Quick fire: true-or-false cards. True cards are the lesson's own lines; false
 * cards are the line its spot-the-fake marked false, or a definition shown
 * under the wrong term. Needs at least one false card and three cards in all.
 */
export function quickFireFrom(input: { spotFakes?: SpotFakeExercise[]; terms?: KeyTerm[]; decoyTerms?: KeyTerm[]; truths?: string[] }, id: string): QuickFireExercise | null {
  const cards: QuickFireExercise['cards'] = [];
  for (const fake of input.spotFakes ?? []) {
    fake.statements.forEach((statement, index) => {
      const text = clean(statement);
      if (text.length > 150) return;
      cards.push(index === fake.fakeIndex
        ? { text, isTrue: false, ...(fake.explanation ? { why: clean(fake.explanation) } : {}) }
        : { text, isTrue: true });
    });
  }
  const terms = distinctTerms(input.terms ?? []);
  const decoys = distinctTerms([...(input.decoyTerms ?? []), ...terms]);
  terms.forEach((term, index) => {
    // Alternate true and false so a run never leans on one answer.
    const makeFalse = index % 2 === 1;
    const other = makeFalse ? decoys.find(d => norm(d.term) !== norm(term.term) && norm(d.definition) !== norm(term.definition)) : undefined;
    if (makeFalse && other) {
      cards.push({ text: `${clean(term.term)}: ${clean(other.definition)}`, isTrue: false, why: `That describes ${clean(other.term)}. ${clean(term.term)}: ${clean(term.definition)}` });
    } else {
      cards.push({ text: `${clean(term.term)}: ${clean(term.definition)}`, isTrue: true });
    }
  });
  // The lesson's own rule or takeaway can top up a short deck as a true card.
  for (const line of input.truths ?? []) {
    const text = clean(line || '');
    if (cards.length >= 4 || !text || text.length > 150 || cards.some(card => norm(card.text) === norm(text))) continue;
    cards.push({ text, isTrue: true });
  }
  const chosen = cards.slice(0, 5);
  if (chosen.length < 3 || !chosen.some(card => !card.isTrue) || !chosen.some(card => card.isTrue)) return null;
  return {
    kind: 'quickFire',
    id,
    prompt: 'True or false? Go with your gut.',
    cards: shuffle(chosen),
  };
}

/**
 * Fill the gap in the lesson's rule or takeaway: one of its key terms is
 * blanked, and the decoys are other real terms that do not appear in the line.
 */
export function fillBlankFrom(line: string | undefined, terms: KeyTerm[], decoyTerms: KeyTerm[], id: string, label = 'rule'): MultipleChoiceExercise | null {
  const sentence = clean(line || '');
  if (sentence.length < 30 || sentence.length > 240) return null;
  for (const term of distinctTerms(terms)) {
    const name = clean(term.term);
    const pattern = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const hit = pattern.exec(sentence);
    if (!hit) continue;
    // Decoys from the same lesson come first: they are the same kind of thing as the answer.
    const fits = (d: KeyTerm) => norm(d.term) !== norm(name) && !pattern.test(d.term) &&
      !new RegExp(`\\b${clean(d.term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(sentence);
    const sameLesson = shuffle(distinctTerms(terms).filter(fits));
    const decoys = [...sameLesson, ...shuffle(distinctTerms(decoyTerms).filter(fits))]
      .filter((d, index, list) => list.findIndex(o => norm(o.term) === norm(d.term)) === index).slice(0, 2);
    if (decoys.length < 2) continue;
    const answer = hit[0];
    const options = shuffle([answer, ...decoys.map(d => clean(d.term))]);
    // The line goes in the context card, shown whole, so a long rule never loses its gap.
    return {
      kind: 'multipleChoice',
      id,
      prompt: `Fill the gap in the lesson's ${label}.`,
      context: `${sentence.slice(0, hit.index)}_____${sentence.slice(hit.index + answer.length)}`,
      options,
      correctIndex: options.indexOf(answer),
      explanation: `${name}: ${clean(term.definition)}`,
    };
  }
  return null;
}

/** Odd one out, from a sort the lesson wrote: two items share a bucket, one does not. */
export function oddOneOutFrom(sort: SortSignalExercise, id: string): MultipleChoiceExercise | null {
  for (const bucket of shuffle(sort.buckets.map((_, index) => index))) {
    const members = sort.items.filter(item => item.bucket === bucket);
    const outsiders = sort.items.filter(item => item.bucket !== bucket);
    if (members.length < 2 || outsiders.length < 1) continue;
    const odd = shuffle(outsiders)[0];
    const pair = shuffle(members).slice(0, 2);
    const options = shuffle([...pair.map(item => clean(item.text)), clean(odd.text)]);
    if (new Set(options.map(norm)).size !== options.length || options.some(option => option.length > 72)) continue;
    return {
      kind: 'multipleChoice',
      id,
      prompt: `Two of these go under "${clean(sort.buckets[bucket])}". Which one doesn't?`,
      options,
      correctIndex: options.indexOf(clean(odd.text)),
      explanation: `${clean(odd.text)} goes under "${clean(sort.buckets[odd.bucket])}".`,
    };
  }
  return null;
}
