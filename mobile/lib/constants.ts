// Industries are now sourced from mobile/lib/markets.ts
// This constant is kept for backward compat but markets.ts is the source of truth
export { markets as INDUSTRIES } from './markets';

export const FAMILIARITY_LEVELS = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'New to this industry. Start with the basics.',
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Some knowledge. Skip the basics, go deeper.',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Industry veteran. Expert-level content only.',
  },
] as const;

const LIGHT_COLORS = {
  // Backgrounds
  bg0: '#FFFFFF',   // Primary background
  bg1: '#F8F9FB',   // Elevated surfaces
  bg2: '#FFFFFF',   // Cards

  // Text
  textPrimary: '#1A1F36',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Accent / Brand (brand purple reads well on both themes)
  accent: '#8B5CF6',
  accentDark: '#7C3AED',
  accentSoft: 'rgba(139, 92, 246, 0.08)',
  accentMedium: 'rgba(139, 92, 246, 0.15)',

  // Status / Semantic
  success: '#22C55E',
  successSoft: 'rgba(34, 197, 94, 0.08)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.08)',
  error: '#EF4444',
  errorSoft: 'rgba(239, 68, 68, 0.08)',
  info: '#3B82F6',
  infoSoft: 'rgba(59, 130, 246, 0.08)',

  // Borders & Surfaces
  streak: '#F97316',
  border: '#E8EAF0',
  borderLight: '#F3F4F6',
  cardShadow: 'rgba(0,0,0,0.06)',

  // Misc
  orange: '#FB923C',
  orangeSoft: 'rgba(251, 146, 60, 0.08)',
  gold: '#FBBF24',
  goldSoft: 'rgba(251, 191, 36, 0.08)',

  // Surface tints
  surfaceSubtle: 'rgba(0, 0, 0, 0.02)',
  surfaceLight: 'rgba(0, 0, 0, 0.04)',
};

// Premium dark: warm-neutral greys in layered shades, never pure black.
const DARK_COLORS: typeof LIGHT_COLORS = {
  bg0: '#15171B',   // App background — deep grey
  bg1: '#1D2126',   // Elevated surfaces
  bg2: '#23272E',   // Cards (one shade lighter than surfaces)

  textPrimary: '#F2F4F8',
  textSecondary: '#AAB1BC',
  textMuted: '#7C848F',

  accent: '#A78BFA',
  accentDark: '#8B5CF6',
  accentSoft: 'rgba(167, 139, 250, 0.14)',
  accentMedium: 'rgba(167, 139, 250, 0.26)',

  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.16)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.16)',
  error: '#F87171',
  errorSoft: 'rgba(248, 113, 113, 0.16)',
  info: '#60A5FA',
  infoSoft: 'rgba(96, 165, 250, 0.16)',

  streak: '#FB923C',
  border: '#31373F',
  borderLight: '#272C33',
  cardShadow: 'rgba(0,0,0,0.55)',

  orange: '#FDBA74',
  orangeSoft: 'rgba(253, 186, 116, 0.16)',
  gold: '#FCD34D',
  goldSoft: 'rgba(252, 211, 77, 0.16)',

  surfaceSubtle: 'rgba(255, 255, 255, 0.04)',
  surfaceLight: 'rgba(255, 255, 255, 0.08)',
};

export const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;

// Premium shadow presets (Brilliant-style depth)
export const SHADOWS = {
  sm: {
    shadowColor: '#1A1F36',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A1F36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1A1F36',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  accent: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  success: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

// Typography scale (Brilliant-inspired)
export const TYPE = {
  hero: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.6, lineHeight: 34 },
  h1: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.4, lineHeight: 30 },
  h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 26 },
  h3: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.3 },
  overline: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1.2, textTransform: 'uppercase' as const },
} as const;
