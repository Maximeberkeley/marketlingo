CREATE UNIQUE INDEX IF NOT EXISTS xp_transactions_one_demo_reward_per_user
ON public.xp_transactions (user_id)
WHERE source_type = 'demo_bridge';

CREATE OR REPLACE FUNCTION public.claim_demo_onboarding_reward(p_market_id text, p_today date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_reward constant integer := 20;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  INSERT INTO public.user_xp (user_id, market_id, total_xp, current_level, xp_to_next_level, startup_stage)
  VALUES (v_user, p_market_id, 0, 1, 100, 1)
  ON CONFLICT (user_id, market_id) DO NOTHING;

  INSERT INTO public.xp_transactions (user_id, market_id, xp_amount, source_type, description)
  VALUES (v_user, p_market_id, v_reward, 'demo_bridge', 'Universal AI demo starting reward')
  ON CONFLICT (user_id) WHERE source_type = 'demo_bridge' DO NOTHING;

  IF NOT FOUND THEN RETURN 0; END IF;

  PERFORM public.increment_user_xp(v_user, p_market_id, v_reward);

  INSERT INTO public.daily_completions (
    user_id, market_id, completion_date, lesson_completed, demo_completed, xp_earned
  ) VALUES (
    v_user, p_market_id, p_today, false, true, v_reward
  )
  ON CONFLICT (user_id, market_id, completion_date) DO UPDATE
  SET demo_completed = true,
      xp_earned = public.daily_completions.xp_earned + v_reward;

  UPDATE public.profiles
  SET demo_onboarding_status = 'completed', updated_at = now()
  WHERE id = v_user;

  PERFORM public.sync_local_streak(p_market_id, p_today);
  RETURN v_reward;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_demo_onboarding_reward(text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_demo_onboarding_reward(text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_demo_onboarding_reward(text, date) TO service_role;