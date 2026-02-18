import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    async function redirect() {
      if (!user) {
        router.replace('/auth');
        return;
      }

      // Check if user has selected a market
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_market')
        .eq('id', user.id)
        .single();

      if (profile?.selected_market) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/onboarding' as any);
      }
    }

    redirect();
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8B5CF6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1020',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
