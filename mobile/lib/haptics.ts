/**
 * Haptic feedback utility for MarketLingo mobile app.
 * Uses expo-haptics, gracefully degrades to no-op on web.
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export async function triggerHaptic(type: HapticType = 'light'): Promise<void> {
  if (!isNative) return;

  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
    }
  } catch {
    // Silently fail — haptics not available (web, simulator)
  }
}
