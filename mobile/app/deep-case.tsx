import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import { CaseScreen, CaseResult } from '../lesson-kit/case/CaseScreen';
import { buildCase } from '../lesson-kit/case/buildCase';
import { useIndustryContent } from '../hooks/useIndustryContent';
import { useSelectedMarket } from '../hooks/useSelectedMarket';
import { usePracticeRewards } from '../hooks/usePracticeRewards';
import { useUserXP } from '../hooks/useUserXP';
import { useCollectibles } from '../hooks/useCollectibles';
import { getMarketName } from '../lib/markets';
import { COLORS, TYPE } from '../lib/constants';
import { log } from '../lib/logger';

export default function DeepCaseRoute() {
  const { marketId, loading: marketLoading } = useSelectedMarket();
  const content = useIndustryContent(marketId);
  const { recordCaseRun, loading: rewardsLoading } = usePracticeRewards();
  const { addXP } = useUserXP(marketId);
  const { evaluateRewards } = useCollectibles(marketId);
  const marketName = getMarketName(marketId);

  const deepCase = useMemo(
    () =>
      buildCase({
        marketId,
        marketName,
        trainer: content.trainer,
        drills: content.drills,
        stats: content.stats,
      }),
    [marketId, marketName, content.trainer, content.drills, content.stats],
  );

  if (marketLoading || content.isLoading || rewardsLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Pulling a live {marketName} case…</Text>
      </View>
    );
  }

  if (!deepCase) {
    return (
      <View style={styles.loading}>
        <Text style={styles.emptyTitle}>No case ready yet</Text>
        <Text style={styles.loadingText}>
          Finish a lesson or two in {marketName} and a case will open up here.
        </Text>
      </View>
    );
  }

  const handleFinish = async (result: CaseResult) => {
    try {
      await recordCaseRun(result.grade);
      await addXP(result.xp, 'deep_case', deepCase.id, `Deep Case graded ${result.grade}`);
      const accuracy = result.total > 0 ? result.correct / result.total : 0;
      await evaluateRewards('deep_case', `case:${deepCase.id}`, accuracy);
    } catch (error) {
      log.warn('[DeepCase] Could not bank the case:', error);
    }
    router.back();
  };

  return (
    <CaseScreen
      deepCase={deepCase}
      marketId={marketId}
      marketName={marketName}
      onExit={() => router.back()}
      onFinish={handleFinish}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 28,
    backgroundColor: COLORS.bg0,
  },
  loadingText: { ...TYPE.caption, color: COLORS.textMuted, textAlign: 'center' },
  emptyTitle: { ...TYPE.h2, color: COLORS.textPrimary },
});
