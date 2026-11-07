import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';

/** MarketLingo's streak logo (the flame from the Home streak badge). Use it instead of a fire emoji. */
export function StreakFlame({ size = 18, color, dim = false }: { size?: number; color?: string; dim?: boolean }) {
  return <MaterialCommunityIcons name="fire" size={size} color={color ?? (dim ? COLORS.textMuted : COLORS.streak)} />;
}
