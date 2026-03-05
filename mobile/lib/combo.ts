/**
 * Momentum Combo System — BETTER than Duolingo's Hearts
 * 
 * Instead of punishing mistakes (lives/hearts), we REWARD consecutive
 * correct answers with XP multipliers. Wrong answers reset the combo
 * but never lock you out.
 * 
 * Combo:  1→2→3→4→5 correct = 1x→1.5x→2x→2.5x→3x XP
 * Visual: Combo counter with fire animation at 3+
 */

export interface ComboState {
  streak: number;
  multiplier: number;
  totalBonusXP: number;
  isOnFire: boolean; // 3+ combo
  highestCombo: number;
}

const COMBO_MULTIPLIERS: Record<number, number> = {
  0: 1,
  1: 1,
  2: 1.5,
  3: 2,
  4: 2.5,
  5: 3,
};

export function getMultiplier(combo: number): number {
  if (combo >= 5) return 3;
  return COMBO_MULTIPLIERS[combo] || 1;
}

export function createComboState(): ComboState {
  return {
    streak: 0,
    multiplier: 1,
    totalBonusXP: 0,
    isOnFire: false,
    highestCombo: 0,
  };
}

export function comboCorrect(state: ComboState, baseXP: number): { newState: ComboState; xpEarned: number } {
  const newStreak = state.streak + 1;
  const multiplier = getMultiplier(newStreak);
  const xpEarned = Math.round(baseXP * multiplier);
  const bonusXP = xpEarned - baseXP;

  return {
    newState: {
      streak: newStreak,
      multiplier,
      totalBonusXP: state.totalBonusXP + bonusXP,
      isOnFire: newStreak >= 3,
      highestCombo: Math.max(state.highestCombo, newStreak),
    },
    xpEarned,
  };
}

export function comboWrong(state: ComboState, baseXP: number): { newState: ComboState; xpEarned: number } {
  return {
    newState: {
      ...state,
      streak: 0,
      multiplier: 1,
      isOnFire: false,
    },
    xpEarned: baseXP, // No penalty — full base XP always
  };
}

export function getComboMessage(combo: number): string | null {
  if (combo === 3) return 'On Fire! 2x XP';
  if (combo === 5) return 'UNSTOPPABLE! 3x XP';
  if (combo === 10) return 'LEGENDARY! 3x XP';
  if (combo > 5 && combo % 5 === 0) return `${combo} combo! 3x XP`;
  return null;
}
