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
  bg0: '#FFFFFF',           // Primary background — clean white
  bg1: '#F3F4F6',           // Elevated surfaces
  bg2: '#FFFFFF',           // Cards
  accent: '#8B5CF6',        // Brand purple
  textPrimary: '#1A1F36',   // Near-black for headings
  textSecondary: '#6B7280', // Gray-600
  textMuted: '#9CA3AF',     // Gray-400
  streak: '#F97316',
  success: '#22C55E',
  border: '#E5E7EB',        // Gray-200
  cardShadow: 'rgba(0,0,0,0.04)',
};
