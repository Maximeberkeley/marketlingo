import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { COLORS } from '../../lib/constants';

interface MentorDebriefProps {
  /** Mentor display name */
  mentorName: string;
  /** Mentor emoji */
  mentorEmoji: string;
  /** Mentor avatar image source (require()) */
  mentorImage: any;
  /** Title of the lesson just completed */
  lessonTitle: string;
  /** A contextual question the mentor "asks" about today's lesson */
  debriefQuestion: string;
  /** Open the mentor chat overlay */
  onOpenChat: () => void;
  /** Dismiss the card */
  onDismiss: () => void;
}

// Contextual debrief questions based on lesson keywords
const DEBRIEF_QUESTIONS = [
  "What surprised you most about today's lesson?",
  "How would you explain today's topic to a friend?",
  "What's one thing from today you'd want to dig deeper on?",
  "Can you think of a real-world example of what we covered?",
  "What would you do differently knowing what you learned today?",
  "How does today's lesson connect to what you learned yesterday?",
  "What's the biggest takeaway you'll remember from this?",
];

export function getDebriefQuestion(lessonTitle: string): string {
  // Simple hash to pick a consistent question per lesson
  let hash = 0;
  for (let i = 0; i < lessonTitle.length; i++) {
    hash = ((hash << 5) - hash) + lessonTitle.charCodeAt(i);
    hash |= 0;
  }
  return DEBRIEF_QUESTIONS[Math.abs(hash) % DEBRIEF_QUESTIONS.length];
}

export function MentorDebrief({
  mentorName,
  mentorEmoji,
  mentorImage,
  lessonTitle,
  debriefQuestion,
  onOpenChat,
  onDismiss,
}: MentorDebriefProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle pulse on the chat button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Dismiss */}
      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>

      {/* Mentor row */}
      <View style={styles.mentorRow}>
        <View style={styles.avatarContainer}>
          <Image source={mentorImage} style={styles.avatarImage} resizeMode="cover" />
          <View style={styles.onlineDot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.mentorLabel}>{mentorEmoji} {mentorName} wants to debrief</Text>
          <Text style={styles.lessonRef}>Re: "{lessonTitle}"</Text>
        </View>
      </View>

      {/* Debrief question bubble */}
      <View style={styles.questionBubble}>
        <Text style={styles.questionText}>"{debriefQuestion}"</Text>
      </View>

      {/* CTA */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity style={styles.chatBtn} onPress={onOpenChat} activeOpacity={0.8}>
          <Text style={styles.chatBtnText}>Discuss with {mentorName.split(' ')[0]} →</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg2,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  dismissBtn: {
    position: 'absolute',
    top: 10,
    right: 12,
    zIndex: 2,
  },
  dismissText: { fontSize: 14, color: COLORS.textMuted },
  mentorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    position: 'relative',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: COLORS.bg2,
  },
  mentorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  lessonRef: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  questionBubble: {
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  questionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  chatBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  chatBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
