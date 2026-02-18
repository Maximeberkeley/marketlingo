import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';

interface MentorAvatarProps {
  emoji: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export function MentorAvatar({ emoji, name, size = 'md', showName = false }: MentorAvatarProps) {
  const sizeMap = { sm: 32, md: 44, lg: 60 };
  const fontMap = { sm: 16, md: 22, lg: 30 };
  const dim = sizeMap[size];

  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { width: dim, height: dim, borderRadius: dim / 2 }]}>
        <Text style={{ fontSize: fontMap[size] }}>{emoji}</Text>
      </View>
      {showName && <Text style={styles.name}>{name}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  avatar: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
});
