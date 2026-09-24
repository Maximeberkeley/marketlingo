import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { FoxMascot } from '../mascot/FoxMascot';
import { triggerHaptic } from '../../lib/haptics';
/**
 * Shown once when the learner returns after a long break (4h+).
 * Keeps level / XP off the home screen so the lesson stays the hero.
 */
export function WelcomeBackModal({ visible, level, xp, xpToNextLevel, streak, marketId, marketName, onClose, }) {
    const scale = useRef(new Animated.Value(0.9)).current;
    const fade = useRef(new Animated.Value(0)).current;
    const barFill = useRef(new Animated.Value(0)).current;
    const nextLevelXP = xpToNextLevel && xpToNextLevel > 0 ? xpToNextLevel : 100;
    const progressRatio = Math.max(0, Math.min(1, nextLevelXP > 0 ? (xp % nextLevelXP) / nextLevelXP : 0));
    useEffect(() => {
        if (!visible) {
            scale.setValue(0.9);
            fade.setValue(0);
            barFill.setValue(0);
            return;
        }
        triggerHaptic('light');
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
            Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start();
        Animated.timing(barFill, {
            toValue: progressRatio,
            duration: 900,
            delay: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [visible, progressRatio]);
    return (<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity: fade, transform: [{ scale }] }]}>
          <LinearGradient colors={['#7C3AED', '#8B5CF6', '#A78BFA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.mascotWrap}>
              <FoxMascot industry={marketId || 'aerospace'} size={120}/>
            </View>
            <Text style={styles.heroKicker}>WELCOME BACK</Text>
            <Text style={styles.heroTitle}>Level {level}</Text>
            <Text style={styles.heroSub}>{marketName} insider</Text>
          </LinearGradient>

          <View style={styles.body}>
            <View style={styles.barTrack}>
              <Animated.View style={[
            styles.barFill,
            { width: barFill.interpolate({ inputRange: [0, 1], outputRange: ['4%', '100%'] }) },
        ]}/>
            </View>
            <Text style={styles.barLabel}>
              {xp.toLocaleString()} XP total · next level at {nextLevelXP} XP
            </Text>

            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Feather name="activity" size={15} color={COLORS.streak}/>
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={styles.statLabel}>day streak</Text>
              </View>
              <View style={styles.statDivider}/>
              <View style={styles.stat}>
                <Feather name="zap" size={15} color={COLORS.accent}/>
                <Text style={styles.statValue}>{xp.toLocaleString()}</Text>
                <Text style={styles.statLabel}>total XP</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.cta} onPress={onClose} activeOpacity={0.9}>
              <Text style={styles.ctaText}>Start today's lesson</Text>
              <Feather name="arrow-right" size={17} color="#FFFFFF"/>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>);
}
const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(9, 11, 18, 0.72)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 26,
        overflow: 'hidden',
        backgroundColor: COLORS.bg2,
        ...SHADOWS.lg,
    },
    hero: { paddingTop: 18, paddingBottom: 22, alignItems: 'center' },
    mascotWrap: { height: 120, justifyContent: 'center' },
    heroKicker: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.6,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 4,
    },
    heroTitle: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.6, marginTop: 2 },
    heroSub: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    body: { padding: 20, gap: 14 },
    barTrack: { height: 10, borderRadius: 6, backgroundColor: COLORS.bg1, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 6, backgroundColor: COLORS.accent },
    barLabel: { ...TYPE.caption, color: COLORS.textMuted, textAlign: 'center' },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bg1,
        borderRadius: 16,
        paddingVertical: 14,
    },
    stat: { flex: 1, alignItems: 'center', gap: 3 },
    statDivider: { width: 1, height: 34, backgroundColor: COLORS.border },
    statValue: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    statLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.4 },
    cta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.accent,
        borderRadius: 16,
        paddingVertical: 16,
        ...SHADOWS.accent,
    },
    ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
