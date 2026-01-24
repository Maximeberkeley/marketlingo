import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  type: 'news' | 'streak_warning' | 'daily_reminder';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  userId?: string;
}

interface FCMMessage {
  to: string;
  notification: {
    title: string;
    body: string;
    sound: string;
  };
  data?: Record<string, unknown>;
}

async function sendToFCM(token: string, title: string, body: string, data?: Record<string, unknown>): Promise<boolean> {
  const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
  
  if (!fcmServerKey) {
    console.error('FCM_SERVER_KEY not configured');
    return false;
  }

  const message: FCMMessage = {
    to: token,
    notification: {
      title,
      body,
      sound: 'default',
    },
    data: data || {},
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
    console.log('FCM response:', result);
    
    // Check if the message was sent successfully
    if (result.success === 1) {
      return true;
    } else if (result.failure === 1) {
      console.error('FCM delivery failed:', result.results);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('FCM request failed:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    console.log('Processing notification:', payload.type, 'for user:', payload.userId || 'all');

    // Get push tokens from profiles
    let query = supabase
      .from('profiles')
      .select('id, push_token, notification_preferences')
      .not('push_token', 'is', null);

    if (payload.userId) {
      query = query.eq('id', payload.userId);
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
        default:
          return true;
      }
    });

    console.log(`Sending to ${eligibleUsers.length} of ${users.length} users`);

    // Send notifications via FCM
    let successCount = 0;
    let failCount = 0;

    for (const user of eligibleUsers) {
      if (!user.push_token) continue;
      
      const success = await sendToFCM(
        user.push_token,
        payload.title,
        payload.body,
        { ...payload.data, route: payload.data?.route || '/home' }
      );

      if (success) {
        successCount++;
      } else {
        failCount++;
        // If token is invalid, we could remove it from the database
        // This is optional but helps keep the database clean
      }
    }

    console.log(`FCM results: ${successCount} sent, ${failCount} failed`);

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
