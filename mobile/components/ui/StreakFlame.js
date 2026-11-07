import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
function StreakFlame({ size = 18, color, dim = false }) {
  return /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "fire", size, color: color ?? (dim ? COLORS.textMuted : COLORS.streak) });
}
export {
  StreakFlame
};
