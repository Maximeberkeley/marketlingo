import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptics';
const TAB_ICONS = {
    home: 'home',
    roadmap: 'radio',
    practice: 'zap',
    notebook: 'edit-3',
    profile: 'user',
};
function TabBarIcon({ name, focused }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        if (focused) {
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1.05, friction: 4, tension: 200, useNativeDriver: true }),
            ]).start();
        }
        else {
            Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        }
    }, [focused]);
    const iconName = TAB_ICONS[name] || 'circle';
    return (<View style={styles.tabIcon}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Feather name={iconName} size={22} color={focused ? COLORS.textPrimary : COLORS.textMuted}/>
      </Animated.View>
      
    </View>);
}
export default function TabLayout() {
    const insets = useSafeAreaInsets();
    return (<Tabs screenOptions={{
            headerShown: false,
            tabBarStyle: {
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
        }}>
      <Tabs.Screen name="home" options={{
            title: 'Course',
            tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused}/>,
        }} listeners={{ tabPress: () => triggerHaptic('selection') }}/>
      <Tabs.Screen name="roadmap" options={{
            title: 'Intel',
            tabBarIcon: ({ focused }) => <TabBarIcon name="roadmap" focused={focused}/>,
        }} listeners={{ tabPress: () => triggerHaptic('selection') }}/>
      <Tabs.Screen name="practice" options={{
            title: 'Practice',
            tabBarIcon: ({ focused }) => <TabBarIcon name="practice" focused={focused}/>,
        }} listeners={{ tabPress: () => triggerHaptic('selection') }}/>
      <Tabs.Screen name="notebook" options={{
            href: null,
        }}/>
      <Tabs.Screen name="profile" options={{
            title: 'You',
            tabBarIcon: ({ focused }) => <TabBarIcon name="profile" focused={focused}/>,
        }} listeners={{ tabPress: () => triggerHaptic('selection') }}/>
    </Tabs>);
}
const styles = StyleSheet.create({
    tabIcon: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
