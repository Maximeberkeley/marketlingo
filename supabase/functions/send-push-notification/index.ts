import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  type: 'news' | 'streak_warning' | 'daily_reminder' | 'leaderboard';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  userId?: string;
}

interface APNsPayload {
  aps: {
    alert: {
      title: string;
      body: string;
    };
    sound: string;
    badge?: number;
  };
  route?: string;
  data?: Record<string, unknown>;
}

// Generate JWT for APNs authentication
async function generateAPNsJWT(): Promise<string> {
  const keyId = Deno.env.get('APNS_KEY_ID');
  const teamId = Deno.env.get('APNS_TEAM_ID');
  const authKey = Deno.env.get('APNS_AUTH_KEY');

  if (!keyId || !teamId || !authKey) {
    throw new Error('APNs credentials not configured');
  }

  // Clean up the key - remove any extra whitespace/newlines
  const cleanKey = authKey.trim();
  
  const privateKey = await jose.importPKCS8(cleanKey, 'ES256');

  const jwt = await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .sign(privateKey);

  return jwt;
}

// Send notification via APNs
async function sendToAPNs(
  token: string, 
  title: string, 
  body: string, 
  data?: Record<string, unknown>
): Promise<boolean> {
  try {
    const jwt = await generateAPNsJWT();
    const bundleId = 'app.lovable.94df7a7687ec45218c7386e5aa46d211'; // Your app bundle ID

    const payload: APNsPayload = {
      aps: {
        alert: {
          title,
          body,
        },
        sound: 'default',
      },
      route: (data?.route as string) || '/home',
      data: data || {},
    };

    // Use production APNs endpoint
    const isProduction = true; // Set to false for sandbox/development
    const apnsHost = isProduction 
      ? 'api.push.apple.com' 
      : 'api.sandbox.push.apple.com';

    const response = await fetch(
      `https://${apnsHost}/3/device/${token}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `bearer ${jwt}`,
          'apns-topic': bundleId,
          'apns-push-type': 'alert',
          'apns-priority': '10',
          'apns-expiration': '0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('APNs error:', response.status, errorText);
      
      // Handle specific APNs errors
      if (response.status === 410) {
        console.log('Device token is no longer active');
        return false;
      }
      if (response.status === 400) {
        console.error('Bad request to APNs:', errorText);
        return false;
      }
      return false;
    }

    console.log('APNs notification sent successfully');
    return true;
  } catch (error) {
    console.error('APNs request failed:', error);
    return false;
  }
}

// Fallback: Send via FCM (for Android support)
async function sendToFCM(
  token: string, 
  title: string, 
  body: string, 
  data?: Record<string, unknown>
): Promise<boolean> {
  const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
  
  if (!fcmServerKey) {
    console.log('FCM_SERVER_KEY not configured, skipping FCM');
    return false;
  }

  const message = {
    to: token,
    notification: {
      title,
      body,
      sound: 'default',
    },
    data: { ...data, route: data?.route || '/home' },
  };

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmServerKey}`,
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FCM error:', errorText);
      return false;
    }

    const result = await response.json();
    return result.success === 1;
  } catch (error) {
    console.error('FCM request failed:', error);
    return false;
  }
}

// Determine token type and send accordingly
async function sendNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  // APNs tokens are typically 64 hex characters
  // FCM tokens are longer and contain different characters
  const isAPNsToken = /^[a-f0-9]{64}$/i.test(token);
  
  if (isAPNsToken) {
    return await sendToAPNs(token, title, body, data);
  } else {
    return await sendToFCM(token, title, body, data);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - no auth token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log('Authenticated user for push notification:', userId);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    console.log('Processing notification:', payload.type, 'for user:', payload.userId || 'all');

    // Security: Users can only send notifications to themselves unless admin
    if (payload.userId && payload.userId !== userId) {
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin',
      });
      
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden - cannot send notifications to other users' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get push tokens from profiles
    let query = supabase
      .from('profiles')
      .select('id, push_token, notification_preferences')
      .not('push_token', 'is', null);

    if (payload.userId) {
      query = query.eq('id', payload.userId);
    } else {
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin',
      });
      
      if (!isAdmin) {
        query = query.eq('id', userId);
      }
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!users || users.length === 0) {
      console.log('No users with push tokens found');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No users to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter users based on notification preferences
    const eligibleUsers = users.filter((user) => {
      const prefs = user.notification_preferences || {};
      
      switch (payload.type) {
        case 'news':
          return prefs.newsAlerts !== false;
        case 'streak_warning':
          return prefs.streakReminders !== false;
        case 'daily_reminder':
          return prefs.dailyReminder !== false;
        case 'leaderboard':
          return prefs.newsAlerts !== false; // Group with news for now
        default:
          return true;
      }
    });

    console.log(`Sending to ${eligibleUsers.length} of ${users.length} users`);

    let successCount = 0;
    let failCount = 0;
    const tokensToRemove: string[] = [];

    for (const user of eligibleUsers) {
      if (!user.push_token) continue;
      
      const success = await sendNotification(
        user.push_token,
        payload.title,
        payload.body,
        { ...payload.data, route: payload.data?.route || '/home' }
      );

      if (success) {
        successCount++;
      } else {
        failCount++;
        // Mark token for potential cleanup if it failed
        tokensToRemove.push(user.id);
      }
    }

    // Optional: Clean up invalid tokens (commented out for safety)
    // if (tokensToRemove.length > 0) {
    //   await supabase
    //     .from('profiles')
    //     .update({ push_token: null })
    //     .in('id', tokensToRemove);
    // }

    console.log(`Notification results: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount,
        failed: failCount,
        message: `Notification sent to ${successCount} users`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
