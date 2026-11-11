import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LeoAvatar } from "../shop/LeoAvatar";
import { Pop } from "../shop/Motion";
import { FloorShadow, Sunburst, Twinkles } from "../shop/Scene";
const MEDALS = [
  { bg: "#FEF3C7", ring: "#F59E0B", text: "#B45309" },
  { bg: "#EEF2F7", ring: "#9CA3AF", text: "#4B5563" },
  { bg: "#FFEDD5", ring: "#FB923C", text: "#C2410C" }
];
const BLOCK = [92, 74, 64];
const LEO = [108, 88, 84];
const SINK = 0.045;
function LeoPodium({ people }) {
  if (people.length < 3) return null;
  return /* @__PURE__ */ React.createElement(View, { style: styles.podium, accessibilityRole: "summary", accessibilityLabel: `Top three: ${people.slice(0, 3).map((p, i) => `${i + 1}, ${p.name}, ${p.xp} XP`).join("; ")}` }, [1, 0, 2].map((i) => {
    const p = people[i];
    const m = MEDALS[i];
    const leo = LEO[i];
    return /* @__PURE__ */ React.createElement(View, { key: p.id, style: styles.col }, /* @__PURE__ */ React.createElement(View, { style: { width: leo + 24, height: leo } }, i === 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Sunburst, { size: 180, cx: (leo + 24) / 2, cy: leo * 0.55, color: "#FCD34D", opacity: 0.4, rays: 14 }), /* @__PURE__ */ React.createElement(Twinkles, { w: leo + 24, h: leo, color: "#F59E0B", points: [[0.04, 0.22, 12], [0.97, 0.14, 14], [0.95, 0.72, 9]] })), /* @__PURE__ */ React.createElement(FloorShadow, { width: leo * 0.74, cx: (leo + 24) / 2, y: leo, dark: 0.3 }), /* @__PURE__ */ React.createElement(Pop, { delay: [220, 80, 340][i], style: { position: "absolute", left: 12, bottom: -leo * SINK } }, /* @__PURE__ */ React.createElement(LeoAvatar, { look: p.look, crown: p.crown, size: leo, crop: false, name: p.name }))), /* @__PURE__ */ React.createElement(View, { style: [styles.block, { height: BLOCK[i], backgroundColor: m.bg, borderColor: m.ring + "66" }] }, /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.2, style: [styles.rank, { color: m.text }] }, i + 1), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.2, style: [styles.name, { color: p.isMe ? "#6D28D9" : "#1F2937" }], numberOfLines: 1 }, p.isMe ? "You" : p.name), /* @__PURE__ */ React.createElement(Text, { maxFontSizeMultiplier: 1.2, style: [styles.xp, { color: m.text }] }, p.xp.toLocaleString(), " XP")));
  }));
}
const styles = StyleSheet.create({
  podium: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 14, marginTop: 6 },
  col: { flex: 1, alignItems: "center" },
  block: { width: "100%", borderRadius: 16, borderWidth: 1.5, borderBottomWidth: 4, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  rank: { fontSize: 20, fontWeight: "900" },
  // Medal blocks stay pale in both themes, so their text stays dark.
  name: { fontSize: 12.5, fontWeight: "800", maxWidth: "100%" },
  xp: { fontSize: 11, fontWeight: "800", marginTop: 1 }
});
export {
  LeoPodium
};
