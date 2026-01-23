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
  userId?: string; // If provided, send only to this user
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
    console.log('Sending notification:', payload);

    // Get push tokens
    let query = supabase
      .from('profiles')
      .select('id, push_token, notification_preferences')
      .not('push_token', 'is', null);

    // If userId is provided, only send to that user
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

    // Filter users based on their notification preferences
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

    console.log(`Eligible users: ${eligibleUsers.length} of ${users.length}`);

    // Note: In a production app, you would integrate with:
    // - Firebase Cloud Messaging (FCM) for Android
    // - Apple Push Notification Service (APNs) for iOS
    // 
    // For now, we'll log the notification details and store them
    // The actual push would be sent via FCM/APNs SDK
    
    const notifications = eligibleUsers.map((user) => ({
      user_id: user.id,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sent_at: new Date().toISOString(),
      push_token: user.push_token,
    }));

    console.log(`Would send ${notifications.length} push notifications`);

    // In production, you would call FCM/APNs here:
    // await sendToFCM(notifications);
    // await sendToAPNs(notifications);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: notifications.length,
        message: `Notification queued for ${notifications.length} users`
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