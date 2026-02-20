import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../../lib/constants';
import { useSubscription } from '../../hooks/useSubscription';
import { ProUpsellModal } from './ProUpsellModal';

interface FeatureGateProps {
  children: React.ReactNode;
  featureName: string;
  showLockBadge?: boolean;
  /** overlay = blur children and show lock on top; replace = hide children, show lock UI */
  overlayMode?: boolean;
}

export function FeatureGate({
  children,
  featureName,
  showLockBadge = true,
  overlayMode = true,
}: FeatureGateProps) {
  const { isProUser, isLoading } = useSubscription();
  const [showPromo, setShowPromo] = React.useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isProUser && !isLoading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
  }, [isProUser, isLoading]);

  if (isProUser || isLoading) return <>{children}</>;

  if (overlayMode) {
    return (
      <>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowPromo(true)} style={styles.overlayContainer}>
          {/* Blurred preview */}
          <View style={styles.blurredContent} pointerEvents="none">
            {children}
          </View>

          {/* Lock overlay */}
          <Animated.View style={[styles.lockOverlay, { opacity: fadeAnim }]}>
            <View style={styles.lockIconCircle}>
              <Text style={{ fontSize: 24 }}>🔒</Text>
            </View>
            <Text style={styles.lockTitle}>Pro Feature</Text>
            <Text style={styles.lockSubtitle}>Tap to unlock {featureName}</Text>
          </Animated.View>

          {showLockBadge && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>👑 PRO</Text>
            </View>
          )}
        </TouchableOpacity>

        <ProUpsellModal
          isOpen={showPromo}
          onClose={() => setShowPromo(false)}
          trigger="feature_gate"
          featureName={featureName}
        />
      </>
    );
  }

  // Replace mode
  return (
    <>
      <TouchableOpacity style={styles.replaceContainer} onPress={() => setShowPromo(true)} activeOpacity={0.8}>
        <View style={styles.lockIconCircleLarge}>
          <Text style={{ fontSize: 32 }}>🔒</Text>
        </View>
        <Text style={styles.replaceTitle}>Unlock {featureName}</Text>
        <Text style={styles.replaceSubtitle}>Available with Pro subscription</Text>
        <View style={styles.goProChip}>
          <Text style={styles.goProChipText}>👑 Go Pro</Text>
        </View>
      </TouchableOpacity>

      <ProUpsellModal
        isOpen={showPromo}
        onClose={() => setShowPromo(false)}
        trigger="feature_gate"
        featureName={featureName}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
  },
  blurredContent: {
    opacity: 0.35,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 18,
    gap: 6,
  },
  lockIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  lockTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  lockSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  proBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  proBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  replaceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  lockIconCircleLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  replaceTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  replaceSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  goProChip: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  goProChipText: { color: '#F59E0B', fontSize: 14, fontWeight: '600' },
});
