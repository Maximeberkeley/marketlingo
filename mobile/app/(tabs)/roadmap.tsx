import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { DailyNews } from '../../components/home/DailyNews';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { TYPE } from '../../lib/constants';
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
        <ActivityIndicator size="large" color={INTEL.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={INTEL.accent} />}
    >
      <View style={styles.masthead}>
        <View style={styles.mastheadTop}>
          <View>
            <Text style={styles.title}>Intel</Text>
          </View>
          <View style={styles.signalMark}>
            <Feather name="radio" size={20} color={INTEL.text} />
            <View style={styles.liveDot} />
          </View>
        </View>
        <View style={styles.marketTag}><Text style={styles.market}>{getMarketName(marketId)}</Text></View>
      </View>

      <View style={styles.feed}>
        <DailyNews marketId={marketId} learningGoal={learningGoal} autoOpen={autoOpen === '1'} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: INTEL.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: INTEL.background },
  masthead: { paddingHorizontal: 16, paddingBottom: 18 },
  mastheadTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: 40, lineHeight: 44, fontWeight: '900', color: INTEL.text },
  signalMark: { width: 42, height: 42, borderRadius: 21, backgroundColor: INTEL.surface, alignItems: 'center', justifyContent: 'center' },
  liveDot: { position: 'absolute', right: 5, top: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: INTEL.live, borderWidth: 2, borderColor: INTEL.surface },
  marketTag: { alignSelf: 'flex-start', marginTop: 9, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: INTEL.surface },
  market: { ...TYPE.caption, color: INTEL.secondary },
  feed: { paddingHorizontal: 16 },
});

const INTEL = {
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  secondary: '#AEAEB2',
  accent: '#A78BFA',
  live: '#FF453A',
};
