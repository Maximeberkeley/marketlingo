/**
 * Focus topic — one optional tap, offered after the foundations week.
 *
 * Picking a corner of the market tilts the examples, cases and practice the
 * learner sees. It never changes the daily concept, and it can be changed or
 * dropped at any time.
 */
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { COLORS, TYPE } from '../lib/constants';
import { getMarketName } from '../lib/markets';
import { useSelectedMarket } from '../hooks/useSelectedMarket';
import { useUserProgress } from '../hooks/useUserProgress';
import { useFocusTopic } from '../hooks/useFocusTopic';
import { FocusOption } from '../lib/focusTopics';
import { tapFeedback } from '../lib/haptics';

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const { marketId, loading: marketLoading } = useSelectedMarket();
  const { availableDay } = useUserProgress(marketId);
  const focus = useFocusTopic(marketId, availableDay || 1);
  const marketName = getMarketName(marketId);

  const pick = async (option: FocusOption) => {
    tapFeedback();
    const ok = await focus.choose(option);
    if (ok) router.back();
  };

  if (marketLoading || focus.loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 48 }}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="chevron-left" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your focus</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.intro}>
        <Text style={styles.title}>Pick the corner of {marketName} you want to own</Text>
        <Text style={styles.subtitle}>
          One choice. Your daily concept stays the same — the examples, cases and practice questions
          start leaning your way. You can change it whenever you like.
        </Text>
      </View>

      {focus.options.map(option => {
        const active = option.key === focus.focusKey;
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.card, active && styles.cardActive]}
            onPress={() => pick(option)}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardLabel}>{option.label}</Text>
              {active ? <Feather name="check-circle" size={20} color={COLORS.accent} /> : null}
            </View>
            <Text style={styles.cardPayoff}>{option.payoff}</Text>
          </TouchableOpacity>
        );
      })}

      {focus.focusKey ? (
        <TouchableOpacity
          style={styles.clear}
          onPress={async () => {
            tapFeedback();
            await focus.clear();
          }}
        >
          <Text style={styles.clearText}>Keep the broad view instead</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitle: { ...TYPE.subtitle, color: COLORS.textPrimary, fontWeight: '700' },
  intro: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  title: { ...TYPE.title, color: COLORS.textPrimary, fontWeight: '800', marginBottom: 8 },
  subtitle: { ...TYPE.body, color: COLORS.textSecondary, lineHeight: 22 },
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardActive: { borderColor: COLORS.accent, borderWidth: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardLabel: { ...TYPE.subtitle, color: COLORS.textPrimary, fontWeight: '700', flex: 1, paddingRight: 8 },
  cardPayoff: { ...TYPE.body, color: COLORS.textSecondary, lineHeight: 20 },
  clear: { alignItems: 'center', paddingVertical: 18 },
  clearText: { ...TYPE.body, color: COLORS.textSecondary, textDecorationLine: 'underline' },
});
