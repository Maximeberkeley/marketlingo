export interface MarketConfig {
  id: string;
  name: string;
  primaryMentorId: string;
  heroGradientColors: [string, string]; // RN LinearGradient colors
  accentColor: string;
  gameDescription: string;
  drillDescription: string;
  trainerDescription: string;
  keywords: string[];
  industryTerms: string[];
}

export const marketConfigs: Record<string, MarketConfig> = {
  aerospace: {
    id: 'aerospace', name: 'Aerospace', primaryMentorId: 'alex',
    heroGradientColors: ['#2563EB', '#1E293B'],
    accentColor: '#3B82F6',
    gameDescription: 'Test your knowledge with aerospace industry challenges',
    drillDescription: 'Rapid-fire True/False on aviation and space facts',
    trainerDescription: 'Strategic scenarios from commercial and defense sectors',
    keywords: ['aviation', 'aircraft', 'rockets', 'space', 'satellites'],
    industryTerms: ['OEM', 'MRO', 'FAA', 'EASA', 'Part 25', 'DO-178C'],
  },
  neuroscience: {
    id: 'neuroscience', name: 'Neuroscience', primaryMentorId: 'sophia',
    heroGradientColors: ['#7C3AED', '#A21CAF'],
    accentColor: '#8B5CF6',
    gameDescription: 'Challenge your brain science knowledge with real scenarios',
    drillDescription: 'Quick neural pathway and BCI fact-checking',
    trainerDescription: 'Navigate FDA pathways and neurotech dilemmas',
    keywords: ['brain', 'neural', 'cognitive', 'BCI', 'neurons'],
    industryTerms: ['BCI', 'FDA 510(k)', 'PMA', 'IRB', 'EEG', 'fMRI'],
  },
  ai: {
    id: 'ai', name: 'AI Industry', primaryMentorId: 'maya',
    heroGradientColors: ['#059669', '#0891B2'],
    accentColor: '#10B981',
    gameDescription: 'Master AI fundamentals through interactive challenges',
    drillDescription: 'Rapid ML and deep learning fact verification',
    trainerDescription: 'Navigate AI ethics, deployment, and scaling decisions',
    keywords: ['machine learning', 'neural networks', 'AI', 'models', 'training'],
    industryTerms: ['LLM', 'GPU', 'Transformer', 'Fine-tuning', 'RAG', 'MLOps'],
  },
  fintech: {
    id: 'fintech', name: 'Fintech', primaryMentorId: 'kai',
    heroGradientColors: ['#16A34A', '#0D9488'],
    accentColor: '#22C55E',
    gameDescription: 'Test your financial technology and payments knowledge',
    drillDescription: 'Quick banking and payments fact-checking',
    trainerDescription: 'Strategic decisions for fintech founders and operators',
    keywords: ['payments', 'banking', 'lending', 'crypto', 'transfers'],
    industryTerms: ['ACH', 'PCI-DSS', 'SOC2', 'KYC', 'AML', 'BNPL'],
  },
  ev: {
    id: 'ev', name: 'Electric Vehicles', primaryMentorId: 'alex',
    heroGradientColors: ['#65A30D', '#059669'],
    accentColor: '#84CC16',
    gameDescription: 'Electric mobility and battery technology challenges',
    drillDescription: 'EV industry facts and manufacturing insights',
    trainerDescription: 'Navigate charging, manufacturing, and scaling decisions',
    keywords: ['electric', 'battery', 'charging', 'EV', 'autonomous'],
    industryTerms: ['kWh', 'LFP', 'NMC', 'NACS', 'CCS', 'V2G'],
  },
  biotech: {
    id: 'biotech', name: 'Biotech', primaryMentorId: 'sophia',
    heroGradientColors: ['#DB2777', '#BE123C'],
    accentColor: '#EC4899',
    gameDescription: 'Biotechnology and life sciences knowledge challenges',
    drillDescription: 'Drug development and clinical trial facts',
    trainerDescription: 'Navigate FDA pathways and biotech business decisions',
    keywords: ['drugs', 'therapeutics', 'clinical', 'genomics', 'proteins'],
    industryTerms: ['FDA', 'Phase I/II/III', 'IND', 'NDA', 'CRISPR', 'mRNA'],
  },
  cybersecurity: {
    id: 'cybersecurity', name: 'Cybersecurity', primaryMentorId: 'kai',
    heroGradientColors: ['#DC2626', '#BE185D'],
    accentColor: '#EF4444',
    gameDescription: 'Security concepts and threat landscape challenges',
    drillDescription: 'Rapid security and compliance fact verification',
    trainerDescription: 'Handle breach scenarios and security architecture decisions',
    keywords: ['security', 'threats', 'encryption', 'firewall', 'malware'],
    industryTerms: ['SOC', 'EDR', 'XDR', 'Zero Trust', 'SIEM', 'IAM'],
  },
  spacetech: {
    id: 'spacetech', name: 'Space Tech', primaryMentorId: 'alex',
    heroGradientColors: ['#475569', '#0F172A'],
    accentColor: '#64748B',
    gameDescription: 'Space exploration and satellite technology challenges',
    drillDescription: 'Launch, orbital, and space economics facts',
    trainerDescription: 'Navigate space contracts and mission planning decisions',
    keywords: ['space', 'rockets', 'satellites', 'orbit', 'launch'],
    industryTerms: ['LEO', 'GEO', 'Starlink', 'Delta-v', 'Payload', 'Re-entry'],
  },
  healthtech: {
    id: 'healthtech', name: 'HealthTech', primaryMentorId: 'sophia',
    heroGradientColors: ['#0891B2', '#4338CA'],
    accentColor: '#06B6D4',
    gameDescription: 'Digital health and healthcare technology challenges',
    drillDescription: 'HIPAA, telehealth, and healthtech facts',
    trainerDescription: 'Navigate payer relationships and FDA digital health pathways',
    keywords: ['health', 'medical', 'patients', 'telehealth', 'diagnostics'],
    industryTerms: ['HIPAA', 'EHR', 'RPM', 'DTx', 'CPT', 'ICD-10'],
  },
  robotics: {
    id: 'robotics', name: 'Robotics', primaryMentorId: 'alex',
    heroGradientColors: ['#EA580C', '#D97706'],
    accentColor: '#F97316',
    gameDescription: 'Industrial automation and robotics challenges',
    drillDescription: 'Robot kinematics and automation facts',
    trainerDescription: 'Navigate deployment, safety, and integration decisions',
    keywords: ['robots', 'automation', 'cobot', 'arm', 'sensors'],
    industryTerms: ['DOF', 'Cobot', 'End-effector', 'ROS', 'PLC', 'AMR'],
  },
  cleanenergy: {
    id: 'cleanenergy', name: 'Clean Energy', primaryMentorId: 'maya',
    heroGradientColors: ['#CA8A04', '#EA580C'],
    accentColor: '#EAB308',
    gameDescription: 'Renewable energy and grid technology challenges',
    drillDescription: 'Solar, wind, and storage facts verification',
    trainerDescription: 'Navigate PPAs, interconnection, and project development',
    keywords: ['solar', 'wind', 'battery', 'grid', 'renewable'],
    industryTerms: ['PPA', 'LCOE', 'ITC', 'PTC', 'BESS', 'Interconnection'],
  },
  climatetech: {
    id: 'climatetech', name: 'Climate Tech', primaryMentorId: 'maya',
    heroGradientColors: ['#0D9488', '#059669'],
    accentColor: '#14B8A6',
    gameDescription: 'Carbon removal and climate solution challenges',
    drillDescription: 'DAC, carbon credits, and climate policy facts',
    trainerDescription: 'Navigate carbon markets and decarbonization decisions',
    keywords: ['carbon', 'climate', 'emissions', 'capture', 'offset'],
    industryTerms: ['DAC', 'CDR', '45Q', 'Scope 1/2/3', 'VCM', 'Net-zero'],
  },
  agtech: {
    id: 'agtech', name: 'AgTech', primaryMentorId: 'kai',
    heroGradientColors: ['#15803D', '#A16207'],
    accentColor: '#22C55E',
    gameDescription: 'Precision agriculture and food tech challenges',
    drillDescription: 'Farm technology and agricultural facts',
    trainerDescription: 'Navigate farmer adoption and agribusiness decisions',
    keywords: ['farm', 'agriculture', 'crops', 'livestock', 'precision'],
    industryTerms: ['VRT', 'RTK', 'NDVI', 'CEA', 'Biologicals', 'IoT'],
  },
  logistics: {
    id: 'logistics', name: 'Logistics Tech', primaryMentorId: 'kai',
    heroGradientColors: ['#1D4ED8', '#6D28D9'],
    accentColor: '#3B82F6',
    gameDescription: 'Supply chain and freight technology challenges',
    drillDescription: 'Trucking, warehousing, and delivery facts',
    trainerDescription: 'Navigate freight markets and automation decisions',
    keywords: ['freight', 'shipping', 'warehouse', 'delivery', 'trucking'],
    industryTerms: ['TMS', 'WMS', 'LTL', 'FTL', '3PL', 'Last-mile'],
  },
  web3: {
    id: 'web3', name: 'Web3 & Crypto', primaryMentorId: 'maya',
    heroGradientColors: ['#7C3AED', '#4338CA'],
    accentColor: '#8B5CF6',
    gameDescription: 'Blockchain and decentralized technology challenges',
    drillDescription: 'Crypto, DeFi, and smart contract facts',
    trainerDescription: 'Navigate tokenomics, security, and regulatory decisions',
    keywords: ['blockchain', 'crypto', 'token', 'DeFi', 'NFT'],
    industryTerms: ['TVL', 'L2', 'DAO', 'EVM', 'Gas', 'Staking'],
  },
};

export function getMarketConfig(marketId: string): MarketConfig {
  return marketConfigs[marketId] || marketConfigs.aerospace;
}

export function getPrimaryMentorForMarket(marketId: string): string {
  return getMarketConfig(marketId).primaryMentorId;
}
