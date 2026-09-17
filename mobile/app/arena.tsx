import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import { ArenaScreen, ArenaResult } from '../lesson-kit/arena/ArenaScreen';
import { buildArena } from '../lesson-kit/arena/buildArena';
import { useIndustryContent } from '../hooks/useIndustryContent';
import { useSelectedMarket } from '../hooks/useSelectedMarket';
import { usePracticeRewards } from '../hooks/usePracticeRewards';
import { useUserXP } from '../hooks/useUserXP';
import { useCollectibles } from '../hooks/useCollectibles';
import { getMarketName } from '../lib/markets';
import { COLORS, TYPE } from '../lib/constants';
import { log } from '../lib/logger';

export default function ArenaRoute() {
  const { marketId, loading: marketLoading } = useSelectedMarket();
  const content = useIndustryContent(marketId);
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
      }),
    // A new runKey reshuffles the run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [marketId, content.trainer, content.drills, content.stats, runKey],
  );

  const busy = marketLoading || content.isLoading || rewardsLoading;

  if (busy) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Setting up the arena floor…</Text>
      </View>
    );
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
      await evaluateRewards('arena', `arena:${new Date().toISOString().slice(0, 10)}`, accuracy);
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
  backLink: { ...TYPE.caption, color: COLORS.accent, fontWeight: '700' },
});
