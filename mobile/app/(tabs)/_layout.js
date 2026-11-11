import React, { useRef, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  shop: "shopping-bag",
  notebook: "edit-3",
  profile: "user"
};
function TabBarIcon({ name, focused, dot = false }) {
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
  )), dot && /* @__PURE__ */ React.createElement(View, { style: styles.newDot }));
}
function TabLayout() {
  return /* @__PURE__ */ React.createElement(LessonNavigationProvider, null, /* @__PURE__ */ React.createElement(TabNavigator, null));
}
function TabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom > 0 ? insets.bottom : 8;
  const { hidden } = useLessonNavigation();
  const [shopNew, setShopNew] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem("ml_shop_tab_seen_v1").then((v) => setShopNew(!v)).catch(() => {
    });
  }, []);
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
          // 54 px for icon + label on every phone: the item's own 5 px bottom padding left the label 7 px before.
          height: 60 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
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
        name: "shop",
        options: {
          title: "Shop",
          tabBarIcon: ({ focused }) => /* @__PURE__ */ React.createElement(TabBarIcon, { name: "shop", focused, dot: shopNew && !focused })
        },
        listeners: { tabPress: () => {
          triggerHaptic("selection");
          setShopNew(false);
        } }
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
  newDot: { position: "absolute", top: 0, right: -1, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error, borderWidth: 1.5, borderColor: COLORS.bg0 },
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
