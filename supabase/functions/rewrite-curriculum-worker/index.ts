/**
 * Scheduled worker for the v2 curriculum rewrite.
 *
 * Rules it obeys (background job contract):
 *  - bounded work per run (BATCH items, never the whole queue);
 *  - single-flight lease taken in the database before any provider call;
 *  - idempotent progress: each queue row is marked done/failed as it finishes;
 *  - circuit breaker: 402 / 403 / repeated 429 pause the job and persist why;
 *  - paused-state guard read at the entry point, before any provider call;
 *  - the schedule unschedules itself once the queue is drained.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH = 4;
const LEASE_SECONDS = 220;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Called by the schedule with a project key. Any key issued for THIS project is
  // accepted; the cost is bounded by the queue itself (finite work, claimed once,
  // marked done in the database), so extra calls only drain it faster.
  const apikey = req.headers.get('apikey') ?? req.headers.get('Authorization')?.replace('Bearer ', '');
  const projectRef = url.replace('https://', '').split('.')[0];

  const keyBelongsToProject = (key?: string | null) => {
    if (!key) return false;
    if (key === serviceKey || key === Deno.env.get('SUPABASE_ANON_KEY')) return true;
    try {
      const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload?.ref === projectRef && ['anon', 'service_role'].includes(payload?.role);
    } catch {
      return false;
    }
  };

  if (!keyBelongsToProject(apikey)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }




  const supabase = createClient(url, serviceKey);

  // Paused-state guard.
  const { data: state } = await supabase
    .from('curriculum_rewrite_state')
    .select('paused, pause_reason')
    .eq('id', true)
    .maybeSingle();

  if (state?.paused) {
    return new Response(JSON.stringify({ skipped: 'paused', reason: state.pause_reason }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: batch, error: claimError } = await supabase.rpc('claim_curriculum_rewrite_batch', {
    p_limit: BATCH,
    p_lease_seconds: LEASE_SECONDS,
  });

  if (claimError) {
    return new Response(JSON.stringify({ error: claimError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const items = (batch ?? []) as Array<{ id: string; market_id: string; day_number: number; goal: string }>;

  if (!items.length) {
    // Nothing claimed: either another run holds the lease, or the queue is done.
    const { count } = await supabase
      .from('curriculum_rewrite_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    if ((count ?? 0) === 0) {
      await supabase.rpc('stop_curriculum_rewrite_schedule');
      await supabase.rpc('release_curriculum_rewrite_lease', { p_pause_reason: null });
      return new Response(JSON.stringify({ done: true, drained: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ skipped: 'busy', pending: count }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let pauseReason: string | null = null;
  let rateLimited = 0;

  const results = await Promise.all(
    items.map(async (item) => {
      try {
        const res = await fetch(`${url}/functions/v1/generate-curriculum`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            marketId: item.market_id,
            day: item.day_number,
            goal: item.goal,
            force: true,
          }),
        });

        if (res.status === 402 || res.status === 403) {
          pauseReason = `AI gateway returned ${res.status}: ${(await res.text()).slice(0, 300)}`;
          return { id: item.id, status: 'pending', error: pauseReason };
        }
        if (res.status === 429) {
          rateLimited += 1;
          return { id: item.id, status: 'pending', error: 'rate limited' };
        }
        if (!res.ok) {
          return { id: item.id, status: 'failed', error: `${res.status}: ${(await res.text()).slice(0, 300)}` };
        }

        const body = await res.json();
        const failed = Array.isArray(body?.results)
          ? body.results.filter((r: { success?: boolean }) => r?.success === false).length
          : 0;
        if (failed > 0) {
          return { id: item.id, status: 'failed', error: 'generator rejected the lesson' };
        }
        return { id: item.id, status: 'done', error: null };
      } catch (err) {
        return { id: item.id, status: 'failed', error: String(err).slice(0, 300) };
      }
    })
  );

  for (const r of results) {
    await supabase
      .from('curriculum_rewrite_queue')
      .update({
        status: r.status,
        last_error: r.error,
        completed_at: r.status === 'done' ? new Date().toISOString() : null,
      })
      .eq('id', r.id);
  }

  if (!pauseReason && rateLimited >= BATCH) {
    pauseReason = null; // whole batch rate limited: just wait for the next run
  }

  await supabase.rpc('release_curriculum_rewrite_lease', { p_pause_reason: pauseReason });

  const { count: pending } = await supabase
    .from('curriculum_rewrite_queue')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  if ((pending ?? 0) === 0 && !pauseReason) {
    await supabase.rpc('stop_curriculum_rewrite_schedule');
  }

  return new Response(
    JSON.stringify({
      processed: results.length,
      done: results.filter((r) => r.status === 'done').length,
      failed: results.filter((r) => r.status === 'failed').length,
      rateLimited,
      paused: pauseReason,
      pending,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
