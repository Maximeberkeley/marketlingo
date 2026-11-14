import React, { useRef, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs } from 'expo-router';
import { View, Image, StyleSheet, Animated, Easing, ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { isDark } from '../../lib/theme';
import { triggerHaptic } from '../../lib/haptics';
import { LessonNavigationProvider, useLessonNavigation } from '../../lib/lessonNavigation';

type TabIconSet = { active: ImageSourcePropType; inactive: ImageSourcePropType; inactiveDark: ImageSourcePropType };

// Colour tab icons (mobile/assets/tabs, 22 pt @1x/@2x/@3x). Inactive is the same drawing in grey;
// the dark tab bar gets a dimmer grey so unfocused tabs recede like the old textMuted glyphs.
const TAB_ICONS: Record<string, TabIconSet> = {
  home: {
    active: require('../../assets/tabs/course-active.png'),
    inactive: require('../../assets/tabs/course-inactive.png'),
    inactiveDark: require('../../assets/tabs/course-inactive-dark.png'),
  },
  roadmap: {
    active: require('../../assets/tabs/intel-active.png'),
    inactive: require('../../assets/tabs/intel-inactive.png'),
    inactiveDark: require('../../assets/tabs/intel-inactive-dark.png'),
  },
  practice: {
    active: require('../../assets/tabs/practice-active.png'),
    inactive: require('../../assets/tabs/practice-inactive.png'),
    inactiveDark: require('../../assets/tabs/practice-inactive-dark.png'),
  },
  shop: {
    active: require('../../assets/tabs/shop-active.png'),
    inactive: require('../../assets/tabs/shop-inactive.png'),
    inactiveDark: require('../../assets/tabs/shop-inactive-dark.png'),
  },
  profile: {
    active: require('../../assets/tabs/you-active.png'),
    inactive: require('../../assets/tabs/you-inactive.png'),
    inactiveDark: require('../../assets/tabs/you-inactive-dark.png'),
  },
};

const TAB_ICON_SIZE = 22;

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

  const icons = TAB_ICONS[name];
  const source = icons ? (focused ? icons.active : isDark ? icons.inactiveDark : icons.inactive) : undefined;

  return (
    <View style={styles.tabIcon}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {source ? (
          <Image source={source} style={styles.tabImage} resizeMode="contain" fadeDuration={0} />
        ) : null}
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
  // Phones without a home indicator (iPhone SE) report a 0 inset; keep the labels off the screen's bottom edge.
  const bottomPad = insets.bottom > 0 ? insets.bottom : 8;
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
          // 54 px for icon + label on every phone: the item's own 5 px bottom padding left the label 7 px before.
          height: 60 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
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
  tabImage: { width: TAB_ICON_SIZE, height: TAB_ICON_SIZE },
  tabIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
