import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  Linking,
  Image,
} from 'react-native';
import { COLORS } from '../../lib/constants';
import { mentors } from '../../data/mentors';
import { getPrimaryMentorForMarket } from '../../data/marketConfig';
import { SlideIntroCard } from './SlideIntroCard';

const MENTOR_IMAGES: Record<string, any> = {
  maya: require('../../assets/mentors/mentor-maya.png'),
  alex: require('../../assets/mentors/mentor-alex.png'),
  kai: require('../../assets/mentors/mentor-kai.png'),
  sophia: require('../../assets/mentors/mentor-sophia.png'),
};

interface Source {
  label: string;
  url: string;
}

interface SlideData {
  slideNumber: number;
  title: string;
  body: string;
  sources: Source[];
}

interface SlideReaderProps {
  stackTitle: string;
  stackType: 'NEWS' | 'HISTORY' | 'LESSON';
  slides: SlideData[];
  onClose: () => void;
  onComplete: (isReview: boolean, timeSpentSeconds: number) => void;
  onSaveInsight: (slideNumber: number) => void;
  onAddNote: (slideNumber: number) => void;
  marketId?: string;
  isReview?: boolean;
}

const MINIMUM_LESSON_TIME_SECONDS = 180;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TYPE_CONFIG = {
  LESSON: { color: '#4ADE80', bg: 'rgba(34,197,94,0.15)', label: 'LESSON', emoji: '📚' },
  NEWS:   { color: '#60A5FA', bg: 'rgba(59,130,246,0.15)', label: 'INTEL', emoji: '⚡' },
  HISTORY:{ color: '#FBBF24', bg: 'rgba(245,158,11,0.15)', label: 'HISTORY', emoji: '📜' },
};

// ─────────────────────────────────────────────
// Mentor card — shown at first / middle / last slide
// ─────────────────────────────────────────────
function MentorCard({
  position,
  marketId,
  slideIndex,
  totalSlides,
  onChat,
}: {
  position: 'first' | 'middle' | 'last';
  marketId?: string;
  slideIndex: number;
  totalSlides: number;
  onChat: () => void;
}) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const bobY      = useRef(new Animated.Value(0)).current;

  const mentorId  = marketId ? getPrimaryMentorForMarket(marketId) : 'sophia';
  const mentor    = mentors.find((m) => m.id === mentorId) || mentors[0];
  const avatarSrc = MENTOR_IMAGES[mentor.id] || MENTOR_IMAGES.sophia;
  const progress  = Math.round(((slideIndex + 1) / totalSlides) * 100);
  const firstName = mentor.name.split(' ')[0];

  const MESSAGES: Record<typeof position, { text: string; sub: string }> = {
    first:  { text: `Ready to dive in? 🚀`, sub: `${firstName} here to guide you` },
    middle: { text: `${progress}% done — keep it up! 💪`, sub: 'Great momentum — stay focused' },
    last:   { text: `You crushed it! 🎉`, sub: 'Tap to discuss what you learned' },
  };

  const ACCENT: Record<typeof position, string> = {
    first: '#8B5CF6',
    middle: '#F59E0B',
    last: '#22C55E',
  };

  const msg    = MESSAGES[position];
  const accent = ACCENT[position];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 260, friction: 20, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobY, { toValue: -6, duration: 1400, useNativeDriver: true }),
        Animated.timing(bobY, { toValue: 0,  duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[mcStyles.card, { borderColor: accent + '40', backgroundColor: accent + '10', opacity, transform: [{ translateY }] }]}>
      <Animated.Image source={avatarSrc} style={[mcStyles.avatar, { borderColor: accent + '60', transform: [{ translateY: bobY }] }]} />
      <View style={mcStyles.textBlock}>
        <Text style={[mcStyles.greeting, { color: accent }]}>{msg.text}</Text>
        <Text style={mcStyles.sub}>{msg.sub}</Text>
        {position === 'last' && (
          <TouchableOpacity onPress={onChat} style={[mcStyles.chatBtn, { backgroundColor: accent + '25', borderColor: accent + '60' }]}>
            <Text style={[mcStyles.chatBtnText, { color: accent }]}>💬 Discuss with {firstName}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const mcStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 14, borderWidth: 1, marginBottom: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, resizeMode: 'cover' },
  textBlock: { flex: 1 },
  greeting: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  chatBtn: { marginTop: 8, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start' },
  chatBtnText: { fontSize: 12, fontWeight: '600' },
});

// ─────────────────────────────────────────────
// Proactive tip bubble (parity with web)
// ─────────────────────────────────────────────
const PROACTIVE_TIPS = [
  { slideIndex: 1, text: 'Try to connect this concept to a company you know.' },
  { slideIndex: 2, text: 'Notice the pattern here — it shows up across markets.' },
  { slideIndex: 3, text: 'This is often asked in analyst interviews. Note it!' },
  { slideIndex: 4, text: 'Consider how a startup could disrupt this dynamic.' },
];

function TipBubble({ tip, marketId, onDismiss }: { tip: string; marketId?: string; onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  const mentorId  = marketId ? getPrimaryMentorForMarket(marketId) : 'sophia';
  const mentor    = mentors.find((m) => m.id === mentorId) || mentors[0];
  const avatarSrc = MENTOR_IMAGES[mentor.id] || MENTOR_IMAGES.sophia;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 240, friction: 20, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[tipStyles.bubble, { opacity, transform: [{ translateY }] }]}>
      <Image source={avatarSrc} style={tipStyles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={tipStyles.mentorName}>{mentor.name.split(' ')[0]}</Text>
        <Text style={tipStyles.tipText}>{tip}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} style={tipStyles.dismissBtn}>
        <Text style={tipStyles.dismissText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const tipStyles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    padding: 12,
    marginBottom: 12,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, resizeMode: 'cover', borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)' },
  mentorName: { fontSize: 11, fontWeight: '700', color: '#8B5CF6', marginBottom: 2 },
  tipText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  dismissBtn: { padding: 4 },
  dismissText: { fontSize: 13, color: COLORS.textMuted },
});

// ─────────────────────────────────────────────
// Body renderer — handles bullets, headers, paragraphs
// ─────────────────────────────────────────────
function renderBody(body: string) {
  const paragraphs = body.split('\n').filter((p) => p.trim());
  return paragraphs.map((paragraph, idx) => {
    const isBullet = paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-');
    const isHeader = paragraph.trim().startsWith('##') || paragraph.trim().startsWith('**');
    let cleanText = paragraph.trim();
    if (isHeader) cleanText = cleanText.replace(/^#{1,3}\s*/, '').replace(/\*\*/g, '');

    if (isBullet) {
      return (
        <View key={idx} style={bodyStyles.bulletRow}>
          <View style={bodyStyles.bulletDot} />
          <Text style={bodyStyles.bodyText}>{cleanText.replace(/^[•\-]\s*/, '')}</Text>
        </View>
      );
    }
    if (isHeader) {
      return <Text key={idx} style={bodyStyles.sectionHeader}>{cleanText}</Text>;
    }
    return <Text key={idx} style={bodyStyles.bodyText}>{cleanText}</Text>;
  });
}

const bodyStyles = StyleSheet.create({
  bodyText: {
    fontSize: 17,
    color: COLORS.textSecondary,
    lineHeight: 28,
    marginBottom: 16,
    letterSpacing: 0.1,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 10,
  },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent, marginTop: 11, flexShrink: 0 },
});

// ─────────────────────────────────────────────
// Completion modal
// ─────────────────────────────────────────────
function CompletionModal({
  isReview,
  hasMetMinimumTime,
  remainingMinutes,
  remainingSecondsDisplay,
  marketId,
  onComplete,
  onClose,
  timeSpentSeconds,
}: {
  isReview: boolean;
  hasMetMinimumTime: boolean;
  remainingMinutes: number;
  remainingSecondsDisplay: number;
  marketId?: string;
  onComplete: () => void;
  onClose: () => void;
  timeSpentSeconds: number;
}) {
  const scale   = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const avatarY = useRef(new Animated.Value(0)).current;

  const mentorId  = marketId ? getPrimaryMentorForMarket(marketId) : 'sophia';
  const mentor    = mentors.find((m) => m.id === mentorId) || mentors[0];
  const avatarSrc = MENTOR_IMAGES[mentor.id] || MENTOR_IMAGES.sophia;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,  { toValue: 1, tension: 280, friction: 20, useNativeDriver: true }),
      Animated.timing(opacity,{ toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    // Bouncy avatar
    Animated.sequence([
      Animated.spring(avatarY, { toValue: -14, tension: 200, friction: 8, useNativeDriver: true }),
      Animated.spring(avatarY, { toValue: -8,  tension: 200, friction: 8, useNativeDriver: true }),
      Animated.spring(avatarY, { toValue: 0,   tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[cStyles.overlay]}>
      <Animated.View style={[cStyles.card, { transform: [{ scale }], opacity }]}>
        {/* Mentor avatar — pops up from top like web */}
        <Animated.Image
          source={avatarSrc}
          style={[cStyles.mentorAvatar, { transform: [{ translateY: avatarY }] }]}
        />
        <Text style={cStyles.mentorName}>{mentor.name}</Text>

        {isReview ? (
          <>
            <Text style={cStyles.emoji}>📖</Text>
            <Text style={cStyles.title}>Great review session!</Text>
            <Text style={cStyles.sub}>Reviewing solidifies your knowledge.</Text>
            <Text style={cStyles.muted}>No XP on review — but you're reinforcing expertise!</Text>
          </>
        ) : !hasMetMinimumTime ? (
          <>
            <Text style={cStyles.emoji}>⏱️</Text>
            <Text style={cStyles.title}>Take your time!</Text>
            <Text style={cStyles.sub}>Spend at least 3 minutes to earn XP.</Text>
            <View style={cStyles.timerBig}>
              <Text style={cStyles.timerBigText}>
                {remainingMinutes}:{remainingSecondsDisplay.toString().padStart(2, '0')}
              </Text>
              <Text style={cStyles.timerLabel}>remaining</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={cStyles.emoji}>🔥</Text>
            <Text style={cStyles.title}>You're on fire!</Text>
            <Text style={cStyles.sub}>Lesson complete! Your streak is building.</Text>
            <View style={cStyles.xpBadge}>
              <Text style={cStyles.xpText}>⚡ +50 XP earned</Text>
            </View>
          </>
        )}

        <View style={cStyles.btnGroup}>
          {!isReview && !hasMetMinimumTime ? (
            <TouchableOpacity style={cStyles.outlineBtn} onPress={onClose}>
              <Text style={cStyles.outlineBtnText}>⏱ Keep Reading</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={cStyles.ctaBtn} onPress={onComplete}>
                <Text style={cStyles.ctaBtnText}>🔥 Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity style={cStyles.outlineBtn} onPress={onComplete}>
                <Text style={cStyles.outlineBtnText}>🎯 Practice with Drills</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const cStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(8,11,24,0.94)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: COLORS.bg2, borderRadius: 28, padding: 28, borderWidth: 1, borderColor: COLORS.border, width: '100%', alignItems: 'center' },
  mentorAvatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: COLORS.bg2, resizeMode: 'cover', marginTop: -56, marginBottom: 6, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
  mentorName: { fontSize: 12, fontWeight: '600', color: COLORS.accent, marginBottom: 6 },
  emoji: { fontSize: 44, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 8 },
  muted: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
  timerBig: { alignItems: 'center', marginTop: 8 },
  timerBigText: { fontSize: 36, fontWeight: '800', color: '#FBBF24' },
  timerLabel: { fontSize: 12, color: COLORS.textMuted },
  xpBadge: { backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  xpText: { fontSize: 17, fontWeight: '800', color: COLORS.accent },
  btnGroup: { gap: 10, width: '100%', marginTop: 20 },
  ctaBtn: { height: 52, backgroundColor: COLORS.accent, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
  ctaBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  outlineBtn: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  outlineBtnText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
});

// ─────────────────────────────────────────────
// Main SlideReader
// ─────────────────────────────────────────────
export function SlideReader({
  stackTitle,
  stackType,
  slides,
  onClose,
  onComplete,
  onSaveInsight,
  onAddNote,
  isReview = false,
  marketId,
}: SlideReaderProps) {
  const [currentIndex, setCurrentIndex]     = useState(-1);
  const [showCompletion, setShowCompletion] = useState(false);
  const [activeTip, setActiveTip]           = useState<string | null>(null);
  const [shownTipIndices, setShownTipIndices] = useState<Set<number>>(new Set());
  const [startTime]                         = useState(() => Date.now());
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setTimeSpentSeconds(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const hasMetMinimumTime       = timeSpentSeconds >= MINIMUM_LESSON_TIME_SECONDS;
  const remainingSeconds        = Math.max(0, MINIMUM_LESSON_TIME_SECONDS - timeSpentSeconds);
  const remainingMinutes        = Math.floor(remainingSeconds / 60);
  const remainingSecondsDisplay = remainingSeconds % 60;

  const isIntroSlide = currentIndex === -1;
  const currentSlide = isIntroSlide ? null : slides[currentIndex];
  const isLastSlide  = currentIndex === slides.length - 1;

  // Proactive tips — shown 2s after landing on specific slides
  useEffect(() => {
    if (isIntroSlide) return;
    const tip = PROACTIVE_TIPS.find((t) => t.slideIndex === currentIndex && !shownTipIndices.has(currentIndex));
    if (!tip) return;
    const timer = setTimeout(() => {
      setActiveTip(tip.text);
      setShownTipIndices((prev) => new Set(prev).add(currentIndex));
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentIndex, isIntroSlide]);

  const animateSlide = useCallback((direction: 1 | -1, callback: () => void) => {
    slideAnim.setValue(direction * 36);
    Animated.spring(slideAnim, { toValue: 0, tension: 300, friction: 26, useNativeDriver: true }).start();
    callback();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setActiveTip(null); // clear tip on navigation
  }, [slideAnim]);

  const goToNext = useCallback(() => {
    if (currentIndex < slides.length - 1) animateSlide(1, () => setCurrentIndex((prev) => prev + 1));
  }, [currentIndex, slides.length, animateSlide]);

  const goToPrev = useCallback(() => {
    if (currentIndex > -1) animateSlide(-1, () => setCurrentIndex((prev) => prev - 1));
  }, [currentIndex, animateSlide]);

  const cfg = TYPE_CONFIG[stackType];
  const progressPercent = isIntroSlide ? 0 : ((currentIndex + 1) / slides.length) * 100;

  const totalSlides = slides.length;
  const midpoint    = Math.floor(totalSlides / 2);
  const mentorPosition: 'first' | 'middle' | 'last' | null =
    currentIndex === 0             ? 'first'
    : currentIndex === midpoint && totalSlides > 3 ? 'middle'
    : currentIndex === totalSlides - 1             ? 'last'
    : null;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>

        {/* ── TOP BAR ── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          <View style={[styles.typePill, { backgroundColor: cfg.bg }]}>
            <Text style={styles.typeEmoji}>{cfg.emoji}</Text>
            <Text style={[styles.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>

          {!isReview && stackType === 'LESSON' && !hasMetMinimumTime && !isIntroSlide && (
            <View style={styles.timerPill}>
              <Text style={styles.timerText}>⏱ {remainingMinutes}:{remainingSecondsDisplay.toString().padStart(2, '0')}</Text>
            </View>
          )}
          {!isIntroSlide && (isReview || stackType !== 'LESSON' || hasMetMinimumTime) && (
            <Text style={styles.slideCounter}>{currentIndex + 1}/{slides.length}</Text>
          )}
        </View>

        {/* ── PROGRESS BAR (segmented, like web) ── */}
        <View style={styles.progressRow}>
          {/* Intro dot */}
          <View style={[styles.progressDot, { backgroundColor: currentIndex >= -1 ? cfg.color : COLORS.border }]} />
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressSegment,
                { backgroundColor: idx <= currentIndex ? cfg.color : 'rgba(255,255,255,0.08)' },
              ]}
            />
          ))}
        </View>

        {/* ── STACK TITLE ── */}
        <Text style={styles.stackTitle} numberOfLines={2}>{stackTitle}</Text>

        {/* ── SLIDE CONTENT ── */}
        <ScrollView ref={scrollRef} style={styles.contentScroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {isIntroSlide ? (
            /* Use the proper SlideIntroCard — identical to web */
            <SlideIntroCard
              stackTitle={stackTitle}
              stackType={stackType}
              totalSlides={slides.length}
              marketId={marketId}
            />
          ) : (
            <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
              {/* Mentor card at key positions */}
              {mentorPosition && (
                <MentorCard
                  position={mentorPosition}
                  marketId={marketId}
                  slideIndex={currentIndex}
                  totalSlides={totalSlides}
                  onChat={() => {}}
                />
              )}

              {/* Proactive tip bubble */}
              {activeTip && (
                <TipBubble tip={activeTip} marketId={marketId} onDismiss={() => setActiveTip(null)} />
              )}

              {/* Main slide card */}
              <View style={styles.slideCard}>
                {/* Slide number badge with type color */}
                <View style={[styles.slideNumberBadge, { backgroundColor: cfg.color + '18' }]}>
                  <Text style={[styles.slideNumberText, { color: cfg.color }]}>Slide {currentIndex + 1}</Text>
                </View>

                {/* Slide title — large & bold */}
                <Text style={styles.slideTitle}>{currentSlide?.title}</Text>

                {/* Accent divider line */}
                <View style={[styles.slideDivider, { backgroundColor: cfg.color + '60' }]} />

                {/* Body content */}
                {currentSlide && renderBody(currentSlide.body)}

                {/* Sources */}
                {currentSlide?.sources && currentSlide.sources.length > 0 && (
                  <View style={styles.sourcesContainer}>
                    <Text style={styles.sourcesLabel}>Sources</Text>
                    <View style={styles.sourceChips}>
                      {currentSlide.sources.map((source, idx) => (
                        <TouchableOpacity key={idx} onPress={() => Linking.openURL(source.url)} style={styles.sourceChip}>
                          <Text style={styles.sourceChipText}>{source.label} ↗</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* ── NAVIGATION ARROWS ── */}
        {!isIntroSlide && (
          <View style={styles.navRow}>
            <TouchableOpacity onPress={goToPrev} style={[styles.navBtn, currentIndex <= 0 && styles.navBtnDisabled]} disabled={currentIndex <= 0}>
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToNext} style={[styles.navBtn, isLastSlide && styles.navBtnDisabled]} disabled={isLastSlide}>
              <Text style={styles.navBtnText}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── BOTTOM ACTIONS ── */}
        <View style={styles.bottomBar}>
          {isIntroSlide ? (
            <TouchableOpacity style={styles.ctaBtn} onPress={goToNext}>
              <Text style={styles.ctaBtnText}>Begin →</Text>
            </TouchableOpacity>
          ) : isLastSlide ? (
            <View style={{ gap: 8 }}>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => currentSlide && onAddNote(currentSlide.slideNumber)}>
                  <Text style={styles.secondaryBtnText}>📝 Note</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => currentSlide && onSaveInsight(currentSlide.slideNumber)}>
                  <Text style={styles.secondaryBtnText}>🔖 Save</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.ctaBtn} onPress={() => setShowCompletion(true)}>
                <Text style={styles.ctaBtnText}>✅ Complete Stack</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => currentSlide && onAddNote(currentSlide.slideNumber)}>
                <Text style={styles.secondaryBtnText}>📝 Note</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => currentSlide && onSaveInsight(currentSlide.slideNumber)}>
                <Text style={styles.secondaryBtnText}>🔖 Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={goToNext}>
                <Text style={styles.nextBtnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── COMPLETION MODAL ── */}
        <Modal visible={showCompletion} transparent animationType="fade">
          <CompletionModal
            isReview={isReview}
            hasMetMinimumTime={hasMetMinimumTime}
            remainingMinutes={remainingMinutes}
            remainingSecondsDisplay={remainingSecondsDisplay}
            marketId={marketId}
            onComplete={() => { setShowCompletion(false); onComplete(isReview, timeSpentSeconds); }}
            onClose={() => setShowCompletion(false)}
            timeSpentSeconds={timeSpentSeconds}
          />
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 10, gap: 10 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  closeIcon: { fontSize: 16, color: COLORS.textSecondary },
  typePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  typeEmoji: { fontSize: 12 },
  typeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  timerPill: { marginLeft: 'auto', backgroundColor: 'rgba(251,191,36,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  timerText: { fontSize: 12, color: '#FBBF24', fontWeight: '600' },
  slideCounter: { marginLeft: 'auto', fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },

  // Progress — segmented like web
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 3, marginBottom: 12 },
  progressDot: { width: 14, height: 4, borderRadius: 2 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },

  stackTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, paddingHorizontal: 16, marginBottom: 4, lineHeight: 28 },

  contentScroll: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },

  // Slide card
  slideCard: { backgroundColor: COLORS.bg2, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: COLORS.border },
  slideNumberBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14 },
  slideNumberText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  slideTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, lineHeight: 30, marginBottom: 14 },
  slideDivider: { height: 2, borderRadius: 1, marginBottom: 20, width: 44 },

  // Sources
  sourcesContainer: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.border },
  sourcesLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  sourceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sourceChip: { backgroundColor: COLORS.bg1, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 5 },
  sourceChipText: { fontSize: 11, color: COLORS.textMuted },

  // Nav arrows
  navRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 6 },
  navBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  navBtnDisabled: { opacity: 0.18 },
  navBtnText: { fontSize: 26, color: COLORS.textPrimary, fontWeight: '300', lineHeight: 30 },

  // Bottom actions
  bottomBar: { paddingHorizontal: 16, paddingBottom: 36, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  secondaryBtn: { flex: 1, height: 46, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  nextBtn: { flex: 1.5, height: 46, backgroundColor: COLORS.accent, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  ctaBtn: { height: 52, backgroundColor: COLORS.accent, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
  ctaBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
