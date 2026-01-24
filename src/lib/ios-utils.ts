import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';

/**
 * Initialize iOS-specific configurations
 * Call this in the app's main entry point
 */
export async function initializeIOSApp() {
  const platform = Capacitor.getPlatform();
  
  if (platform !== 'ios') {
    return;
  }

  try {
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0A1628' });
  } catch (error) {
    console.log('StatusBar plugin not available:', error);
  }

  try {
    // Configure keyboard behavior
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.setProperty('--keyboard-height', '0px');
    });
  } catch (error) {
    console.log('Keyboard plugin not available:', error);
  }

  // Handle app URL open (deep links)
  try {
    App.addListener('appUrlOpen', (data) => {
      console.log('App opened with URL:', data.url);
      // Handle deep link routing here
      const path = new URL(data.url).pathname;
      if (path) {
        window.location.href = path;
      }
    });
  } catch (error) {
    console.log('App plugin not available:', error);
  }

  // Handle app state changes
  try {
    App.addListener('appStateChange', (state) => {
      console.log('App state changed:', state.isActive ? 'active' : 'background');
    });
  } catch (error) {
    console.log('App state listener not available:', error);
  }
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

/**
 * Check if running in native app (iOS or Android)
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get safe area insets for iOS devices with notch
 */
export function getSafeAreaInsets() {
  return {
    top: getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0px',
    right: getComputedStyle(document.documentElement).getPropertyValue('--sar') || '0px',
    bottom: getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0px',
    left: getComputedStyle(document.documentElement).getPropertyValue('--sal') || '0px',
  };
}

/**
 * Trigger haptic feedback on iOS
 */
export async function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (!isNativeApp()) return;
  
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    
    await Haptics.impact({ style: styleMap[type] });
  } catch (error) {
    console.log('Haptics not available:', error);
  }
}
