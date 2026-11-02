import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../lib/constants";
import { LeoAnimated } from "../mascot/LeoAnimated";
const SHOW_DELAY_MS = 250;
const FADE_MS = 200;
function HomeSkeleton() {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
      Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: true }).start();
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [opacity]);
  return /* @__PURE__ */ React.createElement(View, { style: [styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }] }, visible && /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.centre, { opacity }] }, /* @__PURE__ */ React.createElement(LeoAnimated, { clip: "leo-loading-loop", size: 200, fallback: "idle" }), /* @__PURE__ */ React.createElement(Text, { style: styles.line }, "Untangling today's lesson\u2026")));
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg0,
    alignItems: "center",
    justifyContent: "center"
  },
  centre: {
    alignItems: "center"
  },
  line: {
    marginTop: 16,
    fontSize: 15,
    color: COLORS.textSecondary
  }
});
export {
  HomeSkeleton
};
