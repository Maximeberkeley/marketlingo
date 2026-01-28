// Market-specific configuration for 100% original content per industry
// Each market has its own primary mentor, colors, hero image, and content theming

// Import unique hero images for each market
import aerospaceHero from "@/assets/markets/aerospace-hero.jpg";
import neuroscienceHero from "@/assets/markets/neuroscience-hero.jpg";
import aiHero from "@/assets/markets/ai-hero.jpg";
import fintechHero from "@/assets/markets/fintech-hero.jpg";
import evHero from "@/assets/markets/ev-hero.jpg";
import biotechHero from "@/assets/markets/biotech-hero.jpg";
import cybersecurityHero from "@/assets/markets/cybersecurity-hero.jpg";
import spacetechHero from "@/assets/markets/spacetech-hero.jpg";
import healthtechHero from "@/assets/markets/healthtech-hero.jpg";
import roboticsHero from "@/assets/markets/robotics-hero.jpg";
import cleanenergyHero from "@/assets/markets/cleanenergy-hero.jpg";
import climatetechHero from "@/assets/markets/climatetech-hero.jpg";
import agtechHero from "@/assets/markets/agtech-hero.jpg";
import logisticsHero from "@/assets/markets/logistics-hero.jpg";
import web3Hero from "@/assets/markets/web3-hero.jpg";

export interface MarketConfig {
  id: string;
  name: string;
  primaryMentorId: string; // Assigned mentor per industry
  heroGradient: string; // CSS gradient for fallback
  heroImage: string; // Unique hero image per market
  accentColor: string;
  gameDescription: string;
  drillDescription: string;
  trainerDescription: string;
  keywords: string[];
  industryTerms: string[];
}

// Assign primary mentors and unique assets to each market
export const marketConfigs: Record<string, MarketConfig> = {
  aerospace: {
    id: "aerospace",
    name: "Aerospace",
    primaryMentorId: "alex",
    heroGradient: "from-blue-600 via-indigo-700 to-slate-900",
    heroImage: aerospaceHero,
    accentColor: "blue",
    gameDescription: "Test your knowledge with aerospace industry challenges",
    drillDescription: "Rapid-fire True/False on aviation and space facts",
    trainerDescription: "Strategic scenarios from commercial and defense sectors",
    keywords: ["aviation", "aircraft", "rockets", "space", "satellites"],
    industryTerms: ["OEM", "MRO", "FAA", "EASA", "Part 25", "DO-178C"],
  },
  neuroscience: {
    id: "neuroscience",
    name: "Neuroscience",
    primaryMentorId: "sophia",
    heroGradient: "from-violet-600 via-purple-700 to-fuchsia-900",
    heroImage: neuroscienceHero,
    accentColor: "purple",
    gameDescription: "Challenge your brain science knowledge with real scenarios",
    drillDescription: "Quick neural pathway and BCI fact-checking",
    trainerDescription: "Navigate FDA pathways and neurotech dilemmas",
    keywords: ["brain", "neural", "cognitive", "BCI", "neurons"],
    industryTerms: ["BCI", "FDA 510(k)", "PMA", "IRB", "EEG", "fMRI"],
  },
  ai: {
    id: "ai",
    name: "AI Industry",
    primaryMentorId: "maya",
    heroGradient: "from-emerald-600 via-teal-700 to-cyan-900",
    heroImage: aiHero,
    accentColor: "emerald",
    gameDescription: "Master AI fundamentals through interactive challenges",
    drillDescription: "Rapid ML and deep learning fact verification",
    trainerDescription: "Navigate AI ethics, deployment, and scaling decisions",
    keywords: ["machine learning", "neural networks", "AI", "models", "training"],
    industryTerms: ["LLM", "GPU", "Transformer", "Fine-tuning", "RAG", "MLOps"],
  },
  fintech: {
    id: "fintech",
    name: "Fintech",
    primaryMentorId: "kai",
    heroGradient: "from-green-600 via-emerald-700 to-teal-900",
    heroImage: fintechHero,
    accentColor: "green",
    gameDescription: "Test your financial technology and payments knowledge",
    drillDescription: "Quick banking and payments fact-checking",
    trainerDescription: "Strategic decisions for fintech founders and operators",
    keywords: ["payments", "banking", "lending", "crypto", "transfers"],
    industryTerms: ["ACH", "PCI-DSS", "SOC2", "KYC", "AML", "BNPL"],
  },
  ev: {
    id: "ev",
    name: "Electric Vehicles",
    primaryMentorId: "alex",
    heroGradient: "from-lime-600 via-green-700 to-emerald-900",
    heroImage: evHero,
    accentColor: "lime",
    gameDescription: "Electric mobility and battery technology challenges",
    drillDescription: "EV industry facts and manufacturing insights",
    trainerDescription: "Navigate charging, manufacturing, and scaling decisions",
    keywords: ["electric", "battery", "charging", "EV", "autonomous"],
    industryTerms: ["kWh", "LFP", "NMC", "NACS", "CCS", "V2G"],
  },
  biotech: {
    id: "biotech",
    name: "Biotech",
    primaryMentorId: "sophia",
    heroGradient: "from-pink-600 via-rose-700 to-red-900",
    heroImage: biotechHero,
    accentColor: "pink",
    gameDescription: "Biotechnology and life sciences knowledge challenges",
    drillDescription: "Drug development and clinical trial facts",
    trainerDescription: "Navigate FDA pathways and biotech business decisions",
    keywords: ["drugs", "therapeutics", "clinical", "genomics", "proteins"],
    industryTerms: ["FDA", "Phase I/II/III", "IND", "NDA", "CRISPR", "mRNA"],
  },
  cybersecurity: {
    id: "cybersecurity",
    name: "Cybersecurity",
    primaryMentorId: "kai",
    heroGradient: "from-red-600 via-rose-700 to-pink-900",
    heroImage: cybersecurityHero,
    accentColor: "red",
    gameDescription: "Security concepts and threat landscape challenges",
    drillDescription: "Rapid security and compliance fact verification",
    trainerDescription: "Handle breach scenarios and security architecture decisions",
    keywords: ["security", "threats", "encryption", "firewall", "malware"],
    industryTerms: ["SOC", "EDR", "XDR", "Zero Trust", "SIEM", "IAM"],
  },
  spacetech: {
    id: "spacetech",
    name: "Space Tech",
    primaryMentorId: "alex",
    heroGradient: "from-slate-600 via-gray-800 to-black",
    heroImage: spacetechHero,
    accentColor: "slate",
    gameDescription: "Space exploration and satellite technology challenges",
    drillDescription: "Launch, orbital, and space economics facts",
    trainerDescription: "Navigate space contracts and mission planning decisions",
    keywords: ["space", "rockets", "satellites", "orbit", "launch"],
    industryTerms: ["LEO", "GEO", "Starlink", "Delta-v", "Payload", "Re-entry"],
  },
  healthtech: {
    id: "healthtech",
    name: "HealthTech",
    primaryMentorId: "sophia",
    heroGradient: "from-cyan-600 via-blue-700 to-indigo-900",
    heroImage: healthtechHero,
    accentColor: "cyan",
    gameDescription: "Digital health and healthcare technology challenges",
    drillDescription: "HIPAA, telehealth, and healthtech facts",
    trainerDescription: "Navigate payer relationships and FDA digital health pathways",
    keywords: ["health", "medical", "patients", "telehealth", "diagnostics"],
    industryTerms: ["HIPAA", "EHR", "RPM", "DTx", "CPT", "ICD-10"],
  },
  robotics: {
    id: "robotics",
    name: "Robotics",
    primaryMentorId: "alex",
    heroGradient: "from-orange-600 via-amber-700 to-yellow-900",
    heroImage: roboticsHero,
    accentColor: "orange",
    gameDescription: "Industrial automation and robotics challenges",
    drillDescription: "Robot kinematics and automation facts",
    trainerDescription: "Navigate deployment, safety, and integration decisions",
    keywords: ["robots", "automation", "cobot", "arm", "sensors"],
    industryTerms: ["DOF", "Cobot", "End-effector", "ROS", "PLC", "AMR"],
  },
  cleanenergy: {
    id: "cleanenergy",
    name: "Clean Energy",
    primaryMentorId: "maya",
    heroGradient: "from-yellow-600 via-amber-700 to-orange-900",
    heroImage: cleanenergyHero,
    accentColor: "yellow",
    gameDescription: "Renewable energy and grid technology challenges",
    drillDescription: "Solar, wind, and storage facts verification",
    trainerDescription: "Navigate PPAs, interconnection, and project development",
    keywords: ["solar", "wind", "battery", "grid", "renewable"],
    industryTerms: ["PPA", "LCOE", "ITC", "PTC", "BESS", "Interconnection"],
  },
  climatetech: {
    id: "climatetech",
    name: "Climate Tech",
    primaryMentorId: "maya",
    heroGradient: "from-teal-600 via-green-700 to-emerald-900",
    heroImage: climatetechHero,
    accentColor: "teal",
    gameDescription: "Carbon removal and climate solution challenges",
    drillDescription: "DAC, carbon credits, and climate policy facts",
    trainerDescription: "Navigate carbon markets and decarbonization decisions",
    keywords: ["carbon", "climate", "emissions", "capture", "offset"],
    industryTerms: ["DAC", "CDR", "45Q", "Scope 1/2/3", "VCM", "Net-zero"],
  },
  agtech: {
    id: "agtech",
    name: "AgTech",
    primaryMentorId: "kai",
    heroGradient: "from-green-700 via-lime-700 to-yellow-900",
    heroImage: agtechHero,
    accentColor: "green",
    gameDescription: "Precision agriculture and food tech challenges",
    drillDescription: "Farm technology and agricultural facts",
    trainerDescription: "Navigate farmer adoption and agribusiness decisions",
    keywords: ["farm", "agriculture", "crops", "livestock", "precision"],
    industryTerms: ["VRT", "RTK", "NDVI", "CEA", "Biologicals", "IoT"],
  },
  logistics: {
    id: "logistics",
    name: "Logistics Tech",
    primaryMentorId: "kai",
    heroGradient: "from-blue-700 via-indigo-700 to-purple-900",
    heroImage: logisticsHero,
    accentColor: "blue",
    gameDescription: "Supply chain and freight technology challenges",
    drillDescription: "Trucking, warehousing, and delivery facts",
    trainerDescription: "Navigate freight markets and automation decisions",
    keywords: ["freight", "shipping", "warehouse", "delivery", "trucking"],
    industryTerms: ["TMS", "WMS", "LTL", "FTL", "3PL", "Last-mile"],
  },
  web3: {
    id: "web3",
    name: "Web3 & Crypto",
    primaryMentorId: "maya",
    heroGradient: "from-purple-600 via-violet-700 to-indigo-900",
    heroImage: web3Hero,
    accentColor: "purple",
    gameDescription: "Blockchain and decentralized technology challenges",
    drillDescription: "Crypto, DeFi, and smart contract facts",
    trainerDescription: "Navigate tokenomics, security, and regulatory decisions",
    keywords: ["blockchain", "crypto", "token", "DeFi", "NFT"],
    industryTerms: ["TVL", "L2", "DAO", "EVM", "Gas", "Staking"],
  },
};

// Get market config with fallback
export function getMarketConfig(marketId: string): MarketConfig {
  return marketConfigs[marketId] || marketConfigs.aerospace;
}

// Get the primary mentor for a market
export function getPrimaryMentorForMarket(marketId: string): string {
  const config = getMarketConfig(marketId);
  return config.primaryMentorId;
}
