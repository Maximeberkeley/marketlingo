/**
 * Lesson Kit design tokens — the single reskin point.
 * Change values here and the whole lesson UI follows.
 * Neutrals are appearance-adaptive (light / dark).
 */
import { dyn } from '../../lib/theme';

export const tokens = {
  color: {
    bg: dyn('#FFFFFF', '#0F1116'),
    surface: dyn('#F8F9FB', '#181B22'),
    card: dyn('#FFFFFF', '#181B22'),
    border: dyn('#E8EAF0', '#2A2F3A'),
    borderStrong: dyn('#D5D9E3', '#39404E'),

    text: dyn('#1A1F36', '#F4F6FA'),
    textSecondary: dyn('#6B7280', '#AAB2C0'),
    textMuted: dyn('#9CA3AF', '#7E8797'),
    textOnAccent: '#FFFFFF',

    accent: '#8B5CF6',
    accentDark: '#7C3AED',
    accentSoft: dyn('rgba(139, 92, 246, 0.10)', 'rgba(139, 92, 246, 0.20)'),

    signalData: '#0EA5E9',
    signalUp: '#16A34A',
    signalDown: '#E11D48',
    signalEnergy: '#F59E0B',

    correct: '#22C55E',
    correctDark: '#16A34A',
    correctSoft: dyn('rgba(34, 197, 94, 0.12)', 'rgba(34, 197, 94, 0.22)'),

    incorrect: '#EF4444',
    incorrectDark: '#DC2626',
    incorrectSoft: dyn('rgba(239, 68, 68, 0.12)', 'rgba(239, 68, 68, 0.22)'),

    disabled: dyn('#E5E7EB', '#2A2F3A'),
    disabledText: dyn('#9CA3AF', '#7E8797'),

    track: dyn('#EDEFF4', '#232833'),
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
