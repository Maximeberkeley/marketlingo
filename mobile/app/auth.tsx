import React, { useState, useEffect } from 'react';
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
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { DemoLesson } from '../components/demo/DemoLesson';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_SEEN_KEY = 'ml_demo_seen';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [demoSeen, setDemoSeen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DEMO_SEEN_KEY).then((val) => {
      if (val === 'true') setDemoSeen(true);
    });
  }, []);

  const handleStartDemo = () => {
    setShowDemo(true);
    AsyncStorage.setItem(DEMO_SEEN_KEY, 'true');
    setDemoSeen(true);
  };

  const handleGoogleAuth = async () => {
    try {
      const redirectUrl = makeRedirectUri({ scheme: 'marketlingo' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
      if (data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      }
      if (error) Alert.alert('Error', error.message);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Google sign in failed');
    }
  };

  const handleAppleAuth = async () => {
    try {
      const redirectUrl = makeRedirectUri({ scheme: 'marketlingo' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: redirectUrl },
      });
      if (data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      }
      if (error) Alert.alert('Error', error.message);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Apple sign in failed');
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = mode === 'login'
        ? await signInWithEmail(email.trim(), password)
        : await signUpWithEmail(email.trim(), password);

      if (!result.success) {
        Alert.alert('Error', result.error || 'Something went wrong.');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (showDemo) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <DemoLesson
          onSignUp={() => { setShowDemo(false); setMode('signup'); }}
          onClose={() => setShowDemo(false)}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Leo Graduation Mascot */}
        <View style={styles.leoSection}>
          <Image
            source={require('../assets/mascot/leo-reference.png')}
            style={styles.leoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>MarketLingo</Text>
          <Text style={styles.tagline}>Master any industry in 6 months</Text>
        </View>

        {/* Demo Lesson CTA — only show if not already done */}
        {!demoSeen && (
          <TouchableOpacity style={styles.demoBtn} onPress={handleStartDemo} activeOpacity={0.8}>
            <Text style={styles.demoBtnText}>Try a free lesson first →</Text>
          </TouchableOpacity>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'login' ? 'Sign In' : 'Sign Up'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* OAuth */}
          <View style={styles.oauthRow}>
            <TouchableOpacity style={styles.oauthButton} onPress={handleGoogleAuth}>
              <Text style={styles.oauthEmoji}>G</Text>
              <Text style={styles.oauthLabel}>Google</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.oauthButton} onPress={handleAppleAuth}>
                <Text style={styles.oauthEmoji}></Text>
                <Text style={styles.oauthLabel}>Apple</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.switchMode}
            onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            <Text style={styles.switchText}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchLink}>
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  scrollContent: { paddingHorizontal: 24, flexGrow: 1 },
  leoSection: { alignItems: 'center', marginBottom: 32 },
  leoImage: { width: 160, height: 160 },
  appName: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8 },
  tagline: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  form: { flex: 1 },
  formTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    height: 50, backgroundColor: COLORS.bg2, borderRadius: 14, paddingHorizontal: 16,
    fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  submitButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  switchMode: { alignItems: 'center', marginTop: 20 },
  switchText: { fontSize: 14, color: COLORS.textMuted },
  switchLink: { color: COLORS.accent, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 12, color: COLORS.textMuted },
  oauthRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  oauthButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, backgroundColor: COLORS.bg2, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  oauthEmoji: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  oauthLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  demoBtn: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  demoBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.accent },
});
