import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';
import { log } from './logger';

/**
 * Obtain the Expo push token for this device and store it on the learner's profile.
 * Safe to call repeatedly: it only writes when the token changed.
 *
 * Returns the token, or null when the device cannot be registered.
 */
export async function syncPushToken(userId: string, options?: { requestPermission?: boolean }): Promise<string | null> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      }).catch(() => {});
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;

    if (status !== 'granted') {
      if (!options?.requestPermission) return null;
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }

    if (status !== 'granted') return null;

    const projectId =
      (Constants as any)?.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    const token = tokenData?.data;
    if (!token) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.push_token !== token) {
      const { error } = await supabase
        .from('profiles')
        .update({ push_token: token, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) log.warn('[Push] Could not save push token:', error.message);
    }

    return token;
  } catch (error) {
    log.warn('[Push] Could not register for notifications:', error);
    return null;
  }
}

/** Clear the stored token so the server stops targeting this device. */
export async function clearPushToken(userId: string): Promise<void> {
  try {
    await supabase.from('profiles').update({ push_token: null }).eq('id', userId);
  } catch (error) {
    log.warn('[Push] Could not clear push token:', error);
  }
}
