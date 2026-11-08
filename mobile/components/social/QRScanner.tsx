import React, { useRef } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';
import { codeFromScan } from '../../lib/inviteLinks';
import { ChunkyButton } from './ChunkyButton';

// The camera reports the same QR many times a second; act on each one once in this window.
const SAME_CODE_MS = 3000;

/**
 * A square camera window that reads friend-code QRs. Asks for the camera the
 * first time, and points to Settings if it was turned off.
 */
export function QRScanner({ size, paused, onCode, onNotOurs }: {
  size: number;
  /** While true, scans are ignored (adding a friend, or done). */
  paused: boolean;
  onCode: (code: string) => void;
  /** A QR that isn't a MarketLingo code. */
  onNotOurs: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const last = useRef<{ data: string; at: number } | null>(null);

  const handleScan = ({ data }: BarcodeScanningResult) => {
    if (paused) return;
    const now = Date.now();
    if (last.current && last.current.data === data && now - last.current.at < SAME_CODE_MS) return;
    last.current = { data, at: now };
    const code = codeFromScan(data);
    if (code) onCode(code);
    else onNotOurs();
  };

  const box = { width: size, height: size };

  if (!permission) {
    return <View style={[styles.box, styles.center, box]}><ActivityIndicator color="#FFFFFF" /></View>;
  }

  if (!permission.granted) {
    const blocked = !permission.canAskAgain;
    return (
      <View style={[styles.box, styles.center, styles.ask, box]}>
        <View style={styles.askIcon}>
          <MaterialCommunityIcons name="camera-outline" size={30} color={COLORS.accent} />
        </View>
        <Text style={styles.askTitle}>{blocked ? 'Camera is off for MarketLingo' : "Scan a friend's code"}</Text>
        <Text style={styles.askSub}>
          {blocked ? 'Turn it on in Settings to scan codes.' : 'Allow the camera and you can add a friend in one scan.'}
        </Text>
        <ChunkyButton
          label={blocked ? 'Open Settings' : 'Allow camera'}
          onPress={() => { if (blocked) void Linking.openSettings(); else void requestPermission(); }}
          height={44}
          style={{ alignSelf: 'stretch', marginTop: 4 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.box, box]}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={paused ? undefined : handleScan}
      />
      <View style={styles.frame} pointerEvents="none">
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />
      </View>
    </View>
  );
}

const CORNER = 34;
const LINE = 5;

const styles = StyleSheet.create({
  box: { borderRadius: 24, overflow: 'hidden', backgroundColor: '#0B1020' },
  center: { alignItems: 'center', justifyContent: 'center' },
  ask: { backgroundColor: COLORS.bg1, borderWidth: 2, borderBottomWidth: 5, borderColor: COLORS.border, paddingHorizontal: 22, gap: 8 },
  askIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  askTitle: { fontSize: 17, fontWeight: '900', color: COLORS.textPrimary, textAlign: 'center' },
  askSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 18 },
  frame: { ...StyleSheet.absoluteFillObject, margin: 26 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#FFFFFF' },
  tl: { top: 0, left: 0, borderTopWidth: LINE, borderLeftWidth: LINE, borderTopLeftRadius: 16 },
  tr: { top: 0, right: 0, borderTopWidth: LINE, borderRightWidth: LINE, borderTopRightRadius: 16 },
  bl: { bottom: 0, left: 0, borderBottomWidth: LINE, borderLeftWidth: LINE, borderBottomLeftRadius: 16 },
  br: { bottom: 0, right: 0, borderBottomWidth: LINE, borderRightWidth: LINE, borderBottomRightRadius: 16 },
});
