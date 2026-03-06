import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  Animated,
} from 'react-native';
import { COLORS } from '../../lib/constants';
import { Feather } from '@expo/vector-icons';
import { getMarketConfig } from '../../data/marketConfig';

const MARKET_HERO_IMAGES: Record<string, any> = {
  aerospace: require('../../assets/markets/aerospace-hero.jpg'),
  neuroscience: require('../../assets/markets/neuroscience-hero.jpg'),
  ai: require('../../assets/markets/ai-hero.jpg'),
  fintech: require('../../assets/markets/fintech-hero.jpg'),
  ev: require('../../assets/markets/ev-hero.jpg'),
  biotech: require('../../assets/markets/biotech-hero.jpg'),
  cleanenergy: require('../../assets/markets/cleanenergy-hero.jpg'),
  agtech: require('../../assets/markets/agtech-hero.jpg'),
  climatetech: require('../../assets/markets/climatetech-hero.jpg'),
  cybersecurity: require('../../assets/markets/cybersecurity-hero.jpg'),
  spacetech: require('../../assets/markets/spacetech-hero.jpg'),
  robotics: require('../../assets/markets/robotics-hero.jpg'),
  healthtech: require('../../assets/markets/healthtech-hero.jpg'),
  logistics: require('../../assets/markets/logistics-hero.jpg'),
  web3: require('../../assets/markets/web3-hero.jpg'),
};

type StackType = 'NEWS' | 'HISTORY' | 'LESSON';

const STACK_CONFIG: Record<StackType, { icon: keyof typeof Feather.glyphMap; tagline: string; color: string }> = {
  NEWS:    { icon: 'file-text', tagline: 'Recognize recurring market forces', color: '#3B82F6' },
  LESSON:  { icon: 'book-open', tagline: '5-minute concept deep dive', color: '#10B981' },
  HISTORY: { icon: 'layout', tagline: 'Key moments that shaped the industry', color: '#F59E0B' },
};

interface SlideIntroCardProps {
  stackTitle: string;
  stackType: StackType;
  totalSlides: number;
  marketId?: string;
}

export function SlideIntroCard({ stackTitle, stackType, totalSlides, marketId }: SlideIntroCardProps) {
  const config = STACK_CONFIG[stackType];
  const heroImage = MARKET_HERO_IMAGES[marketId || 'aerospace'];

  const slideUp = useRef(new Animated.Value(12)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 250, friction: 22, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.wrapper}>
      <ImageBackground
        source={heroImage}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay} />
        <View style={styles.heroFade} />
      </ImageBackground>

      <Animated.View style={[styles.content, { opacity, transform: [{ translateY: slideUp }] }]}>
        <View style={[styles.iconBadge, { backgroundColor: config.color + '20' }]}>
          <Image source={config.icon} style={styles.badgeIcon} />
        </View>

        <Text style={[styles.typeLabel, { color: config.color }]}>{stackType}</Text>
        <Text style={styles.stackTitle}>{stackTitle}</Text>
        <Text style={styles.tagline}>{config.tagline}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statNum}>{totalSlides}</Text>
            <Text style={styles.statLabel}>Slides</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Text style={styles.statNum}>~{Math.ceil(totalSlides * 0.75)} min</Text>
            <Text style={styles.statLabel}>Read time</Text>
          </View>
        </View>

        <Text style={styles.swipeHint}>Swipe to start →</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.bg1,
  },
  hero: {
    height: 180,
    width: '100%',
    justifyContent: 'flex-end',
  },
  heroImage: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroFade: {
    height: 60,
    backgroundColor: 'transparent',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeIcon: { width: 28, height: 28, resizeMode: 'contain' },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  stackTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  statChip: { alignItems: 'center' },
  statNum: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  swipeHint: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
