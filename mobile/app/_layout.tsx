import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { storage } from '../lib/storage';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const industry = await storage.getIndustry();
        const familiarity = await storage.getFamiliarity();
        
        if (industry && familiarity) {
          setInitialRoute('(tabs)');
        } else if (industry) {
          setInitialRoute('onboarding/familiarity');
        } else {
          setInitialRoute('onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setInitialRoute('onboarding');
      } finally {
        setIsReady(true);
      }
    }

    checkOnboardingStatus();
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 bg-bg-0 items-center justify-center">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0B1020' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="onboarding/index" />
          <Stack.Screen name="onboarding/familiarity" />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
