import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Audio } from "expo-av";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../lib/constants";
import { useSelectedMarket } from "../hooks/useSelectedMarket";
import { useInterviewQuestions } from "../hooks/useInterviewQuestions";
import { useAuth } from "../hooks/useAuth";
import { trackEvent } from "../lib/analytics";
import { useUserXP } from "../hooks/useUserXP";
import { usePracticeRewards } from "../hooks/usePracticeRewards";
import { useCollectibles } from "../hooks/useCollectibles";
import { supabase } from "../lib/supabase";
import { getMarketName } from "../lib/markets";
import { getMarketWorld } from "../data/marketWorlds";
import { INTERVIEW_PERSONAS, MECE_FRAMEWORKS, STORY_HERO_STEPS } from "../lib/interviewLabData";
import { speakAsSophia, transcribeAudio } from "../lib/interviewVoice";
import { triggerHaptic } from "../lib/haptics";
import { log } from "../lib/logger";
import { useInterviewReadiness } from "../hooks/useInterviewReadiness";
import { ReadinessCard } from "../components/interview/ReadinessCard";
import { roleTrack, TRACK_LABEL } from "../lib/interviewPrep";
const SOPHIA = require("../assets/mentors/mentor-sophia.png");
const STAGES = [
  { key: "brief", label: "Brief" },
  { key: "framework", label: "Frame" },
  { key: "pressure", label: "Pressure" },
  { key: "response", label: "Answer" },
  { key: "verdict", label: "Verdict" }
];
const short = (value, max = 155) => {
  const clean = (value || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 70))}\u2026`;
};
function InterviewLabScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  React.useEffect(() => {
    trackEvent("interview_practice_started", {});
  }, []);
  const { marketId, loading: marketLoading } = useSelectedMarket();
  const world = getMarketWorld(marketId);
  const marketName = getMarketName(marketId);
  const [path, setPath] = useState(null);
  const [persona, setPersona] = useState("consultant");
  const [stage, setStage] = useState("brief");
  const [pressureChoice, setPressureChoice] = useState(null);
  const [pressureCorrect, setPressureCorrect] = useState(false);
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [banked, setBanked] = useState(false);
  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const questions = useInterviewQuestions(marketId, path || "consulting");
  const readiness = useInterviewReadiness(marketId);
  const track = readiness.target ? roleTrack(readiness.target.role) : null;
  const [showReadiness, setShowReadiness] = useState(false);
  const { addXP } = useUserXP(marketId);
  const { recordCaseRun } = usePracticeRewards();
  const { evaluateRewards } = useCollectibles(marketId);
  const [mockIdx, setMockIdx] = useState(0);
  const [pressureIdx, setPressureIdx] = useState(0);
  const usedMock = useRef(/* @__PURE__ */ new Set());
  const usedPressure = useRef(/* @__PURE__ */ new Set());
  const pickUnused = (size, used) => {
    if (size <= 0) return 0;
    if (used.size >= size) used.clear();
    const open = [];
    for (let i = 0; i < size; i++) if (!used.has(i)) open.push(i);
    const pick = open[Math.floor(Math.random() * open.length)];
    used.add(pick);
    return pick;
  };
  const pressurePoolSize = path === "consulting" && track !== "technical" && questions.mentalMathQuestions.length ? questions.mentalMathQuestions.length : questions.mcqQuestions.length;
  const rollQuestions = useCallback(() => {
    const technical = track === "technical" ? questions.mockQuestions.map((m, i) => /certif|technical|system|standard|regulat|engineer|architect|safety|spec/i.test(`${m.scenario} ${m.question}`) ? i : -1).filter((i) => i >= 0 && !usedMock.current.has(i)) : [];
    if (technical.length) {
      const pick = technical[Math.floor(Math.random() * technical.length)];
      usedMock.current.add(pick);
      setMockIdx(pick);
    } else setMockIdx(pickUnused(questions.mockQuestions.length, usedMock.current));
    setPressureIdx(pickUnused(pressurePoolSize, usedPressure.current));
  }, [questions.mockQuestions, pressurePoolSize, track]);
  useEffect(() => {
    usedMock.current.clear();
    usedPressure.current.clear();
    rollQuestions();
  }, [rollQuestions, path]);
  const mock = questions.mockQuestions[mockIdx] || questions.mockQuestions[0];
  const pressure = useMemo(() => {
    if (path === "consulting" && track !== "technical" && questions.mentalMathQuestions.length) return questions.mentalMathQuestions[pressureIdx % questions.mentalMathQuestions.length];
    return questions.mcqQuestions.length ? questions.mcqQuestions[pressureIdx % questions.mcqQuestions.length] : void 0;
  }, [path, track, pressureIdx, questions.mentalMathQuestions, questions.mcqQuestions]);
  const framework = MECE_FRAMEWORKS[marketId] || MECE_FRAMEWORKS.aerospace;
  const stageIndex = Math.max(0, STAGES.findIndex((item) => item.key === stage));
  useEffect(() => () => {
    soundRef.current?.unloadAsync().catch(() => {
    });
    recordingRef.current?.stopAndUnloadAsync().catch(() => {
    });
  }, []);
  const next = (target) => {
    triggerHaptic("light");
    setStage(target);
  };
  const choosePressure = (index) => {
    if (!pressure || pressureChoice !== null) return;
    setPressureChoice(index);
    setPressureCorrect(index === pressure.correctIndex);
    triggerHaptic(index === pressure.correctIndex ? "success" : "error");
  };
  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const created = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = created.recording;
      setRecording(true);
    } catch (error) {
      log.warn("[Interview] Recording failed:", error);
    }
  }, []);
  const stopRecording = useCallback(async () => {
    const active = recordingRef.current;
    if (!active) return;
    setRecording(false);
    setSubmitting(true);
    try {
      await active.stopAndUnloadAsync();
      const uri = active.getURI();
      recordingRef.current = null;
      if (uri) setResponse(await transcribeAudio(uri));
    } catch (error) {
      log.warn("[Interview] Transcription failed:", error);
    } finally {
      setSubmitting(false);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    }
  }, []);
  const playCoach = async (text) => {
    if (!text || speaking) return;
    setSpeaking(true);
    try {
      const sound = await speakAsSophia(text);
      soundRef.current = sound;
      sound?.setOnPlaybackStatusUpdate((status) => {
        if ("didJustFinish" in status && status.didJustFinish) setSpeaking(false);
      });
      if (!sound) setSpeaking(false);
    } catch {
      setSpeaking(false);
    }
  };
  const submit = async () => {
    if (!user || !mock || response.trim().length < 20) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("interview-feedback", {
        body: { userResponse: response, scenario: mock.scenario, question: mock.question, buzzwords: mock.buzzwords, persona, marketId, path }
      });
      if (error) throw error;
      const result = data;
      trackEvent("interview_feedback_received", { score: Math.round((result.score || 5) * 10) });
      setFeedback(result);
      setStage("verdict");
      const score = Math.round((result.score || 5) * 10);
      await supabase.from("interview_lab_attempts").insert({
        user_id: user.id,
        market_id: marketId,
        path,
        stage: 4,
        attempt_type: "mock",
        score,
        structure_score: (result.communicationScore || 0) * 10,
        content_score: (result.industryKnowledgeScore || 0) * 10,
        persona_score: (result.personaFitScore || 0) * 10,
        persona,
        scenario_question: mock.question,
        user_response: response,
        feedback: result,
        buzzwords_used: result.buzzwordsUsed || [],
        buzzwords_missed: result.buzzwordsMissed || []
      });
    } catch (error) {
      log.warn("[Interview] Feedback failed:", error);
      setFeedback({ score: 5, sophiaSays: "The connection flinched. Your answer still counts as a rep.", whatWentWell: "You committed to an answer.", roomForImprovement: "Try again for a full review.", betterVersion: "Lead with your answer, then prove it." });
      setStage("verdict");
    } finally {
      setSubmitting(false);
    }
  };
  const bankResult = async () => {
    if (banked) {
      router.back();
      return;
    }
    setBanked(true);
    const score = Math.round((feedback?.score || 5) * 10);
    const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : "D";
    const xp = score >= 90 ? 90 : score >= 75 ? 70 : score >= 60 ? 45 : 25;
    try {
      await Promise.all([
        addXP(xp, "interview_lab", mock?.id, `Interview mission graded ${grade}`),
        recordCaseRun(grade),
        evaluateRewards("interview_lab", `interview:${mock?.id || Date.now()}`, score / 100)
      ]);
    } catch (error) {
      log.warn("[Interview] Reward banking failed:", error);
    }
    router.back();
  };
  if (marketLoading || questions.loading) return /* @__PURE__ */ React.createElement(View, { style: styles.center }, /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "large", color: COLORS.accent }));
  if (!path) return /* @__PURE__ */ React.createElement(View, { style: styles.root }, /* @__PURE__ */ React.createElement(LinearGradient, { colors: [world.colors[0], world.colors[1]], style: [styles.pathHero, { paddingTop: insets.top + 18 }] }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.back(), style: styles.close }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 22, color: COLORS.bg0 })), /* @__PURE__ */ React.createElement(Image, { source: SOPHIA, style: styles.sophiaHero }), /* @__PURE__ */ React.createElement(Text, { style: styles.kickerLight }, "INTERVIEW LAB"), /* @__PURE__ */ React.createElement(Text, { style: styles.heroTitle }, "Interview practice"), /* @__PURE__ */ React.createElement(Text, { style: styles.heroBody }, "Practice an interview question. Get feedback in 2 minutes.")), /* @__PURE__ */ React.createElement(ScrollView, { contentContainerStyle: [styles.pathBody, { paddingBottom: insets.bottom + 28 }], showsVerticalScrollIndicator: false }, !readiness.loading && user ? /* @__PURE__ */ React.createElement(
    ReadinessCard,
    {
      inline: true,
      visible: true,
      readiness,
      onClose: () => {
      },
      onOpenBrief: () => router.push("/deliverable"),
      onStartMock: () => {
        setPath(track === "behavioral" ? "academic" : "consulting");
        setStage("response");
      }
    }
  ) : null, /* @__PURE__ */ React.createElement(
    TouchableOpacity,
    {
      accessibilityRole: "button",
      accessibilityLabel: "Warm up with Leo",
      activeOpacity: 0.85,
      style: styles.warmUp,
      onPress: () => {
        triggerHaptic("medium");
        router.push({ pathname: "/leo-call", params: { marketId: marketId ?? "", mode: "interview" } });
      }
    },
    /* @__PURE__ */ React.createElement(Image, { source: require("../assets/mascot/leo-waving.png"), style: styles.warmUpLeo, resizeMode: "contain" }),
    /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.warmUpTitle }, "Warm up with Leo"), /* @__PURE__ */ React.createElement(Text, { style: styles.warmUpSub }, readiness.target?.company ? `3-min call \xB7 Leo plays your ${readiness.target.company} interviewer` : "3-min call \xB7 Leo plays your interviewer")),
    /* @__PURE__ */ React.createElement(Feather, { name: "phone", size: 18, color: COLORS.accent })
  ), /* @__PURE__ */ React.createElement(PathCard, { icon: "briefcase", title: "Job interview", subtitle: "Cases, numbers and clear answers", color: world.colors[0], onPress: () => setPath("consulting") }), /* @__PURE__ */ React.createElement(PathCard, { icon: "award", title: "Scholarship or school interview", subtitle: "Stories about what you did and why", color: world.colors[1], onPress: () => setPath("academic") }), /* @__PURE__ */ React.createElement(Text, { style: styles.smallPrint }, "Sophia coaches every run. Voice is optional."), track && /* @__PURE__ */ React.createElement(Text, { style: styles.smallPrint }, `${readiness.target?.role} \xB7 ${TRACK_LABEL[track]}`)));
  return /* @__PURE__ */ React.createElement(View, { style: [styles.root, { paddingTop: insets.top + 8 }] }, /* @__PURE__ */ React.createElement(View, { style: styles.header }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => router.back(), style: styles.close }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 22, color: COLORS.textPrimary })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.headerTitle }, marketName, " Interview"), /* @__PURE__ */ React.createElement(Text, { style: styles.headerSub }, INTERVIEW_PERSONAS[persona].label)), /* @__PURE__ */ React.createElement(Image, { source: SOPHIA, style: styles.sophiaSmall })), /* @__PURE__ */ React.createElement(View, { style: styles.rail }, STAGES.map((item, index) => /* @__PURE__ */ React.createElement(View, { key: item.key, style: [styles.railSegment, { backgroundColor: index <= stageIndex ? world.colors[0] : COLORS.border }] }))), /* @__PURE__ */ React.createElement(ScrollView, { contentContainerStyle: [styles.scroll, { paddingBottom: insets.bottom + 28 }], showsVerticalScrollIndicator: false }, /* @__PURE__ */ React.createElement(Text, { style: [styles.stageLabel, { color: world.colors[0] }] }, STAGES[stageIndex].label.toUpperCase(), " \xB7 ", stageIndex + 1, "/5"), stage === "brief" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Pick your interviewer."), /* @__PURE__ */ React.createElement(Text, { style: styles.subtitle }, "Your coach changes what a strong answer sounds like."), /* @__PURE__ */ React.createElement(View, { style: styles.personas }, Object.entries(INTERVIEW_PERSONAS).map(([key, item]) => /* @__PURE__ */ React.createElement(TouchableOpacity, { key, onPress: () => setPersona(key), style: [styles.persona, persona === key && { borderColor: item.color, backgroundColor: `${item.color}10` }] }, /* @__PURE__ */ React.createElement(Feather, { name: item.icon, size: 19, color: item.color }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.personaTitle }, item.label), /* @__PURE__ */ React.createElement(Text, { style: styles.personaText }, short(item.description, 58))), persona === key && /* @__PURE__ */ React.createElement(Feather, { name: "check-circle", size: 18, color: item.color })))), /* @__PURE__ */ React.createElement(Coach, { text: "I\u2019ll listen for structure, evidence, and whether you actually answered the question.", onSpeak: () => playCoach("I will listen for structure, evidence, and whether you actually answered the question."), speaking }), /* @__PURE__ */ React.createElement(Action, { label: "Build my framework", color: world.colors[0], onPress: () => next("framework") })), stage === "framework" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, path === "consulting" ? "Build the frame." : "Build the story."), path === "consulting" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(View, { style: styles.prompt }, /* @__PURE__ */ React.createElement(Text, { style: styles.promptLabel }, "THE PROBLEM"), /* @__PURE__ */ React.createElement(Text, { style: styles.promptText }, short(framework.label, 120))), framework.branches.slice(0, 3).map((branch, index) => /* @__PURE__ */ React.createElement(View, { key: branch, style: styles.frameworkRow }, /* @__PURE__ */ React.createElement(Text, { style: [styles.frameworkNumber, { color: world.colors[index % 3] }] }, index + 1), /* @__PURE__ */ React.createElement(Text, { style: styles.frameworkText }, short(branch, 92))))) : STORY_HERO_STEPS.map((item, index) => /* @__PURE__ */ React.createElement(View, { key: item.letter, style: styles.frameworkRow }, /* @__PURE__ */ React.createElement(Text, { style: [styles.frameworkNumber, { color: world.colors[index % 3] }] }, item.letter), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.frameworkText }, item.label), /* @__PURE__ */ React.createElement(Text, { style: styles.personaText }, item.prompt)))), /* @__PURE__ */ React.createElement(Coach, { text: path === "consulting" ? "Split the problem into parts that don't overlap." : "Keep the setup short. Spend most time on what you did." }), /* @__PURE__ */ React.createElement(Action, { label: "Enter pressure round", color: world.colors[0], onPress: () => next("pressure") })), stage === "pressure" && pressure && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "No warm-up. Make the call."), /* @__PURE__ */ React.createElement(Text, { style: styles.subtitle }, path === "consulting" && questions.mentalMathQuestions.length ? "Mental math under pressure." : "One choice. No essay."), /* @__PURE__ */ React.createElement(View, { style: styles.prompt }, /* @__PURE__ */ React.createElement(Text, { style: styles.promptText }, short(pressure.question, 170))), /* @__PURE__ */ React.createElement(View, { style: styles.options }, pressure.options.map((option, index) => {
    const revealed = pressureChoice !== null;
    const correct = index === pressure.correctIndex;
    const picked = index === pressureChoice;
    return /* @__PURE__ */ React.createElement(TouchableOpacity, { key: `${option}-${index}`, disabled: revealed, onPress: () => choosePressure(index), style: [styles.option, revealed && correct && styles.correct, revealed && picked && !correct && styles.wrong] }, /* @__PURE__ */ React.createElement(Text, { style: styles.optionLetter }, String.fromCharCode(65 + index)), /* @__PURE__ */ React.createElement(Text, { style: styles.optionText }, short(option, 90)));
  })), pressureChoice !== null && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(View, { style: [styles.feedback, { backgroundColor: pressureCorrect ? COLORS.successSoft : COLORS.errorSoft }] }, /* @__PURE__ */ React.createElement(Text, { style: styles.feedbackTitle }, pressureCorrect ? "Correct." : "Not quite. Here's why:"), /* @__PURE__ */ React.createElement(Text, { style: styles.feedbackText }, short(pressure.explanation, 155))), /* @__PURE__ */ React.createElement(Action, { label: "Answer the question", color: world.colors[0], onPress: () => next("response") }))), stage === "response" && mock && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Answer out loud\u2014or type."), /* @__PURE__ */ React.createElement(View, { style: styles.prompt }, /* @__PURE__ */ React.createElement(Text, { style: styles.promptLabel }, short(mock.scenario, 95)), /* @__PURE__ */ React.createElement(Text, { style: styles.promptText }, short(mock.question, 180))), /* @__PURE__ */ React.createElement(TextInput, { value: response, onChangeText: setResponse, multiline: true, maxLength: 1200, style: styles.input, placeholder: "Lead with your answer. Then prove it.", placeholderTextColor: COLORS.textMuted }), /* @__PURE__ */ React.createElement(View, { style: styles.responseActions }, /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: recording ? stopRecording : startRecording, style: [styles.record, recording && styles.recording] }, /* @__PURE__ */ React.createElement(Feather, { name: recording ? "square" : "mic", size: 18, color: recording ? COLORS.bg0 : world.colors[0] }), /* @__PURE__ */ React.createElement(Text, { style: [styles.recordText, recording && { color: COLORS.bg0 }] }, recording ? "Stop" : "Record")), /* @__PURE__ */ React.createElement(Text, { style: styles.count }, response.trim().split(/\s+/).filter(Boolean).length, " words")), /* @__PURE__ */ React.createElement(Action, { label: submitting ? "Sophia is grading\u2026" : "Lock answer", color: world.colors[0], disabled: submitting || response.trim().length < 20, onPress: submit })), stage === "verdict" && feedback && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(LinearGradient, { colors: [scoreColor(feedback.score), world.colors[1]], style: styles.verdict }, /* @__PURE__ */ React.createElement(Text, { style: styles.verdictLabel }, "INTERVIEW VERDICT"), /* @__PURE__ */ React.createElement(Text, { style: styles.verdictScore }, Math.round((feedback.score || 5) * 10)), /* @__PURE__ */ React.createElement(Text, { style: styles.verdictGrade }, gradeLabel(feedback.score))), /* @__PURE__ */ React.createElement(Coach, { text: feedback.sophiaSays || "The structure is forming. Make every sentence earn its place.", onSpeak: () => playCoach(feedback.sophiaSays), speaking }), /* @__PURE__ */ React.createElement(Debrief, { icon: "check-circle", title: "Keep", body: feedback.whatWentWell, color: COLORS.success }), /* @__PURE__ */ React.createElement(Debrief, { icon: "target", title: "Fix next", body: feedback.roomForImprovement, color: COLORS.warning }), /* @__PURE__ */ React.createElement(Debrief, { icon: "zap", title: "Sharper version", body: feedback.betterVersion, color: world.colors[0] }), mock && mock.buzzwords.length > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.debrief }, /* @__PURE__ */ React.createElement(Feather, { name: "book-open", size: 19, color: world.colors[0] }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: [styles.debriefTitle, { color: world.colors[0] }] }, "Words a pro would use"), /* @__PURE__ */ React.createElement(View, { style: [styles.keywordRow, { marginTop: 6 }] }, mock.buzzwords.slice(0, 6).map((word) => /* @__PURE__ */ React.createElement(View, { key: word, style: styles.keyword }, /* @__PURE__ */ React.createElement(Text, { style: styles.keywordText }, word)))))), /* @__PURE__ */ React.createElement(Action, { label: "Bank result", color: world.colors[0], onPress: bankResult }), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => {
    setFeedback(null);
    setResponse("");
    setPressureChoice(null);
    setPressureCorrect(false);
    rollQuestions();
    setStage("brief");
  }, style: styles.retry }, /* @__PURE__ */ React.createElement(Text, { style: styles.retryText }, "Run another mission")))));
}
function PathCard({ icon, title, subtitle, color, onPress }) {
  return /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress, style: styles.pathCard }, /* @__PURE__ */ React.createElement(View, { style: [styles.pathIcon, { backgroundColor: `${color}16` }] }, /* @__PURE__ */ React.createElement(Feather, { name: icon, size: 24, color })), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: styles.pathTitle }, title), /* @__PURE__ */ React.createElement(Text, { style: styles.pathSubtitle }, subtitle)), /* @__PURE__ */ React.createElement(Feather, { name: "arrow-right", size: 20, color: COLORS.textMuted }));
}
function Coach({ text, onSpeak, speaking }) {
  return /* @__PURE__ */ React.createElement(View, { style: styles.coach }, /* @__PURE__ */ React.createElement(Image, { source: SOPHIA, style: styles.coachAvatar }), /* @__PURE__ */ React.createElement(Text, { style: styles.coachText }, text), onSpeak && /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: onSpeak }, /* @__PURE__ */ React.createElement(Feather, { name: speaking ? "volume-2" : "volume-1", size: 18, color: COLORS.accent })));
}
function Action({ label, color, onPress, disabled }) {
  return /* @__PURE__ */ React.createElement(TouchableOpacity, { disabled, onPress, style: [styles.action, { backgroundColor: color }, disabled && styles.disabled] }, /* @__PURE__ */ React.createElement(Text, { style: styles.actionText }, label), /* @__PURE__ */ React.createElement(Feather, { name: "arrow-right", size: 18, color: COLORS.bg0 }));
}
function Debrief({ icon, title, body, color }) {
  return /* @__PURE__ */ React.createElement(View, { style: styles.debrief }, /* @__PURE__ */ React.createElement(Feather, { name: icon, size: 19, color }), /* @__PURE__ */ React.createElement(View, { style: { flex: 1 } }, /* @__PURE__ */ React.createElement(Text, { style: [styles.debriefTitle, { color }] }, title), /* @__PURE__ */ React.createElement(Text, { style: styles.debriefBody }, body || "No note this round.")));
}
const scoreColor = (score = 5) => score >= 8 ? "#16A34A" : score >= 6 ? "#F59E0B" : "#EF4444";
const gradeLabel = (score = 5) => score >= 9 ? "Offer-ready" : score >= 7.5 ? "Strong signal" : score >= 6 ? "Promising" : "Needs another rep";
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg0 },
  pathHero: { height: 335, paddingHorizontal: 22, paddingBottom: 28, justifyContent: "flex-end", overflow: "hidden" },
  close: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  sophiaHero: { position: "absolute", width: 120, height: 120, right: 18, top: 60, resizeMode: "cover", borderRadius: 60, opacity: 0.95 },
  kickerLight: { color: COLORS.bg0, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  heroTitle: { color: COLORS.bg0, fontSize: 31, lineHeight: 35, fontWeight: "900", maxWidth: 220, marginTop: 8 },
  heroBody: { color: COLORS.bg0, opacity: 0.82, fontSize: 15, marginTop: 8, maxWidth: 215 },
  pathBody: { padding: 18, gap: 12 },
  pathCard: { flexDirection: "row", alignItems: "center", minHeight: 92, padding: 16, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, gap: 14, backgroundColor: COLORS.bg2 },
  pathIcon: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  pathTitle: { fontSize: 18, fontWeight: "900", color: COLORS.textPrimary },
  pathSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  smallPrint: { color: COLORS.textMuted, fontSize: 12, textAlign: "center", marginTop: 8 },
  warmUp: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.accent, backgroundColor: COLORS.bg2, marginBottom: 12 },
  warmUpLeo: { width: 48, height: 48 },
  warmUpTitle: { color: COLORS.textPrimary, fontWeight: "800", fontSize: 16 },
  warmUpSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  header: { height: 58, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { color: COLORS.textPrimary, fontWeight: "900", fontSize: 15 },
  headerSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
  sophiaSmall: { width: 38, height: 38, borderRadius: 19, marginRight: 6 },
  rail: { flexDirection: "row", gap: 4, paddingHorizontal: 16 },
  railSegment: { flex: 1, height: 5, borderRadius: 3 },
  scroll: { padding: 20, gap: 14 },
  stageLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  title: { color: COLORS.textPrimary, fontSize: 27, lineHeight: 32, fontWeight: "900" },
  subtitle: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 21 },
  personas: { gap: 10 },
  persona: { minHeight: 72, borderRadius: 15, borderWidth: 2, borderColor: COLORS.border, padding: 13, flexDirection: "row", gap: 12, alignItems: "center" },
  personaTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary },
  personaText: { fontSize: 12, lineHeight: 17, color: COLORS.textSecondary, marginTop: 2 },
  coach: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 15, backgroundColor: COLORS.accentSoft },
  coachAvatar: { width: 42, height: 42, borderRadius: 21 },
  coachText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "600", color: COLORS.textPrimary },
  prompt: { padding: 18, borderRadius: 16, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  promptLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "900", letterSpacing: 1, marginBottom: 7 },
  promptText: { fontSize: 19, lineHeight: 25, color: COLORS.textPrimary, fontWeight: "800" },
  frameworkRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  frameworkNumber: { width: 28, fontSize: 22, fontWeight: "900", textAlign: "center" },
  frameworkText: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: "700", color: COLORS.textPrimary },
  options: { gap: 9 },
  option: { minHeight: 60, padding: 12, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, flexDirection: "row", alignItems: "center", gap: 11 },
  optionLetter: { width: 28, height: 28, textAlign: "center", textAlignVertical: "center", borderRadius: 8, backgroundColor: COLORS.bg1, color: COLORS.textSecondary, fontWeight: "900" },
  optionText: { flex: 1, color: COLORS.textPrimary, fontSize: 14, lineHeight: 19, fontWeight: "600" },
  correct: { borderColor: COLORS.success, backgroundColor: COLORS.successSoft },
  wrong: { borderColor: COLORS.error, backgroundColor: COLORS.errorSoft },
  feedback: { padding: 14, borderRadius: 14 },
  feedbackTitle: { fontSize: 15, fontWeight: "900", color: COLORS.textPrimary },
  feedbackText: { fontSize: 13, lineHeight: 18, color: COLORS.textSecondary, marginTop: 4 },
  keywordRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  keyword: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: COLORS.accentSoft },
  keywordText: { fontSize: 11, color: COLORS.accentDark, fontWeight: "800" },
  input: { minHeight: 150, borderRadius: 16, borderWidth: 2, borderColor: COLORS.border, padding: 16, fontSize: 16, lineHeight: 23, color: COLORS.textPrimary, textAlignVertical: "top" },
  responseActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  record: { height: 42, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 7 },
  recording: { backgroundColor: COLORS.error, borderColor: COLORS.error },
  recordText: { color: COLORS.textPrimary, fontWeight: "800" },
  count: { color: COLORS.textMuted, fontSize: 12 },
  action: { height: 56, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 4 },
  actionText: { color: COLORS.bg0, fontSize: 16, fontWeight: "900" },
  disabled: { opacity: 0.4 },
  verdict: { minHeight: 210, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  verdictLabel: { color: COLORS.bg0, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  verdictScore: { color: COLORS.bg0, fontSize: 72, lineHeight: 78, fontWeight: "900" },
  verdictGrade: { color: COLORS.bg0, fontSize: 16, fontWeight: "800" },
  debrief: { flexDirection: "row", gap: 12, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border },
  debriefTitle: { fontSize: 13, fontWeight: "900" },
  debriefBody: { fontSize: 14, lineHeight: 19, color: COLORS.textPrimary, marginTop: 3 },
  retry: { alignItems: "center", paddingVertical: 12 },
  retryText: { color: COLORS.textSecondary, fontWeight: "800" }
});
export {
  InterviewLabScreen as default
};
