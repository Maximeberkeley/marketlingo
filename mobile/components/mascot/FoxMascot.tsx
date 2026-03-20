import React, { useEffect, useRef, useState } from 'react';
import { View, Image, Animated, StyleSheet, ImageSourcePropType } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';

const FOX_MAP: Record<string, ImageSourcePropType> = {
  agtech: require('../../assets/mascot/leo_AgTech.png'),
  ai: require('../../assets/mascot/leo_AImachinelearning.png'),
  biotech: require('../../assets/mascot/leo_biotech.png'),
  cybersecurity: require('../../assets/mascot/leo_cybersecurity.png'),
  ev: require('../../assets/mascot/leo_ev.png'),
  fintech: require('../../assets/mascot/leo_fintech.png'),
  aerospace: require('../../assets/mascot/leo_aerospace.png'),
  robotics: require('../../assets/mascot/leo_robotics.png'),
  neuroscience: require('../../assets/mascot/leo_neuroscience.png'),
};

const DEFAULT_IMAGE = require('../../assets/mascot/leo-reference.png');

interface FoxMascotProps {
  industry: string;
  size?: number;
}

/**
 * Displays the industry-themed fox mascot image.
 * PRO-only feature: Basic users always see the default Leo.
 * PRO users with 'Use Industry Mascots' toggle ON see industry-specific Leo.
 */
export function FoxMascot({ industry, size = 220 }: FoxMascotProps) {
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const [useIndustryMascots, setUseIndustryMascots] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('use_industry_mascots').eq('id', user.id).single()
      .then(({ data }) => {
        if (data && typeof data.use_industry_mascots === 'boolean') {
          setUseIndustryMascots(data.use_industry_mascots);
        }
      }).catch(() => {});
  }, [user]);

  const key = industry?.toLowerCase().replace(/[\s\/]+/g, '');
  const canUseIndustry = isProUser && useIndustryMascots;
  const source = canUseIndustry ? (FOX_MAP[key] || DEFAULT_IMAGE) : DEFAULT_IMAGE;

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.02, duration: 2200, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <View style={[styles.container, { height: size }]}>
      <Animated.View style={{ transform: [{ scale: Animated.multiply(scaleAnim, breatheAnim) }] }}>
        <Image
          source={source}
          style={{ width: size, height: size, resizeMode: 'contain' }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
