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

export function getTipForSlide(
  slideIndex: number,
  totalSlides: number,
  shownTipIds: Set<string>
): MentorTip | null {
  let candidates: MentorTip[] = [];

  if (slideIndex === 0) {
    // First slide
    candidates = lessonTips.filter(
      (t) => t.trigger === "first_slide" && !shownTipIds.has(t.id)
    );
  } else if (slideIndex === 2 || slideIndex === 3) {
    // Mid lesson
    candidates = lessonTips.filter(
      (t) => t.trigger === "mid_lesson" && !shownTipIds.has(t.id)
    );
  } else if (slideIndex >= totalSlides - 2 && slideIndex < totalSlides - 1) {
    // Near end
    candidates = lessonTips.filter(
      (t) => t.trigger === "near_end" && !shownTipIds.has(t.id)
    );
  } else if (Math.random() < 0.15) {
    // 15% chance of random tip on other slides
    candidates = lessonTips.filter(
      (t) => t.trigger === "random" && !shownTipIds.has(t.id)
    );
  }

  if (candidates.length === 0) return null;

  // Pick a random tip from candidates
  return candidates[Math.floor(Math.random() * candidates.length)];
}
