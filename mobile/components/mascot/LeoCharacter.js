import React, { useState, createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
const LeoContext = createContext(undefined);
export function LeoProvider({ children }) {
    const [animation, setAnimation] = useState('idle');
    const [variant, setVariant] = useState('normal');
    const triggerSuccess = useCallback(() => {
        setAnimation('success');
        setTimeout(() => setAnimation('idle'), 1500);
    }, []);
    const triggerFailure = useCallback(() => {
        setAnimation('failure');
        setTimeout(() => setAnimation('idle'), 1500);
    }, []);
    const triggerCelebrating = useCallback(() => {
        setAnimation('celebrating');
        setTimeout(() => setAnimation('idle'), 2500);
    }, []);
    return (<LeoContext.Provider value={{
            animation,
            variant,
            setAnimation,
            setVariant,
            triggerSuccess,
            triggerFailure,
            triggerCelebrating,
        }}>
      {children}
    </LeoContext.Provider>);
}
export function useLeo() {
    const context = useContext(LeoContext);
    if (!context) {
        return {
            animation: 'idle',
            variant: 'normal',
            setAnimation: () => { },
            setVariant: () => { },
            triggerSuccess: () => { },
            triggerFailure: () => { },
            triggerCelebrating: () => { },
        };
    }
    return context;
}
const sizeMap = {
    sm: 80,
    md: 120,
    course: 144,
    lg: 160,
    xl: 200,
};
const LEO_IMAGES = {
    idle: require('../../assets/mascot/leo-idle.png'),
    thinking: require('../../assets/mascot/leo-thinking.png'),
    waving: require('../../assets/mascot/leo-waving.png'),
    success: require('../../assets/mascot/leo-success.png'),
    celebrating: require('../../assets/mascot/leo-celebrating.png'),
    failure: require('../../assets/mascot/leo-failure.png'),
    urgent: require('../../assets/mascot/leo-rain.png'),
    sleeping: require('../../assets/mascot/leo-sleeping.png'),
    sassy: require('../../assets/mascot/leo-sassy.png'),
    licking: require('../../assets/mascot/leo-licking.png'),
    reading: require('../../assets/mascot/leo-reading.png'),
    trophy: require('../../assets/mascot/leo-trophy.png'),
};
export function LeoCharacter({ size = 'md', animation = 'idle', still = false, }) {
    const px = sizeMap[size];
    const breatheAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        if (still)
            return;
        const breathing = Animated.loop(Animated.sequence([
            Animated.timing(breatheAnim, {
                toValue: 1.03,
                duration: 2000,
                useNativeDriver: true,
            }),
            Animated.timing(breatheAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            }),
        ]));
        breathing.start();
        return () => breathing.stop();
    }, [breatheAnim, still]);
    const bounceAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (still)
            return;
        if (animation === 'celebrating' || animation === 'success' || animation === 'waving') {
            Animated.sequence([
                Animated.timing(bounceAnim, { toValue: -10, duration: 150, useNativeDriver: true }),
                Animated.timing(bounceAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
                Animated.timing(bounceAnim, { toValue: -6, duration: 120, useNativeDriver: true }),
                Animated.timing(bounceAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
            ]).start();
        }
    }, [animation, bounceAnim]);
    const imageSource = LEO_IMAGES[animation] || LEO_IMAGES.idle;
    return (<View style={[styles.container, { width: px, height: px }]}>
      <Animated.View style={still
            ? styles.stillImageWrapper
            : {
                width: '100%',
                height: '100%',
                transform: [{ scale: breatheAnim }, { translateY: bounceAnim }],
            }}>
        <Image source={imageSource} resizeMode="contain" style={styles.image}/>
      </Animated.View>
    </View>);
}
const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stillImageWrapper: {
        width: '100%',
        height: '100%',
        backfaceVisibility: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
        alignSelf: 'center',
        backfaceVisibility: 'hidden',
        imageRendering: 'crisp-edges',
    },
});
