import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Linking, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPE, SHADOWS } from '../../lib/constants';

interface Source {
  label: string;
  url: string;
}

export type ConceptCardType = 'concept' | 'header' | 'bullet-group' | 'sources' | 'callout';

interface ConceptCardProps {
  type: ConceptCardType;
  title?: string;
  content: string;
  bullets?: string[];
  sources?: Source[];
  cardIndex: number;
  totalCards: number;
  accentColor?: string;
}

// ── Topic icon mapping ──────────────────────────────────────────────
const TOPIC_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  market: 'trending-up',
  revenue: 'dollar-sign',
  growth: 'bar-chart-2',
  risk: 'alert-triangle',
  invest: 'pie-chart',
  valuation: 'activity',
  regulation: 'shield',
  technology: 'cpu',
  innovation: 'zap',
  strategy: 'target',
  competition: 'users',
  finance: 'credit-card',
  capital: 'briefcase',
  profit: 'trending-up',
  disruption: 'shuffle',
  supply: 'truck',
  demand: 'shopping-cart',
  policy: 'book',
  data: 'database',
  ai: 'cpu',
  energy: 'battery-charging',
  climate: 'cloud',
  health: 'heart',
  security: 'lock',
  global: 'globe',
};

function getTopicIcon(text: string): keyof typeof Feather.glyphMap {
  const lower = (text || '').toLowerCase();
  for (const [keyword, icon] of Object.entries(TOPIC_ICONS)) {
    if (lower.includes(keyword)) return icon;
  }
  return 'book-open';
}

// ── Rich text renderer ──────────────────────────────────────────────
function RichText({ text, style }: { text: string; style?: any }) {
  // Parse **bold** and *italic* markers
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Text key={key++} style={style}>
          {text.slice(lastIndex, match.index)}
        </Text>
      );
    }
    if (match[2]) {
      // Bold
      parts.push(
        <Text key={key++} style={[style, styles.boldHighlight]}>
          {match[2]}
        </Text>
      );
    } else if (match[3]) {
      // Italic
      parts.push(
        <Text key={key++} style={[style, { fontStyle: 'italic' }]}>
          {match[3]}
        </Text>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(
      <Text key={key++} style={style}>
        {text.slice(lastIndex)}
      </Text>
    );
  }

  return <Text>{parts.length > 0 ? parts : <Text style={style}>{text}</Text>}</Text>;
}

// ── Main ConceptCard ────────────────────────────────────────────────
export function ConceptCard({
  type,
  title,
  content,
  bullets,
  sources,
  cardIndex,
  totalCards,
  accentColor = COLORS.accent,
}: ConceptCardProps) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 200, friction: 20, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 200, friction: 20, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Header card ─────────────────────────────────────
  if (type === 'header') {
    const icon = getTopicIcon(title || content);
    return (
      <Animated.View style={[styles.headerCard, { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }] }]}>
        <View style={[styles.headerAccent, { backgroundColor: accentColor }]} />
        <View style={[styles.headerIconWrap, { backgroundColor: accentColor + '18' }]}>
          <Feather name={icon} size={28} color={accentColor} />
        </View>
        <Text style={styles.headerTitle}>{title || content}</Text>
        <View style={styles.headerCounterWrap}>
          <View style={[styles.counterPill, { backgroundColor: accentColor + '15' }]}>
            <Text style={[styles.headerCounter, { color: accentColor }]}>{cardIndex + 1}</Text>
            <Text style={styles.headerCounterOf}> / {totalCards}</Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  // ── Callout card (pull-quote style) ─────────────────
  if (type === 'callout') {
    return (
      <Animated.View style={[styles.calloutCard, { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }], borderLeftColor: accentColor }]}>
        <Feather name="info" size={18} color={accentColor} style={{ marginBottom: 8 }} />
        <RichText text={content} style={styles.calloutText} />
      </Animated.View>
    );
  }

  // ── Bullet group card ───────────────────────────────
  if (type === 'bullet-group') {
    return (
      <Animated.View style={[styles.card, { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }] }]}>
        {title && (
          <View style={styles.sectionHeader}>
            <Feather name={getTopicIcon(title)} size={16} color={accentColor} />
            <Text style={[styles.sectionTitle, { color: accentColor }]}>{title}</Text>
          </View>
        )}
        <View style={styles.bulletList}>
          {(bullets || []).map((bullet, idx) => (
            <BulletItem key={idx} text={bullet} index={idx} accentColor={accentColor} />
          ))}
        </View>
      </Animated.View>
    );
  }

  // ── Sources card ────────────────────────────────────
  if (type === 'sources') {
    return (
      <Animated.View style={[styles.sourcesCard, { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }] }]}>
        <View style={styles.sourcesHeader}>
          <Feather name="link" size={14} color={COLORS.textMuted} />
          <Text style={styles.sourcesLabel}>Sources</Text>
        </View>
        <View style={styles.sourcesRow}>
          {(sources || []).map((source, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.sourceChip}
              onPress={() => Linking.openURL(source.url)}
            >
              <Text style={styles.sourceText}>{source.label}</Text>
              <Feather name="external-link" size={10} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  }

  // ── Default concept card ────────────────────────────
  return (
    <Animated.View style={[styles.card, { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }] }]}>
      {title && (
        <View style={styles.sectionHeader}>
          <Feather name={getTopicIcon(title)} size={16} color={accentColor} />
          <Text style={[styles.sectionTitle, { color: accentColor }]}>{title}</Text>
        </View>
      )}
      {title && <View style={styles.sectionDivider} />}
      <RichText text={content} style={styles.conceptText} />
    </Animated.View>
  );
}

// ── Bullet item with stagger animation ──────────────
function BulletItem({ text, index, accentColor }: { text: string; index: number; accentColor: string }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    const delay = index * 80;
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideX, { toValue: 0, tension: 200, friction: 18, useNativeDriver: true }),
      ]).start();
    }, delay);
  }, [index]);

  return (
    <Animated.View style={[styles.bulletRow, { opacity: fadeIn, transform: [{ translateX: slideX }] }]}>
      <View style={[styles.bulletDot, { backgroundColor: accentColor }]} />
      <RichText text={text} style={styles.bulletText} />
    </Animated.View>
  );
}

// ── Parser: slide body → concept cards ──────────────
export function parseSlideIntoCards(
  slideTitle: string,
  body: string,
  sources: Source[],
  _slideIndex: number,
): { type: ConceptCardType; title?: string; content: string; bullets?: string[]; sources?: Source[] }[] {
  const cards: { type: ConceptCardType; title?: string; content: string; bullets?: string[]; sources?: Source[] }[] = [];

  cards.push({ type: 'header', content: slideTitle });

  const paragraphs = body.split('\n').filter(p => p.trim());
  let currentBullets: string[] = [];
  let currentHeader: string | undefined;
  let pendingText = '';
  let cardCount = 0;

  const flushText = () => {
    if (pendingText.trim()) {
      // Detect "key insight" or "important" sentences → callout
      const lower = pendingText.toLowerCase();
      const isCallout =
        (lower.includes('key takeaway') || lower.includes('important:') || lower.includes('note:') || lower.includes('in summary')) &&
        pendingText.length < 300;

      cards.push({
        type: isCallout ? 'callout' : 'concept',
        title: currentHeader,
        content: pendingText.trim(),
      });
      currentHeader = undefined;
      pendingText = '';
      cardCount++;
    }
  };

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      flushText();
      cards.push({ type: 'bullet-group', title: currentHeader, content: '', bullets: [...currentBullets] });
      currentBullets = [];
      currentHeader = undefined;
      cardCount++;
    }
  };

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
    const isHeader = trimmed.startsWith('##') || (trimmed.startsWith('**') && trimmed.endsWith('**'));

    if (isHeader) {
      flushBullets();
      flushText();
      const cleanHeader = trimmed.replace(/^#{1,3}\s*/, '').replace(/\*\*/g, '');
      currentHeader = cleanHeader;
      continue;
    }

    if (isBullet) {
      flushText();
      const cleanBullet = trimmed.replace(/^[•\-*]\s*/, '');
      currentBullets.push(cleanBullet);
      if (currentBullets.length >= 5) flushBullets();
      continue;
    }

    flushBullets();
    if (pendingText.length > 0 && (pendingText.length + trimmed.length) > 900) flushText();
    pendingText += (pendingText ? '\n\n' : '') + trimmed;
  }

  flushBullets();
  flushText();

  if (sources && sources.length > 0) {
    cards.push({ type: 'sources', content: '', sources });
  }

  return cards;
}

// ── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 160,
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  headerCard: {
    backgroundColor: COLORS.bg1,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  headerAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    ...TYPE.hero,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
  },
  headerCounterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerCounter: {
    ...TYPE.overline,
    fontWeight: '700',
  },
  headerCounterOf: {
    ...TYPE.overline,
    color: COLORS.textMuted,
  },
  // Section headers with icons
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    ...TYPE.bodyBold,
    letterSpacing: 0.3,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  // Concept text
  conceptText: {
    fontSize: 18,
    color: COLORS.textPrimary,
    lineHeight: 30,
    letterSpacing: 0.15,
  },
  boldHighlight: {
    fontWeight: '700',
    color: COLORS.accent,
  },
  // Callout card
  calloutCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    minHeight: 100,
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  calloutText: {
    fontSize: 17,
    color: COLORS.textPrimary,
    lineHeight: 28,
    fontStyle: 'italic',
    letterSpacing: 0.1,
  },
  // Bullets
  bulletList: {
    gap: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 10,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 17,
    color: COLORS.textPrimary,
    lineHeight: 26,
    flex: 1,
  },
  // Sources
  sourcesCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sourcesLabel: {
    ...TYPE.caption,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bg1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sourceText: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
