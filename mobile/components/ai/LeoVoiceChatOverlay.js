import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  ScrollView,
  AppState
} from "react-native";
import { Audio } from "expo-av";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { speakWithElevenLabs, stopAllTTS } from "../../lib/tts";
import { isLeoMutedSync, loadLeoMuted, setLeoMuted } from "../../lib/voicePrefs";
import { triggerHaptic } from "../../lib/haptics";
import { log } from "../../lib/logger";
const { width: SCREEN_W } = Dimensions.get("window");
const LEO_STUDY_SCENE = require("../../assets/mascot/leo-voice-study.png");
const LEO_VOICE_ID = "miHBUIuwiPKbRiTC0oIz";
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
async function transcribeVoice(uri) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const authHeader = session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${SUPABASE_ANON_KEY}`;
    const formData = new FormData();
    formData.append("audio", { uri, type: "audio/m4a", name: "recording.m4a" });
    const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-stt`, {
      method: "POST",
      headers: { Authorization: authHeader },
      body: formData
    });
    if (!response.ok) return "";
    const data = await response.json();
    return data.text || "";
  } catch {
    return "";
  }
}
function SubtitleBox({ disabled, children, style, onPress, ...rest }) {
  if (disabled) return /* @__PURE__ */ React.createElement(View, { style }, children);
  return /* @__PURE__ */ React.createElement(TouchableOpacity, { style, onPress, ...rest }, children);
}
function LeoVoiceChatOverlay({
  visible,
  onClose,
  marketId = "general",
  lessonContext
}) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [narrationText, setNarrationText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [subtitlesExpanded, setSubtitlesExpanded] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [isMuted, setIsMuted] = useState(isLeoMutedSync());
  const soundRef = useRef(null);
  const recordingRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const livePulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      setMessages([]);
      setNarrationText("");
      setShowTextInput(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      let cancelled = false;
      loadLeoMuted().then((muted) => {
        setIsMuted(muted);
        if (cancelled) return;
        setTimeout(() => {
          if (cancelled) return;
          const greeting = "Hey! \u{1F98A} Ask me anything about your industry!";
          setNarrationText(greeting);
          if (!muted) speakResponse(greeting);
        }, 600);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1, duration: 700, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, livePulse]);
  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 600, useNativeDriver: true })
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      glowAnim.setValue(0);
    }
  }, [isRecording]);
  useEffect(() => {
    if (!visible) {
      stopAllTTS().catch(() => {
      });
      soundRef.current = null;
      recordingRef.current?.stopAndUnloadAsync().catch(() => {
      });
      recordingRef.current = null;
      setIsSpeaking(false);
    }
  }, [visible]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        stopAllTTS().catch(() => {
        });
        soundRef.current = null;
        setIsSpeaking(false);
      }
    });
    return () => {
      subscription.remove();
      stopAllTTS().catch(() => {
      });
      soundRef.current = null;
    };
  }, []);
  const speakResponse = useCallback(async (text) => {
    if (isLeoMutedSync()) return;
    try {
      setIsSpeaking(true);
      const sound = await speakWithElevenLabs(text, LEO_VOICE_ID, "leo_home");
      soundRef.current = sound;
      if (sound) {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsSpeaking(false);
            soundRef.current = null;
          }
        });
      } else {
        setIsSpeaking(false);
      }
    } catch {
      setIsSpeaking(false);
    }
  }, []);
  const sendToLeo = useCallback(async (userText) => {
    const userMsg = { role: "user", content: userText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsGenerating(true);
    setSubtitlesExpanded(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/leo-voice-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          messages: updatedMessages,
          lessonContext: lessonContext || `${marketId} industry learning`
        })
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const data = await response.json();
      const reply = data?.message || "Hmm, let me think about that... \u{1F914}";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setNarrationText(reply);
      setIsGenerating(false);
      await speakResponse(reply);
    } catch {
      const fallback = "Oops, I had a hiccup! Try again. \u{1F98A}";
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
      setNarrationText(fallback);
      setIsGenerating(false);
    }
  }, [messages, marketId, lessonContext, speakResponse]);
  const handleLeoTap = useCallback(async () => {
    triggerHaptic("light");
    if (isRecording) {
      setIsRecording(false);
      setIsTranscribing(true);
      try {
        const recording = recordingRef.current;
        if (!recording) {
          setIsTranscribing(false);
          return;
        }
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        recordingRef.current = null;
        if (!uri) {
          setIsTranscribing(false);
          return;
        }
        const transcription = await transcribeVoice(uri);
        setIsTranscribing(false);
        if (!transcription.trim()) return;
        await sendToLeo(transcription);
      } catch {
        setIsTranscribing(false);
      }
    } else {
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch {
        }
        soundRef.current = null;
        setIsSpeaking(false);
      }
      try {
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) return;
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        setIsRecording(true);
      } catch (err) {
        log.warn("Recording failed:", err);
      }
    }
  }, [isRecording, sendToLeo]);
  const handleSendText = useCallback(async () => {
    const text = textInput.trim();
    if (!text || isGenerating) return;
    setTextInput("");
    setShowTextInput(false);
    await sendToLeo(text);
  }, [textInput, isGenerating, sendToLeo]);
  const handleMute = useCallback(async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    triggerHaptic("light");
    await setLeoMuted(nextMuted);
    if (nextMuted) {
      await stopAllTTS();
      soundRef.current = null;
      setIsSpeaking(false);
    }
  }, [isMuted]);
  const handleClose = useCallback(() => {
    stopAllTTS().catch(() => {
    });
    soundRef.current = null;
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {
      });
      recordingRef.current = null;
    }
    setIsRecording(false);
    setIsSpeaking(false);
    setMessages([]);
    setNarrationText("");
    onClose();
  }, [onClose]);
  if (!visible) return null;
  return /* @__PURE__ */ React.createElement(Modal, { visible, animationType: "none", transparent: true, statusBarTranslucent: true }, /* @__PURE__ */ React.createElement(StatusBar, { barStyle: "light-content" }), /* @__PURE__ */ React.createElement(
    KeyboardAvoidingView,
    {
      style: { flex: 1 },
      behavior: Platform.OS === "ios" ? "padding" : void 0
    },
    /* @__PURE__ */ React.createElement(Animated.View, { style: [st.container, { opacity: fadeAnim }] }, /* @__PURE__ */ React.createElement(Image, { source: LEO_STUDY_SCENE, style: st.sceneImage, resizeMode: "contain", fadeDuration: 0 }), /* @__PURE__ */ React.createElement(View, { style: st.sceneShade }), /* @__PURE__ */ React.createElement(View, { style: st.bottomShade }), /* @__PURE__ */ React.createElement(View, { style: [st.topBar, { paddingTop: insets.top + 12 }] }, /* @__PURE__ */ React.createElement(View, { style: st.statusBadge }, /* @__PURE__ */ React.createElement(
      Animated.View,
      {
        style: [
          st.liveDot,
          {
            opacity: livePulse,
            backgroundColor: isSpeaking ? "#F97316" : isRecording ? "#EF4444" : "#10B981"
          }
        ]
      }
    ), /* @__PURE__ */ React.createElement(Text, { style: st.statusBadgeText }, isSpeaking ? "Speaking" : isRecording ? "Listening" : isGenerating ? "Thinking" : "Live")), /* @__PURE__ */ React.createElement(View, { style: st.topBarRight }, /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: [st.topBtn, showTextInput && st.topBtnActive],
        onPress: () => setShowTextInput(!showTextInput),
        accessibilityRole: "button",
        accessibilityLabel: "Toggle text mode"
      },
      /* @__PURE__ */ React.createElement(Feather, { name: "type", size: 18, color: "#fff" })
    ), /* @__PURE__ */ React.createElement(TouchableOpacity, { style: st.topBtn, onPress: handleClose, accessibilityRole: "button", accessibilityLabel: "Close Speak to Leo" }, /* @__PURE__ */ React.createElement(Feather, { name: "x", size: 22, color: "#fff" })))), subtitlesExpanded && /* @__PURE__ */ React.createElement(TouchableOpacity, { style: StyleSheet.absoluteFill, activeOpacity: 1, onPress: () => setSubtitlesExpanded(false), accessibilityLabel: "Close chat" }), /* @__PURE__ */ React.createElement(View, { style: [st.dialogStage, { bottom: insets.bottom + 154 }] }, /* @__PURE__ */ React.createElement(View, { style: st.dialogTail }), /* @__PURE__ */ React.createElement(
      SubtitleBox,
      {
        disabled: subtitlesExpanded,
        style: st.subtitleBox,
        onPress: () => setSubtitlesExpanded(!subtitlesExpanded),
        activeOpacity: 0.9,
        accessibilityRole: "button",
        accessibilityLabel: "Leo's latest response"
      },
      isGenerating || isTranscribing ? /* @__PURE__ */ React.createElement(View, { style: st.statusRow }, /* @__PURE__ */ React.createElement(ActivityIndicator, { size: "small", color: "#FB7A22" }), /* @__PURE__ */ React.createElement(Text, { style: st.subtitleText }, isTranscribing ? "Transcribing\u2026" : "Leo is thinking\u2026")) : subtitlesExpanded && messages.length > 0 ? /* @__PURE__ */ React.createElement(ScrollView, { style: st.conversationScroll, contentContainerStyle: st.conversationContent, showsVerticalScrollIndicator: true }, messages.map((message, index) => /* @__PURE__ */ React.createElement(View, { key: `${message.role}-${index}`, style: [st.conversationBubble, message.role === "user" ? st.userConversationBubble : st.leoConversationBubble] }, /* @__PURE__ */ React.createElement(Text, { style: st.conversationRole }, message.role === "user" ? "YOU" : "LEO"), /* @__PURE__ */ React.createElement(Text, { style: st.conversationText }, message.content)))) : /* @__PURE__ */ React.createElement(Text, { style: st.subtitleText, numberOfLines: 4 }, narrationText || "Hey! \u{1F98A} Ask me anything about your industry!"),
      !subtitlesExpanded && narrationText.length > 150 && /* @__PURE__ */ React.createElement(Text, { style: st.expandHint }, "Tap to read more")
    ), /* @__PURE__ */ React.createElement(View, { style: st.statusContainer }, isGenerating && /* @__PURE__ */ React.createElement(Text, { style: st.statusText }, "Preparing an answer"), isRecording && /* @__PURE__ */ React.createElement(View, { style: st.statusRow }, /* @__PURE__ */ React.createElement(Animated.View, { style: [st.recordDot, { opacity: glowAnim }] }), /* @__PURE__ */ React.createElement(Text, { style: st.statusText }, "Listening\u2026 tap again to send")), isSpeaking && !isGenerating && /* @__PURE__ */ React.createElement(Text, { style: st.statusText }, "Leo is speaking\u2026"))), /* @__PURE__ */ React.createElement(View, { style: [st.bottomBar, { paddingBottom: insets.bottom + 16 }] }, showTextInput ? /* @__PURE__ */ React.createElement(View, { style: st.keyboardComposer }, /* @__PURE__ */ React.createElement(TouchableOpacity, { style: st.keyboardDismiss, onPress: () => {
      Keyboard.dismiss();
      setShowTextInput(false);
    }, accessibilityLabel: "Hide keyboard" }, /* @__PURE__ */ React.createElement(Feather, { name: "chevron-down", size: 18, color: "#fff" }), /* @__PURE__ */ React.createElement(Text, { style: st.keyboardDismissText }, "Hide keyboard")), /* @__PURE__ */ React.createElement(View, { style: st.textInputRow }, /* @__PURE__ */ React.createElement(
      TextInput,
      {
        style: st.textInput,
        value: textInput,
        onChangeText: setTextInput,
        placeholder: "Type a message...",
        placeholderTextColor: "rgba(255,255,255,0.4)",
        multiline: true,
        autoFocus: true,
        blurOnSubmit: true,
        maxLength: 500,
        returnKeyType: "send",
        onSubmitEditing: handleSendText
      }
    ), /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: [st.sendBtn, (!textInput.trim() || isGenerating) && { opacity: 0.4 }],
        onPress: handleSendText,
        disabled: !textInput.trim() || isGenerating
      },
      /* @__PURE__ */ React.createElement(Feather, { name: "arrow-up", size: 18, color: "#fff" })
    ))) : /* @__PURE__ */ React.createElement(View, { style: st.callToolbar }, /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: st.sideAction,
        onPress: handleMute,
        accessibilityRole: "button",
        accessibilityLabel: isMuted ? "Turn Leo's voice back on" : "Mute Leo's voice"
      },
      /* @__PURE__ */ React.createElement(View, { style: [st.sideActionCircle, isMuted && st.sideActionCircleActive] }, /* @__PURE__ */ React.createElement(Feather, { name: isMuted ? "volume-x" : "volume-2", size: 23, color: "#fff" })),
      /* @__PURE__ */ React.createElement(Text, { style: st.sideActionLabel }, isMuted ? "Muted" : "Mute")
    ), /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: st.primaryAction,
        onPress: handleLeoTap,
        activeOpacity: 0.8,
        disabled: isGenerating || isTranscribing,
        accessibilityRole: "button",
        accessibilityLabel: isRecording ? "Stop and send recording" : "Talk to Leo"
      },
      /* @__PURE__ */ React.createElement(
        Animated.View,
        {
          style: [
            st.bigMicBtn,
            isRecording && st.bigMicBtnRecording,
            { opacity: isGenerating || isTranscribing ? 0.55 : 1 }
          ]
        },
        /* @__PURE__ */ React.createElement(Feather, { name: isRecording ? "square" : "mic", size: 29, color: "#fff" })
      ),
      /* @__PURE__ */ React.createElement(Text, { style: st.primaryActionLabel }, isRecording ? "Tap to send" : "Tap to talk to Leo")
    ), /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        style: st.sideAction,
        onPress: () => setShowTextInput(true),
        accessibilityRole: "button",
        accessibilityLabel: "Open keyboard"
      },
      /* @__PURE__ */ React.createElement(View, { style: st.sideActionCircle }, /* @__PURE__ */ React.createElement(Feather, { name: "command", size: 22, color: "#fff" })),
      /* @__PURE__ */ React.createElement(Text, { style: st.sideActionLabel }, "Keyboard")
    ))))
  ));
}
const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  sceneImage: {
    position: "absolute",
    top: "9%",
    left: "10%",
    width: "80%",
    height: "46%"
  },
  sceneShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3,5,18,0.12)"
  },
  bottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "43%",
    backgroundColor: "rgba(3,5,18,0.72)"
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10
  },
  topBarRight: {
    flexDirection: "row",
    gap: 12
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(14,16,31,0.76)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  topBtnActive: {
    backgroundColor: "rgba(249,115,22,0.88)",
    borderColor: "rgba(255,255,255,0.2)"
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(14,16,31,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.94)"
  },
  dialogStage: {
    position: "absolute",
    left: 24,
    right: 24,
    alignItems: "center",
    zIndex: 10
  },
  dialogTail: {
    width: 20,
    height: 20,
    marginBottom: -10,
    backgroundColor: "rgba(15,17,31,0.9)",
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    transform: [{ rotate: "45deg" }],
    zIndex: 2
  },
  statusContainer: {
    marginTop: 8,
    alignItems: "center",
    minHeight: 20
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  statusText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.68)",
    fontWeight: "600"
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444"
  },
  subtitleBox: {
    width: "100%",
    minHeight: 94,
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 28,
    backgroundColor: "rgba(15,17,31,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    maxHeight: 286
  },
  conversationScroll: { width: "100%", maxHeight: 232 },
  conversationContent: { gap: 10, paddingVertical: 2 },
  conversationBubble: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 14 },
  userConversationBubble: { backgroundColor: "rgba(249,115,22,0.22)", alignSelf: "flex-end", maxWidth: "88%" },
  leoConversationBubble: { backgroundColor: "rgba(255,255,255,0.08)", alignSelf: "flex-start", maxWidth: "94%" },
  conversationRole: { fontSize: 9, fontWeight: "800", color: "rgba(255,255,255,0.5)", marginBottom: 3 },
  conversationText: { fontSize: 14, lineHeight: 20, fontWeight: "500", color: "#fff" },
  subtitleText: {
    fontSize: SCREEN_W < 370 ? 16 : 18,
    lineHeight: SCREEN_W < 370 ? 22 : 25,
    color: "#fff",
    textAlign: "center",
    fontWeight: "600"
  },
  expandHint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginTop: 6,
    fontWeight: "600"
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    zIndex: 10
  },
  callToolbar: {
    minHeight: 122,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between"
  },
  sideAction: {
    width: 82,
    alignItems: "center",
    gap: 9,
    paddingTop: 10
  },
  sideActionCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(28,30,46,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center"
  },
  sideActionCircleActive: {
    borderColor: "rgba(249,115,22,0.65)",
    backgroundColor: "rgba(74,36,22,0.95)"
  },
  sideActionLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "600"
  },
  primaryAction: {
    minWidth: 132,
    alignItems: "center",
    gap: 9
  },
  bigMicBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.62,
    shadowRadius: 18,
    elevation: 14
  },
  bigMicBtnRecording: {
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444"
  },
  primaryActionLabel: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center"
  },
  textInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingBottom: 8
  },
  keyboardComposer: { gap: 8, paddingBottom: 8 },
  keyboardDismiss: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: "rgba(28,30,46,0.9)" },
  keyboardDismissText: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.76)" },
  textInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: "#fff",
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    minHeight: 48
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center"
  }
});
export {
  LeoVoiceChatOverlay
};
