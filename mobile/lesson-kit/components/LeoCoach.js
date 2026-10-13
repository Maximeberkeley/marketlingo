import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, Image } from "react-native";
import { tokens } from "../theme/tokens";
import { LeoCharacter } from "../../components/mascot/LeoCharacter";
import { ColorText } from "./ColorText";
import { SpeechBubble } from "../../components/ui/SpeechBubble";
const ANIM = {
  idle: "idle",
  thinking: "thinking",
  celebrate: "celebrating",
  correct: "success",
  incorrect: "failure"
};
const SCENES = {
  // idle: require('../../../assets/scenes/leo-scene-idle.png'),
  // thinking: require('../../../assets/scenes/leo-scene-thinking.png'),
  // celebrate: require('../../../assets/scenes/leo-scene-celebrate.png'),
  // correct: require('../../../assets/scenes/leo-scene-correct.png'),
  // incorrect: require('../../../assets/scenes/leo-scene-incorrect.png'),
};
const BUBBLE_DELAY_MS = 900;
function LeoCoach({ line, mood = "idle", accent = tokens.color.accent }) {
  const enter = useRef(new Animated.Value(0)).current;
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    setSpeaking(false);
    enter.setValue(0);
    const timer = setTimeout(() => {
      setSpeaking(true);
      Animated.spring(enter, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true
      }).start();
    }, BUBBLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [line, mood, enter]);
  const pop = enter.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] });
  const rise = enter.interpolate({ inputRange: [0, 1], outputRange: [6, 0] });
  const moodTint = mood === "correct" || mood === "celebrate" ? tokens.color.correct : mood === "incorrect" ? tokens.color.incorrect : accent;
  const scene = SCENES[mood];
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(View, { style: styles.scene }, scene ? /* @__PURE__ */ React.createElement(Image, { source: scene, style: StyleSheet.absoluteFill, resizeMode: "cover" }) : null, /* @__PURE__ */ React.createElement(View, { style: styles.leo, pointerEvents: "none" }, /* @__PURE__ */ React.createElement(LeoCharacter, { animation: ANIM[mood], size: "sm", still: true })), /* @__PURE__ */ React.createElement(View, { style: styles.bubbleSlot }, /* @__PURE__ */ React.createElement(
    Animated.View,
    {
      pointerEvents: speaking ? "auto" : "none",
      accessibilityElementsHidden: !speaking,
      importantForAccessibility: speaking ? "auto" : "no-hide-descendants",
      style: [
        styles.bubbleWrap,
        { opacity: enter, transform: [{ scale: pop }, { translateY: rise }] }
      ]
    },
    /* @__PURE__ */ React.createElement(SpeechBubble, { tail: "left", showLabel: true, style: styles.bubble }, /* @__PURE__ */ React.createElement(ColorText, { text: line, style: styles.text, maxSentences: 2, maxLength: 110 }))
  ))));
}
const SCENE_H = 112;
const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: tokens.space.lg,
    marginBottom: tokens.space.sm
  },
  scene: {
    minHeight: SCENE_H,
    flexDirection: "row",
    alignItems: "flex-end"
  },
  leo: {
    width: 94,
    height: SCENE_H,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
    zIndex: 1
  },
  bubbleSlot: {
    flex: 1,
    alignSelf: "center",
    marginRight: tokens.space.sm,
    marginLeft: 14,
    position: "relative",
    // Always above Leo — even if his artwork overhangs, the words stay readable.
    zIndex: 2
  },
  bubbleWrap: { width: "100%" },
  bubble: { width: "100%" },
  text: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: tokens.color.text
  }
});
export {
  LeoCoach
};
