import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptics';
import { LeoAnimated } from '../mascot/LeoAnimated';
import { ChunkyButton } from './ChunkyButton';
import { NUDGE_MESSAGES, NudgeId, NudgeResult } from '../../lib/nudges';

const LEO_SASSY = require('../../assets/mascot/leo-sassy.png');
const LEO_SUCCESS = require('../../assets/mascot/leo-success.png');

export interface NudgeTarget {
  friendId: string;
  name: string;
  /** One short line about why now ("Hasn't done today's lesson"). */
  context: string;
  options: NudgeId[];
}

/** Pick a funny message, send it as a push, and watch Leo deliver it. */
export function NudgeSheet({ target, onSend, onClose }: {
  target: NudgeTarget | null;
  onSend: (friendId: string, message: NudgeId) => Promise<NudgeResult>;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState<NudgeId | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | NudgeResult>('idle');

  useEffect(() => {
    setPicked(target?.options[0] ?? null);
    setStatus('idle');
  }, [target?.friendId]);

  if (!target) return null;
  const done = status === 'sent' || status === 'saved' || status === 'already';

  const send = async () => {
    if (!picked || status === 'sending') return;
    triggerHaptic('medium');
    setStatus('sending');
    const result = await onSend(target.friendId, picked);
    setStatus(result);
    if (result === 'sent' || result === 'saved') triggerHaptic('success');
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <TouchableOpacity onPress={onClose} style={styles.close} accessibilityLabel="Close"><Feather name="x" size={18} color={COLORS.textMuted} /></TouchableOpacity>

        {done ? (
          <View style={styles.doneWrap}>
            <LeoAnimated clip="leo-success" size={130} fallback={LEO_SUCCESS} />
            <Text style={styles.title}>{status === 'already' ? `You already nudged ${target.name} today` : 'Nudge sent!'}</Text>
            {status !== 'already' && picked && (
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>“{NUDGE_MESSAGES[picked]}”</Text>
              </View>
            )}
            <Text style={styles.sub}>
              {status === 'already' ? 'One nudge a day, so it stays fun. Try again tomorrow.' : `${target.name} gets it as a notification from you.`}
            </Text>
            <ChunkyButton label="Done" onPress={onClose} style={{ alignSelf: 'stretch', marginTop: 8 }} />
          </View>
        ) : (
          <>
            <View style={styles.head}>
              <LeoAnimated clip="leo-encourage" size={96} fallback={LEO_SASSY} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Nudge {target.name}</Text>
                <Text style={styles.sub}>{target.context}</Text>
              </View>
            </View>
            <Text style={styles.pickLabel}>Pick your message</Text>
            <ScrollView style={{ maxHeight: 330 }} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
              {target.options.map(id => {
                const on = picked === id;
                return (
                  <Pressable key={id} onPress={() => { triggerHaptic('light'); setPicked(id); }}
                    style={[styles.option, on && styles.optionOn]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                    <Text style={[styles.optionText, on && styles.optionTextOn]}>{NUDGE_MESSAGES[id]}</Text>
                    <View style={[styles.radio, on && styles.radioOn]}>{on && <Feather name="check" size={13} color="#FFFFFF" />}</View>
                  </Pressable>
                );
              })}
            </ScrollView>
            {(status === 'error' || status === 'offline') && (
              <Text style={styles.error}>{status === 'offline' ? 'Nudge not sent. Check your connection.' : 'Nudge not sent. Please try again.'}</Text>
            )}
            <ChunkyButton
              label={`Send to ${target.name}`}
              icon={<MaterialCommunityIcons name="hand-wave" size={20} color="#FFFFFF" />}
              onPress={() => { void send(); }}
              busy={status === 'sending'}
              disabled={!picked}
              style={{ marginTop: 14 }}
            />
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11, 16, 32, 0.55)' },
  sheet: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, width: '100%', maxWidth: 680, alignSelf: 'center' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.border, marginBottom: 6 },
  close: { position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 36 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary },
  sub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 3, lineHeight: 19 },
  pickLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, color: COLORS.textMuted, textTransform: 'uppercase', marginTop: 14, marginBottom: 8 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: COLORS.border, backgroundColor: COLORS.bg2,
  },
  optionOn: { borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20 },
  optionTextOn: { color: COLORS.accentDark },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  error: { fontSize: 13, fontWeight: '700', color: COLORS.error, marginTop: 10 },
  doneWrap: { alignItems: 'center', gap: 8, paddingTop: 6 },
  bubble: { backgroundColor: COLORS.accentSoft, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1.5, borderColor: COLORS.accentMedium, marginTop: 4 },
  bubbleText: { fontSize: 15, fontWeight: '700', color: COLORS.accentDark, textAlign: 'center', lineHeight: 21 },
});
