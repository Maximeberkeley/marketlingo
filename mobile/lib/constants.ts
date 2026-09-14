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

// Adaptive palette — neutrals follow light/dark appearance automatically.
import { dyn } from './theme';

export const COLORS = {
  // Backgrounds
  bg0: dyn('#FFFFFF', '#0F1116'),   // Primary background
  bg1: dyn('#F8F9FB', '#181B22'),   // Elevated surfaces
  bg2: dyn('#FFFFFF', '#181B22'),   // Cards

  // Text
  textPrimary: dyn('#1A1F36', '#F4F6FA'),
  textSecondary: dyn('#6B7280', '#AAB2C0'),
  textMuted: dyn('#9CA3AF', '#7E8797'),

  // Accent / Brand (brand purple reads well on both themes)
  accent: '#8B5CF6',
  accentDark: '#7C3AED',
  accentSoft: dyn('rgba(139, 92, 246, 0.08)', 'rgba(139, 92, 246, 0.16)'),
  accentMedium: dyn('rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.28)'),

  // Status / Semantic
  success: '#22C55E',
  successSoft: dyn('rgba(34, 197, 94, 0.08)', 'rgba(34, 197, 94, 0.18)'),
  warning: '#F59E0B',
  warningSoft: dyn('rgba(245, 158, 11, 0.08)', 'rgba(245, 158, 11, 0.18)'),
  error: '#EF4444',
  errorSoft: dyn('rgba(239, 68, 68, 0.08)', 'rgba(239, 68, 68, 0.18)'),
  info: '#3B82F6',
  infoSoft: dyn('rgba(59, 130, 246, 0.08)', 'rgba(59, 130, 246, 0.18)'),

  // Borders & Surfaces
  streak: '#F97316',
  border: dyn('#E8EAF0', '#2A2F3A'),
  borderLight: dyn('#F3F4F6', '#222732'),
  cardShadow: dyn('rgba(0,0,0,0.06)', 'rgba(0,0,0,0.5)'),

  // Misc
  orange: '#FB923C',
  orangeSoft: dyn('rgba(251, 146, 60, 0.08)', 'rgba(251, 146, 60, 0.18)'),
  gold: '#FBBF24',
  goldSoft: dyn('rgba(251, 191, 36, 0.08)', 'rgba(251, 191, 36, 0.18)'),

  // Surface tints
  surfaceSubtle: dyn('rgba(0, 0, 0, 0.02)', 'rgba(255, 255, 255, 0.04)'),
  surfaceLight: dyn('rgba(0, 0, 0, 0.04)', 'rgba(255, 255, 255, 0.08)'),
};

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
