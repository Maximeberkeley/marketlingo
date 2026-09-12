import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CollectibleCard } from '../../hooks/useCollectibles';
import { getMarketWorld } from '../../data/marketWorlds';
import { playSound } from '../../lib/sounds';

export function CardRevealModal({ card, marketId, onClose }: { card: Partial<CollectibleCard> | null; marketId?: string; onClose: () => void }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const world = getMarketWorld(marketId);
  useEffect(() => {
    if (!card) return;
    scale.setValue(0.7);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    playSound('celebration').catch(() => {});
    Animated.spring(scale, { toValue: 1, tension: 65, friction: 7, useNativeDriver: true }).start();
  }, [card, scale]);
  return (
    <Modal visible={!!card} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { borderColor: world.colors[2], transform: [{ scale }] }]}>
          <Text style={[styles.rarity, { color: world.colors[0] }]}>{(card?.rarity || 'new').toUpperCase()} DISCOVERY</Text>
          <View style={[styles.icon, { backgroundColor: world.colors[0] }]}><Feather name="compass" size={34} color="#FFFFFF" /></View>
          <Text style={styles.name}>{card?.name}</Text>
          <Text style={styles.role}>{card?.role}</Text>
          <Text style={styles.insight}>{card?.insight}</Text>
          <Text style={styles.leo}>Leo: “You earned this. It marks what you can now see.”</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: world.colors[0] }]} onPress={onClose}>
            <Text style={styles.buttonText}>Add to collection</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.82)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 3, padding: 24, alignItems: 'center' },
  rarity: { fontSize: 11, fontWeight: '900' }, icon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginVertical: 18 },
  name: { fontSize: 27, fontWeight: '900', color: '#111827', textAlign: 'center' }, role: { fontSize: 13, fontWeight: '800', color: '#64748B', marginTop: 4 },
  insight: { fontSize: 15, lineHeight: 22, color: '#334155', textAlign: 'center', marginTop: 18 }, leo: { fontSize: 13, lineHeight: 19, color: '#64748B', fontStyle: 'italic', marginTop: 14, textAlign: 'center' },
  button: { width: '100%', height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 22 }, buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});