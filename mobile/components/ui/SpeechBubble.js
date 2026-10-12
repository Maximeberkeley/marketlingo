import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../lib/constants";
import { isDark } from "../../lib/theme";
const BUBBLE_BG = isDark ? "#2A2440" : "#F3EEFE";
function pointerRadius(tail) {
  switch (tail) {
    case "left":
      return { borderTopLeftRadius: 6 };
    case "right":
      return { borderTopRightRadius: 6 };
    case "top-left":
      return { borderTopLeftRadius: 6 };
    case "top-center":
      return { borderTopLeftRadius: 6 };
    case "bottom-center":
    default:
      return { borderBottomLeftRadius: 6 };
  }
}
function SpeechBubble({
  children,
  text,
  tail = "left",
  showLabel = false,
  style,
  textStyle
}) {
  return <View style={[styles.wrap, style]}>{showLabel && <Text style={styles.label}>Leo</Text>}<View style={[styles.balloon, pointerRadius(tail)]}>{children ?? <Text style={[styles.text, textStyle]}>{text}</Text>}</View></View>;
}
const styles = StyleSheet.create({
  wrap: { alignSelf: "flex-start", maxWidth: 260 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accent,
    marginBottom: 4,
    marginLeft: 4
  },
  balloon: {
    backgroundColor: BUBBLE_BG,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignSelf: "flex-start"
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500"
  }
});
export {
  SpeechBubble
};
