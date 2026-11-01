import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SHADOWS } from "../../lib/constants";
import { saveDemoMarket, saveDemoXP } from "../../lib/demoXPBridge";
import { storage } from "../../lib/storage";
import { triggerCelebration, triggerHaptic } from "../../lib/haptics";
import { playSound } from "../../lib/sounds";
import { ConfettiBurst } from "../ui/ConfettiBurst";
const TOKENS = [
  { word: "torque", chance: "92%", correct: true },
  { word: "music", chance: "5%", correct: false },
  { word: "engine", chance: "1%", correct: false }
];
const QUIZ_OPTIONS = [
  "It plans an outline of the conclusion before writing word one.",
  "It calculates backwards from the final answer to the prompt.",
  "It has zero idea how the sentence ends until it generates the final word.",
  "It selects a complete pre-written answer from memory."
];
function DemoLesson({ onComplete, onSkip }) {
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState(0);
  const [token, setToken] = useState(null);
  const [attentionRevealed, setAttentionRevealed] = useState(false);
  const [wrongAnswer, setWrongAnswer] = useState(null);
  const [correct, setCorrect] = useState(false);
  const [rewardSaved, setRewardSaved] = useState(false);
  const content = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const attention = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    void saveDemoMarket("ai");
  }, []);
  const moveTo = (next) => {
    content.setValue(0);
    setStage(next);
    Animated.timing(content, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  };
  const revealAttention = () => {
    if (attentionRevealed) return;
    setAttentionRevealed(true);
    void triggerHaptic("selection");
    void playSound("tap");
    Animated.spring(attention, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
  };
  const answerQuiz = (index) => {
    if (correct) return;
    if (index !== 2) {
      setWrongAnswer(index);
      void triggerHaptic("warning");
      void playSound("wrong");
      shake.setValue(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: 8, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -8, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 5, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 55, useNativeDriver: true })
      ]).start();
      return;
    }
    setWrongAnswer(null);
    setCorrect(true);
    void triggerCelebration();
    void playSound("celebration");
  };
  const finishQuiz = async () => {
    if (!rewardSaved) {
      await Promise.all([saveDemoXP(20), storage.setDemoStatus("completed")]);
      setRewardSaved(true);
    }
    moveTo(3);
  };
  const skip = async () => {
    await storage.setDemoStatus("skipped");
    onSkip();
  };
  const activeStep = Math.min(stage, 2);
  return /* @__PURE__ */ React.createElement(View, { style: [styles.screen, { paddingTop: insets.top + 6 }] }, /* @__PURE__ */ React.createElement(ConfettiBurst, { show: correct || stage === 3, count: 30 }), /* @__PURE__ */ React.createElement(View, { style: styles.topBar }, /* @__PURE__ */ React.createElement(View, { style: styles.progressWrap, accessibilityLabel: `Demo step ${activeStep + 1} of 3` }, ["Step 1", "Step 2", "Quiz"].map((label, index) => /* @__PURE__ */ React.createElement(View, { key: label, style: styles.progressItem }, /* @__PURE__ */ React.createElement(View, { style: [styles.progressTrack, index <= activeStep && styles.progressTrackActive] }), /* @__PURE__ */ React.createElement(Text, { style: [styles.progressLabel, index === activeStep && styles.progressLabelActive] }, label)))), stage < 3 && /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.skipButton, onPress: skip, accessibilityRole: "button", accessibilityLabel: "Skip demo lesson" }, /* @__PURE__ */ React.createElement(Text, { style: styles.skipText }, "Skip"), /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 16, color: COLORS.textSecondary }))), /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.flex, {
    opacity: content,
    transform: [{ translateY: content.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }]
  }] }, /* @__PURE__ */ React.createElement(ScrollView, { contentContainerStyle: [styles.content, { paddingBottom: insets.bottom + 28 }], showsVerticalScrollIndicator: false }, stage === 0 && /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Tag, null, "HOW AI ACTUALLY WORKS"), /* @__PURE__ */ React.createElement(Text, { style: styles.eyebrow }, "THE NEXT-TOKEN MACHINE \xB7 CONCEPT 1/3"), /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "What is an LLM doing right now?"), /* @__PURE__ */ React.createElement(Image, { source: require("../../assets/mascot/leo_AImachinelearning.png"), style: styles.heroLeo, resizeMode: "contain" }), /* @__PURE__ */ React.createElement(View, { style: styles.promptCard }, /* @__PURE__ */ React.createElement(Text, { style: styles.promptLead }, "Predict the next word"), /* @__PURE__ */ React.createElement(Text, { style: styles.sentence }, "\u201CThe best thing about an electric car is the instant\u2026\u201D"), /* @__PURE__ */ React.createElement(View, { style: styles.chips }, TOKENS.map((item) => {
    const selected = token === item.word;
    return /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        key: item.word,
        style: [styles.wordChip, selected && styles.wordChipSelected],
        onPress: () => {
          setToken(item.word);
          void triggerHaptic("selection");
          void playSound("tap");
        },
        accessibilityRole: "button",
        accessibilityState: { selected }
      },
      /* @__PURE__ */ React.createElement(Text, { style: [styles.word, selected && styles.wordSelected] }, item.word),
      /* @__PURE__ */ React.createElement(Text, { style: [styles.chance, selected && styles.chanceSelected] }, item.chance)
    );
  }))), token && /* @__PURE__ */ React.createElement(Takeaway, { icon: "cpu" }, "AI models are not searching Google or databases. They are massive mathematical prediction engines calculating the single most likely next word fragment."), /* @__PURE__ */ React.createElement(Primary, { label: "Continue", disabled: !token, onPress: () => moveTo(1) })), stage === 1 && /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Tag, null, "THE SECRET SAUCE"), /* @__PURE__ */ React.createElement(Text, { style: styles.eyebrow }, "THE ATTENTION SPARK \xB7 CONCEPT 2/3"), /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "How does it understand context?"), /* @__PURE__ */ React.createElement(View, { style: styles.attentionCard }, /* @__PURE__ */ React.createElement(View, { style: styles.sentenceLine }, /* @__PURE__ */ React.createElement(View, { style: styles.anchorWord }, /* @__PURE__ */ React.createElement(Text, { style: styles.sentenceWordStrong }, "trophy")), /* @__PURE__ */ React.createElement(Text, { style: styles.sentenceText }, "The ")), /* @__PURE__ */ React.createElement(Text, { style: styles.contextSentence }, "The ", /* @__PURE__ */ React.createElement(Text, { style: styles.sentenceWordStrong }, "trophy"), " didn't fit in the suitcase because", " ", /* @__PURE__ */ React.createElement(Text, { style: styles.itWord, onPress: revealAttention }, "IT"), " was too big."), /* @__PURE__ */ React.createElement(View, { style: styles.connectionArea, pointerEvents: "none" }, /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.connectionLine, {
    opacity: attention,
    transform: [{ scaleX: attention }]
  }] }), /* @__PURE__ */ React.createElement(Animated.View, { style: [styles.spark, { opacity: attention }] })), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.tapIt, onPress: revealAttention }, /* @__PURE__ */ React.createElement(Feather, { name: attentionRevealed ? "link-2" : "mouse-pointer", size: 16, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.tapItText }, attentionRevealed ? "IT connects to trophy" : "Tap \u201CIT\u201D to reveal the connection"))), attentionRevealed && /* @__PURE__ */ React.createElement(Takeaway, { icon: "git-merge" }, "Older algorithms forgot earlier words. Modern Transformers use \u201CSelf-Attention\u201D to map relationships between all words simultaneously, giving AI the illusion of reasoning."), /* @__PURE__ */ React.createElement(Primary, { label: "Ready for the Test", disabled: !attentionRevealed, onPress: () => moveTo(2) })), stage === 2 && /* @__PURE__ */ React.createElement(Animated.View, { style: { transform: [{ translateX: shake }] } }, /* @__PURE__ */ React.createElement(Tag, null, "MIND-BLOWN TEST"), /* @__PURE__ */ React.createElement(Text, { style: styles.eyebrow }, "ONE LAST PREDICTION"), /* @__PURE__ */ React.createElement(Text, { style: styles.quizTitle }, "When an AI writes a 500-word essay, when does it decide how the final sentence will conclude?"), /* @__PURE__ */ React.createElement(View, { style: styles.options }, QUIZ_OPTIONS.map((option, index) => {
    const isWrong = wrongAnswer === index;
    const isCorrect = correct && index === 2;
    return /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        key: option,
        style: [styles.option, isWrong && styles.optionWrong, isCorrect && styles.optionCorrect],
        onPress: () => answerQuiz(index),
        disabled: correct
      },
      /* @__PURE__ */ React.createElement(View, { style: [styles.optionLetter, isWrong && styles.optionLetterWrong, isCorrect && styles.optionLetterCorrect] }, /* @__PURE__ */ React.createElement(Text, { style: styles.optionLetterText }, String.fromCharCode(65 + index))),
      /* @__PURE__ */ React.createElement(Text, { style: styles.optionText }, option),
      isCorrect && /* @__PURE__ */ React.createElement(Feather, { name: "check-circle", size: 20, color: COLORS.success })
    );
  })), wrongAnswer !== null && !correct && /* @__PURE__ */ React.createElement(Text, { style: styles.hint }, "Not quite. Think smaller: what does the model choose at each single moment?"), correct && /* @__PURE__ */ React.createElement(View, { style: styles.explanation }, /* @__PURE__ */ React.createElement(Text, { style: styles.explanationTitle }, "Aha!"), /* @__PURE__ */ React.createElement(Text, { style: styles.explanationText }, "It has zero foresight. Modern AI generates purely forward, one word token at a time. The entire appearance of intelligent thought comes from predicting probabilities across trillions of words.")), /* @__PURE__ */ React.createElement(Primary, { label: "Claim My Starting Reward", disabled: !correct, onPress: () => void finishQuiz() })), stage === 3 && /* @__PURE__ */ React.createElement(View, { style: styles.victory }, /* @__PURE__ */ React.createElement(Image, { source: require("../../assets/mascot/leo-celebrating.png"), style: styles.victoryLeo, resizeMode: "contain" }), /* @__PURE__ */ React.createElement(Text, { style: styles.victoryKicker }, "FIRST WIN BANKED"), /* @__PURE__ */ React.createElement(Text, { style: styles.victoryTitle }, "You just learned how modern AI thinks."), /* @__PURE__ */ React.createElement(View, { style: styles.rewards }, /* @__PURE__ */ React.createElement(View, { style: styles.reward }, /* @__PURE__ */ React.createElement(MaterialCommunityIcons, { name: "flask", size: 24, color: COLORS.xpBadgeIcon }), /* @__PURE__ */ React.createElement(Text, { style: styles.rewardValue }, "+20 XP"), /* @__PURE__ */ React.createElement(Text, { style: styles.rewardLabel }, "Starting reward")), /* @__PURE__ */ React.createElement(View, { style: styles.reward }, /* @__PURE__ */ React.createElement(Feather, { name: "activity", size: 24, color: COLORS.streak }), /* @__PURE__ */ React.createElement(Text, { style: styles.rewardValue }, "1 Day"), /* @__PURE__ */ React.createElement(Text, { style: styles.rewardLabel }, "Streak unlocked"))), /* @__PURE__ */ React.createElement(Primary, { label: "Save My Progress & Choose Industry", onPress: onComplete })))));
}
function Tag({ children }) {
  return /* @__PURE__ */ React.createElement(View, { style: styles.tag }, /* @__PURE__ */ React.createElement(Text, { style: styles.tagText }, children));
}
function Takeaway({ children, icon }) {
  return /* @__PURE__ */ React.createElement(View, { style: styles.takeaway }, /* @__PURE__ */ React.createElement(Feather, { name: icon, size: 20, color: COLORS.accent }), /* @__PURE__ */ React.createElement(Text, { style: styles.takeawayText }, children));
}
function Primary({ label, disabled, onPress }) {
  return /* @__PURE__ */ React.createElement(TouchableOpacity, { style: [styles.primary, disabled && styles.primaryDisabled], disabled, onPress, activeOpacity: 0.86 }, /* @__PURE__ */ React.createElement(Text, { style: styles.primaryText }, label), /* @__PURE__ */ React.createElement(Feather, { name: "arrow-right", size: 18, color: COLORS.textOnAccent }));
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: COLORS.bg0 },
  topBar: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 18, paddingVertical: 10 },
  progressWrap: { flex: 1, flexDirection: "row", gap: 6 },
  progressItem: { flex: 1, gap: 5 },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: COLORS.bg2 },
  progressTrackActive: { backgroundColor: COLORS.accent },
  progressLabel: { fontSize: 10, color: COLORS.textMuted, textAlign: "center", fontWeight: "600" },
  progressLabelActive: { color: COLORS.accent, fontWeight: "800" },
  skipButton: { flexDirection: "row", alignItems: "center", gap: 3, paddingVertical: 2 },
  skipText: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary },
  content: { paddingHorizontal: 20, paddingTop: 18 },
  tag: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: COLORS.accentSoft, marginBottom: 10 },
  tagText: { fontSize: 10, fontWeight: "900", color: COLORS.accent, letterSpacing: 1 },
  eyebrow: { fontSize: 11, fontWeight: "800", color: COLORS.textMuted, marginBottom: 6 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: "900", color: COLORS.textPrimary },
  heroLeo: { width: 190, height: 190, alignSelf: "center", marginVertical: 8 },
  promptCard: { backgroundColor: COLORS.bg2, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 18, ...SHADOWS.sm },
  promptLead: { fontSize: 11, fontWeight: "800", color: COLORS.accent, marginBottom: 8, textTransform: "uppercase" },
  sentence: { fontSize: 19, lineHeight: 27, fontWeight: "700", color: COLORS.textPrimary },
  chips: { flexDirection: "row", gap: 8, marginTop: 18 },
  wordChip: { flex: 1, minHeight: 68, borderRadius: 14, backgroundColor: COLORS.bg1, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  wordChipSelected: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent },
  word: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  wordSelected: { color: COLORS.accent },
  chance: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  chanceSelected: { color: COLORS.accent, fontWeight: "800" },
  takeaway: { flexDirection: "row", gap: 12, backgroundColor: COLORS.accentSoft, borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.border },
  takeawayText: { flex: 1, fontSize: 14, lineHeight: 21, color: COLORS.textSecondary, fontWeight: "600" },
  primary: { minHeight: 56, borderRadius: 16, marginTop: 22, paddingHorizontal: 18, backgroundColor: COLORS.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, ...SHADOWS.accent },
  primaryDisabled: { opacity: 0.35 },
  primaryText: { fontSize: 16, fontWeight: "800", color: COLORS.textOnAccent, textAlign: "center" },
  attentionCard: { marginTop: 24, minHeight: 240, borderRadius: 22, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border, padding: 20, justifyContent: "center", ...SHADOWS.sm },
  sentenceLine: { position: "absolute", opacity: 0 },
  anchorWord: { opacity: 0 },
  sentenceText: { color: COLORS.textPrimary },
  contextSentence: { fontSize: 23, lineHeight: 36, textAlign: "center", color: COLORS.textPrimary, fontWeight: "600" },
  sentenceWordStrong: { color: COLORS.accent, fontWeight: "900" },
  itWord: { color: COLORS.accent, fontWeight: "900", textDecorationLine: "underline" },
  connectionArea: { height: 42, marginHorizontal: 28, justifyContent: "center" },
  connectionLine: { height: 3, borderRadius: 2, backgroundColor: COLORS.accent },
  spark: { position: "absolute", left: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.accent },
  tapIt: { alignSelf: "center", flexDirection: "row", gap: 7, alignItems: "center", backgroundColor: COLORS.accentSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  tapItText: { color: COLORS.accent, fontSize: 12, fontWeight: "800" },
  quizTitle: { fontSize: 25, lineHeight: 32, fontWeight: "900", color: COLORS.textPrimary, marginBottom: 18 },
  options: { gap: 10 },
  option: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.bg2, padding: 13 },
  optionWrong: { borderColor: COLORS.error, backgroundColor: COLORS.errorSoft },
  optionCorrect: { borderColor: COLORS.success, backgroundColor: COLORS.successSoft },
  optionLetter: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg1 },
  optionLetterWrong: { backgroundColor: COLORS.errorSoft },
  optionLetterCorrect: { backgroundColor: COLORS.successSoft },
  optionLetterText: { fontSize: 13, fontWeight: "900", color: COLORS.textSecondary },
  optionText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: "600", color: COLORS.textPrimary },
  hint: { marginTop: 12, color: COLORS.error, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  explanation: { marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: COLORS.successSoft, borderWidth: 1, borderColor: COLORS.success },
  explanationTitle: { fontSize: 18, fontWeight: "900", color: COLORS.success, marginBottom: 4 },
  explanationText: { fontSize: 14, lineHeight: 21, color: COLORS.textSecondary },
  victory: { alignItems: "center", paddingTop: 20 },
  victoryLeo: { width: 210, height: 210 },
  victoryKicker: { fontSize: 11, fontWeight: "900", color: COLORS.accent, letterSpacing: 1.2, marginTop: 4 },
  victoryTitle: { fontSize: 28, lineHeight: 34, fontWeight: "900", textAlign: "center", color: COLORS.textPrimary, marginTop: 8 },
  rewards: { alignSelf: "stretch", flexDirection: "row", gap: 10, marginTop: 22 },
  reward: { flex: 1, minHeight: 118, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border },
  rewardValue: { fontSize: 20, fontWeight: "900", color: COLORS.textPrimary, marginTop: 7 },
  rewardLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 }
});
export {
  DemoLesson
};
