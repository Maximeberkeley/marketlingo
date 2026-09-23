CREATE OR REPLACE FUNCTION public.current_league_season_start()
RETURNS date
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT date_trunc('month', CURRENT_DATE)::date
$$;

COMMENT ON FUNCTION public.current_league_season_start() IS 'Returns the first local calendar date of the current monthly league season.';

CREATE OR REPLACE FUNCTION public.sync_my_league(p_market_id text)
RETURNS public.league_memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_season date := public.current_league_season_start();
  v_xp integer;
  v_tier text;
  v_row public.league_memberships;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT COALESCE(SUM(xp_amount), 0) INTO v_xp
  FROM public.xp_transactions
  WHERE user_id = v_user
    AND market_id = p_market_id
    AND created_at >= v_season::timestamptz
    AND created_at < (v_season + interval '1 month')::timestamptz;

  SELECT tier INTO v_tier
  FROM public.league_memberships
  WHERE user_id = v_user AND market_id = p_market_id AND week_of = v_season;

  IF v_tier IS NULL THEN
    SELECT CASE
             WHEN result = 'promoted' THEN public.next_league_tier(tier, 1)
             WHEN result = 'demoted' THEN public.next_league_tier(tier, -1)
             ELSE tier
           END
      INTO v_tier
    FROM public.league_memberships
    WHERE user_id = v_user AND market_id = p_market_id AND week_of < v_season
    ORDER BY week_of DESC LIMIT 1;
  END IF;

  INSERT INTO public.league_memberships (user_id, market_id, week_of, tier, weekly_xp)
  VALUES (v_user, p_market_id, v_season, COALESCE(v_tier, 'bronze'), v_xp)
  ON CONFLICT (user_id, market_id, week_of)
  DO UPDATE SET weekly_xp = EXCLUDED.weekly_xp, updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.run_league_rollover()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season date := (date_trunc('month', CURRENT_DATE) - interval '1 month')::date;
  v_count integer := 0;
BEGIN
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY market_id, tier ORDER BY weekly_xp DESC, updated_at ASC) AS rnk,
           COUNT(*) OVER (PARTITION BY market_id, tier) AS group_size,
           tier,
           weekly_xp
    FROM public.league_memberships
    WHERE week_of = v_season
  )
  UPDATE public.league_memberships lm
     SET final_rank = r.rnk,
         result = CASE
           WHEN r.weekly_xp <= 0 THEN 'demoted'
           WHEN r.rnk <= GREATEST(1, CEIL(r.group_size * 0.3)) AND r.tier <> 'diamond' THEN 'promoted'
           WHEN r.group_size >= 5 AND r.rnk > r.group_size - FLOOR(r.group_size * 0.2) THEN 'demoted'
           ELSE 'held'
         END,
         updated_at = now()
    FROM ranked r
   WHERE lm.id = r.id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON COLUMN public.league_memberships.week_of IS 'Monthly season start date. Legacy column name retained for compatibility.';
COMMENT ON COLUMN public.league_memberships.weekly_xp IS 'XP earned during the monthly season. Legacy column name retained for compatibility.';