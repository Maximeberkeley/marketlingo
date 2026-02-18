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
} from 'react-native';
import { COLORS } from '../../lib/constants';

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
}

const MINIMUM_LESSON_TIME_SECONDS = 180;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const typeColors = {
  NEWS: { bg: 'rgba(59, 130, 246, 0.2)', text: '#60A5FA' },
  HISTORY: { bg: 'rgba(245, 158, 11, 0.2)', text: '#FBBF24' },
  LESSON: { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ADE80' },
};

export function SlideReader({
  stackTitle,
  stackType,
  slides,
  onClose,
  onComplete,
  onSaveInsight,
  onAddNote,
  isReview = false,
}: SlideReaderProps) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showCompletion, setShowCompletion] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

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

  const goToNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [currentIndex, slides.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > -1) {
      setCurrentIndex((prev) => prev - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [currentIndex]);

  const colors = typeColors[stackType];

  const renderProgressDots = () => (
    <View style={styles.progressContainer}>
      <View style={[styles.progressDot, styles.progressDotSmall, currentIndex >= -1 && styles.progressDotActive]} />
      {slides.map((_, index) => (
        <View
          key={index}
          style={[styles.progressDot, index <= currentIndex && styles.progressDotActive]}
        />
      ))}
    </View>
  );

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
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bodyText}>{cleanText.replace(/^[•\-]\s*/, '')}</Text>
          </View>
        );
      }

      if (isHeader) {
        return (
          <Text key={idx} style={styles.sectionHeader}>
            {cleanText}
          </Text>
        );
      }

      return (
        <Text key={idx} style={styles.bodyText}>
          {cleanText}
        </Text>
      );
    });
  };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={[styles.typeBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.typeBadgeText, { color: colors.text }]}>{stackType}</Text>
            </View>
            <Text style={styles.slideCounter}>
              {isIntroSlide ? 'Intro' : `${currentIndex + 1}/${slides.length}`}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {renderProgressDots()}

        <Text style={styles.stackTitle}>{stackTitle}</Text>

        {/* Slide Content */}
        <ScrollView
          ref={scrollRef}
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {isIntroSlide ? (
            <View style={styles.introCard}>
              <Text style={styles.introEmoji}>📚</Text>
              <Text style={styles.introTitle}>{stackTitle}</Text>
              <Text style={styles.introSubtitle}>
                {slides.length} slides • {stackType === 'LESSON' ? '~5 min read' : '~3 min read'}
              </Text>
              <View style={styles.introInfo}>
                <Text style={styles.introInfoText}>
                  Swipe through the slides or use the navigation buttons below. You can save insights and take notes on any slide.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.slideCard}>
              <Text style={styles.slideTitle}>{currentSlide?.title}</Text>
              <View style={styles.slideDivider} />
              {currentSlide && renderBody(currentSlide.body)}
              {currentSlide?.sources && currentSlide.sources.length > 0 && (
                <View style={styles.sourcesContainer}>
                  <Text style={styles.sourcesLabel}>Sources</Text>
                  {currentSlide.sources.map((source, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => Linking.openURL(source.url)}
                    >
                      <Text style={styles.sourceLink}>{source.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Navigation Arrows */}
        {!isIntroSlide && (
          <View style={styles.navArrows}>
            <TouchableOpacity
              onPress={goToPrev}
              style={[styles.navButton, currentIndex <= 0 && styles.navButtonHidden]}
              disabled={currentIndex <= 0}
            >
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goToNext}
              style={[styles.navButton, isLastSlide && styles.navButtonHidden]}
              disabled={isLastSlide}
            >
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {isIntroSlide ? (
            <TouchableOpacity style={styles.ctaButton} onPress={goToNext}>
              <Text style={styles.ctaButtonText}>Begin</Text>
            </TouchableOpacity>
          ) : isLastSlide ? (
            <View style={{ gap: 8 }}>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => currentSlide && onAddNote(currentSlide.slideNumber)}
                >
                  <Text style={styles.secondaryButtonText}>📝 Note</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => currentSlide && onSaveInsight(currentSlide.slideNumber)}
                >
                  <Text style={styles.secondaryButtonText}>🔖 Save</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.ctaButton} onPress={() => setShowCompletion(true)}>
                <Text style={styles.ctaButtonText}>✅ Complete Stack</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => currentSlide && onAddNote(currentSlide.slideNumber)}
              >
                <Text style={styles.secondaryButtonText}>📝 Note</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => currentSlide && onSaveInsight(currentSlide.slideNumber)}
              >
                <Text style={styles.secondaryButtonText}>🔖 Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Completion Modal */}
        <Modal visible={showCompletion} transparent animationType="fade">
          <View style={styles.completionOverlay}>
            <View style={styles.completionCard}>
              {isReview ? (
                <>
                  <Text style={styles.completionEmoji}>📖</Text>
                  <Text style={styles.completionTitle}>Great review session!</Text>
                  <Text style={styles.completionSubtitle}>Reviewing helps solidify your knowledge.</Text>
                  <Text style={styles.completionMuted}>No XP on review, but you're reinforcing what you learned!</Text>
                </>
              ) : !hasMetMinimumTime ? (
                <>
                  <Text style={styles.completionEmoji}>⏱️</Text>
                  <Text style={styles.completionTitle}>Take your time!</Text>
                  <Text style={styles.completionSubtitle}>Spend at least 3 minutes to complete this lesson.</Text>
                  <Text style={styles.timerText}>
                    {remainingMinutes}:{remainingSecondsDisplay.toString().padStart(2, '0')} remaining
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.completionEmoji}>🔥</Text>
                  <Text style={styles.completionTitle}>You're on fire!</Text>
                  <Text style={styles.completionSubtitle}>Lesson complete! Your streak is building.</Text>
                  <Text style={styles.xpEarned}>⚡ +50 XP earned</Text>
                  <Text style={styles.completionMuted}>Try some drills to reinforce what you've learned.</Text>
                </>
              )}

              <View style={{ gap: 10, width: '100%', marginTop: 20 }}>
                {!isReview && !hasMetMinimumTime ? (
                  <TouchableOpacity
                    style={styles.secondaryFullButton}
                    onPress={() => setShowCompletion(false)}
                  >
                    <Text style={styles.secondaryFullButtonText}>⏱ Keep Reading</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.ctaButton}
                      onPress={() => onComplete(isReview, timeSpentSeconds)}
                    >
                      <Text style={styles.ctaButtonText}>🔥 Continue</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryFullButton}
                      onPress={() => onComplete(isReview, timeSpentSeconds)}
                    >
                      <Text style={styles.secondaryFullButtonText}>🎯 Practice with Drills</Text>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.bg0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  slideCounter: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  progressDot: {
    height: 3,
    flex: 1,
    borderRadius: 2,
    backgroundColor: COLORS.bg2,
  },
  progressDotSmall: {
    width: 16,
    flex: 0,
  },
  progressDotActive: {
    backgroundColor: COLORS.accent,
  },
  stackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  introCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  introEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 24,
  },
  introInfo: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  introInfoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  slideCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  slideDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: 12,
    flex: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    paddingLeft: 8,
    marginBottom: 8,
    gap: 8,
  },
  bulletDot: {
    fontSize: 15,
    color: COLORS.accent,
    lineHeight: 24,
  },
  sourcesContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sourcesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sourceLink: {
    fontSize: 13,
    color: COLORS.accent,
    marginBottom: 4,
    textDecorationLine: 'underline',
  },
  navArrows: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonHidden: {
    opacity: 0,
  },
  navButtonText: {
    fontSize: 24,
    color: COLORS.textMuted,
    marginTop: -2,
  },
  bottomActions: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ctaButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.bg2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  secondaryFullButton: {
    backgroundColor: COLORS.bg2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryFullButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  completionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 16, 32, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completionCard: {
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    width: '100%',
  },
  completionEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  completionMuted: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  xpEarned: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4ADE80',
    marginVertical: 4,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FBBF24',
    marginTop: 8,
  },
});
