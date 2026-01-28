// All available markets/industries for MarketLingo
// Each market has a 6-month curriculum structure

import { LucideIcon, Plane, Brain, Cpu, Building2, Car, Pill, Zap, Leaf, Droplets, Shield, Satellite, Factory, Stethoscope, Truck, Coins } from "lucide-react";

export interface Market {
  id: string;
  name: string;
  icon: LucideIcon;
  emoji: string;
  description: string;
  primaryMentor: string; // Mentor ID
  color: string; // Tailwind color class
  themes: string[]; // 6-month theme names
  keyFeature?: string; // Special feature for this market
}

export const markets: Market[] = [
  {
    id: "aerospace",
    name: "Aerospace",
    icon: Plane,
    emoji: "🚀",
    description: "Aviation, defense, and space technology",
    primaryMentor: "maya",
    color: "purple",
    themes: [
      "Foundations",
      "Commercial Aviation", 
      "Defense & Government",
      "Space Economy",
      "Emerging Tech",
      "Business & Strategy"
    ],
    keyFeature: "Industry Intel"
  },
  {
    id: "neuroscience",
    name: "Neuroscience",
    icon: Brain,
    emoji: "🧠",
    description: "BCI, neurotech, and mental health innovation",
    primaryMentor: "sophia",
    color: "rose",
    themes: [
      "Brain Science Foundations",
      "Neurotech Devices",
      "Mental Health Innovation",
      "FDA & Clinical Pathways",
      "Research-to-Clinic",
      "Neuro-Business Ethics"
    ],
    keyFeature: "Regulatory Hub"
  },
  {
    id: "ai",
    name: "AI & Machine Learning",
    icon: Cpu,
    emoji: "🤖",
    description: "Artificial intelligence, ML, and automation",
    primaryMentor: "alex",
    color: "blue",
    themes: [
      "AI Foundations",
      "ML Infrastructure",
      "Enterprise AI",
      "Generative AI",
      "AI Safety & Ethics",
      "AI Business Models"
    ],
    keyFeature: "Tech Stack Explorer"
  },
  {
    id: "fintech",
    name: "Fintech",
    icon: Building2,
    emoji: "💳",
    description: "Digital payments, banking, and DeFi",
    primaryMentor: "kai",
    color: "emerald",
    themes: [
      "Financial Services 101",
      "Digital Payments",
      "Neobanking",
      "DeFi & Crypto",
      "Regulatory Landscape",
      "Fintech GTM"
    ],
    keyFeature: "Regulatory Tracker"
  },
  {
    id: "ev",
    name: "Electric Vehicles",
    icon: Car,
    emoji: "⚡",
    description: "EV manufacturing, charging, and mobility",
    primaryMentor: "alex",
    color: "cyan",
    themes: [
      "EV Fundamentals",
      "Battery Technology",
      "Charging Infrastructure",
      "Autonomous Vehicles",
      "Supply Chain",
      "EV Business Strategy"
    ],
    keyFeature: "Supply Chain Map"
  },
  {
    id: "biotech",
    name: "Biotech",
    icon: Pill,
    emoji: "🧬",
    description: "Drug discovery, genomics, and therapeutics",
    primaryMentor: "sophia",
    color: "pink",
    themes: [
      "Biotech Basics",
      "Drug Discovery",
      "Clinical Trials",
      "Genomics & Gene Therapy",
      "FDA Approval Process",
      "Biotech Commercialization"
    ],
    keyFeature: "Clinical Pipeline"
  },
  {
    id: "cleanenergy",
    name: "Clean Energy",
    icon: Zap,
    emoji: "☀️",
    description: "Solar, wind, storage, and grid tech",
    primaryMentor: "maya",
    color: "amber",
    themes: [
      "Energy Fundamentals",
      "Solar & Wind",
      "Energy Storage",
      "Grid Modernization",
      "Policy & Incentives",
      "Clean Energy Finance"
    ],
    keyFeature: "Policy Tracker"
  },
  {
    id: "agtech",
    name: "AgTech",
    icon: Leaf,
    emoji: "🌱",
    description: "Agricultural technology and food systems",
    primaryMentor: "kai",
    color: "green",
    themes: [
      "AgTech Landscape",
      "Precision Agriculture",
      "Indoor & Vertical Farming",
      "AgBio & Seeds",
      "Supply Chain & Logistics",
      "AgTech Business Models"
    ],
    keyFeature: "Crop Tech Map"
  },
  {
    id: "climatetech",
    name: "Climate Tech",
    icon: Droplets,
    emoji: "🌍",
    description: "Carbon capture, sustainability, and climate solutions",
    primaryMentor: "maya",
    color: "teal",
    themes: [
      "Climate Science 101",
      "Carbon Capture",
      "Sustainable Materials",
      "Climate Finance",
      "Regulatory Landscape",
      "Climate Startup Strategy"
    ],
    keyFeature: "Impact Metrics"
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    icon: Shield,
    emoji: "🔐",
    description: "Security, privacy, and digital defense",
    primaryMentor: "alex",
    color: "red",
    themes: [
      "Security Fundamentals",
      "Threat Landscape",
      "Enterprise Security",
      "Cloud Security",
      "Compliance & Privacy",
      "Security GTM"
    ],
    keyFeature: "Threat Intel"
  },
  {
    id: "spacetech",
    name: "Space Tech",
    icon: Satellite,
    emoji: "🛰️",
    description: "Satellites, launch, and space infrastructure",
    primaryMentor: "alex",
    color: "indigo",
    themes: [
      "Space Industry 101",
      "Launch & Access",
      "Satellite Services",
      "Space Manufacturing",
      "Space Regulations",
      "Space Business Models"
    ],
    keyFeature: "Launch Tracker"
  },
  {
    id: "robotics",
    name: "Robotics",
    icon: Factory,
    emoji: "🤖",
    description: "Industrial automation and service robots",
    primaryMentor: "alex",
    color: "slate",
    themes: [
      "Robotics Foundations",
      "Industrial Automation",
      "Service Robotics",
      "Perception & Control",
      "Human-Robot Interaction",
      "Robotics Business"
    ],
    keyFeature: "Tech Landscape"
  },
  {
    id: "healthtech",
    name: "HealthTech",
    icon: Stethoscope,
    emoji: "🏥",
    description: "Digital health, telemedicine, and medtech",
    primaryMentor: "sophia",
    color: "sky",
    themes: [
      "Healthcare 101",
      "Digital Health",
      "Telemedicine",
      "Medical Devices",
      "Healthcare Regulations",
      "Health Business Models"
    ],
    keyFeature: "Payer Navigator"
  },
  {
    id: "logistics",
    name: "Logistics Tech",
    icon: Truck,
    emoji: "📦",
    description: "Supply chain, fulfillment, and last-mile",
    primaryMentor: "kai",
    color: "orange",
    themes: [
      "Logistics Fundamentals",
      "Warehouse Automation",
      "Last-Mile Delivery",
      "Fleet & Route Optimization",
      "Supply Chain Visibility",
      "Logistics GTM"
    ],
    keyFeature: "Supply Chain Map"
  },
  {
    id: "web3",
    name: "Web3 & Crypto",
    icon: Coins,
    emoji: "🪙",
    description: "Blockchain, DAOs, and decentralized apps",
    primaryMentor: "kai",
    color: "violet",
    themes: [
      "Blockchain Fundamentals",
      "Smart Contracts",
      "DeFi Protocols",
      "NFTs & Digital Assets",
      "DAOs & Governance",
      "Web3 Business"
    ],
    keyFeature: "Protocol Explorer"
  }
];

export function getMarketById(id: string): Market | undefined {
  return markets.find(m => m.id === id);
}

export function getMarketEmoji(id: string): string {
  return getMarketById(id)?.emoji || "📚";
}

export function getMarketName(id: string): string {
  return getMarketById(id)?.name || "Industry";
}
