// Proactive tips that mentors share during lessons
// Organized by context/trigger type

export interface MentorTip {
  id: string;
  mentorId: "maya" | "alex" | "kai";
  tip: string;
  trigger: "slide_progress" | "first_slide" | "mid_lesson" | "near_end" | "random";
  slideThreshold?: number; // For slide_progress trigger
}

export const lessonTips: MentorTip[] = [
  // First slide encouragement
  {
    id: "welcome_1",
    mentorId: "alex",
    tip: "Great start! Take notes on key concepts—they'll help later.",
    trigger: "first_slide",
  },
  {
    id: "welcome_2",
    mentorId: "kai",
    tip: "Think about how this applies to a startup idea as you read!",
    trigger: "first_slide",
  },
  {
    id: "welcome_3",
    mentorId: "maya",
    tip: "Look for market opportunities hidden in these insights.",
    trigger: "first_slide",
  },

  // Mid-lesson tips (around slide 3)
  {
    id: "mid_1",
    mentorId: "alex",
    tip: "Pro tip: The sources at the bottom are gold for deeper research.",
    trigger: "mid_lesson",
    slideThreshold: 3,
  },
  {
    id: "mid_2",
    mentorId: "maya",
    tip: "Notice how the key players connect? That's where opportunities hide.",
    trigger: "mid_lesson",
    slideThreshold: 3,
  },
  {
    id: "mid_3",
    mentorId: "kai",
    tip: "This is the kind of knowledge investors love to hear about!",
    trigger: "mid_lesson",
    slideThreshold: 3,
  },

  // Near end encouragement (slide 5+)
  {
    id: "end_1",
    mentorId: "alex",
    tip: "Almost there! Save any insights before you finish.",
    trigger: "near_end",
    slideThreshold: 5,
  },
  {
    id: "end_2",
    mentorId: "kai",
    tip: "You're building real expertise. Keep this momentum going!",
    trigger: "near_end",
    slideThreshold: 5,
  },
  {
    id: "end_3",
    mentorId: "maya",
    tip: "Reflect on what you learned—how does it change your view?",
    trigger: "near_end",
    slideThreshold: 5,
  },

  // Random encouragement tips
  {
    id: "random_1",
    mentorId: "alex",
    tip: "Fun fact: Most aerospace founders learned exactly this way.",
    trigger: "random",
  },
  {
    id: "random_2",
    mentorId: "kai",
    tip: "You're in the top 10% of aerospace learners. Keep going!",
    trigger: "random",
  },
  {
    id: "random_3",
    mentorId: "maya",
    tip: "Every slide is a building block for your future startup.",
    trigger: "random",
  },
  {
    id: "random_4",
    mentorId: "alex",
    tip: "Tap on me anytime if you have questions!",
    trigger: "random",
  },
  {
    id: "random_5",
    mentorId: "kai",
    tip: "This knowledge could be your competitive advantage.",
    trigger: "random",
  },
];

// Session-based tip tracker to limit tips per session
let sessionTipsShown = 0;
const MAX_TIPS_PER_SESSION = 0; // DISABLED - MentorGuide already provides encouragement on first/last slides
const TIP_COOLDOWN_SLIDES = 999; // Effectively disable cooldown logic
let lastTipSlide = -999;

/**
 * Reset tip tracking for a new lesson session
 */
export function resetTipSession() {
  sessionTipsShown = 0;
  lastTipSlide = -999;
}

/**
 * Get a tip for the current slide - CURRENTLY DISABLED
 * MentorGuide now only appears on first/last slides, removing the need for proactive tips
 */
export function getTipForSlide(
  slideIndex: number,
  totalSlides: number,
  shownTipIds: Set<string>
): MentorTip | null {
  // Tips are disabled - MentorGuide provides enough guidance on first/last slides
  // This prevents mentor spam during lessons
  return null;
}
