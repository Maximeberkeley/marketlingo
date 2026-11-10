import React from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { tokens } from "../theme/tokens";
import { triggerHaptic } from "../../lib/haptics";
import { playSound } from "../../lib/sounds";
import { ColorText } from "../components/ColorText";
import { shortLabel, shortPrompt } from "../text";
function Prompt({ text, eyebrow }) {
  const repeats = !!eyebrow && eyebrow.trim().split(/\s+/)[0].toLowerCase() === text.trim().split(/\s+/)[0].toLowerCase();
  return /* @__PURE__ */ React.createElement(View, { style: styles.promptWrap }, !!eyebrow && !repeats && /* @__PURE__ */ React.createElement(Text, { style: styles.eyebrow }, shortLabel(eyebrow).toUpperCase()), /* @__PURE__ */ React.createElement(ColorText, { text: shortPrompt(text), style: styles.prompt, maxLength: 120 }));
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function tick(good) {
  triggerHaptic(good ? "success" : "warning").catch(() => {
  });
  playSound(good ? "correct" : "wrong").catch(() => {
  });
}
function tap() {
  triggerHaptic("light").catch(() => {
  });
  playSound("tap").catch(() => {
  });
}
function useEnter(key) {
  const anim = React.useRef(new Animated.Value(1)).current;
  return anim;
}
function useShake() {
  const anim = React.useRef(new Animated.Value(0)).current;
  const shake = React.useCallback(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      easing: Easing.linear,
      useNativeDriver: true
    }).start();
  }, [anim]);
  const translateX = anim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -8, 8, -6, 4, 0]
  });
  return { shake, translateX };
}
const styles = StyleSheet.create({
  promptWrap: { gap: 6, marginBottom: tokens.space.lg },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    color: tokens.color.accent
  },
  prompt: {
    fontSize: tokens.font.prompt,
    fontWeight: "800",
    color: tokens.color.text,
    lineHeight: 27
  }
});
export {
  Prompt,
  shuffle,
  styles,
  tap,
  tick,
  useEnter,
  useShake
};
