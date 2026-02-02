import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const SESSION_KEY = 'supabase-auth-session';

/**
 * Capacitor-compatible session storage for native apps.
 * Uses Preferences API which persists data across app restarts.
 */
export const CapacitorStorage = {
  /**
   * Check if running in a native Capacitor environment
   */
  isNative: () => Capacitor.isNativePlatform(),

  /**
   * Store the session in Capacitor Preferences
   */
  async setSession(session: object | null): Promise<void> {
    if (!this.isNative()) return;
    
    try {
      if (session) {
        await Preferences.set({
          key: SESSION_KEY,
          value: JSON.stringify(session),
        });
      } else {
        await Preferences.remove({ key: SESSION_KEY });
      }
    } catch (error) {
      console.error('Failed to persist session:', error);
    }
  },

  /**
   * Retrieve the session from Capacitor Preferences
   */
  async getSession(): Promise<object | null> {
    if (!this.isNative()) return null;
    
    try {
      const { value } = await Preferences.get({ key: SESSION_KEY });
      if (value) {
        return JSON.parse(value);
      }
    } catch (error) {
      console.error('Failed to retrieve session:', error);
    }
    return null;
  },

  /**
   * Clear the stored session
   */
  async clearSession(): Promise<void> {
    if (!this.isNative()) return;
    
    try {
      await Preferences.remove({ key: SESSION_KEY });
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  },
};
