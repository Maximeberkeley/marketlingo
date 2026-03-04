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

    async function redirect() {
      if (!user) {
        router.replace('/auth');
        return;
      }

      trackEvent('app_open');
      identifyUser(user.id, { email: user.email || '' });

      // Check if user has selected a market
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_market')
        .eq('id', user.id)
        .single();

      if (!profile?.selected_market) {
        router.replace('/onboarding' as any);
        return;
      }

      // Check goal + familiarity for selected market
      const { data: progress } = await supabase
        .from('user_progress')
        .select('learning_goal, familiarity_level')
        .eq('user_id', user.id)
        .eq('market_id', profile.selected_market)
        .maybeSingle();

      if (!progress?.learning_goal) {
        router.replace('/onboarding/goal' as any);
      } else if (!progress?.familiarity_level) {
        router.replace('/onboarding/familiarity' as any);
      } else {
        router.replace('/(tabs)/home');
      }
    }

    redirect();
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
