import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../lib/constants';
import { isDark } from '../lib/theme';
import { triggerHaptic } from '../lib/haptics';
import { PERKS } from '../lib/shopCatalog';
import { requirementProgress } from '../lib/shopEconomy';
import { SHOP_SCENES } from '../lib/shopArt';
import { useShop } from '../hooks/useShop';
import { ChunkyButton } from '../components/social/ChunkyButton';
import { Float, Sheen } from '../components/shop/Motion';
import { FloatIcon, PERK_SCENE, PerkObject, SceneBackdrop, Sunburst, Twinkles } from '../components/shop/Scene';
import { Flask } from '../components/shop/ShopKit';

const fmt = (n: number) => n.toLocaleString('en-US');
/** One icon per waitlist step: sign up, ask (XP held), confirmed. */
const STEP_ICON = ['user-plus', 'clock', 'check-circle'] as const;

/**
 * A perk up close. The hero is the same scene as its Shop card, larger, so tapping the card feels like stepping
 * into it. Then what you get, the three waitlist steps as a short timeline, and one clear cost row. No partner
 * is named.
 */
export default function PerkScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const shop = useShop();
  const perk = PERKS.find(p => p.id === id) ?? PERKS[0];
  const wait = shop.perks[perk.id];
  const gate = perk.requires ? requirementProgress(perk.requires, shop.stats) : null;
  const balance = shop.balance.balance;
  const enough = balance >= perk.price;
  const scene = PERK_SCENE[perk.id] ?? PERK_SCENE['perk-tool-credits'];
  const art = SHOP_SCENES[perk.id];
  const H = 250 + insets.top;
  const objectW = Math.min(250, width * 0.64);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 14 }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { height: H }]}>
          {art ? <SceneBackdrop theme="promo" sceneId={perk.id} /> : (
            <LinearGradient colors={scene.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          )}
          <Sunburst size={560} cx={width / 2} cy={insets.top + 140} color="#FDE68A" opacity={0.3} rays={20} />
          <Twinkles w={width} h={H} color="#FDE68A" points={[[0.1, 0.45, 14], [0.9, 0.38, 18], [0.18, 0.86, 10], [0.84, 0.88, 12], [0.6, 0.3, 8]]} />
          {!art && (
            <Float distance={6} style={{ position: 'absolute', left: width / 2 - objectW / 2, top: insets.top + 140 - objectW * 0.375 }}>
              <PerkObject id={perk.id} width={objectW} />
            </Float>
          )}
          <FloatIcon id={scene.icons[0]} size={54} x={18} y={H - 84} depth={2} phase={400} />
          <FloatIcon id={scene.icons[1]} size={42} x={width - 66} y={insets.top + 64} depth={0} phase={1100} />
          <Sheen width={width} every={5600} delay={800} />
          <LinearGradient colors={['transparent', COLORS.bg0]} style={styles.fade} pointerEvents="none" />
          <View style={[styles.heroTop, { top: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
              <Feather name="x" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <View style={styles.kind}><Text maxFontSizeMultiplier={1.3} style={styles.kindText}>{perk.kicker}</Text></View>
            <View style={styles.status}>
              <View style={styles.dot} />
              <Text maxFontSizeMultiplier={1.3} style={styles.statusText}>{wait && wait.waitlist >= 10 ? `Coming soon, ${fmt(wait.waitlist)} waiting` : 'Coming soon'}</Text>
            </View>
          </View>
          <Text maxFontSizeMultiplier={1.3} style={styles.name}>{perk.name}</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.line}>{perk.line}</Text>

          <View style={styles.cost}>
            <View style={styles.costLeft}>
              <Text maxFontSizeMultiplier={1.3} style={styles.costLabel}>When it opens</Text>
              <View style={styles.costPrice}>
                <Flask size={22} />
                <Text maxFontSizeMultiplier={1.2} style={styles.costValue}>{fmt(perk.price)}</Text>
              </View>
            </View>
            <View style={styles.costRight}>
              {enough ? (
                <View style={styles.ready}><Feather name="check" size={14} color={COLORS.success} /><Text maxFontSizeMultiplier={1.3} style={styles.readyText}>You have enough</Text></View>
              ) : (
                <Text maxFontSizeMultiplier={1.3} style={styles.toGo}>{fmt(perk.price - balance)} XP to go</Text>
              )}
              <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(4, Math.min(100, (balance / perk.price) * 100))}%`, backgroundColor: enough ? COLORS.success : COLORS.accent }]} /></View>
              <Text maxFontSizeMultiplier={1.3} style={styles.have}>{fmt(balance)} XP now</Text>
            </View>
          </View>

          {gate && (
            <View style={[styles.gate, gate.met && styles.gateMet]}>
              <Feather name={gate.met ? 'unlock' : 'lock'} size={16} color={gate.met ? COLORS.success : COLORS.textSecondary} />
              <Text maxFontSizeMultiplier={1.3} style={styles.gateText}>{gate.met ? `${gate.label}: done` : gate.label}</Text>
            </View>
          )}

          <Text maxFontSizeMultiplier={1.3} style={styles.section}>How it works</Text>
          <View>
            {perk.steps.map((s, i) => (
              <View key={s} style={styles.step}>
                <View style={styles.rail}>
                  <View style={styles.stepIcon}><Feather name={STEP_ICON[i] ?? 'circle'} size={16} color={COLORS.accent} /></View>
                  {i < perk.steps.length - 1 && <View style={styles.railLine} />}
                </View>
                <Text maxFontSizeMultiplier={1.3} style={styles.stepText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {wait?.joined ? (
          <View style={styles.joined}><Feather name="check" size={17} color={COLORS.success} /><Text maxFontSizeMultiplier={1.3} style={styles.joinedText}>You're on the list. We'll tell you when it opens.</Text></View>
        ) : (
          <ChunkyButton label="Join the waitlist" onPress={() => { triggerHaptic('success'); void shop.joinWaitlist(perk.id); }} height={54} />
        )}
        <Text maxFontSizeMultiplier={1.3} style={styles.after}>Free to join. No XP is taken until a spot is confirmed.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  hero: { overflow: 'hidden' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 56 },
  heroTop: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  close: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 20, marginTop: -6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kind: { paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: isDark ? 'rgba(253,230,138,0.14)' : '#FEF3C7', justifyContent: 'center' },
  kindText: { fontSize: 12.5, fontWeight: '800', color: isDark ? '#FDE68A' : '#92400E' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  statusText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  name: { fontSize: 28, lineHeight: 33, fontWeight: '900', color: COLORS.textPrimary, marginTop: 12, letterSpacing: -0.3 },
  line: { fontSize: 16, lineHeight: 22, color: COLORS.textSecondary, marginTop: 6 },

  cost: { flexDirection: 'row', gap: 16, marginTop: 22, padding: 16, borderRadius: 20, backgroundColor: COLORS.bg2, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border },
  costLeft: { justifyContent: 'center' },
  costLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  costPrice: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  costValue: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, fontVariant: ['tabular-nums'] },
  costRight: { flex: 1, justifyContent: 'center', gap: 7, paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: COLORS.border },
  ready: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  readyText: { fontSize: 14, fontWeight: '800', color: COLORS.success },
  toGo: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  track: { height: 8, borderRadius: 4, backgroundColor: COLORS.border, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  have: { fontSize: 12.5, fontWeight: '600', color: COLORS.textMuted },

  gate: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingHorizontal: 14, height: 46, borderRadius: 14, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  gateMet: { backgroundColor: COLORS.successSoft, borderColor: 'transparent' },
  gateText: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },

  section: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary, marginTop: 28, marginBottom: 12 },
  step: { flexDirection: 'row', gap: 14 },
  rail: { alignItems: 'center', width: 34 },
  stepIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  railLine: { flex: 1, width: 2, minHeight: 14, backgroundColor: COLORS.border, marginVertical: 4 },
  stepText: { flex: 1, fontSize: 15, lineHeight: 21, fontWeight: '600', color: COLORS.textPrimary, paddingTop: 6, paddingBottom: 18 },

  footer: { paddingHorizontal: 20, paddingTop: 10, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  joined: { minHeight: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, backgroundColor: COLORS.successSoft },
  joinedText: { flexShrink: 1, fontSize: 15, fontWeight: '800', color: COLORS.success },
  after: { fontSize: 12.5, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
});
