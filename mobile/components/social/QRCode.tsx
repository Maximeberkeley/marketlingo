import React, { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { qrcodegen } from '../../lib/vendor/qrcodegen';

/** The dark modules of a QR code as one SVG path (1 unit per module). */
export function qrPath(text: string): { size: number; d: string } {
  const qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM);
  let d = '';
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.getModule(x, y)) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return { size: qr.size, d };
}

/** A scannable QR code. Always dark on white so every camera reads it, in both themes. */
export function QRCode({ value, size = 200, color = '#1A1F36' }: { value: string; size?: number; color?: string }) {
  const { size: modules, d } = useMemo(() => qrPath(value), [value]);
  const quiet = 2;
  const box = modules + quiet * 2;
  return (
    <Svg width={size} height={size} viewBox={`${-quiet} ${-quiet} ${box} ${box}`} accessibilityLabel="QR code for your invite link">
      <Rect x={-quiet} y={-quiet} width={box} height={box} fill="#FFFFFF" />
      <Path d={d} fill={color} />
    </Svg>
  );
}
