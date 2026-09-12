/** Data model for a lesson and its exercises. */

export interface Source {
  label: string;
  url: string;
}

export interface KeyTerm {
  term: string;
  definition: string;
}

/** Full-bleed opening beat: one arresting fact, one tap. */
export interface ColdOpenExercise {
  kind: 'coldOpen';
  id: string;
  eyebrow?: string;
  headline: string;
  kicker?: string;
}

/** Max two lines of text, huge type, one idea. */
export interface MicroInsightExercise {
  kind: 'microInsight';
  id: string;
  eyebrow?: string;
  text: string;
  highlight?: string;
  keyTerm?: KeyTerm;
  sources?: Source[];
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

/** Drag each item into the bucket it belongs to. */
export interface SortSignalExercise {
  kind: 'sortSignal';
  id: string;
  prompt: string;
  buckets: string[];
  items: { text: string; bucket: number; why?: string }[];
  explanation?: string;
}

/** Tap the steps in the right order to build the chain. */
export interface BuildChainExercise {
  kind: 'buildChain';
  id: string;
  prompt: string;
  /** Steps in the correct order. */
  steps: string[];
  explanation?: string;
}

/** Two players, one question, swipe or tap to pick. */
export interface FaceOffExercise {
  kind: 'faceOff';
  id: string;
  prompt: string;
  left: { name: string; note?: string };
  right: { name: string; note?: string };
  /** 0 = left, 1 = right */
  correctIndex: number;
  explanation?: string;
}

/** Timed rapid-fire round of tiny questions. */
export interface SpeedRoundExercise {
  kind: 'speedRound';
  id: string;
  prompt: string;
  seconds?: number;
  rounds: { question: string; options: string[]; correctIndex: number }[];
}

/** Drag the slider to guess a magnitude. */
export interface NumberSenseExercise {
  kind: 'numberSense';
  id: string;
  prompt: string;
  min: number;
  max: number;
  value: number;
  unit?: string;
  /** How close counts as right, as a share of the range. Default 0.12 */
  tolerance?: number;
  explanation?: string;
}

/** Three statements, one is false. Tap the lie. */
export interface SpotFakeExercise {
  kind: 'spotFake';
  id: string;
  prompt: string;
  statements: string[];
  /** Index of the false statement. */
  fakeIndex: number;
  explanation?: string;
}

/** Tap the right node on a stylised market map. */
export interface MapMarketExercise {
  kind: 'mapMarket';
  id: string;
  prompt: string;
  nodes: { label: string; sub?: string }[];
  correctIndex: number;
  explanation?: string;
}

/** Pick which shape the line takes next. */
export interface ChartReadExercise {
  kind: 'chartRead';
  id: string;
  prompt: string;
  /** Values 0..1 for the shown history. */
  history: number[];
  /** Three candidate continuations, values 0..1. */
  options: number[][];
  correctIndex: number;
  explanation?: string;
}

/** Boss beat: make the call, set confidence, watch it play out. */
export interface TheCallExercise {
  kind: 'theCall';
  id: string;
  situation: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  /** Three short beats revealed one by one after the choice. */
  consequences?: string[];
  explanation?: string;
}

export type Exercise =
  | ColdOpenExercise
  | MicroInsightExercise
  | InfoExercise
  | MultipleChoiceExercise
  | WordBankExercise
  | SortSignalExercise
  | BuildChainExercise
  | FaceOffExercise
  | SpeedRoundExercise
  | NumberSenseExercise
  | SpotFakeExercise
  | MapMarketExercise
  | ChartReadExercise
  | TheCallExercise;

export interface Lesson {
  id: string;
  title: string;
  subtitle?: string;
  exercises: Exercise[];
  /** Optional hearts/lives mode. Omit to hide lives entirely. */
  lives?: number;
}
