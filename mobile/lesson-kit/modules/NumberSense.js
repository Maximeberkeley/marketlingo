import { closeness } from "../screens/lessonCredit";
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, PanResponder, Animated } from "react-native";
import { tokens } from "../theme/tokens";
import { Prompt, tap } from "./shared";
function fmt(n, unit) {
  const abs = Math.abs(n);
  let s;
  if (abs >= 1e9) s = `${(n / 1e9).toFixed(1)}B`;
  else if (abs >= 1e6) s = `${(n / 1e6).toFixed(1)}M`;
  else if (abs >= 1e3) s = `${(n / 1e3).toFixed(1)}K`;
  else s = `${Math.round(n * 10) / 10}`;
  return unit ? `${s}${unit.length <= 2 ? unit : " " + unit}` : s;
}
function NumberSense({ exercise, phase, onChange }) {
  const [width, setWidth] = useState(0);
  const [ratio, setRatio] = useState(0);
  const [touched, setTouched] = useState(false);
  const startRatio = useRef(0);
  const ratioRef = useRef(0);
  const widthRef = useRef(0);
  const phaseRef = useRef(phase);
  const reveal = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(exercise.min);
  const tolerance = exercise.tolerance ?? 0.12;
  const guess = exercise.min + ratio * (exercise.max - exercise.min);
  const off = Math.abs(guess - exercise.value) / (exercise.max - exercise.min);
  const correct = off <= tolerance;
  ratioRef.current = ratio;
  widthRef.current = width;
  phaseRef.current = phase;
  useEffect(() => {
    setRatio(0);
    setTouched(false);
    reveal.setValue(0);
    const startOff = Math.abs(exercise.min - exercise.value) / (exercise.max - exercise.min);
    onChange({ canCheck: true, isCorrect: startOff <= (exercise.tolerance ?? 0.12), score: closeness(startOff, exercise.tolerance ?? 0.12) });
  }, [exercise.id]);
  useEffect(() => {
    if (phase !== "feedback") return;
    const id = reveal.addListener(({ value }) => {
      setShown(guess + (exercise.value - guess) * value);
    });
    Animated.timing(reveal, { toValue: 1, duration: 900, useNativeDriver: false }).start();
    return () => reveal.removeListener(id);
  }, [phase]);
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => phaseRef.current === "answering",
      onMoveShouldSetPanResponder: (_event, gesture) => phaseRef.current === "answering" && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onMoveShouldSetPanResponderCapture: (_event, gesture) => phaseRef.current === "answering" && Math.abs(gesture.dx) > 3 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: () => {
        startRatio.current = ratioRef.current;
        tap();
      },
      onPanResponderMove: (_e, g) => {
        if (!widthRef.current) return;
        const next = Math.min(1, Math.max(0, startRatio.current + g.dx / widthRef.current));
        ratioRef.current = next;
        setRatio(next);
        setTouched(true);
      },
      onPanResponderRelease: () => {
        setTouched(true);
      },
      onPanResponderTerminationRequest: () => false
    })
  ).current;
  useEffect(() => {
    onChange({ canCheck: true, isCorrect: correct, score: closeness(off, tolerance) });
  }, [ratio, touched, correct, off, tolerance]);
  const targetRatio = (exercise.value - exercise.min) / (exercise.max - exercise.min);
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(Prompt, { eyebrow: "Number sense", text: exercise.prompt }), /* @__PURE__ */ React.createElement(View, { style: styles.readoutWrap }, /* @__PURE__ */ React.createElement(Text, { style: styles.readout }, phase === "feedback" ? fmt(shown, exercise.unit) : fmt(guess, exercise.unit)), /* @__PURE__ */ React.createElement(Text, { style: styles.readoutLabel }, phase === "feedback" ? "the real number" : touched ? "your guess" : "drag to guess")), /* @__PURE__ */ React.createElement(
    View,
    {
      style: styles.trackWrap,
      onLayout: (e) => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      },
      ...responder.panHandlers
    },
    /* @__PURE__ */ React.createElement(View, { style: styles.track }),
    phase === "feedback" && /* @__PURE__ */ React.createElement(View, { style: [styles.target, { left: `${targetRatio * 100}%` }] }),
    /* @__PURE__ */ React.createElement(View, { style: [styles.fill, { width: `${ratio * 100}%` }] }),
    /* @__PURE__ */ React.createElement(View, { style: [styles.knob, { left: `${ratio * 100}%` }] })
  ), /* @__PURE__ */ React.createElement(View, { style: styles.scale }, /* @__PURE__ */ React.createElement(Text, { style: styles.scaleText }, fmt(exercise.min, exercise.unit)), /* @__PURE__ */ React.createElement(Text, { style: styles.scaleText }, fmt(exercise.max, exercise.unit))));
}
const styles = StyleSheet.create({
  wrap: { flex: 1 },
  readoutWrap: { alignItems: "center", marginVertical: tokens.space.xl, gap: 4 },
  readout: { fontSize: 46, fontWeight: "900", color: tokens.color.text, letterSpacing: -1 },
  readoutLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: tokens.color.textMuted,
    textTransform: "uppercase"
  },
  // Inset by half the knob so it never hangs past the screen gutter at 0% or 100%.
  trackWrap: { height: 44, justifyContent: "center", marginHorizontal: 15 },
  track: { height: 10, borderRadius: tokens.radius.pill, backgroundColor: tokens.color.track },
  fill: {
    position: "absolute",
    height: 10,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.accentFill
  },
  knob: {
    position: "absolute",
    width: 30,
    height: 30,
    marginLeft: -15,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.card,
    borderWidth: 3,
    borderColor: tokens.color.accent,
    shadowColor: "#1A1F36",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  target: {
    position: "absolute",
    width: 4,
    height: 28,
    marginLeft: -2,
    borderRadius: 2,
    backgroundColor: tokens.color.correct
  },
  scale: { flexDirection: "row", justifyContent: "space-between", marginTop: tokens.space.sm },
  scaleText: { fontSize: tokens.font.caption, fontWeight: "700", color: tokens.color.textMuted }
});
export {
  NumberSense
};
