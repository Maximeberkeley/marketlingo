import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { triggerHaptic } from "../../lib/haptics";
import { formatCountdown } from "../../lib/shopEconomy";
let reduceNow = false;
let reduceStarted = false;
const reduceListeners = /* @__PURE__ */ new Set();
function startReduceWatch() {
  if (reduceStarted) return;
  reduceStarted = true;
  const set = (v) => {
    reduceNow = v;
    reduceListeners.forEach((fn) => fn(v));
  };
  AccessibilityInfo.isReduceMotionEnabled().then(set).catch(() => {
  });
  AccessibilityInfo.addEventListener?.("reduceMotionChanged", set);
}
function useReduceMotion() {
  const [reduce, setReduce] = useState(reduceNow);
  useEffect(() => {
    startReduceWatch();
    reduceListeners.add(setReduce);
    setReduce(reduceNow);
    return () => {
      reduceListeners.delete(setReduce);
    };
  }, []);
  return reduce;
}
const MotionGate = createContext(true);
function MotionScope({ active, children }) {
  const parent = useContext(MotionGate);
  return /* @__PURE__ */ React.createElement(MotionGate.Provider, { value: parent && active }, children);
}
function useMotionOff() {
  const reduce = useReduceMotion();
  const on = useContext(MotionGate);
  return reduce || !on;
}
const ScrollWatch = createContext(null);
function useScrollWatch() {
  const ref = useRef({ y: 0, h: 900, fns: /* @__PURE__ */ new Set() });
  return useRef({
    subscribe: (fn) => {
      ref.current.fns.add(fn);
      return () => {
        ref.current.fns.delete(fn);
      };
    },
    get: () => ({ y: ref.current.y, h: ref.current.h }),
    onScroll: (y) => {
      ref.current.y = y;
      ref.current.fns.forEach((fn) => fn());
    },
    onViewport: (h) => {
      ref.current.h = h;
      ref.current.fns.forEach((fn) => fn());
    }
  }).current;
}
function useNow(active = true, every = 1e3) {
  const [now, setNow] = useState(() => /* @__PURE__ */ new Date());
  useEffect(() => {
    if (!active) return;
    setNow(/* @__PURE__ */ new Date());
    const id = setInterval(() => setNow(/* @__PURE__ */ new Date()), every);
    return () => clearInterval(id);
  }, [active, every]);
  return now;
}
function Countdown({ until, prefix = "", style }) {
  const on = useContext(MotionGate);
  const now = useNow(on);
  return /* @__PURE__ */ React.createElement(Text, { style, maxFontSizeMultiplier: 1.3, numberOfLines: 1 }, prefix, formatCountdown(until(now)));
}
function Sheen({ width = 360, every = 3600, delay = 0 }) {
  const reduce = useMotionOff();
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
  const reduce = useMotionOff();
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
  const watch = useContext(ScrollWatch);
  const [box, setBox] = useState(null);
  const [seen, setSeen] = useState(true);
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, { toValue: 1, duration: 380, delay: Math.min(index, 8) * 70, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [reduce, index, v]);
  useEffect(() => {
    if (!watch || !box) return;
    const check = () => {
      const { y, h } = watch.get();
      const on = box.y + box.h > y - 80 && box.y < y + h + 80;
      setSeen((prev) => prev === on ? prev : on);
    };
    check();
    return watch.subscribe(check);
  }, [watch, box]);
  const onLayout = (e) => {
    const { y, height } = e.nativeEvent.layout;
    setBox((prev) => prev && prev.y === y && prev.h === height ? prev : { y, h: height });
  };
  return /* @__PURE__ */ React.createElement(Animated.View, { onLayout: watch ? onLayout : void 0, style: [style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }] }, /* @__PURE__ */ React.createElement(MotionScope, { active: seen }, children));
}
function Spin({ children, period = 24e3, style }) {
  const reduce = useMotionOff();
  const r = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.timing(r, { toValue: 1, duration: period, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [reduce, period, r]);
  return /* @__PURE__ */ React.createElement(Animated.View, { pointerEvents: "none", style: [style, { transform: [{ rotate: r.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }] }, children);
}
function Twinkle({ children, phase = 0, period = 1800, style }) {
  const reduce = useMotionOff();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(phase),
      Animated.timing(v, { toValue: 1, duration: period / 2, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: period / 2, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.delay(Math.max(0, 1600 - phase))
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, phase, period, v]);
  return /* @__PURE__ */ React.createElement(Animated.View, { pointerEvents: "none", style: [style, { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] }) }] }] }, children);
}
function Pop({ children, delay = 0, style }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    Animated.sequence([Animated.delay(delay), Animated.spring(v, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true })]).start();
  }, [reduce, delay, v]);
  return /* @__PURE__ */ React.createElement(Animated.View, { style: [style, { opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }] }, children);
}
function PressScale({ children, onPress, style, accessibilityLabel, disabled }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue: v, friction: 6, tension: 260, useNativeDriver: true }).start();
  return /* @__PURE__ */ React.createElement(
    Pressable,
    {
      onPress,
      disabled,
      onPressIn: () => {
        to(0.965);
        triggerHaptic("light");
      },
      onPressOut: () => to(1),
      accessibilityRole: "button",
      accessibilityLabel
    },
    /* @__PURE__ */ React.createElement(Animated.View, { style: [style, { transform: [{ scale: s }] }] }, children)
  );
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
  Countdown,
  Dots,
  Float,
  MotionScope,
  Pop,
  PressScale,
  Rise,
  ScrollWatch,
  Sheen,
  Spin,
  Twinkle,
  useMotionOff,
  useNow,
  useReduceMotion,
  useScrollWatch
};
