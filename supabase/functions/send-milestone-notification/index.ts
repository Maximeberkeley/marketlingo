import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts';

// Send milestone/achievement notifications to specific users

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MilestonePayload {
  userId: string;
  milestoneType: 'streak' | 'level' | 'achievement' | 'certificate' | 'week_complete' | 'leaderboard_overtaken' | 'weekly_recap';
  milestoneData?: {
    streakDays?: number;
    levelNumber?: number;
    achievementName?: string;
    weekNumber?: number;
    overtakenBy?: string;
    weeklyXP?: number;
    lessonsCompleted?: number;
  };
}

const MILESTONE_TEMPLATES = {
  streak: [
    { title: "🔥 {days}-Day Streak!", body: "You're on fire! Keep the momentum going." },
    { title: "🦁 {days} days strong!", body: "Leo is impressed. That's some serious dedication!" },
  ],
  level: [
    { title: "⬆️ Level {level} Reached!", body: "Your industry knowledge is growing. Nice work!" },
    { title: "🎯 Level Up!", body: "You've reached Level {level}. The next challenge awaits!" },
  ],
  achievement: [
    { title: "🏆 Achievement Unlocked!", body: "You earned: {name}. Check it out!" },
    { title: "⭐ New Badge!", body: "{name} is now yours. Well deserved!" },
  ],
  certificate: [
    { title: "📜 Certified!", body: "You've earned your Investment Lab certificate. Share it!" },
    { title: "🎓 Certification Complete!", body: "You're now investment-ready. Congrats!" },
  ],
  week_complete: [
    { title: "📚 Week {week} Complete!", body: "Another week of growth. See your summary." },
    { title: "🦁 Weekly Milestone!", body: "Week {week} done! Leo's proud of your progress." },
  ],
  leaderboard_overtaken: [
    { title: "⚔️ You've been overtaken!", body: "{name} just passed you on the leaderboard. Time to reclaim your spot!" },
    { title: "🏆 Leaderboard alert!", body: "Someone just surpassed your XP. Study today to stay ahead!" },
  ],
  weekly_recap: [
    { title: "📊 Your Weekly Recap is ready!", body: "You earned {xp} XP and completed {lessons} lessons this week." },
    { title: "🦁 Leo's weekly report!", body: "{xp} XP earned this week. Let's aim higher next week!" },
  ],
};

function formatTemplate(template: { title: string; body: string }, data?: Record<string, any>): { title: string; body: string } {
  let title = template.title;
  let body = template.body;
  
  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      title = title.replace(`{${key}}`, String(value));
      body = body.replace(`{${key}}`, String(value));
    });
  }
  
  return { title, body };
}

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

async function sendToAPNs(token: string, title: string, body: string, data?: Record<string, unknown>): Promise<boolean> {
  try {
    const jwt = await generateAPNsJWT();
    const bundleId = 'app.lovable.94df7a7687ec45218c7386e5aa46d211';

    const response = await fetch(`https://api.push.apple.com/3/device/${token}`, {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${jwt}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aps: { alert: { title, body }, sound: 'default' },
        route: data?.route || '/achievements',
        data: data || {},
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('APNs error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Verify the token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: MilestonePayload = await req.json();
    console.log('Sending milestone notification:', payload);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's push token
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token, notification_preferences')
      .eq('id', payload.userId)
      .single();

    if (!profile?.push_token) {
      return new Response(
        JSON.stringify({ success: true, sent: false, reason: 'No push token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check preferences
    const prefs = profile.notification_preferences || {};
    if (prefs.dailyReminder === false && prefs.streakReminders === false) {
      return new Response(
        JSON.stringify({ success: true, sent: false, reason: 'Notifications disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get template
    const templates = MILESTONE_TEMPLATES[payload.milestoneType];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Format with milestone data
    const formattedData: Record<string, any> = {};
    if (payload.milestoneData) {
      if (payload.milestoneData.streakDays) formattedData.days = payload.milestoneData.streakDays;
      if (payload.milestoneData.levelNumber) formattedData.level = payload.milestoneData.levelNumber;
      if (payload.milestoneData.achievementName) formattedData.name = payload.milestoneData.achievementName;
      if (payload.milestoneData.weekNumber) formattedData.week = payload.milestoneData.weekNumber;
      if (payload.milestoneData.overtakenBy) formattedData.name = payload.milestoneData.overtakenBy;
      if (payload.milestoneData.weeklyXP) formattedData.xp = payload.milestoneData.weeklyXP;
      if (payload.milestoneData.lessonsCompleted) formattedData.lessons = payload.milestoneData.lessonsCompleted;
    }
    
    const { title, body } = formatTemplate(template, formattedData);

    // Send notification
    const success = await sendToAPNs(profile.push_token, title, body, {
      route: payload.milestoneType === 'certificate' ? '/investment-lab/certificate' : '/achievements',
      type: payload.milestoneType,
      ...payload.milestoneData,
    });

    return new Response(
      JSON.stringify({ success: true, sent: success }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Milestone notification error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
