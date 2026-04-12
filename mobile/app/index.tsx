import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Image, Text } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { trackEvent, identifyUser } from '../lib/analytics';
import { COLORS } from '../lib/constants';

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    let isActive = true;
    const safeReplace = (path: string) => {
      if (!isActive) return;
      router.replace(path as any);
    };

    async function redirect() {
      if (!user) {
        safeReplace('/auth');
        return;
      }

      try {
        trackEvent('app_open');
        identifyUser(user.id, { email: user.email || '' });

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('selected_market')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.warn('[Index] Failed to load profile during startup:', profileError.message);
          safeReplace('/(tabs)/home');
          return;
        }

        if (!profile?.selected_market) {
          safeReplace('/onboarding');
          return;
        }

        const { data: progress, error: progressError } = await supabase
          .from('user_progress')
          .select('learning_goal, familiarity_level')
          .eq('user_id', user.id)
          .eq('market_id', profile.selected_market)
          .maybeSingle();

        if (progressError && progressError.code !== 'PGRST116') {
          console.warn('[Index] Failed to load progress during startup:', progressError.message);
          safeReplace('/(tabs)/home');
          return;
        }

        if (!progress?.learning_goal) {
          safeReplace('/onboarding/goal');
        } else if (!progress?.familiarity_level) {
          safeReplace('/onboarding/familiarity');
        } else {
          safeReplace('/(tabs)/home');
        }
      } catch (error) {
        console.warn('[Index] Startup redirect failed:', error);
        safeReplace('/(tabs)/home');
      }
    }

    void redirect();

    return () => {
      isActive = false;
    };
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/mascot/leo-reference.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.appName}>MarketLingo</Text>
      <Text style={styles.tagline}>Master any industry in 6 months</Text>
      <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
