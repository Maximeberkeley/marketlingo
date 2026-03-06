import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { COLORS } from '../../lib/constants';
import { mentors, getMentorForContext, type Mentor } from '../../data/mentors';
import { MentorAvatar } from './MentorAvatar';
import { MentorChatOverlay } from './MentorChatOverlay';

interface MentorBannerProps {
  context?: string;
  marketId?: string;
}

export function MentorBanner({ context, marketId }: MentorBannerProps) {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  return (
    <>
      <View style={styles.container}>
        {/* Stacked mentor avatars */}
        <View style={styles.avatarStack}>
          {mentors.map((mentor, index) => (
            <TouchableOpacity
              key={mentor.id}
              onPress={() => setSelectedMentor(mentor)}
              style={[styles.avatarWrapper, { marginLeft: index === 0 ? 0 : -10, zIndex: mentors.length - index }]}
            >
              <MentorAvatar emoji={mentor.emoji} name={mentor.name} size="sm" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={styles.title}>Ask our mentors</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Get instant answers about {marketId ? marketId.replace(/-/g, ' ') : 'your industry'}
          </Text>
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => setSelectedMentor(getMentorForContext(context || '', marketId))}
          activeOpacity={0.8}
        >
          <Text style={styles.chatBtnText}>Chat</Text>
        </TouchableOpacity>
      </View>

      {selectedMentor && (
        <MentorChatOverlay
          visible={!!selectedMentor}
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
          context={context}
          marketId={marketId}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.bg0,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnText: {
    fontSize: 18,
  },
});
