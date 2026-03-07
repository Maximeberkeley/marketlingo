import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Linking } from 'react-native';
import { COLORS, TYPE, SHADOWS } from '../../lib/constants';

interface Source {
  label: string;
  url: string;
}

export type ConceptCardType = 'concept' | 'header' | 'bullet-group' | 'sources';

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

  if (type === 'header') {
    return (
      <Animated.View style={[styles.headerCard, { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }] }]}>
        <View style={[styles.headerAccent, { backgroundColor: accentColor }]} />
        <Text style={styles.headerTitle}>{title || content}</Text>
        <View style={styles.headerCounterWrap}>
          <Text style={styles.headerCounter}>{cardIndex + 1}</Text>
          <Text style={styles.headerCounterOf}> of {totalCards}</Text>
        </View>
      </Animated.View>
    );
  }

  if (type === 'bullet-group') {
    return (
      <Animated.View style={[styles.card, { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }] }]}>
        {title && <Text style={styles.sectionTitle}>{title}</Text>}
        <View style={styles.bulletList}>
          {(bullets || []).map((bullet, idx) => (
            <BulletItem key={idx} text={bullet} index={idx} accentColor={accentColor} />
          ))}
        </View>
      </Animated.View>
    );
  }

  if (type === 'sources') {
    return (
      <Animated.View style={[styles.sourcesCard, { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }] }]}>
        <Text style={styles.sourcesLabel}>Sources</Text>
        <View style={styles.sourcesRow}>
          {(sources || []).map((source, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.sourceChip}
              onPress={() => Linking.openURL(source.url)}
            >
              <Text style={styles.sourceText}>{source.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  }

  // Default: concept card
  return (
    <Animated.View style={[styles.card, { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }] }]}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <Text style={styles.conceptText}>{content}</Text>
    </Animated.View>
  );
}

function BulletItem({ text, index, accentColor }: { text: string; index: number; accentColor: string }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    const delay = index * 100;
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideX, { toValue: 0, tension: 200, friction: 18, useNativeDriver: true }),
      ]).start();
    }, delay);
  }, [index]);

  return (
    <Animated.View style={[styles.bulletRow, { opacity: fadeIn, transform: [{ translateX: slideX }] }]}>
      <View style={[styles.bulletDot, { backgroundColor: accentColor }]} />
      <Text style={styles.bulletText}>{text}</Text>
    </Animated.View>
  );
}

// Parse a slide body into concept cards
export function parseSlideIntoCards(
  slideTitle: string,
  body: string,
  sources: Source[],
  slideIndex: number,
): { type: ConceptCardType; title?: string; content: string; bullets?: string[]; sources?: Source[] }[] {
  const cards: { type: ConceptCardType; title?: string; content: string; bullets?: string[]; sources?: Source[] }[] = [];

  cards.push({ type: 'header', content: slideTitle });

  const paragraphs = body.split('\n').filter(p => p.trim());
  let currentBullets: string[] = [];
  let currentHeader: string | undefined;
  let pendingText = '';

  const flushText = () => {
    if (pendingText.trim()) {
      cards.push({ type: 'concept', title: currentHeader, content: pendingText.trim() });
      currentHeader = undefined;
      pendingText = '';
    }
  };

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      flushText();
      cards.push({ type: 'bullet-group', title: currentHeader, content: '', bullets: [...currentBullets] });
      currentBullets = [];
      currentHeader = undefined;
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
      if (currentBullets.length >= 6) flushBullets();
      continue;
    }

    flushBullets();
    if (pendingText.length > 0 && (pendingText.length + trimmed.length) > 800) flushText();
    pendingText += (pendingText ? ' ' : '') + trimmed;
  }

  flushBullets();
  flushText();

  if (sources && sources.length > 0) {
    cards.push({ type: 'sources', content: '', sources });
  }

  return cards;
}

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
    minHeight: 200,
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
  headerCounter: {
    ...TYPE.overline,
    color: COLORS.accent,
  },
  headerCounterOf: {
    ...TYPE.overline,
    color: COLORS.textMuted,
  },
  sectionTitle: {
    ...TYPE.bodyBold,
    color: COLORS.accent,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  conceptText: {
    fontSize: 19,
    color: COLORS.textPrimary,
    lineHeight: 30,
    letterSpacing: 0.1,
  },
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
  sourcesCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  sourcesLabel: {
    ...TYPE.caption,
    color: COLORS.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourceChip: {
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
