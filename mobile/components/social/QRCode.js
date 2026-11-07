import React, { useMemo } from "react";
import Svg, { Path, Rect } from "react-native-svg";
import { qrcodegen } from "../../lib/vendor/qrcodegen";
function qrPath(text) {
  const qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM);
  let d = "";
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.getModule(x, y)) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return { size: qr.size, d };
}
function QRCode({ value, size = 200, color = "#1A1F36" }) {
  const { size: modules, d } = useMemo(() => qrPath(value), [value]);
  const quiet = 2;
  const box = modules + quiet * 2;
  return /* @__PURE__ */ React.createElement(Svg, { width: size, height: size, viewBox: `${-quiet} ${-quiet} ${box} ${box}`, accessibilityLabel: "QR code for your invite link" }, /* @__PURE__ */ React.createElement(Rect, { x: -quiet, y: -quiet, width: box, height: box, fill: "#FFFFFF" }), /* @__PURE__ */ React.createElement(Path, { d, fill: color }));
}
export {
  QRCode,
  qrPath
};
