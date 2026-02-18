export interface Mentor {
  id: string;
  name: string;
  title: string;
  expertise: string[];
  personality: string;
  emoji: string;
  greeting: string;
  specialties: string[];
  expressions?: {
    thinking?: string[];
    cheering?: string[];
    celebrating?: string[];
    encouraging?: string[];
    curious?: string[];
  };
}

export const mentors: Mentor[] = [
  {
    id: 'maya',
    name: 'Maya Chen',
    title: 'Industry Strategist',
    expertise: ['Market Analysis', 'Competitive Intelligence', 'Business Strategy'],
    personality: 'Sharp, analytical, and direct. Maya cuts through noise to deliver actionable insights.',
    emoji: '👩‍💼',
    greeting: 'Ready to dive into market dynamics? I love a good strategic challenge.',
    specialties: ['Market structure', 'Competitive positioning', 'Investment thesis'],
  },
  {
    id: 'alex',
    name: 'Dr. Alex Rivera',
    title: 'Technical Expert',
    expertise: ['Engineering', 'Certification', 'Supply Chain'],
    personality: 'Patient, thorough, and incredibly knowledgeable. 30+ years of experience.',
    emoji: '👨‍🔬',
    greeting: "Let's talk aerospace. What technical questions are on your mind?",
    specialties: ['Certification processes', 'Engineering challenges', 'Supply chain dynamics'],
  },
  {
    id: 'kai',
    name: 'Kai Johnson',
    title: 'Startup Coach',
    expertise: ['Fundraising', 'GTM Strategy', 'Product-Market Fit'],
    personality: 'Energetic, encouraging, and practical. Founded two startups.',
    emoji: '🚀',
    greeting: 'Building something? Let\'s figure out your path to success.',
    specialties: ['Startup strategy', 'Fundraising', 'Go-to-market'],
  },
  {
    id: 'sophia',
    name: 'Sophia Hernández',
    title: 'Growth Advisor',
    expertise: ['Customer Success', 'Partnerships', 'Scaling Operations', 'Neuroscience'],
    personality: 'Warm, inspiring, and incredibly supportive. Helps you see your full potential.',
    emoji: '✨',
    greeting: "Hey there! Ready to unlock your next level of growth? I'm here to help you shine.",
    specialties: ['Customer relationships', 'Strategic partnerships', 'Neurotech', 'Regulatory navigation'],
    expressions: {
      thinking: ['Hmm, let me think...', "That's a deep one!", 'Interesting angle...'],
      cheering: ["You're crushing it! 🎉", 'Amazing work!', 'Yes! Nailed it! 💪', 'I knew you could do it!'],
      celebrating: ['Huge milestone! 🏆', 'Look at you go!', "That's what I'm talking about!", 'So proud of you!'],
      encouraging: ["You've got this!", 'Keep pushing!', 'Almost there!', 'Trust the process!'],
      curious: ['Tell me more!', 'What led you there?', 'I love that thinking!', "Ooh, that's exciting!"],
    },
  },
];

export function getMentorById(id: string): Mentor {
  return mentors.find((m) => m.id === id) || mentors[0];
}

export function getMentorForContext(context: string, marketId?: string): Mentor {
  const contextLower = context.toLowerCase();

  if (marketId === 'neuroscience' || contextLower.includes('neuro') || contextLower.includes('brain') || contextLower.includes('bci')) {
    return mentors.find((m) => m.id === 'sophia')!;
  }
  if (contextLower.includes('growth') || contextLower.includes('customer') || contextLower.includes('partner') || contextLower.includes('scale')) {
    return mentors.find((m) => m.id === 'sophia')!;
  }
  if (contextLower.includes('startup') || contextLower.includes('fundrais') || contextLower.includes('gtm') || contextLower.includes('pitch')) {
    return mentors.find((m) => m.id === 'kai')!;
  }
  if (contextLower.includes('technical') || contextLower.includes('certif') || contextLower.includes('engineer') || contextLower.includes('faa')) {
    return mentors.find((m) => m.id === 'alex')!;
  }

  return mentors.find((m) => m.id === 'maya')!;
}
