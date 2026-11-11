import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../lib/constants';
import { isDark } from '../../lib/theme';
import { triggerHaptic } from '../../lib/haptics';
import {
  BUNDLES, Bundle, COLLECTIONS, COSMETICS, Collection, Cosmetic, PERKS, POWER_UPS, Perk, RARITY_COLOR, RARITY_LABEL,
  SLOT_LABEL, STREAK_FREEZE_ID, bundleFullPrice, cosmetic, priceOf,
} from '../../lib/shopCatalog';
import { formatCountdown, msUntilLocalMidnight, msUntilNextMonday, requirementProgress, weeklyFeature } from '../../lib/shopEconomy';
import { hasArt, useShop } from '../../hooks/useShop';
import { LeoAvatar } from '../../components/shop/LeoAvatar';
import { ItemArt, ShopIcon } from '../../components/shop/ItemArt';
import { Carousel, Flask, PriceButton, Row, SectionHead, XPChip } from '../../components/shop/ShopKit';
import { Countdown, Float, MotionScope, PressScale, Rise, ScrollWatch, Sheen, useNow, useScrollWatch } from '../../components/shop/Motion';
import { FloatIcon, FloorShadow, PERK_SCENE, PerkObject, SCENES, SceneBackdrop, SceneTheme, Sunburst, Twinkles } from '../../components/shop/Scene';
import { SHOP_SCENES } from '../../lib/shopArt';
import { XPSheet } from '../../components/shop/XPSheet';
import { ChunkyButton } from '../../components/social/ChunkyButton';

export const SHOP_SEEN_KEY = 'ml_shop_tab_seen_v1';
const fmt = (n: number) => n.toLocaleString('en-US');
const open = (path: string) => { triggerHaptic('light'); router.push(path as any); };

type Feature = { kind: 'bundle'; bundle: Bundle } | { kind: 'item'; item: Cosmetic };

/** The XP Shop tab: spend XP on Leo's look, streak freezes, and (soon) real perks. */
export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const shop = useShop();
  // Motion and countdowns rest while another tab is in front.
  const [focused, setFocused] = useState(true);
  const now = useNow(focused, 60_000);
  const watch = useScrollWatch();
  const [xpOpen, setXpOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => {
    setFocused(true);
    AsyncStorage.setItem(SHOP_SEEN_KEY, '1').catch(() => {});
    void shop.refresh().then(() => shop.checkRewards());
    return () => setFocused(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await shop.refresh();
    setRefreshing(false);
  };

  // The weekly featured offer: a full set when one is drawn, else a hero item.
  const feature = useMemo<Feature | null>(() => {
    // A seasonal piece takes over in its month (holiday antlers in December); otherwise a full set, else a hero item.
    const month = now.getMonth() + 1;
    const inSeason = (id: string) => !!cosmetic(id)?.featuredIn?.includes(month);
    const seasonSets: Feature[] = BUNDLES.filter(b => b.items.every(hasArt) && b.items.every(inSeason)).map(bundle => ({ kind: 'bundle', bundle }));
    const seasonItems: Feature[] = COSMETICS.filter(c => priceOf(c) !== null && hasArt(c.id) && inSeason(c.id)).map(item => ({ kind: 'item', item }));
    const seasonal = seasonSets.length ? seasonSets : seasonItems;
    const sets: Feature[] = BUNDLES.filter(b => b.items.every(hasArt)).map(bundle => ({ kind: 'bundle', bundle }));
    const items: Feature[] = COSMETICS.filter(c => priceOf(c) !== null && hasArt(c.id) && (c.rarity === 'epic' || c.rarity === 'legendary')).map(item => ({ kind: 'item', item }));
    const pool = seasonal.length ? seasonal : sets.length ? sets : items;
    const pick = weeklyFeature(pool.map(f => ({ id: f.kind === 'bundle' ? f.bundle.id : f.item.id, f })), now);
    return pick?.f ?? null;
    // the offer changes weekly; recompute when the week key changes, not every second
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now.toDateString()]);

  const freezes = shop.owned[STREAK_FREEZE_ID]?.qty ?? 0;
  const wardrobeCount = COSMETICS.filter(c => !c.hidden && shop.owns(c.id)).length;
  const toClaim = COSMETICS.filter(c => shop.owned[c.id]?.source === 'reward' && !shop.owned[c.id]?.seenAt);
  const earnable = COSMETICS
    .filter(c => c.acquisition === 'reward' && !c.hidden && !shop.owns(c.id))
    .map(c => ({ c, p: requirementProgress(c.requires, shop.stats) }))
    .sort((a, b) => b.p.current / b.p.target - a.p.current / a.p.target)
    .slice(0, 8);

  return (
    <View style={styles.root}>
      {/* Header: your Leo, the title, and XP to spend. */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <PressScale onPress={() => open('/wardrobe')} style={styles.bag} accessibilityLabel={`Your items: Dress Leo, ${wardrobeCount} pieces, ${freezes} Streak ${freezes === 1 ? 'Freeze' : 'Freezes'}`}>
          <LeoAvatar look={shop.look} crown={shop.wearsCrown} size={40} bg="transparent" />
          <View style={styles.bagTag}><Feather name="shopping-bag" size={10} color="#FFFFFF" /></View>
          {freezes > 0 && (
            <View style={styles.freezeBadge}><ShopIcon id="streak-freeze" size={14} /><Text maxFontSizeMultiplier={1.3} style={styles.freezeBadgeText}>{freezes}</Text></View>
          )}
        </PressScale>
        <Text maxFontSizeMultiplier={1.3} style={styles.headerTitle}>Shop</Text>
        <XPChip value={shop.balance.balance} onPress={() => setXpOpen(true)} />
      </View>

      <ScrollWatch.Provider value={watch}>
      <MotionScope active={focused}>
      <ScrollView
        onScroll={e => watch.onScroll(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={120}
        onLayout={e => watch.onViewport(e.nativeEvent.layout.height)}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110, paddingTop: 6 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >
        {feature && (
          <Rise index={0} style={styles.pad}>
            <PromoCard feature={feature} owned={feature.kind === 'item' ? shop.owns(feature.item.id) : feature.bundle.items.every(shop.owns)} look={shop.look} />
          </Rise>
        )}

        <Rise index={1} style={styles.section}>
          <SectionHead title="Perks" tag="REAL VALUE" sub="Real help from people who hire." action="How it works" onAction={() => open(`/shop-perk?id=${PERKS[0].id}`)} />
          <Carousel
            items={PERKS}
            keyOf={p => p.id}
            render={(p, w) => (
              <PerkCard
                perk={p}
                width={w}
                waitlist={shop.perks[p.id]?.waitlist ?? 0}
                joined={!!shop.perks[p.id]?.joined}
                locked={!!p.requires && !requirementProgress(p.requires, shop.stats).met}
                onJoin={() => { triggerHaptic('success'); void shop.joinWaitlist(p.id); }}
              />
            )}
          />
        </Rise>

        {toClaim.length > 0 && (
          <Rise index={3} style={styles.section}>
            <SectionHead title="One-time rewards" />
            <View style={styles.pad}>
              {toClaim.map((c, i) => (
                <View key={c.id} style={[styles.claimRow, i > 0 && styles.claimBorder]}>
                  <ItemArt item={c} size={48} showTag={false} />
                  <View style={{ flex: 1 }}>
                    <Text maxFontSizeMultiplier={1.3} style={styles.claimTitle} numberOfLines={1}>{c.name}</Text>
                    <Text maxFontSizeMultiplier={1.3} style={styles.claimSub} numberOfLines={1}>Earned · {c.rule}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => { triggerHaptic('success'); void shop.markSeen([c.id]); open(`/shop-item?id=${c.id}&claimed=1`); }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Claim ${c.name}`}
                  >
                    <Text maxFontSizeMultiplier={1.3} style={styles.claim}>CLAIM</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </Rise>
        )}

        <Rise index={4} style={styles.section}>
          <SectionHead title="Power-ups" />
          <Row>
            {POWER_UPS.map(p => (
              <PressScale key={p.id} disabled={!p.live} onPress={() => open('/shop-freeze')} style={styles.powerTile} accessibilityLabel={p.id === STREAK_FREEZE_ID ? `${p.name}, you have ${freezes}` : p.name}>
                <View style={[styles.powerArt, { backgroundColor: p.live ? (isDark ? 'rgba(56,189,248,0.14)' : '#EAF6FE') : COLORS.bg1 }]}>
                  {p.live && <Sunburst size={220} cx={84} cy={52} color={isDark ? '#7DD3FC' : '#38BDF8'} opacity={0.3} />}
                  <Float distance={4} phase={p.live ? 0 : 700}><View style={{ opacity: p.live ? 1 : 0.55 }}><ShopIcon id={p.icon} size={64} /></View></Float>
                  {p.id === STREAK_FREEZE_ID && <View style={styles.haveTag}><Text maxFontSizeMultiplier={1.3} style={styles.haveText}>You have {freezes}</Text></View>}
                </View>
                <View style={styles.tileBody}>
                  <Text maxFontSizeMultiplier={1.3} style={styles.tileTitle}>{p.name}</Text>
                  <Text maxFontSizeMultiplier={1.3} style={styles.tileSub} numberOfLines={2}>{p.line}</Text>
                  {p.live && p.price ? (
                    <PriceButton price={p.price} onPress={() => open('/shop-freeze')} height={40} style={{ marginTop: 10 }} />
                  ) : (
                    <View style={styles.soonPill}><Text maxFontSizeMultiplier={1.3} style={styles.soonText}>Coming soon</Text></View>
                  )}
                </View>
              </PressScale>
            ))}
          </Row>
        </Rise>

        {shop.deals.length > 0 && (
          <Rise index={5} style={styles.section}>
            <View style={styles.dealHead}>
              <SectionHead title="Daily deals" sub="New picks every midnight" />
              <View style={styles.clock}>
                <Feather name="clock" size={13} color={COLORS.accent} />
                <Countdown until={msUntilLocalMidnight} style={styles.clockText} />
              </View>
            </View>
            <Row>
              {shop.deals.map(d => {
                const c = cosmetic(d.itemId);
                if (!c) return null;
                const owned = shop.owns(c.id);
                const color = RARITY_COLOR[c.rarity];
                return (
                  <PressScale key={d.itemId} onPress={() => open(`/shop-item?id=${c.id}&deal=1`)} style={[styles.dealTile, { borderColor: color + '66' }]} accessibilityLabel={`${c.name}, deal`}>
                    <View style={[styles.dealArt, { backgroundColor: color + (isDark ? '1F' : '14') }]}>
                      <Sunburst size={240} cx={82} cy={62} color={color} opacity={0.28} />
                      <Float distance={3} phase={(c.id.length % 5) * 300}><ItemArt item={c} size={112} tint="transparent" /></Float>
                      <View style={styles.offBadge}><Text maxFontSizeMultiplier={1.3} style={styles.offText}>-30%</Text></View>
                      {c.rarity !== 'common' && <Sheen width={168} every={4200} delay={600} />}
                    </View>
                    <View style={styles.tileBody}>
                      <Text maxFontSizeMultiplier={1.3} style={styles.tileTitle} numberOfLines={1}>{c.name}</Text>
                      <Text maxFontSizeMultiplier={1.3} style={[styles.rarity, { color }]}>{RARITY_LABEL[c.rarity].toUpperCase()}</Text>
                      {owned ? (
                        <View style={styles.ownedPill}><Feather name="check" size={13} color={COLORS.success} /><Text maxFontSizeMultiplier={1.3} style={styles.ownedText}>Owned</Text></View>
                      ) : (
                        <PriceButton price={d.dealPrice} was={d.price} onPress={() => open(`/shop-item?id=${c.id}&deal=1`)} height={40} style={{ marginTop: 10 }} />
                      )}
                    </View>
                  </PressScale>
                );
              })}
            </Row>
          </Rise>
        )}

        <Rise index={6} style={styles.section}>
          <SectionHead title="Leo collections" sub="Swipe through. Tap to try on." />
          <Carousel items={COLLECTIONS} keyOf={c => c.id} autoMs={5000} padTop={40} render={(c, w) => <CollectionCard collection={c} width={w} owned={shop.owns} />} />
        </Rise>

        <Rise index={7} style={styles.section}>
          <SectionHead title="Bundles" sub="The full look for less" />
          <Row>
            {[...BUNDLES].sort((a, b) => Number(b.items.every(hasArt)) - Number(a.items.every(hasArt))).map(b => {
              const ready = b.items.every(hasArt);
              const wear = Object.fromEntries(b.items.filter(hasArt).map(id => [cosmetic(id)!.slot, id]));
              const owned = b.items.every(shop.owns);
              const full = bundleFullPrice(b);
              const save = Math.round((1 - b.price / full) * 100);
              return (
                <PressScale key={b.id} onPress={() => open(`/shop-item?bundle=${b.id}`)} style={styles.bundleTile} accessibilityLabel={b.name}>
                  <View style={styles.bundleArt}>
                    <SceneBackdrop theme={(b.collection in SCENES ? b.collection : 'promo') as SceneTheme} sceneId={b.collection} />
                    <Sunburst size={320} cx={138} cy={70} color="#FFFFFF" opacity={0.35} />
                    <Twinkles w={276} h={128} color="#FFFFFF" points={[[0.2, 0.3, 12], [0.8, 0.25, 14], [0.7, 0.8, 9]]} />
                    <Float distance={4} style={{ position: 'absolute', left: 138 - 70, top: 128 - 140 * 0.955 + 4 }}>
                      <LeoAvatar look={{ hat: '', ...wear }} size={140} crop={false} />
                    </Float>
                    <Text maxFontSizeMultiplier={1.3} style={styles.bundleCount}>{b.items.length} pieces</Text>
                    <View style={styles.saveBadge}><Text maxFontSizeMultiplier={1.3} style={styles.offText}>Save {save}%</Text></View>
                  </View>
                  <View style={styles.tileBody}>
                    <Text maxFontSizeMultiplier={1.3} style={styles.tileTitle}>{b.name}</Text>
                    <Text maxFontSizeMultiplier={1.3} style={styles.tileSub} numberOfLines={1}>{b.line}</Text>
                    {owned ? (
                      <View style={styles.ownedPill}><Feather name="check" size={13} color={COLORS.success} /><Text maxFontSizeMultiplier={1.3} style={styles.ownedText}>Owned</Text></View>
                    ) : ready ? (
                      <PriceButton price={b.price} was={full} onPress={() => open(`/shop-item?bundle=${b.id}`)} height={42} style={{ marginTop: 10 }} />
                    ) : (
                      <View style={[styles.soonPill, { marginTop: 12 }]}><Text maxFontSizeMultiplier={1.3} style={styles.soonText}>Art soon · {fmt(b.price)} XP</Text></View>
                    )}
                  </View>
                </PressScale>
              );
            })}
          </Row>
        </Rise>

        {earnable.length > 0 && (
          <Rise index={8} style={styles.section}>
            <LinearGradient colors={isDark ? ['#2A1858', '#1B1240'] : ['#5B21B6', '#4C1D95']} style={styles.earnBand}>
              <Twinkles w={390} h={120} color="#FDE68A" points={[[0.62, 0.22, 16], [0.86, 0.5, 12], [0.74, 0.12, 9]]} />
              <Text maxFontSizeMultiplier={1.3} style={styles.earnTitle}>Earn these</Text>
              <Text maxFontSizeMultiplier={1.3} style={styles.earnSub}>XP can't buy them. Only you can.</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingTop: 14, paddingRight: 20 }}>
                {earnable.map(({ c, p }) => (
                  <TouchableOpacity key={c.id} activeOpacity={0.9} onPress={() => open(`/shop-item?id=${c.id}`)} style={styles.earnTile} accessibilityRole="button">
                    <View style={styles.earnArt}>
                      <Sunburst size={220} cx={72} cy={50} color="#FDE68A" opacity={p.met ? 0.4 : 0.18} />
                      <View style={{ opacity: p.met ? 1 : 0.55 }}><ItemArt item={c} size={92} showTag={false} tint="transparent" /></View>
                      <View style={[styles.lock, p.met && { backgroundColor: '#4ADE80' }]}><Feather name={p.met ? 'check' : 'lock'} size={13} color={p.met ? '#052E16' : '#3A2600'} /></View>
                    </View>
                    <Text maxFontSizeMultiplier={1.3} style={styles.earnName} numberOfLines={1}>{c.name}</Text>
                    <Text maxFontSizeMultiplier={1.3} style={styles.earnRule} numberOfLines={2}>{p.label}</Text>
                    <View style={styles.earnTrack}><View style={[styles.earnFill, { width: `${Math.max(4, (p.current / p.target) * 100)}%` }]} /></View>
                    <Text maxFontSizeMultiplier={1.3} style={styles.earnCount}>{p.met ? 'Earned · on its way' : `${fmt(p.current)} / ${fmt(p.target)}`}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </LinearGradient>
          </Rise>
        )}

        {!shop.available && shop.ready && (
          <Text maxFontSizeMultiplier={1.3} style={styles.offline}>Buying opens soon. Your XP is safe and keeps growing.</Text>
        )}
      </ScrollView>
      </MotionScope>
      </ScrollWatch.Provider>

      <XPSheet visible={xpOpen} onClose={() => setXpOpen(false)} inShop />
    </View>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────

function PromoCard({ feature, owned, look }: { feature: Feature; owned: boolean; look: Record<string, string> }) {
  const { width: screen } = useWindowDimensions();
  const W = screen - 40;
  const H = 208;
  const isSet = feature.kind === 'bundle';
  const title = isSet ? feature.bundle.name : `Leo's ${feature.item.name.toLowerCase()}`;
  const rarity = isSet ? null : feature.item.rarity;
  const line = isSet ? `Save ${Math.round((1 - feature.bundle.price / bundleFullPrice(feature.bundle)) * 100)}% on the set` : `${RARITY_LABEL[feature.item.rarity]} ${SLOT_LABEL[feature.item.slot].toLowerCase()}`;
  const price = isSet ? feature.bundle.price : priceOf(feature.item)!;
  const was = isSet ? bundleFullPrice(feature.bundle) : null;
  const wear = isSet ? Object.fromEntries(feature.bundle.items.map(id => [cosmetic(id)!.slot, id])) : { [feature.item.slot]: feature.item.id };
  const path = isSet ? `/shop-item?bundle=${feature.bundle.id}` : `/shop-item?id=${feature.item.id}`;
  const leo = Math.min(250, W * 0.72);
  const leoX = W - 8 - leo * 0.83;
  const leoTop = H - 14 - leo * 0.955;
  const t = SCENES.promo;
  return (
    <PressScale onPress={() => open(path)} accessibilityLabel={`${title}. ${line}`} style={{ marginTop: 34 }}>
      <View style={[styles.promo, { height: H }]}>
        <View style={styles.promoClip}>
          <SceneBackdrop theme="promo" sceneId="promo" />
          <Sunburst size={420} cx={leoX + leo / 2} cy={H * 0.52} color={rarity ? RARITY_COLOR[rarity] : t.ray} opacity={0.55} />
          <Twinkles w={W} h={H} color={t.spark} points={[[0.52, 0.14, 16], [0.94, 0.1, 12], [0.6, 0.86, 10], [0.06, 0.08, 9], [0.42, 0.62, 8]]} />
          <FloorShadow width={leo * 0.8} cx={leoX + leo * 0.49} y={H - 16} dark={0.7} />
          {rarity === 'legendary' || rarity === 'epic' || isSet ? <Sheen width={W} every={3800} /> : null}
        </View>
        <View style={styles.promoText}>
          <View style={styles.promoKicker}>
            <Feather name="clock" size={11} color="#FDE68A" />
            <Countdown until={msUntilNextMonday} prefix="NEW · " style={styles.promoKickerText} />
          </View>
          <Text maxFontSizeMultiplier={1.15} style={styles.promoTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>{title}</Text>
          <Text maxFontSizeMultiplier={1.15} style={styles.promoLine} numberOfLines={1}>{line}</Text>
          <View style={{ flex: 1 }} />
          {owned ? (
            <ChunkyButton label="Owned · Wear it" onPress={() => open(path)} height={44} tone="plain" />
          ) : (
            <PriceButton price={price} was={was} onPress={() => open(path)} height={44} />
          )}
        </View>
        <FloatIcon id={t.icons[2]} size={40} x={leoX + leo * 0.06} y={-16} depth={0} phase={300} />
        <Float distance={6} style={{ position: 'absolute', left: leoX, top: leoTop }}>
          <LeoAvatar look={{ ...look, ...wear }} size={leo} crop={false} />
        </Float>
        <FloatIcon id={t.icons[1]} size={54} x={W - 60} y={H - 74} depth={2} phase={800} />
        <FloatIcon id={t.icons[0]} size={36} x={W - 44} y={10} depth={1} phase={1300} />
      </View>
    </PressScale>
  );
}

function PerkCard({ perk, width, waitlist, joined, locked, onJoin }: { perk: Perk; width: number; waitlist: number; joined: boolean; locked: boolean; onJoin: () => void }) {
  const status = locked ? 'Unlocks after your Weekly Case' : waitlist >= 10 ? `${fmt(waitlist)} on the waitlist` : 'Coming soon';
  const scene = PERK_SCENE[perk.id] ?? PERK_SCENE['perk-tool-credits'];
  const H = 176;
  const art = SHOP_SCENES[perk.id];
  return (
    <PressScale onPress={() => open(`/shop-perk?id=${perk.id}`)} style={[styles.perk, { width }]} accessibilityLabel={`${perk.name}. ${status}`}>
      <View style={[styles.perkArt, { height: H }]}>
        {art ? <SceneBackdrop theme="promo" sceneId={perk.id} /> : (
          <LinearGradient colors={scene.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        )}
        <Sunburst size={380} cx={width / 2} cy={H * 0.56} color="#FDE68A" opacity={0.32} rays={18} />
        <Twinkles w={width} h={H} color="#FDE68A" points={[[0.12, 0.3, 12], [0.86, 0.22, 15], [0.22, 0.82, 9], [0.8, 0.84, 10]]} />
        {!art && (
          <Float distance={5} style={{ position: 'absolute', left: width / 2 - 92, top: H / 2 - 60 }}>
            <PerkObject id={perk.id} width={184} />
          </Float>
        )}
        <FloatIcon id={scene.icons[0]} size={42} x={14} y={H - 66} depth={2} phase={400} />
        <FloatIcon id={scene.icons[1]} size={34} x={width - 54} y={46} depth={0} phase={1100} />
        <View style={styles.perkTag}><Text maxFontSizeMultiplier={1.3} style={styles.perkTagText}>✦ PERK</Text></View>
        <Text maxFontSizeMultiplier={1.3} style={styles.perkKicker}>{perk.kicker.toUpperCase()}</Text>
        <Sheen width={width} every={5200} delay={1200} />
      </View>
      <View style={styles.perkBody}>
        <Text maxFontSizeMultiplier={1.3} style={styles.perkName} numberOfLines={2}>{perk.name}</Text>
        <View style={styles.perkStatus}>
          {locked ? <Feather name="lock" size={12} color={COLORS.textMuted} /> : <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />}
          <Text maxFontSizeMultiplier={1.3} style={styles.perkStatusText} numberOfLines={1}>{status}</Text>
        </View>
        <View style={styles.perkActions}>
          <View style={styles.perkPrice}><Flask size={15} color="#6D28D9" /><Text maxFontSizeMultiplier={1.3} style={styles.perkPriceText}>{fmt(perk.price)}</Text></View>
          {joined ? (
            <View style={styles.joined}><Feather name="check" size={15} color={COLORS.success} /><Text maxFontSizeMultiplier={1.3} style={styles.joinedText}>You're on the list</Text></View>
          ) : (
            <ChunkyButton label={locked ? 'Notify me' : 'Join waitlist'} onPress={onJoin} height={42} style={{ flex: 1 }} haptic />
          )}
        </View>
      </View>
    </PressScale>
  );
}

function CollectionCard({ collection, width, owned }: { collection: Collection; width: number; owned: (id: string) => boolean }) {
  const items = COSMETICS.filter(c => c.collection === collection.id && !c.hidden);
  const drawn = items.filter(c => hasArt(c.id));
  const look = Object.fromEntries(drawn.map(c => [c.slot, c.id]));
  const have = items.filter(c => owned(c.id)).length;
  const theme = collection.id as SceneTheme;
  const t = SCENES[theme] ?? SCENES.promo;
  const H = 208;
  const leo = 252;
  const leoTop = H - leo * 0.955 + 6;
  return (
    <PressScale onPress={() => open(`/shop-collection?id=${collection.id}`)} style={[styles.coll, { width }]} accessibilityLabel={`${collection.name} collection`}>
      <View style={[styles.collArt, { height: H }]}>
        <SceneBackdrop theme={theme} sceneId={collection.id} />
        <Sunburst size={420} cx={width / 2} cy={H * 0.62} color={t.ray} opacity={t.rayOpacity} />
        <Twinkles w={width} h={H} color={t.spark} />
        <FloorShadow width={230} cx={width / 2} y={H - 4} dark={0.45} />
        <Sheen width={width} every={5600} delay={300} />
      </View>
      <FloatIcon id={t.icons[1]} size={40} x={width - 66} y={28} depth={0} phase={700} />
      <Float distance={5} style={{ position: 'absolute', left: width / 2 - leo / 2, top: leoTop }}>
        <LeoAvatar look={drawn.length ? { hat: '', ...look } : {}} size={leo} crop={false} />
      </Float>
      <FloatIcon id={t.icons[0]} size={50} x={12} y={H - 74} depth={2} phase={200} />
      <FloatIcon id={t.icons[2]} size={44} x={width - 60} y={H - 62} depth={1} phase={1200} />
      {!drawn.length && <View style={styles.collPill}><Text maxFontSizeMultiplier={1.3} style={styles.collPillText}>ART SOON</Text></View>}
      <View style={styles.collBody}>
        <View style={{ flex: 1 }}>
          <Text maxFontSizeMultiplier={1.3} style={styles.collName}>{collection.name}</Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.collHook} numberOfLines={1}>{collection.hook}</Text>
          <View style={styles.collMeter}><View style={[styles.collFill, { width: `${Math.max(4, (have / Math.max(1, items.length)) * 100)}%` }]} /></View>
          <Text maxFontSizeMultiplier={1.3} style={styles.collOwned}>{have} of {items.length} owned</Text>
        </View>
        <ChunkyButton label="See set" onPress={() => open(`/shop-collection?id=${collection.id}`)} height={42} tone="plain" style={{ width: 110 }} haptic />
      </View>
    </PressScale>
  );
}

const CARD = { backgroundColor: COLORS.bg2, borderRadius: 20, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10, gap: 12, backgroundColor: COLORS.bg0 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
  pad: { paddingHorizontal: 20 },
  section: { marginTop: 30 },

  bag: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border, backgroundColor: COLORS.bg2, alignItems: 'center', justifyContent: 'center' },
  bagTag: { position: 'absolute', left: -4, bottom: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.accent, borderWidth: 2, borderColor: COLORS.bg0, alignItems: 'center', justifyContent: 'center' },
  freezeBadge: { position: 'absolute', right: -10, top: -6, flexDirection: 'row', alignItems: 'center', gap: 1, height: 20, paddingHorizontal: 4, borderRadius: 10, backgroundColor: isDark ? '#0C4A6E' : '#E0F2FE', borderWidth: 2, borderColor: COLORS.bg0 },
  freezeBadgeText: { fontSize: 11, fontWeight: '900', color: isDark ? '#BAE6FD' : '#0369A1' },

  promo: { borderRadius: 26, borderBottomWidth: 5, borderColor: '#06081F' },
  promoClip: { ...StyleSheet.absoluteFillObject, borderRadius: 26, overflow: 'hidden', backgroundColor: '#0A0E2C' },
  promoText: { position: 'absolute', left: 18, top: 18, bottom: 18, width: '47%' },
  promoKicker: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 9, height: 24, borderRadius: 12, backgroundColor: 'rgba(253,230,138,0.16)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.4)' },
  promoKickerText: { fontSize: 11.5, fontWeight: '900', color: '#FDE68A', fontVariant: ['tabular-nums'] },
  promoTitle: { fontSize: 25, lineHeight: 28, fontWeight: '900', color: '#FFFFFF', marginTop: 10, letterSpacing: -0.4 },
  promoLine: { fontSize: 13, fontWeight: '700', color: '#C4B5FD', marginTop: 4 },

  perk: { ...CARD, overflow: 'hidden' },
  perkArt: { overflow: 'hidden', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  perkTag: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 9, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#FCD34D', backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  perkTagText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8, color: '#FCD34D' },
  perkKicker: { position: 'absolute', top: 17, right: 14, fontSize: 10.5, fontWeight: '900', letterSpacing: 1, color: '#E9D5FF' },
  perkBody: { padding: 16, gap: 8 },
  perkName: { fontSize: 18, lineHeight: 23, fontWeight: '900', color: COLORS.textPrimary },
  perkStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  perkStatusText: { flex: 1, fontSize: 12.5, fontWeight: '700', color: COLORS.textSecondary },
  perkActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  perkPrice: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 46, paddingHorizontal: 12, borderRadius: 14, borderBottomWidth: 4, borderColor: isDark ? 'rgba(217,154,0,0.55)' : '#F2C94C', backgroundColor: isDark ? 'rgba(255,200,61,0.16)' : '#FFF4D1' },
  perkPriceText: { fontSize: 15, fontWeight: '900', color: isDark ? '#FCD34D' : '#7A5A00' },
  joined: { flex: 1, height: 42, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.successSoft },
  joinedText: { fontSize: 14, fontWeight: '800', color: COLORS.success },


  claimRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  claimBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  claimTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  claimSub: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 1 },
  claim: { fontSize: 14, fontWeight: '900', letterSpacing: 0.6, color: COLORS.accent },

  powerTile: { width: 168, overflow: 'hidden', ...CARD },
  powerArt: { height: 104, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  haveTag: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: isDark ? '#0C4A6E' : '#FFFFFF', justifyContent: 'center' },
  haveText: { fontSize: 11, fontWeight: '900', color: isDark ? '#BAE6FD' : '#0369A1' },
  tileBody: { padding: 12 },
  tileTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  tileSub: { fontSize: 12, lineHeight: 16, color: COLORS.textSecondary, marginTop: 2, minHeight: 32 },
  soonPill: { marginTop: 10, height: 36, borderRadius: 12, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },
  soonText: { fontSize: 12.5, fontWeight: '800', color: COLORS.textMuted },
  rarity: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.8, marginTop: 2 },
  ownedPill: { marginTop: 10, height: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: COLORS.successSoft },
  ownedText: { fontSize: 13.5, fontWeight: '800', color: COLORS.success },

  dealHead: { flexDirection: 'row', alignItems: 'flex-start' },
  clock: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 28, paddingHorizontal: 10, borderRadius: 14, backgroundColor: COLORS.accentSoft, marginRight: 20, marginTop: 4 },
  clockText: { fontSize: 12.5, fontWeight: '800', color: COLORS.accent, fontVariant: ['tabular-nums'] },
  dealTile: { width: 168, overflow: 'hidden', backgroundColor: COLORS.bg2, borderRadius: 20, borderWidth: 2, borderBottomWidth: 4 },
  dealArt: { height: 128, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  offBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 7, height: 22, borderRadius: 7, backgroundColor: '#E11D48', alignItems: 'center', justifyContent: 'center' },
  offText: { fontSize: 11.5, fontWeight: '900', color: '#FFFFFF' },

  coll: { ...CARD },
  collArt: { overflow: 'hidden', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  collPill: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 9, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.22)', justifyContent: 'center' },
  collPillText: { fontSize: 10, fontWeight: '900', letterSpacing: 1, color: '#FFFFFF' },
  collBody: { flexDirection: 'row', alignItems: 'flex-end', padding: 16, gap: 12 },
  collName: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
  collHook: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  collMeter: { height: 8, borderRadius: 4, backgroundColor: COLORS.border, marginTop: 10, overflow: 'hidden' },
  collFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  collOwned: { fontSize: 12.5, fontWeight: '800', color: COLORS.accent, marginTop: 6 },

  bundleTile: { width: 276, overflow: 'hidden', ...CARD },
  bundleArt: { height: 128, overflow: 'hidden' },
  bundleCount: { position: 'absolute', right: 10, bottom: 8, paddingHorizontal: 8, height: 22, lineHeight: 22, borderRadius: 11, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.28)', fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },
  saveBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, height: 22, borderRadius: 7, backgroundColor: '#E11D48', alignItems: 'center', justifyContent: 'center' },

  earnBand: { paddingVertical: 22, paddingLeft: 20 },
  earnTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  earnSub: { fontSize: 13, fontWeight: '600', color: '#DDD6FE', marginTop: 2 },
  earnTile: { width: 168, padding: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.16)' },
  earnArt: { height: 100, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.18)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  lock: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: '#FCD34D', alignItems: 'center', justifyContent: 'center' },
  earnName: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginTop: 10 },
  earnRule: { fontSize: 12, lineHeight: 16, color: '#DDD6FE', marginTop: 2, minHeight: 32 },
  earnTrack: { height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 8, overflow: 'hidden' },
  earnFill: { height: 7, borderRadius: 4, backgroundColor: '#FCD34D' },
  earnCount: { fontSize: 12.5, fontWeight: '800', color: '#FDE68A', marginTop: 6 },

  offline: { fontSize: 12.5, color: COLORS.textMuted, textAlign: 'center', marginTop: 28, paddingHorizontal: 32 },
});
