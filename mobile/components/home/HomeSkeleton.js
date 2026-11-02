import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Animated, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../lib/constants";
import { LeoAnimated } from "../mascot/LeoAnimated";
import { createLoadingLeoController, LOADING_LEO_TIMING } from "./loadingLeoController";
const LOADING_STILL = require("../../assets/mascot/anim/leo-loading-still.png");
const LoadingLeoContext = createContext(null);
function LoadingLeo() {
  return /* @__PURE__ */ React.createElement(View, { style: styles.centre }, /* @__PURE__ */ React.createElement(LeoAnimated, { clip: "leo-loading-loop", size: 200, fallback: LOADING_STILL }), /* @__PURE__ */ React.createElement(Text, { style: styles.line }, "Untangling today's lesson\u2026"));
}
function LoadingLeoHost({ children }) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(false);
  const controller = useMemo(() => createLoadingLeoController({
    show: () => {
      opacity.stopAnimation();
      setShown(true);
      Animated.timing(opacity, { toValue: 1, duration: LOADING_LEO_TIMING.fadeInMs, useNativeDriver: true }).start();
    },
    hide: () => {
      opacity.stopAnimation();
      Animated.timing(opacity, { toValue: 0, duration: LOADING_LEO_TIMING.fadeOutMs, useNativeDriver: true }).start(({ finished }) => {
        if (finished) controller.hidden();
      });
    },
    unmount: () => setShown(false)
  }), [opacity]);
  useEffect(() => () => controller.dispose(), [controller]);
  return /* @__PURE__ */ React.createElement(LoadingLeoContext.Provider, { value: controller }, /* @__PURE__ */ React.createElement(View, { style: styles.host }, children, shown && /* @__PURE__ */ React.createElement(
    Animated.View,
    {
      pointerEvents: "none",
      style: [StyleSheet.absoluteFill, styles.overlay, { opacity, paddingTop: insets.top, paddingBottom: insets.bottom }]
    },
    /* @__PURE__ */ React.createElement(LoadingLeo, null)
  )));
}
function StandaloneSkeleton() {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
      Animated.timing(opacity, { toValue: 1, duration: LOADING_LEO_TIMING.fadeInMs, useNativeDriver: true }).start();
    }, LOADING_LEO_TIMING.showDelayMs);
    return () => clearTimeout(timer);
  }, [opacity]);
  return /* @__PURE__ */ React.createElement(View, { style: [styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }] }, visible && /* @__PURE__ */ React.createElement(Animated.View, { style: { opacity } }, /* @__PURE__ */ React.createElement(LoadingLeo, null)));
}
function HomeSkeleton() {
  const host = useContext(LoadingLeoContext);
  useEffect(() => {
    if (!host) return;
    host.add();
    return () => host.remove();
  }, [host]);
  if (host) return /* @__PURE__ */ React.createElement(View, { style: styles.container });
  return /* @__PURE__ */ React.createElement(StandaloneSkeleton, null);
}
const styles = StyleSheet.create({
  host: {
    flex: 1
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg0,
    alignItems: "center",
    justifyContent: "center"
  },
  overlay: {
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
  HomeSkeleton,
  LoadingLeoHost
};
