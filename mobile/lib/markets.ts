export interface MarketInfo {
  id: string;
  name: string;
  description: string;
  color: string;
  themes: string[];
}

export const markets: MarketInfo[] = [
  {
    id: "aerospace",
    name: "Aerospace",
    description: "Aviation, defense, and space technology",
    color: "#8B5CF6",
    themes: ["Foundations", "Commercial Aviation", "Defense & Government", "Space Economy", "Emerging Tech", "Business & Strategy"],
  },
  {
    id: "neuroscience",
    name: "Neuroscience",
    description: "BCI, neurotech, and mental health innovation",
    color: "#F43F5E",
    themes: ["Brain Science Foundations", "Neurotech Devices", "Mental Health Innovation", "FDA & Clinical Pathways", "Research-to-Clinic", "Neuro-Business Ethics"],
  },
  {
    id: "ai",
    name: "AI & Machine Learning",
    description: "Artificial intelligence, ML, and automation",
    color: "#3B82F6",
    themes: ["AI Foundations", "ML Infrastructure", "Enterprise AI", "Generative AI", "AI Safety & Ethics", "AI Business Models"],
  },
  {
    id: "fintech",
    name: "Fintech",
    description: "Digital payments, banking, and DeFi",
    color: "#10B981",
    themes: ["Financial Services 101", "Digital Payments", "Neobanking", "DeFi & Crypto", "Regulatory Landscape", "Fintech GTM"],
  },
  {
    id: "ev",
    name: "Electric Vehicles",
    description: "EV manufacturing, charging, and mobility",
    color: "#06B6D4",
    themes: ["EV Fundamentals", "Battery Technology", "Charging Infrastructure", "Autonomous Vehicles", "Supply Chain", "EV Business Strategy"],
  },
  {
    id: "biotech",
    name: "Biotech",
    description: "Drug discovery, genomics, and therapeutics",
    color: "#EC4899",
    themes: ["Biotech Basics", "Drug Discovery", "Clinical Trials", "Genomics & Gene Therapy", "FDA Approval Process", "Biotech Commercialization"],
  },
  {
    id: "cleanenergy",
    name: "Clean Energy",
    description: "Solar, wind, storage, and grid tech",
    color: "#F59E0B",
    themes: ["Energy Fundamentals", "Solar & Wind", "Energy Storage", "Grid Modernization", "Policy & Incentives", "Clean Energy Finance"],
  },
  {
    id: "agtech",
    name: "AgTech",
    description: "Agricultural technology and food systems",
    color: "#22C55E",
    themes: ["AgTech Landscape", "Precision Agriculture", "Indoor & Vertical Farming", "AgBio & Seeds", "Supply Chain & Logistics", "AgTech Business Models"],
  },
  {
    id: "climatetech",
    name: "Climate Tech",
    description: "Carbon capture, sustainability, and climate solutions",
    color: "#14B8A6",
    themes: ["Climate Science 101", "Carbon Capture", "Sustainable Materials", "Climate Finance", "Regulatory Landscape", "Climate Startup Strategy"],
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    description: "Security, privacy, and digital defense",
    color: "#EF4444",
    themes: ["Security Fundamentals", "Threat Landscape", "Enterprise Security", "Cloud Security", "Compliance & Privacy", "Security GTM"],
  },
  {
    id: "spacetech",
    name: "Space Tech",
    description: "Satellites, launch, and space infrastructure",
    color: "#6366F1",
    themes: ["Space Industry 101", "Launch & Access", "Satellite Services", "Space Manufacturing", "Space Regulations", "Space Business Models"],
  },
  {
    id: "robotics",
    name: "Robotics",
    description: "Industrial automation and service robots",
    color: "#64748B",
    themes: ["Robotics Foundations", "Industrial Automation", "Service Robotics", "Perception & Control", "Human-Robot Interaction", "Robotics Business"],
  },
  {
    id: "healthtech",
    name: "HealthTech",
    description: "Digital health, telemedicine, and medtech",
    color: "#0EA5E9",
    themes: ["Healthcare 101", "Digital Health", "Telemedicine", "Medical Devices", "Healthcare Regulations", "Health Business Models"],
  },
  {
    id: "logistics",
    name: "Logistics Tech",
    description: "Supply chain, fulfillment, and last-mile",
    color: "#F97316",
    themes: ["Logistics Fundamentals", "Warehouse Automation", "Last-Mile Delivery", "Fleet & Route Optimization", "Supply Chain Visibility", "Logistics GTM"],
  },
  {
    id: "web3",
    name: "Web3 & Crypto",
    description: "Blockchain, DAOs, and decentralized apps",
    color: "#7C3AED",
    themes: ["Blockchain Fundamentals", "Smart Contracts", "DeFi Protocols", "NFTs & Digital Assets", "DAOs & Governance", "Web3 Business"],
  },
];

export function getMarketById(id: string): MarketInfo | undefined {
  return markets.find((m) => m.id === id);
}

export function getMarketName(id: string): string {
  return getMarketById(id)?.name || "Industry";
}

export function getMarketColor(id: string): string {
  return getMarketById(id)?.color || "#8B5CF6";
}
