/**
 * AppIcon — Clean vector icon component using @expo/vector-icons (Feather set).
 * Replaces all PNG APP_ICONS with crisp, scalable vector icons.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';

// Icon name mapping — Feather icons (same family as Lucide)
export const ICON_MAP = {
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
  home: 'home',
  settings: 'settings',
  lock: 'lock',
  check: 'check-circle',
  chevronRight: 'chevron-right',
  bell: 'bell',
  heart: 'heart',
  star: 'star',
  send: 'send',
  refresh: 'refresh-cw',
  clock: 'clock',
  bookmark: 'bookmark',
  share: 'share-2',
  download: 'download',
  trash: 'trash-2',
  plus: 'plus',
  x: 'x',
  arrowRight: 'arrow-right',
  arrowLeft: 'arrow-left',
  info: 'info',
  alertCircle: 'alert-circle',
  trendingUp: 'trending-up',
  compass: 'compass',
  map: 'map',
  briefcase: 'briefcase',
  dollarSign: 'dollar-sign',
  eye: 'eye',
  messageCircle: 'message-circle',
  users: 'users',
  coffee: 'coffee',
  cpu: 'cpu',
} as const;

export type AppIconName = keyof typeof ICON_MAP;

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
  /** Optional background circle/rounded-square */
  bg?: string;
  bgSize?: number;
  bgRadius?: number;
  style?: ViewStyle;
}

export function AppIcon({
  name,
  size = 22,
  color = COLORS.textPrimary,
  bg,
  bgSize,
  bgRadius,
  style,
}: AppIconProps) {
  const featherName = ICON_MAP[name] as keyof typeof Feather.glyphMap;

  if (bg) {
    const containerSize = bgSize || size * 2;
    const radius = bgRadius ?? containerSize / 2;
    return (
      <View
        style={[
          {
            width: containerSize,
            height: containerSize,
            borderRadius: radius,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
      >
        <Feather name={featherName} size={size} color={color} />
      </View>
    );
  }

  return (
    <View style={style}>
      <Feather name={featherName} size={size} color={color} />
    </View>
  );
}
