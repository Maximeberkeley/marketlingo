import React, { useRef, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptics';
import { LessonNavigationProvider, useLessonNavigation } from '../../lib/lessonNavigation';

const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  home: 'home',
  roadmap: 'radio',
  practice: 'zap',
  shop: 'shopping-bag',
  notebook: 'edit-3',
  profile: 'user',
};

function TabBarIcon({ name, focused, dot = false }: { name: string; focused: boolean; dot?: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1.05, friction: 4, tension: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  }, [focused]);

  const iconName = TAB_ICONS[name] || 'circle';

  return (
    <View style={styles.tabIcon}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Feather
          name={iconName}
          size={22}
          color={focused ? COLORS.textPrimary : COLORS.textMuted}
        />
      </Animated.View>
      {dot && <View style={styles.newDot} />}
    </View>
  );
}

export default function TabLayout() {
  return <LessonNavigationProvider><TabNavigator /></LessonNavigationProvider>;
}

function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { hidden } = useLessonNavigation();
  // The Shop tab carries a "new" dot until it is opened once.
  const [shopNew, setShopNew] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('ml_shop_tab_seen_v1').then(v => setShopNew(!v)).catch(() => {});
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: hidden ? 'none' : 'flex',
          backgroundColor: COLORS.bg0,
          borderTopColor: COLORS.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: COLORS.textPrimary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Course',
          tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />,
        }}
        listeners={{ tabPress: () => triggerHaptic('selection') }}
      />
      <Tabs.Screen
        name="roadmap"
        options={{
          title: 'Intel',
          tabBarIcon: ({ focused }) => <TabBarIcon name="roadmap" focused={focused} />,
        }}
        listeners={{ tabPress: () => triggerHaptic('selection') }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ focused }) => <TabBarIcon name="practice" focused={focused} />,
        }}
        listeners={{ tabPress: () => triggerHaptic('selection') }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ focused }) => <TabBarIcon name="shop" focused={focused} dot={shopNew && !focused} />,
        }}
        listeners={{ tabPress: () => { triggerHaptic('selection'); setShopNew(false); } }}
      />
      <Tabs.Screen
        name="notebook"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'You',
          tabBarIcon: ({ focused }) => <TabBarIcon name="profile" focused={focused} />,
        }}
        listeners={{ tabPress: () => triggerHaptic('selection') }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  newDot: { position: 'absolute', top: 0, right: -1, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error, borderWidth: 1.5, borderColor: COLORS.bg0 },
  tabIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
