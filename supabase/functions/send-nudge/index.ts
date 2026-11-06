import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendNotification } from '../_shared/push.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BODIES = [
  "Leo saved you a seat. Today's lesson takes 5 minutes.",
  'Your streak is waiting. 5 minutes keeps it alive.',
  "Quick one? Today's lesson is ready.",
];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function localDate(tz?: string | null): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const authClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsError } = await authClient.auth.getClaims(
      authHeader.replace('Bearer ', ''),
    );
    if (claimsError || !claims?.claims?.sub) return json({ error: 'Unauthorized' }, 401);
    const senderId = claims.claims.sub as string;

    let friendId: unknown;
    try {
      friendId = (await req.json())?.friendId;
    } catch {
      return json({ error: 'Invalid body' }, 400);
    }
    if (typeof friendId !== 'string' || !UUID.test(friendId) || friendId === senderId) {
      return json({ error: 'friendId must be a valid friend id' }, 400);
    }

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: friendship } = await admin
      .from('friendships')
      .select('id')
      .eq('status', 'accepted')
      .or(`and(user_id.eq.${senderId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${senderId})`)
      .maybeSingle();
    if (!friendship) return json({ error: 'Not friends' }, 403);

    const [{ data: sender }, { data: receiver }] = await Promise.all([
      admin.from('profiles').select('display_name').eq('id', senderId).maybeSingle(),
      admin.from('profiles').select('push_token, notification_preferences, timezone').eq('id', friendId).maybeSingle(),
    ]);

    // One nudge per sender→receiver per receiver-local day.
    const { error: insertError } = await admin
      .from('friend_nudges')
      .insert({ sender_id: senderId, receiver_id: friendId, created_on: localDate(receiver?.timezone) });
    if (insertError) {
      if (insertError.code === '23505') return json({ status: 'already' });
      console.error('Nudge insert failed', insertError);
      return json({ error: 'Could not save nudge' }, 500);
    }

    const prefs = (receiver?.notification_preferences ?? {}) as Record<string, unknown>;
    if (!receiver?.push_token || prefs.friends === false) return json({ status: 'saved' });

    // Display name only — never an email or username.
    const name = sender?.display_name?.trim() || 'A friend';
    const body = BODIES[Math.floor(Math.random() * BODIES.length)];
    const ok = await sendNotification(receiver.push_token, `${name} nudged you`, body, {
      type: 'nudge',
      route: '/(tabs)/home',
    });
    return json({ status: ok ? 'sent' : 'saved' });
  } catch (error) {
    console.error('send-nudge failed', error);
    return json({ error: 'Unexpected error' }, 500);
  }
});
