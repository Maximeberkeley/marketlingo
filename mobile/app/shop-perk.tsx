import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../lib/constants';
import { triggerHaptic } from '../lib/haptics';
import { PERKS } from '../lib/shopCatalog';
import { requirementProgress } from '../lib/shopEconomy';
import { useShop } from '../hooks/useShop';
import { ChunkyButton } from '../components/social/ChunkyButton';
import { Float, Sheen } from '../components/shop/Motion';

const fmt = (n: number) => n.toLocaleString('en-US');

/** A perk up close: what you get, how it will work, what it needs, and the waitlist. No partner is named. */
export default function PerkScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const shop = useShop();
  const perk = PERKS.find(p => p.id === id) ?? PERKS[0];
  const wait = shop.perks[perk.id];
  const gate = perk.requires ? requirementProgress(perk.requires, shop.stats) : null;
  const enough = shop.balance.balance >= perk.price;

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 14 }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#171327', '#2B1F4E']} style={[styles.hero, { height: 220 + insets.top, paddingTop: insets.top }]}>
          <View style={[styles.heroTop, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
              <Feather name="x" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.tag}><Text style={styles.tagText}>✦ PERK</Text></View>
          </View>
          <View style={styles.glow} />
          <Float distance={6}><View style={styles.badge}><Feather name={perk.icon} size={44} color="#FCD34D" /></View></Float>
          <Sheen width={400} every={5000} />
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.kicker}>{perk.kicker.toUpperCase()} · COMING SOON</Text>
          <Text style={styles.name}>{perk.name}</Text>
          <Text style={styles.line}>{perk.line}</Text>

          <View style={styles.steps}>
            {perk.steps.map((s, i) => (
              <View key={s} style={styles.step}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
          </View>

          <View style={styles.reqCard}>
            {gate && (
              <View style={styles.req}>
                <View style={styles.reqRow}>
                  <Text style={styles.reqLabel}>{gate.label}</Text>
                  <Text style={[styles.reqValue, gate.met && { color: COLORS.success }]}>{gate.met ? '✓' : `${gate.current} / ${gate.target}`}</Text>
                </View>
                <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(4, (gate.current / gate.target) * 100)}%`, backgroundColor: gate.met ? COLORS.success : COLORS.accent }]} /></View>
              </View>
            )}
            <View style={styles.req}>
              <View style={styles.reqRow}>
                <Text style={styles.reqLabel}>Have {fmt(perk.price)} XP</Text>
                <Text style={[styles.reqValue, enough && { color: COLORS.success }]}>{enough ? `✓ ${fmt(shop.balance.balance)}` : `${fmt(shop.balance.balance)} / ${fmt(perk.price)}`}</Text>
              </View>
              <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(4, Math.min(100, (shop.balance.balance / perk.price) * 100))}%`, backgroundColor: enough ? COLORS.success : COLORS.accent }]} /></View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {wait?.joined ? (
          <View style={styles.joined}><Feather name="check" size={17} color={COLORS.success} /><Text style={styles.joinedText}>You're on the list</Text></View>
        ) : (
          <ChunkyButton label="Join waitlist" onPress={() => { triggerHaptic('success'); void shop.joinWaitlist(perk.id); }} height={52} />
        )}
        <Text style={styles.after}>
          {wait && wait.waitlist >= 10 ? `${fmt(wait.waitlist)} on the waitlist · ` : ''}about {fmt(perk.price)} XP when it opens
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  hero: { height: 260, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroTop: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  close: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  tag: { paddingHorizontal: 10, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: '#FCD34D', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  tagText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8, color: '#FCD34D' },
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(252,211,77,0.16)' },
  badge: { width: 104, height: 104, borderRadius: 52, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 2, borderColor: 'rgba(252,211,77,0.55)', alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 20, paddingTop: 18, gap: 6 },
  kicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1, color: COLORS.textMuted },
  name: { fontSize: 26, lineHeight: 31, fontWeight: '900', color: COLORS.textPrimary },
  line: { fontSize: 15, color: COLORS.textSecondary, marginTop: 2 },
  steps: { gap: 12, marginTop: 18 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.textPrimary, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 13, fontWeight: '900', color: COLORS.bg0 },
  stepText: { flex: 1, fontSize: 14.5, lineHeight: 20, fontWeight: '600', color: COLORS.textPrimary },
  reqCard: { marginTop: 20, padding: 14, gap: 14, borderRadius: 18, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  req: { gap: 8 },
  reqRow: { flexDirection: 'row', justifyContent: 'space-between' },
  reqLabel: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  reqValue: { fontSize: 14, fontWeight: '800', color: COLORS.textSecondary },
  track: { height: 8, borderRadius: 4, backgroundColor: COLORS.border, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 20, gap: 8 },
  joined: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.successSoft },
  joinedText: { fontSize: 16, fontWeight: '800', color: COLORS.success },
  after: { fontSize: 12.5, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
});
