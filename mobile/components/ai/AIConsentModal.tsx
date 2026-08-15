/**
 * AIConsentModal — one-time disclosure shown right before the first AI or voice action.
 * Continue · Not now · Learn more. Never shown at launch.
 */
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { AI_DISCLOSURE_TEXT, VOICE_DISCLOSURE_TEXT } from '../../lib/aiConsent';

interface Props {
  visible: boolean;
  kind: 'ai' | 'voice';
  onAccept: () => void;
  onDecline: () => void;
}

export function AIConsentModal({ visible, kind, onAccept, onDecline }: Props) {
  const isVoice = kind === 'voice';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Feather name={isVoice ? 'mic' : 'cpu'} size={22} color={COLORS.accent} />
          </View>

          <Text style={styles.title}>{isVoice ? 'Voice mode uses AI' : 'Leo uses AI'}</Text>

          <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.body}>{isVoice ? VOICE_DISCLOSURE_TEXT : AI_DISCLOSURE_TEXT}</Text>
            <Text style={styles.note}>
              Lessons, drills and reviews work fully without this. You can turn it off any time in
              Settings.
            </Text>
          </ScrollView>

          <TouchableOpacity style={styles.primary} onPress={onAccept} activeOpacity={0.85}>
            <Text style={styles.primaryText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondary} onPress={onDecline} activeOpacity={0.7}>
            <Text style={styles.secondaryText}>Not now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://market-verse.com/privacy')}
            activeOpacity={0.7}
          >
            <Text style={styles.link}>Learn more</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,18,32,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: COLORS.bg2,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentSoft,
    marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 10 },
  body: { fontSize: 16, lineHeight: 23, color: COLORS.textSecondary },
  note: { fontSize: 14, lineHeight: 20, color: COLORS.textMuted, marginTop: 12 },
  primary: {
    marginTop: 20,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondary: { marginTop: 10, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' },
  link: {
    textAlign: 'center',
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 6,
  },
});
