import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptics';
import { inviteAppUrl } from '../../lib/inviteLinks';
import { LeoAnimated } from '../mascot/LeoAnimated';
import { QRCode } from './QRCode';
import { QRScanner } from './QRScanner';
import { ChunkyButton } from './ChunkyButton';

const LEO_SUCCESS = require('../../assets/mascot/leo-success.png');
const QR_SIZE = 208;
// The scanner window matches the QR card (QR + padding + border), so switching tabs doesn't jump.
const WINDOW = QR_SIZE + 28 + 4;

export type CodeSheetTab = 'code' | 'scan';

type ScanState =
  | { kind: 'scanning'; note?: { text: string; bad: boolean } }
  | { kind: 'adding' }
  | { kind: 'added'; message: string };

/**
 * Your code and QR, plus a scanner for a friend's. The QR holds the app link,
 * so the iPhone camera opens MarketLingo and adds you; scanning inside the app
 * adds the friend on the spot. No website in between either way.
 */
export function MyCodeSheet({ code, visible, initialTab = 'code', onShare, onRedeem, onClose }: {
  code: string | null;
  visible: boolean;
  initialTab?: CodeSheetTab;
  onShare: () => void;
  /** Adds the friend whose code was scanned. ok means you're friends now. */
  onRedeem: (code: string) => Promise<{ ok: boolean; message: string }>;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<CodeSheetTab>(initialTab);
  const [scan, setScan] = useState<ScanState>({ kind: 'scanning' });

  useEffect(() => {
    if (visible) { setTab(initialTab); setScan({ kind: 'scanning' }); }
  }, [visible, initialTab]);

  if (!visible || !code) return null;

  const pick = (next: CodeSheetTab) => {
    if (next === tab) return;
    triggerHaptic('light');
    setTab(next);
    setScan({ kind: 'scanning' });
  };

  const onCode = async (scanned: string) => {
    if (scanned === code) {
      triggerHaptic('warning');
      setScan({ kind: 'scanning', note: { text: "That's your own code. Scan a friend's.", bad: true } });
      return;
    }
    triggerHaptic('medium');
    setScan({ kind: 'adding' });
    const result = await onRedeem(scanned);
    if (result.ok) {
      triggerHaptic('success');
      setScan({ kind: 'added', message: result.message });
    } else {
      triggerHaptic('warning');
      setScan({ kind: 'scanning', note: { text: result.message, bad: true } });
    }
  };

  const onNotOurs = () => setScan({ kind: 'scanning', note: { text: "That's not a MarketLingo code.", bad: true } });

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <TouchableOpacity onPress={onClose} style={styles.close} accessibilityLabel="Close"><Feather name="x" size={18} color={COLORS.textMuted} /></TouchableOpacity>

        <View style={styles.tabs} accessibilityRole="tablist">
          {([['code', 'My code', 'qrcode'], ['scan', 'Scan', 'qrcode-scan']] as const).map(([id, label, icon]) => {
            const on = tab === id;
            return (
              <Pressable key={id} onPress={() => pick(id)} style={[styles.tab, on && styles.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
                <MaterialCommunityIcons name={icon} size={18} color={on ? '#FFFFFF' : COLORS.textSecondary} />
                <Text style={[styles.tabText, on && styles.tabTextOn]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'code' ? (
          <>
            <Text style={styles.sub}>Friends scan this to add you.</Text>
            <View style={styles.qrCard}>
              <QRCode value={inviteAppUrl(code)} size={QR_SIZE} />
            </View>
            <View style={styles.ticket}>
              <Text style={styles.ticketLabel}>CODE</Text>
              <Text style={styles.ticketCode} selectable>{code}</Text>
            </View>
            <ChunkyButton label="Share invite link" icon={<Feather name="share" size={18} color="#FFFFFF" />} onPress={onShare} style={{ alignSelf: 'stretch' }} />
          </>
        ) : scan.kind === 'added' ? (
          <View style={[styles.added, { minHeight: WINDOW + 64 }]}>
            <LeoAnimated clip="leo-success" size={140} fallback={LEO_SUCCESS} />
            <Text style={styles.addedTitle}>{scan.message}</Text>
            <Text style={styles.sub}>Race them, start a streak, or go take the crown.</Text>
            <View style={styles.addedActions}>
              <ChunkyButton label="Scan another" tone="plain" onPress={() => setScan({ kind: 'scanning' })} height={48} style={{ flex: 1 }} />
              <ChunkyButton label="Done" onPress={onClose} height={48} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.sub}>Point your camera at a friend's code.</Text>
            <View>
              <QRScanner size={WINDOW} paused={scan.kind === 'adding'} onCode={c => { void onCode(c); }} onNotOurs={onNotOurs} />
              {scan.kind === 'adding' && (
                <View style={styles.adding} pointerEvents="none">
                  <ActivityIndicator color="#FFFFFF" size="large" />
                  <Text style={styles.addingText}>Adding your friend…</Text>
                </View>
              )}
            </View>
            <Text style={[styles.note, scan.kind === 'scanning' && scan.note?.bad && styles.noteBad]} numberOfLines={2}>
              {scan.kind === 'scanning' && scan.note ? scan.note.text : 'Their code is on their Profile, under their name.'}
            </Text>
            <TouchableOpacity onPress={onShare} style={styles.shareLink} accessibilityRole="button">
              <Text style={styles.shareLinkText}>Friend doesn't have the app? <Text style={styles.shareLinkStrong}>Send an invite</Text></Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11, 16, 32, 0.55)' },
  sheet: { backgroundColor: COLORS.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, gap: 12, width: '100%', maxWidth: 680, alignSelf: 'center', alignItems: 'center' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.border },
  close: { position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  tabs: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 16, backgroundColor: COLORS.bg1, borderWidth: 2, borderColor: COLORS.border, marginTop: 4 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 18, borderRadius: 12 },
  tabOn: { backgroundColor: COLORS.accent },
  tabText: { fontSize: 15, fontWeight: '800', color: COLORS.textSecondary },
  tabTextOn: { color: '#FFFFFF' },
  sub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  qrCard: { padding: 14, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 2, borderBottomWidth: 5, borderColor: COLORS.border },
  ticket: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, height: 52, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.accent + '70', backgroundColor: COLORS.accentSoft },
  ticketLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, color: COLORS.accent },
  ticketCode: { fontSize: 26, fontWeight: '900', letterSpacing: 5, color: COLORS.textPrimary },
  adding: { ...StyleSheet.absoluteFillObject, borderRadius: 24, backgroundColor: 'rgba(11, 16, 32, 0.6)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  addingText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  note: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted, textAlign: 'center', minHeight: 36, paddingHorizontal: 12 },
  noteBad: { fontWeight: '800', color: COLORS.error },
  shareLink: { paddingVertical: 6 },
  shareLinkText: { fontSize: 14, color: COLORS.textSecondary },
  shareLinkStrong: { fontWeight: '800', color: COLORS.accent },
  added: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addedTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary, textAlign: 'center', paddingHorizontal: 8 },
  addedActions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 8 },
});
