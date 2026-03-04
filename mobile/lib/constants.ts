export const INDUSTRIES = [
  {
    id: 'aerospace',
    name: 'Aerospace & Defense',
    emoji: '🚀',
    description: 'Commercial aviation, defense systems, and space exploration',
    color: '#3B82F6',
  },
  {
    id: 'tech',
    name: 'Technology',
    emoji: '💻',
    description: 'Software, hardware, AI, and cloud computing',
    color: '#8B5CF6',
    comingSoon: true,
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    emoji: '🏥',
    description: 'Pharmaceuticals, biotech, and medical devices',
    color: '#10B981',
    comingSoon: true,
  },
  {
    id: 'energy',
    name: 'Energy',
    emoji: '⚡',
    description: 'Oil & gas, renewables, and utilities',
    color: '#F59E0B',
    comingSoon: true,
  },
];

export const FAMILIARITY_LEVELS = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'New to this industry. Start with the basics.',
    icon: '🌱',
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Some knowledge. Skip the basics, go deeper.',
    icon: '📚',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Industry veteran. Expert-level content only.',
    icon: '🎓',
  },
] as const;

// Light-first Brilliant-inspired color palette
export const COLORS = {
  // Backgrounds
  bg0: '#FFFFFF',           // Primary background — clean white
  bg1: '#F3F4F6',           // Elevated surfaces (gray-100)
  bg2: '#FFFFFF',           // Cards

  // Text
  textPrimary: '#1A1F36',   // Near-black for headings
  textSecondary: '#6B7280', // Gray-500
  textMuted: '#9CA3AF',     // Gray-400

  // Accent / Brand
  accent: '#8B5CF6',        // Brand purple
  accentSoft: 'rgba(139, 92, 246, 0.1)',
  accentMedium: 'rgba(139, 92, 246, 0.15)',

  // Status / Semantic
  success: '#22C55E',
  successSoft: 'rgba(34, 197, 94, 0.1)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.1)',
  error: '#EF4444',
  errorSoft: 'rgba(239, 68, 68, 0.1)',
  info: '#3B82F6',
  infoSoft: 'rgba(59, 130, 246, 0.1)',

  // Borders & Surfaces
  streak: '#F97316',
  border: '#E5E7EB',        // Gray-200
  borderLight: '#F3F4F6',   // Gray-100
  cardShadow: 'rgba(0,0,0,0.04)',

  // Misc
  orange: '#FB923C',
  orangeSoft: 'rgba(251, 146, 60, 0.1)',
  gold: '#FBBF24',
  goldSoft: 'rgba(251, 191, 36, 0.1)',

  // Surface tints for light mode
  surfaceSubtle: 'rgba(0, 0, 0, 0.02)',
  surfaceLight: 'rgba(0, 0, 0, 0.04)',
};
