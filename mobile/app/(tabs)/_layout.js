import React, { useRef, useEffect } from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../lib/constants";
import { triggerHaptic } from "../../lib/haptics";
import { LessonNavigationProvider, useLessonNavigation } from "../../lib/lessonNavigation";
const TAB_ICONS = {
  home: "home",
  roadmap: "radio",
  practice: "zap",
  notebook: "edit-3",
  profile: "user"
};
function TabBarIcon({ name, focused }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1.05, friction: 4, tension: 200, useNativeDriver: true })
      ]).start();
    } else {
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  }, [focused]);
  const iconName = TAB_ICONS[name] || "circle";
  return /* @__PURE__ */ React.createElement(View, { style: styles.tabIcon }, /* @__PURE__ */ React.createElement(Animated.View, { style: { transform: [{ scale: scaleAnim }] } }, /* @__PURE__ */ React.createElement(
    Feather,
    {
      name: iconName,
      size: 22,
      color: focused ? COLORS.textPrimary : COLORS.textMuted
    }
  )));
}
function TabLayout() {
  return /* @__PURE__ */ React.createElement(LessonNavigationProvider, null, /* @__PURE__ */ React.createElement(TabNavigator, null));
}
function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { hidden } = useLessonNavigation();
  return /* @__PURE__ */ React.createElement(
    Tabs,
    {
      screenOptions: {
        headerShown: false,
        tabBarStyle: {
          display: hidden ? "none" : "flex",
          backgroundColor: COLORS.bg0,
          borderTopColor: COLORS.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8
        },
        tabBarActiveTintColor: COLORS.textPrimary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.3,
          marginTop: 2
        }
      }
    },
    /* @__PURE__ */ React.createElement(
      Tabs.Screen,
      {
        name: "home",
        options: {
          title: "Course",
          tabBarIcon: ({ focused }) => /* @__PURE__ */ React.createElement(TabBarIcon, { name: "home", focused })
        },
        listeners: { tabPress: () => triggerHaptic("selection") }
      }
    ),
    /* @__PURE__ */ React.createElement(
      Tabs.Screen,
      {
        name: "roadmap",
        options: {
          title: "Intel",
          tabBarIcon: ({ focused }) => /* @__PURE__ */ React.createElement(TabBarIcon, { name: "roadmap", focused })
        },
        listeners: { tabPress: () => triggerHaptic("selection") }
      }
    ),
    /* @__PURE__ */ React.createElement(
      Tabs.Screen,
      {
        name: "practice",
        options: {
          title: "Practice",
          tabBarIcon: ({ focused }) => /* @__PURE__ */ React.createElement(TabBarIcon, { name: "practice", focused })
        },
        listeners: { tabPress: () => triggerHaptic("selection") }
      }
    ),
    /* @__PURE__ */ React.createElement(
      Tabs.Screen,
      {
        name: "notebook",
        options: {
          href: null
        }
      }
    ),
    /* @__PURE__ */ React.createElement(
      Tabs.Screen,
      {
        name: "profile",
        options: {
          title: "You",
          tabBarIcon: ({ focused }) => /* @__PURE__ */ React.createElement(TabBarIcon, { name: "profile", focused })
        },
        listeners: { tabPress: () => triggerHaptic("selection") }
      }
    )
  );
}
const styles = StyleSheet.create({
  tabIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center"
  }
});
export {
  TabLayout as default
};
