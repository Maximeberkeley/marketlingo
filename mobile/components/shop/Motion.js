import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (live) setReduce(v);
    }).catch(() => {
    });
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReduce);
    return () => {
      live = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}
function useNow(active = true) {
  const [now, setNow] = useState(() => /* @__PURE__ */ new Date());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
    return () => clearInterval(id);
  }, [active]);
  return now;
}
function Sheen({ width = 360, every = 3600, delay = 0 }) {
  const reduce = useReduceMotion();
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(x, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.delay(Math.max(0, every - 1100 - delay)),
      Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true })
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, every, delay, x]);
  if (reduce) return null;
  return /* @__PURE__ */ React.createElement(Animated.View, { pointerEvents: "none", style: [StyleSheet.absoluteFill, { transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.6, width * 1.2] }) }, { skewX: "-18deg" }] }] }, /* @__PURE__ */ React.createElement(LinearGradient, { colors: ["rgba(255,255,255,0)", "rgba(255,255,255,0.28)", "rgba(255,255,255,0)"], start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 }, style: { width: 90, height: "100%" } }));
}
function Float({ children, distance = 5, phase = 0, style }) {
  const reduce = useReduceMotion();
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(phase),
      Animated.timing(y, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, phase, y]);
  return /* @__PURE__ */ React.createElement(Animated.View, { style: [style, { transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] }) }] }] }, children);
}
function Rise({ index, children, style }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, { toValue: 1, duration: 380, delay: Math.min(index, 8) * 70, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [reduce, index, v]);
  return /* @__PURE__ */ React.createElement(Animated.View, { style: [style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }] }, children);
}
function Dots({ count, index, color, idle }) {
  if (count < 2) return null;
  return /* @__PURE__ */ React.createElement(View, { style: styles.dots }, Array.from({ length: count }, (_, i) => /* @__PURE__ */ React.createElement(View, { key: i, style: [styles.dot, { backgroundColor: i === index ? color : idle, width: i === index ? 18 : 6 }] })));
}
const styles = StyleSheet.create({
  dots: { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 10 },
  dot: { height: 6, borderRadius: 3 }
});
export {
  Dots,
  Float,
  Rise,
  Sheen,
  useNow,
  useReduceMotion
};
