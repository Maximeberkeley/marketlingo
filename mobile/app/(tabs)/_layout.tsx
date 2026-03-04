import React from 'react';
import { Tabs } from 'expo-router';
import { View, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { APP_ICONS } from '../../lib/icons';

function TabBarIcon({ icon, focused }: { icon: any; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Image source={icon} style={[styles.iconImage, { opacity: focused ? 1 : 0.45 }]} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bg1,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Learn',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon={APP_ICONS.learn} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon={APP_ICONS.drills} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="roadmap"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon={APP_ICONS.progress} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon={APP_ICONS.profile} focused={focused} />
          ),
        }}
      />
      {/* Notebook still accessible via direct navigation, hidden from tab bar */}
      <Tabs.Screen
        name="notebook"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
});
