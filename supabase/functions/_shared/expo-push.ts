// Delivery for Expo push tokens (ExponentPushToken[...] / ExpoPushToken[...]).
// The mobile app registers through Expo, so its tokens must go to Expo's push
// service — they are neither raw APNs device tokens nor FCM tokens.

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export function isExpoPushToken(token: string): boolean {
  return /^Expo(nent)?PushToken\[.+\]$/.test(token.trim());
}

export interface ExpoSendResult {
  ok: boolean;
  /** true when Expo says the token is no longer valid and should be cleared. */
  unregistered: boolean;
  error?: string;
}

export async function sendToExpo(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<ExpoSendResult> {
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        sound: 'default',
        priority: 'high',
        channelId: 'default',
        data: { ...(data || {}), route: (data?.route as string) || '/(tabs)/home' },
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error(`Expo push failed [${response.status}]: ${text}`);
      return { ok: false, unregistered: false, error: text };
    }

    let payload: any = null;
    try {
      payload = JSON.parse(text);
    } catch {
      return { ok: false, unregistered: false, error: text };
    }

    const ticket = payload?.data;
    const status = Array.isArray(ticket) ? ticket[0]?.status : ticket?.status;
    const detailsError = Array.isArray(ticket)
      ? ticket[0]?.details?.error
      : ticket?.details?.error;

    if (status === 'ok') return { ok: true, unregistered: false };

    const message = Array.isArray(ticket) ? ticket[0]?.message : ticket?.message;
    console.error('Expo push ticket error:', JSON.stringify(ticket ?? payload));
    return {
      ok: false,
      unregistered: detailsError === 'DeviceNotRegistered',
      error: message || detailsError || 'unknown Expo push error',
    };
  } catch (error) {
    console.error('Expo push request failed:', error);
    return { ok: false, unregistered: false, error: String(error) };
  }
}
