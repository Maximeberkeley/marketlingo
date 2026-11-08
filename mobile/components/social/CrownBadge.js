import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";
function CrownBadge({ size = 28 }) {
  return /* @__PURE__ */ React.createElement(Svg, { width: size, height: size * 0.75, viewBox: "0 0 32 24", accessibilityLabel: "Crown" }, /* @__PURE__ */ React.createElement(Path, { d: "M3 9 L9.5 14 L16 4.5 L22.5 14 L29 9 L26.8 19.5 H5.2 Z", fill: "#FBBF24", stroke: "#B7791F", strokeWidth: 1.4, strokeLinejoin: "round" }), /* @__PURE__ */ React.createElement(Rect, { x: 5, y: 18.2, width: 22, height: 4.3, rx: 1.3, fill: "#F59E0B", stroke: "#B7791F", strokeWidth: 1.4 }), /* @__PURE__ */ React.createElement(Circle, { cx: 3, cy: 8.6, r: 2, fill: "#FCD34D", stroke: "#B7791F", strokeWidth: 1.2 }), /* @__PURE__ */ React.createElement(Circle, { cx: 16, cy: 4, r: 2.1, fill: "#FCD34D", stroke: "#B7791F", strokeWidth: 1.2 }), /* @__PURE__ */ React.createElement(Circle, { cx: 29, cy: 8.6, r: 2, fill: "#FCD34D", stroke: "#B7791F", strokeWidth: 1.2 }), /* @__PURE__ */ React.createElement(Circle, { cx: 16, cy: 20.35, r: 1.5, fill: "#DC2626" }), /* @__PURE__ */ React.createElement(Circle, { cx: 10, cy: 20.35, r: 1.1, fill: "#DC2626" }), /* @__PURE__ */ React.createElement(Circle, { cx: 22, cy: 20.35, r: 1.1, fill: "#DC2626" }));
}
export {
  CrownBadge
};
