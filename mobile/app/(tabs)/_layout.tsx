import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { APP_ICONS } from '../../lib/icons';

function TabBarIcon({ icon, focused }: { icon: any; focused: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.45)).current;

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
      ]).start();
    }
    Animated.timing(opacityAnim, {
      toValue: focused ? 1 : 0.45,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <View style={styles.tabIcon}>
      <Animated.Image
        source={icon}
        style={[styles.iconImage, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
      />
      {focused && <View style={styles.activeIndicator} />}
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
  activeIndicator: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.accent,
  },
});
