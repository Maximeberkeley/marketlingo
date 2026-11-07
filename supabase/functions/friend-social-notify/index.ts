import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendNotification } from '../_shared/push.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS = ['streak_invite', 'streak_accepted', 'race_challenge', 'race_accepted'] as const;
type Kind = typeof KINDS[number];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Push for friend streaks and races. The app calls this right after the RPC
 * that created or accepted the streak or race succeeds. It checks the caller's
 * role on that row before notifying the other person:
 *  - streak_invite:   caller invited, still pending     → notify the friend
 *  - streak_accepted: caller accepted, now active       → notify the inviter
 *  - race_challenge:  caller challenged, still pending  → notify the opponent
 *  - race_accepted:   caller accepted, now active       → notify the challenger
 * Each push goes out at most once per streak or race and kind.
 */
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
    const callerId = claims.claims.sub as string;

    let body: { kind?: unknown; id?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid body' }, 400);
    }
    const kind = body?.kind as Kind;
    const id = body?.id;
    if (!KINDS.includes(kind)) return json({ error: 'Invalid kind' }, 400);
    if (typeof id !== 'string' || !UUID.test(id)) return json({ error: 'id must be a valid id' }, 400);

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    let receiverId: string;
    if (kind === 'streak_invite' || kind === 'streak_accepted') {
      const { data: row } = await admin
        .from('friend_streaks')
        .select('user_a, user_b, invited_by, status')
        .eq('id', id)
        .maybeSingle();
      if (!row) return json({ error: 'Not found' }, 404);
      if (row.user_a !== callerId && row.user_b !== callerId) return json({ error: 'Forbidden' }, 403);
      const other = row.user_a === callerId ? row.user_b : row.user_a;
      if (kind === 'streak_invite') {
        if (row.invited_by !== callerId || row.status !== 'pending') return json({ error: 'Forbidden' }, 403);
      } else if (row.invited_by === callerId || row.status !== 'active') {
        return json({ error: 'Forbidden' }, 403);
      }
      receiverId = other;
    } else {
      const { data: row } = await admin
        .from('friend_races')
        .select('challenger, opponent, status')
        .eq('id', id)
        .maybeSingle();
      if (!row) return json({ error: 'Not found' }, 404);
      if (kind === 'race_challenge') {
        if (row.challenger !== callerId || row.status !== 'pending') return json({ error: 'Forbidden' }, 403);
        receiverId = row.opponent;
      } else {
        if (row.opponent !== callerId || row.status !== 'active') return json({ error: 'Forbidden' }, 403);
        receiverId = row.challenger;
      }
    }

    const { error: recordError } = await admin
      .from('friend_social_notifications')
      .insert({ subject_id: id, kind, sent_by: callerId });
    if (recordError) {
      if (recordError.code === '23505') return json({ status: 'already' });
      console.error('Notification record failed', recordError);
      return json({ error: 'Could not record notification' }, 500);
    }

    const [{ data: caller }, { data: receiver }] = await Promise.all([
      admin.from('profiles').select('display_name').eq('id', callerId).maybeSingle(),
      admin.from('profiles').select('push_token, notification_preferences').eq('id', receiverId).maybeSingle(),
    ]);
    const prefs = (receiver?.notification_preferences ?? {}) as Record<string, unknown>;
    if (!receiver?.push_token || prefs.friends === false) return json({ status: 'saved' });

    // Display name only — never an email or username.
    const name = caller?.display_name?.trim() || 'A friend';
    const copy: Record<Kind, [string, string]> = {
      streak_invite: [`${name} wants a friend streak with you`, 'Study on the same days and grow a flame together. Tap to accept.'],
      streak_accepted: [`${name} accepted your friend streak`, 'Do a lesson today, both of you, to light it.'],
      race_challenge: [`${name} challenged you to a 7-day race`, 'Most XP in 7 days wins +100 XP. Tap to accept.'],
      race_accepted: [`${name} accepted your race`, 'The 7 days start now. Go get that XP.'],
    };
    const [title, text] = copy[kind];
    const ok = await sendNotification(receiver.push_token, title, text, { type: kind, route: '/friends' });
    return json({ status: ok ? 'sent' : 'saved' });
  } catch (error) {
    console.error('friend-social-notify failed', error);
    return json({ error: 'Unexpected error' }, 500);
  }
});
