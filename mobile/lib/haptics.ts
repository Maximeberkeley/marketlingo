/**
 * Haptic feedback utility for MarketLingo mobile app.
 * Uses Capacitor Haptics when available, gracefully degrades to no-op.
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Platform } from 'react-native';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export async function triggerHaptic(type: HapticType = 'light'): Promise<void> {
  if (!isNative) return;

  try {
    switch (type) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning });
        break;
      case 'error':
        await Haptics.notification({ type: NotificationType.Error });
        break;
      case 'selection':
        await Haptics.selectionStart();
        break;
    }
  } catch {
    // Silently fail — haptics not available (web, simulator)
  }
}
