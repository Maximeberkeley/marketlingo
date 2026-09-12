/**
 * Lesson Kit design tokens — the single reskin point.
 * Change values here and the whole lesson UI follows.
 */
export const tokens = {
  color: {
    bg: '#FFFFFF',
    surface: '#F8F9FB',
    card: '#FFFFFF',
    border: '#E8EAF0',
    borderStrong: '#D5D9E3',

    text: '#1A1F36',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textOnAccent: '#FFFFFF',

    accent: '#8B5CF6',
    accentDark: '#7C3AED',
    accentSoft: 'rgba(139, 92, 246, 0.10)',

    signalData: '#0EA5E9',
    signalUp: '#16A34A',
    signalDown: '#E11D48',
    signalEnergy: '#F59E0B',

    correct: '#22C55E',
    correctDark: '#16A34A',
    correctSoft: 'rgba(34, 197, 94, 0.12)',

    incorrect: '#EF4444',
    incorrectDark: '#DC2626',
    incorrectSoft: 'rgba(239, 68, 68, 0.12)',

    disabled: '#E5E7EB',
    disabledText: '#9CA3AF',

    track: '#EDEFF4',
    heart: '#FB7185',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  size: {
    progressBar: 12,
    buttonHeight: 56,
    choiceMinHeight: 62,
    tileHeight: 44,
  },
  font: {
    title: 26,
    prompt: 20,
    body: 16,
    caption: 13,
    button: 17,
  },
} as const;

export type Tokens = typeof tokens;
