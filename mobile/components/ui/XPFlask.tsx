import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';

/** MarketLingo's XP icon (the flask from the Home XP badge). Use it wherever XP is shown as a reward. */
export function XPFlask({ size = 16, color }: { size?: number; color?: string }) {
  return <MaterialCommunityIcons name="flask" size={size} color={color ?? COLORS.xpBadgeIcon} />;
}
