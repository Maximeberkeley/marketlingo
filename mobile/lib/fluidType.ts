/**
 * Fluid Typography System for Mobile
 * Scales font sizes between iPhone SE (375pt) and iPhone Pro Max (430pt).
 * Ensures text is always legible on small screens and generous on large ones.
 */
import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Design reference points
const MIN_WIDTH = 375; // iPhone SE
const MAX_WIDTH = 430; // iPhone Pro Max

/**
 * Returns a fluid font size that scales between min and max
 * based on the device screen width.
 */
export function fluidFont(minSize: number, maxSize: number): number {
  if (SCREEN_WIDTH <= MIN_WIDTH) return minSize;
  if (SCREEN_WIDTH >= MAX_WIDTH) return maxSize;
  const ratio = (SCREEN_WIDTH - MIN_WIDTH) / (MAX_WIDTH - MIN_WIDTH);
  return Math.round(minSize + ratio * (maxSize - minSize));
}

/**
 * Fluid line height — maintains consistent ratio to font size.
 */
export function fluidLineHeight(minSize: number, maxSize: number, ratio: number = 1.6): number {
  return Math.round(fluidFont(minSize, maxSize) * ratio);
}

/**
 * Pre-computed fluid type scale for card content.
 */
export const FLUID = {
  heroTitle: fluidFont(24, 30),
  heroLineHeight: fluidLineHeight(24, 30, 1.25),
  cardTitle: fluidFont(16, 18),
  cardTitleLineHeight: fluidLineHeight(16, 18, 1.4),
  body: fluidFont(15, 17),
  bodyLineHeight: fluidLineHeight(15, 17, 1.65),
  caption: fluidFont(11, 13),
  bullet: fluidFont(14, 16),
  bulletLineHeight: fluidLineHeight(14, 16, 1.65),
  stat: fluidFont(16, 19),
  statLineHeight: fluidLineHeight(16, 19, 1.5),
  termLabel: fluidFont(14, 16),
  termDef: fluidFont(13, 15),
  termDefLineHeight: fluidLineHeight(13, 15, 1.55),
} as const;
