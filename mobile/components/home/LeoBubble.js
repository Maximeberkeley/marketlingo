import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';
import { LeoCharacter } from '../mascot/LeoCharacter';
import { SpeechBubble } from '../ui/SpeechBubble';
/**
 * Leo mascot with an animated speech bubble greeting.
 * Uses the real Leo character asset — never an emoji.
 */
export function LeoBubble({ message, animation }) {
    const bubbleScale = useRef(new Animated.Value(0)).current;
    const bubbleOpacity = useRef(new Animated.Value(0)).current;
    const leoScale = useRef(new Animated.Value(0.8)).current;
    const glowPulse = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
        Animated.sequence([
            Animated.spring(leoScale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
            Animated.parallel([
                Animated.spring(bubbleScale, { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }),
                Animated.timing(bubbleOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            ]),
        ]).start();
        // Subtle glow pulse behind Leo
        Animated.loop(Animated.sequence([
            Animated.timing(glowPulse, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
            Animated.timing(glowPulse, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
        ])).start();
    }, [message]);
    return (<View style={styles.container}>
      {/* Glow behind Leo */}
      <Animated.View style={[styles.glow, { opacity: glowPulse }]}/>

      <Animated.View style={[styles.leoWrap, { transform: [{ scale: leoScale }] }]}>
        <LeoCharacter size="lg" animation={animation}/>
      </Animated.View>

      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleOpacity, transform: [{ scale: bubbleScale }] }]}> 
        <SpeechBubble text={message} tail="top-center" tone="purple" textStyle={styles.bubbleText}/>
      </Animated.View>
    </View>);
}
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 8,
    },
    glow: {
        position: 'absolute',
        top: 10,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.accent,
    },
    leoWrap: {
        marginBottom: 10,
    },
    bubbleWrap: { maxWidth: '88%' },
    bubbleText: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 21,
    },
});
