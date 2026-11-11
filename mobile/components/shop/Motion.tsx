/**
 * The shop's small motions: a light sheen across hero art, gently floating icons, sections that rise in one after
 * another, and a clock for countdowns. Everything stops (countdowns still tick) when the phone asks for reduced
 * motion. Only transforms and opacity animate, never icon props.
 */
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic } from '../../lib/haptics';

export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then(v => { if (live) setReduce(v); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduce);
    return () => { live = false; sub?.remove?.(); };
  }, []);
  return reduce;
}

/** The current time, updated every second while `active`. */
export function useNow(active = true): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/** A soft band of light that sweeps across its parent every few seconds. Put it last inside an overflow-hidden box. */
export function Sheen({ width = 360, every = 3600, delay = 0 }: { width?: number; every?: number; delay?: number }) {
  const reduce = useReduceMotion();
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(x, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.delay(Math.max(0, every - 1100 - delay)),
      Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, every, delay, x]);
  if (reduce) return null;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.6, width * 1.2] }) }, { skewX: '-18deg' }] }]}>
      <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 90, height: '100%' }} />
    </Animated.View>
  );
}

/** Bobs its child up and down a few points, out of step with its neighbours via `phase`. */
export function Float({ children, distance = 5, phase = 0, style }: { children: React.ReactNode; distance?: number; phase?: number; style?: ViewStyle }) {
  const reduce = useReduceMotion();
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(phase),
      Animated.timing(y, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, phase, y]);
  return <Animated.View style={[style, { transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] }) }] }]}>{children}</Animated.View>;
}

/** Fades and lifts its child in after `index` steps, so a screen's sections arrive one after another. */
export function Rise({ index, children, style }: { index: number; children: React.ReactNode; style?: ViewStyle }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    Animated.timing(v, { toValue: 1, duration: 380, delay: Math.min(index, 8) * 70, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [reduce, index, v]);
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>{children}</Animated.View>;
}

/** Turns its child slowly and forever (sunbursts). */
export function Spin({ children, period = 24000, style }: { children: React.ReactNode; period?: number; style?: ViewStyle }) {
  const reduce = useReduceMotion();
  const r = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.timing(r, { toValue: 1, duration: period, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [reduce, period, r]);
  return <Animated.View pointerEvents="none" style={[style, { transform: [{ rotate: r.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>{children}</Animated.View>;
}

/** Fades and grows its child in and out like a twinkling star, out of step with others via `phase`. */
export function Twinkle({ children, phase = 0, period = 1800, style }: { children: React.ReactNode; phase?: number; period?: number; style?: ViewStyle }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(phase),
      Animated.timing(v, { toValue: 1, duration: period / 2, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: period / 2, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.delay(Math.max(0, 1600 - phase)),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, phase, period, v]);
  return (
    <Animated.View pointerEvents="none" style={[style, { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Springs its child in from small with a little overshoot (the "it's yours" pop). */
export function Pop({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: ViewStyle }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    Animated.sequence([Animated.delay(delay), Animated.spring(v, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true })]).start();
  }, [reduce, delay, v]);
  return <Animated.View style={[style, { opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }]}>{children}</Animated.View>;
}

/** A pressable card that squishes down a little under the finger, with a light tap of haptics. */
export function PressScale({ children, onPress, style, accessibilityLabel, disabled }: {
  children: React.ReactNode; onPress?: () => void; style?: ViewStyle | ViewStyle[]; accessibilityLabel?: string; disabled?: boolean;
}) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(s, { toValue: v, friction: 6, tension: 260, useNativeDriver: true }).start();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => { to(0.965); triggerHaptic('light'); }}
      onPressOut={() => to(1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[style as ViewStyle, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Page dots under a carousel; the active one is a short pill. */
export function Dots({ count, index, color, idle }: { count: number; index: number; color: string; idle: string }) {
  if (count < 2) return null;
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.dot, { backgroundColor: i === index ? color : idle, width: i === index ? 18 : 6 }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 10 },
  dot: { height: 6, borderRadius: 3 },
});
