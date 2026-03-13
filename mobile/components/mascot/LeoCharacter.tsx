import React, { useState, createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

export type LeoAnim = 'idle' | 'thinking' | 'success' | 'failure' | 'waving' | 'celebrating' | 'urgent' | 'sleeping';
export type LeoVariant = 'normal' | 'sick' | 'happy' | 'sleepy';

interface LeoContextType {
  animation: LeoAnim;
  variant: LeoVariant;
  setAnimation: (a: LeoAnim) => void;
  setVariant: (v: LeoVariant) => void;
  triggerSuccess: () => void;
  triggerFailure: () => void;
  triggerCelebrating: () => void;
}

const LeoContext = createContext<LeoContextType | undefined>(undefined);

export function LeoProvider({ children }: { children: React.ReactNode }) {
  const [animation, setAnimation] = useState<LeoAnim>('idle');
  const [variant, setVariant] = useState<LeoVariant>('normal');

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

  return (
    <LeoContext.Provider
      value={{
        animation,
        variant,
        setAnimation,
        setVariant,
        triggerSuccess,
        triggerFailure,
        triggerCelebrating,
      }}
    >
      {children}
    </LeoContext.Provider>
  );
}

export function useLeo() {
  const context = useContext(LeoContext);
  if (!context) {
    return {
      animation: 'idle' as LeoAnim,
      variant: 'normal' as LeoVariant,
      setAnimation: () => {},
      setVariant: () => {},
      triggerSuccess: () => {},
      triggerFailure: () => {},
      triggerCelebrating: () => {},
    };
  }
  return context;
}

const sizeMap = {
  sm: 80,
  md: 120,
  lg: 160,
  xl: 200,
};

interface LeoCharacterProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animation?: LeoAnim;
  variant?: LeoVariant;
}

const LEO_IMAGES: Record<string, any> = {
  idle: require('../../assets/mascot/leo-reference.png'),
  thinking: require('../../assets/mascot/leo-reference.png'),
  waving: require('../../assets/mascot/leo-reference.png'),
  success: require('../../assets/mascot/leo-celebrating.png'),
  celebrating: require('../../assets/mascot/leo-celebrating.png'),
  failure: require('../../assets/mascot/leo-dizzy.png'),
  urgent: require('../../assets/mascot/leo-dizzy.png'),
  sleeping: require('../../assets/mascot/leo-reference.png'),
};

export function LeoCharacter({
  size = 'md',
  animation = 'idle',
}: LeoCharacterProps) {
  const px = sizeMap[size];
  const breatheAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
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
      ])
    );
    breathing.start();
    return () => breathing.stop();
  }, [breatheAnim]);

  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  return (
    <View style={[styles.container, { width: px, height: px }]}>
      <View style={[styles.shadow, { width: px * 0.5, left: px * 0.25, bottom: px * 0.05 }]} />
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          transform: [{ scale: breatheAnim }, { translateY: bounceAnim }],
        }}
      >
        <Image
          source={imageSource}
          style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    position: 'absolute',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 50,
    bottom: 0,
  },
});
