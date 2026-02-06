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

export const COLORS = {
  bg0: '#0B1020',
  bg1: '#0F172A',
  bg2: '#111C33',
  accent: '#8B5CF6',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  streak: '#F97316',
  success: '#22C55E',
  border: '#1E293B',
};
