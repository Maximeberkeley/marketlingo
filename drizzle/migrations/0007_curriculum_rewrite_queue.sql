-- Durable queue for the v2 curriculum rewrite: one row per (market, day, goal).
CREATE TABLE IF NOT EXISTS public.curriculum_rewrite_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id text NOT NULL,
  day_number integer NOT NULL,
  goal text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (market_id, day_number, goal)
);

GRANT SELECT ON public.curriculum_rewrite_queue TO authenticated;
GRANT ALL ON public.curriculum_rewrite_queue TO service_role;
ALTER TABLE public.curriculum_rewrite_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read the rewrite queue"
  ON public.curriculum_rewrite_queue FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS curriculum_rewrite_queue_pending_idx
  ON public.curriculum_rewrite_queue (status, market_id, day_number);

CREATE TRIGGER curriculum_rewrite_queue_set_updated_at
  BEFORE UPDATE ON public.curriculum_rewrite_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Single-flight lease + circuit breaker state for the worker.
CREATE TABLE IF NOT EXISTS public.curriculum_rewrite_state (
  id boolean PRIMARY KEY DEFAULT true,
  paused boolean NOT NULL DEFAULT false,
  pause_reason text,
  lease_until timestamptz,
  last_run_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT curriculum_rewrite_state_single CHECK (id)
);

GRANT SELECT ON public.curriculum_rewrite_state TO authenticated;
GRANT ALL ON public.curriculum_rewrite_state TO service_role;
ALTER TABLE public.curriculum_rewrite_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read the rewrite state"
  ON public.curriculum_rewrite_state FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Acquire the lease and claim a bounded batch. Returns nothing when the job is
-- paused, another run holds the lease, or there is no work left.
CREATE OR REPLACE FUNCTION public.claim_curriculum_rewrite_batch(p_limit integer DEFAULT 5, p_lease_seconds integer DEFAULT 180)
RETURNS SETOF public.curriculum_rewrite_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ok boolean;
BEGIN
  INSERT INTO curriculum_rewrite_state (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

  UPDATE curriculum_rewrite_state
     SET lease_until = now() + make_interval(secs => GREATEST(30, p_lease_seconds)),
         last_run_at = now(),
         updated_at = now()
   WHERE id
     AND NOT paused
     AND (lease_until IS NULL OR lease_until < now())
  RETURNING true INTO v_ok;

  IF NOT COALESCE(v_ok, false) THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE curriculum_rewrite_queue q
     SET status = 'running', attempts = q.attempts + 1, claimed_at = now()
   WHERE q.id IN (
     SELECT id FROM curriculum_rewrite_queue
      WHERE status = 'pending' AND attempts < 3
      ORDER BY day_number, market_id, goal
      LIMIT GREATEST(1, LEAST(10, p_limit))
      FOR UPDATE SKIP LOCKED
   )
  RETURNING q.*;
END;
$function$;

-- Release the lease so the next scheduled run can start immediately.
CREATE OR REPLACE FUNCTION public.release_curriculum_rewrite_lease(p_pause_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE curriculum_rewrite_state
     SET lease_until = NULL,
         paused = COALESCE(p_pause_reason IS NOT NULL, false) OR paused,
         pause_reason = COALESCE(p_pause_reason, pause_reason),
         updated_at = now()
   WHERE id;
END;
$function$;

-- Stop the schedule once the queue is drained (no permanent sweeper).
CREATE OR REPLACE FUNCTION public.stop_curriculum_rewrite_schedule()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'curriculum-rewrite-worker') THEN
    PERFORM cron.unschedule('curriculum-rewrite-worker');
    RETURN true;
  END IF;
  RETURN false;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.claim_curriculum_rewrite_batch(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_curriculum_rewrite_lease(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.stop_curriculum_rewrite_schedule() TO service_role;
