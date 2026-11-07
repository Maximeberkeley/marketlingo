import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
function XPFlask({ size = 16, color }) {
  return /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "flask", size, color: color ?? COLORS.xpBadgeIcon });
}
export {
  XPFlask
};
