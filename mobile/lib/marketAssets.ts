import type { ImageSourcePropType } from 'react-native';

export const MARKET_ILLUSTRATIONS: Record<string, ImageSourcePropType> = {
  aerospace: require('../assets/illustrations/aerospace.png'),
  neuroscience: require('../assets/illustrations/neuroscience.png'),
  ai: require('../assets/illustrations/ai.png'),
  fintech: require('../assets/illustrations/fintech.png'),
  ev: require('../assets/illustrations/ev.png'),
  biotech: require('../assets/illustrations/biotech.png'),
  cleanenergy: require('../assets/illustrations/cleanenergy.png'),
  agtech: require('../assets/illustrations/agtech.png'),
  climatetech: require('../assets/illustrations/climatetech.png'),
  cybersecurity: require('../assets/illustrations/cybersecurity.png'),
  spacetech: require('../assets/illustrations/spacetech.png'),
  robotics: require('../assets/illustrations/robotics.png'),
  healthtech: require('../assets/illustrations/healthtech.png'),
  logistics: require('../assets/illustrations/logistics.png'),
  web3: require('../assets/illustrations/web3.png'),
};

const DEFAULT_LEO = require('../assets/mascot/leo-idle.png');

export const MARKET_LEO_IMAGES: Record<string, ImageSourcePropType> = {
  aerospace: require('../assets/mascot/industries/leo-aerospace.png'),
  agtech: require('../assets/mascot/industries/leo-agtech.png'),
  ai: require('../assets/mascot/industries/leo-ai.png'),
  biotech: require('../assets/mascot/industries/leo-biotech.png'),
  cleanenergy: require('../assets/mascot/industries/leo-cleanenergy.png'),
  climatetech: require('../assets/mascot/industries/leo-climatetech.png'),
  cybersecurity: require('../assets/mascot/industries/leo-cybersecurity.png'),
  ev: require('../assets/mascot/industries/leo-ev.png'),
  fintech: require('../assets/mascot/industries/leo-fintech.png'),
  healthtech: require('../assets/mascot/industries/leo-healthtech.png'),
};

export function getMarketIllustration(marketId?: string | null): ImageSourcePropType {
  return MARKET_ILLUSTRATIONS[marketId || ''] || MARKET_ILLUSTRATIONS.aerospace;
}

export function getMarketLeo(marketId?: string | null): ImageSourcePropType {
  return MARKET_LEO_IMAGES[marketId || ''] || DEFAULT_LEO;
}