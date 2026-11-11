import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Flask, PriceButton, XPChip } from '../components/shop/ShopKit';
import { Float, useReduceMotion } from '../components/shop/Motion';
import { ChunkyButton } from '../components/social/ChunkyButton';
import { ConfettiBurst } from '../components/ui/ConfettiBurst';

const fmt = (n: number) => n.toLocaleString('en-US');

/** Try an item (or a full set) on Leo, then buy and wear it. Also the "It's yours" moment and the not-enough-XP sheet. */
export default function ShopItemScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; bundle?: string; deal?: string; claimed?: string }>();
  const shop = useShop();
  const bundle = params.bundle ? BUNDLES.find(b => b.id === params.bundle) : undefined;
  const item = params.id ? cosmetic(params.id) : undefined;
  const parts: Cosmetic[] = bundle ? bundle.items.map(id => cosmetic(id)!).filter(Boolean) : item ? [item] : [];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ from: number; to: number } | null>(params.claimed ? { from: shop.balance.balance, to: shop.balance.balance } : null);
  const [short, setShort] = useState(false);

  if (!parts.length) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.name}>That item is gone</Text>
        <Text style={styles.link} onPress={() => router.back()}>Back to the Shop</Text>
      </View>
    );
  }

  const name = bundle ? bundle.name : item!.name;
  const lead = parts[0];
  const color = RARITY_COLOR[lead.rarity];
  const collection = (bundle?.collection ?? lead.collection) ? collectionOf((bundle?.collection ?? lead.collection)!) : null;
  const wearing = Object.fromEntries(parts.map(p => [p.slot, p.id]));
  const owned = parts.every(p => shop.owns(p.id));
  const worn = parts.every(p => (shop.look[p.slot] ?? (p.id === 'grad-cap' ? 'grad-cap' : undefined)) === p.id);
  const art = parts.every(p => hasArt(p.id));
  const earnOnly = !bundle && lead.acquisition === 'reward';
  const progress = earnOnly ? requirementProgress(lead.requires, shop.stats) : null;
  const deal = !bundle && params.deal ? todaysPrice(shop, lead.id).deal : null;
  const full = bundle ? bundleFullPrice(bundle) : priceOf(lead);
  const price = bundle ? bundle.price : deal ? deal.dealPrice : full;
  const block = owned ? 'owned' : buyBlock({ price, balance: shop.balance.balance, hasArt: art, earnOnly, comingSoon: !shop.available && shop.ready });
  const goesWith = !bundle && lead.collection
    ? COSMETICS.filter(c => c.collection === lead.collection && c.id !== lead.id && c.slot !== lead.slot && hasArt(c.id)).slice(0, 2)
    : [];

  const wearAll = async () => {
    for (const p of parts) await shop.equip(p.slot, p.id);
  };

  const buy = async () => {
    if (block === 'not_enough') { setShort(true); return; }
    if (block) return;
    setBusy(true);
    setError(null);
    const from = shop.balance.balance;
    const r = await shop.purchase(bundle ? bundle.id : lead.id, { dealDate: deal ? shop.dealDate : undefined });
    setBusy(false);
    if (r.ok === false) {
      if (r.error === 'not_enough') { setShort(true); return; }
      setError(r.error === 'requirement_not_met' ? 'Finish its requirement first.' : r.error === 'owned' ? 'You already own this.' : 'That did not go through. Try again.');
      return;
    }
    triggerHaptic('success');
    playSound('lessonComplete').catch(() => {});
    setSuccess({ from, to: r.balance });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 14 }]}>
      <View style={styles.top}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Feather name="x" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topCaption} numberOfLines={1}>{collection ? collection.name : SLOT_LABEL[lead.slot]}</Text>
        <XPChip value={shop.balance.balance} />
      </View>

      <View style={styles.middle}>
      <View style={styles.stage}>
        <Float distance={4}>
          <LeoAvatar look={{ ...shop.look, ...wearing }} size={250} bg={color + '1A'} />
        </Float>
      </View>

      <View style={styles.info}>
        <Text style={[styles.kicker, { color }]}>
          {bundle ? `SET · ${parts.length} PIECES` : `${RARITY_LABEL[lead.rarity].toUpperCase()} · ${SLOT_LABEL[lead.slot].toUpperCase()}`}
        </Text>
        <Text style={styles.name}>{name}</Text>
        {bundle ? (
          <View style={styles.parts}>{parts.map(p => <ItemArt key={p.id} item={p} size={64} showTag={false} />)}</View>
        ) : earnOnly && progress ? (
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>{progress.met ? 'Unlocked' : progress.label}</Text>
            <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(4, (progress.current / progress.target) * 100)}%` }]} /></View>
            <Text style={styles.progressCount}>{fmt(progress.current)} / {fmt(progress.target)} · Earned, not bought</Text>
          </View>
        ) : collection ? (
          <Text style={styles.line}>{collection.hook}.</Text>
        ) : null}
        {goesWith.length > 0 && (
          <Text style={styles.goes}>
            Goes with {goesWith.map((g, i) => (
              <Text key={g.id}>
                {i > 0 ? ' and ' : ''}
                <Text style={styles.link} onPress={() => router.replace(`/shop-item?id=${g.id}` as any)}>{g.name}</Text>
              </Text>
            ))}
          </Text>
        )}
      </View>
      </View>

      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {owned ? (
          <ChunkyButton label={worn ? 'Wearing it' : 'Wear it'} disabled={worn} onPress={() => { triggerHaptic('light'); void wearAll(); }} height={52} />
        ) : block && block !== 'not_enough' ? (
          <View style={styles.blocked}><Text style={styles.blockedText}>{block === 'earn_only' ? 'Earn it, XP cannot buy it' : BLOCK_LABEL[block]}</Text></View>
        ) : (
          <PriceButton price={price!} was={bundle || deal ? full : null} label="Buy & equip" onPress={() => { void buy(); }} busy={busy} height={52} />
        )}
        {!owned && !block && price !== null && (
          <Text style={styles.after}>{fmt(shop.balance.balance)} XP now, {fmt(shop.balance.balance - price)} after</Text>
        )}
        {block === 'not_enough' && price !== null && (
          <Text style={styles.after}>{fmt(price - shop.balance.balance)} XP to go</Text>
        )}
      </View>

      <NotEnoughSheet visible={short} onClose={() => setShort(false)} name={name} price={price ?? 0} balance={shop.balance.balance} item={lead} />
      {success && (
        <SuccessView
          name={name}
          look={{ ...shop.look, ...wearing }}
          from={success.from}
          to={success.to}
          onEquip={async () => { await wearAll(); router.back(); }}
          onKeep={() => router.back()}
        />
      )}
    </View>
  );
}

function SuccessView({ name, look, from, to, onEquip, onKeep }: { name: string; look: Record<string, string>; from: number; to: number; onEquip: () => void; onKeep: () => void }) {
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const pop = useRef(new Animated.Value(reduce ? 1 : 0.6)).current;
  const roll = useRef(new Animated.Value(from)).current;
  const [shown, setShown] = useState(from);
  useEffect(() => {
    if (reduce) { setShown(to); return; }
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    const id = roll.addListener(({ value }) => setShown(Math.round(value)));
    Animated.timing(roll, { toValue: to, duration: 900, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => roll.removeListener(id);
  }, [reduce, to, pop, roll]);
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['#6D28D9', '#8B5CF6']} style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 18, paddingHorizontal: 20 }]}>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={styles.successChip}><Flask size={16} color="#6D28D9" /><Text style={styles.successChipText}>{fmt(shown)}</Text></View>
        </View>
        <View style={styles.successBody}>
          <Animated.View style={{ transform: [{ scale: pop }] }}>
            <LeoAvatar look={look} size={230} ring="#FCD34D" ringWidth={5} bg="rgba(255,255,255,0.16)" />
          </Animated.View>
          <Text style={styles.successTitle}>It's yours!</Text>
          <Text style={styles.successLine}>{name} joined your wardrobe.</Text>
        </View>
        <ChunkyButton tone="gold" label="Equip" onPress={onEquip} height={52} />
        <TouchableOpacity onPress={onKeep} style={styles.keep} accessibilityRole="button"><Text style={styles.keepText}>Keep shopping</Text></TouchableOpacity>
      </LinearGradient>
      <ConfettiBurst show count={36} />
    </View>
  );
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
            <Text style={styles.shortTitle}>{fmt(Math.max(0, price - balance))} XP to go</Text>
            <Text style={styles.shortSub}>{name} costs {fmt(price)}. You have {fmt(balance)}.</Text>
          </View>
        </View>
        <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(4, Math.min(100, (balance / Math.max(1, price)) * 100))}%` }]} /></View>
        <Text style={styles.earnToday}>Earn it today</Text>
        {rows.map(r => (
          <TouchableOpacity key={r.title} style={styles.earnRow} onPress={() => go(r.path)} activeOpacity={0.85} accessibilityRole="button">
            <View style={styles.earnIcon}><Feather name={r.icon} size={17} color={COLORS.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.earnTitle}>{r.title}</Text>
              <Text style={styles.earnSub}>{r.sub}</Text>
            </View>
            <Text style={styles.earnXp}>{r.xp}</Text>
          </TouchableOpacity>
        ))}
        <ChunkyButton label="Start today's lesson" onPress={() => go('/(tabs)/home')} height={50} style={{ marginTop: 10 }} />
        <TouchableOpacity onPress={onClose} style={styles.keep} accessibilityRole="button"><Text style={[styles.keepText, { color: COLORS.textSecondary }]}>Maybe later</Text></TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 20 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 44 },
  topCaption: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  middle: { flex: 1, justifyContent: 'center', paddingBottom: 24 },
  stage: { alignItems: 'center', justifyContent: 'center' },
  info: { alignItems: 'center', marginTop: 22, gap: 6 },
  kicker: { fontSize: 11.5, fontWeight: '900', letterSpacing: 1 },
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

  successBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  successChip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: '#FFFFFF' },
  successChipText: { fontSize: 16, fontWeight: '900', color: '#6D28D9', fontVariant: ['tabular-nums'] },
  successTitle: { fontSize: 34, fontWeight: '900', color: '#FFFFFF', marginTop: 18 },
  successLine: { fontSize: 15, fontWeight: '600', color: '#EDE9FE', textAlign: 'center' },
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
