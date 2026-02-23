import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts';

// Scheduled notification sender for:
// - Daily lesson reminders
// - Streak warnings (about to expire)
// - Re-engagement (inactive users)
// - Milestone celebrations

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationJob {
  type: 'daily_reminder' | 'streak_warning' | 're_engagement' | 'milestone' | 'news_update' | 'weekly_recap';
}

// Notification templates with Leo's personality
const NOTIFICATION_TEMPLATES = {
  daily_reminder: [
    { title: "🦁 Leo: Markets are moving!", body: "Your 5-minute lesson is ready. Let's stay sharp!" },
    { title: "🦁 Good morning, learner!", body: "Today's industry insight awaits. Shall we?" },
    { title: "🦁 Quick check-in!", body: "5 mins to get smarter about markets. I'll make it worth it." },
    { title: "🦁 Your daily brief is here", body: "Industry leaders never skip a day. Neither should we!" },
  ],
  streak_warning: [
    { title: "🔥 Your streak is at risk!", body: "Complete a quick lesson to keep it alive. You've got this!" },
    { title: "⚠️ Don't break the chain!", body: "Your streak expires soon. 5 minutes is all it takes." },
    { title: "🦁 Leo here: Streak alert!", body: "You're about to lose your progress. Quick lesson?" },
  ],
  re_engagement: [
    { title: "🦁 We miss you!", body: "It's been a few days. Markets have moved – catch up in 5 mins." },
    { title: "👋 Welcome back?", body: "Your industry mastery journey is waiting. Let's continue!" },
    { title: "🦁 Leo checking in", body: "Haven't seen you in a while. New lessons are piling up!" },
  ],
  milestone: [
    { title: "🎉 Achievement Unlocked!", body: "You've hit a new milestone. Come see what you've earned!" },
    { title: "🏆 Congrats, champion!", body: "Your hard work is paying off. Check your new achievement!" },
    { title: "⭐ Level up!", body: "You've reached a new level. The next challenge awaits!" },
  ],
  news_update: [
    { title: "📰 Industry Intel just dropped!", body: "Fresh market insights are ready for you. Stay ahead of the curve." },
    { title: "⚡ Breaking: New market moves", body: "Today's top stories in your industry. Tap to read the highlights." },
    { title: "🚀 What's happening in your market?", body: "New stories just in — stay sharp with the latest intel." },
    { title: "🦁 Leo's news roundup!", body: "I've curated today's top industry headlines. Worth a quick look!" },
  ],
};

function getRandomTemplate(type: keyof typeof NOTIFICATION_TEMPLATES) {
  const templates = NOTIFICATION_TEMPLATES[type];
  return templates[Math.floor(Math.random() * templates.length)];
}

// Generate APNs JWT
async function generateAPNsJWT(): Promise<string> {
  const keyId = Deno.env.get('APNS_KEY_ID');
  const teamId = Deno.env.get('APNS_TEAM_ID');
  const authKey = Deno.env.get('APNS_AUTH_KEY');

  if (!keyId || !teamId || !authKey) {
    throw new Error('APNs credentials not configured');
  }

  const privateKey = await jose.importPKCS8(authKey.trim(), 'ES256');

  return new jose.SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .sign(privateKey);
}

// Send to APNs
async function sendToAPNs(token: string, title: string, body: string, data?: Record<string, unknown>): Promise<boolean> {
  try {
    const jwt = await generateAPNsJWT();
    const bundleId = 'app.lovable.94df7a7687ec45218c7386e5aa46d211';

    const payload = {
      aps: {
        alert: { title, body },
        sound: 'default',
      },
      route: data?.route || '/home',
      data: data || {},
    };

    const response = await fetch(`https://api.push.apple.com/3/device/${token}`, {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${jwt}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('APNs error:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('APNs request failed:', error);
    return false;
  }
}

// Send to FCM (Android)
async function sendToFCM(token: string, title: string, body: string, data?: Record<string, unknown>): Promise<boolean> {
  const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
  if (!fcmServerKey) return false;

  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmServerKey}`,
      },
      body: JSON.stringify({
        to: token,
        notification: { title, body, sound: 'default' },
        data: { ...data, route: data?.route || '/home' },
      }),
    });

    if (!response.ok) return false;
    const result = await response.json();
    return result.success === 1;
  } catch {
    return false;
  }
}

async function sendNotification(token: string, title: string, body: string, data?: Record<string, unknown>): Promise<boolean> {
  const isAPNsToken = /^[a-f0-9]{64}$/i.test(token);
  return isAPNsToken 
    ? await sendToAPNs(token, title, body, data)
    : await sendToFCM(token, title, body, data);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const job: NotificationJob = await req.json();
    console.log('Processing scheduled notification job:', job.type);

    let usersToNotify: any[] = [];

    if (job.type === 'daily_reminder') {
      // Get users with daily reminders enabled who haven't completed today's lesson
      const today = new Date().toISOString().split('T')[0];
      
      const { data: users } = await supabase
        .from('profiles')
        .select(`
          id,
          push_token,
          notification_preferences
        `)
        .not('push_token', 'is', null);

      // Filter by preference and check if they haven't completed today
      for (const user of users || []) {
        const prefs = user.notification_preferences || {};
        if (prefs.dailyReminder === false) continue;

        // Check if user completed lesson today
        const { data: completion } = await supabase
          .from('daily_completions')
          .select('id')
          .eq('user_id', user.id)
          .eq('completion_date', today)
          .eq('lesson_completed', true)
          .single();

        if (!completion) {
          usersToNotify.push(user);
        }
      }
    } else if (job.type === 'streak_warning') {
      // Get users whose streak expires in the next 6 hours
      const sixHoursFromNow = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      const { data: atRiskUsers } = await supabase
        .from('user_progress')
        .select(`
          user_id,
          current_streak,
          streak_expires_at,
          profiles!inner(push_token, notification_preferences)
        `)
        .gt('current_streak', 1)
        .gt('streak_expires_at', now)
        .lt('streak_expires_at', sixHoursFromNow);

      usersToNotify = (atRiskUsers || [])
        .filter(u => {
          const prefs = (u.profiles as any)?.notification_preferences || {};
          return prefs.streakReminders !== false && (u.profiles as any)?.push_token;
        })
        .map(u => ({
          id: u.user_id,
          push_token: (u.profiles as any).push_token,
          streak: u.current_streak,
        }));
    } else if (job.type === 're_engagement') {
      // Get users inactive for 3+ days
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

      const { data: inactiveUsers } = await supabase
        .from('user_progress')
        .select(`
          user_id,
          last_activity_at,
          profiles!inner(push_token, notification_preferences)
        `)
        .lt('last_activity_at', threeDaysAgo);

      usersToNotify = (inactiveUsers || [])
        .filter(u => {
          const prefs = (u.profiles as any)?.notification_preferences || {};
          return prefs.dailyReminder !== false && (u.profiles as any)?.push_token;
        })
        .map(u => ({
          id: u.user_id,
          push_token: (u.profiles as any).push_token,
        }));
    } else if (job.type === 'news_update') {
      // Send to users grouped by their selected_market so each gets their own market's news
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, push_token, notification_preferences, selected_market')
        .not('push_token', 'is', null)
        .not('selected_market', 'is', null);

      // Build per-market notification queue
      const marketUserMap: Record<string, { id: string; push_token: string; market: string }[]> = {};
      for (const u of allUsers || []) {
        const prefs = (u.notification_preferences as any) || {};
        if (prefs.newsAlerts === false || !u.push_token || !u.selected_market) continue;
        const m = u.selected_market as string;
        if (!marketUserMap[m]) marketUserMap[m] = [];
        marketUserMap[m].push({ id: u.id, push_token: u.push_token, market: m });
      }

      // Check which markets actually have fresh news today, then enqueue users
      const today = new Date().toISOString().split('T')[0];
      for (const [marketId, users] of Object.entries(marketUserMap)) {
        const { data: latestNews } = await supabase
          .from('news_items')
          .select('title')
          .eq('market_id', marketId)
          .gte('published_at', today)
          .limit(1)
          .single();

        if (latestNews) {
          for (const u of users) {
            usersToNotify.push({ ...u, latestHeadline: latestNews.title });
          }
        }
      }
    } else if (job.type === 'weekly_recap') {
      // Send weekly recap every Sunday — summarise week's XP + lessons
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: activeUsers } = await supabase
        .from('profiles')
        .select('id, push_token, notification_preferences, selected_market')
        .not('push_token', 'is', null);

      for (const u of activeUsers || []) {
        const prefs = (u.notification_preferences as any) || {};
        if (prefs.dailyReminder === false || !u.push_token || !u.selected_market) continue;

        // Aggregate weekly XP
        const { data: weekTxns } = await supabase
          .from('xp_transactions')
          .select('xp_amount')
          .eq('user_id', u.id)
          .eq('market_id', u.selected_market)
          .gte('created_at', sevenDaysAgo);

        const weeklyXP = (weekTxns || []).reduce((sum: number, t: any) => sum + t.xp_amount, 0);
        if (weeklyXP === 0) continue;

        // Count completed lessons
        const { count: lessonCount } = await supabase
          .from('daily_completions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', u.id)
          .eq('market_id', u.selected_market)
          .eq('lesson_completed', true)
          .gte('completion_date', sevenDaysAgo.split('T')[0]);

        usersToNotify.push({
          id: u.id,
          push_token: u.push_token,
          weeklyXP,
          lessonsCompleted: lessonCount || 0,
        });
      }
    }

    console.log(`Found ${usersToNotify.length} users to notify for ${job.type}`);

    let successCount = 0;
    let failCount = 0;

    for (const user of usersToNotify) {
      if (!user.push_token) continue;

      const template = getRandomTemplate(job.type);

      // For news_update, personalise body with the actual headline if available
      let notifTitle = template.title;
      let notifBody = template.body;
      if (job.type === 'news_update' && user.latestHeadline) {
        const marketLabel = user.market
          ? user.market.charAt(0).toUpperCase() + user.market.slice(1)
          : 'Your industry';
        notifTitle = `📰 ${marketLabel} Intel just dropped!`;
        notifBody = user.latestHeadline.length > 80
          ? user.latestHeadline.substring(0, 80) + '…'
          : user.latestHeadline;
      }

      const success = await sendNotification(
        user.push_token,
        notifTitle,
        notifBody,
        { 
          route: '/home', 
          type: job.type,
          streak: user.streak,
          market: user.market,
        }
      );

      if (success) successCount++;
      else failCount++;

      // Rate limiting - small delay between sends
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`Notification job complete: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        type: job.type,
        sent: successCount,
        failed: failCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scheduled notification error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
