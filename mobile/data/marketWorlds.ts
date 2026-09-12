import { ImageSourcePropType } from 'react-native';

export interface MarketWorld {
  id: string;
  name: string;
  worldName: string;
  setName: string;
  motif: string;
  vocabulary: string;
  leoRole: string;
  progressTitle: string;
  colors: [string, string, string];
  illustration: ImageSourcePropType;
}

export const MARKET_WORLDS: Record<string, MarketWorld> = {
  aerospace: { id: 'aerospace', name: 'Aerospace', worldName: 'The Flight Deck', setName: 'Skybound Crew', motif: 'altitude lines', vocabulary: 'missions', leoRole: 'Flight Director', progressTitle: 'Clearance Level', colors: ['#2563EB', '#0EA5E9', '#F59E0B'], illustration: require('../assets/illustrations/aerospace.png') },
  agtech: { id: 'agtech', name: 'AgTech', worldName: 'The Living Grid', setName: 'Field Intelligence', motif: 'field contours', vocabulary: 'harvests', leoRole: 'Field Strategist', progressTitle: 'Yield Level', colors: ['#15803D', '#84CC16', '#F59E0B'], illustration: require('../assets/illustrations/agtech.png') },
  ai: { id: 'ai', name: 'AI Industry', worldName: 'The Model Lab', setName: 'Machine Minds', motif: 'neural paths', vocabulary: 'runs', leoRole: 'Research Lead', progressTitle: 'Model Level', colors: ['#059669', '#06B6D4', '#8B5CF6'], illustration: require('../assets/illustrations/ai.png') },
  biotech: { id: 'biotech', name: 'Biotech', worldName: 'The Discovery Lab', setName: 'Life Science Guild', motif: 'molecular chains', vocabulary: 'trials', leoRole: 'Program Lead', progressTitle: 'Discovery Stage', colors: ['#DB2777', '#F43F5E', '#06B6D4'], illustration: require('../assets/illustrations/biotech.png') },
  cleanenergy: { id: 'cleanenergy', name: 'Clean Energy', worldName: 'The Power Grid', setName: 'Grid Pioneers', motif: 'energy currents', vocabulary: 'dispatches', leoRole: 'Grid Operator', progressTitle: 'Grid Access', colors: ['#CA8A04', '#22C55E', '#0EA5E9'], illustration: require('../assets/illustrations/cleanenergy.png') },
  climatetech: { id: 'climatetech', name: 'Climate Tech', worldName: 'The Carbon Frontier', setName: 'Climate Operators', motif: 'carbon loops', vocabulary: 'deployments', leoRole: 'Impact Strategist', progressTitle: 'Impact Level', colors: ['#0D9488', '#10B981', '#3B82F6'], illustration: require('../assets/illustrations/climatetech.png') },
  cybersecurity: { id: 'cybersecurity', name: 'Cybersecurity', worldName: 'The Security Operations Center', setName: 'Threat Hunters', motif: 'signal traces', vocabulary: 'incidents', leoRole: 'Watch Commander', progressTitle: 'Clearance Level', colors: ['#DC2626', '#F97316', '#334155'], illustration: require('../assets/illustrations/cybersecurity.png') },
  ev: { id: 'ev', name: 'Electric Vehicles', worldName: 'The Electric Circuit', setName: 'Mobility Makers', motif: 'charge routes', vocabulary: 'laps', leoRole: 'Platform Chief', progressTitle: 'Charge Level', colors: ['#65A30D', '#06B6D4', '#2563EB'], illustration: require('../assets/illustrations/ev.png') },
  fintech: { id: 'fintech', name: 'Fintech', worldName: 'The Money Rails', setName: 'Capital Operators', motif: 'transaction flows', vocabulary: 'deals', leoRole: 'Desk Captain', progressTitle: 'Desk Level', colors: ['#16A34A', '#0D9488', '#F59E0B'], illustration: require('../assets/illustrations/fintech.png') },
  healthtech: { id: 'healthtech', name: 'HealthTech', worldName: 'The Care Network', setName: 'Care Architects', motif: 'care pathways', vocabulary: 'cases', leoRole: 'Care Navigator', progressTitle: 'Care Level', colors: ['#0891B2', '#3B82F6', '#EC4899'], illustration: require('../assets/illustrations/healthtech.png') },
  logistics: { id: 'logistics', name: 'Logistics & Retail', worldName: 'The Flow Network', setName: 'Commerce Command', motif: 'route maps', vocabulary: 'moves', leoRole: 'Network Controller', progressTitle: 'Network Level', colors: ['#1D4ED8', '#F97316', '#7C3AED'], illustration: require('../assets/illustrations/logistics.png') },
  neuroscience: { id: 'neuroscience', name: 'Neuroscience', worldName: 'The Neural Atlas', setName: 'Brain Explorers', motif: 'synaptic maps', vocabulary: 'signals', leoRole: 'Lab Guide', progressTitle: 'Insight Level', colors: ['#7C3AED', '#EC4899', '#06B6D4'], illustration: require('../assets/illustrations/neuroscience.png') },
  robotics: { id: 'robotics', name: 'Robotics', worldName: 'The Automation Floor', setName: 'Machine Builders', motif: 'motion paths', vocabulary: 'cycles', leoRole: 'Systems Chief', progressTitle: 'Build Level', colors: ['#EA580C', '#64748B', '#0EA5E9'], illustration: require('../assets/illustrations/robotics.png') },
  spacetech: { id: 'spacetech', name: 'Space Tech', worldName: 'Mission Control', setName: 'Orbital Crew', motif: 'orbital arcs', vocabulary: 'orbits', leoRole: 'Mission Director', progressTitle: 'Mission Level', colors: ['#475569', '#6366F1', '#F59E0B'], illustration: require('../assets/illustrations/spacetech.png') },
  web3: { id: 'web3', name: 'Web3 & Crypto', worldName: 'The Protocol Layer', setName: 'Chain Architects', motif: 'block paths', vocabulary: 'epochs', leoRole: 'Protocol Steward', progressTitle: 'Protocol Level', colors: ['#7C3AED', '#2563EB', '#14B8A6'], illustration: require('../assets/illustrations/web3.png') },
};

export function getMarketWorld(marketId?: string | null): MarketWorld {
  return MARKET_WORLDS[marketId || 'aerospace'] || MARKET_WORLDS.aerospace;
}
