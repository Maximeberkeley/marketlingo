import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { storage } from '../lib/storage';

export default function Index() {
  useEffect(() => {
    async function redirect() {
      const industry = await storage.getIndustry();
      const familiarity = await storage.getFamiliarity();

      if (industry && familiarity) {
        router.replace('/(tabs)/home');
      } else if (industry) {
        router.replace('/onboarding/familiarity');
      } else {
        router.replace('/onboarding');
      }
    }

    redirect();
  }, []);

  return (
    <View className="flex-1 bg-bg-0 items-center justify-center">
      <ActivityIndicator size="large" color="#8B5CF6" />
    </View>
  );
}
