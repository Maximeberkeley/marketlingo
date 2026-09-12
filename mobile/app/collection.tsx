import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '../lib/constants';
import { MARKET_WORLDS, getMarketWorld } from '../data/marketWorlds';
import { CollectibleCard, useCollectibles } from '../hooks/useCollectibles';
import { triggerHaptic } from '../lib/haptics';

const RARITY_LABEL: Record<CollectibleCard['rarity'], string> = {
  common: 'FIELD', rare: 'SPECIALIST', epic: 'ELITE', legendary: 'ICON',
};

export default function CollectionScreen() {
  const insets = useSafeAreaInsets();
  const { cards, featuredId, loading, featureCard } = useCollectibles();
  const [market, setMarket] = useState('all');
  const [selected, setSelected] = useState<CollectibleCard | null>(null);
  const filtered = useMemo(() => market === 'all' ? cards : cards.filter(card => card.market_id === market), [cards, market]);
  const owned = cards.filter(card => card.owned).length;

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.accent} /></View>;
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}><Feather name="arrow-left" size={22} color={COLORS.textPrimary} /></TouchableOpacity>
        <View style={styles.headerCopy}><Text style={styles.title}>Insider Collection</Text><Text style={styles.subtitle}>{owned} of {cards.length} discovered</Text></View>
        <Feather name="layers" size={22} color={COLORS.accent} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <Filter active={market === 'all'} label="All worlds" onPress={() => setMarket('all')} />
        {Object.values(MARKET_WORLDS).map(world => <Filter key={world.id} active={market === world.id} label={world.name} onPress={() => setMarket(world.id)} />)}
      </ScrollView>
      <ScrollView contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        {filtered.map(card => {
          const world = getMarketWorld(card.market_id);
          return (
            <TouchableOpacity key={card.id} style={[styles.card, { borderColor: card.owned ? world.colors[0] : COLORS.border }]} onPress={() => setSelected(card)} activeOpacity={0.8}>
              <View style={[styles.cardArt, { backgroundColor: card.owned ? world.colors[0] : COLORS.surfaceLight }]}>
                <Feather name={card.owned ? 'compass' : 'lock'} size={28} color={card.owned ? '#FFFFFF' : COLORS.textMuted} />
              </View>
              <Text style={[styles.rarity, { color: card.owned ? world.colors[0] : COLORS.textMuted }]}>{RARITY_LABEL[card.rarity]}</Text>
              <Text style={[styles.cardName, !card.owned && styles.locked]} numberOfLines={2}>{card.owned ? card.name : 'Undiscovered'}</Text>
              <Text style={styles.cardRole} numberOfLines={2}>{card.owned ? card.specialty : unlockCopy(card)}</Text>
              {featuredId === card.id && <View style={styles.featured}><Feather name="star" size={10} color="#F59E0B" /><Text style={styles.featuredText}>FEATURED</Text></View>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.backdrop}><View style={styles.sheet}>
          {selected && <>
            <View style={[styles.detailIcon, { backgroundColor: selected.owned ? getMarketWorld(selected.market_id).colors[0] : COLORS.surfaceLight }]}><Feather name={selected.owned ? 'award' : 'lock'} size={36} color={selected.owned ? '#FFFFFF' : COLORS.textMuted} /></View>
            <Text style={styles.detailWorld}>{getMarketWorld(selected.market_id).setName.toUpperCase()}</Text>
            <Text style={styles.detailName}>{selected.owned ? selected.name : 'Card locked'}</Text>
            <Text style={styles.detailInsight}>{selected.owned ? selected.insight : unlockCopy(selected)}</Text>
            {selected.owned && <View style={styles.stats}><Stat label="POWER" value={selected.power} /><Stat label="JUDGMENT" value={selected.judgment} /><Stat label="FLUENCY" value={selected.fluency} /></View>}
            {selected.owned && featuredId !== selected.id && <TouchableOpacity style={[styles.primary, { backgroundColor: getMarketWorld(selected.market_id).colors[0] }]} onPress={async () => { await featureCard(selected.id); triggerHaptic('success'); setSelected(null); }}><Text style={styles.primaryText}>Feature on profile</Text></TouchableOpacity>}
            <TouchableOpacity style={styles.close} onPress={() => setSelected(null)}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
          </>}
        </View></View>
      </Modal>
    </View>
  );
}

function unlockCopy(card: CollectibleCard) {
  if (card.unlock_type === 'first_lesson') return 'Complete your first lesson';
  if (card.unlock_type === 'lesson_count') return `Complete ${card.unlock_threshold} lessons`;
  if (card.unlock_type === 'mastery') return `Master ${card.unlock_threshold} concepts`;
  return `Reach day ${card.unlock_threshold}`;
}
function Filter({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) { return <TouchableOpacity style={[styles.filter, active && styles.filterActive]} onPress={onPress}><Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text></TouchableOpacity>; }
function Stat({ label, value }: { label: string; value: number }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }, iconButton: { padding: 6, marginLeft: -6 }, headerCopy: { flex: 1, marginLeft: 8 }, title: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary }, subtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  filters: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 }, filter: { height: 34, paddingHorizontal: 13, borderRadius: 17, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' }, filterActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary }, filterText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted }, filterTextActive: { color: COLORS.bg0 },
  grid: { paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, card: { width: '48.5%', minHeight: 210, backgroundColor: COLORS.bg2, borderRadius: 16, borderWidth: 1.5, padding: 12 }, cardArt: { height: 74, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, rarity: { fontSize: 9, fontWeight: '900' }, cardName: { fontSize: 15, fontWeight: '900', color: COLORS.textPrimary, marginTop: 3 }, locked: { color: COLORS.textMuted }, cardRole: { fontSize: 11, lineHeight: 15, color: COLORS.textMuted, marginTop: 4 }, featured: { flexDirection: 'row', gap: 4, alignItems: 'center', marginTop: 'auto' }, featuredText: { fontSize: 8, fontWeight: '900', color: '#F59E0B' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'flex-end' }, sheet: { backgroundColor: COLORS.bg0, padding: 24, paddingBottom: 36, borderTopLeftRadius: 24, borderTopRightRadius: 24, alignItems: 'center' }, detailIcon: { width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, detailWorld: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, marginTop: 16 }, detailName: { fontSize: 26, fontWeight: '900', color: COLORS.textPrimary, marginTop: 4 }, detailInsight: { fontSize: 14, lineHeight: 21, textAlign: 'center', color: COLORS.textSecondary, marginTop: 12 }, stats: { flexDirection: 'row', gap: 8, marginTop: 20, width: '100%' }, stat: { flex: 1, padding: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, alignItems: 'center' }, statValue: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary }, statLabel: { fontSize: 8, fontWeight: '800', color: COLORS.textMuted }, primary: { width: '100%', height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' }, close: { padding: 14 }, closeText: { color: COLORS.textMuted, fontWeight: '700' },
});