CREATE OR REPLACE FUNCTION public.sync_my_monthly_league(p_market_id text, p_season_start date)
RETURNS public.league_memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_season date := date_trunc('month', p_season_start)::date;
  v_row public.league_memberships;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  INSERT INTO public.league_memberships (user_id, market_id, week_of, tier, weekly_xp)
  SELECT
    lx.user_id,
    p_market_id,
    v_season,
    COALESCE(previous.next_tier, 'bronze'),
    COALESCE(period.month_xp, 0)::integer
  FROM public.leaderboard_xp lx
  LEFT JOIN LATERAL (
    SELECT SUM(xt.xp_amount)::integer AS month_xp
    FROM public.xp_transactions xt
    WHERE xt.user_id = lx.user_id
      AND xt.market_id = p_market_id
      AND xt.created_at >= v_season::timestamptz
      AND xt.created_at < (v_season + interval '1 month')::timestamptz
  ) period ON true
  LEFT JOIN LATERAL (
    SELECT CASE
             WHEN lm.result = 'promoted' THEN public.next_league_tier(lm.tier, 1)
             WHEN lm.result = 'demoted' THEN public.next_league_tier(lm.tier, -1)
             ELSE lm.tier
           END AS next_tier
    FROM public.league_memberships lm
    WHERE lm.user_id = lx.user_id
      AND lm.market_id = p_market_id
      AND lm.week_of < v_season
    ORDER BY lm.week_of DESC
    LIMIT 1
  ) previous ON true
  WHERE lx.market_id = p_market_id
  ON CONFLICT (user_id, market_id, week_of)
  DO UPDATE SET weekly_xp = EXCLUDED.weekly_xp, updated_at = now();

  SELECT * INTO v_row
  FROM public.league_memberships
  WHERE user_id = v_user AND market_id = p_market_id AND week_of = v_season;

  IF v_row.id IS NULL THEN
    INSERT INTO public.league_memberships (user_id, market_id, week_of, tier, weekly_xp)
    VALUES (v_user, p_market_id, v_season, 'bronze', 0)
    ON CONFLICT (user_id, market_id, week_of)
    DO UPDATE SET updated_at = now()
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_my_monthly_league(text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_my_monthly_league(text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_my_monthly_league(text, date) TO service_role;

COMMENT ON FUNCTION public.sync_my_monthly_league(text, date) IS 'Hydrates and returns calendar-month league membership using the learner local month start.';