/**
 * Central icon registry — migrated to Feather vector icons.
 * 
 * APP_ICONS is kept as a compatibility layer mapping icon keys to Feather icon names.
 * Use the AppIcon component or Feather directly for new code.
 * 
 * Legacy PNG requires are preserved for components that still use <Image source={...} />.
 * These should be migrated to <Feather name={...} /> over time.
 */
import { Feather } from '@expo/vector-icons';

// Feather icon name mapping (Lucide-compatible)
export const ICON_NAMES: Record<string, keyof typeof Feather.glyphMap> = {
  games: 'play-circle',
  drills: 'zap',
  trainer: 'target',
  quests: 'flag',
  learn: 'book-open',
  progress: 'bar-chart-2',
  passport: 'globe',
  notebook: 'edit-3',
  lens: 'search',
  concept: 'layers',
  slides: 'layout',
  achievements: 'award',
  news: 'file-text',
  regulatory: 'shield',
  streak: 'activity',
  profile: 'user',
} as const;

// Legacy compatibility — still used by some components via <Image source={APP_ICONS.x} />
// These can be gradually removed as components migrate to Feather icons
export const APP_ICONS = {
  games: require('../assets/icons/games-icon.png'),
  drills: require('../assets/icons/drills-icon.png'),
  trainer: require('../assets/icons/trainer-icon.png'),
  quests: require('../assets/icons/quests-icon.png'),
  learn: require('../assets/icons/learn-icon.png'),
  progress: require('../assets/icons/progress-icon.png'),
  passport: require('../assets/icons/passport-icon.png'),
  notebook: require('../assets/icons/notebook-icon.png'),
  lens: require('../assets/icons/lens-icon.png'),
  concept: require('../assets/icons/concept-icon.png'),
  slides: require('../assets/icons/slides-icon.png'),
  achievements: require('../assets/icons/achievements-icon.png'),
  news: require('../assets/icons/news-icon.png'),
  regulatory: require('../assets/icons/regulatory-icon.png'),
  streak: require('../assets/icons/streak-icon.png'),
  profile: require('../assets/icons/profile-icon.png'),
} as const;

export type AppIconKey = keyof typeof APP_ICONS;
export type FeatherIconName = keyof typeof Feather.glyphMap;
