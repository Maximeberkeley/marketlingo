import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MascotAvatar } from './MascotAvatar';
import { getRandomCharacter, getRandomMessage } from '../../lib/mascots';
import { COLORS } from '../../lib/constants';

type CardType = 'intro' | 'midpoint' | 'complete' | 'encourage' | 'tip';

interface MascotCardProps {
  type: CardType;
  message?: string;
  characterEmoji?: string;
  characterName?: string;
  characterColor?: string;
}

const TYPE_CONFIG: Record<CardType, { gradient: string; messageType: keyof typeof import('../../lib/mascots').MASCOT_MESSAGES }> = {
  intro: { gradient: '#8B5CF6', messageType: 'greeting' },
  midpoint: { gradient: '#F59E0B', messageType: 'encouragement' },
  complete: { gradient: '#22C55E', messageType: 'celebrate' },
  encourage: { gradient: '#3B82F6', messageType: 'encouragement' },
  tip: { gradient: '#EC4899', messageType: 'greeting' },
};

export function MascotCard({
  type,
  message,
  characterEmoji,
  characterName,
  characterColor,
}: MascotCardProps) {
  const config = TYPE_CONFIG[type];
  const character = React.useMemo(() => getRandomCharacter(), []);
  
  const emoji = characterEmoji || character.emoji;
  const name = characterName || character.name;
  const color = characterColor || character.color;
  const displayMessage = message || getRandomMessage(config.messageType);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor: config.gradient + '40',
          backgroundColor: config.gradient + '15',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <MascotAvatar emoji={emoji} size="lg" color={color} />
      <View style={styles.content}>
        <Text style={[styles.message, { color: config.gradient }]}>
          {displayMessage}
        </Text>
        <Text style={styles.name}>— {name}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
