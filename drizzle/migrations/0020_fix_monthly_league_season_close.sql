-- Monthly league: close each season exactly once and use one tie-break everywhere.

-- Display order matches the final season ranking (XP desc, then user id for a stable tie-break).
CREATE OR REPLACE FUNCTION public.get_monthly_standings(p_market_id text, p_season_start date)
 RETURNS TABLE(user_id uuid, username text, display_name text, avatar_url text, monthly_xp integer, current_level integer, current_streak integer, last_activity_at timestamp with time zone, tier text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    ux.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    COALESCE(period.monthly_xp, 0)::integer,
    COALESCE(ux.current_level, 1)::integer,
    COALESCE(up.current_streak, 0)::integer,
    up.last_activity_at,
    COALESCE(lm.tier, 'bronze')::text
  FROM public.user_xp ux
  JOIN public.profiles p ON p.id = ux.user_id
  LEFT JOIN public.user_progress up
    ON up.user_id = ux.user_id
   AND up.market_id = ux.market_id
  LEFT JOIN public.league_memberships lm
    ON lm.user_id = ux.user_id
   AND lm.market_id = ux.market_id
   AND lm.week_of = date_trunc('month', p_season_start)::date
  LEFT JOIN LATERAL (
    SELECT SUM(xt.xp_amount)::integer AS monthly_xp
    FROM public.xp_transactions xt
    WHERE xt.user_id = ux.user_id
      AND xt.market_id = ux.market_id
      AND xt.created_at >= date_trunc('month', p_season_start)::date::timestamptz
      AND xt.created_at < (date_trunc('month', p_season_start)::date + interval '1 month')::timestamptz
  ) period ON true
  WHERE auth.uid() IS NOT NULL
    AND ux.market_id = p_market_id
  ORDER BY COALESCE(period.monthly_xp, 0) DESC, ux.user_id;
$function$;

-- The season is judged once: rows already stamped (result set) are never re-judged,
-- so the weekly safety run can no longer shuffle final ranks mid-month.
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
           user_id,
           ROW_NUMBER() OVER (PARTITION BY market_id, tier ORDER BY weekly_xp DESC, user_id ASC) AS rnk,
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
   WHERE lm.id = r.id
     AND lm.result IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.run_league_rollover() IS 'Stamps the previous monthly season exactly once; repeat runs are no-ops. Tie-break matches get_monthly_standings.';