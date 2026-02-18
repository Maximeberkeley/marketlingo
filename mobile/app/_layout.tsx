import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../hooks/useAuth';
import { LeoProvider } from '../components/mascot/LeoCharacter';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <LeoProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0B1020' },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="onboarding/index" />
              <Stack.Screen name="onboarding/familiarity" />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="trainer" />
              <Stack.Screen name="games" />
              <Stack.Screen name="drills" />
              <Stack.Screen name="summaries" />
              <Stack.Screen name="achievements" />
              <Stack.Screen name="leaderboard" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="investment-lab" />
              <Stack.Screen name="investment-module" />
              <Stack.Screen name="investment-certificate" />
              <Stack.Screen name="investment-watchlist" />
              <Stack.Screen name="regulatory-hub" />
              <Stack.Screen name="subscription" />
            </Stack>
          </LeoProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
