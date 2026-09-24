CREATE OR REPLACE FUNCTION public.get_monthly_standings(
  p_market_id text,
  p_season_start date
)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  monthly_xp integer,
  current_level integer,
  current_streak integer,
  last_activity_at timestamptz,
  tier text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
  ORDER BY COALESCE(period.monthly_xp, 0) DESC, up.last_activity_at DESC NULLS LAST, ux.user_id;
$$;

REVOKE ALL ON FUNCTION public.get_monthly_standings(text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_monthly_standings(text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_standings(text, date) TO service_role;

CREATE OR REPLACE FUNCTION public.search_public_profiles(p_query text)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.id <> auth.uid()
    AND length(trim(COALESCE(p_query, ''))) >= 2
    AND (
      p.username ILIKE '%' || trim(p_query) || '%'
      OR p.display_name ILIKE '%' || trim(p_query) || '%'
    )
  ORDER BY CASE WHEN lower(COALESCE(p.display_name, p.username, '')) = lower(trim(p_query)) THEN 0 ELSE 1 END,
           COALESCE(p.display_name, p.username, '')
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.search_public_profiles(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_profiles(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_public_profiles(text) TO service_role;