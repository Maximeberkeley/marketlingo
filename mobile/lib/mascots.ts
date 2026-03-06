// Mascot & Mentor Data for React Native
// ============================================

export interface Mascot {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isLeo: boolean;
}

export interface MentorData {
  id: string;
  name: string;
  specialty: string;
  emoji: string;
  color: string;
}

// Leo - Main Mascot
export const LEO: Mascot = {
  id: 'leo',
  name: 'Leo',
  emoji: '',
  color: '#F97316',
  isLeo: true,
};

// AI Mentors
export const MENTORS: MentorData[] = [
  {
    id: 'sophia',
    name: 'Sophia',
    specialty: 'Strategy & Analysis',
    emoji: '‍',
    color: '#8B5CF6',
  },
  {
    id: 'kai',
    name: 'Kai',
    specialty: 'Technical Deep-Dives',
    emoji: '‍',
    color: '#3B82F6',
  },
  {
    id: 'maya',
    name: 'Maya',
    specialty: 'Market Trends',
    emoji: '‍',
    color: '#EC4899',
  },
  {
    id: 'alex',
    name: 'Alex',
    specialty: 'Investment Insights',
    emoji: '‍',
    color: '#10B981',
  },
];

// Get random character (weighted towards Leo)
export function getRandomCharacter(): Mascot | MentorData {
  const rand = Math.random();
  if (rand < 0.4) {
    return LEO;
  }
  const mentorIndex = Math.floor(Math.random() * MENTORS.length);
  return MENTORS[mentorIndex];
}

// Get mentor by ID
export function getMentorById(id: string): MentorData | undefined {
  return MENTORS.find(m => m.id === id);
}

// Mascot state types
export type MascotState = 'idle' | 'thinking' | 'correct' | 'incorrect' | 'celebrate';

// Messages based on context
export const MASCOT_MESSAGES = {
  greeting: [
    "Let's learn together! ",
    "Ready to dive in?",
    "Hey there! ",
  ],
  encouragement: [
    "You've got this! ",
    "Keep going, you're doing great!",
    "Almost there!",
  ],
  correct: [
    "Brilliant! ",
    "You nailed it!",
    "Perfect answer!",
    "Exactly right! ",
  ],
  incorrect: [
    "Not quite, but close!",
    "Let's try again!",
    "Good effort, keep learning!",
  ],
  celebrate: [
    "You crushed it! ",
    "All done! ",
    "Amazing work!",
  ],
  thinking: [
    "Hmm, let me think...",
    "Processing... ",
  ],
};

export function getRandomMessage(type: keyof typeof MASCOT_MESSAGES): string {
  const messages = MASCOT_MESSAGES[type];
  return messages[Math.floor(Math.random() * messages.length)];
}
