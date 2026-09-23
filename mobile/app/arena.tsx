import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Image, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ArenaScreen, ArenaResult } from '../lesson-kit/arena/ArenaScreen';
import { buildArena } from '../lesson-kit/arena/buildArena';
import { useIndustryContent } from '../hooks/useIndustryContent';
import { useStudiedLessons } from '../hooks/useStudiedLessons';
import { useFocusTopic } from '../hooks/useFocusTopic';
import { useSelectedMarket } from '../hooks/useSelectedMarket';
import { usePracticeRewards } from '../hooks/usePracticeRewards';
import { useUserXP } from '../hooks/useUserXP';
import { useCollectibles } from '../hooks/useCollectibles';
import { getMarketName } from '../lib/markets';
import { localDateString } from '../lib/dayMath';
import { COLORS, TYPE } from '../lib/constants';
import { log } from '../lib/logger';
import { triggerHaptic } from '../lib/haptics';
import { playSound } from '../lib/sounds';

const THINKING_LEO = require('../assets/mascot/leo-thinking.png');
const SCHOLAR_LEO = require('../assets/mascot/leo-graduation.png');

function ArenaPrerequisite() {
  const [isScholar, setIsScholar] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;

  const changePose = (nextScholar: boolean) => {
    Animated.timing(fade, {
      toValue: nextScholar ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
    setIsScholar(nextScholar);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsScholar((current) => {
        const next = !current;
        Animated.timing(fade, {
          toValue: next ? 1 : 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [fade]);

  const togglePose = () => {
    triggerHaptic('light');
    playSound('tap').catch(() => {});
    changePose(!isScholar);
    Animated.sequence([
      Animated.spring(bounce, { toValue: 1.06, friction: 5, tension: 180, useNativeDriver: true }),
      Animated.spring(bounce, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={styles.prerequisite}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={togglePose}
        accessibilityRole="button"
        accessibilityLabel={`Leo is ${isScholar ? 'ready to study' : 'thinking'}. Tap to change his pose.`}
      >
        <Animated.View style={[styles.leoStage, { transform: [{ scale: bounce }] }]}>
          <Animated.View style={[styles.leoLayer, { opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
            <Image source={THINKING_LEO} style={styles.leoImage} resizeMode="contain" />
          </Animated.View>
          <Animated.View style={[styles.leoLayer, { opacity: fade }]}>
            <Image source={SCHOLAR_LEO} style={styles.leoImage} resizeMode="contain" />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
      <Text style={styles.emptyTitle}>Your Arena needs a lesson</Text>
      <Text style={styles.loadingText}>Complete a course lesson first. Every round will then test concepts you actually studied.</Text>
      <TouchableOpacity
        style={styles.courseButton}
        activeOpacity={0.88}
        onPress={() => router.replace('/(tabs)/home')}
        accessibilityRole="button"
      >
        <Text style={styles.courseButtonText}>Go to Course</Text>
        <Text style={styles.courseButtonArrow}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ArenaRoute() {
  const { day } = useLocalSearchParams<{ day?: string }>();
  const preferredDay = day ? Number(day) : undefined;
  const { marketId, loading: marketLoading } = useSelectedMarket();
  const content = useIndustryContent(marketId);
  // A chosen focus topic tilts which studied lessons the waves come from.
  const focus = useFocusTopic(marketId, 1);
  const studied = useStudiedLessons(marketId, focus.keywords, preferredDay);
  const { rewards, loading: rewardsLoading, recordArenaRun } = usePracticeRewards();
  const { addXP } = useUserXP(marketId);
  const { evaluateRewards } = useCollectibles(marketId);
  const [runKey, setRunKey] = useState(0);

  const waves = useMemo(
    () =>
      buildArena({
        marketId,
        marketName: getMarketName(marketId),
        trainer: content.trainer,
        drills: content.drills,
        stats: content.stats,
        studied: studied.lessons,
      }),
    // A new runKey reshuffles the run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [marketId, content.trainer, content.drills, content.stats, studied.lessons, runKey],
  );

  const busy = marketLoading || content.isLoading || rewardsLoading || studied.isLoading;

  if (busy) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Setting up the arena floor…</Text>
      </View>
    );
  }

  if (studied.lessons.length === 0) {
    return <ArenaPrerequisite />;
  }

  // Never leave the user on a blank, unresponsive screen.
  if (!waves || waves.length === 0) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>No arena rounds ready for this market yet.</Text>
        <Text style={styles.backLink} onPress={() => router.back()}>Go back</Text>
      </View>
    );
  }

  const handleFinish = async (result: ArenaResult) => {
    try {
      await recordArenaRun(result.score);
      await addXP(result.xp, 'arena', undefined, 'Daily Arena run');
      const accuracy = result.total > 0 ? result.correct / result.total : 0;
      await evaluateRewards('arena', `arena:${localDateString()}`, accuracy);
    } catch (error) {
      log.warn('[Arena] Could not bank the run:', error);
    }
    router.back();
  };

  return (
    <ArenaScreen
      key={runKey}
      waves={waves}
      marketId={marketId}
      marketName={getMarketName(marketId)}
      bestScore={rewards.arenaBestScore}
      onExit={() => router.back()}
      onFinish={handleFinish}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: COLORS.bg0 },
  loadingText: { ...TYPE.caption, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 32 },
  emptyTitle: { ...TYPE.h2, color: COLORS.textPrimary, textAlign: 'center' },
  backLink: { ...TYPE.caption, color: COLORS.accent, fontWeight: '700' },
  prerequisite: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 24, backgroundColor: COLORS.bg0 },
  leoStage: { width: 192, height: 192, marginBottom: 6, backfaceVisibility: 'hidden' },
  leoLayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  leoImage: { width: 192, height: 192, resizeMode: 'contain', backfaceVisibility: 'hidden', imageRendering: 'crisp-edges' } as any,
  courseButton: { marginTop: 8, minWidth: 188, minHeight: 50, borderRadius: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.accent },
  courseButtonText: { ...TYPE.bodyBold, color: COLORS.textOnAccent },
  courseButtonArrow: { fontSize: 20, lineHeight: 22, color: COLORS.textOnAccent, fontWeight: '700' },
});
