import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Rect } from 'react-native-svg';
import { COLORS } from '../lib/constants';
import { triggerHaptic } from '../lib/haptics';
import { playSound } from '../lib/sounds';
import {
  BUNDLES, COSMETICS, Cosmetic, RARITY_COLOR, RARITY_LABEL, SLOT_LABEL, bundleFullPrice, collectionOf, cosmetic, priceOf,
} from '../lib/shopCatalog';
import { BLOCK_LABEL, buyBlock, requirementProgress } from '../lib/shopEconomy';
import { hasArt, todaysPrice, useShop } from '../hooks/useShop';
import { LeoAvatar } from '../components/shop/LeoAvatar';
import { ItemArt } from '../components/shop/ItemArt';
import { PriceButton, XPChip } from '../components/shop/ShopKit';
import { Float, Pop, Sheen, useReduceMotion } from '../components/shop/Motion';
import { FloatIcon, FloorShadow, SCENES, SceneBackdrop, SceneTheme, Sunburst, Twinkles } from '../components/shop/Scene';
import { ChunkyButton } from '../components/social/ChunkyButton';
import { ConfettiBurst } from '../components/ui/ConfettiBurst';

const fmt = (n: number) => n.toLocaleString('en-US');
const STAGE_H = 256;
const LEO_TRY = 336;

/** Try an item (or a full set) on Leo, then buy and wear it. Also the "It's yours" moment and the not-enough-XP sheet. */
export default function ShopItemScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; bundle?: string; deal?: string; claimed?: string }>();
  const shop = useShop();
  const { width } = useWindowDimensions();
  const bundle = params.bundle ? BUNDLES.find(b => b.id === params.bundle) : undefined;
  const item = params.id ? cosmetic(params.id) : undefined;
  const parts: Cosmetic[] = bundle ? bundle.items.map(id => cosmetic(id)!).filter(Boolean) : item ? [item] : [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(!!params.claimed);
  const [short, setShort] = useState(false);

  if (!parts.length) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text maxFontSizeMultiplier={1.3} style={styles.name}>That item is gone</Text>
        <Text maxFontSizeMultiplier={1.3} style={styles.link} onPress={() => router.back()}>Back to the Shop</Text>
      </View>
    );
  }

  const name = bundle ? bundle.name : item!.name;
  const lead = parts[0];
  const color = RARITY_COLOR[lead.rarity];
  const collection = (bundle?.collection ?? lead.collection) ? collectionOf((bundle?.collection ?? lead.collection)!) : null;
  const wearing = Object.fromEntries(parts.map(p => [p.slot, p.id]));
  const sceneKey = (bundle?.collection ?? lead.collection) ?? 'promo';
  const theme = (sceneKey in SCENES ? sceneKey : 'promo') as SceneTheme;
  const stageW = width - 40;
  const owned = parts.every(p => shop.owns(p.id));
  const worn = parts.every(p => (shop.look[p.slot] ?? (p.id === 'grad-cap' ? 'grad-cap' : undefined)) === p.id);
  const art = parts.every(p => hasArt(p.id));
  const earnOnly = !bundle && lead.acquisition === 'reward';
  const progress = earnOnly ? requirementProgress(lead.requires, shop.stats) : null;
  const deal = !bundle && params.deal ? todaysPrice(shop, lead.id).deal : null;
  const full = bundle ? bundleFullPrice(bundle) : priceOf(lead);
  const price = bundle ? bundle.price : deal ? deal.dealPrice : full;
  const block = owned ? 'owned' : buyBlock({ price, balance: shop.balance.balance, hasArt: art, earnOnly, comingSoon: !shop.available && shop.ready });
  // Its named look first (Winter royal, Crow), then other drawn pieces from its collection in another slot.
  const paired = (lead.pairsWith ?? []).map(id => cosmetic(id)).filter((c): c is Cosmetic => !!c && hasArt(c.id));
  const goesWith = bundle ? [] : (paired.length ? paired : lead.collection
    ? COSMETICS.filter(c => c.collection === lead.collection && c.id !== lead.id && c.slot !== lead.slot && hasArt(c.id))
    : []).slice(0, 3);

  const wearAll = async () => {
    for (const p of parts) await shop.equip(p.slot, p.id);
  };
  /** Takes it off: the slot is left empty (removing the cap leaves Leo bare-headed). */
  const removeAll = async () => {
    for (const p of parts) await shop.equip(p.slot, null);
  };

  const buy = async () => {
    if (block === 'not_enough') { setShort(true); return; }
    if (block) return;
    setBusy(true);
    setError(null);
    const r = await shop.purchase(bundle ? bundle.id : lead.id, { dealDate: deal ? shop.dealDate : undefined });
    setBusy(false);
    if (r.ok === false) {
      if (r.error === 'not_enough') { setShort(true); return; }
      setError(r.error === 'requirement_not_met' ? 'Finish its requirement first.' : r.error === 'owned' ? 'You already own this.' : 'That did not go through. Try again.');
      return;
    }
    playSound('lessonComplete').catch(() => {});
    setSuccess(true);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 14 }]}>
      <View style={styles.top}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Feather name="x" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text maxFontSizeMultiplier={1.3} style={styles.topCaption} numberOfLines={1}>{collection ? collection.name : SLOT_LABEL[lead.slot]}</Text>
        <XPChip value={shop.balance.balance} />
      </View>

      <View style={styles.middle}>
      <View style={[styles.stage, { width: stageW }]}>
        <View style={styles.stageCard}>
          <SceneBackdrop theme={theme} sceneId={sceneKey} />
          <Sunburst size={520} cx={stageW / 2} cy={STAGE_H * 0.6} color={SCENES[theme].ray} opacity={SCENES[theme].rayOpacity} />
          <Twinkles w={stageW} h={STAGE_H} color={SCENES[theme].spark} />
          <FloorShadow width={260} cx={stageW / 2} y={STAGE_H - 4} dark={0.45} />
          {(lead.rarity === 'epic' || lead.rarity === 'legendary') && <Sheen width={stageW} every={3600} />}
        </View>
        <FloatIcon id={SCENES[theme].icons[0]} size={50} x={10} y={STAGE_H - 78} depth={2} phase={200} />
        <FloatIcon id={SCENES[theme].icons[1]} size={40} x={stageW - 58} y={22} depth={0} phase={900} />
        <Float distance={6} style={{ position: 'absolute', left: stageW / 2 - LEO_TRY / 2, top: STAGE_H - LEO_TRY * 0.955 + 4 }}>
          {/* Not drawn yet: plain Leo, so the page never passes off the current outfit as this item. */}
          <LeoAvatar look={art ? { ...shop.look, ...wearing } : {}} size={LEO_TRY} crop={false} />
        </Float>
        <View style={[styles.rarityTag, { backgroundColor: color }]}><Text maxFontSizeMultiplier={1.3} style={styles.rarityTagText}>{RARITY_LABEL[lead.rarity].toUpperCase()}</Text></View>
        {!art && (
          <View style={styles.drawing}><Feather name="edit-3" size={13} color="#FFFFFF" /><Text maxFontSizeMultiplier={1.3} style={styles.drawingText}>Picture on the way</Text></View>
        )}
      </View>

      <View style={styles.info}>
        <Text maxFontSizeMultiplier={1.3} style={[styles.kicker, { color }]}>
          {bundle ? `Set of ${parts.length}` : `${RARITY_LABEL[lead.rarity]} ${SLOT_LABEL[lead.slot].toLowerCase()}`}
        </Text>
        <Text maxFontSizeMultiplier={1.3} style={styles.name}>{name}</Text>
        {bundle ? (
          <View style={styles.parts}>{parts.map(p => <ItemArt key={p.id} item={p} size={64} showTag={false} />)}</View>
        ) : earnOnly && progress ? (
          <View style={styles.progressCard}>
            <Text maxFontSizeMultiplier={1.3} style={styles.progressLabel}>{progress.met ? 'Unlocked' : progress.label}</Text>
            <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(4, (progress.current / progress.target) * 100)}%` }]} /></View>
            <Text maxFontSizeMultiplier={1.3} style={styles.progressCount}>{fmt(progress.current)} / {fmt(progress.target)} · Earned, not bought</Text>
          </View>
        ) : collection ? (
          <Text maxFontSizeMultiplier={1.3} style={styles.line}>{collection.hook}.</Text>
        ) : null}
        {goesWith.length > 0 && (
          <Text maxFontSizeMultiplier={1.3} style={styles.goes}>
            Goes with {goesWith.map((g, i) => (
              <Text key={g.id}>
                {i === 0 ? '' : i === goesWith.length - 1 ? ' and ' : ', '}
                <Text maxFontSizeMultiplier={1.3} style={styles.link} onPress={() => router.replace(`/shop-item?id=${g.id}` as any)}>{g.name}</Text>
              </Text>
            ))}
          </Text>
        )}
      </View>
      </View>

      <View style={styles.footer}>
        {error ? <Text maxFontSizeMultiplier={1.3} style={styles.error}>{error}</Text> : null}
        {owned ? (
          worn ? (
            <ChunkyButton label="Remove" tone="plain" onPress={() => { triggerHaptic('light'); void removeAll(); }} height={52} accessibilityLabel={`Wearing ${name}. Remove it`} />
          ) : (
            <ChunkyButton label="Wear it" onPress={() => { triggerHaptic('light'); void wearAll(); }} height={52} />
          )
        ) : block && block !== 'not_enough' ? (
          <View style={styles.blocked}><Text maxFontSizeMultiplier={1.3} style={styles.blockedText}>{block === 'earn_only' ? 'Earn it, XP cannot buy it' : BLOCK_LABEL[block]}</Text></View>
        ) : (
          <PriceButton price={price!} was={bundle || deal ? full : null} label="Buy & equip" onPress={() => { void buy(); }} busy={busy} height={52} />
        )}
        {!owned && !block && price !== null && (
          <Text maxFontSizeMultiplier={1.3} style={styles.after}>{fmt(shop.balance.balance)} XP now, {fmt(shop.balance.balance - price)} after</Text>
        )}
        {block === 'not_enough' && price !== null && (
          <Text maxFontSizeMultiplier={1.3} style={styles.after}>{fmt(price - shop.balance.balance)} XP to go</Text>
        )}
      </View>

      <NotEnoughSheet visible={short} onClose={() => setShort(false)} name={name} price={price ?? 0} balance={shop.balance.balance} item={lead} />
      {success && (
        <SuccessView
          name={name}
          look={{ ...shop.look, ...wearing }}
          rarity={lead.rarity}
          worn={worn}
          onWear={async () => { await wearAll(); router.back(); }}
          onKeep={() => router.back()}
        />
      )}
    </View>
  );
}

/** "It's yours!": a burst of the item's rarity colour, turning rays, Leo popping in wearing it, confetti. No XP here. */
function SuccessView({ name, look, rarity, onWear, onKeep, worn }: { name: string; look: Record<string, string>; rarity: Cosmetic['rarity']; onWear: () => void; onKeep: () => void; worn: boolean }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const color = RARITY_COLOR[rarity];
  const leo = Math.min(300, width * 0.78, height * 0.4);
  const reduce = useReduceMotion();
  useEffect(() => { triggerHaptic('success'); }, []);
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[shade(color, 0.35), color, shade(color, -0.45)]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
      <Sunburst size={Math.max(width, height) * 1.5} cx={width / 2} cy={height * 0.38} color="#FFFFFF" opacity={0.32} rays={20} period={22000} />
      <Twinkles w={width} h={height} color="#FFFFFF" points={[[0.12, 0.16, 20], [0.86, 0.12, 24], [0.2, 0.5, 14], [0.84, 0.46, 16], [0.5, 0.08, 12], [0.1, 0.66, 10], [0.9, 0.62, 12]]} />
      <View style={[styles.successBody, { paddingTop: insets.top + 24 }]}>
        <View style={{ width: leo, height: leo }}>
          <FloorShadow width={leo * 0.8} cx={leo / 2} y={leo * 0.95} dark={0.4} />
          <Pop delay={120}>
            <Float distance={6}>
              <LeoAvatar look={look} size={leo} crop={false} />
            </Float>
          </Pop>
        </View>
        <Pop delay={380}>
          <View style={styles.ribbon}>
            <Svg width={220} height={50} viewBox="0 0 220 50" style={StyleSheet.absoluteFill}>
              <Polygon points="0,14 34,14 34,46 0,46 12,30" fill={shade(color, -0.3)} />
              <Polygon points="220,14 186,14 186,46 220,46 208,30" fill={shade(color, -0.3)} />
              <Polygon points="24,38 34,46 34,38" fill={shade(color, -0.55)} />
              <Polygon points="196,38 186,46 186,38" fill={shade(color, -0.55)} />
              <Rect x="24" y="4" width="172" height="34" rx="6" fill="#FFFFFF" />
            </Svg>
            <Text maxFontSizeMultiplier={1.3} style={[styles.ribbonText, { color: shade(color, -0.35) }]}>{RARITY_LABEL[rarity].toUpperCase()}</Text>
          </View>
        </Pop>
        <Text maxFontSizeMultiplier={1.3} style={styles.successTitle}>It's yours!</Text>
        <Text maxFontSizeMultiplier={1.3} style={styles.successLine}>{name}</Text>
        <Text maxFontSizeMultiplier={1.3} style={styles.successSub}>New in your wardrobe</Text>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 18 }}>
        <ChunkyButton tone="gold" label={worn ? 'Wearing it' : 'Wear it'} onPress={onWear} height={54} haptic />
        <TouchableOpacity onPress={onKeep} style={styles.keep} accessibilityRole="button"><Text maxFontSizeMultiplier={1.3} style={styles.keepText}>Keep shopping</Text></TouchableOpacity>
      </View>
      <ConfettiBurst show={!reduce} count={40} />
    </View>
  );
}

/** Lighten (amount > 0) or darken (amount < 0) a #RRGGBB colour. */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount));
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(ch);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function NotEnoughSheet({ visible, onClose, name, price, balance, item }: { visible: boolean; onClose: () => void; name: string; price: number; balance: number; item: Cosmetic }) {
  const insets = useSafeAreaInsets();
  const go = (path: string) => { onClose(); router.push(path as any); };
  const rows: { icon: keyof typeof Feather.glyphMap; title: string; sub: string; xp: string; path: string }[] = [
    { icon: 'home', title: "Finish today's lesson", sub: 'The biggest XP of the day', xp: '+90 XP', path: '/(tabs)/home' },
    { icon: 'zap', title: 'Daily Arena', sub: 'Three quick rounds', xp: 'up to +100 XP', path: '/arena' },
    { icon: 'briefcase', title: 'Deep Cases', sub: 'Three a day', xp: '+30 XP each', path: '/deep-case' },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grip} />
        <View style={styles.shortHead}>
          <ItemArt item={item} size={58} showTag={false} />
          <View style={{ flex: 1 }}>
            <Text maxFontSizeMultiplier={1.3} style={styles.shortTitle}>{fmt(Math.max(0, price - balance))} XP to go</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.shortSub}>{name} costs {fmt(price)}. You have {fmt(balance)}.</Text>
          </View>
        </View>
        <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(4, Math.min(100, (balance / Math.max(1, price)) * 100))}%` }]} /></View>
        <Text maxFontSizeMultiplier={1.3} style={styles.earnToday}>Earn it today</Text>
        {rows.map(r => (
          <TouchableOpacity key={r.title} style={styles.earnRow} onPress={() => go(r.path)} activeOpacity={0.85} accessibilityRole="button">
            <View style={styles.earnIcon}><Feather name={r.icon} size={17} color={COLORS.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text maxFontSizeMultiplier={1.3} style={styles.earnTitle}>{r.title}</Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.earnSub}>{r.sub}</Text>
            </View>
            <Text maxFontSizeMultiplier={1.3} style={styles.earnXp}>{r.xp}</Text>
          </TouchableOpacity>
        ))}
        <ChunkyButton label="Start today's lesson" onPress={() => go('/(tabs)/home')} height={50} style={{ marginTop: 10 }} />
        <TouchableOpacity onPress={onClose} style={styles.keep} accessibilityRole="button"><Text maxFontSizeMultiplier={1.3} style={[styles.keepText, { color: COLORS.textSecondary }]}>Maybe later</Text></TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  drawing: { position: 'absolute', alignSelf: 'center', bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.45)' },
  drawingText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  root: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 20 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 44 },
  topCaption: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  middle: { flex: 1, justifyContent: 'center', paddingBottom: 24 },
  stage: { alignSelf: 'center', height: STAGE_H, marginTop: 50 },
  stageCard: { ...StyleSheet.absoluteFillObject, borderRadius: 26, overflow: 'hidden', borderBottomWidth: 5, borderColor: 'rgba(0,0,0,0.18)' },
  rarityTag: { position: 'absolute', left: 14, top: 14, paddingHorizontal: 10, height: 24, borderRadius: 12, justifyContent: 'center' },
  rarityTagText: { fontSize: 11, fontWeight: '900', letterSpacing: 1, color: '#FFFFFF' },
  info: { alignItems: 'center', marginTop: 22, gap: 6 },
  kicker: { fontSize: 13.5, fontWeight: '800' },
  name: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, textAlign: 'center', letterSpacing: -0.4 },
  line: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
  goes: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },
  link: { color: COLORS.accent, fontWeight: '800' },
  parts: { flexDirection: 'row', gap: 10, marginTop: 6 },
  progressCard: { alignSelf: 'stretch', marginTop: 8, padding: 14, borderRadius: 16, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border },
  progressLabel: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  progressCount: { fontSize: 12.5, fontWeight: '700', color: COLORS.textSecondary, marginTop: 8 },
  track: { height: 10, borderRadius: 5, backgroundColor: COLORS.border, marginTop: 10, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  footer: { gap: 8 },
  error: { fontSize: 13, fontWeight: '700', color: COLORS.error, textAlign: 'center' },
  blocked: { height: 56, borderRadius: 16, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  blockedText: { fontSize: 15, fontWeight: '800', color: COLORS.textMuted },
  after: { fontSize: 12.5, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },

  successBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 40, fontWeight: '900', color: '#FFFFFF', marginTop: 14, letterSpacing: -0.6, textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0 },
  successLine: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', opacity: 0.92, textAlign: 'center', marginTop: 4 },
  ribbon: { width: 220, height: 50, marginTop: -4, alignItems: 'center', paddingTop: 11 },
  ribbonText: { fontSize: 15, fontWeight: '900', letterSpacing: 2.5 },
  successSub: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', opacity: 0.75, marginTop: 6 },
  keep: { alignItems: 'center', paddingVertical: 14 },
  keepText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },

  scrim: { flex: 1, backgroundColor: 'rgba(10, 10, 20, 0.45)' },
  sheet: { backgroundColor: COLORS.bg0, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10 },
  grip: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.border, marginBottom: 16 },
  shortHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shortTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
  shortSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  earnToday: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, marginTop: 18, marginBottom: 8 },
  earnRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border, marginBottom: 8, backgroundColor: COLORS.bg2 },
  earnIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  earnTitle: { fontSize: 14.5, fontWeight: '800', color: COLORS.textPrimary },
  earnSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  earnXp: { fontSize: 13, fontWeight: '900', color: COLORS.accent },
});
