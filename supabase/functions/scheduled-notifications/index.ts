import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts';

// Scheduled notification sender for:
// - Daily lesson reminders (Duolingo-style guilt trips)
// - Streak warnings (about to expire)
// - Re-engagement (inactive users)
// - Milestone celebrations
// - Industry Intel (news updates)
// - Practice nudges (drills & trainer)
// - Investment Lab nudges
// - Weekly recaps

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationJob {
  type: 'daily_reminder' | 'streak_warning' | 're_engagement' | 'milestone' | 'news_update' | 'weekly_recap' | 'practice_nudge' | 'lab_nudge';
}

// ============================================
// DUOLINGO-STYLE NOTIFICATION TEMPLATES
// Funny, guilt-trippy, personality-driven
// ============================================
const NOTIFICATION_TEMPLATES = {
  daily_reminder: [
    // Classic guilt trips
    { title: "🦁 Leo noticed you haven't studied today", body: "I'm not mad, just disappointed. 5 minutes?" },
    { title: "🦁 Leo is staring at you", body: "...waiting for you to open the app. No pressure." },
    { title: "🦁 Your competitors are learning right now", body: "Just saying. Your daily lesson is ready." },
    { title: "🦁 Leo made you a lesson", body: "It took me all day. Please don't ignore it. 🥺" },
    { title: "🦁 Knock knock", body: "It's Leo. With your daily lesson. Let me in." },
    { title: "🦁 This is your sign", body: "The universe wants you to do your lesson. (It's me. I'm the universe.)" },
    { title: "🦁 Fun fact:", body: "People who skip lessons turn into pumpkins. Don't risk it." },
    { title: "🦁 Leo's getting lonely", body: "Your lesson has been sitting here for hours. It's starting to cry." },
    // Motivational
    { title: "🦁 5 minutes → smarter you", body: "That's a better ROI than most hedge funds. Let's go!" },
    { title: "🔥 Markets moved today", body: "Your daily brief is ready. Stay ahead of the curve." },
    { title: "🦁 Good morning, future CEO", body: "Today's lesson is fresh. Let's make you dangerous." },
    { title: "🦁 Your brain called", body: "It wants more knowledge. Who are we to deny it?" },
  ],
  streak_warning: [
    { title: "🔥 YOUR STREAK. IT'S DYING.", body: "Quick, do a lesson before it flatlines! 💀" },
    { title: "⚠️ Leo is performing CPR on your streak", body: "Help me out here. One lesson. That's all." },
    { title: "🦁 Your streak is hanging by a thread", body: "Don't make Leo watch it fall. Save it now!" },
    { title: "🔥 Streak emergency!", body: "Your {streak}-day streak expires soon. Don't let it end like this!" },
    { title: "🦁 Leo can't watch", body: "Your streak is about to disappear. I'm covering my eyes. 🙈" },
    { title: "⏰ Time's running out!", body: "Your streak needs you. Be the hero it deserves." },
    { title: "🦁 This is not a drill", body: "Well, actually it could be. Do a drill. Save your streak." },
  ],
  re_engagement: [
    { title: "🦁 Leo here. Remember me?", body: "I've been watering your lesson garden alone. It's lonely." },
    { title: "🦁 It's been {days} days...", body: "Not that I'm counting. (I'm absolutely counting.)" },
    { title: "👀 Leo spotted you online", body: "You have time for memes but not for me? Okay. Cool. Fine." },
    { title: "🦁 Your knowledge is getting dusty", body: "Let's blow the cobwebs off with a quick session." },
    { title: "🦁 We need to talk", body: "About your absence. I've prepared a 5-minute intervention." },
    { title: "📉 While you were away...", body: "Markets moved. New lessons dropped. Come see what you missed!" },
    { title: "🦁 Plot twist:", body: "You come back and finish what you started. 5 mins?" },
  ],
  milestone: [
    { title: "🎉 Achievement Unlocked!", body: "You've hit a new milestone. Come see what you've earned!" },
    { title: "🏆 Leo is doing a victory dance", body: "You earned it. Check your new achievement!" },
    { title: "⭐ Level up, legend!", body: "You've reached a new level. The next challenge awaits!" },
    { title: "🦁 Leo is SO proud right now", body: "Like, embarrassingly proud. Come see your achievement!" },
  ],
  news_update: [
    { title: "📰 Industry Intel just dropped!", body: "Fresh market insights are ready. Stay ahead of the curve." },
    { title: "⚡ Breaking: New market moves", body: "Today's top stories in your industry. Tap to read." },
    { title: "🦁 Leo's news roundup!", body: "I curated today's top headlines. Worth a quick look!" },
    { title: "🗞️ Your industry had a day", body: "Big moves. Big news. Tap to see what happened." },
    { title: "📰 Leo's morning brief", body: "Coffee + headlines = unstoppable. Let's go." },
  ],
  practice_nudge: [
    { title: "🎯 Time to sharpen those skills!", body: "Quick drills are waiting. 3 minutes to level up." },
    { title: "🦁 Leo prepared a quiz for you", body: "No grades, just glory. Ready to test yourself?" },
    { title: "🧠 Your brain called again", body: "It wants a workout. Try today's practice drills!" },
    { title: "⚔️ Challenge mode: activated", body: "Think you're smart? Prove it with a quick drill session." },
    { title: "🦁 Pop quiz!", body: "Just kidding. But also not. Drills are ready when you are." },
    { title: "🎮 Game time!", body: "Market scenarios are loaded. Can you beat your high score?" },
    { title: "🦁 Leo vs. You", body: "I bet you can't get 100% on today's drills. Prove me wrong." },
  ],
  lab_nudge: [
    { title: "🔬 The Investment Lab awaits", body: "Real scenarios. Real decisions. No real money at risk." },
    { title: "🦁 Wanna play investor?", body: "New investment scenarios are ready. Build your thesis!" },
    { title: "📊 Paper trading time!", body: "Practice making million-dollar decisions. Zero risk." },
    { title: "🦁 Think like a VC", body: "Your Investment Lab has fresh scenarios. Ready to analyze?" },
    { title: "💡 New investment case study", body: "Can you spot the winner? Head to the Investment Lab." },
    { title: "🦁 Leo's investor challenge", body: "I found a tricky scenario. Think you can crack it?" },
  ],
  weekly_recap: [
    { title: "📊 Your weekly recap is ready!", body: "See what you conquered this week. Spoiler: a lot." },
    { title: "🦁 Leo's weekly report card", body: "Here's your progress snapshot. Let's keep the momentum!" },
    { title: "🏆 Week in review", body: "Check your stats, streaks, and XP. You might surprise yourself." },
    { title: "🦁 Sunday stats!", body: "Leo crunched the numbers. Your week was 🔥" },
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

// Personalize template — replace {streak}, {days}, etc.
function personalize(text: string, vars: Record<string, string | number | undefined>): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
  }
  return result;
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
        .select('id, push_token, notification_preferences')
        .not('push_token', 'is', null);

      for (const user of users || []) {
        const prefs = user.notification_preferences || {};
        if (prefs.dailyReminder === false) continue;

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
        .map(u => {
          const daysAway = Math.floor((Date.now() - new Date((u as any).last_activity_at).getTime()) / (24 * 60 * 60 * 1000));
          return {
            id: u.user_id,
            push_token: (u.profiles as any).push_token,
            days: daysAway,
          };
        });
    } else if (job.type === 'practice_nudge') {
      // Nudge users who haven't done drills/trainer today
      const today = new Date().toISOString().split('T')[0];

      const { data: users } = await supabase
        .from('profiles')
        .select('id, push_token, notification_preferences, selected_market')
        .not('push_token', 'is', null);

      for (const user of users || []) {
        const prefs = (user.notification_preferences as any) || {};
        if (prefs.dailyReminder === false || !user.push_token) continue;

        // Check if user has done drills today
        const { data: todayDrills } = await supabase
          .from('daily_completions')
          .select('drills_completed, games_completed')
          .eq('user_id', user.id)
          .eq('completion_date', today)
          .single();

        const drillsDone = todayDrills?.drills_completed || 0;
        const gamesDone = todayDrills?.games_completed || 0;

        // Nudge if they did their lesson but haven't practiced
        if (drillsDone === 0 && gamesDone === 0) {
          usersToNotify.push(user);
        }
      }
    } else if (job.type === 'lab_nudge') {
      // Nudge users who haven't visited Investment Lab recently
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

      const { data: users } = await supabase
        .from('profiles')
        .select('id, push_token, notification_preferences, selected_market')
        .not('push_token', 'is', null);

      for (const user of users || []) {
        const prefs = (user.notification_preferences as any) || {};
        if (prefs.dailyReminder === false || !user.push_token || !user.selected_market) continue;

        // Check last investment attempt
        const { data: lastAttempt } = await supabase
          .from('investment_attempts')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const lastActivity = lastAttempt?.created_at;
        if (!lastActivity || new Date(lastActivity) < new Date(threeDaysAgo)) {
          usersToNotify.push(user);
        }
      }
    } else if (job.type === 'news_update') {
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, push_token, notification_preferences, selected_market')
        .not('push_token', 'is', null)
        .not('selected_market', 'is', null);

      const marketUserMap: Record<string, { id: string; push_token: string; market: string }[]> = {};
      for (const u of allUsers || []) {
        const prefs = (u.notification_preferences as any) || {};
        if (prefs.newsAlerts === false || !u.push_token || !u.selected_market) continue;
        const m = u.selected_market as string;
        if (!marketUserMap[m]) marketUserMap[m] = [];
        marketUserMap[m].push({ id: u.id, push_token: u.push_token, market: m });
      }

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
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: activeUsers } = await supabase
        .from('profiles')
        .select('id, push_token, notification_preferences, selected_market')
        .not('push_token', 'is', null);

      for (const u of activeUsers || []) {
        const prefs = (u.notification_preferences as any) || {};
        if (prefs.dailyReminder === false || !u.push_token || !u.selected_market) continue;

        const { data: weekTxns } = await supabase
          .from('xp_transactions')
          .select('xp_amount')
          .eq('user_id', u.id)
          .eq('market_id', u.selected_market)
          .gte('created_at', sevenDaysAgo);

        const weeklyXP = (weekTxns || []).reduce((sum: number, t: any) => sum + t.xp_amount, 0);
        if (weeklyXP === 0) continue;

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

      // Personalize templates with user data
      let notifTitle = personalize(template.title, { streak: user.streak, days: user.days });
      let notifBody = personalize(template.body, { streak: user.streak, days: user.days });

      // Override for weekly_recap with actual stats
      if (job.type === 'weekly_recap' && user.weeklyXP) {
        notifTitle = `📊 Your Weekly Recap`;
        notifBody = `You earned ${user.weeklyXP} XP and completed ${user.lessonsCompleted || 0} lessons this week! 🔥`;
      }

      // Override for news_update with actual headline
      if (job.type === 'news_update' && user.latestHeadline) {
        const marketLabel = user.market
          ? user.market.charAt(0).toUpperCase() + user.market.slice(1)
          : 'Your industry';
        notifTitle = `📰 ${marketLabel} Intel just dropped!`;
        notifBody = user.latestHeadline.length > 80
          ? user.latestHeadline.substring(0, 80) + '…'
          : user.latestHeadline;
      }

      // Route based on notification type
      let route = '/home';
      if (job.type === 'practice_nudge') route = '/drills';
      else if (job.type === 'lab_nudge') route = '/investment-lab';
      else if (job.type === 'news_update') route = '/home';

      const success = await sendNotification(
        user.push_token,
        notifTitle,
        notifBody,
        { 
          route,
          type: job.type,
          streak: user.streak,
          market: user.market,
        }
      );

      if (success) successCount++;
      else failCount++;

      // Rate limiting
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
