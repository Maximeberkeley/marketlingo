import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** A small gold crown worn by whoever leads the friends board this month. */
export function CrownBadge({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.75} viewBox="0 0 32 24" accessibilityLabel="Crown">
      <Path d="M3 9 L9.5 14 L16 4.5 L22.5 14 L29 9 L26.8 19.5 H5.2 Z" fill="#FBBF24" stroke="#B7791F" strokeWidth={1.4} strokeLinejoin="round" />
      <Rect x={5} y={18.2} width={22} height={4.3} rx={1.3} fill="#F59E0B" stroke="#B7791F" strokeWidth={1.4} />
      <Circle cx={3} cy={8.6} r={2} fill="#FCD34D" stroke="#B7791F" strokeWidth={1.2} />
      <Circle cx={16} cy={4} r={2.1} fill="#FCD34D" stroke="#B7791F" strokeWidth={1.2} />
      <Circle cx={29} cy={8.6} r={2} fill="#FCD34D" stroke="#B7791F" strokeWidth={1.2} />
      <Circle cx={16} cy={20.35} r={1.5} fill="#DC2626" />
      <Circle cx={10} cy={20.35} r={1.1} fill="#DC2626" />
      <Circle cx={22} cy={20.35} r={1.1} fill="#DC2626" />
    </Svg>
  );
}
