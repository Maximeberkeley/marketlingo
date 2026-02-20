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

const MENTOR_IMAGES: Record<string, any> = {
  maya: require('../../assets/mentors/mentor-maya.png'),
  alex: require('../../assets/mentors/mentor-alex.png'),
  kai: require('../../assets/mentors/mentor-kai.png'),
  sophia: require('../../assets/mentors/mentor-sophia.png'),
};
const LEO_STICKER = require('../../assets/leo-sticker.png');

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
  isReview?: boolean;
  marketId?: string;
}

const MINIMUM_LESSON_TIME_SECONDS = 180;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TYPE_CONFIG = {
  LESSON: { color: '#4ADE80', bg: 'rgba(34,197,94,0.15)', label: 'LESSON', emoji: '📚' },
  NEWS:   { color: '#60A5FA', bg: 'rgba(59,130,246,0.15)', label: 'INTEL', emoji: '⚡' },
  HISTORY:{ color: '#FBBF24', bg: 'rgba(245,158,11,0.15)', label: 'HISTORY', emoji: '📜' },
};

// ─────────────────────────────────────────────
// MentorCard shown at key slide positions
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
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const bobY = useRef(new Animated.Value(0)).current;

  const mentorId = marketId ? getPrimaryMentorForMarket(marketId) : 'sophia';
  const mentor = mentors.find((m) => m.id === mentorId) || mentors[0];
  const avatarSrc = MENTOR_IMAGES[mentor.id] || MENTOR_IMAGES.sophia;

  const progress = Math.round(((slideIndex + 1) / totalSlides) * 100);

  const MESSAGES: Record<typeof position, { text: string; sub: string }> = {
    first: { text: `Ready to dive in? 🚀`, sub: mentor.name.split(' ')[0] + ' here to guide you' },
    middle: { text: `${progress}% done, keep it up! 💪`, sub: 'Great momentum — stay focused' },
    last:   { text: `You crushed it! 🎉`, sub: 'Tap to discuss what you learned' },
  };

  const ACCENT: Record<typeof position, string> = {
    first: '#8B5CF6',
    middle: '#F59E0B',
    last: '#22C55E',
  };

  const msg = MESSAGES[position];
  const accent = ACCENT[position];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 260, friction: 20, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bobY, { toValue: -5, duration: 1400, useNativeDriver: true }),
        Animated.timing(bobY, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        mcStyles.card,
        { borderColor: accent + '40', backgroundColor: accent + '10', opacity, transform: [{ translateY }] },
      ]}
    >
      <Animated.Image
        source={avatarSrc}
        style={[mcStyles.avatar, { transform: [{ translateY: bobY }] }]}
      />
      <View style={mcStyles.textBlock}>
        <Text style={[mcStyles.greeting, { color: accent }]}>{msg.text}</Text>
        <Text style={mcStyles.sub}>{msg.sub}</Text>
        {position === 'last' && (
          <TouchableOpacity onPress={onChat} style={[mcStyles.chatBtn, { backgroundColor: accent + '25', borderColor: accent + '60' }]}>
            <Text style={[mcStyles.chatBtnText, { color: accent }]}>💬 Discuss with {mentor.name.split(' ')[0]}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const mcStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    resizeMode: 'cover',
  },
  textBlock: { flex: 1 },
  greeting: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  chatBtn: {
    marginTop: 8,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  chatBtnText: { fontSize: 12, fontWeight: '600' },
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
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showCompletion, setShowCompletion] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpentSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const hasMetMinimumTime = timeSpentSeconds >= MINIMUM_LESSON_TIME_SECONDS;
  const remainingSeconds = Math.max(0, MINIMUM_LESSON_TIME_SECONDS - timeSpentSeconds);
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingSecondsDisplay = remainingSeconds % 60;

  const isIntroSlide = currentIndex === -1;
  const currentSlide = isIntroSlide ? null : slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  const animateSlide = useCallback((direction: 1 | -1, callback: () => void) => {
    slideAnim.setValue(direction * 40);
    Animated.spring(slideAnim, { toValue: 0, tension: 300, friction: 26, useNativeDriver: true }).start();
    callback();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [slideAnim]);

  const goToNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      animateSlide(1, () => setCurrentIndex((prev) => prev + 1));
    }
  }, [currentIndex, slides.length, animateSlide]);

  const goToPrev = useCallback(() => {
    if (currentIndex > -1) {
      animateSlide(-1, () => setCurrentIndex((prev) => prev - 1));
    }
  }, [currentIndex, animateSlide]);

  const cfg = TYPE_CONFIG[stackType];

  // Progress percentage (0–100), -1 index = "intro" = segment 0
  const progressPercent = isIntroSlide ? 0 : ((currentIndex + 1) / slides.length) * 100;

  // Show mentor card at first, midpoint, last slide
  const totalSlides = slides.length;
  const midpoint = Math.floor(totalSlides / 2);
  const mentorPosition: 'first' | 'middle' | 'last' | null =
    currentIndex === 0 ? 'first'
    : currentIndex === midpoint && totalSlides > 3 ? 'middle'
    : currentIndex === totalSlides - 1 ? 'last'
    : null;

  const renderBody = (body: string) => {
    const paragraphs = body.split('\n').filter((p) => p.trim());
    return paragraphs.map((paragraph, idx) => {
      const isBullet = paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-');
      const isHeader = paragraph.trim().startsWith('##') || paragraph.trim().startsWith('**');
      let cleanText = paragraph.trim();
      if (isHeader) {
        cleanText = cleanText.replace(/^#{1,3}\s*/, '').replace(/\*\*/g, '');
      }

      if (isBullet) {
        return (
          <View key={idx} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bodyText}>{cleanText.replace(/^[•\-]\s*/, '')}</Text>
          </View>
        );
      }

      if (isHeader) {
        return (
          <Text key={idx} style={styles.sectionHeader}>{cleanText}</Text>
        );
      }

      return (
        <Text key={idx} style={styles.bodyText}>{cleanText}</Text>
      );
    });
  };

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

          {/* Timer for non-review lessons */}
          {!isReview && stackType === 'LESSON' && !hasMetMinimumTime && !isIntroSlide && (
            <View style={styles.timerPill}>
              <Text style={styles.timerText}>
                ⏱ {remainingMinutes}:{remainingSecondsDisplay.toString().padStart(2, '0')}
              </Text>
            </View>
          )}
          {(isReview || stackType !== 'LESSON' || hasMetMinimumTime) && !isIntroSlide && (
            <Text style={styles.slideCounter}>{currentIndex + 1}/{slides.length}</Text>
          )}
        </View>

        {/* ── PROGRESS BAR ── */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%` as any,
                backgroundColor: cfg.color,
              },
            ]}
          />
        </View>

        {/* ── STACK TITLE ── */}
        <Text style={styles.stackTitle} numberOfLines={2}>{stackTitle}</Text>

        {/* ── SLIDE CONTENT ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {isIntroSlide ? (
            /* INTRO CARD */
            <View style={styles.introCard}>
              <View style={[styles.introIconCircle, { backgroundColor: cfg.bg }]}>
                <Text style={styles.introEmoji}>{cfg.emoji}</Text>
              </View>
              <Text style={styles.introTitle}>{stackTitle}</Text>
              <Text style={styles.introMeta}>
                {slides.length} slides · {stackType === 'LESSON' ? '~5 min' : '~3 min'}
              </Text>

              {/* Market mentor greeting on intro */}
              {marketId && (() => {
                const mentorId = getPrimaryMentorForMarket(marketId);
                const mentor = mentors.find((m) => m.id === mentorId) || mentors[0];
                const avatarSrc = MENTOR_IMAGES[mentor.id] || MENTOR_IMAGES.sophia;
                return (
                  <View style={styles.introMentorRow}>
                    <Image source={avatarSrc} style={styles.introMentorAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.introMentorName}>{mentor.name.split(' ')[0]}</Text>
                      <Text style={styles.introMentorQuote}>"{mentor.greeting}"</Text>
                    </View>
                  </View>
                );
              })()}

              <View style={styles.introTipBox}>
                <Text style={styles.introTipText}>
                  Swipe through each slide at your own pace. Save insights and add notes anytime.
                </Text>
              </View>
            </View>
          ) : (
            /* SLIDE CARD */
            <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
              {/* Mentor card at key positions */}
              {mentorPosition && (
                <MentorCard
                  position={mentorPosition}
                  marketId={marketId}
                  slideIndex={currentIndex}
                  totalSlides={totalSlides}
                  onChat={() => {}} // passed from parent when wired
                />
              )}

              <View style={styles.slideCard}>
                {/* Slide number badge */}
                <View style={styles.slideNumberBadge}>
                  <Text style={[styles.slideNumberText, { color: cfg.color }]}>
                    {currentIndex + 1}
                  </Text>
                </View>

                <Text style={styles.slideTitle}>{currentSlide?.title}</Text>
                <View style={[styles.slideDivider, { backgroundColor: cfg.color + '50' }]} />

                {currentSlide && renderBody(currentSlide.body)}

                {/* Sources */}
                {currentSlide?.sources && currentSlide.sources.length > 0 && (
                  <View style={styles.sourcesContainer}>
                    <Text style={styles.sourcesLabel}>Sources</Text>
                    <View style={styles.sourceChips}>
                      {currentSlide.sources.map((source, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => Linking.openURL(source.url)}
                          style={styles.sourceChip}
                        >
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
            <TouchableOpacity
              onPress={goToPrev}
              style={[styles.navBtn, currentIndex <= 0 && styles.navBtnDisabled]}
              disabled={currentIndex <= 0}
            >
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goToNext}
              style={[styles.navBtn, isLastSlide && styles.navBtnDisabled]}
              disabled={isLastSlide}
            >
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
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => currentSlide && onAddNote(currentSlide.slideNumber)}
                >
                  <Text style={styles.secondaryBtnText}>📝 Note</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => currentSlide && onSaveInsight(currentSlide.slideNumber)}
                >
                  <Text style={styles.secondaryBtnText}>🔖 Save</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.ctaBtn} onPress={() => setShowCompletion(true)}>
                <Text style={styles.ctaBtnText}>✅ Complete</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => currentSlide && onAddNote(currentSlide.slideNumber)}
              >
                <Text style={styles.secondaryBtnText}>📝 Note</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => currentSlide && onSaveInsight(currentSlide.slideNumber)}
              >
                <Text style={styles.secondaryBtnText}>🔖 Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.nextBtn]} onPress={goToNext}>
                <Text style={styles.nextBtnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── COMPLETION MODAL ── */}
        <Modal visible={showCompletion} transparent animationType="fade">
          <View style={styles.completionOverlay}>
            <View style={styles.completionCard}>
              {isReview ? (
                <>
                  <Text style={styles.completionEmoji}>📖</Text>
                  <Text style={styles.completionTitle}>Great review session!</Text>
                  <Text style={styles.completionSub}>Reviewing solidifies your knowledge.</Text>
                  <Text style={styles.completionMuted}>No XP on review — but you're reinforcing expertise!</Text>
                </>
              ) : !hasMetMinimumTime ? (
                <>
                  <Text style={styles.completionEmoji}>⏱️</Text>
                  <Text style={styles.completionTitle}>Take your time!</Text>
                  <Text style={styles.completionSub}>Spend at least 3 minutes to earn XP.</Text>
                  <View style={styles.timerBig}>
                    <Text style={styles.timerBigText}>
                      {remainingMinutes}:{remainingSecondsDisplay.toString().padStart(2, '0')}
                    </Text>
                    <Text style={styles.timerBigLabel}>remaining</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.completionEmoji}>🔥</Text>
                  <Text style={styles.completionTitle}>You're on fire!</Text>
                  <Text style={styles.completionSub}>Lesson complete! Streak building.</Text>
                  <View style={styles.xpBadge}>
                    <Text style={styles.xpBadgeText}>⚡ +50 XP</Text>
                  </View>
                </>
              )}

              <View style={{ gap: 10, width: '100%', marginTop: 20 }}>
                {!isReview && !hasMetMinimumTime ? (
                  <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowCompletion(false)}>
                    <Text style={styles.outlineBtnText}>⏱ Keep Reading</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity style={styles.ctaBtn} onPress={() => onComplete(isReview, timeSpentSeconds)}>
                      <Text style={styles.ctaBtnText}>🔥 Continue</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.outlineBtn} onPress={() => onComplete(isReview, timeSpentSeconds)}>
                      <Text style={styles.outlineBtnText}>🎯 Practice with Drills</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 10,
    gap: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { fontSize: 16, color: COLORS.textSecondary },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  typeEmoji: { fontSize: 12 },
  typeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  timerPill: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(251,191,36,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  timerText: { fontSize: 12, color: '#FBBF24', fontWeight: '600' },
  slideCounter: {
    marginLeft: 'auto',
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  // Progress bar
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  stackTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 4,
    lineHeight: 28,
  },

  contentScroll: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },

  // Intro
  introCard: { alignItems: 'center', paddingVertical: 20 },
  introIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  introEmoji: { fontSize: 34 },
  introTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  introMeta: { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },
  introMentorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    padding: 14,
    marginBottom: 16,
    width: '100%',
  },
  introMentorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    resizeMode: 'cover',
  },
  introMentorName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  introMentorQuote: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17, marginTop: 2 },
  introTipBox: {
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    width: '100%',
  },
  introTipText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, textAlign: 'center' },

  // Slide card
  slideCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slideNumberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 12,
  },
  slideNumberText: { fontSize: 11, fontWeight: '700' },
  slideTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 28,
    marginBottom: 14,
  },
  slideDivider: {
    height: 2,
    borderRadius: 1,
    marginBottom: 18,
    width: 40,
  },
  bodyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 26,
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginTop: 10,
    flexShrink: 0,
  },
  sourcesContainer: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sourcesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sourceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sourceChip: {
    backgroundColor: COLORS.bg1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  sourceChipText: { fontSize: 11, color: COLORS.textMuted },

  // Nav arrows
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navBtnDisabled: { opacity: 0.2 },
  navBtnText: { fontSize: 26, color: COLORS.textPrimary, fontWeight: '300', lineHeight: 30 },

  // Bottom actions
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  secondaryBtn: {
    flex: 1,
    height: 46,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  nextBtn: {
    flex: 1.5,
    height: 46,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  ctaBtn: {
    height: 52,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  outlineBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  outlineBtnText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },

  // Completion modal
  completionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8,11,24,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completionCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    alignItems: 'center',
  },
  completionEmoji: { fontSize: 52, marginBottom: 14 },
  completionTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 6 },
  completionSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 8 },
  completionMuted: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
  xpBadge: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  xpBadgeText: { fontSize: 18, fontWeight: '800', color: COLORS.accent },
  timerBig: { alignItems: 'center', marginTop: 10 },
  timerBigText: { fontSize: 36, fontWeight: '800', color: '#FBBF24' },
  timerBigLabel: { fontSize: 12, color: COLORS.textMuted },
});
