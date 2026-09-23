import React, { useEffect, useState } from 'react';
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
import { useLocalSearchParams } from 'expo-router';
import { COLORS } from '../lib/constants';
import { useAuth } from '../hooks/useAuth';
import { storage } from '../lib/storage';
import { LeoCharacter } from '../components/mascot/LeoCharacter';
import { normalizeDisplayName } from '../hooks/useDisplayName';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupStep, setSignupStep] = useState<'name' | 'credentials'>('name');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (params.mode === 'signup') setMode('signup');
    void storage.getDisplayName().then((name) => {
      if (name) {
        setDisplayName(name);
        setSignupStep('credentials');
      }
    });
  }, [params.mode]);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const result: { success: boolean; error: string | null; message?: string } =
        mode === 'login'
          ? await signInWithEmail(email.trim(), password)
          : await signUpWithEmail(email.trim(), password, normalizeDisplayName(displayName));

      if (!result.success) {
        Alert.alert('Error', result.error || 'Something went wrong.');
      } else if (mode === 'signup' && result.message) {
        Alert.alert('Check your email', result.message);
      } else if (mode === 'signup') {
        await storage.setDisplayName(normalizeDisplayName(displayName));
        router.replace('/onboarding/welcome' as any);
      } else {
        // Existing users go to index which handles routing
        router.replace('/');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }

  };

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
        <View style={styles.leoSection}>
          {mode === 'signup' && signupStep === 'name'
            ? <LeoCharacter size="lg" animation="thinking" still />
            : <Image source={require('../assets/mascot/leo-reference.png')} style={styles.leoImage} resizeMode="contain" />}
          <Text style={styles.appName}>MarketLingo</Text>
          <Text style={styles.tagline}>Master any industry in 6 months</Text>
        </View>

        {mode === 'login' && (
          <TouchableOpacity style={styles.demoBtn} onPress={() => router.push('/demo' as any)} activeOpacity={0.8}>
            <Text style={styles.demoBtnText}>Try a free lesson first →</Text>
          </TouchableOpacity>
        )}

        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {mode === 'login' ? 'Welcome back' : signupStep === 'name' ? 'What should we call you?' : 'Create account'}
          </Text>

          {mode === 'signup' && signupStep === 'name' ? (
            <>
              <Text style={styles.nameSubtitle}>Choose a display name or nickname for your journey.</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name..."
                  placeholderTextColor={COLORS.textMuted}
                  value={displayName}
                  onChangeText={(value) => setDisplayName(value.slice(0, 40))}
                  autoFocus
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={40}
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    if (displayName.trim()) {
                      void storage.setDisplayName(normalizeDisplayName(displayName));
                      setSignupStep('credentials');
                    }
                  }}
                />
              </View>
              <TouchableOpacity
                style={[styles.submitButton, !displayName.trim() && styles.disabledButton]}
                disabled={!displayName.trim()}
                onPress={() => {
                  void storage.setDisplayName(normalizeDisplayName(displayName));
                  setSignupStep('credentials');
                }}
              >
                <Text style={styles.submitButtonText}>Continue</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>

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

          {mode === 'signup' && (
            <TouchableOpacity style={styles.backToName} onPress={() => setSignupStep('name')}>
              <Text style={styles.backToNameText}>Change display name</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.helperText}>
            Social sign-in has been removed from the mobile app until the native OAuth flow is fully configured.
          </Text>
            </>
          )}

          <TouchableOpacity
            style={styles.switchMode}
            onPress={() => {
              const next = mode === 'login' ? 'signup' : 'login';
              setMode(next);
              if (next === 'signup') setSignupStep(displayName ? 'credentials' : 'name');
            }}
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
  nameSubtitle: { fontSize: 15, lineHeight: 22, color: COLORS.textSecondary, marginTop: -14, marginBottom: 24 },
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
  disabledButton: { opacity: 0.4 },
  backToName: { alignItems: 'center', marginTop: 12 },
  backToNameText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  switchMode: { alignItems: 'center', marginTop: 20 },
  switchText: { fontSize: 14, color: COLORS.textMuted },
  switchLink: { color: COLORS.accent, fontWeight: '600' },
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