/**
 * Central icon registry — polished AI-generated 3D icons.
 * Import and use these instead of emojis for a premium look.
 */

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
