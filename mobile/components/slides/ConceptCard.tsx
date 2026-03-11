import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Linking,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS, TYPE, SHADOWS } from "../../lib/constants";
import { FLUID, fluidFont, fluidLineHeight } from "../../lib/fluidType";

interface Source {
  label: string;
  url: string;
}

export type ConceptCardType =
  | "concept"
  | "header"
  | "bullet-group"
  | "sources"
  | "callout"
  | "key-stat"
  | "example"
  | "key-terms";

interface KeyTerm {
  term: string;
  definition: string;
}

interface ConceptCardProps {
  type: ConceptCardType;
  title?: string;
  content: string;
  bullets?: string[];
  sources?: Source[];
  keyTerms?: KeyTerm[];
  cardIndex: number;
  totalCards: number;
  accentColor?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_CARD_CONTENT_HEIGHT = SCREEN_HEIGHT * 0.55; // Safe area for scrollable content

// ── Topic icon mapping ──────────────────────────────────────────────
const TOPIC_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  market: "trending-up",
  revenue: "dollar-sign",
  growth: "bar-chart-2",
  risk: "alert-triangle",
  invest: "pie-chart",
  valuation: "activity",
  regulation: "shield",
  technology: "cpu",
  innovation: "zap",
  strategy: "target",
  competition: "users",
  finance: "credit-card",
  capital: "briefcase",
  profit: "trending-up",
  disruption: "shuffle",
  supply: "truck",
  demand: "shopping-cart",
  policy: "book",
  data: "database",
  ai: "cpu",
  energy: "battery-charging",
  climate: "cloud",
  health: "heart",
  security: "lock",
  global: "globe",
};

// ── Topic illustration mapping ──────────────────────────────────────
const TOPIC_ILLUSTRATIONS: Record<string, any> = {
  market: require("../../assets/illustrations/topic-market.png"),
  revenue: require("../../assets/illustrations/topic-finance.png"),
  growth: require("../../assets/illustrations/topic-growth.png"),
  invest: require("../../assets/illustrations/topic-market.png"),
  valuation: require("../../assets/illustrations/topic-finance.png"),
  regulation: require("../../assets/illustrations/topic-security.png"),
  technology: require("../../assets/illustrations/topic-technology.png"),
  innovation: require("../../assets/illustrations/topic-innovation.png"),
  strategy: require("../../assets/illustrations/topic-strategy.png"),
  finance: require("../../assets/illustrations/topic-finance.png"),
  capital: require("../../assets/illustrations/topic-finance.png"),
  profit: require("../../assets/illustrations/topic-market.png"),
  supply: require("../../assets/illustrations/topic-global.png"),
  demand: require("../../assets/illustrations/topic-market.png"),
  data: require("../../assets/illustrations/topic-technology.png"),
  ai: require("../../assets/illustrations/topic-technology.png"),
  energy: require("../../assets/illustrations/topic-growth.png"),
  climate: require("../../assets/illustrations/topic-global.png"),
  health: require("../../assets/illustrations/topic-growth.png"),
  security: require("../../assets/illustrations/topic-security.png"),
  global: require("../../assets/illustrations/topic-global.png"),
  risk: require("../../assets/illustrations/topic-security.png"),
  competition: require("../../assets/illustrations/topic-strategy.png"),
  disruption: require("../../assets/illustrations/topic-innovation.png"),
  policy: require("../../assets/illustrations/topic-security.png"),
};

function getTopicIllustration(text: string): any | null {
  const lower = (text || "").toLowerCase();
  for (const [keyword, img] of Object.entries(TOPIC_ILLUSTRATIONS)) {
    if (lower.includes(keyword)) return img;
  }
  return require("../../assets/illustrations/topic-innovation.png");
}

function getTopicIcon(text: string): keyof typeof Feather.glyphMap {
  const lower = (text || "").toLowerCase();
  for (const [keyword, icon] of Object.entries(TOPIC_ICONS)) {
    if (lower.includes(keyword)) return icon;
  }
  return "book-open";
}

// ── Rich text renderer with keyword highlights ──────────────────────
function RichText({ text, style }: { text: string; style?: any }) {
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
        </Text>,
      );
    }
    if (match[2]) {
      parts.push(
        <Text key={key++} style={[style, styles.boldHighlight]}>
          {match[2]}
        </Text>,
      );
    } else if (match[3]) {
      parts.push(
        <Text key={key++} style={[style, { fontStyle: "italic" }]}>
          {match[3]}
        </Text>,
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(
      <Text key={key++} style={style}>
        {text.slice(lastIndex)}
      </Text>,
    );
  }

  return <Text>{parts.length > 0 ? parts : <Text style={style}>{text}</Text>}</Text>;
}

// ── Read More toggle for long text ──────────────────────────────────
function ReadMoreText({
  text,
  style,
  maxLines = 8,
  accentColor = COLORS.accent,
}: {
  text: string;
  style?: any;
  maxLines?: number;
  accentColor?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);

  return (
    <View>
      <Text
        style={style}
        numberOfLines={expanded ? undefined : maxLines}
        onTextLayout={(e) => {
          if (e.nativeEvent.lines.length > maxLines) {
            setNeedsTruncation(true);
          }
        }}
      >
        <RichText text={text} style={style} />
      </Text>
      {needsTruncation && (
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={styles.readMoreBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.readMoreText, { color: accentColor }]}>{expanded ? "Show less" : "Read more"}</Text>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={14} color={accentColor} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main ConceptCard ────────────────────────────────────────────────
export function ConceptCard({
  type,
  title,
  content,
  bullets,
  sources,
  keyTerms,
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
  if (type === "header") {
    const icon = getTopicIcon(title || content);
    const illustration = getTopicIllustration(title || content);
    return (
      <Animated.View style={[styles.headerCard, { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }] }]}>
        <View style={[styles.headerAccent, { backgroundColor: accentColor }]} />
        {illustration && <Image source={illustration} style={styles.headerIllustration} />}
        <View style={[styles.headerIconWrap, { backgroundColor: accentColor + "18" }]}>
          <Feather name={icon} size={28} color={accentColor} />
        </View>
        <Text style={styles.headerTitle}>{title || content}</Text>
        <View style={styles.headerCounterWrap}>
          <View style={[styles.counterPill, { backgroundColor: accentColor + "15" }]}>
            <Text style={[styles.headerCounter, { color: accentColor }]}>{cardIndex + 1}</Text>
            <Text style={styles.headerCounterOf}> / {totalCards}</Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  // ── Key Terms card (Beginner Mode) ──────────────────
  if (type === "key-terms" && keyTerms && keyTerms.length > 0) {
    return (
      <Animated.View
        style={[styles.keyTermsCard, { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }] }]}
      >
        <View style={[styles.keyTermsAccent, { backgroundColor: accentColor }]} />
        <View style={styles.keyTermsHeader}>
          <View style={[styles.keyTermsIconWrap, { backgroundColor: accentColor + "15" }]}>
            <Feather name="book" size={18} color={accentColor} />
          </View>
          <Text style={[styles.keyTermsTitle, { color: accentColor }]}>Key Terms</Text>
        </View>
        {title && <Text style={styles.keyTermsSubtitle}>{title}</Text>}
        <ScrollView
          style={{ maxHeight: MAX_CARD_CONTENT_HEIGHT }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {keyTerms.map((item, idx) => (
            <View key={idx} style={[styles.termRow, idx < keyTerms.length - 1 && styles.termRowBorder]}>
              <View style={[styles.termBadge, { backgroundColor: accentColor + "12" }]}>
                <Text style={[styles.termLabel, { color: accentColor }]}>{item.term}</Text>
              </View>
              <Text style={styles.termDefinition}>{item.definition}</Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    );
  }

  // ── Callout card (pull-quote style) ─────────────────
  if (type === "callout") {
    return (
      <Animated.View
        style={[
          styles.calloutCard,
          { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }], borderLeftColor: accentColor },
        ]}
      >
        <Feather name="info" size={18} color={accentColor} style={{ marginBottom: 8 }} />
        <ReadMoreText text={content} style={styles.calloutText} accentColor={accentColor} />
      </Animated.View>
    );
  }

  // ── Key stat card ───────────────────────────────────
  if (type === "key-stat") {
    return (
      <Animated.View style={[styles.keyStatCard, { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }] }]}>
        <View style={[styles.keyStatAccent, { backgroundColor: accentColor }]} />
        <View style={[styles.keyStatIconWrap, { backgroundColor: accentColor + "12" }]}>
          <Feather name="bar-chart-2" size={20} color={accentColor} />
        </View>
        {title && <Text style={[styles.keyStatLabel, { color: accentColor }]}>{title}</Text>}
        <Text style={styles.keyStatValue}>{content}</Text>
      </Animated.View>
    );
  }

  // ── Example card (real-world case) ──────────────────
  if (type === "example") {
    return (
      <Animated.View style={[styles.exampleCard, { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }] }]}>
        <View style={styles.exampleHeader}>
          <View style={[styles.exampleIconWrap, { backgroundColor: accentColor + "12" }]}>
            <Feather name="briefcase" size={16} color={accentColor} />
          </View>
          <Text style={[styles.exampleTag, { color: accentColor }]}>Real-World Example</Text>
        </View>
        {title && <Text style={styles.exampleTitle}>{title}</Text>}
        <ReadMoreText text={content} style={styles.exampleText} accentColor={accentColor} />
      </Animated.View>
    );
  }

  // ── Bullet group card ───────────────────────────────
  if (type === "bullet-group") {
    return (
      <Animated.View style={[styles.card, { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }] }]}>
        {title && (
          <View style={styles.sectionHeader}>
            <Feather name={getTopicIcon(title)} size={16} color={accentColor} />
            <Text style={[styles.sectionTitle, { color: accentColor }]}>{title}</Text>
          </View>
        )}
        <ScrollView
          style={{ maxHeight: MAX_CARD_CONTENT_HEIGHT }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View style={styles.bulletList}>
            {(bullets || []).map((bullet, idx) => (
              <BulletItem key={idx} text={bullet} index={idx} accentColor={accentColor} />
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    );
  }

  // ── Sources card ────────────────────────────────────
  if (type === "sources") {
    return (
      <Animated.View style={[styles.sourcesCard, { opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }] }]}>
        <View style={styles.sourcesHeader}>
          <Feather name="link" size={14} color={COLORS.textMuted} />
          <Text style={styles.sourcesLabel}>Sources</Text>
        </View>
        <View style={styles.sourcesRow}>
          {(sources || []).map((source, idx) => (
            <TouchableOpacity key={idx} style={styles.sourceChip} onPress={() => Linking.openURL(source.url)}>
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
      <ScrollView
        style={{ maxHeight: MAX_CARD_CONTENT_HEIGHT }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <ReadMoreText text={content} style={styles.conceptText} accentColor={accentColor} />
      </ScrollView>
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

// ── Smart content classification ────────────────────
function classifyContent(text: string): "stat" | "example" | "concept" {
  const statPatterns =
    /(\$[\d,.]+[mbk]?|\d+%|\d+\.\d+x|raised \$|revenue of|market (size|cap)|worth \$|valued at|\d+ (billion|million|trillion))/i;
  if (statPatterns.test(text) && text.length < 250) return "stat";

  const examplePatterns =
    /(founded \d{4}|for example|case study|such as [A-Z]|like (Lockheed|Boeing|SpaceX|Tesla|Apple|Google|Amazon|Microsoft|Velo3D|Relativity)|Inc\.|Corp\.|Ltd\.)/i;
  if (examplePatterns.test(text)) return "example";

  return "concept";
}

// ── Acronym / key-term extraction (now uses per-industry data) ──
import { getAcronymsForMarket } from "../../data/industryAcronyms";

/** Max acronyms per key-terms card before auto-splitting */
const KEY_TERMS_PER_CARD = 4;

// ── Story Sequence: break long paragraphs into 3-5 cards ────────────
function breakIntoStorySequence(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const sentences = text.match(/[^.!?]*[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (current.length + trimmed.length + 1 > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = trimmed;
    } else {
      current += (current ? " " : "") + trimmed;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // Cap at 5 story cards max
  if (chunks.length > 5) {
    const merged: string[] = [];
    const perChunk = Math.ceil(chunks.length / 5);
    for (let i = 0; i < chunks.length; i += perChunk) {
      merged.push(chunks.slice(i, i + perChunk).join(" "));
    }
    return merged;
  }

  return chunks;
}

// ── Parser: slide body → concept cards ──────────────
export function parseSlideIntoCards(
  slideTitle: string,
  body: string,
  sources: Source[],
  _slideIndex: number,
  marketId?: string,
): {
  type: ConceptCardType;
  title?: string;
  content: string;
  bullets?: string[];
  sources?: Source[];
  keyTerms?: KeyTerm[];
}[] {
  const cards: {
    type: ConceptCardType;
    title?: string;
    content: string;
    bullets?: string[];
    sources?: Source[];
    keyTerms?: KeyTerm[];
  }[] = [];

  cards.push({ type: "header", content: slideTitle });

  // ── Beginner Mode: Use industry-specific acronyms (NOT text extraction) ──
  const allAcronyms = getAcronymsForMarket(marketId);
  // Only show on first slide of the lesson (_slideIndex === 0)
  if (_slideIndex === 0 && allAcronyms.length > 0) {
    // Auto-split: max KEY_TERMS_PER_CARD per card
    const chunks: KeyTerm[][] = [];
    for (let i = 0; i < allAcronyms.length; i += KEY_TERMS_PER_CARD) {
      chunks.push(allAcronyms.slice(i, i + KEY_TERMS_PER_CARD));
    }
    chunks.forEach((chunk, chunkIdx) => {
      const label = chunks.length > 1
        ? `Words you'll see in this lesson (${chunkIdx + 1}/${chunks.length})`
        : "Words you'll see in this lesson";
      cards.push({
        type: "key-terms",
        title: label,
        content: "",
        keyTerms: chunk,
      });
    });
  }

  const paragraphs = body.split("\n").filter((p) => p.trim());
  let currentBullets: string[] = [];
  let currentHeader: string | undefined;
  let pendingText = "";
  let cardCount = 0;

const MAX_CARD_CHARS = 350; // Lowered for beginner-friendly shorter cards
    const WORD_SPLIT_THRESHOLD = 25; // Auto-split definitions longer than 25 words

  // Split text at sentence boundaries to avoid mid-sentence cutoff
  const splitAtSentence = (text: string, maxLen: number): [string, string] => {
    if (text.length <= maxLen) return [text, ""];
    const sentenceEnders = /[.!?]\s/g;
    let lastGoodBreak = -1;
    let m: RegExpExecArray | null;
    while ((m = sentenceEnders.exec(text)) !== null) {
      if (m.index + m[0].length <= maxLen) {
        lastGoodBreak = m.index + m[0].length;
      } else {
        break;
      }
    }
    if (lastGoodBreak === -1) {
      const lastPeriod = text.lastIndexOf(".", maxLen);
      if (lastPeriod > maxLen * 0.3) lastGoodBreak = lastPeriod + 1;
    }
    if (lastGoodBreak === -1) {
      const lastSpace = text.lastIndexOf(" ", maxLen);
      if (lastSpace > maxLen * 0.3) lastGoodBreak = lastSpace + 1;
      else lastGoodBreak = maxLen;
    }
    return [text.slice(0, lastGoodBreak).trim(), text.slice(lastGoodBreak).trim()];
  };

  // Auto-split helper: splits text >25 words at sentence boundaries into sequenced cards
  const autoSplitLongContent = (text: string, titlePrefix?: string) => {
    const wordCount = text.split(/\s+/).length;
    if (wordCount <= WORD_SPLIT_THRESHOLD) {
      return [{ text, seqLabel: undefined }];
    }
    // Split at sentence boundaries into chunks of ≤25 words
    const sentences = text.match(/[^.!?]*[.!?]+/g) || [text];
    const chunks: string[] = [];
    let current = "";
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      const currentWords = current.split(/\s+/).filter(Boolean).length;
      const sentenceWords = trimmed.split(/\s+/).filter(Boolean).length;
      if (currentWords + sentenceWords > WORD_SPLIT_THRESHOLD && current.length > 0) {
        chunks.push(current.trim());
        current = trimmed;
      } else {
        current += (current ? " " : "") + trimmed;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    // Cap at 5
    const final = chunks.length > 5
      ? (() => { const m: string[] = []; const p = Math.ceil(chunks.length / 5); for (let i = 0; i < chunks.length; i += p) m.push(chunks.slice(i, i + p).join(" ")); return m; })()
      : chunks;
    return final.map((t, i) => ({
      text: t,
      seqLabel: final.length > 1 ? `Card ${i + 1} of ${final.length}` : undefined,
    }));
  };

  const flushText = () => {
    if (pendingText.trim()) {
      let text = pendingText.trim();

      // Story Sequence: break long paragraphs into multiple digestible cards
      const storyChunks = breakIntoStorySequence(text, MAX_CARD_CHARS);

      for (const chunk of storyChunks) {
        let remaining = chunk;
        while (remaining.length > 0) {
          const [piece, rest] = splitAtSentence(remaining, MAX_CARD_CHARS);

          // Apply 25-word auto-split
          const splits = autoSplitLongContent(piece, currentHeader);
          for (const split of splits) {
            const lower = split.text.toLowerCase();
            const isCallout =
              (lower.includes("key takeaway") ||
                lower.includes("important:") ||
                lower.includes("note:") ||
                lower.includes("in summary")) &&
              split.text.length < 300;

            const seqTitle = split.seqLabel
              ? (currentHeader ? `${currentHeader} (${split.seqLabel})` : split.seqLabel)
              : currentHeader;

            if (isCallout) {
              cards.push({ type: "callout", title: seqTitle, content: split.text });
            } else {
              const classification = classifyContent(split.text);
              cards.push({
                type: classification === "stat" ? "key-stat" : classification === "example" ? "example" : "concept",
                title: seqTitle,
                content: split.text,
              });
            }
            cardCount++;
          }
          currentHeader = undefined;
          remaining = rest;
        }
      }

      pendingText = "";
    }
  };

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      flushText();
      cards.push({ type: "bullet-group", title: currentHeader, content: "", bullets: [...currentBullets] });
      currentBullets = [];
      currentHeader = undefined;
      cardCount++;
    }
  };

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*");
    const isHeaderLine = trimmed.startsWith("##") || (trimmed.startsWith("**") && trimmed.endsWith("**"));

    if (isHeaderLine) {
      flushBullets();
      flushText();
      const cleanHeader = trimmed.replace(/^#{1,3}\s*/, "").replace(/\*\*/g, "");
      currentHeader = cleanHeader;
      continue;
    }

    if (isBullet) {
      flushText();
      const cleanBullet = trimmed.replace(/^[•\-*]\s*/, "");
      currentBullets.push(cleanBullet);
      if (currentBullets.length >= 4) flushBullets();
      continue;
    }

    flushBullets();
    pendingText += (pendingText ? "\n\n" : "") + trimmed;
  }

  flushBullets();
  flushText();

  if (sources && sources.length > 0) {
    cards.push({ type: "sources", content: "", sources });
  }

  return cards;
}

// ── Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  /* Base card — flex column, auto height, safe padding */
  card: {
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    padding: 16,
    paddingHorizontal: 18,
    paddingBottom: 48, // pb-12 — clears Next button / home bar
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "column",
    minHeight: 300,
    ...SHADOWS.md,
  },

  /* Header card */
  headerCard: {
    backgroundColor: COLORS.bg1,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 280,
    overflow: "hidden",
    ...SHADOWS.md,
  },
  headerIllustration: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginBottom: 12,
    opacity: 0.85,
  },
  headerAccent: {
    position: "absolute",
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: FLUID.heroTitle,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: FLUID.heroLineHeight,
    color: COLORS.textPrimary,
    textAlign: "center",
    // @ts-ignore — React Native supports textWrap on newer engines
    textWrap: "balance",
  },
  headerCounterWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  counterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerCounter: {
    ...TYPE.overline,
    fontWeight: "700",
  },
  headerCounterOf: {
    ...TYPE.overline,
    color: COLORS.textMuted,
  },

  /* Key Terms card (Beginner Mode) */
  keyTermsCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    padding: 20,
    paddingBottom: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    minHeight: 300,
    ...SHADOWS.md,
  },
  keyTermsAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  keyTermsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  keyTermsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  keyTermsTitle: {
    fontSize: FLUID.cardTitle,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  keyTermsSubtitle: {
    fontSize: FLUID.caption,
    color: COLORS.textMuted,
    marginBottom: 14,
    fontStyle: "italic",
  },
  termRow: {
    paddingVertical: 12,
  },
  termRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  termBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  termLabel: {
    fontSize: FLUID.termLabel,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  termDefinition: {
    fontSize: FLUID.termDef,
    lineHeight: FLUID.termDefLineHeight,
    color: COLORS.textSecondary,
  },

  /* Section headers with icons */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: FLUID.cardTitle,
    fontWeight: "600",
    letterSpacing: 0.3,
    // @ts-ignore
    textWrap: "balance",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },

  /* Concept text — fluid sizing, min 16px for mobile readability */
  conceptText: {
    fontSize: Math.max(16, FLUID.body),
    color: COLORS.textPrimary,
    lineHeight: FLUID.bodyLineHeight,
    letterSpacing: 0.15,
  },
  boldHighlight: {
    fontWeight: "700",
    color: COLORS.accent,
  },

  /* Read more toggle */
  readMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
  },
  readMoreText: {
    fontSize: FLUID.caption,
    fontWeight: "700",
  },

  /* Callout card */
  calloutCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    padding: 20,
    paddingBottom: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    justifyContent: "center",
    flexDirection: "column",
    minHeight: 300,
    ...SHADOWS.sm,
  },
  calloutText: {
    fontSize: Math.max(16, FLUID.body),
    color: COLORS.textPrimary,
    lineHeight: FLUID.bodyLineHeight,
    fontStyle: "italic",
    letterSpacing: 0.1,
  },

  /* Key stat card */
  keyStatCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    padding: 28,
    paddingBottom: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    overflow: "hidden",
    minHeight: 300,
    ...SHADOWS.md,
  },
  keyStatAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  keyStatIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  keyStatLabel: {
    ...TYPE.overline,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  keyStatValue: {
    fontSize: FLUID.stat,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
    lineHeight: FLUID.statLineHeight,
  },

  /* Example card */
  exampleCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    padding: 20,
    paddingBottom: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "column",
    minHeight: 300,
    ...SHADOWS.md,
  },
  exampleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  exampleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  exampleTag: {
    ...TYPE.overline,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  exampleTitle: {
    fontSize: FLUID.cardTitle,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 10,
    // @ts-ignore
    textWrap: "balance",
  },
  exampleText: {
    fontSize: Math.max(16, FLUID.body),
    color: COLORS.textSecondary,
    lineHeight: FLUID.bodyLineHeight,
    letterSpacing: 0.1,
  },

  /* Bullets */
  bulletList: {
    gap: 14,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
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
    fontSize: Math.max(16, FLUID.bullet),
    color: COLORS.textPrimary,
    lineHeight: FLUID.bulletLineHeight,
    flex: 1,
  },

  /* Sources card */
  sourcesCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  sourcesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sourcesLabel: {
    ...TYPE.overline,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sourcesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sourceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.bg1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sourceText: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
});
