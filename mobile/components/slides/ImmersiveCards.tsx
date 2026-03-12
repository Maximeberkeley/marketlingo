import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPE, SHADOWS } from '../../lib/constants';
import { FLUID, fluidFont, fluidLineHeight } from '../../lib/fluidType';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Market illustrations for backgrounds ──
const MARKET_ILLUSTRATIONS: Record<string, any> = {
  aerospace: require('../../assets/illustrations/aerospace.png'),
  neuroscience: require('../../assets/illustrations/neuroscience.png'),
  ai: require('../../assets/illustrations/ai.png'),
  fintech: require('../../assets/illustrations/fintech.png'),
  ev: require('../../assets/illustrations/ev.png'),
  biotech: require('../../assets/illustrations/biotech.png'),
  cleanenergy: require('../../assets/illustrations/cleanenergy.png'),
  agtech: require('../../assets/illustrations/agtech.png'),
  climatetech: require('../../assets/illustrations/climatetech.png'),
  cybersecurity: require('../../assets/illustrations/cybersecurity.png'),
  spacetech: require('../../assets/illustrations/spacetech.png'),
  robotics: require('../../assets/illustrations/robotics.png'),
  healthtech: require('../../assets/illustrations/healthtech.png'),
  logistics: require('../../assets/illustrations/logistics.png'),
  web3: require('../../assets/illustrations/web3.png'),
};

// ── Goal icon mapping — pick the most fitting Feather icon ──
const GOAL_ICONS: { pattern: RegExp; icon: keyof typeof Feather.glyphMap }[] = [
  { pattern: /market|industry|sector/i, icon: 'trending-up' },
  { pattern: /revenue|money|financ|valuation|profit/i, icon: 'dollar-sign' },
  { pattern: /technolog|innovat|ai|software/i, icon: 'cpu' },
  { pattern: /compan|player|business/i, icon: 'briefcase' },
  { pattern: /regulat|policy|law|govern/i, icon: 'shield' },
  { pattern: /risk|challenge|threat/i, icon: 'alert-triangle' },
  { pattern: /growth|scale|expand/i, icon: 'bar-chart-2' },
  { pattern: /strateg|compet|advantage/i, icon: 'target' },
  { pattern: /global|geopolit|world/i, icon: 'globe' },
  { pattern: /supply|chain|logistic/i, icon: 'truck' },
  { pattern: /energy|power|electric/i, icon: 'battery-charging' },
  { pattern: /health|medical|bio/i, icon: 'heart' },
  { pattern: /data|analytic|metric/i, icon: 'database' },
  { pattern: /security|cyber|protect/i, icon: 'lock' },
  { pattern: /invest|fund|capital/i, icon: 'pie-chart' },
];

function getGoalIcon(text: string): keyof typeof Feather.glyphMap {
  for (const { pattern, icon } of GOAL_ICONS) {
    if (pattern.test(text)) return icon;
  }
  return 'check-circle';
}

// ══════════════════════════════════════════════════════════════
// ── OBJECTIVE CARD — "What you'll learn"
// ══════════════════════════════════════════════════════════════
interface ObjectiveCardProps {
  goals: string[];
  accentColor: string;
  marketId?: string;
}

export function ObjectiveCard({ goals, accentColor, marketId }: ObjectiveCardProps) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  // Staggered goal animations
  const goalAnims = useRef(goals.map(() => ({
    opacity: new Animated.Value(0),
    translateX: new Animated.Value(-24),
  }))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 180, friction: 18, useNativeDriver: true }),
    ]).start(() => {
      // Stagger goals
      goalAnims.forEach((anim, i) => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(anim.opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(anim.translateX, { toValue: 0, tension: 200, friction: 18, useNativeDriver: true }),
          ]).start();
        }, i * 120);
      });
    });
  }, []);

  const illustration = MARKET_ILLUSTRATIONS[marketId || 'aerospace'];

  return (
    <Animated.View style={[objStyles.container, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      {/* Illustration watermark */}
      {illustration && (
        <Image source={illustration} style={objStyles.watermark} />
      )}

      {/* Top accent stripe */}
      <View style={[objStyles.accentStripe, { backgroundColor: accentColor }]} />

      {/* Icon */}
      <View style={[objStyles.iconCircle, { backgroundColor: accentColor + '15' }]}>  
        <Feather name="compass" size={28} color={accentColor} />
      </View>

      {/* Label */}
      <Text style={[objStyles.label, { color: accentColor }]}>LEARNING OBJECTIVES</Text>
      <Text style={objStyles.heading}>After this lesson, you'll understand:</Text>

      {/* Goals */}
      <View style={objStyles.goalsList}>
        {goals.map((goal, i) => (
          <Animated.View
            key={i}
            style={[
              objStyles.goalRow,
              {
                opacity: goalAnims[i]?.opacity || 1,
                transform: [{ translateX: goalAnims[i]?.translateX || 0 }],
              },
            ]}
          >
            <View style={[objStyles.goalIcon, { backgroundColor: accentColor + '12' }]}>
              <Feather name={getGoalIcon(goal)} size={18} color={accentColor} />
            </View>
            <Text style={objStyles.goalText}>{goal}</Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

const objStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    padding: 28,
    paddingBottom: 48,
    minHeight: SCREEN_HEIGHT * 0.5,
    justifyContent: 'center',
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  accentStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  watermark: {
    position: 'absolute',
    right: -30,
    top: -20,
    width: 160,
    height: 160,
    resizeMode: 'contain',
    opacity: 0.06,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heading: {
    fontSize: fluidFont(20, 24),
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
    lineHeight: fluidLineHeight(20, 24, 1.3),
    marginBottom: 28,
  },
  goalsList: {
    gap: 16,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  goalText: {
    fontSize: fluidFont(15, 17),
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: fluidLineHeight(15, 17, 1.45),
    flexShrink: 1,
    flex: 1,
  },
});

// ══════════════════════════════════════════════════════════════
// ── RECAP CARD — "Building on yesterday..."
// ══════════════════════════════════════════════════════════════
interface RecapCardProps {
  dayNumber?: number;
  previousTopic?: string;
  currentTopic: string;
  accentColor: string;
  marketId?: string;
}

export function RecapCard({ dayNumber, previousTopic, currentTopic, accentColor, marketId }: RecapCardProps) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const lineScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideUp, { toValue: 0, tension: 180, friction: 18, useNativeDriver: true }),
      ]),
      Animated.spring(lineScale, { toValue: 1, tension: 120, friction: 14, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[recapStyles.container, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      <View style={[recapStyles.accentStripe, { backgroundColor: accentColor }]} />

      <View style={[recapStyles.iconCircle, { backgroundColor: accentColor + '12' }]}>
        <Feather name="link" size={24} color={accentColor} />
      </View>

      <Text style={[recapStyles.label, { color: accentColor }]}>CONTINUITY</Text>
      <Text style={recapStyles.heading}>Building on what you know</Text>

      {/* Timeline connector */}
      <View style={recapStyles.timeline}>
        {/* Previous day */}
        {previousTopic && (
          <View style={recapStyles.timelineItem}>
            <View style={[recapStyles.timelineDot, { backgroundColor: COLORS.textMuted }]} />
            <View style={recapStyles.timelineContent}>
              <Text style={recapStyles.timelineDayLabel}>
                {dayNumber && dayNumber > 1 ? `Day ${dayNumber - 1}` : 'Previously'}
              </Text>
              <Text style={recapStyles.timelinePrevTopic}>{previousTopic}</Text>
            </View>
          </View>
        )}

        {/* Connecting line */}
        <Animated.View
          style={[
            recapStyles.timelineLine,
            { backgroundColor: accentColor + '30', transform: [{ scaleY: lineScale }] },
          ]}
        />

        {/* Current day */}
        <View style={recapStyles.timelineItem}>
          <View style={[recapStyles.timelineDot, recapStyles.timelineDotActive, { backgroundColor: accentColor }]} />
          <View style={recapStyles.timelineContent}>
            <Text style={[recapStyles.timelineDayLabel, { color: accentColor, fontWeight: '700' }]}>
              {dayNumber ? `Day ${dayNumber}` : 'Today'}
            </Text>
            <Text style={recapStyles.timelineCurrentTopic}>{currentTopic}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const recapStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    padding: 28,
    paddingBottom: 48,
    minHeight: SCREEN_HEIGHT * 0.45,
    justifyContent: 'center',
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  accentStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heading: {
    fontSize: fluidFont(20, 24),
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
    lineHeight: fluidLineHeight(20, 24, 1.25),
    marginBottom: 28,
  },
  timeline: {
    paddingLeft: 4,
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 4,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
  },
  timelineDotActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -2,
    marginTop: 2,
  },
  timelineLine: {
    width: 3,
    height: 32,
    marginLeft: 5.5,
    borderRadius: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  timelinePrevTopic: {
    fontSize: fluidFont(14, 16),
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: fluidLineHeight(14, 16, 1.4),
  },
  timelineCurrentTopic: {
    fontSize: fluidFont(16, 19),
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: fluidLineHeight(16, 19, 1.35),
  },
});

// ══════════════════════════════════════════════════════════════
// ── REFLECTION CARD — "Why this matters"
// ══════════════════════════════════════════════════════════════
interface ReflectionCardProps {
  keyTakeaway: string;
  nextPreview?: string;
  accentColor: string;
  dayNumber?: number;
}

export function ReflectionCard({ keyTakeaway, nextPreview, accentColor, dayNumber }: ReflectionCardProps) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const quoteScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 160, friction: 16, useNativeDriver: true }),
      Animated.spring(quoteScale, { toValue: 1, tension: 200, friction: 20, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[reflStyles.container, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      <View style={[reflStyles.accentStripe, { backgroundColor: accentColor }]} />

      {/* Big quote mark */}
      <Animated.View style={[reflStyles.quoteMark, { transform: [{ scale: quoteScale }] }]}>
        <Text style={[reflStyles.quoteGlyph, { color: accentColor + '20' }]}>"</Text>
      </Animated.View>

      <View style={[reflStyles.iconCircle, { backgroundColor: accentColor + '12' }]}>
        <Feather name="key" size={22} color={accentColor} />
      </View>

      <Text style={[reflStyles.label, { color: accentColor }]}>KEY TAKEAWAY</Text>
      <Text style={reflStyles.takeaway}>{keyTakeaway}</Text>

      {/* Divider */}
      <View style={reflStyles.divider} />

      {/* What's next */}
      {nextPreview && (
        <View style={reflStyles.nextSection}>
          <View style={reflStyles.nextRow}>
            <Feather name="arrow-right-circle" size={18} color={accentColor} />
            <Text style={[reflStyles.nextLabel, { color: accentColor }]}>Coming up next</Text>
          </View>
          <Text style={reflStyles.nextText}>{nextPreview}</Text>
        </View>
      )}

      {dayNumber && (
        <View style={reflStyles.progressHint}>
          <View style={reflStyles.progressBar}>
            <View
              style={[
                reflStyles.progressFill,
                { backgroundColor: accentColor, width: `${Math.min(100, (dayNumber / 180) * 100)}%` },
              ]}
            />
          </View>
          <Text style={reflStyles.progressText}>
            Day {dayNumber} of 180
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const reflStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    padding: 28,
    paddingTop: 36,
    paddingBottom: 48,
    minHeight: SCREEN_HEIGHT * 0.48,
    justifyContent: 'center',
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  accentStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  quoteMark: {
    position: 'absolute',
    top: 12,
    right: 20,
  },
  quoteGlyph: {
    fontSize: 100,
    fontWeight: '800',
    lineHeight: 100,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  takeaway: {
    fontSize: fluidFont(18, 22),
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    lineHeight: fluidLineHeight(18, 22, 1.4),
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 24,
  },
  nextSection: {
    gap: 8,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nextText: {
    fontSize: fluidFont(14, 16),
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: fluidLineHeight(14, 16, 1.45),
    paddingLeft: 26,
  },
  progressHint: {
    marginTop: 20,
    gap: 6,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textAlign: 'right',
  },
});
