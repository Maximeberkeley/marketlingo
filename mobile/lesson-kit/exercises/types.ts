/** Common contract every exercise component honours. */
export interface ExerciseState {
  /** True when the learner has provided enough input to press "Check". */
  canCheck: boolean;
  /** True when the current input is the correct answer. */
  isCorrect: boolean;
  /** The option the learner picked, for single-pick questions (drives "why that's wrong"). */
  selectedIndex?: number;
}

export interface ExerciseProps<T> {
  exercise: T;
  /** 'answering' = editable, 'feedback' = locked and showing the result. */
  phase: 'answering' | 'feedback';
  onChange: (state: ExerciseState) => void;
}
