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
import { getMarketConfig } from '../../data/marketConfig';
import { MascotBreak } from '../mascot/MascotBreak';

// Market hero images
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

// Stack type config
type StackType = 'NEWS' | 'HISTORY' | 'LESSON';

const STACK_CONFIG: Record<StackType, { emoji: string; tagline: string; color: string }> = {
  NEWS:    { emoji: '📈', tagline: 'Recognize recurring market forces', color: '#3B82F6' },
  LESSON:  { emoji: '📖', tagline: '5-minute concept deep dive', color: '#10B981' },
  HISTORY: { emoji: '✨', tagline: 'Key moments that shaped the industry', color: '#F59E0B' },
};

// Market emoji icons
const MARKET_EMOJIS: Record<string, string> = {
  aerospace: '🚀', neuroscience: '🧠', ai: '🤖', fintech: '💳',
  ev: '⚡', biotech: '🧬', cybersecurity: '🛡️', spacetech: '🛸',
  healthtech: '❤️', robotics: '🦾', cleanenergy: '☀️', climatetech: '🌱',
  agtech: '🚜', logistics: '📦', web3: '🔗',
};

interface SlideIntroCardProps {
  stackTitle: string;
  stackType: StackType;
  totalSlides: number;
  marketId?: string;
}

export function SlideIntroCard({ stackTitle, stackType, totalSlides, marketId }: SlideIntroCardProps) {
  const marketCfg = getMarketConfig(marketId || 'aerospace');
  const config = STACK_CONFIG[stackType];
  const heroImage = MARKET_HERO_IMAGES[marketId || 'aerospace'];
  const marketEmoji = MARKET_EMOJIS[marketId || 'aerospace'] || '🚀';

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
      {/* Hero image */}
      <ImageBackground
        source={heroImage}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay}>
          <Text style={styles.heroEmoji}>{marketEmoji}</Text>
        </View>
        {/* Fade to bg */}
        <View style={styles.heroFade} />
      </ImageBackground>

      {/* Mascot Break — greets user */}
      <View style={styles.mascotWrap}>
        <MascotBreak
          type="intro"
          marketId={marketId}
          message={`Welcome! Let's learn about ${stackTitle}.`}
        />
      </View>

      {/* Content section */}
      <Animated.View style={[styles.content, { opacity, transform: [{ translateY: slideUp }] }]}>
        {/* Icon badge */}
        <View style={[styles.iconBadge, { backgroundColor: config.color + '33' }]}>
          <Text style={styles.badgeEmoji}>{config.emoji}</Text>
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
    alignItems: 'flex-end',
    padding: 16,
    paddingTop: 20,
  },
  heroEmoji: {
    fontSize: 48,
    opacity: 0.35,
  },
  heroFade: {
    height: 60,
    backgroundColor: 'transparent',
    // gradient fade done via overlay
  },
  mascotWrap: {
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 4,
    zIndex: 10,
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
  badgeEmoji: { fontSize: 26 },
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
