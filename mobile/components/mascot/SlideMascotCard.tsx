import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../lib/constants';
import { mentors } from '../../data/mentors';
import { getPrimaryMentorForMarket } from '../../data/marketConfig';

const MENTOR_IMAGES: Record<string, any> = {
  maya: require('../../assets/mentors/mentor-maya.png'),
  alex: require('../../assets/mentors/mentor-alex.png'),
  kai: require('../../assets/mentors/mentor-kai.png'),
  sophia: require('../../assets/mentors/mentor-sophia.png'),
};
const LEO_STICKER = require('../../assets/mascot/leo-reference.png');

export type SlidePosition = 'first' | 'middle' | 'last';

interface Character {
  id: string;
  name: string;
  isLeo: boolean;
}

const getLeo = (): Character => ({ id: 'leo', name: 'Leo', isLeo: true });

const getMentorCharacter = (marketId?: string): Character => {
  const mentorId = marketId ? getPrimaryMentorForMarket(marketId) : 'sophia';
  const mentor = mentors.find((m) => m.id === mentorId) || mentors[0];
  return { id: mentor.id, name: mentor.name.split(' ')[0], isLeo: false };
};

const getMessages = (
  position: SlidePosition,
  charName: string,
  slideIndex: number,
  totalSlides: number
) => {
  const progress = Math.round(((slideIndex + 1) / totalSlides) * 100);
  const bank: Record<SlidePosition, { greeting: string; subtext: string }[]> = {
    first: [
      { greeting: "Let's learn together!", subtext: "I'll be here to guide you" },
      { greeting: 'Ready to dive in?', subtext: "This is going to be great!" },
      { greeting: 'Hey there!', subtext: "Let's make this fun" },
    ],
    middle: [
      { greeting: `${progress}% complete!`, subtext: "You're doing amazing" },
      { greeting: 'Great progress!', subtext: 'Keep that momentum going' },
      { greeting: 'Halfway there!', subtext: 'Almost to the finish line' },
    ],
    last: [
      { greeting: 'You crushed it!', subtext: 'Another lesson conquered' },
      { greeting: 'Brilliant work!', subtext: 'Knowledge is power' },
      { greeting: 'All done!', subtext: 'See you next time' },
    ],
  };
  const options = bank[position];
  return options[slideIndex % options.length];
};

const GRADIENT_TINTS: Record<SlidePosition, string> = {
  first: 'rgba(139,92,246,0.12)',
  middle: 'rgba(245,158,11,0.12)',
  last: 'rgba(34,197,94,0.12)',
};

const ACCENT_COLORS: Record<SlidePosition, string> = {
  first: COLORS.accent,
  middle: '#F59E0B',
  last: '#22C55E',
};

interface SlideMascotCardProps {
  position: SlidePosition;
  slideIndex: number;
  totalSlides: number;
  marketId?: string;
}

export function SlideMascotCard({ position, slideIndex, totalSlides, marketId }: SlideMascotCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const bobY = useRef(new Animated.Value(0)).current;

  const character = useMemo(() => {
    if (position === 'first' || position === 'last') return getMentorCharacter(marketId);
    return getLeo();
  }, [position, marketId]);

  const messages = useMemo(
    () => getMessages(position, character.name, slideIndex, totalSlides),
    [position, character.name, slideIndex, totalSlides]
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 280, friction: 22, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bobY, { toValue: -4, duration: 1300, useNativeDriver: true }),
        Animated.timing(bobY, { toValue: 0, duration: 1300, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const avatarSource = character.isLeo ? LEO_STICKER : MENTOR_IMAGES[character.id];
  const accentColor = ACCENT_COLORS[position];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: GRADIENT_TINTS[position], opacity, transform: [{ translateY }] },
      ]}
    >
      <Animated.Image
        source={avatarSource}
        style={[
          styles.avatar,
          character.isLeo ? styles.leoAvatar : styles.mentorAvatar,
          { transform: [{ translateY: bobY }] },
        ]}
      />
      <View style={styles.textBlock}>
        <Text style={[styles.greeting, { color: accentColor }]}>{messages.greeting}</Text>
        <Text style={styles.subtext}>— {character.name}</Text>
      </View>
    </Animated.View>
  );
}

export function getSlidePosition(slideIndex: number, totalSlides: number): SlidePosition | null {
  if (slideIndex === 0) return 'first';
  const midpoint = Math.floor(totalSlides / 2);
  if (slideIndex === midpoint && totalSlides > 3) return 'middle';
  if (slideIndex === totalSlides - 1) return 'last';
  return null;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  avatar: { resizeMode: 'contain' },
  leoAvatar: { width: 60, height: 60 },
  mentorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  textBlock: { flex: 1 },
  greeting: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  subtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default SlideMascotCard;
