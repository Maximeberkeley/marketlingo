/** Data model for a lesson and its exercises. */

export interface Source {
  label: string;
  url: string;
}

export interface KeyTerm {
  term: string;
  definition: string;
}

/** A teaching card — no answer required, just "Continue". */
export interface InfoExercise {
  kind: 'info';
  id: string;
  /** Small uppercase label above the title. */
  eyebrow?: string;
  title?: string;
  body: string;
  bullets?: string[];
  keyTerms?: KeyTerm[];
  sources?: Source[];
}

/** Classic single-answer multiple choice. */
export interface MultipleChoiceExercise {
  kind: 'multipleChoice';
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

/** Assemble a sentence from shuffled word tiles. */
export interface WordBankExercise {
  kind: 'wordBank';
  id: string;
  prompt: string;
  /** The correct sentence, in order. */
  answer: string[];
  /** Extra decoy tiles mixed into the bank. */
  distractors?: string[];
  explanation?: string;
}

export type Exercise = InfoExercise | MultipleChoiceExercise | WordBankExercise;

export interface Lesson {
  id: string;
  title: string;
  subtitle?: string;
  exercises: Exercise[];
  /** Optional hearts/lives mode. Omit to hide lives entirely. */
  lives?: number;
}
