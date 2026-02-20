import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../lib/constants';
import { getMentorForContext } from '../../data/mentors';

// Mentor avatar image map (local requires)
const MENTOR_IMAGES: Record<string, any> = {
  maya: require('../../assets/mentors/mentor-maya.png'),
  alex: require('../../assets/mentors/mentor-alex.png'),
  kai: require('../../assets/mentors/mentor-kai.png'),
  sophia: require('../../assets/mentors/mentor-sophia.png'),
};

interface MentorGuideProps {
  context: string;
  slideIndex: number;
  totalSlides: number;
  isIntro?: boolean;
  marketId?: string;
}

const getMentorMessage = (
  slideIndex: number,
  totalSlides: number,
  isIntro: boolean,
  mentorId: string,
  marketId?: string
): string => {
  const isSophiaNeuro = mentorId === 'sophia' && marketId === 'neuroscience';

  const messages: Record<string, { intro: string; first: string; last: string }> = {
    maya: {
      intro: "Let's decode this together!",
      first: "Here's the big picture...",
      last: 'Now you see the full picture!',
    },
    alex: {
      intro: 'Let me break this down for you.',
      first: 'Fundamental concept here.',
      last: "You've got this!",
    },
    kai: {
      intro: 'This is startup gold!',
      first: 'Founders take note!',
      last: 'Go build something!',
    },
    sophia: isSophiaNeuro
      ? {
          intro: 'Brain science awaits! 🧠',
          first: 'This is exciting! 🎉',
          last: 'You crushed it! 🏆',
        }
      : {
          intro: "You're going to love this!",
          first: 'This is exciting!',
          last: 'Amazing progress!',
        },
  };

  const m = messages[mentorId] || messages.maya;
  if (isIntro) return m.intro;
  if (slideIndex === 0) return m.first;
  if (slideIndex === totalSlides - 1) return m.last;
  return m.first;
};

export function MentorGuide({ context, slideIndex, totalSlides, isIntro = false, marketId }: MentorGuideProps) {
  const mentor = getMentorForContext(context, marketId);

  const message = useMemo(
    () => getMentorMessage(slideIndex, totalSlides, isIntro, mentor.id, marketId),
    [slideIndex, totalSlides, isIntro, mentor.id, marketId]
  );

  const mentorImage = MENTOR_IMAGES[mentor.id];
  const firstName = mentor.name.split(' ')[0];

  return (
    <View style={styles.container}>
      {/* Mentor Avatar */}
      <View style={styles.avatarWrap}>
        {mentorImage ? (
          <Image source={mentorImage} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={{ fontSize: 24 }}>{mentor.emoji}</Text>
          </View>
        )}
        {/* Online dot */}
        <View style={styles.onlineDot} />
      </View>

      {/* Speech bubble */}
      <View style={styles.bubble}>
        {/* Pointer */}
        <View style={styles.bubblePointer} />
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.name}>— {firstName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(139,92,246,0.5)',
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(139,92,246,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: COLORS.bg0,
  },
  bubble: {
    flex: 1,
    position: 'relative',
    backgroundColor: COLORS.bg2,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 200,
  },
  bubblePointer: {
    position: 'absolute',
    left: -7,
    bottom: 10,
    width: 12,
    height: 12,
    backgroundColor: COLORS.bg2,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    transform: [{ rotate: '45deg' }],
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  name: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
