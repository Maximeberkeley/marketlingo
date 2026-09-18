CREATE OR REPLACE VIEW public.leaderboard_period_xp AS
SELECT
  user_id,
  market_id,
  SUM(CASE WHEN created_at >= now() - interval '7 days' THEN xp_amount ELSE 0 END)::int AS weekly_xp,
  SUM(CASE WHEN created_at >= now() - interval '30 days' THEN xp_amount ELSE 0 END)::int AS monthly_xp
FROM public.xp_transactions
WHERE created_at >= now() - interval '30 days'
GROUP BY user_id, market_id;

GRANT SELECT ON public.leaderboard_period_xp TO authenticated;
GRANT SELECT ON public.leaderboard_period_xp TO service_role;