import mentorMaya from "@/assets/mentors/mentor-maya.png";
import mentorAlex from "@/assets/mentors/mentor-alex.png";
import mentorKai from "@/assets/mentors/mentor-kai.png";
import mentorSophia from "@/assets/mentors/mentor-sophia.png";

export interface Mentor {
  id: string;
  name: string;
  title: string;
  expertise: string[];
  personality: string;
  avatar: string;
  greeting: string;
  specialties: string[];
}

export const mentors: Mentor[] = [
  {
    id: "maya",
    name: "Maya Chen",
    title: "Industry Strategist",
    expertise: ["Market Analysis", "Competitive Intelligence", "Business Strategy"],
    personality: "Sharp, analytical, and direct. Maya cuts through noise to deliver actionable insights. She challenges your assumptions and pushes you to think deeper about market dynamics.",
    avatar: mentorMaya,
    greeting: "Ready to dive into market dynamics? I love a good strategic challenge.",
    specialties: ["Market structure", "Competitive positioning", "Investment thesis"],
  },
  {
    id: "alex",
    name: "Dr. Alex Rivera",
    title: "Technical Expert",
    expertise: ["Engineering", "Certification", "Supply Chain"],
    personality: "Patient, thorough, and incredibly knowledgeable. Alex has 30+ years of aerospace experience and explains complex technical concepts in accessible ways.",
    avatar: mentorAlex,
    greeting: "Let's talk aerospace. What technical questions are on your mind?",
    specialties: ["Certification processes", "Engineering challenges", "Supply chain dynamics"],
  },
  {
    id: "kai",
    name: "Kai Johnson",
    title: "Startup Coach",
    expertise: ["Fundraising", "GTM Strategy", "Product-Market Fit"],
    personality: "Energetic, encouraging, and practical. Kai has founded two aerospace startups and knows the unique challenges of building in this space.",
    avatar: mentorKai,
    greeting: "Building something in aerospace? Let's figure out your path to success.",
    specialties: ["Startup strategy", "Fundraising", "Go-to-market"],
  },
  {
    id: "sophia",
    name: "Sophia Martinez",
    title: "Growth Advisor",
    expertise: ["Customer Success", "Partnerships", "Scaling Operations"],
    personality: "Warm, inspiring, and incredibly supportive. Sophia has helped scale multiple aerospace ventures from seed to series B. She believes in you and helps you see your full potential.",
    avatar: mentorSophia,
    greeting: "Hey there! Ready to unlock your next level of growth? I'm here to help you shine.",
    specialties: ["Customer relationships", "Strategic partnerships", "Team building"],
  },
];

export function getMentorForContext(context: string, marketId?: string): Mentor {
  const contextLower = context.toLowerCase();
  
  // Sophia is the PRIMARY mentor for Neuroscience market
  if (marketId === "neuroscience" || contextLower.includes("neuro") || contextLower.includes("brain") || contextLower.includes("cognit") || contextLower.includes("mental health") || contextLower.includes("bci") || contextLower.includes("neural")) {
    return mentors.find(m => m.id === "sophia")!;
  }
  
  // Sophia also appears for growth, partnerships, customer, scaling
  if (contextLower.includes("growth") || contextLower.includes("customer") || contextLower.includes("partner") || contextLower.includes("scale") || contextLower.includes("team") || contextLower.includes("network")) {
    return mentors.find(m => m.id === "sophia")!;
  }
  
  if (contextLower.includes("startup") || contextLower.includes("fundrais") || contextLower.includes("gtm") || contextLower.includes("pitch")) {
    return mentors.find(m => m.id === "kai")!;
  }
  
  if (contextLower.includes("technical") || contextLower.includes("certif") || contextLower.includes("engineer") || contextLower.includes("faa") || contextLower.includes("do-178")) {
    return mentors.find(m => m.id === "alex")!;
  }
  
  // Alternate between Maya and Sophia for general content
  const hash = context.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  if (hash % 3 === 0) {
    return mentors.find(m => m.id === "sophia")!;
  }
  
  return mentors.find(m => m.id === "maya")!;
}
