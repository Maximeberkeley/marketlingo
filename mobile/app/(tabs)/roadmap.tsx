import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { DailyNews } from '../../components/home/DailyNews';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { COLORS, TYPE } from '../../lib/constants';
import { getMarketName } from '../../lib/markets';
import { triggerHaptic } from '../../lib/haptics';

export default function IntelScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { autoOpen } = useLocalSearchParams<{ autoOpen?: string }>();
  const [marketId, setMarketId] = useState<string | null>(null);
  const [learningGoal, setLearningGoal] = useState('curiosity');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadContext = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('selected_market')
      .eq('id', user.id)
      .maybeSingle();
    const selectedMarket = profile?.selected_market || 'aerospace';
    const { data: progress } = await supabase
      .from('user_progress')
      .select('learning_goal')
      .eq('user_id', user.id)
      .eq('market_id', selectedMarket)
      .maybeSingle();
    setMarketId(selectedMarket);
    setLearningGoal(progress?.learning_goal || 'curiosity');
    setLoading(false);
  }, [user]);

  useEffect(() => { void loadContext(); }, [loadContext]);
  useFocusEffect(useCallback(() => { void loadContext(); }, [loadContext]));

  const refresh = async () => {
    triggerHaptic('selection');
    setRefreshing(true);
    await loadContext();
    setRefreshing(false);
  };

  if (loading || !marketId) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.accent} />}
    >
      <View style={styles.masthead}>
        <View style={styles.mastheadTop}>
          <View>
            <Text style={styles.eyebrow}>LIVE FROM YOUR INDUSTRY</Text>
            <Text style={styles.title}>Intel</Text>
          </View>
          <View style={styles.signalMark}>
            <Feather name="radio" size={22} color={COLORS.textPrimary} />
            <View style={styles.liveDot} />
          </View>
        </View>
        <Text style={styles.market}>{getMarketName(marketId)}</Text>
        <Text style={styles.subtitle}>Three stories a day. Know what changed, why it matters, and what insiders are watching.</Text>
      </View>

      <View style={styles.feed}>
        <DailyNews marketId={marketId} learningGoal={learningGoal} autoOpen={autoOpen === '1'} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg0 },
  masthead: { paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  mastheadTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow: { ...TYPE.overline, color: COLORS.accent },
  title: { fontSize: 38, lineHeight: 42, fontWeight: '900', color: COLORS.textPrimary, marginTop: 3 },
  signalMark: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  liveDot: { position: 'absolute', right: 7, top: 7, width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.error, borderWidth: 2, borderColor: COLORS.bg0 },
  market: { ...TYPE.h3, color: COLORS.textPrimary, marginTop: 18 },
  subtitle: { ...TYPE.body, color: COLORS.textSecondary, marginTop: 5, maxWidth: 340 },
  feed: { paddingHorizontal: 16, paddingTop: 20 },
});
