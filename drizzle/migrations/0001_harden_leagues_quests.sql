-- 1. Lock down direct client updates to friend_quests (progress is server-owned)
DROP POLICY IF EXISTS "Partner can accept or decline" ON public.friend_quests;
REVOKE UPDATE ON public.friend_quests FROM authenticated;

CREATE OR REPLACE FUNCTION public.respond_friend_quest(p_quest_id uuid, p_accept boolean)
RETURNS public.friend_quests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.friend_quests;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  UPDATE friend_quests
     SET status = CASE WHEN p_accept THEN 'active' ELSE 'declined' END,
         updated_at = now()
   WHERE id = p_quest_id
     AND partner_id = v_user
     AND status = 'pending'
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN RAISE EXCEPTION 'Quest not found or not pending'; END IF;
  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_friend_quest(uuid, boolean) TO authenticated;

-- 2. True tier size so promotion / relegation zones stay correct beyond 30 rows
CREATE OR REPLACE FUNCTION public.league_group_size(p_market_id text, p_tier text)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::integer
  FROM league_memberships
  WHERE market_id = p_market_id
    AND tier = p_tier
    AND week_of = public.current_week_start()
$$;

GRANT EXECUTE ON FUNCTION public.league_group_size(text, text) TO authenticated;

-- 3. Weekly rollover every Monday 00:10 UTC
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('league-weekly-rollover')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'league-weekly-rollover');
    PERFORM cron.schedule('league-weekly-rollover', '10 0 * * 1', 'SELECT public.run_league_rollover();');
  END IF;
END
$cron$;
