import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { COLORS } from "../lib/constants";
import { useAuth } from "../hooks/useAuth";
import { storage } from "../lib/storage";
import { LeoCharacter } from "../components/mascot/LeoCharacter";
import { LeoAnimated } from "../components/mascot/LeoAnimated";
import { normalizeDisplayName } from "../lib/displayName";
import { applyPendingInvite } from "../lib/invites";
import * as AppleAuthentication from "expo-apple-authentication";
import { appleSignInAvailable, saveAppleDisplayName, signInWithApple } from "../lib/appleAuth";
import { isDark } from "../lib/theme";
import { trackEvent } from "../lib/analytics";
function AuthLeo() {
  const [greeted, setGreeted] = useState(false);
  return /* @__PURE__ */ React.createElement(LeoAnimated, { size: 160, clip: greeted ? "leo-idle-loop" : "leo-greet", fallback: "idle", onEnd: () => setGreeted(true) });
}
function AuthScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupStep, setSignupStep] = useState("name");
  const [displayName, setDisplayName] = useState("");
  const [appleReady, setAppleReady] = useState(false);
  useEffect(() => {
    void appleSignInAvailable().then(setAppleReady);
  }, []);
  const handleApple = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await signInWithApple();
      if (result.status === "canceled") return;
      if (result.status === "error") {
        Alert.alert("Apple sign-in", result.error);
        return;
      }
      trackEvent("apple_sign_in", { new_account: result.isNew });
      void applyPendingInvite().catch(() => {
      });
      if (!result.isNew) {
        router.replace("/");
        return;
      }
      const typed = displayName.trim() ? normalizeDisplayName(displayName) : null;
      const name = typed || result.givenName;
      if (name) await storage.setDisplayName(name);
      await saveAppleDisplayName(result.userId, name).catch(() => {
      });
      const industry = await storage.getIndustry().catch(() => null);
      router.replace(industry ? { pathname: "/onboarding/familiarity", params: { resume: "1" } } : "/onboarding");
    } finally {
      setLoading(false);
    }
  };
  const appleBlock = appleReady ? /* @__PURE__ */ React.createElement(View, { style: styles.appleBlock }, /* @__PURE__ */ React.createElement(
    AppleAuthentication.AppleAuthenticationButton,
    {
      buttonType: mode === "login" ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN : AppleAuthentication.AppleAuthenticationButtonType.CONTINUE,
      buttonStyle: isDark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK,
      cornerRadius: 12,
      style: styles.appleButton,
      onPress: () => void handleApple()
    }
  ), /* @__PURE__ */ React.createElement(View, { style: styles.orRow }, /* @__PURE__ */ React.createElement(View, { style: styles.orLine }), /* @__PURE__ */ React.createElement(Text, { style: styles.orText }, mode === "signup" && signupStep === "name" ? "or pick a name" : "or use email"), /* @__PURE__ */ React.createElement(View, { style: styles.orLine }))) : null;
  useEffect(() => {
    if (params.mode === "signup") setMode("signup");
    void storage.getDisplayName().then((name) => {
      if (name) {
        setDisplayName(name);
        setSignupStep("credentials");
      }
    });
  }, [params.mode]);
  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const result = mode === "login" ? await signInWithEmail(email.trim(), password) : await signUpWithEmail(email.trim(), password, normalizeDisplayName(displayName));
      if (!result.success) {
        Alert.alert("Error", result.error || "Something went wrong.");
      } else if (mode === "signup" && result.message) {
        Alert.alert("Check your email", result.message);
      } else if (mode === "signup") {
        await storage.setDisplayName(normalizeDisplayName(displayName));
        void applyPendingInvite().catch(() => {
        });
        router.replace({ pathname: "/onboarding/familiarity", params: { resume: "1" } });
      } else {
        void applyPendingInvite().catch(() => {
        });
        router.replace("/");
      }
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ React.createElement(
    KeyboardAvoidingView,
    {
      style: styles.container,
      behavior: Platform.OS === "ios" ? "padding" : "height"
    },
    /* @__PURE__ */ React.createElement(
      ScrollView,
      {
        contentContainerStyle: [
          styles.scrollContent,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }
        ],
        keyboardShouldPersistTaps: "handled",
        showsVerticalScrollIndicator: false
      },
      /* @__PURE__ */ React.createElement(View, { style: styles.leoSection }, mode === "signup" && signupStep === "name" ? /* @__PURE__ */ React.createElement(LeoCharacter, { size: "lg", animation: "thinking", still: true }) : /* @__PURE__ */ React.createElement(AuthLeo, null), /* @__PURE__ */ React.createElement(Text, { style: styles.appName }, "MarketLingo"), /* @__PURE__ */ React.createElement(Text, { style: styles.tagline }, "Master any industry in 6 months")),
      /* @__PURE__ */ React.createElement(View, { style: styles.form }, /* @__PURE__ */ React.createElement(Text, { style: styles.formTitle }, mode === "login" ? "Welcome back" : signupStep === "name" ? "What should we call you?" : "Create account"), appleBlock, mode === "signup" && signupStep === "name" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: styles.nameSubtitle }, "Choose a display name or nickname for your journey."), /* @__PURE__ */ React.createElement(View, { style: styles.inputGroup }, /* @__PURE__ */ React.createElement(
        TextInput,
        {
          style: styles.input,
          placeholder: "Enter your name...",
          placeholderTextColor: COLORS.textMuted,
          value: displayName,
          onChangeText: (value) => setDisplayName(value.slice(0, 40)),
          autoFocus: true,
          autoCapitalize: "words",
          autoCorrect: false,
          maxLength: 40,
          returnKeyType: "next",
          onSubmitEditing: () => {
            if (displayName.trim()) {
              void storage.setDisplayName(normalizeDisplayName(displayName));
              setSignupStep("credentials");
            }
          }
        }
      )), /* @__PURE__ */ React.createElement(
        TouchableOpacity,
        {
          style: [styles.submitButton, !displayName.trim() && styles.disabledButton],
          disabled: !displayName.trim(),
          onPress: () => {
            void storage.setDisplayName(normalizeDisplayName(displayName));
            setSignupStep("credentials");
          }
        },
        /* @__PURE__ */ React.createElement(Text, { style: styles.submitButtonText }, "Continue")
      )) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(View, { style: styles.inputGroup }, /* @__PURE__ */ React.createElement(Text, { style: styles.inputLabel }, "Email"), /* @__PURE__ */ React.createElement(
        TextInput,
        {
          style: styles.input,
          placeholder: "you@example.com",
          placeholderTextColor: COLORS.textMuted,
          value: email,
          onChangeText: setEmail,
          keyboardType: "email-address",
          autoCapitalize: "none",
          autoCorrect: false
        }
      )), /* @__PURE__ */ React.createElement(View, { style: styles.inputGroup }, /* @__PURE__ */ React.createElement(Text, { style: styles.inputLabel }, "Password"), /* @__PURE__ */ React.createElement(
        TextInput,
        {
          style: styles.input,
          placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
          placeholderTextColor: COLORS.textMuted,
          value: password,
          onChangeText: setPassword,
          secureTextEntry: true
        }
      )), /* @__PURE__ */ React.createElement(
        TouchableOpacity,
        {
          style: [styles.submitButton, loading && { opacity: 0.7 }],
          onPress: handleSubmit,
          disabled: loading
        },
        loading ? /* @__PURE__ */ React.createElement(ActivityIndicator, { color: "#FFFFFF" }) : /* @__PURE__ */ React.createElement(Text, { style: styles.submitButtonText }, mode === "login" ? "Sign In" : "Sign Up")
      ), mode === "signup" && /* @__PURE__ */ React.createElement(TouchableOpacity, { style: styles.backToName, onPress: () => setSignupStep("name") }, /* @__PURE__ */ React.createElement(Text, { style: styles.backToNameText }, "Change display name"))), /* @__PURE__ */ React.createElement(
        TouchableOpacity,
        {
          style: styles.switchMode,
          onPress: () => {
            const next = mode === "login" ? "signup" : "login";
            setMode(next);
            if (next === "signup") setSignupStep(displayName ? "credentials" : "name");
          }
        },
        /* @__PURE__ */ React.createElement(Text, { style: styles.switchText }, mode === "login" ? "Don't have an account? " : "Already have an account? ", /* @__PURE__ */ React.createElement(Text, { style: styles.switchLink }, mode === "login" ? "Sign Up" : "Sign In"))
      ))
    )
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  scrollContent: { paddingHorizontal: 24, flexGrow: 1 },
  leoSection: { alignItems: "center", marginBottom: 32 },
  leoImage: { width: 160, height: 160 },
  appName: { fontSize: 28, fontWeight: "700", color: COLORS.textPrimary, marginTop: 8 },
  tagline: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  form: { flex: 1 },
  formTitle: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 24 },
  appleBlock: { marginBottom: 8 },
  appleButton: { width: "100%", height: 52 },
  orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 18 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border },
  orText: { fontSize: 13, color: COLORS.textMuted },
  nameSubtitle: { fontSize: 15, lineHeight: 22, color: COLORS.textSecondary, marginTop: -14, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: "500", color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    height: 50,
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  submitButton: {
    backgroundColor: COLORS.accentFill,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8
  },
  submitButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  disabledButton: { opacity: 0.4 },
  backToName: { alignItems: "center", marginTop: 12 },
  backToNameText: { color: COLORS.accent, fontSize: 13, fontWeight: "600" },
  switchMode: { alignItems: "center", marginTop: 20 },
  switchText: { fontSize: 14, color: COLORS.textMuted },
  switchLink: { color: COLORS.accent, fontWeight: "600" },
  demoBtn: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24
  },
  demoBtnText: { fontSize: 15, fontWeight: "600", color: COLORS.accent }
});
export {
  AuthScreen as default
};
