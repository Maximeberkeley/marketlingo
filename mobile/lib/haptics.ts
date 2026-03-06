/**
 * Haptic feedback utility for MarketLingo mobile app.
 * Uses expo-haptics, gracefully degrades to no-op on web/simulator.
 * 
 * Haptic patterns:
 *  - light:     Button taps, card selection
 *  - medium:    Lesson start, navigation transitions
 *  - heavy:     Streak milestone, level up
 *  - success:   Correct answer, lesson complete, achievement unlock
 *  - warning:   Streak at risk, wrong answer
 *  - error:     Critical errors
 *  - selection: Tab changes, toggling options, expanding sections
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

export async function triggerHaptic(type: HapticType = 'light'): Promise<void> {
  if (!isNative || !hapticsEnabled) return;

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
    // Silently fail — haptics not available
  }
}

/**
 * Celebration pattern — double-tap success for milestones.
 * Used for: streak milestones, level ups, achievements.
 */
export async function triggerCelebration(): Promise<void> {
  if (!isNative || !hapticsEnabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(async () => {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }, 150);
  } catch {}
}

/**
 * Streak milestone pattern — escalating triple burst.
 */
export async function triggerStreakCelebration(): Promise<void> {
  if (!isNative || !hapticsEnabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(async () => {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    }, 100);
    setTimeout(async () => {
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    }, 250);
  } catch {}
}
