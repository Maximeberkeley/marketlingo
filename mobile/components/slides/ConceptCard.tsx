import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Linking } from 'react-native';
import { COLORS } from '../../lib/constants';

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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 200, friction: 20, useNativeDriver: true }),
    ]).start();
  }, []);

  if (type === 'header') {
    return (
      <Animated.View style={[styles.headerCard, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        <View style={[styles.headerAccent, { backgroundColor: accentColor }]} />
        <Text style={styles.headerTitle}>{title || content}</Text>
        <Text style={styles.headerSubtext}>
          {cardIndex + 1} of {totalCards}
        </Text>
      </Animated.View>
    );
  }

  if (type === 'bullet-group') {
    return (
      <Animated.View style={[styles.card, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
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
      <Animated.View style={[styles.sourcesCard, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        <Text style={styles.sourcesLabel}>📎 Sources</Text>
        <View style={styles.sourcesRow}>
          {(sources || []).map((source, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.sourceChip}
              onPress={() => Linking.openURL(source.url)}
            >
              <Text style={styles.sourceText}>{source.label} ↗</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  }

  // Default: concept card
  return (
    <Animated.View style={[styles.card, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <Text style={styles.conceptText}>{content}</Text>
    </Animated.View>
  );
}

function BulletItem({ text, index, accentColor }: { text: string; index: number; accentColor: string }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    const delay = index * 120;
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

  // First card is always the slide title as a header
  cards.push({ type: 'header', content: slideTitle });

  const paragraphs = body.split('\n').filter(p => p.trim());
  let currentBullets: string[] = [];
  let currentHeader: string | undefined;

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      cards.push({
        type: 'bullet-group',
        title: currentHeader,
        content: '',
        bullets: [...currentBullets],
      });
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
      const cleanHeader = trimmed.replace(/^#{1,3}\s*/, '').replace(/\*\*/g, '');
      currentHeader = cleanHeader;
      continue;
    }

    if (isBullet) {
      const cleanBullet = trimmed.replace(/^[•\-*]\s*/, '');
      currentBullets.push(cleanBullet);
      // Flush every 3-4 bullets to keep cards digestible
      if (currentBullets.length >= 4) {
        flushBullets();
      }
      continue;
    }

    // Regular paragraph
    flushBullets();

    // Split long paragraphs (>200 chars) into separate cards
    if (trimmed.length > 200) {
      const sentences = trimmed.match(/[^.!?]+[.!?]+/g) || [trimmed];
      let chunk = '';
      for (const sentence of sentences) {
        if ((chunk + sentence).length > 180 && chunk.length > 0) {
          cards.push({ type: 'concept', title: currentHeader, content: chunk.trim() });
          currentHeader = undefined;
          chunk = sentence;
        } else {
          chunk += sentence;
        }
      }
      if (chunk.trim()) {
        cards.push({ type: 'concept', title: currentHeader, content: chunk.trim() });
        currentHeader = undefined;
      }
    } else {
      cards.push({ type: 'concept', title: currentHeader, content: trimmed });
      currentHeader = undefined;
    }
  }

  flushBullets();

  // Sources card at the end
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
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  headerSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    gap: 12,
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
  },
  sourcesLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 10,
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
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
