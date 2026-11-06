import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendNotification } from '../_shared/push.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Push for friend requests. The client writes the friendship row (RLS-guarded);
 * this only notifies the other person, after checking the caller's role in it.
 *  - kind 'request':  caller sent a pending request  → notify the recipient
 *  - kind 'accepted': caller accepted a request       → notify the sender
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

    let body: { friendshipId?: unknown; kind?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid body' }, 400);
    }
    const { friendshipId, kind } = body ?? {};
    if (typeof friendshipId !== 'string' || !UUID.test(friendshipId)) {
      return json({ error: 'friendshipId must be a valid id' }, 400);
    }
    if (kind !== 'request' && kind !== 'accepted' && kind !== 'invite') return json({ error: 'Invalid kind' }, 400);

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: row } = await admin
      .from('friendships')
      .select('user_id, friend_id, status, created_at')
      .eq('id', friendshipId)
      .maybeSingle();
    if (!row) return json({ error: 'Not found' }, 404);

    let receiverId: string;
    if (kind === 'request') {
      if (row.user_id !== callerId || row.status !== 'pending') return json({ error: 'Forbidden' }, 403);
      receiverId = row.friend_id;
    } else if (kind === 'invite') {
      // Caller joined from an invite: notify the other person in the friendship.
      if (row.status !== 'accepted' || (row.user_id !== callerId && row.friend_id !== callerId)) {
        return json({ error: 'Forbidden' }, 403);
      }
      if (Date.now() - new Date(row.created_at).getTime() > 10 * 60 * 1000) {
        return json({ error: 'Invite window expired' }, 403);
      }
      receiverId = row.user_id === callerId ? row.friend_id : row.user_id;
    } else {
      if (row.friend_id !== callerId || row.status !== 'accepted') return json({ error: 'Forbidden' }, 403);
      receiverId = row.user_id;
    }

    // Each push goes out at most once per friendship and kind.
    const { error: recordError } = await admin
      .from('friendship_notifications')
      .insert({ friendship_id: friendshipId, kind, sent_by: callerId });
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
    const name = caller?.display_name?.trim() || 'Someone';
    const title = kind === 'request'
      ? `${name} wants to be friends on MarketLingo`
      : kind === 'invite'
        ? `${name} joined MarketLingo from your invite 🎉`
        : `${name} accepted. You're racing this month.`;
    const body = kind === 'request' ? 'Tap to accept or decline.' : 'See where you stand.';
    const ok = await sendNotification(receiver.push_token, title, body, {
      type: kind === 'request' ? 'friend_request' : kind === 'invite' ? 'friend_invite' : 'friend_accepted',
      route: '/friends',
    });
    return json({ status: ok ? 'sent' : 'saved' });
  } catch (error) {
    console.error('friend-request-notify failed', error);
    return json({ error: 'Unexpected error' }, 500);
  }
});
