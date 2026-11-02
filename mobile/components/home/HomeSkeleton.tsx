/**
 * Loading screen for Home: Leo untangling his yarn.
 *
 * Home loads in steps (its own boot, then the course's lesson query) and each
 * step renders a HomeSkeleton. Inside a LoadingLeoHost, every HomeSkeleton only
 * paints the background and asks the host to show Leo, so the same Leo stays on
 * screen and keeps playing across steps: no blank gap, no second fade, no restart.
 * Fast loads (under 250 ms) show nothing at all.
 */

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Text, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';
import { LeoAnimated } from '../mascot/LeoAnimated';
import { createLoadingLeoController, LOADING_LEO_TIMING } from './loadingLeoController';

// The loop's own first frame, so Leo already holds his yarn before the animation starts.
const LOADING_STILL = require('../../assets/mascot/anim/leo-loading-still.png');

const LoadingLeoContext = createContext<{ add: () => void; remove: () => void } | null>(null);

function LoadingLeo() {
  return (
    <View style={styles.centre}>
      {/* Launch-safe: a still Leo while Home loads, until the launch crash is pinned down. */}
      <Image source={LOADING_STILL} style={{ width: 200, height: 200 }} resizeMode="contain" />
      <Text style={styles.line}>Untangling today's lesson…</Text>
    </View>
  );
}

/** Wrap a screen that shows HomeSkeleton during several loading steps. */
export function LoadingLeoHost({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(false);
  const controller = useMemo(() => createLoadingLeoController({
    show: () => {
      opacity.stopAnimation();
      setShown(true);
      Animated.timing(opacity, { toValue: 1, duration: LOADING_LEO_TIMING.fadeInMs, useNativeDriver: true }).start();
    },
    hide: () => {
      opacity.stopAnimation();
      Animated.timing(opacity, { toValue: 0, duration: LOADING_LEO_TIMING.fadeOutMs, useNativeDriver: true }).start(({ finished }) => {
        if (finished) controller.hidden();
      });
    },
    unmount: () => setShown(false),
  }), [opacity]);
  useEffect(() => () => controller.dispose(), [controller]);

  return (
    <LoadingLeoContext.Provider value={controller}>
      <View style={styles.host}>
        {children}
        {shown && (
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.overlay, { opacity, paddingTop: insets.top, paddingBottom: insets.bottom }]}
          >
            <LoadingLeo />
          </Animated.View>
        )}
      </View>
    </LoadingLeoContext.Provider>
  );
}

/** Standalone version, for a HomeSkeleton used outside a LoadingLeoHost. */
function StandaloneSkeleton() {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
      Animated.timing(opacity, { toValue: 1, duration: LOADING_LEO_TIMING.fadeInMs, useNativeDriver: true }).start();
    }, LOADING_LEO_TIMING.showDelayMs);
    return () => clearTimeout(timer);
  }, [opacity]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {visible && (
        <Animated.View style={{ opacity }}>
          <LoadingLeo />
        </Animated.View>
      )}
    </View>
  );
}

export function HomeSkeleton() {
  const host = useContext(LoadingLeoContext);
  useEffect(() => {
    if (!host) return;
    host.add();
    return () => host.remove();
  }, [host]);
  // Inside a host, only paint the background: the host shows Leo above it.
  if (host) return <View style={styles.container} />;
  return <StandaloneSkeleton />;
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    backgroundColor: COLORS.bg0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centre: {
    alignItems: 'center',
  },
  line: {
    marginTop: 16,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});
